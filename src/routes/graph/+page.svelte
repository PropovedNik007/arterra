<script>
	import { base } from '$app/paths';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import GraphView from '$lib/graph/GraphView.svelte';

	let { data } = $props();

	const count = (/** @type {string} */ kind) =>
		data.graphData.nodes.filter((/** @type {{ kind: string }} */ node) => node.kind === kind)
			.length;
	let stats = $derived([
		{ value: count('item'), label: 'notes' },
		{ value: count('field'), label: 'fields of work' },
		{ value: count('org'), label: 'organisations' },
		{ value: count('topic'), label: 'shared tools & topics' }
	]);
</script>

<svelte:head>
	<title>Knowledge Graph — Artur Sogomonyan</title>
	<meta
		name="description"
		content="An interactive map of Artur Sogomonyan's public projects, DIY builds and sport notes, connected through fields of work, organisations and shared tools."
	/>
</svelte:head>

<div class="shell page graph-page">
	<Breadcrumb items={[{ label: 'Graph' }]} />
	<header class="intro">
		<div>
			<p class="eyebrow">Public knowledge map</p>
			<h1>How the work connects</h1>
			<p class="lede">
				Every published project, build and sport note, linked to the fields of work, organisations
				and tools behind it. Colour marks the kind of node, size how connected it is — hover to
				trace a thread, click a project to open it.
			</p>
			<a class="flow-link" href="{base}/insights#flow"
				>See the work as a flow <span aria-hidden="true">→</span></a
			>
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
	<GraphView graphData={data.graphData} eyebrow="Interactive" title="Explore the map" />
</div>

<style>
	/* Keep the intro short so the graph — the point of this page — starts above the fold. */
	.graph-page {
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
	.flow-link {
		display: inline-block;
		margin-top: var(--space-3);
		font-size: var(--text-sm);
		font-weight: 650;
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
</style>
