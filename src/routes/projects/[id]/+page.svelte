<script>
	import Article from '#lib/components/ui/Article.svelte';
	import MiniSlicer from '#lib/components/slicer/MiniSlicer.svelte';
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.item.title} — Artur Sogomonyan</title>
	<meta name="description" content={data.item.excerpt} />
</svelte:head>

<!-- Right after the text it illustrates, before gallery and related work. -->
{#snippet slicer()}
	<MiniSlicer />
{/snippet}

<Article
	item={data.item}
	parentLabel="Projects"
	parentHref="/projects"
	context={data.context}
	afterBody={data.item.slug === 'flexam' ? slicer : undefined}
/>
