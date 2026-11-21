<script>
	import Article from '$lib/components/ui/Article.svelte';
	let { data } = $props();
	let extraMeta = $derived([data.item.printer, data.item.material].filter(Boolean));
</script>

<svelte:head
	><title>{data.item.title} — DIY</title><meta
		name="description"
		content={data.item.excerpt}
	/></svelte:head
>
<Article item={data.item} parentLabel="DIY" parentHref="/diy" {extraMeta} />
