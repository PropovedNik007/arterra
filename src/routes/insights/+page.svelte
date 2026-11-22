<script>
	import { sitePath } from '#lib/paths.js';
	import Breadcrumb from '#lib/components/ui/Breadcrumb.svelte';
	import ToolpathOrnament from '#lib/components/ui/ToolpathOrnament.svelte';
	import GraphView from '#lib/graph/GraphView.svelte';
	import WorkSankey from '#lib/components/charts/WorkSankey.svelte';
	import SkillsRadar from '#lib/components/charts/SkillsRadar.svelte';
	import GithubDashboard from '#lib/components/charts/GithubDashboard.svelte';
	import OrgActivity from '#lib/components/charts/OrgActivity.svelte';
	import { cv } from '#lib/content/cv.js';

	let { data } = $props();

	const sections = [
		{ id: 'graph', label: 'Knowledge graph' },
		{ id: 'flow', label: 'How the work flows' },
		{ id: 'skills', label: 'Skills profile' },
		{ id: 'github', label: 'On GitHub' }
	];

	const count = (/** @type {string} */ kind) =>
		data.graphData.nodes.filter((/** @type {{ kind: string }} */ node) => node.kind === kind)
			.length;

	let stats = $derived([
		{ value: count('item'), label: 'notes' },
		{ value: data.summary.fields, label: 'fields of work' },
		{ value: count('org'), label: 'organisations' },
		{ value: data.summary.repos, label: 'public repositories' },
		...(data.privateWork.isEmpty
			? []
			: [
					{
						value: data.summary.commitsAll.toLocaleString('en-US'),
						label: 'commits, public + private'
					}
				])
	]);
</script>

<svelte:head>
	<title>Insights — Artur Sogomonyan</title>
	<meta
		name="description"
		content="Artur Sogomonyan's work as data: an interactive knowledge graph of projects, fields of work and organisations, a project flow chart, a self-assessed skills profile, and GitHub activity: public and private commits per month plus combined totals from work in private repositories."
	/>
</svelte:head>

