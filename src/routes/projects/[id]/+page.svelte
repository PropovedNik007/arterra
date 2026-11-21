<script>
	import Article from '$lib/components/ui/Article.svelte';
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.item.title} — Artur Sogomonyan</title>
	<meta name="description" content={data.item.excerpt} />
</svelte:head>

<Article item={data.item} parentLabel="Projects" parentHref="/projects" context={data.context} />
