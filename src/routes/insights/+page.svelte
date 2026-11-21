<script>
	import { base } from '$app/paths';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import WorkSankey from '$lib/components/charts/WorkSankey.svelte';
	import SkillsRadar from '$lib/components/charts/SkillsRadar.svelte';
	import GithubDashboard from '$lib/components/charts/GithubDashboard.svelte';
	import { cv } from '$lib/content/cv.js';

	let { data } = $props();

	const sections = [
		{ id: 'flow', label: 'How the work flows' },
		{ id: 'skills', label: 'Skills profile' },
		{ id: 'github', label: 'On GitHub' }
	];

	let stats = $derived([
		{ value: data.summary.projects, label: 'projects & builds' },
		{ value: data.summary.fields, label: 'fields of work' },
		{ value: cv.radar.axes.length, label: 'skill areas' },
		{ value: data.summary.repos, label: 'public repositories' }
	]);
</script>

<svelte:head>
	<title>Insights — Artur Sogomonyan</title>
	<meta
		name="description"
		content="Charts of Artur Sogomonyan's work: how published projects flow through fields of work, a self-assessed skills profile, and public GitHub activity."
	/>
</svelte:head>

<div class="shell page insights-page">
	<Breadcrumb items={[{ label: 'Insights' }]} />
	<header class="intro">
		<div>
			<p class="eyebrow">Charts &amp; numbers</p>
			<h1>Insights</h1>
			<p class="lede">
				The same public work, seen as data: where the projects sit across fields of work, how I rate
				my own skills, and what the public code history looks like. Every chart has a table
				underneath.
			</p>
		</div>
		<dl class="stats">
			{#each stats as stat (stat.label)}
				<div>
					<dt>{stat.label}</dt>
					<dd>{stat.value}</dd>
				</div>
			{/each}
		</dl>
	</header>

	<nav class="jump" aria-label="On this page">
		<ol>
			{#each sections as section, index (section.id)}
				<li>
					<a href="#{section.id}"
						><span class="jump-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span
						>{section.label}</a
					>
				</li>
			{/each}
		</ol>
	</nav>

	<section id="flow" class="insight" aria-labelledby="flow-title">
		<div class="section-head">
			<h2 id="flow-title">How the work flows</h2>
			<p>
				Domains → fields of work → projects, built from the
				<a href="{base}/graph">knowledge graph</a>.
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
				<a class="entry-link" href="{base}/about"
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
			<p>A manually refreshed snapshot of public repositories.</p>
		</div>
		<GithubDashboard data={data.github} headingLevel={3} />
	</section>
</div>

<style>
	/* Intro mirrors /graph: short, with the numbers on the right. */
	.insights-page {
		padding-top: clamp(1.5rem, 4vw, 3rem);
	}
	.intro {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: end;
		gap: var(--space-5) var(--space-8);
		margin: var(--space-5) 0 var(--space-6);
	}
	.intro h1 {
		margin-bottom: var(--space-3);
		font-size: clamp(2.2rem, 4.6vw, 3.6rem);
	}
	.intro .lede {
		max-width: 44rem;
		margin: 0;
	}
	@media (max-width: 800px) {
		.intro {
			grid-template-columns: 1fr;
		}
	}
	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3) var(--space-6);
		margin: 0;
	}
	.stats div {
		display: flex;
		flex-direction: column-reverse;
	}
	.stats dd {
		margin: 0;
		color: var(--color-heading);
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	.stats dt {
		margin-top: var(--space-1);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		letter-spacing: 0.04em;
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
		font-weight: 650;
	}
	.jump a:hover {
		color: var(--color-heading);
	}
	.jump-index {
		color: var(--accent);
		font-size: var(--text-xs);
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.08em;
	}

	.insight {
		/* Clear the sticky header when reached from the jump list. */
		scroll-margin-top: calc(var(--header-h) + var(--space-4));
		min-width: 0;
	}
	.insight + .insight {
		margin-top: var(--space-9);
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
		font-weight: 650;
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
