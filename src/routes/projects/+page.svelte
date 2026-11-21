<script>
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import PageIntro from '$lib/components/ui/PageIntro.svelte';
	import ContentCard from '$lib/components/cards/ContentCard.svelte';
	import Graph from '../../components/Graph.svelte';

	let { data } = $props();
	let selectedTag = $state('all');
	let tags = $derived([...new Set(data.items.flatMap((item) => item.tags))].sort());
	let visible = $derived(
		selectedTag === 'all'
			? data.items
			: data.items.filter((item) => item.tags.includes(selectedTag))
	);
</script>

<svelte:head>
	<title>Projects — Artur Sogomonyan</title>
	<meta
		name="description"
		content="Applied AI, machine learning, computer vision, RAG, and full-stack engineering projects by Artur Sogomonyan."
	/>
</svelte:head>

<div class="shell page" data-section="projects">
	<Breadcrumb items={[{ label: 'Projects' }]} />
	<PageIntro
		eyebrow="Selected systems"
		title="Projects"
		description="Case studies across applied AI, computer vision, document intelligence, data products, and the interfaces that make them useful."
	/>

	<div class="filters" aria-label="Filter projects by technology">
		<button class:active={selectedTag === 'all'} onclick={() => (selectedTag = 'all')}
			>All <span>{data.items.length}</span></button
		>
		{#each tags as tag (tag)}
			<button class:active={selectedTag === tag} onclick={() => (selectedTag = tag)}>{tag}</button>
		{/each}
	</div>

	<div class="grid project-grid">
		{#each visible as item (item.slug)}<ContentCard {item} />{/each}
	</div>

	<section class="graph-section">
		<Graph graphData={data.graphData} section="projects" compact />
	</section>
</div>

<style>
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-bottom: var(--space-7);
		padding-bottom: var(--space-5);
		border-bottom: 1px solid var(--color-border);
	}
	.filters button {
		padding: 0.45rem 0.8rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: var(--text-xs);
	}
	.filters button:hover,
	.filters button.active {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--color-heading);
	}
	.filters span {
		margin-left: 0.3rem;
		opacity: 0.6;
	}
	.graph-section {
		margin-top: var(--space-9);
	}
</style>
