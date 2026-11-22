<script module>
	import { GCODE_STORAGE_KEY } from '#lib/design/effects/gcodeState.svelte.js';

	/** Lines streamed per second into the G-code panel. */
	const LINES_PER_SECOND = 60;

	// Runs while the prerendered page parses, before first paint:
	// - html[data-js] tells CSS that scripts run, so entrance effects that hide
	//   server-rendered content until hydration (the hero ornament) apply only
	//   then; without JS the page shows its static final state;
	// - a visitor who left the G-code view on sees it from first paint instead
	//   of flipping at hydration.
	const restoreScript =
		"<script>document.documentElement.dataset.js='';try{if(localStorage.getItem(" +
		JSON.stringify(GCODE_STORAGE_KEY) +
		")==='on')document.documentElement.dataset.gcode='on'}catch(e){}</scr" +
		'ipt>';
</script>

<script>
	import { onMount, tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { generateGcode } from '#lib/design/effects/gcode.js';
	import { collectBlocks } from '#lib/design/effects/gcodeDom.js';
	import { gcode, readStoredGcode, setGcode } from '#lib/design/effects/gcodeState.svelte.js';
	import { attachPrintReveal } from '#lib/design/effects/printReveal.js';
	import { attachNozzleCursor } from '#lib/design/effects/nozzleCursor.js';

	/** @type {HTMLPreElement | undefined} */
	let stream = $state();
	let total = $state(0);
	let shown = $state(0);
	let layers = $state(0);
	let blocks = $state(0);
	let filament = $state(0);
	/** Bumped on every client-side navigation so the panel regenerates. */
	let pageView = $state(0);

	/** @type {import('#lib/design/effects/printReveal.js').PrintReveal | undefined} */
	let reveal;

	onMount(() => {
		gcode.on = readStoredGcode();
		gcode.ready = true;
		reveal = attachPrintReveal();
		const detachNozzle = attachNozzleCursor();
		return () => {
			reveal?.destroy();
			detachNozzle();
			gcode.ready = false;
			// Leaving for /retro (or unmounting): drop the attribute, keep the preference.
			delete document.documentElement.dataset.gcode;
		};
	});

	afterNavigate((navigation) => {
		if (navigation.type === 'enter') return;
		reveal?.scan();
		pageView += 1;
	});

	$effect(() => {
		const root = document.documentElement;
		if (gcode.on) root.dataset.gcode = 'on';
		else delete root.dataset.gcode;
	});

	// Generate from the live layout and stream it into the panel.
	$effect(() => {
		if (!gcode.on || !stream) return;
		void pageView;
		const output = stream;
		let frame = 0;
		let cancelled = false;

		tick().then(() => {
			frame = requestAnimationFrame(() => {
				if (cancelled) return;
				const main = document.querySelector('main');
				const result = generateGcode({
					title: document.title,
					blocks: main ? collectBlocks(main) : []
				});
				total = result.lines.length;
				layers = result.layers;
				blocks = result.blocks;
				filament = result.filament;
				shown = 0;
				output.textContent = '';
				const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
				if (reduce) {
					append(output, result.lines);
					shown = total;
					output.scrollTop = 0;
					return;
				}
				const start = performance.now();
				/** @param {number} now */
				const step = (now) => {
					if (cancelled) return;
					const target = Math.min(total, Math.floor(((now - start) / 1000) * LINES_PER_SECOND) + 1);
					if (target > shown) {
						// Follow the stream only while the reader is at the bottom.
						const pinned = output.scrollHeight - output.scrollTop - output.clientHeight < 32;
						append(output, result.lines.slice(shown, target));
						shown = target;
						if (pinned) output.scrollTop = output.scrollHeight;
					}
					if (shown < total) frame = requestAnimationFrame(step);
				};
				frame = requestAnimationFrame(step);
			});
		});

		return () => {
			cancelled = true;
			cancelAnimationFrame(frame);
		};
	});

	/**
	 * @param {HTMLElement} output
	 * @param {string[]} lines
	 */
	function append(output, lines) {
		const fragment = document.createDocumentFragment();
		for (const line of lines) {
			const span = document.createElement('span');
			span.className = line.startsWith(';')
				? 'c'
				: line.startsWith('G0')
					? 't'
					: line.startsWith('G1')
						? 'e'
						: 'm';
			span.textContent = `${line}\n`;
			fragment.append(span);
		}
		output.append(fragment);
	}

	/** @param {EventTarget | null} target */
	function isTyping(target) {
		if (!(target instanceof HTMLElement)) return false;
		return (
			target.isContentEditable || !!target.closest('input, textarea, select, [contenteditable]')
		);
	}

	/** @param {KeyboardEvent} event */
	function onKeydown(event) {
		if (event.defaultPrevented || event.isComposing || !gcode.ready) return;
		if (event.key === 'Escape' && gcode.on) {
			// The knowledge graph uses Escape to clear its own selection, from inside
			// the graph or from <body>. Its window listener may run before or after
			// this one (it depends on how the page was reached), so defer by state:
			// while a node is selected (its detail panel is open), Escape is the graph's.
			const target = event.target instanceof Element ? event.target : null;
			if (isTyping(target) || target?.closest('.graph')) return;
			if (target === document.body && document.querySelector('.graph .stage.has-panel')) return;
			close();
			return;
		}
		// Alt+G (Option+G on a Mac). A modifier is required so a single printable
		// key, or a speech-input word containing "g", can never switch the page
		// (WCAG 2.1.4). `code`, not `key`: Option+G types "©" on macOS.
		if (event.code !== 'KeyG' || !event.altKey || event.repeat) return;
		if (event.ctrlKey || event.metaKey || event.shiftKey) return;
		if (isTyping(event.target)) return;
		event.preventDefault();
		if (gcode.on) close();
		else setGcode(true);
	}

	function close() {
		const hadFocus = !!document.activeElement?.closest('.gcode-panel');
		setGcode(false);
		if (!hadFocus) return;
		// Focus would fall to <body>; land on the footer toggle if it is on screen, else main.
		tick().then(() => {
			const toggle = document.getElementById('gcode-toggle');
			const box = toggle?.getBoundingClientRect();
			const visible = !!box && box.top >= 0 && box.bottom <= window.innerHeight;
			(visible ? toggle : document.getElementById('main'))?.focus({ preventScroll: true });
		});
	}
</script>

<svelte:head>{@html restoreScript}</svelte:head>

<svelte:window onkeydown={onKeydown} />

<p class="visually-hidden" role="status" aria-live="polite">{gcode.status}</p>

{#if gcode.on}
	<div class="gcode-panel" role="region" aria-label="G-code" data-gcode-skip>
		<header class="shell gcode-head">
			<p class="gcode-title">
				<span class="gcode-name">G-code</span>
				<span class="gcode-meta"
					>Portfolio slicer preview · {layers}
					{layers === 1 ? 'layer' : 'layers'} · {blocks}
					{blocks === 1 ? 'block' : 'blocks'} · {(filament / 1000).toFixed(2)} m filament</span
				>
			</p>
			<p class="gcode-progress" aria-hidden="true">
				{shown}/{total}
			</p>
			<button
				type="button"
				class="gcode-close"
				aria-label="Exit G-code view"
				title="Exit G-code view (Esc)"
				onclick={close}
				><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"
					><path d="M4 4l8 8M12 4l-8 8" /></svg
				></button
			>
		</header>
		<!-- Scrollable, so keyboard-focusable; not live, to keep the stream quiet. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<pre
			bind:this={stream}
			aria-live="off"
			class="shell gcode-stream"
			tabindex="0"
			aria-label="Generated G-code"></pre>
	</div>
{/if}

<style>
	.gcode-panel {
		position: fixed;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 60;
		display: flex;
		flex-direction: column;
		height: var(--gcode-panel-h);
		border-top: 1px dashed color-mix(in srgb, var(--accent) 70%, transparent);
		background: var(--color-bg-sunken);
		box-shadow: var(--shadow-panel);
		color: var(--color-text);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		contain: strict;
	}
	.gcode-head {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding-block: var(--space-2);
		border-bottom: 1px solid var(--color-border);
	}
	.gcode-title {
		display: flex;
		flex: 1;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0 var(--space-3);
		min-width: 0;
		margin: 0;
		line-height: 1.5;
	}
	.gcode-name {
		color: var(--accent);
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
	}
	.gcode-meta,
	.gcode-progress {
		color: var(--color-text-muted);
	}
	.gcode-progress {
		margin: 0;
		font-variant-numeric: tabular-nums;
	}
	.gcode-close {
		display: inline-grid;
		flex: none;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		margin-right: calc(-1 * var(--space-2));
		padding: 0;
		border: 0;
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--color-text);
		cursor: pointer;
	}
	.gcode-close:hover {
		color: var(--color-heading);
		background: var(--color-bg-elevated);
	}
	.gcode-close:focus-visible {
		outline-offset: -2px;
	}
	.gcode-close svg {
		width: 1rem;
		height: 1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linecap: round;
	}
	.gcode-stream {
		flex: 1;
		min-height: 0;
		margin-block: 0;
		padding-block: var(--space-2) var(--space-3);
		overflow: auto;
		overscroll-behavior: contain;
		color: var(--color-text);
		font: inherit;
		line-height: 1.6;
		white-space: pre;
	}
	.gcode-stream:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	/* Comments muted, travel moves dimmer text, extrusions in the accent. All
	   clear 4.5:1 on --color-bg-sunken. */
	.gcode-stream :global(.c) {
		color: var(--color-text-muted);
	}
	.gcode-stream :global(.t) {
		color: var(--color-text);
	}
	.gcode-stream :global(.e) {
		color: var(--accent-coral-soft);
	}
	.gcode-stream :global(.m) {
		color: var(--color-heading);
	}
	@media (max-width: 600px) {
		.gcode-meta {
			display: none;
		}
	}
</style>
