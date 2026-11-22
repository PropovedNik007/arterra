<script>
	/**
	 * WorkSankey — how the published work flows from domains to fields of work to
	 * individual projects and DIY builds. Hand-built SVG, laid out synchronously
	 * with d3-sankey so the prerendered HTML already contains the chart.
	 *
	 * Props:
	 * - graphData: GraphData — the knowledge-graph object (`#lib/graphs/graph.json`,
	 *   built by `#lib/graph/build.js`). Only domain → field and item → field edges
	 *   and project/DIY item nodes are read; sport notes are ignored.
	 * - title?: string — short name shown at the start of the figcaption.
	 *
	 * Weighting: every project counts as 1 and is split evenly over the n fields
	 * it is tagged with (1/n each), so every column sums to the number of
	 * projects. No hours or effort are implied.
	 *
	 * Layout: a wide SVG (≥ 840px container) with direct labels, and a narrow SVG
	 * that numbers the project nodes and lists them in a key below. Hover or
	 * keyboard focus on a node (hover on a ribbon) highlights its connected flows.
	 * A table fallback sits in a <details> under the chart.
	 */
	import { sitePath } from '#lib/paths.js';
	import {
		buildHighlights,
		buildSankeyData,
		layoutSankey,
		spreadLabels
	} from '#lib/charts/sankey-data.js';

	/** @type {{ graphData: import('#lib/graph/build.js').GraphData, title?: string }} */
	let { graphData, title = 'How the work flows' } = $props();

	const uid = $props.id();

	const data = $derived(buildSankeyData(graphData));
	const highlights = $derived(buildHighlights(data));

	// Height follows the project count, with a floor so every field label has a
	// line of its own even when many fields carry only a small share.
	const minHeight = $derived(data.fields.length * 22 + 40);
	const wide = $derived(
		layoutSankey(data, {
			width: 960,
			height: Math.max(320, data.total * 34, minHeight),
			nodeWidth: 12,
			nodePadding: 8,
			right: 215,
			top: 28,
			bottom: 2
		})
	);
	const narrow = $derived(
		layoutSankey(data, {
			width: 330,
			height: Math.max(300, data.total * 34, minHeight),
			nodeWidth: 10,
			nodePadding: 6,
			right: 26,
			top: 26,
			bottom: 2
		})
	);

	const fieldById = $derived(new Map(data.fields.map((field) => [field.id, field])));
	const domainById = $derived(new Map(data.domains.map((domain) => [domain.id, domain])));
	const projectById = $derived(new Map(data.projects.map((project) => [project.id, project])));
	const linkById = $derived(new Map(data.links.map((link) => [link.id, link])));
	const projectNumber = $derived(
		new Map(data.projects.map((project, index) => [project.id, index + 1]))
	);

	/** Id of the hovered/focused node or link. */
	let active = /** @type {string | null} */ ($state(null));
	const lit = $derived(active ? (highlights.get(active) ?? null) : null);

	const DIY_TAG = '· DIY';
	const SECTION_LABEL = { projects: 'Project', diy: 'DIY build' };
	const number = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
	const fmt = (/** @type {number} */ value) => number.format(value);
	/** @param {number} count @param {string} noun */
	const plural = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;
	/**
	 * "3 projects", "2 projects + 1 DIY build" or "1 DIY build": DIY builds are
	 * named apart because field links open the Projects list, which has no DIY.
	 * @param {number} count projects and DIY builds together
	 * @param {number} diy DIY builds among them
	 */
	function itemCount(count, diy) {
		if (!diy) return plural(count, 'project');
		if (diy === count) return plural(diy, 'DIY build');
		return `${plural(count - diy, 'project')} + ${plural(diy, 'DIY build')}`;
	}
	const fieldLabels = (/** @type {string[]} */ ids) =>
		ids.map((id) => fieldById.get(id)?.label ?? id).join(', ');

	/** @param {string | null} id */
	function describe(id) {
		if (!id) {
			return 'Hover or focus a domain, field or project to trace its flows. Field and project nodes open their pages.';
		}
		const domain = domainById.get(id);
		if (domain) {
			return `${domain.label}: ${plural(domain.fieldIds.length, 'field')} (${fieldLabels(domain.fieldIds)}), touched by ${itemCount(domain.projectCount, domain.diyCount)} — ${fmt(domain.value)} of ${data.total} project shares.`;
		}
		const field = fieldById.get(id);
		if (field) {
			const linkNote = field.diyCount
				? ' The link lists the projects; DIY builds are on the DIY page.'
				: '';
			return `${field.label} (${domainById.get(field.domainId)?.label}): ${itemCount(field.projectCount, field.diyCount)} — ${fmt(field.value)} of ${data.total} project shares.${linkNote}`;
		}
		const project = projectById.get(id);
		if (project) {
			const n = project.fieldIds.length;
			return `${project.label} (${SECTION_LABEL[project.section]}): ${plural(n, 'field')} — ${fieldLabels(project.fieldIds)}${n > 1 ? ` — 1/${n} each` : ''}.`;
		}
		const link = linkById.get(id);
		if (link?.kind === 'domain-field') {
			const field = fieldById.get(link.target);
			return `${domainById.get(link.source)?.label} → ${field?.label}: ${fmt(link.value)} from ${itemCount(link.projectCount, field?.diyCount ?? 0)}.`;
		}
		if (link?.kind === 'field-project') {
			const target = projectById.get(link.target);
			const n = target?.fieldIds.length ?? 1;
			return `${fieldById.get(link.source)?.label} → ${target?.label}: ${n > 1 ? `1/${n}` : 'all'} of the ${target?.section === 'diy' ? 'build' : 'project'}.`;
		}
		return '';
	}

	/** Accessible name for a node (also its hover title). */
	function nodeName(/** @type {{ id: string }} */ node) {
		return describe(node.id);
	}

	/**
	 * Pointer tracing is delegated to the SVG: whatever mark carries a data-id
	 * under the pointer becomes active; empty space clears the highlight.
	 * @param {PointerEvent} event
	 */
	function trace(event) {
		const target = /** @type {Element | null} */ (event.target);
		const mark = target?.closest?.('[data-id]');
		active = mark instanceof SVGElement ? (mark.dataset.id ?? null) : null;
	}

	/** @param {string} id */
	const enter = (id) => () => (active = id);
	/** @param {string} id */
	const leave = (id) => () => {
		if (active === id) active = null;
	};

	const HEADS = {
		wide: ['Domain', 'Field of work', 'Project'],
		narrow: ['Domain', 'Field', '#']
	};
	/**
	 * Column headings placed at each column's x position, inside the SVG.
	 * @param {import('#lib/charts/sankey-data.js').SankeyLayoutResult} layout
	 * @param {'wide' | 'narrow'} variant
	 */
	function columnHeads(layout, variant) {
		return HEADS[variant].map((text, column) => {
			const node = layout.nodes.find((candidate) => candidate.column === column);
			const last = variant === 'narrow' && column === 2;
			return {
				text,
				x: node ? (last ? layout.width : node.x0) : 0,
				anchor: last ? 'end' : 'start'
			};
		});
	}

	/**
	 * Two balanced lines for a long label (narrow layout only).
	 * @param {string} label
	 */
	function splitLabel(label) {
		const words = label.split(' ');
		let best = 1;
		for (let i = 1; i < words.length; i += 1) {
			const diff = (/** @type {number} */ at) =>
				Math.abs(words.slice(0, at).join(' ').length - words.slice(at).join(' ').length);
			if (diff(i) < diff(best)) best = i;
		}
		return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
	}

	/** Label font sizes in viewBox units; keep in sync with the `.label` styles below. */
	const FONT_SIZE = {
		wide: { domain: 15, field: 14, project: 14 },
		narrow: { domain: 13.5, field: 13, project: 13 }
	};
	/** Rendered height of a label (one line, or two wrapped lines), in em. */
	const LINE_EM = { 1: 1.32, 2: 2.5 };
	/** Average glyph width in em, a conservative estimate for wrapping. */
	const GLYPH_EM = 0.56;

	/**
	 * Where each node's label goes: its lines (narrow labels wrap when they would
	 * run into the project column) and a y position that never overlaps a
	 * neighbouring label in the same column, so small adjacent nodes stay legible.
	 * @param {import('#lib/charts/sankey-data.js').SankeyLayoutResult} layout
	 * @param {'wide' | 'narrow'} variant
	 */
	function labelPlan(layout, variant) {
		const projectX = layout.nodes.find((node) => node.column === 2)?.x0 ?? layout.width;
		const offset = variant === 'wide' ? 8 : 6;
		/** @type {Map<string, { x: number, y: number, lines: string[], leader: boolean }>} */
		const plan = new Map();
		for (const column of [0, 1, 2]) {
			const items = layout.nodes
				.filter((node) => node.column === column)
				.map((node) => {
					const x = node.x1 + offset;
					const size = FONT_SIZE[variant][node.kind];
					const room = (column === 2 ? layout.width : projectX) - x - 4;
					const wrap =
						variant === 'narrow' &&
						node.kind !== 'project' &&
						node.label.includes(' ') &&
						(node.kind === 'domain' || node.label.length * size * GLYPH_EM > room);
					const lines = wrap ? splitLabel(node.label) : [node.shortLabel];
					return { node, x, lines, height: size * LINE_EM[wrap ? 2 : 1] };
				});
			const placed = spreadLabels(
				items.map(({ node, height }) => ({ id: node.id, y: midY(node), size: height })),
				{ min: 16, max: layout.height, gap: 1 }
			);
			for (const { node, x, lines, height } of items) {
				const y = placed.get(node.id) ?? midY(node);
				plan.set(node.id, { x, y, lines, leader: Math.abs(y - midY(node)) > height / 2 });
			}
		}
		return plan;
	}
	const wideLabels = $derived(labelPlan(wide, 'wide'));
	const narrowLabels = $derived(labelPlan(narrow, 'narrow'));
	/**
	 * @param {{ id: string, x1: number, y0: number, y1: number, shortLabel: string }} node
	 * @param {'wide' | 'narrow'} variant
	 */
	function labelOf(node, variant) {
		return (
			(variant === 'wide' ? wideLabels : narrowLabels).get(node.id) ?? {
				x: node.x1 + (variant === 'wide' ? 8 : 6),
				y: midY(node),
				lines: [node.shortLabel],
				leader: false
			}
		);
	}

	/** @param {string} id */
	const isLit = (id) => Boolean(lit && (lit.nodes.has(id) || lit.links.has(id)));
	const midY = (/** @type {{ y0: number, y1: number }} */ node) =>
		Math.round(((node.y0 + node.y1) / 2) * 100) / 100;
