<script>
	import { Breadcrumb, BreadcrumbItem, Card, Button, Toggle, Badge } from 'flowbite-svelte';
	import { ArrowRightOutline } from 'flowbite-svelte-icons';

	import { base } from '$app/paths';

	import rail4future from '$lib/images/projects/rail4future.jpg';
	import susteam from '$lib/images/projects/susteam.png';
	import cryptex from '$lib/images/projects/cryptex.png';
	import glosav from '$lib/images/projects/glosav.jpg';


</script>


<section class="projects">
	<Card img={rail4future} class="project">
		<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Rail4Future Data Science Project 2024</h5>
		<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
			Analyzing rail irregularities for industrial partners Siemens and ÖBB.
		</p>
		<p>
			<Badge border rounded color="yellow">LSTM</Badge>
			<Badge border rounded color="red">Tensorflow</Badge>
			<Badge border rounded color="green">Data Science</Badge>
		</p>
		<br>

		<Button class="bg-primary-600" href="https://www.rail4future.com/en/" target="_blank">
		Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
		</Button>
	</Card>
	<Card img={susteam} class="project">
		<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">susteam</h5>
		<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">Full-stack development of ESG platform. Generation of the Reports for hospitality industry.</p>
		
		<p>
			<Badge border rounded color="yellow">React.js</Badge>
			<Badge border rounded color="blue">FastAPI</Badge>
			<Badge border rounded color="red">Bert, LLama3</Badge>
		</p>
		<br>
		<Button class="bg-primary-600" href="https://susteam.at/" target="_blank">
		Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
		</Button>
	</Card>
	<Card img={cryptex} class="project">
		<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Cryptex 2024</h5>
		<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.</p>
		<Button class="bg-primary-600">
		Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
		</Button>
	</Card>
	<Card img={glosav} class="project">
		<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Machine learning analyst — GLOSAV</h5>
		<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">Engineered a sophisticated algorithm to detect railway routes with object detection and tracking mechanisms. Developed a robust
			way to track obstacles on the rails.</p>
		<p>
			<Badge border rounded color="yellow">YOLOv5</Badge>
			<Badge border rounded color="blue">OpenCV</Badge>
			<Badge border rounded color="red">NumPy</Badge>
		</p>
		<br>
		<Button class="bg-primary-600">
		Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
		</Button>
	</Card>
</section>

<style>
	.projects {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		grid-gap: 20px;
		/* justify-content: center; */
		/* align-items: center; */
		/* height: 100vh; */
	}

	@media (max-width: 768px) {
		.projects {
			grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		}
	}


</style>