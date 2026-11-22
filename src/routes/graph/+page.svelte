<script>
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { absoluteUrl } from '$lib/seo/site.js';

	const target = `${base}/insights#graph`;

	onMount(() => {
		goto(target, { replaceState: true });
	});
</script>

<svelte:head>
	<title>Knowledge graph moved — Artur Sogomonyan</title>
	<meta name="robots" content="noindex" />
	<link rel="canonical" href={absoluteUrl('/insights')} />
	<meta http-equiv="refresh" content="0; url={target}" />
</svelte:head>

<div class="shell page">
	<h1>The knowledge graph has moved</h1>
	<p>It is now part of the <a href={target}>Insights page</a>.</p>
</div>