</script>

{#snippet chart(
	/** @type {import('#lib/charts/sankey-data.js').SankeyLayoutResult} */ layout,
	/** @type {'wide' | 'narrow'} */ variant
)}
	<svg
		class="chart {variant}"
		class:has-active={lit}
		viewBox="0 0 {layout.width} {layout.height}"
		role="group"
		aria-labelledby="{uid}-{variant}-title"
		aria-describedby="{uid}-{variant}-desc"
		onpointerover={trace}
		onpointerleave={() => (active = null)}
	>
		<title id="{uid}-{variant}-title">{title}</title>
		<desc id="{uid}-{variant}-desc"
			>Sankey chart: {plural(data.domains.length, 'domain')} flow into {plural(
				data.fields.length,
				'field'
			)} of work and on to {data.total} projects and DIY builds. The same data is available as a table
			below the chart.</desc
		>
		<g class="column-heads" aria-hidden="true">
			{#each columnHeads(layout, variant) as head (head.text)}
				<text class="column-head" x={head.x} y="12" text-anchor={head.anchor}>{head.text}</text>
			{/each}
		</g>
		<g class="flows">
			{#each layout.links as link (link.id)}
				<path
					class="flow"
					class:lit={isLit(link.id)}
					data-tone={link.tone}
					d={link.path}
					stroke-width={link.width}
					data-id={link.id}
				>
					<title>{describe(link.id)}</title>
				</path>
			{/each}
		</g>
		<g class="nodes">
			{#each layout.nodes as node (node.id)}
				{@const place = labelOf(node, variant)}
				{@const labelX = place.x}
				{@const showLabel = variant === 'wide' || node.kind !== 'project'}
				{#snippet body()}
					<rect
						class="node-rect"
						data-tone={node.tone}
						x={node.x0}
						y={node.y0}
						width={node.x1 - node.x0}
						height={Math.max(1, node.y1 - node.y0)}
						rx="2"
					/>
					{#if place.leader}
						<line class="leader" x1={node.x1 + 1} y1={midY(node)} x2={labelX - 2} y2={place.y} />
					{/if}
					{#if place.lines.length === 2}
						<text class="label {node.kind}" x={labelX} y={place.y}
							><tspan x={labelX} dy="-0.25em">{place.lines[0]}</tspan><tspan x={labelX} dy="1.2em"
								>{place.lines[1]}</tspan
							></text
						>
					{:else if showLabel}
						<text class="label {node.kind}" x={labelX} y={place.y} dy="0.35em"
							>{node.shortLabel}{#if node.tone === 'diy'}<tspan class="tag" dx="5">{DIY_TAG}</tspan
								>{/if}</text
						>
					{:else}
						<text class="label number" x={labelX} y={place.y} dy="0.35em"
							>{projectNumber.get(node.id)}</text
						>
					{/if}
				{/snippet}
				{#if node.href}
					<a
						class="node"
						class:lit={isLit(node.id)}
						href={sitePath(node.href)}
						aria-label={nodeName(node)}
						data-id={node.id}
						onfocus={enter(node.id)}
						onblur={leave(node.id)}
					>
						<title>{nodeName(node)}</title>
						{@render body()}
					</a>
				{:else}
					<!-- Domains have no page; they are focusable so keyboard users can trace them too. -->
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<g
						class="node"
						class:lit={isLit(node.id)}
						role="img"
						tabindex="0"
						aria-label={nodeName(node)}
						data-id={node.id}
						onfocus={enter(node.id)}
						onblur={leave(node.id)}
					>
						<title>{nodeName(node)}</title>
						{@render body()}
					</g>
				{/if}
			{/each}
		</g>
	</svg>
{/snippet}

<figure class="sankey" aria-labelledby="{uid}-caption">
	<figcaption id="{uid}-caption">
		<strong>{title}.</strong>
		{#if data.total}
			Each of the {data.total} published projects and DIY builds counts once and is split evenly across
			the fields of work it is tagged with (a project in n fields gives 1/n to each), so every column
			sums to {data.total}. Ribbon width is that share of a project — not hours or effort.
		{:else}
			A flow from domains to fields of work to projects.
		{/if}
		{#if data.unclassified.length}
			{plural(data.unclassified.length, 'published note')} without a field of work {data
				.unclassified.length === 1
				? 'is'
				: 'are'} left out: {data.unclassified.map((item) => item.label).join(', ')}.
		{/if}
	</figcaption>

	{#if data.total === 0}
		<p class="empty">
			No published project is classified into a field of work yet, so there is nothing to chart.
		</p>
	{:else}
		<ul class="legend" aria-label="Colour key">
			<li><i class="swatch" data-tone="field"></i>Domains &amp; fields of work</li>
			<li><i class="swatch" data-tone="projects"></i>Projects</li>
			<li><i class="swatch" data-tone="diy"></i>DIY builds</li>
		</ul>

		<div class="canvas wide-only">
			{@render chart(wide, 'wide')}
		</div>

		<div class="canvas narrow-only">
			{@render chart(narrow, 'narrow')}
			<ol class="key" aria-label="Projects in the chart, top to bottom">
				{#each data.projects as project, index (project.id)}
					<li>
						<span class="key-number" aria-hidden="true">{index + 1}</span>
						<a
							href={project.href ? sitePath(project.href) : undefined}
							class:lit={isLit(project.id)}
							onpointerenter={enter(project.id)}
							onpointerleave={leave(project.id)}
							onfocus={enter(project.id)}
							onblur={leave(project.id)}
							>{project.shortLabel}{#if project.section === 'diy'}<span class="tag"
									>{`\u00a0${DIY_TAG}`}</span
								>{/if}</a
						>
					</li>
				{/each}
			</ol>
		</div>

		<p class="readout">{describe(active)}</p>

		<details class="fallback">
			<summary>Show as table</summary>
			<div class="table-scroll">
				<table>
					<caption
						>Fields of work, top to bottom as in the chart; shares sum to {data.total}.{#if data.fields.some((field) => field.diyCount)}
							Field links open the Projects list; DIY builds in a field are counted here but listed
							on the DIY page.{/if}</caption
					>
					<thead>
						<tr>
							<th scope="col">Field</th>
							<th scope="col">Domain</th>
							<th scope="col" class="num">Projects &amp; builds</th>
							<th scope="col" class="num">Share</th>
						</tr>
					</thead>
					<tbody>
						{#each data.fields as field (field.id)}
							<tr>
								<th scope="row">
									{#if field.href}<a href={sitePath(field.href)}>{field.label}</a
										>{:else}{field.label}{/if}
								</th>
								<td>{domainById.get(field.domainId)?.label}</td>
								<td class="num"
									>{field.projectCount}{#if field.diyCount}<span class="incl"
											>{` (incl. ${field.diyCount} DIY)`}</span
										>{/if}</td
								>
								<td class="num">{fmt(field.value)}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						{#each data.domains as domain (domain.id)}
							<tr>
								<th scope="row" colspan="2">{domain.label} (domain total)</th>
								<td class="num"
									>{domain.projectCount}{#if domain.diyCount}<span class="incl"
											>{` (incl. ${domain.diyCount} DIY)`}</span
										>{/if}</td
								>
								<td class="num">{fmt(domain.value)}</td>
							</tr>
						{/each}
					</tfoot>
				</table>
			</div>
			<div class="table-scroll">
				<table>
					<caption>Projects and DIY builds, top to bottom as in the chart</caption>
					<thead>
						<tr>
							<th scope="col" class="num">#</th>
							<th scope="col">Project</th>
							<th scope="col">Fields of work</th>
							<th scope="col" class="num">Share each</th>
						</tr>
					</thead>
					<tbody>
						{#each data.projects as project, index (project.id)}
							<tr>
								<td class="num">{index + 1}</td>
								<th scope="row">
									<a href={project.href ? sitePath(project.href) : undefined}>{project.label}</a>
									{#if project.section === 'diy'}<span class="tag">DIY</span>{/if}
								</th>
								<td>{fieldLabels(project.fieldIds)}</td>
								<td class="num"
									>{project.fieldIds.length > 1 ? `1/${project.fieldIds.length}` : '1'}</td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</details>
	{/if}
</figure>

<style>
	.sankey {
		container-type: inline-size;
		margin: 0;
		padding: clamp(var(--space-4), 3vw, var(--space-6));
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--graph-bg);
		color: var(--color-text);
	}

	figcaption {
		max-width: var(--reading-width);
		margin: 0 0 var(--space-4);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		line-height: 1.6;
	}
	figcaption strong {
		color: var(--color-heading);
		font-weight: 600;
	}

	.empty {
		margin: 0;
		padding: var(--space-6) var(--space-4);
		border: 1px dashed var(--color-border-strong);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		text-align: center;
	}

	/* ------------------------------------------------------------- colour tones */
	[data-tone='field'] {
		--tone: var(--graph-field);
	}
	[data-tone='projects'] {
		--tone: var(--accent-projects);
	}
	[data-tone='diy'] {
		--tone: var(--accent-diy);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-5);
		margin: 0 0 var(--space-4);
		padding: 0;
		list-style: none;
		color: var(--color-text);
		font-size: var(--text-sm);
	}
	.legend li {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}
	.swatch {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 2px;
		background: var(--tone);
	}

	/* ------------------------------------------------------- responsive switch */
	.wide-only {
		display: none;
	}
	@container (min-width: 840px) {
		.wide-only {
			display: block;
		}
		.narrow-only {
			display: none;
		}
	}
	.narrow-only {
		max-width: 26rem;
		margin-inline: auto;
	}

	.column-head {
		fill: var(--color-text-muted);
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.narrow .column-head {
		font-size: 11.5px;
	}

	.chart {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
		font-family: var(--font-body);
	}

	/* --------------------------------------------------------------- the marks */
	.flow {
		fill: none;
		stroke: var(--tone);
		stroke-opacity: 0.34;
	}
	.flow.lit {
		stroke-opacity: 0.72;
	}
	.has-active .flow:not(.lit) {
		stroke-opacity: 0.06;
	}

	.node-rect {
		fill: var(--tone);
	}
	.node {
		cursor: default;
	}
	a.node {
		cursor: pointer;
	}
	.has-active .node:not(.lit) {
		opacity: 0.3;
	}
	.node:focus {
		outline: none;
	}
	.node:focus-visible .node-rect {
		stroke: var(--color-heading);
		stroke-width: 3;
		paint-order: stroke;
	}
	.node:focus-visible .label,
	a.node:hover .label {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.leader {
		stroke: var(--color-text-muted);
		stroke-width: 1;
	}
	.label {
		fill: var(--graph-label);
		font-size: 14px;
		paint-order: stroke;
		stroke: var(--graph-bg);
		stroke-opacity: 0.85;
		stroke-width: 3px;
		stroke-linejoin: round;
	}
	.label.domain {
		font-size: 15px;
		font-weight: 600;
	}
	.narrow .label {
		font-size: 13px;
	}
	.narrow .label.domain {
		font-size: 13.5px;
	}
	.label.number {
		fill: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}
	.tag {
		fill: var(--color-text-muted);
		color: var(--color-text-muted);
		font-size: 0.85em;
	}

	@media (prefers-reduced-motion: no-preference) {
		.flow {
			transition: stroke-opacity 160ms ease;
		}
		.node {
			transition: opacity 160ms ease;
		}
	}

	/* ------------------------------------------------------------ narrow key */
	.key {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
		gap: var(--space-1) var(--space-4);
		margin: var(--space-4) 0 0;
		padding: 0;
		list-style: none;
		font-size: var(--text-sm);
	}
	.key li {
		display: flex;
		gap: var(--space-2);
		min-width: 0;
	}
	.key-number {
		flex: none;
		min-width: 1.5em;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
	.key a {
		color: var(--color-text);
		overflow-wrap: anywhere;
		text-decoration: none;
	}
	.key a:hover,
	.key a.lit {
		color: var(--color-heading);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	/* ------------------------------------------------------------- readout */
	.readout {
		min-height: 3.2em;
		margin: var(--space-4) 0 0;
		color: var(--color-text);
		font-size: var(--text-sm);
		line-height: 1.6;
	}

	/* ------------------------------------------------------------- fallback */
	.fallback {
		margin-top: var(--space-4);
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-3);
	}
	.fallback summary {
		color: var(--link);
		font-size: var(--text-sm);
		cursor: pointer;
	}
	.table-scroll {
		margin-top: var(--space-4);
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-sm);
	}
	caption {
		margin-bottom: var(--space-2);
		color: var(--color-text-muted);
		text-align: left;
	}
	th,
	td {
		padding: var(--space-2) var(--space-3) var(--space-2) 0;
		border-bottom: 1px solid var(--color-border);
		text-align: left;
		vertical-align: top;
	}
	thead th {
		color: var(--color-text-muted);
		font-weight: 500;
	}
	tbody th,
	tfoot th {
		color: var(--color-heading);
		font-weight: 500;
	}
	tfoot th,
	tfoot td {
		border-bottom: 0;
		color: var(--color-text-muted);
	}
	th:last-child,
	td:last-child {
		padding-right: 0;
	}
	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	table a {
		color: inherit;
	}
	table .tag {
		margin-left: var(--space-2);
	}
	.incl {
		display: block;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
</style>
