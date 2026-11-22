<script>
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { MONTH_LABELS, formatDate, formatMonth } from '$lib/github/stats.js';

	/**
	 * Public GitHub activity, built from the committed snapshot
	 * (src/lib/github/github.json, refreshed manually with `npm run github:refresh`).
	 * Every chart is server-rendered SVG with a text or table equivalent.
	 */
	/**
	 * data: githubDashboard(snapshot), derived on the server so the raw snapshot
	 * (fork records, per-repo histories) never reaches the page payload; an empty
	 * snapshot renders an empty state.
	 * headingLevel: level of the dashboard's own heading (panels use the next one).
	 * @type {{ data: import('$lib/github/stats.js').GithubDashboardData, headingLevel?: number }}
	 */
	let { data, headingLevel = 2 } = $props();

	const uid = $props.id();
	const ids = {
		title: `${uid}-title`,
		activity: `${uid}-activity`,
		activityDesc: `${uid}-activity-desc`,
		languages: `${uid}-languages`,
		created: `${uid}-created`,
		createdDesc: `${uid}-created-desc`
	};

	let h = $derived(Math.min(Math.max(headingLevel, 1), 5));
	let sub = $derived(`h${h + 1}`);

	// ------------------------------------------------------------ language colours

	/** GitHub-like hues, pulled towards the site palette (tokens where one fits). */
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
		Dockerfile: 'docker'
	});
	/** @param {string | null | undefined} language */
	const tone = (language) => `var(--lang-${LANG_TONE[language ?? ''] ?? 'other'})`;

	/** @param {number} share fraction 0..1 */
	function percent(share) {
		if (!share) return '0%';
		if (share < 0.001) return '<0.1%';
		return `${(share * 100).toFixed(share >= 0.1 ? 0 : 1)}%`;
	}

	/** @param {number} n @param {string} one @param {string} [many] */
	const plural = (n, one, many = `${one}s`) =>
		`${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

	let maxLangRepos = $derived(Math.max(1, ...data.languages.map((l) => l.repos)));
	let unclassified = $derived(
		data.counts.own - data.languages.reduce((sum, l) => sum + l.repos, 0)
	);

	// ------------------------------------------------------------ activity grid

	const CELL = 20;
	const GAP = 3;
	const STEP = CELL + GAP;
	const LABEL_W = 38;
	const TOP = 18;
	const GRID_W = 340;

	let gridHeight = $derived(TOP + data.grid.rows.length * STEP);

	/** Colour level 0–4 on a square-root scale, so small months stay visible. */
	function level(/** @type {number} */ count) {
		if (!count || !data.grid.max) return 0;
		return Math.min(4, Math.max(1, Math.ceil(4 * Math.sqrt(count / data.grid.max))));
	}

	/** Non-zero cells in reading order: the only keyboard stops. */
	let stops = $derived(
		data.grid.rows.flatMap((row, r) =>
			row.months
				.map((cell, c) => ({ ...cell, r, c, year: row.year, total: row.total }))
				.filter((cell) => cell.count > 0)
		)
	);

	let hovered = $state(/** @type {string | null} */ (null));
	let focused = $state(/** @type {string | null} */ (null));
	let roving = $state(0);
	let activeMonth = $derived(hovered ?? focused);
	/** @type {Record<string, SVGRectElement>} */
	const cellRefs = $state({});

	/** @param {string} month */
	function cellInfo(month) {
		const row = data.grid.rows.find((r) => r.months.some((m) => m.month === month));
		const cell = row?.months.find((m) => m.month === month);
		return { count: cell?.count ?? 0, total: row?.total ?? 0, year: row?.year };
	}

	/** @param {string} month @param {number} count */
	const describeCell = (month, count) => `${formatMonth(month)}: ${plural(count, 'commit')}`;

	let readout = $derived.by(() => {
		if (activeMonth) {
			const info = cellInfo(activeMonth);
			return `${describeCell(activeMonth, info.count)} · ${info.year} total ${info.total}`;
		}
		if (data.peak)
			return `Busiest month: ${formatMonth(data.peak.month)} · ${plural(data.peak.count, 'commit')}`;
		return 'No commits in this snapshot.';
	});

	/** @param {number} index */
	function focusStop(index) {
		const stop = stops[index];
		if (!stop) return;
		roving = index;
		cellRefs[stop.month]?.focus();
	}

	/** @param {KeyboardEvent} event @param {number} index */
	function onCellKeydown(event, index) {
		const here = stops[index];
		let next = -1;
		if (event.key === 'ArrowRight') next = Math.min(index + 1, stops.length - 1);
		else if (event.key === 'ArrowLeft') next = Math.max(index - 1, 0);
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = stops.length - 1;
		else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			const dir = event.key === 'ArrowDown' ? 1 : -1;
			let best = -1;
			for (let r = here.r + dir; r >= 0 && r < data.grid.rows.length && best < 0; r += dir) {
				let distance = Infinity;
				stops.forEach((stop, i) => {
					if (stop.r === r && Math.abs(stop.c - here.c) < distance) {
						distance = Math.abs(stop.c - here.c);
						best = i;
					}
				});
			}
			next = best;
		} else return;
		event.preventDefault();
		if (next >= 0) focusStop(next);
	}

	// ------------------------------------------------------------ created per year

	const BAR_W = 340;
	const BAR_H = 150;
	const BAR_TOP = 22;
	const BAR_BOTTOM = 24;
	let maxCreated = $derived(Math.max(1, ...data.created.map((d) => d.count)));
	let band = $derived(data.created.length ? BAR_W / data.created.length : BAR_W);
	let createdTotal = $derived(data.created.reduce((sum, d) => sum + d.count, 0));

	/** @param {number} count */
	const barHeight = (count) => ((BAR_H - BAR_TOP - BAR_BOTTOM) * count) / maxCreated;
</script>

<section class="gh" aria-labelledby={ids.title}>
	<header class="head">
		<p class="eyebrow">GitHub</p>
		<svelte:element this={`h${h}`} id={ids.title} class="title">Public code activity</svelte:element
		>
		{#if !data.isEmpty}
			<p class="meta">
				Snapshot of <a href={data.profileUrl} target="_blank" rel="noopener noreferrer"
					>github.com/{data.login}
					<span aria-hidden="true">↗</span><span class="visually-hidden">
						(opens in a new tab)</span
					></a
				>
				as of <time datetime={data.asOfIso}>{data.asOf}</time>. Own public repositories only; forks
				are counted but left out of every chart.
			</p>
		{/if}
	</header>

	{#if data.isEmpty}
		<EmptyState icon="⌥" title="No GitHub snapshot yet" headingLevel={h + 1}>
			<p>
				Public repository data has not been collected for this build. It is refreshed manually, so
				nothing is shown rather than guessed.
			</p>
		</EmptyState>
	{:else}
		<dl class="kpis">
			<div class="kpi">
				<dt>Own public repositories</dt>
				<dd class="value">{data.counts.own}</dd>
				<dd class="note">created and maintained by {data.login}</dd>
			</div>
			<div class="kpi">
				<dt>Forks</dt>
				<dd class="value">{data.counts.forks}</dd>
				<dd class="note">of other projects, left out of the charts</dd>
			</div>
			<div class="kpi">
				<dt>Commits counted</dt>
				<dd class="value">{data.commits.toLocaleString('en-US')}</dd>
				<dd class="note">attributed to {data.login} on default branches</dd>
			</div>
			<div class="kpi">
				<dt>
					{data.top.languages.length > 1 ? 'Top languages' : 'Top language'}
				</dt>
				<dd class="value lang-value">{data.top.languages.join(' & ') || '—'}</dd>
				<dd class="note">
					{#if data.top.languages.length > 1}
						tied at {plural(data.top.repos, 'repo')} each, by primary language
					{:else if data.top.languages.length === 1}
						primary language of {plural(data.top.repos, 'repo')}
					{:else}
						no language detected
					{/if}
				</dd>
			</div>
			<div class="kpi">
				<dt>Active years</dt>
				<dd class="value">
					{#if data.span}{data.span.first}–{data.span.last}{:else}—{/if}
				</dd>
				<dd class="note">
					{#if data.span}commits in {data.span.activeYears} of {data.span.years} years{:else}no
						commits counted{/if}
				</dd>
			</div>
		</dl>

		<div class="panels">
			<div class="col">
				<!-- Commit activity: year × month grid -->
				<figure class="panel activity" aria-labelledby={ids.activity}>
					<figcaption id={ids.activity}>
						<svelte:element this={sub} class="panel-title">Commits by month</svelte:element>
						<span class="panel-note"
							>{plural(data.commits, 'commit')} across {plural(data.grid.rows.length, 'year')}. Each
							square is one month; brighter means more commits.</span
						>
					</figcaption>

					{#if data.grid.rows.length}
						<svg
							class="chart heatmap"
							viewBox="0 0 {GRID_W} {gridHeight}"
							role="group"
							aria-labelledby={ids.activity}
							aria-describedby={ids.activityDesc}
							onpointerleave={() => (hovered = null)}
						>
							<desc id={ids.activityDesc}
								>Use the arrow keys to move between months with commits. The table below lists the
								same data.</desc
							>
							<g aria-hidden="true" class="axis">
								{#each MONTH_LABELS as label, i (label)}
									<text x={LABEL_W + i * STEP + CELL / 2} y="11" text-anchor="middle"
										>{label.slice(0, 1)}</text
									>
								{/each}
								<text x={GRID_W} y="11" text-anchor="end">Total</text>
								{#each data.grid.rows as row, r (row.year)}
									<text x="0" y={TOP + r * STEP + 14}>{row.year}</text>
									<text class="total" x={GRID_W} y={TOP + r * STEP + 14} text-anchor="end"
										>{row.total}</text
									>
								{/each}
							</g>
							{#each data.grid.rows as row, r (row.year)}
								{#each row.months as cell, c (cell.month)}
									{@const stop = stops.findIndex((s) => s.month === cell.month)}
									{#if stop >= 0}
										<!-- A focusable data point (roving tabindex): keyboard users get the same
									     readout as pointer hover; it has no action, so it is not a button. -->
										<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
										<rect
											bind:this={cellRefs[cell.month]}
											class="cell l{level(cell.count)}"
											class:active={activeMonth === cell.month}
											x={LABEL_W + c * STEP}
											y={TOP + r * STEP}
											width={CELL}
											height={CELL}
											rx="4"
											role="img"
											tabindex={roving === stop ? 0 : -1}
											aria-label={describeCell(cell.month, cell.count)}
											onpointerenter={() => (hovered = cell.month)}
											onfocus={() => {
												focused = cell.month;
												roving = stop;
											}}
											onblur={() => (focused = null)}
											onkeydown={(event) => onCellKeydown(event, stop)}
										/>
									{:else}
										<rect
											class="cell l0"
											class:active={activeMonth === cell.month}
											x={LABEL_W + c * STEP}
											y={TOP + r * STEP}
											width={CELL}
											height={CELL}
											rx="4"
											aria-hidden="true"
											onpointerenter={() => (hovered = cell.month)}
										/>
									{/if}
								{/each}
							{/each}
						</svg>
						<div class="chart-foot">
							<p class="readout" aria-hidden="true">{readout}</p>
							<p class="scale" aria-hidden="true">
								Less
								{#each [0, 1, 2, 3, 4] as l (l)}
									<svg viewBox="0 0 12 12" class="swatch"
										><rect class="cell l{l}" width="12" height="12" rx="3" /></svg
									>
								{/each}
								More
							</p>
						</div>
					{:else}
						<p class="empty-note">
							No commits by {data.login} were found in own public repositories.
						</p>
					{/if}

					<details>
						<summary>Show as table</summary>
						<table>
							<caption class="visually-hidden">Commits per year and the months they fall in</caption
							>
							<thead>
								<tr
									><th scope="col">Year</th><th scope="col" class="num">Commits</th><th scope="col"
										>Months</th
									></tr
								>
							</thead>
							<tbody>
								{#each data.grid.rows as row (row.year)}
									<tr>
										<th scope="row">{row.year}</th>
										<td class="num">{row.total}</td>
										<td
											>{row.months
												.filter((m) => m.count > 0)
												.map((m) => `${MONTH_LABELS[Number(m.month.slice(5)) - 1]} ${m.count}`)
												.join(', ') || '—'}</td
										>
									</tr>
								{/each}
							</tbody>
						</table>
					</details>
				</figure>

				<!-- Languages -->
				<figure class="panel languages" aria-labelledby={ids.languages}>
					<figcaption id={ids.languages}>
						<svelte:element this={sub} class="panel-title">Languages</svelte:element>
						<span class="panel-note"
							>Own repositories by primary language. Byte share is secondary context: notebook
							outputs and generated files inflate byte counts.</span
						>
					</figcaption>
					{#if data.languages.length}
						<ol class="lang-list">
							{#each data.languages as lang (lang.language)}
								<li style:--tone={tone(lang.language)}>
									<span class="lang-name"
										><span class="dot" aria-hidden="true"></span>{lang.language}</span
									>
									<svg
										class="lang-bar"
										viewBox="0 0 100 8"
										preserveAspectRatio="none"
										aria-hidden="true"
									>
										<rect class="track" width="100" height="8" rx="4" />
										<rect
											class="fill"
											width={Math.max(4, (100 * lang.repos) / maxLangRepos)}
											height="8"
											rx="4"
										/>
									</svg>
									<span class="lang-count">{plural(lang.repos, 'repo')}</span>
									<span class="lang-bytes">{percent(lang.byteShare)} of bytes</span>
								</li>
							{/each}
						</ol>
						{#if unclassified > 0}
							<p class="footnote">
								{plural(unclassified, 'repository', 'repositories')} with no detected code.
							</p>
						{/if}
					{:else}
						<p class="empty-note">No languages detected in own public repositories.</p>
					{/if}
					{#if data.languageBytes.length}
						<details>
							<summary>Show byte breakdown</summary>
							<table>
								<caption class="visually-hidden">Share of code bytes by language</caption>
								<thead>
									<tr
										><th scope="col">Language</th><th scope="col" class="num">Bytes</th><th
											scope="col">Share</th
										></tr
									>
								</thead>
								<tbody>
									{#each data.languageBytes as row (row.language)}
										<tr>
											<th scope="row">{row.language}</th>
											<td class="num">{row.bytes.toLocaleString('en-US')}</td>
											<td class="num">{percent(row.share)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</details>
					{/if}
				</figure>
			</div>
			<div class="col">
				<!-- Repositories created per year -->
				<figure class="panel created" aria-labelledby={ids.created}>
					<figcaption id={ids.created}>
						<svelte:element this={sub} class="panel-title">New repositories per year</svelte:element
						>
						<span class="panel-note"
							>{plural(createdTotal, 'own repository', 'own repositories')}, by creation date.</span
						>
					</figcaption>
					{#if data.created.length}
						<svg
							class="chart bars"
							viewBox="0 0 {BAR_W} {BAR_H}"
							role="img"
							aria-labelledby={ids.created}
							aria-describedby={ids.createdDesc}
						>
							<desc id={ids.createdDesc}
								>{data.created.map((d) => `${d.year}: ${d.count}`).join('; ')}</desc
							>
							<line
								class="baseline"
								x1="0"
								x2={BAR_W}
								y1={BAR_H - BAR_BOTTOM}
								y2={BAR_H - BAR_BOTTOM}
							/>
							{#each data.created as d, i (d.year)}
								{@const height = barHeight(d.count)}
								{@const x = i * band + band * 0.18}
								{@const w = band * 0.64}
								{#if d.count > 0}
									<rect class="bar" {x} y={BAR_H - BAR_BOTTOM - height} width={w} {height} rx="3" />
								{/if}
								<text
									class="value"
									x={x + w / 2}
									y={BAR_H - BAR_BOTTOM - height - 6}
									text-anchor="middle">{d.count}</text
								>
								<text class="year" x={x + w / 2} y={BAR_H - 7} text-anchor="middle"
									>{data.created.length > 8 ? `’${String(d.year).slice(2)}` : d.year}</text
								>
							{/each}
						</svg>
						<details>
							<summary>Show as table</summary>
							<table>
								<caption class="visually-hidden">Own repositories created per year</caption>
								<thead
									><tr><th scope="col">Year</th><th scope="col" class="num">Repositories</th></tr
									></thead
								>
								<tbody>
									{#each data.created as d (d.year)}
										<tr><th scope="row">{d.year}</th><td class="num">{d.count}</td></tr>
									{/each}
								</tbody>
							</table>
						</details>
					{:else}
						<p class="empty-note">No own repositories in this snapshot.</p>
					{/if}
				</figure>

				<!-- Most active repositories -->
				<section class="panel repos" aria-labelledby="{uid}-repos">
					<svelte:element this={sub} id="{uid}-repos" class="panel-title"
						>Most active repositories</svelte:element
					>
					<p class="panel-note">Ranked by commits counted above.</p>
					{#if data.mostActive.length}
						<ol class="repo-list">
							{#each data.mostActive as repo (repo.name)}
								<li class="repo">
									<div class="repo-head">
										<a
											href={repo.html_url}
											target="_blank"
											rel="noopener noreferrer"
											class="repo-name"
											>{repo.name}
											<span aria-hidden="true">↗</span><span class="visually-hidden">
												(opens in a new tab)</span
											></a
										>
										<span class="repo-commits">{plural(repo.commits, 'commit')}</span>
									</div>
									{#if repo.description}<p class="repo-desc">{repo.description}</p>{/if}
									<p class="repo-meta">
										{#if repo.language}
											<span class="repo-lang" style:--tone={tone(repo.language)}
												><span class="dot" aria-hidden="true"></span>{repo.language}</span
											>
										{/if}
										<span
											>Last push <time datetime={repo.pushed_at}>{formatDate(repo.pushed_at)}</time
											></span
										>
									</p>
								</li>
							{/each}
						</ol>
					{:else}
						<p class="empty-note">No commits counted yet, so there is no ranking.</p>
					{/if}

					{#if data.recentlyPushed.length}
						<svelte:element this={`h${Math.min(h + 2, 6)}`} class="sub-title"
							>Recently pushed</svelte:element
						>
						<ul class="recent">
							{#each data.recentlyPushed as repo (repo.name)}
								<li>
									<a href={repo.html_url} target="_blank" rel="noopener noreferrer"
										>{repo.name}
										<span aria-hidden="true">↗</span><span class="visually-hidden">
											(opens in a new tab)</span
										></a
									>
									<time datetime={repo.pushed_at}>{formatDate(repo.pushed_at)}</time>
								</li>
							{/each}
						</ul>
					{/if}
				</section>
			</div>
		</div>
	{/if}
</section>

<style>
	.gh {
		/* Language hues: GitHub-like, built only from shared tokens (direct, or
		   color-mix of two tokens, like the --heat-* scale below). */
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
		--lang-other: var(--color-text-muted);

		--heat-0: var(--color-bg-elevated);
		--heat-1: color-mix(in srgb, var(--accent-coral) 32%, var(--color-bg-elevated));
		--heat-2: color-mix(in srgb, var(--accent-coral) 56%, var(--color-bg-elevated));
		--heat-3: color-mix(in srgb, var(--accent-coral) 78%, var(--color-bg-elevated));
		--heat-4: var(--accent-coral-soft);

		min-width: 0;
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

	/* ---------------------------------------------------------------- KPIs */
	.kpis {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 9.5rem), 1fr));
		gap: var(--space-3);
		margin: 0 0 var(--space-5);
	}
	.kpi {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg-raised);
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
		margin-top: var(--space-2);
		color: var(--color-heading);
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
		overflow-wrap: anywhere;
	}
	.kpi .lang-value {
		font-size: var(--text-xl);
	}
	.kpi .note {
		order: 3;
		margin-top: var(--space-2);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		line-height: 1.4;
	}

	/* ---------------------------------------------------------------- panels */
	.panels {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-4);
	}
	@media (min-width: 900px) {
		.panels {
			grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
		}
	}
	.col {
		display: grid;
		align-content: start;
		gap: var(--space-4);
		min-width: 0;
	}
	.panel {
		min-width: 0;
		margin: 0;
		padding: clamp(var(--space-4), 3vw, var(--space-5));
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg-raised);
	}
	figcaption {
		margin-bottom: var(--space-4);
	}
	.panel-title {
		margin: 0 0 var(--space-1);
		color: var(--color-heading);
		font-family: var(--font-body);
		font-size: var(--text-lg);
		font-weight: 650;
	}
	.panel-note,
	.footnote,
	.empty-note {
		display: block;
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		line-height: 1.5;
	}
	.repos > .panel-note {
		margin-bottom: var(--space-4);
	}
	.footnote {
		margin-top: var(--space-3);
	}

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
	.axis .total {
		fill: var(--color-text);
	}

	/* ---------------------------------------------------------------- heatmap */
	.cell {
		stroke: var(--color-border);
		stroke-width: 1;
		transition: stroke 120ms ease;
	}
	.cell.l0 {
		fill: var(--heat-0);
	}
	.cell.l1 {
		fill: var(--heat-1);
	}
	.cell.l2 {
		fill: var(--heat-2);
	}
	.cell.l3 {
		fill: var(--heat-3);
	}
	.cell.l4 {
		fill: var(--heat-4);
	}
	.heatmap rect[tabindex] {
		cursor: default;
	}
	.heatmap rect:focus {
		outline: none;
	}
	.cell.active,
	.heatmap rect:focus-visible {
		stroke: var(--color-heading);
		stroke-width: 2.5;
	}
	.chart-foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2) var(--space-4);
		margin-top: var(--space-3);
	}
	.readout {
		min-height: 1.5em;
		margin: 0;
		color: var(--color-heading);
		font-size: var(--text-sm);
		font-variant-numeric: tabular-nums;
		line-height: 1.5;
	}
	.scale {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	.swatch {
		width: 0.75rem;
		height: 0.75rem;
	}

	/* ---------------------------------------------------------------- languages */
	.lang-list {
		display: grid;
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.lang-list li {
		display: grid;
		grid-template-columns: minmax(0, 9.5rem) minmax(0, 1fr) auto;
		grid-template-areas: 'name bar count' 'name bar bytes';
		align-items: center;
		column-gap: var(--space-3);
		min-width: 0;
	}
	.lang-name {
		grid-area: name;
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
		color: var(--color-heading);
		font-size: var(--text-sm);
		overflow-wrap: anywhere;
	}
	.dot {
		flex: none;
		width: 0.6rem;
		height: 0.6rem;
		border-radius: var(--radius-full);
		background: var(--tone);
	}
	.lang-bar {
		grid-area: bar;
		width: 100%;
		height: 0.5rem;
	}
	.lang-bar .track {
		fill: var(--color-bg-elevated);
	}
	.lang-bar .fill {
		fill: var(--tone);
	}
	.lang-count {
		grid-area: count;
		color: var(--color-text);
		font-size: var(--text-sm);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
	.lang-bytes {
		grid-area: bytes;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
	@media (max-width: 480px) {
		.lang-list li {
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-areas: 'name count' 'bar bytes';
			row-gap: var(--space-1);
		}
	}

	/* ---------------------------------------------------------------- created bars */
	.bars .bar {
		fill: var(--graph-topic);
	}
	.bars .baseline {
		stroke: var(--color-border-strong);
		stroke-width: 1;
	}
	.bars .value {
		fill: var(--color-heading);
	}

	/* ---------------------------------------------------------------- repo list */
	.repo-list {
		display: grid;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.repo {
		min-width: 0;
		padding: var(--space-3) 0;
		border-top: 1px solid var(--color-border);
	}
	.repo:first-child {
		border-top: 0;
		padding-top: 0;
	}
	.repo-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-1) var(--space-3);
	}
	.repo-name {
		min-width: 0;
		font-weight: 650;
		overflow-wrap: anywhere;
	}
	.repo-commits {
		color: var(--color-text);
		font-size: var(--text-sm);
		font-variant-numeric: tabular-nums;
	}
	.repo-desc {
		margin: var(--space-1) 0 0;
		color: var(--color-text);
		font-size: var(--text-sm);
		line-height: 1.5;
		overflow-wrap: anywhere;
	}
	.repo-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-4);
		margin: var(--space-1) 0 0;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		line-height: 1.5;
	}
	.repo-lang {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}
	.sub-title {
		margin: var(--space-5) 0 var(--space-2);
		color: var(--color-text-muted);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.recent {
		display: grid;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: var(--text-sm);
	}
	.recent li {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0 var(--space-3);
		min-width: 0;
	}
	.recent a {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.recent time {
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	/* ---------------------------------------------------------------- tables */
	details {
		margin-top: var(--space-4);
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
		overflow-wrap: anywhere;
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
	th.num,
	.num {
		text-align: right;
	}

	@media (prefers-reduced-motion: reduce) {
		.cell {
			transition: none;
		}
	}
</style>
