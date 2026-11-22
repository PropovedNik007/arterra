<script>
	import { onMount } from 'svelte';
	import { layerLevels } from './geometry.js';
	import { FALLBACK_VIEWBOX, fallbackScene } from './fallback.js';

	/**
	 * Interactive sketch of what a slicer does: a generated part, cut into
	 * layers, with the toolpaths of each layer. The server renders a static
	 * isometric layer stack; three.js loads (only here, only once the section
	 * nears the viewport) and replaces it with an orbitable 3D view.
	 */

	/** @typedef {import('./geometry.js').SliceMode} SliceMode */

	const COUNTS = {
		planar: layerLevels('planar').length,
		nonplanar: layerLevels('nonplanar').length
	};

	/** static: server render or no JS; loading: fetching three.js; ready: 3D view; fallback: no WebGL. */
	let status = $state(/** @type {'static' | 'loading' | 'ready' | 'fallback'} */ ('static'));
	let mode = $state(/** @type {SliceMode} */ ('planar'));
	let layer = $state(Math.round(COUNTS.planar * 0.66));
	let playing = $state(false);
	let reduced = $state(false);

	let count = $derived(COUNTS[mode]);
	let interactive = $derived(status === 'ready' || status === 'fallback');
	let flat = $derived(fallbackScene(layer - 1));
	let modeLabel = $derived(mode === 'planar' ? 'planar' : 'non-planar');
	let viewLabel = $derived(
		`A generated vase with a twisted star-shaped section, sliced into ${count} ${modeLabel} layers. ` +
			`Layer ${layer} is highlighted: outer perimeter, inner perimeters, infill and travel moves; ` +
			'the layers below it are printed and the part above it is shown as a ghost.'
	);

	/** @type {HTMLElement | undefined} */
	let section = $state();
	/** @type {HTMLDivElement | undefined} */
	let host = $state();
	/** @type {import('./scene.js').SlicerView | null} */
	let view = $state.raw(null);
	/** @type {SliceMode} */
	let viewMode = 'planar';

	/** @param {SliceMode} next */
	function setMode(next) {
		if (next === mode) return;
		const share = layer / COUNTS[mode];
		mode = next;
		layer = Math.min(COUNTS[next], Math.max(1, Math.round(share * COUNTS[next])));
	}

	/** Cheap check before fetching three.js; context creation can still fail, see start(). */
	function webglAvailable() {
		return 'WebGLRenderingContext' in window;
	}

	/** @param {HTMLElement} element */
	function readPalette(element) {
		const style = getComputedStyle(element);
		/** @param {string} name @param {string} fallback */
		const token = (name, fallback) => {
			const value = style.getPropertyValue(name).trim();
			return /^#[0-9a-f]{3,8}$/i.test(value) ? value : fallback;
		};
		return {
			accent: token('--accent', '#e17b5a'),
			heading: token('--color-heading', '#fbf8f2'),
			text: token('--color-text', '#cbc7bd'),
			muted: token('--color-text-muted', '#8f8c84'),
			border: token('--color-border', '#31312d'),
			borderStrong: token('--color-border-strong', '#48463f'),
			background: token('--color-bg-sunken', '#10100f')
		};
	}

	onMount(() => {
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduced = motion.matches;
		playing = !reduced;
		const onMotion = () => {
			reduced = motion.matches;
			if (reduced) playing = false;
		};
		motion.addEventListener('change', onMotion);

		let cancelled = false;
		/** @type {IntersectionObserver | undefined} */
		let near;

		async function start() {
			if (!host || !section) return;
			if (!webglAvailable()) {
				status = 'fallback';
				mode = 'planar';
				return;
			}
			status = 'loading';
			try {
				const { createSlicerView } = await import('./scene.js');
				if (cancelled || !host || !section) return;
				viewMode = mode;
				view = createSlicerView({
					host,
					palette: readPalette(section),
					mode,
					layer: layer - 1,
					playing,
					// Keep the view: three.js restores its resources if the browser
					// gives the context back; until then show the static preview.
					onContextChange: (lost) => {
						status = lost ? 'fallback' : 'ready';
						if (lost) mode = 'planar';
					}
				});
				status = 'ready';
			} catch {
				if (!cancelled) {
					status = 'fallback';
					mode = 'planar';
				}
			}
		}

		if ('IntersectionObserver' in window) {
			// Fetch three.js only when the section is about to scroll into view.
			near = new IntersectionObserver(
				(entries) => {
					if (!entries.some((entry) => entry.isIntersecting)) return;
					near?.disconnect();
					start();
				},
				{ rootMargin: '600px 0px' }
			);
			if (section) near.observe(section);
		} else {
			start();
		}

		return () => {
			cancelled = true;
			near?.disconnect();
			motion.removeEventListener('change', onMotion);
			view?.destroy();
			view = null;
		};
	});

	$effect(() => {
		if (!view || mode === viewMode) return;
		viewMode = mode;
		view.setMode(mode);
	});
	$effect(() => {
		view?.setLayer(layer - 1);
	});
	$effect(() => {
		view?.setPlaying(playing);
	});
