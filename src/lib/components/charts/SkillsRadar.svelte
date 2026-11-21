<script>
	import { SvelteSet } from 'svelte/reactivity';
	import {
		RADAR_RADIUS,
		LABEL_FONT,
		pointAt,
		polygonPoints,
		radarLayout,
		valuePoint,
		wedgePath
	} from './radar.js';

	/**
	 * @typedef {import('$lib/content/cv.js').SkillRadar} SkillRadar
	 */

	/** @type {{ radar: SkillRadar, title?: string }} */
	let { radar, title = 'Experience and interest by area' } = $props();

	const uid = $props.id();
	const captionId = `${uid}-caption`;

	const RINGS = [20, 40, 60, 80, 100];
	/** Series drawing order: the larger Interest shape first, Experience on top. */
	const DRAW_ORDER = ['interest', 'experience'];

	let count = $derived(radar.axes.length);
	let layout = $derived(radarLayout(radar.axes));
	let viewBox = $derived(
		`${layout.viewBox.x} ${layout.viewBox.y} ${layout.viewBox.width} ${layout.viewBox.height}`
	);
	let drawn = $derived(
		[...radar.series].sort((a, b) => DRAW_ORDER.indexOf(a.id) - DRAW_ORDER.indexOf(b.id))
	);

	const hidden = new SvelteSet();
	/** Axis under the pointer, if any. */
	let hovered = $state(/** @type {number | null} */ (null));
	/** Axis holding keyboard focus, if any. */
	let focused = $state(/** @type {number | null} */ (null));
	/** The one axis in the tab order (roving tabindex). */
	let roving = $state(0);
	let active = $derived(hovered ?? focused);

	/** @type {SVGGElement[]} */
	const axisTargets = [];

	/** @param {string} id */
	function toggle(id) {
		if (hidden.has(id)) hidden.delete(id);
		else hidden.add(id);
	}

	/** @param {number} index */
	function describe(index) {
		const scores = radar.series.map((series) => `${series.label} ${series.values[index]}`);
		return `${radar.axes[index]}: ${scores.join(', ')} out of ${radar.max}`;
	}

	/**
	 * Arrow keys move between axes; Home/End jump to the first and last.
	 * @param {KeyboardEvent} event
	 * @param {number} index
	 */
	function onAxisKeydown(event, index) {
		/** @type {number | undefined} */
		let next;
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % count;
		else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
			next = (index - 1 + count) % count;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = count - 1;
		if (next === undefined) return;
		event.preventDefault();
		roving = next;
		axisTargets[next]?.focus();
	}

	/** @param {number} index */
	function onAxisFocus(index) {
		roving = index;
		focused = index;
	}

	/** @param {number} index */
	function marker(index) {
		return pointAt(index, count, RADAR_RADIUS);
	}
</script>

