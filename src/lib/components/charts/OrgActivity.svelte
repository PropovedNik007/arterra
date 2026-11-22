<script>
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import { MONTH_LABELS, formatMonth } from '#lib/github/stats.js';

	/**
	 * Combined GitHub activity: public and private commits per month over the
	 * last 24 months, then "Work in private repositories" as one block of
	 * combined totals (commits, pull requests, repositories, active period) and
	 * the language mix. Built from the committed snapshots
	 * (src/lib/github/github.json and orgs.json); nothing per organisation, and
	 * no organisation, repository or collaborator name, ever reaches this
	 * component. The chart is server-rendered HTML with a table equivalent.
	 *
	 * data: orgActivity(orgSnapshot, publicSnapshot), derived on the server.
	 * headingLevel: level of this block's own heading (sub-blocks use the next ones).
	 * @type {{ data: import('#lib/github/org-stats.js').OrgActivityData, headingLevel?: number }}
	 */
	let { data, headingLevel = 2 } = $props();

	const uid = $props.id();

	let h = $derived(Math.min(Math.max(headingLevel, 1), 4));
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

	/** "Mar 2025 – Nov 2026", "Jan – Nov 2026" within one year, or one month. */
	function span(/** @type {string | null} */ first, /** @type {string | null} */ last) {
		if (!first || !last) return '—';
		if (first === last) return formatMonth(first);
		if (first.slice(0, 4) === last.slice(0, 4))
			return `${MONTH_LABELS[Number(first.slice(5, 7)) - 1]} – ${formatMonth(last)}`;
		return `${formatMonth(first)} – ${formatMonth(last)}`;
	}

	/** @param {number | null} value */
	const num = (value) => (value == null ? '—' : value.toLocaleString('en-US'));

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

	// ------------------------------------------------------------ combined chart

	let rows = $derived(data.combined);
	let windowTotal = $derived(data.combinedTotals.public + data.combinedTotals.private);
	/** @param {number} i */
	const total = (i) => (rows[i]?.public ?? 0) + (rows[i]?.private ?? 0);
	let max = $derived(Math.max(1, ...rows.map((_, i) => total(i))));
	/** A rounded gridline value near the top of the scale. */
	let gridValue = $derived.by(() => {
		const magnitude = 10 ** Math.floor(Math.log10(max));
		const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((v) => v * 4 >= max) ?? max;
		return Math.max(1, Math.floor(max / step) * step);
	});
	let hasMissing = $derived(rows.some((row) => row.public == null || row.private == null));

	/**
	 * The column the readout and dimming follow. Pointer hover and keyboard
	 * focus write the same value, so whichever happened last wins.
	 */
	let active = $state(/** @type {number | null} */ (null));
	/** Roving tab stop: the last month by default. */
	let roving = $state(/** @type {number | null} */ (null));
	/** @type {HTMLElement[]} */
	const columnRefs = $state([]);

	/** @param {number | null} value */
	const part = (value) => (value == null ? 'not collected' : value.toLocaleString('en-US'));

	/** @param {string} month */
	const isPartial = (month) => data.partial?.month === month;
	/** "Nov 2026", or "Nov 2026 (to 22 Nov)" for the running month. */
	const monthLabel = (/** @type {string} */ month) =>
		isPartial(month) ? `${formatMonth(month)} (to ${data.partial?.through})` : formatMonth(month);

	/** @param {number} i */
	function describe(i) {
		const row = rows[i];
		return `${monthLabel(row.month)}: ${plural(total(i), 'commit')} (public ${part(row.public)}, private ${part(row.private)})`;
	}

	/** Both snapshots taken on the same day: one date is enough. */
	let sameDay = $derived(
		!!data.asOf && !data.isEmpty && data.publicAsOf !== '' && data.asOf === data.publicAsOf
	);

	let readout = $derived.by(() => {
		if (active != null && rows[active]) return describe(active);
		let peak = -1;
		rows.forEach((_, i) => {
			if (total(i) > 0 && (peak < 0 || total(i) > total(peak))) peak = i;
		});
		return peak >= 0 ? `Busiest month — ${describe(peak)}` : 'No commits in this window.';
	});

	/** @param {KeyboardEvent} event @param {number} i */
	function onColumnKeydown(event, i) {
		const last = rows.length - 1;
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

	/** Height of a value as a percentage of the plot. */
	const pct = (/** @type {number | null} */ value) => `${((value ?? 0) / max) * 100}%`;
</script>

<section class="activity" aria-labelledby="{uid}-title">
	<header class="head">
		<p class="eyebrow">Code activity</p>
		<svelte:element this={`h${h}`} id="{uid}-title" class="title"
			>Commits per month, public and private</svelte:element
		>
		<p class="meta">
			Every commit I authored on default branches, in my public repositories and in private
			repositories (company work).
			{#if sameDay}Data as of <time datetime={data.asOfIso}>{data.asOf}</time>.{:else}Public data
				{#if data.publicAsOf}as of <time datetime={data.publicAsOfIso}>{data.publicAsOf}</time
					>{:else}not collected{/if}; private data
				{#if data.asOf && !data.isEmpty}as of <time datetime={data.asOfIso}>{data.asOf}</time
					>{:else}not collected{/if}.{/if}
		</p>
	</header>

	{#if rows.length === 0}
		<EmptyState icon="⌥" title="No commit snapshot yet" headingLevel={h + 1}>
			<p>
				Commit statistics have not been collected for this build, so nothing is shown rather than
				guessed.
			</p>
		</EmptyState>
	{:else}
		<figure class="chart-panel combined" aria-labelledby="{uid}-chart-title">
			<figcaption>
				<svelte:element this={sub} id="{uid}-chart-title" class="panel-title"
					>Last 24 months</svelte:element
				>
				<span class="panel-note"
					>{formatMonth(rows[0].month)} – {formatMonth(rows[rows.length - 1].month)}: {plural(
						windowTotal,
						'commit'
					)}, {num(data.combinedTotals.public)} public and {num(data.combinedTotals.private)} private.
					Each column is one month: public commits at the bottom, private commits stacked on top.</span
				>
			</figcaption>
			<ul class="key">
				<li><span class="swatch public" aria-hidden="true"></span>Public</li>
				<li><span class="swatch private" aria-hidden="true"></span>Private</li>
				{#if data.partial && rows.at(-1)?.month === data.partial.month}
					<li>
						<span class="swatch partial" aria-hidden="true"></span>Month to date (to {data.partial
							.through})
					</li>
				{/if}
				{#if hasMissing}
					<li><span class="swatch missing" aria-hidden="true"></span>Not collected yet</li>
				{/if}
			</ul>

			<div
				class="plot"
				role="group"
				aria-label="Public and private commits per month"
				aria-describedby="{uid}-chart-desc"
				onpointerleave={() => (active = null)}
				style:--cols={rows.length}
			>
				<p id="{uid}-chart-desc" class="visually-hidden">
					Use the left and right arrow keys to move between months. The table below lists the same
					data.
				</p>
				<div class="gridline" style:bottom={pct(gridValue)} aria-hidden="true">
					<span>{gridValue.toLocaleString('en-US')}</span>
				</div>
				<div class="cols">
					{#each rows as row, i (row.month)}
						<!-- A focusable data point (roving tabindex): keyboard users get the same
						     readout as pointer hover; it has no action, so it is not a button. -->
						<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
						<div
							bind:this={columnRefs[i]}
							class="col"
							class:partial={isPartial(row.month)}
							class:active={active === i}
							class:dim={active != null && active !== i}
							role="img"
							tabindex={(roving ?? rows.length - 1) === i ? 0 : -1}
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
						>
							<span class="stack" aria-hidden="true">
								{#if row.public}<span class="seg public" style:height={pct(row.public)}></span>{/if}
								{#if row.private}<span class="seg private" style:height={pct(row.private)}
									></span>{/if}
								{#if row.public == null || row.private == null}
									<span class="seg missing"></span>
								{/if}
							</span>
						</div>
					{/each}
				</div>
			</div>
			<div class="axis" aria-hidden="true" style:--cols={rows.length}>
				{#each rows as row, i (row.month)}
					<span class="tick">
						<span class="m">{MONTH_LABELS[Number(row.month.slice(5)) - 1].slice(0, 1)}</span>
						{#if (i === 0 && !row.month.endsWith('-12')) || row.month.endsWith('-01')}
							<span class="y">’{row.month.slice(2, 4)}</span>
						{/if}
					</span>
				{/each}
			</div>
			<p class="readout" aria-hidden="true">{readout}</p>
			<details class="data-details">
				<summary>Show as table</summary>
				<table class="data-table">
					<caption class="visually-hidden">Public and private commits per month</caption>
					<thead>
						<tr>
							<th scope="col">Month</th>
							<th scope="col" class="num">Public</th>
							<th scope="col" class="num">Private</th>
							<th scope="col" class="num">Total</th>
						</tr>
					</thead>
					<tbody>
						{#each rows as row, i (row.month)}
							<tr>
								<th scope="row">{monthLabel(row.month)}</th>
								<td class="num">{num(row.public)}</td>
								<td class="num">{num(row.private)}</td>
								<td class="num">{total(i).toLocaleString('en-US')}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				{#if hasMissing}
					<p class="footnote">— means that series was not collected for that month yet.</p>
				{/if}
			</details>
		</figure>

		<section class="private-work" aria-labelledby="{uid}-private-title">
			<svelte:element this={sub} id="{uid}-private-title" class="block-title"
				>Work in private repositories</svelte:element
			>
			{#if data.isEmpty}
				<EmptyState icon="⌥" title="No private activity snapshot yet" headingLevel={h + 2}>
					<p>
						Totals from private repositories have not been collected for this build, so nothing is
						shown rather than guessed.
					</p>
				</EmptyState>
			{:else}
				<p class="block-note">
					Commits and pull requests in private repositories (company work), combined. Repository
					names and code are not shown.
				</p>
				<dl class="kpis stat-list boxed">
					<div class="stat">
						<dt class="stat-label">Commits</dt>
						<dd class="stat-value">{num(data.totals.commits)}</dd>
						<dd class="stat-note">authored by me on default branches</dd>
					</div>
					<div class="stat">
						<dt class="stat-label">Pull requests</dt>
						<dd class="stat-value">{num(data.totals.pullRequests)}</dd>
						<dd class="stat-note">opened by me, any state</dd>
					</div>
					<div class="stat">
						<dt class="stat-label">Repositories</dt>
						<dd class="stat-value">{num(data.totals.reposContributed)}</dd>
						<dd class="stat-note">with at least one of my commits</dd>
					</div>
					<div class="stat">
						<dt class="stat-label">Active</dt>
						<dd class="stat-value span">{span(data.firstMonth, data.lastMonth)}</dd>
						<dd class="stat-note">first to latest month with a commit</dd>
					</div>
				</dl>
				{#if data.languages.length}
					<figure class="chart-panel languages" aria-labelledby="{uid}-mix">
						<figcaption>
							<svelte:element this={`h${h + 2}`} id="{uid}-mix" class="panel-title"
								>Language mix</svelte:element
							>
							<span class="panel-note"
								>By code size in the private repositories I committed to: whole repositories, not
								only my lines.</span
							>
						</figcaption>
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
						<ul class="legend" aria-label="Languages by share of code size">
							{#each data.languages as lang (lang.language)}
								<li style:--tone={tone(lang.language)}>
									<span class="dot" aria-hidden="true"></span>
									<span class="lang">{lang.language}</span>
									<span class="pct">{percent(lang.share)}</span>
								</li>
							{/each}
						</ul>
					</figure>
				{/if}
			{/if}
		</section>
	{/if}
</section>

<style>
	.activity {
		/* Language hues (--lang-*) live in tokens.css, shared with GithubDashboard. */
		--series-public: var(--graph-topic);
		--series-private: var(--accent-coral);

		min-width: 0;
	}

	.head {
		margin-bottom: var(--space-5);
	}
	.title {
		margin: 0 0 var(--space-3);
		font-size: var(--heading-card);
	}
	.meta {
		max-width: 46rem;
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		line-height: 1.6;
	}

	/* ------------------------------------------------- KPIs (.stat-list.boxed) */
	.kpis {
		margin-bottom: var(--space-5);
	}
	.kpis .span {
		font-size: var(--text-xl);
		overflow-wrap: normal;
	}

	/* ---------------------------------------------------------------- panels */
	figcaption {
		margin-bottom: var(--space-4);
	}
	.panel-title,
	.block-title {
		display: block;
		margin: 0 0 var(--space-1);
		color: var(--color-heading);
		font-family: var(--font-body);
		font-size: var(--text-lg);
		font-weight: 700;
	}
	.panel-note,
	.block-note,
	.footnote {
		display: block;
		max-width: 46rem;
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		line-height: 1.5;
	}
	.footnote {
		margin-top: var(--space-2);
	}

	/* ---------------------------------------------------------------- combined chart */
	.key {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-4);
		margin: 0 0 var(--space-4);
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
		width: var(--legend-swatch);
		height: var(--legend-swatch);
		border-radius: 2px;
	}
	.swatch.public {
		background: var(--series-public);
	}
	.swatch.private {
		background: var(--series-private);
	}
	.swatch.partial {
		background: repeating-linear-gradient(
			135deg,
			var(--series-private) 0 3px,
			color-mix(in srgb, var(--series-private) 45%, var(--color-bg-raised)) 3px 5px
		);
	}
	.swatch.missing {
		border: 1px dashed var(--color-text-muted);
	}

	.plot {
		position: relative;
		height: clamp(10rem, 24vw, 15rem);
		border-bottom: 1px solid var(--color-border-strong);
	}
	/* Above the bars, label on the left (older, usually quieter months). */
	.gridline {
		position: absolute;
		z-index: 1;
		right: 0;
		left: 0;
		border-top: 1px dashed var(--color-border);
		pointer-events: none;
	}
	.gridline span {
		position: absolute;
		left: 0;
		bottom: 2px;
		padding-right: var(--space-1);
		background: var(--color-bg-raised);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-variant-numeric: tabular-nums;
	}
	.cols,
	.axis {
		display: grid;
		grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
	}
	.cols {
		position: relative;
		height: 100%;
	}
	.col {
		display: flex;
		align-items: stretch;
		justify-content: center;
		min-width: 0;
		height: 100%;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		cursor: default;
	}
	.col.active {
		background: var(--color-hover);
	}
	/* The running month: lighter, hatched, and labelled "to <date>". */
	.col.partial .seg:not(.missing) {
		background-image: repeating-linear-gradient(
			135deg,
			transparent 0 3px,
			color-mix(in srgb, var(--color-bg-raised) 55%, transparent) 3px 5px
		);
	}
	.col:focus {
		outline: none;
	}
	.col:focus-visible {
		outline: 2px solid var(--color-heading);
		outline-offset: -2px;
	}
	.stack {
		display: flex;
		flex-direction: column-reverse;
		width: min(70%, 1.75rem);
		height: 100%;
		transition: opacity 120ms ease;
	}
	.col.dim .stack {
		opacity: 0.45;
	}
	.seg {
		display: block;
		flex: none;
		min-height: 2px;
	}
	.seg.public {
		background: var(--series-public);
	}
	.seg.private {
		border-radius: 2px 2px 0 0;
		background: var(--series-private);
	}
	.seg.public:last-child {
		border-radius: 2px 2px 0 0;
	}
	.seg.missing {
		height: 0.75rem;
		border: 1px dashed var(--color-text-muted);
		border-bottom: 0;
		border-radius: 2px 2px 0 0;
	}
	.axis {
		margin-top: var(--space-1);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-variant-numeric: tabular-nums;
		line-height: 1.3;
		text-align: center;
	}
	.tick {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 0;
	}
	.tick .y {
		color: var(--color-text);
		white-space: nowrap;
	}
	.readout {
		min-height: 1.5em;
		margin: var(--space-3) 0 0;
		color: var(--color-heading);
		font-size: var(--text-sm);
		font-variant-numeric: tabular-nums;
		line-height: 1.5;
	}

	/* ---------------------------------------------------------------- private work */
	.private-work {
		margin-top: var(--space-6);
	}
	.block-note {
		margin-bottom: var(--space-4);
	}
	.dot {
		flex: none;
		width: var(--legend-dot);
		height: var(--legend-dot);
		border-radius: var(--radius-full);
		background: var(--tone);
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
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 8.5rem), 1fr));
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

	/* ------------------------------------- tables (.data-details, .data-table) */
	.data-details {
		margin-top: var(--space-3);
	}
	.data-table {
		max-width: 36rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.stack {
			transition: none;
		}
	}
</style>
