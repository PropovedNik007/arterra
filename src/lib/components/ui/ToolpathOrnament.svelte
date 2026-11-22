<script module>
	/** The hero prints once per visit; later mounts show the finished layer. */
	const session = { printed: false };
</script>

<script>
	import { onMount } from 'svelte';
	import { staticPath } from '#lib/paths.js';
	import { ORNAMENT_PRESETS, SPRITE_FILE } from '#lib/design/ornaments/presets.js';
	import { monthInk } from '#lib/design/ornaments/palette.js';

	/**
	 * Decorative Armenian ornament drawn as a slicer preview (perimeters,
	 * infill, dashed travel moves, seam dots). Fills its nearest positioned
	 * ancestor, which should also set `isolation: isolate` so the default
	 * `z-index: -1` keeps the drawing behind that ancestor's content.
	 *
	 * Static ornaments reference a precomputed, cached sprite by `preset`.
	 * Pass `toolpath` (inline data) only for the animated print.
	 *
	 * Ink (`--ornament-ink`): the section's colour inside a `[data-section]`,
	 * otherwise the hue of the month. The month is baked in when the page is
	 * prerendered and refreshed in the browser on mount, so a page built last
	 * month still shows this month's hue; only a colour changes, never layout.
	 *
	 * @type {{
	 *   preset: import('#lib/design/ornaments/presets.js').OrnamentPreset,
	 *   toolpath?: import('#lib/design/ornaments/geometry.js').Toolpath,
	 *   class?: string,
	 *   opacity?: number,
	 *   tone?: 'accent' | 'muted' | 'field' | 'topic',
	 *   animate?: boolean,
	 *   align?: 'center' | 'left' | 'right' | 'top' | 'bottom',
	 *   fit?: 'meet' | 'slice'
	 * }}
	 */
	let {
		preset,
		toolpath = undefined,
		class: className = '',
		opacity = undefined,
		tone = 'accent',
		animate = false,
		align = 'center',
		fit = 'meet'
	} = $props();

	const PRINT_SECONDS = 3.4;

	// Server: the build's month. Browser: the viewer's month, set on mount
	// (left unset while hydrating, so the prerendered value is replaced).
	/** @type {string | undefined} */
	let month = $state(typeof window === 'undefined' ? monthInk() : undefined);
	onMount(() => {
		month = monthInk();
	});

	let viewBox = $derived(toolpath?.viewBox ?? ORNAMENT_PRESETS[preset].viewBox);
	let size = $derived(viewBox.split(' ').map(Number));
	let band = $derived(size[2] > size[3] * 2);
	let href = $derived(`${staticPath(SPRITE_FILE)}#${preset}`);
	let islands = $derived.by(() => {
		if (!toolpath) return [];
		const total = toolpath.lengths.reduce((sum, length) => sum + length, 0) || 1;
		let start = 0;
		return toolpath.perimeters.map((d, index) => {
			const share = (toolpath?.lengths[index] ?? 0) / total;
			const island = { d, delay: start, share };
			start += share;
			return island;
		});
	});
	let seams = $derived(toolpath ? toolpath.seams.map((p) => `M${p.x} ${p.y}h0`).join('') : '');
	let preserve = $derived.by(() => {
		const x = align === 'left' ? 'xMin' : align === 'right' ? 'xMax' : 'xMid';
		const y = align === 'top' ? 'YMin' : align === 'bottom' ? 'YMax' : 'YMid';
		return `${x}${y} ${fit}`;
	});

	/** static: complete drawing (SSR, no JS, reduced motion, already printed); armed: waiting off-screen. */
	/** @type {'static' | 'armed' | 'printing' | 'done'} */
	let phase = $state('static');
	/** @type {HTMLDivElement | undefined} */
	let root = $state();
	/** @type {SVGAnimateMotionElement | undefined} */
	let motion = $state();

	$effect(() => {
		if (!animate || !toolpath || !root || session.printed) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (!('IntersectionObserver' in window)) return;
		phase = 'armed';
		/** @type {ReturnType<typeof setTimeout> | undefined} */
		let timer;
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer.disconnect();
				session.printed = true;
				phase = 'printing';
				timer = setTimeout(() => (phase = 'done'), (PRINT_SECONDS + 1.6) * 1000);
			},
			{ threshold: 0.2 }
		);
		observer.observe(root);
		return () => {
			observer.disconnect();
			clearTimeout(timer);
		};
	});

	// The nozzle exists only while printing; start its motion once it is in the DOM.
	$effect(() => {
		motion?.beginElement();
	});
</script>

<div
	bind:this={root}
	class="toolpath-ornament {className}"
	class:band
	class:intro={animate && toolpath && !session.printed}
	data-tone={tone}
	data-phase={phase}
	data-align={align}
	data-fit={fit}
	style:--band-ratio="{size[2]} / {size[3]}"
	style:--ornament-alpha={opacity}
	style:--ornament-month={month}
	style:--print-duration="{PRINT_SECONDS}s"
	aria-hidden="true"
