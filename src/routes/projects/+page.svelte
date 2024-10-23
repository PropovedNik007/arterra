<script>
	import { Breadcrumb, BreadcrumbItem, Card, Button, Toggle, Badge } from 'flowbite-svelte';
	import { ArrowRightOutline } from 'flowbite-svelte-icons';

	import { base } from '$app/paths';

	import Graph from '../../components/Graph.svelte';
  	import graphData from '../../lib/graphs/graph.json';
	import Projects from '../../components/projects/Projects.svelte';
</script>


<svelte:head>
	<title>About</title>
	<meta name="description" content="About this app" />
</svelte:head>


<div class="content">
	<Breadcrumb color="primary" aria-label="Default breadcrumb example">
		<BreadcrumbItem color="primary" href="{base}/" home>Home</BreadcrumbItem>
		<BreadcrumbItem href="{base}/projects">Projects</BreadcrumbItem>
		<!-- <BreadcrumbItem>Flowbite Svelte</BreadcrumbItem> -->
	</Breadcrumb>
</div>

<h1>Vault Graph</h1>
<Graph {graphData} />

<Projects {graphData} />

<style>
	.content {
		padding: 20px;
		margin-top: 5vh;
	}

</style>
