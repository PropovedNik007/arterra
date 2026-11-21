<script>
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import PageIntro from '$lib/components/ui/PageIntro.svelte';
	import ContentCard from '$lib/components/cards/ContentCard.svelte';
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
		<div class="grid">
			{#each data.items as item (item.slug)}<ContentCard {item} />{/each}
		</div>
	{:else}
		<div class="empty">
			<span aria-hidden="true">✦</span>
			<h2>The bench is quiet.</h2>
			<p>No public DIY notes yet. The section is ready when the next build is.</p>
		</div>
	{/if}
</div>

<style>
	.empty {
		padding: var(--space-8);
		border: 1px dashed var(--color-border-strong);
		border-radius: var(--radius-xl);
		text-align: center;
	}
	.empty span {
		color: var(--accent);
		font-size: 2rem;
	}
	.empty h2 {
		margin: var(--space-4) 0 var(--space-2);
	}
	.empty p {
		color: var(--color-text-muted);
	}
</style>