</script>

<section
	bind:this={section}
	class="mini-slicer"
	data-section="projects"
	data-status={status}
	data-motion={status === 'ready'
		? playing
			? 'running'
			: reduced
				? 'reduced'
				: 'paused'
		: 'static'}
	aria-labelledby="mini-slicer-title"
>
	<div class="section-head">
		<h2 id="mini-slicer-title">Slicing, layer by layer</h2>
		<p>A hands-on sketch of what a slicer does.</p>
	</div>
	<p class="intro">
		A slicer turns a 3D model into machine moves. It cuts the part into layers, then plans each
		layer: perimeters that trace the outline, an infill pattern inside them, and travel moves where
		the nozzle jumps without printing. Step through the layers of a generated part below.
	</p>

	<figure>
		<div class="stage">
			<div class="view" role="img" aria-label={viewLabel}>
				{#if status !== 'ready'}
					<svg
						class="flat"
						viewBox={FALLBACK_VIEWBOX}
						preserveAspectRatio="xMidYMid meet"
						focusable="false"
						aria-hidden="true"
					>
						{#each flat.below as d, index (index)}
							<path class="slice" {d} />
						{/each}
						<path class="slice current-slice" d={flat.current.outline} />
						<path class="infill" d={flat.current.infill} />
						<path class="inner" d={flat.current.inner} />
						<path class="outer" d={flat.current.outer} />
						<path class="travel" d={flat.current.travel} />
						{#if flat.current.seam}
							<circle class="nozzle" cx={flat.current.seam.x} cy={flat.current.seam.y} r="1.1" />
						{/if}
						{#each flat.above as d, index (index)}
							{#if index % 2 === 1}<path class="ghost" {d} />{/if}
						{/each}
					</svg>
				{/if}
				<div class="canvas-host" hidden={status !== 'ready'} bind:this={host}></div>
			</div>
			<p class="stage-note">
				{#if status === 'ready'}
					<span class="hint-fine">Drag to rotate.</span>
					<span class="hint-touch">Drag sideways to rotate.</span>
				{:else if status === 'fallback'}
					Static preview: this browser cannot show the 3D view, but the slider still steps through
					the planar layers.
				{:else if status === 'loading'}
					Loading the 3D view…
				{:else}
					Static preview of the sliced part. With JavaScript, an interactive 3D view loads here.
				{/if}
			</p>
		</div>

		<div class="controls">
			<div class="layer-control">
				<label for="mini-slicer-layer">Layer</label>
				<input
					id="mini-slicer-layer"
					type="range"
					min="1"
					max={count}
					step="1"
					bind:value={layer}
					disabled={!interactive}
					aria-valuetext="{layer} of {count}"
				/>
				<output for="mini-slicer-layer" aria-hidden="true">{layer} / {count}</output>
			</div>
			<div class="mode-control" role="group" aria-labelledby="mini-slicer-mode">
				<span id="mini-slicer-mode" class="control-label">Layers</span>
				<button
					type="button"
					class="button small"
					aria-pressed={mode === 'planar'}
					disabled={status !== 'ready'}
					onclick={() => setMode('planar')}>Planar</button
				>
				<button
					type="button"
					class="button small"
					aria-pressed={mode === 'nonplanar'}
					disabled={status !== 'ready'}
					onclick={() => setMode('nonplanar')}>Non-planar</button
				>
			</div>
			<button
				type="button"
				class="button small motion-toggle"
				aria-label="{playing ? 'Pause' : 'Play'} rotation and nozzle"
				disabled={status !== 'ready'}
				onclick={() => (playing = !playing)}
			>
				{playing ? 'Pause' : 'Play'}
			</button>
		</div>

		<p class="mode-note" aria-live="polite">
			{#if mode === 'planar'}
				Planar layers are flat cuts, so the domed top is printed as a stack of shrinking rings with
				visible steps.
			{:else}
				Non-planar layers bend toward the domed top, so its last layers follow the surface instead
				of stepping up it. Simplified: real multi-axis toolpaths also tilt the tool along the
				surface.
			{/if}
		</p>

		<ul class="legend" aria-label="Legend">
			<li><span class="swatch current" aria-hidden="true"></span>Current layer outline</li>
			<li><span class="swatch outer" aria-hidden="true"></span>Outer perimeter</li>
			<li><span class="swatch inner" aria-hidden="true"></span>Inner perimeters</li>
			<li><span class="swatch infill" aria-hidden="true"></span>Infill</li>
			<li><span class="swatch travel" aria-hidden="true"></span>Travel move</li>
			<li><span class="swatch dot" aria-hidden="true"></span>Nozzle at the seam</li>
		</ul>

		<figcaption>
			Simplified illustration of slicing and toolpath generation, not Flexam software.
		</figcaption>
	</figure>
</section>

<style>
	/* Rendered inside Article.svelte (its `afterBody` snippet), which sets the
	   shell width and the spacing around it. */
	.mini-slicer {
		--slicer-inner: color-mix(in srgb, var(--accent) 65%, var(--color-bg-sunken));
		--slicer-infill: color-mix(in srgb, var(--accent) 40%, var(--color-bg-sunken));
	}
	.intro {
		max-width: var(--reading-width);
		margin: 0 0 var(--space-5);
		line-height: 1.7;
	}
	figure {
		margin: 0;
	}

	.stage {
		position: relative;
		height: 420px;
		overflow: hidden;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background:
			radial-gradient(ellipse at 50% 70%, var(--color-bg-raised), transparent 70%),
			var(--color-bg-sunken);
	}
	.view,
	.canvas-host {
		position: absolute;
		inset: 0;
	}
	.canvas-host :global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
		animation: slicer-fade 500ms ease both;
	}
	@keyframes slicer-fade {
		from {
			opacity: 0;
		}
	}

	.flat {
		position: absolute;
		inset: var(--space-4) 0 var(--space-7);
		width: 100%;
		height: calc(100% - var(--space-4) - var(--space-7));
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.flat path {
		vector-effect: non-scaling-stroke;
	}
	.flat .slice {
		fill: var(--color-bg-sunken);
		stroke: color-mix(in srgb, var(--accent) 55%, var(--color-bg-sunken));
		stroke-width: 1;
	}
	.flat .current-slice {
		fill: var(--color-bg-raised);
		stroke: none;
	}
	.flat .outer {
		stroke: var(--color-heading);
		stroke-width: 1.5;
	}
	.flat .inner {
		stroke: var(--accent);
		stroke-width: 1.1;
	}
	.flat .infill {
		stroke: var(--slicer-infill);
		stroke-width: 1;
	}
	.flat .travel {
		stroke: var(--color-text);
		stroke-width: 1;
		stroke-dasharray: 3 4;
	}
	.flat .ghost {
		stroke: var(--color-text-muted);
		stroke-opacity: 0.22;
		stroke-width: 1;
	}
	.flat .nozzle {
		fill: var(--color-heading);
		stroke: var(--accent);
		stroke-width: 0.6;
	}

	.stage-note {
		position: absolute;
		bottom: var(--space-3);
		left: 50%;
		width: max-content;
		max-width: calc(100% - 2 * var(--space-4));
		margin: 0;
		padding: var(--space-1) var(--space-3);
		transform: translateX(-50%);
		border-radius: var(--radius-md);
		/* A solid backing keeps the note at AA contrast over the moving view. */
		background: color-mix(in srgb, var(--color-bg-sunken) 92%, transparent);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		line-height: 1.5;
		text-align: center;
		pointer-events: none;
	}
	.hint-touch {
		display: none;
	}
	@media (hover: none), (pointer: coarse) {
		.hint-fine {
			display: none;
		}
		.hint-touch {
			display: inline;
		}
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-4) var(--space-6);
		margin-top: var(--space-4);
	}
	.layer-control {
		display: flex;
		flex: 1 1 18rem;
		align-items: center;
		gap: var(--space-3);
	}
	label,
	.control-label {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
	}
	input[type='range'] {
		flex: 1;
		min-width: 0;
		accent-color: var(--accent);
		cursor: pointer;
	}
	input[type='range']:disabled {
		cursor: default;
		opacity: 0.6;
	}
	output {
		min-width: 4.5ch;
		color: var(--color-heading);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.mode-control {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	.mode-control .control-label {
		margin-right: var(--space-1);
	}
	/* Buttons are .button.small (app.css); here only the selected mode and
	   the disabled state while the model loads. */
	.mode-control .button[aria-pressed='true'] {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 18%, transparent);
	}
	.button:disabled {
		cursor: default;
		opacity: 0.6;
		transform: none;
	}

	.mode-note {
		max-width: var(--reading-width);
		margin: var(--space-4) 0 0;
		color: var(--color-text);
		font-size: var(--text-sm);
		line-height: 1.6;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-5);
		margin: var(--space-4) 0 0;
		padding: 0;
		color: var(--color-text);
		font-size: var(--text-sm);
		list-style: none;
	}
	.legend li {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}
	.swatch {
		display: inline-block;
		width: 1.25rem;
		height: 0;
		border-top: 2px solid var(--accent);
	}
	.swatch.current {
		border-top-color: var(--color-heading);
	}
	.swatch.inner {
		border-top-color: var(--slicer-inner);
	}
	.swatch.infill {
		border-top-color: var(--slicer-infill);
	}
	.swatch.travel {
		border-top: 2px dashed var(--color-text);
	}
	.swatch.dot {
		width: 0.6rem;
		height: 0.6rem;
		border: 0;
		border-radius: 50%;
		background: var(--color-heading);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 45%, transparent);
	}

	figcaption {
		margin-top: var(--space-4);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		line-height: 1.5;
	}

	@media (max-width: 600px) {
		.stage {
			height: 320px;
		}
		.controls {
			gap: var(--space-3) var(--space-4);
		}
		.layer-control {
			flex-basis: 100%;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.canvas-host :global(canvas) {
			animation: none;
		}
	}
</style>
