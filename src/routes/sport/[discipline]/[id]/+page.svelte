<script>
	// @ts-nocheck -- sport item discipline is validated in the matching server load
	import Article from '#lib/components/ui/Article.svelte';
	import { DISCIPLINE_META } from '#lib/design/sections.js';
	let { data } = $props();
	let meta = $derived(DISCIPLINE_META[data.item.discipline]);
	let extraMeta = $derived(
		[
			data.item.region,
			data.item.distance_km ? `${data.item.distance_km} km` : null,
			data.item.gain_m ? `${data.item.gain_m} m gain` : null
		].filter(Boolean)
	);
</script>

<svelte:head>
	<title>{data.item.title} — {meta.label} — Artur Sogomonyan</title>
	<meta name="description" content={data.item.excerpt} />
</svelte:head>

<Article
	item={data.item}
	parentLabel={meta.label}
	parentHref={meta.path}
	trail={[
		{ label: 'Sport', href: '/sport' },
		{ label: meta.label, href: meta.path }
	]}
	{extraMeta}
	context={data.context}
/>
