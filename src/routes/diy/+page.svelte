<script>
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import PageIntro from '$lib/components/ui/PageIntro.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import ContentCard from '$lib/components/cards/ContentCard.svelte';
	import GraphView from '$lib/graph/GraphView.svelte';
	let { data } = $props();
</script>

<svelte:head>
	<title>DIY — Artur Sogomonyan</title>
	<meta
		name="description"
		content="Hands-on experiments, miniature work, and 3D-printing notes by Artur Sogomonyan."
	/>
</svelte:head>

<div class="shell page" data-section="diy">
	<Breadcrumb items={[{ label: 'DIY' }]} />
	<PageIntro
		eyebrow="Made, tested, adjusted"
		title="DIY"
		description="Physical work has a different feedback loop. These notes collect miniature batches, print settings, workshop experiments, and what I would change next time."
	/>
	{#if data.items.length}
		<section aria-labelledby="diy-notes">
			<div class="section-head">
				<h2 id="diy-notes">Workshop notes</h2>
				<p>
					{data.items.length}
					{data.items.length === 1 ? 'published note' : 'published notes'}, newest first
				</p>
			</div>
			<div class="grid">
				{#each data.items as item (item.slug)}<ContentCard {item} headingLevel={3} />{/each}
			</div>
		</section>
	{:else}
		<EmptyState title="The bench is quiet.">
			<p>No public DIY notes yet. The section is ready when the next build is.</p>
		</EmptyState>
	{/if}

	{#if data.graphData.nodes.length > 1}
		<section class="map">
			<GraphView graphData={data.graphData} compact title="Where the bench meets the work" />
		</section>
	{/if}
</div>

<style>
	.map {
		margin-top: var(--space-9);
	}
</style>
