<script lang="ts">
	import { Breadcrumb, BreadcrumbItem, Card, Button, Toggle, Badge } from 'flowbite-svelte';
	import { ArrowRightOutline } from 'flowbite-svelte-icons';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import graphData from '../../lib/graphs/graph.json';

	// Define types for our data
	interface ProjectNode {
		id: string;
		label: string;
		type: string;
		folder: string | null;
		description: string;
		tags: string[];
		img: string | null;
		link: string | null;
		order: number | string;
	}

	interface GraphData {
		nodes: ProjectNode[];
		edges: Array<{
			source: string;
			target: string;
		}>;
	}

	const imageBasePath = `${base}/images/projects/`;
	
	// Define color variants that match the Badge component's expected types
	type ColorVariant = 'info' | 'gray' | 'red' | 'green' | 'yellow' | 'indigo' | 'purple' | 'pink' | 'blue' | 'teal' | 'cyan' | 'orange' | undefined;
	
	// Map our color names to the expected color variants
	const colorMap: Record<string, ColorVariant> = {
		'yellow': 'yellow',
		'red': 'red',
		'green': 'green',
		'blue': 'blue',
		'purple': 'purple',
		'pink': 'pink',
		'indigo': 'indigo',
		'teal': 'teal',
		'cyan': 'cyan',
		'orange': 'orange'
	};
	
	const colors: ColorVariant[] = ['yellow', 'red', 'green', 'blue', 'purple', 'pink', 'indigo', 'purple', 'teal', 'cyan', 'orange'];

	function getColor(index: number): ColorVariant {
		return colors[index % colors.length] || undefined;
	}

	// Sort the nodes by `order`, placing those with `order: 0` at the end
	const typedGraphData = graphData as unknown as GraphData;
	let sortedNodes = [...typedGraphData.nodes]
		.filter(node => node.folder === 'Projects' && node.type === 'file')
		.sort((a, b) => {
			const orderA = Number(a.order) || 0;
			const orderB = Number(b.order) || 0;

			if (orderA === 0 && orderB !== 0) return 1;
			if (orderB === 0 && orderA !== 0) return -1;
			return orderA - orderB;
		});

	function handleProjectClick(node: ProjectNode): void {
		if (node.link) {
			window.open(node.link, '_blank');
		} else {
			goto(`${base}/projects/${node.id}`);
		}
	}
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
				{#if node.tags && node.tags.length > 0}
					{#each node.tags as tag, index}
						<Badge border rounded color={colors[index % colors.length]}>{tag}</Badge>
					{/each}
				{/if}
			</p>

			<br />

			<Button class="bg-primary-600" on:click={() => handleProjectClick(node)}>
				Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
			</Button>
		</Card>
	{/each}
</section>

<style>
	.projects {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		grid-gap: 20px;
	}

	@media (max-width: 768px) {
		.projects {
			grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		}
	}
</style>
