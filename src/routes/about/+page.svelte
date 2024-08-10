<script>
	import { Breadcrumb, BreadcrumbItem, Card, Button, Toggle } from 'flowbite-svelte';
	import { ArrowRightOutline } from 'flowbite-svelte-icons';

	import rail4future from '$lib/images/rail4future.jpg';

	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>About</title>
	<meta name="description" content="About this app" />
</svelte:head>

<div class="content">
	<Breadcrumb color="primary" aria-label="Default breadcrumb example">
		<BreadcrumbItem color="primary" href="{base}/" home>Home</BreadcrumbItem>
		<BreadcrumbItem href="{base}/about">About</BreadcrumbItem>
		<!-- <BreadcrumbItem>Flowbite Svelte</BreadcrumbItem> -->
	</Breadcrumb>
	<h1>About this app</h1>

	<p>
		Hi I'm Artur and this is my Potfolio.
	</p>
</div>

<style>
	.content {
		padding: 20px;
		margin-top: 5vh;
	}
</style>