<figure class="radar">
	<figcaption id={captionId}>
		<strong>{title}</strong>
		<span>Self-assessed, 0–{radar.max}. Higher is further from the centre.</span>
	</figcaption>

	<div class="legend" role="group" aria-label="Show or hide a series">
		{#each radar.series as series (series.id)}
			<button
				type="button"
				class="toggle series-{series.id}"
				aria-pressed={!hidden.has(series.id)}
				onclick={() => toggle(series.id)}
			>
				<svg class="swatch" viewBox="0 0 16 16" aria-hidden="true">
					{#if series.id === 'interest'}
						<rect x="3.5" y="3.5" width="9" height="9" />
					{:else}
						<circle cx="8" cy="8" r="5" />
					{/if}
				</svg>
				{series.label}
			</button>
		{/each}
	</div>

	<svg
		class="chart"
		{viewBox}
		role="group"
		aria-labelledby={captionId}
		style:--label-size="{LABEL_FONT}px"
		onpointerleave={() => (hovered = null)}
	>
		<g class="grid" aria-hidden="true">
			{#each RINGS as ring (ring)}
				<circle r={(ring / radar.max) * RADAR_RADIUS} />
			{/each}
			{#each radar.axes as axis, index (axis)}
				{@const end = marker(index)}
				<line class="spoke" class:active={active === index} x1="0" y1="0" x2={end.x} y2={end.y} />
			{/each}
			{#each RINGS as ring (ring)}
				{@const tick = pointAt(0.5, count, (ring / radar.max) * RADAR_RADIUS)}
				<text class="tick" x={tick.x + 3} y={tick.y + 4}>{ring}</text>
			{/each}
		</g>

		<g aria-hidden="true">
			{#each drawn as series (series.id)}
				<g class="series series-{series.id}" class:off={hidden.has(series.id)}>
					<polygon points={polygonPoints(series.values, radar.max)} />
					{#each series.values as value, index (index)}
						{@const p = valuePoint(index, count, value, radar.max)}
						{#if series.id === 'interest'}
							<rect
								class="vertex"
								class:active={active === index}
								x={p.x - 3}
								y={p.y - 3}
								width="6"
								height="6"
							/>
						{:else}
							<circle class="vertex" class:active={active === index} cx={p.x} cy={p.y} r="3.4" />
						{/if}
					{/each}
				</g>
			{/each}
		</g>

		<g class="labels" aria-hidden="true">
			{#each layout.labels as label, index (label.text)}
				<text class:active={active === index} x={label.x} text-anchor={label.anchor}>
					{#each label.lines as line (line.text)}
						<tspan x={label.x} y={line.y}>{line.text}</tspan>
					{/each}
				</text>
			{/each}
		</g>

		<g class="targets">
			{#each radar.axes as axis, index (axis)}
				<!-- A focusable data point (roving tabindex): keyboard users get the same
				     readout as pointer hover; it has no action, so it is not a button. -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
				<g
					bind:this={axisTargets[index]}
					class="target"
					role="img"
					tabindex={roving === index ? 0 : -1}
					aria-label={describe(index)}
					onpointerenter={() => (hovered = index)}
					onclick={() => (focused = index)}
					onfocus={() => onAxisFocus(index)}
					onblur={() => (focused = null)}
					onkeydown={(event) => onAxisKeydown(event, index)}
				>
					<path d={wedgePath(index, count, RADAR_RADIUS + 8)} />
				</g>
			{/each}
		</g>
	</svg>

	<p class="readout" aria-hidden="true">
		{#if active === null}
			<span class="hint">Hover, tap, or focus an area to compare both scores.</span>
		{:else}
			<b>{radar.axes[active]}</b>
			{#each radar.series as series (series.id)}
				<span class="value series-{series.id}" class:off={hidden.has(series.id)}>
					{series.label} <strong>{series.values[active]}</strong>
				</span>
			{/each}
		{/if}
	</p>

	<details class="data">
		<summary>Show as table</summary>
		<div class="table-wrap">
			<table>
				<caption class="visually-hidden">{title}, self-assessed 0–{radar.max}</caption>
				<thead>
					<tr>
						<th scope="col">Area</th>
						{#each radar.series as series (series.id)}<th scope="col">{series.label}</th>{/each}
					</tr>
				</thead>
				<tbody>
					{#each radar.axes as axis, index (axis)}
						<tr>
							<th scope="row">{axis}</th>
							{#each radar.series as series (series.id)}<td>{series.values[index]}</td>{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</details>
</figure>

<style>
	.radar {
		--series-experience: var(--graph-field);
		--series-interest: var(--graph-org);
		display: grid;
		gap: var(--space-4);
		min-width: 0;
		margin: 0;
		padding: var(--space-5);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg-raised);
	}
	figcaption {
		display: grid;
		gap: var(--space-1);
	}
	figcaption strong {
		color: var(--color-heading);
		font-size: var(--text-lg);
		font-weight: 650;
	}
	figcaption span {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	/* ---------- legend toggles */
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 2.25rem;
		padding: 0.3rem 0.8rem 0.3rem 0.6rem;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--color-text);
		font-size: var(--text-sm);
		cursor: pointer;
		transition:
			color 160ms ease,
			border-color 160ms ease;
	}
	.toggle:hover {
		border-color: var(--series);
	}
	/* Off state: line-through and an empty swatch; full-opacity muted text keeps
	   the label above 4.5:1 on the raised background. */
	.toggle[aria-pressed='false'] {
		color: var(--color-text-muted);
		text-decoration: line-through;
	}
	.swatch {
		width: 1rem;
		height: 1rem;
		fill: color-mix(in srgb, var(--series) 35%, transparent);
		stroke: var(--series);
		stroke-width: 1.6;
	}
	.toggle[aria-pressed='false'] .swatch {
		fill: none;
	}
	.series-experience {
		--series: var(--series-experience);
	}
	.series-interest {
		--series: var(--series-interest);
	}

	/* ---------- chart */
	.chart {
		display: block;
		width: 100%;
		max-width: 28rem;
		height: auto;
		margin-inline: auto;
		overflow: visible;
		touch-action: manipulation;
	}
	.grid circle {
		fill: none;
		stroke: var(--color-border-strong);
		stroke-width: 1;
	}
	.grid circle:last-of-type {
		stroke: color-mix(in srgb, var(--color-text-muted) 60%, transparent);
	}
	.spoke {
		stroke: var(--color-border-strong);
		stroke-width: 1;
		transition: stroke 160ms ease;
	}
	.spoke.active {
		stroke: var(--color-heading);
	}
	.tick {
		fill: var(--color-text-muted);
		font: 500 11px var(--font-mono);
	}
	.series polygon {
		fill: color-mix(in srgb, var(--series) 22%, transparent);
		stroke: var(--series);
		stroke-width: 2;
		stroke-linejoin: round;
	}
	.series-interest polygon {
		stroke-dasharray: 6 4;
	}
	.series {
		transition: opacity 200ms ease;
	}
	.series.off {
		opacity: 0;
	}
	.vertex {
		fill: var(--series);
		stroke: var(--color-bg-raised);
		stroke-width: 1.5;
		transform-box: fill-box;
		transform-origin: center;
		transition: transform 160ms ease;
	}
	.vertex.active {
		transform: scale(1.6);
	}
	.labels text {
		fill: var(--color-text);
		font-family: var(--font-body);
		font-size: var(--label-size);
		font-weight: 500;
		transition: fill 160ms ease;
	}
	.labels text.active {
		fill: var(--color-heading);
		font-weight: 700;
	}
	.target {
		cursor: pointer;
		outline: none;
	}
	.target path {
		fill: transparent;
		stroke: none;
	}
	.target:hover path {
		fill: color-mix(in srgb, var(--color-heading) 4%, transparent);
	}
	.target:focus-visible path {
		fill: color-mix(in srgb, var(--accent) 10%, transparent);
		stroke: var(--accent);
		stroke-width: 1.5;
		stroke-dasharray: 3 3;
	}

	/* ---------- readout */
	.readout {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: center;
		gap: var(--space-1) var(--space-4);
		min-height: 1.6em;
		margin: 0;
		font-size: var(--text-sm);
		text-align: center;
	}
	.readout b {
		color: var(--color-heading);
	}
	.readout .hint {
		color: var(--color-text-muted);
	}
	.readout .value {
		color: var(--color-text);
	}
	.readout .value strong {
		color: var(--series);
		font-family: var(--font-mono);
	}
	/* A hidden series stays readable: muted text at full opacity, struck through. */
	.readout .value.off {
		color: var(--color-text-muted);
		text-decoration: line-through;
	}
	.readout .value.off strong {
		color: inherit;
	}

	/* ---------- table fallback */
	.data summary {
		width: fit-content;
		color: var(--link);
		font-size: var(--text-sm);
		font-weight: 650;
		cursor: pointer;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		margin-top: var(--space-3);
		border-collapse: collapse;
		font-size: var(--text-sm);
	}
	th,
	td {
		padding: 0.4rem 0.6rem;
		border-bottom: 1px solid var(--color-border);
		text-align: left;
	}
	thead th {
		color: var(--color-text-muted);
		font: 600 var(--text-xs) var(--font-mono);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	tbody th {
		color: var(--color-heading);
		font-weight: 500;
	}
	td {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 620px) {
		.radar {
			padding: var(--space-3);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.toggle,
		.spoke,
		.series,
		.vertex,
		.labels text {
			transition: none;
		}
	}
</style>
