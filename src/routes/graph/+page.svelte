<script>
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import PageIntro from '$lib/components/ui/PageIntro.svelte';
	import Graph from '../../components/Graph.svelte';
	let { data } = $props();
</script>

<svelte:head
	><title>Knowledge Graph — Artur Sogomonyan</title><meta
		name="description"
		content="Explore the connections between Artur Sogomonyan's public projects and field notes."
	/></svelte:head
>
<div class="shell page">
	<Breadcrumb items={[{ label: 'Graph' }]} /><PageIntro
		eyebrow="Public knowledge map"
		title="Graph"
		description="A focused map of the published portfolio. Section hubs organize the work; technology nodes reveal the meaningful connections between projects."
	/><Graph graphData={data.graphData} />
</div>