<div class="shell page">
	<Breadcrumb items={[{ label: 'Insights' }]} />
	<header class="intro">
		<div class="intro-ornament">
			<ToolpathOrnament preset="star" tone="field" align="right" opacity={0.18} />
		</div>
		<div>
			<p class="eyebrow">Charts &amp; numbers</p>
			<h1>Insights</h1>
			<p class="lede">
				The same work, seen as data: a map of how projects, fields of work and organisations
				connect, where the projects sit across fields, how I rate my own skills, and what my code
				history looks like, including work in private repositories.
			</p>
		</div>
		<dl class="stats stat-list">
			{#each stats as stat (stat.label)}
				<div class="stat">
					<dt class="stat-label">{stat.label}</dt>
					<dd class="stat-value">{stat.value}</dd>
				</div>
			{/each}
		</dl>
	</header>

	<nav class="jump" aria-label="On this page">
		<ol>
			{#each sections as section, index (section.id)}
				<li>
					<a href="#{section.id}"
						><span class="index-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span
						>{section.label}</a
					>
				</li>
			{/each}
		</ol>
	</nav>

	<section id="graph" class="insight" aria-label="Knowledge graph">
		<GraphView
			graphData={data.graphData}
			eyebrow="Interactive knowledge graph"
			title="How the work connects"
		/>
	</section>

	<section id="flow" class="insight" aria-labelledby="flow-title">
		<div class="section-head">
			<h2 id="flow-title">How the work flows</h2>
			<p>
				Domains → fields of work → projects, built from the
				<a href="#graph">knowledge graph</a> above.
			</p>
		</div>
		<WorkSankey graphData={data.graphData} title="Domains, fields and projects" />
	</section>

	<section id="skills" class="insight" aria-labelledby="skills-title">
		<div class="section-head">
			<h2 id="skills-title">Skills profile</h2>
			<p>Where experience and interest line up — and where they don't.</p>
		</div>
		<div class="skills-layout">
			<div class="skills-copy">
				<p>
					Two self-assessed scores per area, from 0 to {cv.radar.max}: how much hands-on
					<strong>experience</strong> I have, and how much <strong>interest</strong> I have in doing more
					of it. These are my own ratings, not test results.
				</p>
				<p>
					Use the legend to show one series at a time. Hover an area, or focus the chart and use the
					arrow keys, to read both scores — or open the table under the chart.
				</p>
				<a class="entry-link" href={sitePath('/about')}
					>Experience and toolkit on the About page <span aria-hidden="true">→</span></a
				>
			</div>
			<div class="skills-chart">
				<SkillsRadar radar={cv.radar} />
			</div>
		</div>
	</section>

	<section id="github" class="insight" aria-labelledby="github-title">
		<div class="section-head">
			<h2 id="github-title">On GitHub</h2>
			<p>
				All my commits per month, public and private, then my work in private repositories as
				combined totals, and my public repositories. Each snapshot carries its own date.
			</p>
		</div>
		<div class="github-stack">
			<OrgActivity data={data.privateWork} headingLevel={3} />
			<GithubDashboard data={data.github} headingLevel={3} />
		</div>
	</section>
</div>

<style>
	/* Short intro with the numbers on the right, so the graph starts near the
	   fold: the same page padding and breadcrumb as every page, with the
	   compact page-title size (--heading-page-compact). */
	.intro {
		position: relative;
		isolation: isolate;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: end;
		gap: var(--space-5) var(--space-8);
		margin: var(--space-5) 0 var(--space-6);
	}
	/* Star rosette in the empty corner above the stats, so the small stat
	   labels sit on plain background; clear of text, it can be at 0.18. */
	.intro-ornament {
		position: absolute;
		top: -5.5rem;
		right: 0;
		bottom: 4rem;
		width: min(28rem, 100%);
		pointer-events: none;
	}
	.intro h1 {
		margin-bottom: var(--space-3);
		font-size: var(--heading-page-compact);
	}
	.intro .lede {
		max-width: 44rem;
		margin: 0;
	}
	@media (max-width: 800px) {
		.intro {
			grid-template-columns: 1fr;
		}
		/* Stacked layout: a smaller rosette in the corner beside the short
		   title, above the lede. */
		.intro-ornament {
			top: -2.75rem;
			bottom: auto;
			width: min(10rem, 45%);
			aspect-ratio: 1;
		}
	}
	/* Uppercase labels are wide: wrap the numbers into rows so the lede keeps
	   its measure. */
	.stats {
		display: flex;
		flex-wrap: wrap;
		max-width: 28rem;
		gap: var(--space-4) var(--space-6);
	}

	.jump {
		margin-bottom: var(--space-7);
		padding-block: var(--space-3);
		border-block: 1px solid var(--color-border);
	}
	.jump ol {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-6);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.jump a {
		display: inline-flex;
		align-items: baseline;
		gap: var(--space-2);
		padding-block: var(--space-1);
		color: var(--color-text);
		font-size: var(--text-sm);
		font-weight: 700;
	}
	.jump a:hover {
		color: var(--color-heading);
	}

	.insight {
		/* Clear the sticky header when reached from the jump list. */
		scroll-margin-top: calc(var(--header-h) + var(--space-4));
		min-width: 0;
	}
	.insight + .insight {
		margin-top: var(--space-9);
	}

	.github-stack {
		display: grid;
		gap: var(--space-8);
		min-width: 0;
	}

	.skills-layout {
		display: grid;
		grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
		gap: var(--space-6) var(--space-8);
		align-items: center;
	}
	.skills-copy p {
		max-width: var(--reading-width);
		margin: 0 0 var(--space-4);
		color: var(--color-text);
	}
	.skills-copy strong {
		color: var(--color-heading);
	}
	.skills-chart {
		width: 100%;
		max-width: 36rem;
		min-width: 0;
		justify-self: end;
	}
	.entry-link {
		display: inline-block;
		font-size: var(--text-sm);
		font-weight: 700;
	}
	@media (max-width: 860px) {
		.skills-layout {
			grid-template-columns: minmax(0, 1fr);
		}
		.skills-chart {
			justify-self: start;
		}
	}
</style>
