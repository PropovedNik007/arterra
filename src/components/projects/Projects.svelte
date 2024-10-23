<script>
	import { Breadcrumb, BreadcrumbItem, Card, Button, Toggle, Badge } from 'flowbite-svelte';
	import { ArrowRightOutline } from 'flowbite-svelte-icons';

	import { base } from '$app/paths';

	import graphData from '../../lib/graphs/graph.json';

	const imageBasePath = `${base}/images/projects/`;

	const colors = ['yellow', 'red', 'green', 'blue', 'purple', 'pink', 'indigo', 'purple', 'teal', 'cyan', 'orange'];

	function getColor(index) {
		return colors[index % colors.length]; // Cycle through the colors
	}

	// Sort the nodes by `order`, placing those with `order: 0` at the end
	let sortedNodes = [...graphData.nodes]
		.filter(node => node.folder === 'Projects' && node.type === 'file') // Filter only relevant nodes
		.sort((a, b) => {
			// Sort by order, putting those with order 0 at the end
			// if (a.order === 0 && b.order !== 0) return 1;
			// if (b.order === 0 && a.order !== 0) return -1;
			const orderA = Number(a.order) || 0;
			const orderB = Number(b.order) || 0;

			// Place nodes with order 0 at the end
			if (orderA === 0 && orderB !== 0) return 1;
			if (orderB === 0 && orderA !== 0) return -1;
			// Sort by ascending order if both have non-zero values
			return orderA - orderB;
		});
</script>

<section class="projects">
	{#each sortedNodes as node (node.id)}
		<Card class="project" img={`${imageBasePath}${node.img}`}>
			<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
				{node.label}
			</h5>
			<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
				{node.description ? node.description : 'No description available.'}
			</p>
			<p>
				<!-- <Badge border rounded color="green">File</Badge> -->
				{#each node.tags as tag, index}
					<Badge border rounded color={getColor(index)}>{tag}</Badge>
				{/each}
			</p>

			<br />

			<Button class="bg-primary-600" href={node.link ?? '#'} target="_blank">
				Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
			</Button>
		</Card>
	{/each}
</section>

<style>
	/* .project {
		padding: 20px;
		background-color: #f9f9f9;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.grid {
		margin-top: 20px;
	} */
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
