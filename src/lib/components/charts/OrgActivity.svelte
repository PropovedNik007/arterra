<script>
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import { MONTH_LABELS, formatMonth } from '#lib/github/stats.js';

	/**
	 * Anonymised commit and pull-request totals from private organisation work,
	 * built from the committed aggregate snapshot (src/lib/github/orgs.json,
	 * refreshed manually with `npm run github:orgs`). The snapshot is one merged
	 * total with no breakdown, alias, count or repository row, so the numbers
	 * cannot be attributed to any organisation.
	 * The chart is server-rendered SVG with a table equivalent.
	 *
	 * data: orgActivity(snapshot, publicSnapshot), derived on the server.
	 * headingLevel: level of this block's own heading (panels use the next one).
	 * @type {{ data: import('#lib/github/org-stats.js').OrgActivityData, headingLevel?: number }}
	 */
	let { data, headingLevel = 2 } = $props();

	const uid = $props.id();
	const chartId = `${uid}-combined`;

	let h = $derived(Math.min(Math.max(headingLevel, 1), 5));
	let sub = $derived(`h${h + 1}`);

	/** @param {number} n @param {string} one @param {string} [many] */
	const plural = (n, one, many = `${one}s`) =>
		`${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

	/** @param {number} share fraction 0..1 */
	function percent(share) {
		if (!share) return '0%';
		if (share < 0.001) return '<0.1%';
		return `${(share * 100).toFixed(share >= 0.1 ? 0 : 1)}%`;
	}

	/** "Mar 2026 – Nov 2026", or one month when both ends match. */
	function span(/** @type {string | null} */ first, /** @type {string | null} */ last) {
		if (!first || !last) return '—';
		return first === last ? formatMonth(first) : `${formatMonth(first)} – ${formatMonth(last)}`;
	}

	// ------------------------------------------------------------ language colours

	/** Same token mapping as the public GitHub dashboard, plus languages it lacks. */
	const LANG_TONE = /** @type {Record<string, string>} */ ({
		Python: 'python',
		'Jupyter Notebook': 'jupyter',
		JavaScript: 'javascript',
		TypeScript: 'typescript',
		Svelte: 'svelte',
		HTML: 'html',
		CSS: 'css',
		TeX: 'tex',
		Java: 'java',
		'C++': 'cpp',
		C: 'c',
		Shell: 'shell',
		Dockerfile: 'docker',
		Go: 'go',
		Rust: 'rust',
		Jinja: 'jinja',
		PowerShell: 'powershell'
	});
	/** @param {string} language */
	const tone = (language) => `var(--lang-${LANG_TONE[language] ?? 'other'})`;

	/** Left offsets (0..100) for the stacked language bar. */
	function segments(/** @type {{ language: string, share: number }[]} */ rows) {
		let x = 0;
		return rows.map((row) => {
			const out = { ...row, x, w: row.share * 100 };
			x += out.w;
			return out;
		});
	}

	// ------------------------------------------------------------ column chart

	const W = 340;
	const H = 156;
	const TOP = 18;
	const BOTTOM = 34;
	const PLOT = H - TOP - BOTTOM;

	const SERIES = /** @type {const} */ ([
		{ key: 'public', label: 'public' },
		{ key: 'private', label: 'private' }
	]);

	let months = $derived(data.combined.map((row) => row.month));
	let max = $derived(Math.max(1, ...data.combined.map((row) => row.public + row.private)));
	let band = $derived(W / Math.max(1, months.length));

	/**
	 * The column the readout and dimming follow. Pointer hover and keyboard
	 * focus write the same value, so whichever happened last wins.
	 */
	let active = $state(/** @type {number | null} */ (null));
	/** Roving tab stop: the last month by default. */
	let roving = $state(/** @type {number | null} */ (null));
	/** @type {SVGRectElement[]} */
	const columnRefs = $state([]);

	/** @param {number} i */
	const total = (i) => (data.combined[i]?.public ?? 0) + (data.combined[i]?.private ?? 0);

	/** @param {number} i */
	function describe(i) {
		const row = data.combined[i];
		return `${formatMonth(row.month)}: ${plural(total(i), 'commit')} (${row.public.toLocaleString('en-US')} public, ${row.private.toLocaleString('en-US')} private)`;
	}

	let readout = $derived.by(() => {
		if (active != null && data.combined[active]) return describe(active);
		let peak = -1;
		data.combined.forEach((_, i) => {
			if (total(i) > 0 && (peak < 0 || total(i) > total(peak))) peak = i;
		});
		return peak >= 0 ? `Busiest month — ${describe(peak)}` : 'No commits in this window.';
	});

	/** @param {KeyboardEvent} event @param {number} i */
	function onColumnKeydown(event, i) {
		const last = months.length - 1;
		let next = -1;
		if (event.key === 'ArrowRight') next = Math.min(i + 1, last);
		else if (event.key === 'ArrowLeft') next = Math.max(i - 1, 0);
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = last;
		else return;
		event.preventDefault();
		roving = next;
		columnRefs[next]?.focus();
	}

	/** Bar geometry for both series of column i (public at the bottom). */
	function stack(/** @type {number} */ i) {
		const w = Math.min(28, band * 0.62);
		const x = i * band + (band - w) / 2;
		let y = TOP + PLOT;
		return SERIES.map((s) => {
			const height = (PLOT * (data.combined[i]?.[s.key] ?? 0)) / max;
			y -= height;
			return { key: s.key, x, y, w, height };
		});
	}
</script>

<section class="orgs" aria-labelledby="{uid}-title">
	<header class="head">
		<p class="eyebrow">Private work</p>
		<svelte:element this={`h${h}`} id="{uid}-title" class="title"
			>Private organisation work (anonymised)</svelte:element
		>
		<p class="meta">
			Commits and pull requests I authored in private company repositories. Names, repositories and
			code are confidential, so only totals are shown{#if data.asOf}, refreshed manually as of <time
					datetime={data.asOfIso}>{data.asOf}</time
				>{:else}, refreshed manually{/if}. Commits are counted on each repository's default branch
			only; pull requests are counted in any state.
		</p>
	</header>

	{#if data.isEmpty}
		<EmptyState icon="⌥" title="No private activity snapshot yet" headingLevel={h + 1}>
			<p>
				Aggregate statistics from private repositories have not been collected for this build, so
				nothing is shown rather than guessed.
			</p>
		</EmptyState>
	{:else}
		<div class="layout">
			<div class="card">
				<dl class="kpis">
					<div class="kpi">
						<dt>Repositories</dt>
						<dd class="value">{data.totals.reposContributed.toLocaleString('en-US')}</dd>
						<dd class="note">with at least one of my commits</dd>
					</div>
					<div class="kpi">
						<dt>Commits</dt>
						<dd class="value">{data.totals.commits.toLocaleString('en-US')}</dd>
						<dd class="note">on default branches</dd>
					</div>
					<div class="kpi">
						<dt>Pull requests</dt>
						<dd class="value">{data.totals.pullRequests.toLocaleString('en-US')}</dd>
						<dd class="note">opened, any state</dd>
					</div>
					<div class="kpi">
						<dt>Active</dt>
						<dd class="value span">{span(data.firstMonth, data.lastMonth)}</dd>
						<dd class="note">first to last month with commits</dd>
					</div>
				</dl>

				<figure class="panel">
					<figcaption>
						<svelte:element this={sub} class="panel-title">Language mix</svelte:element>
						<span class="panel-note"
							>Share of code bytes in the repositories I committed to: whole repositories, not only
							my lines.</span
						>
					</figcaption>
					{#if data.languages.length}
						<svg class="mix" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
							{#each segments(data.languages) as seg (seg.language)}
								<rect
									x={seg.x}
									y="0"
									width={Math.max(0, seg.w)}
									height="10"
									style:fill={tone(seg.language)}
								/>
							{/each}
						</svg>
						<ul class="legend">
							{#each data.languages as lang (lang.language)}
								<li style:--tone={tone(lang.language)}>
									<span class="dot" aria-hidden="true"></span>
									<span class="lang">{lang.language}</span>
									<span class="pct">{percent(lang.share)}</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="panel-note">No languages detected.</p>
					{/if}
				</figure>
			</div>

			{#if data.combined.length}
				<figure class="card panel combined">
					<figcaption>
						<svelte:element this={sub} class="panel-title"
							>Public and private, together</svelte:element
						>
						<span class="panel-note"
							>All commits per month: {plural(data.combinedTotals.public, 'public commit')} and {plural(
								data.combinedTotals.private,
								'private commit'
							)} in this window.</span
						>
					</figcaption>
					<ul class="key" aria-hidden="true">
						<li><span class="swatch public"></span>Public repositories</li>
						<li><span class="swatch private"></span>Private repositories</li>
					</ul>
					<svg
						class="chart"
						viewBox="0 0 {W} {H}"
						role="group"
						aria-label="Public and private commits per month"
						aria-describedby="{chartId}-desc"
						onpointerleave={() => (active = null)}
					>
						<desc id="{chartId}-desc"
							>Use the left and right arrow keys to move between months. The table below lists the
							same data.</desc
						>
						<g aria-hidden="true">
							<line class="grid" x1="0" x2={W} y1={TOP} y2={TOP} />
							<text class="max" x={W} y={TOP - 5} text-anchor="end"
								>{max.toLocaleString('en-US')}</text
							>
							<line class="baseline" x1="0" x2={W} y1={TOP + PLOT} y2={TOP + PLOT} />
							{#each months as month, i (month)}
								{@const cx = i * band + band / 2}
								<text x={cx} y={TOP + PLOT + 13} text-anchor="middle"
									>{MONTH_LABELS[Number(month.slice(5)) - 1].slice(0, 1)}</text
								>
								{#if i === 0 || month.endsWith('-01')}
									<text class="year" x={cx} y={TOP + PLOT + 28} text-anchor="middle"
										>’{month.slice(2, 4)}</text
									>
								{/if}
								{#each stack(i) as bar (bar.key)}
									{#if bar.height > 0}
										<rect
											class="bar {bar.key}"
											class:dim={active != null && active !== i}
											x={bar.x}
											y={bar.y}
											width={bar.w}
											height={bar.height}
											rx="2"
										/>
									{/if}
								{/each}
							{/each}
						</g>
						{#each months as month, i (month)}
							<!-- A focusable data point (roving tabindex): keyboard users get the same
							     readout as pointer hover; it has no action, so it is not a button. -->
							<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
							<rect
								bind:this={columnRefs[i]}
								class="hit"
								class:active={active === i}
								x={i * band}
								y={TOP - 4}
								width={band}
								height={PLOT + 8}
								role="img"
								tabindex={(roving ?? months.length - 1) === i ? 0 : -1}
								aria-label={describe(i)}
								onpointerenter={() => (active = i)}
								onfocus={() => {
									active = i;
									roving = i;
								}}
								onblur={() => {
									if (active === i) active = null;
								}}
								onkeydown={(event) => onColumnKeydown(event, i)}
							/>
						{/each}
					</svg>
					<p class="readout" aria-hidden="true">{readout}</p>
					<details>
						<summary>Show as table</summary>
						<table>
							<caption class="visually-hidden">Public and private commits per month</caption>
							<thead>
								<tr>
									<th scope="col">Month</th>
									<th scope="col" class="num">Public</th>
									<th scope="col" class="num">Private</th>
								</tr>
							</thead>
							<tbody>
								{#each data.combined as row (row.month)}
									<tr>
										<th scope="row">{formatMonth(row.month)}</th>
										<td class="num">{row.public.toLocaleString('en-US')}</td>
										<td class="num">{row.private.toLocaleString('en-US')}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</details>
				</figure>
			{/if}
		</div>
	{/if}
</section>

<style>
	.orgs {
		/* Language hues: identical tokens to the public dashboard (GithubDashboard). */
		--lang-python: var(--graph-topic);
		--lang-jupyter: var(--accent-diy);
		--lang-javascript: color-mix(in srgb, var(--accent-diy) 55%, var(--color-heading));
		--lang-typescript: color-mix(in srgb, var(--graph-topic) 60%, var(--graph-org));
		--lang-svelte: var(--accent-sport);
		--lang-html: var(--accent-coral-soft);
		--lang-css: var(--graph-org);
		--lang-tex: var(--graph-field);
		--lang-java: color-mix(in srgb, var(--accent-coral) 55%, var(--color-border-strong));
		--lang-cpp: color-mix(in srgb, var(--graph-org) 55%, var(--accent-sport));
		--lang-c: color-mix(in srgb, var(--color-text) 70%, var(--color-text-muted));
		--lang-shell: color-mix(in srgb, var(--graph-field) 60%, var(--accent-diy));
		--lang-docker: color-mix(in srgb, var(--graph-topic) 70%, var(--graph-field));
		/* Languages that only occur in the private snapshot. */
		--lang-go: color-mix(in srgb, var(--graph-field) 75%, var(--color-heading));
		--lang-rust: color-mix(in srgb, var(--accent-diy) 45%, var(--accent-sport));
		--lang-jinja: color-mix(in srgb, var(--accent-sport) 40%, var(--color-text-muted));
		--lang-powershell: color-mix(in srgb, var(--graph-topic) 50%, var(--color-border-strong));
		--lang-other: var(--color-text-muted);

		--series-public: var(--graph-topic);
		--series-private: var(--accent-coral);

		min-width: 0;
		margin-top: var(--space-8);
	}

	.head {
		margin-bottom: var(--space-5);
	}
	.title {
		margin: 0 0 var(--space-3);
		font-size: clamp(1.6rem, 3vw, 2.2rem);
	}
	.meta {
		max-width: 46rem;
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		line-height: 1.6;
	}

	/* ---------------------------------------------------------------- layout */
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-4);
		align-items: start;
	}
	@media (min-width: 900px) {
		.layout {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	.card {
		display: grid;
		align-content: start;
		gap: var(--space-5);
		min-width: 0;
		margin: 0;
		padding: clamp(var(--space-4), 3vw, var(--space-5));
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg-raised);
	}

	/* ---------------------------------------------------------------- KPIs */
	.kpis {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-2);
		margin: 0;
	}
	.kpi {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
	}
	.kpi dt {
		order: 1;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.kpi dd {
		margin: 0;
	}
	.kpi .value {
		order: 2;
		margin-top: var(--space-1);
		color: var(--color-heading);
		font-family: var(--font-display);
		font-size: var(--text-xl);
		line-height: 1.15;
		font-variant-numeric: tabular-nums;
		overflow-wrap: anywhere;
	}
	.kpi .span {
		font-size: var(--text-base);
		font-family: var(--font-body);
		font-weight: 650;
	}
	.kpi .note {
		order: 3;
		margin-top: var(--space-1);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		line-height: 1.4;
	}

	/* ---------------------------------------------------------------- panels */
	.panel {
		min-width: 0;
		margin: 0;
	}
	figcaption {
		margin-bottom: var(--space-3);
	}
	.panel-title {
		display: block;
		margin: 0 0 var(--space-1);
		color: var(--color-heading);
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: 650;
	}
	/* The chart panel's title stays larger than its ~17px axis text. */
	.combined .panel-title {
		font-size: var(--text-lg);
	}
	.panel-note {
		display: block;
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		line-height: 1.5;
	}

	/* ---------------------------------------------------------------- column chart */
	.combined {
		gap: 0;
	}
	/* Capped like the public dashboard's charts so axis text stays near 12–17px. */
	.chart {
		display: block;
		width: 100%;
		max-width: 30rem;
		height: auto;
		overflow: visible;
		font-family: var(--font-body);
	}
	.chart text {
		fill: var(--color-text-muted);
		font-size: 12px;
		font-variant-numeric: tabular-nums;
	}
	.chart .year {
		fill: var(--color-text);
	}
	.grid {
		stroke: var(--color-border);
		stroke-dasharray: 3 3;
	}
	.baseline {
		stroke: var(--color-border-strong);
	}
	.bar {
		transition: opacity 120ms ease;
	}
	.bar.public {
		fill: var(--series-public);
	}
	.bar.private {
		fill: var(--series-private);
	}
	.bar.dim {
		opacity: 0.45;
	}
	.hit {
		fill: transparent;
		cursor: default;
	}
	.hit.active {
		fill: color-mix(in srgb, var(--color-heading) 6%, transparent);
	}
	.hit:focus {
		outline: none;
	}
	.hit:focus-visible {
		stroke: var(--color-heading);
		stroke-width: 1.5;
	}
	.readout {
		min-height: 1.5em;
		margin: var(--space-2) 0 0;
		color: var(--color-heading);
		font-size: var(--text-sm);
		font-variant-numeric: tabular-nums;
		line-height: 1.5;
	}
	.key {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-4);
		margin: 0 0 var(--space-3);
		padding: 0;
		list-style: none;
		color: var(--color-text);
		font-size: var(--text-sm);
	}
	.key li {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}
	.swatch {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 2px;
	}
	.swatch.public {
		background: var(--series-public);
	}
	.swatch.private {
		background: var(--series-private);
	}

	/* ---------------------------------------------------------------- language mix */
	.mix {
		display: block;
		width: 100%;
		height: 0.6rem;
		overflow: hidden;
		border-radius: var(--radius-full);
		background: var(--color-bg-elevated);
	}
	.mix rect {
		stroke: var(--color-bg-raised);
		stroke-width: 0.4;
		vector-effect: non-scaling-stroke;
	}
	.legend {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 9rem), 1fr));
		gap: var(--space-1) var(--space-4);
		margin: var(--space-3) 0 0;
		padding: 0;
		list-style: none;
		font-size: var(--text-sm);
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
	}
	.dot {
		flex: none;
		width: 0.6rem;
		height: 0.6rem;
		border-radius: var(--radius-full);
		background: var(--tone);
	}
	.lang {
		min-width: 0;
		color: var(--color-heading);
		overflow-wrap: anywhere;
	}
	.pct {
		margin-left: auto;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	/* ---------------------------------------------------------------- tables */
	details {
		margin-top: var(--space-3);
		font-size: var(--text-sm);
	}
	summary {
		width: fit-content;
		color: var(--link);
		cursor: pointer;
	}
	table {
		width: 100%;
		margin-top: var(--space-3);
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}
	th,
	td {
		padding: var(--space-1) var(--space-2);
		border-bottom: 1px solid var(--color-border);
		text-align: left;
		vertical-align: top;
	}
	thead th {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	tbody th {
		color: var(--color-heading);
		font-weight: 600;
	}
	.num {
		text-align: right;
	}

	@media (prefers-reduced-motion: reduce) {
		.bar {
			transition: none;
		}
	}
</style>