>
	<svg {viewBox} preserveAspectRatio={preserve} focusable="false" aria-hidden="true">
		{#if toolpath}
			<g class="ink">
				<path class="travel" d={toolpath.travel.join('')} />
				<path class="infill" d={toolpath.infill.join('')} />
				{#each islands as island, index (index)}
					<path
						class="perimeter"
						d={island.d}
						pathLength="1"
						style:--delay={island.delay}
						style:--share={island.share}
					/>
				{/each}
				<path class="seams" d={seams} />
			</g>
			{#if phase === 'printing'}
				<g class="nozzle">
					<path class="glow" d="M0 0h0" />
					<path class="head" d="M0 0h0" />
					<animateMotion
						bind:this={motion}
						begin="indefinite"
						dur="{PRINT_SECONDS}s"
						fill="freeze"
						calcMode="paced"
						path={toolpath.outlines.join('')}
					/>
				</g>
			{/if}
		{:else}
			<use class="ink" {href} />
		{/if}
	</svg>
</div>

<style>
	.toolpath-ornament {
		/* Section ink wins; elsewhere the month's hue (palette.js). */
		--ornament-ink: var(--ornament-section, var(--ornament-month, var(--accent)));
		/* Darkened ink: mixed toward black, at a low ceiling of opacity, so
		   text over the ornament keeps its AA contrast. */
		--ink: color-mix(in srgb, var(--ornament-ink) var(--ornament-shade), #000);
		position: absolute;
		inset: 0;
		z-index: var(--ornament-z, -1);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		color: var(--ink);
		pointer-events: none;
		user-select: none;
	}
	/* Muted keeps a hint of the ink, so footer and intro bands follow it. */
	[data-tone='muted'] {
		--ink: color-mix(
			in srgb,
			color-mix(in srgb, var(--ornament-ink) 40%, var(--color-text-muted)) var(--ornament-shade),
			#000
		);
	}
	[data-tone='field'] {
		--ink: color-mix(in srgb, var(--graph-field) var(--ornament-shade), #000);
	}
	[data-tone='topic'] {
		--ink: color-mix(in srgb, var(--graph-topic) var(--ornament-shade), #000);
	}
	[data-align='left'] {
		justify-content: flex-start;
	}
	[data-align='right'] {
		justify-content: flex-end;
	}
	[data-align='top'] {
		align-items: flex-start;
	}
	[data-align='bottom'] {
		align-items: flex-end;
	}

	svg {
		display: block;
		flex: none;
		height: 100%;
		aspect-ratio: 1;
		overflow: visible;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		/* Rosettes fade only at the rim, so star points and arm tips keep
		   their silhouette. */
		-webkit-mask-image: radial-gradient(closest-side, #000 72%, rgb(0 0 0 / 0.6) 90%, transparent);
		mask-image: radial-gradient(closest-side, #000 72%, rgb(0 0 0 / 0.6) 90%, transparent);
	}
	/* Bands keep their own proportions and fade out at both ends. */
	.band svg {
		width: auto;
		max-width: 100%;
		aspect-ratio: var(--band-ratio);
		-webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
		mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
	}
	/* Slice: always span the full width; the band is generated longer than
	   its slot, so only its ends are trimmed. */
	.band[data-fit='slice'] svg {
		width: 100%;
		max-width: none;
		aspect-ratio: auto;
	}

	/* Alpha sits on the ink group, not the container, so overlapping strokes
	   do not darken each other and the nozzle can stay bright. */
	.ink {
		opacity: var(--ornament-alpha, var(--ornament-opacity));
	}
	path {
		vector-effect: non-scaling-stroke;
	}
	.perimeter {
		stroke-width: 1.1;
	}
	.infill {
		stroke-width: 0.7;
		stroke-opacity: 0.7;
	}
	.travel {
		stroke-width: 0.7;
		stroke-opacity: 0.55;
		stroke-dasharray: 3 6;
	}
	.seams {
		stroke-width: 4;
	}
	/* The print head: a bright bead with a soft halo, at full opacity. */
	.nozzle {
		color: var(--accent);
	}
	.nozzle .glow {
		stroke-width: 16;
		stroke-opacity: 0.25;
	}
	.nozzle .head {
		stroke-width: 6;
		color: var(--color-heading);
		filter: drop-shadow(0 0 4px var(--accent));
	}

	/* Hide the server-rendered drawing for a moment so the swap to the armed
	   state is not seen as a flash. Only when scripts run (html[data-js], set
	   before first paint by SiteEffects): without JS the drawing is simply
	   there, finished. */
	:global(html[data-js]) .intro[data-phase='static'] svg {
		animation: ornament-reveal 900ms ease 500ms both;
	}
	[data-phase='armed'] .perimeter,
	[data-phase='printing'] .perimeter {
		stroke-dasharray: 1 1;
		stroke-dashoffset: 1;
	}
	[data-phase='armed'] :is(.infill, .travel, .seams),
	[data-phase='printing'] :is(.infill, .travel, .seams) {
		opacity: 0;
	}
	[data-phase='printing'] .perimeter {
		animation: ornament-print calc(var(--print-duration) * var(--share)) linear
			calc(var(--print-duration) * var(--delay)) forwards;
	}
	[data-phase='printing'] .infill {
		animation: ornament-reveal 1.4s ease calc(var(--print-duration) * 0.55) forwards;
	}
	[data-phase='printing'] :is(.travel, .seams) {
		animation: ornament-reveal 0.8s ease var(--print-duration) forwards;
	}
	@keyframes ornament-print {
		to {
			stroke-dashoffset: 0;
		}
	}
	@keyframes ornament-reveal {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(html[data-js]) .intro[data-phase='static'] svg {
			animation: none;
		}
	}
</style>
