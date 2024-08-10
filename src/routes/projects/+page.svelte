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
		<BreadcrumbItem href="{base}/projects">Projects</BreadcrumbItem>
		<!-- <BreadcrumbItem>Flowbite Svelte</BreadcrumbItem> -->
	</Breadcrumb>
</div>

<section class="projects">
	<Card img={rail4future} class="project">
		<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Noteworthy technology acquisitions 2021</h5>
		<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.</p>
		<Button class="bg-primary-600" href="https://www.rail4future.com/en/" target="_blank">
		Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
		</Button>
	</Card>
	<Card img={rail4future} class="project">
		<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Noteworthy technology acquisitions 2021</h5>
		<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.</p>
		<Button class="bg-primary-600">
		Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
		</Button>
	</Card>
	<Card img={rail4future} class="project">
		<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Noteworthy technology acquisitions 2021</h5>
		<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.</p>
		<Button class="bg-primary-600">
		Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
		</Button>
	</Card>
	<Card img={rail4future} class="project">
		<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Noteworthy technology fffffffffffffffffffffacquisitions 2021</h5>
		<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">Here are the biggest enffffffffffffffffffffffffffffffffgfgfg gfgfgfgf g fgf fg gf gfg gffffffffffffffffterprise technology acquisitions of 2021 so far, in reverse chronological order.</p>
		<Button class="bg-primary-600">
		Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
		</Button>
	</Card>
</section>

<style>
	.content {
		padding: 20px;
		margin-top: 5vh;
	}

	.projects {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		grid-gap: 20px;
		/* justify-content: center; */
		/* align-items: center; */
		/* height: 100vh; */
	}


</style>
