<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { Button } from 'flowbite-svelte';
	import { ArrowLeftOutline } from 'flowbite-svelte-icons';
	import { goto } from '$app/navigation';
	import graphData from '../../../lib/graphs/graph.json';

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

	let projectId = $page.params.id;
	let projectContent = '';
	let projectData: ProjectNode | null = null;
	let loading = true;
	let error: string | null = null;

	onMount(async () => {
		try {
			// Find the project in the graph data
			const typedGraphData = graphData as unknown as GraphData;
			projectData = typedGraphData.nodes.find(node => node.id === projectId) || null;
			
			if (!projectData) {
				error = 'Project not found';
				loading = false;
				return;
			}

			// Fetch the markdown content from the server
			const response = await fetch(`${base}/api/projects/${projectId}`);
			
			if (!response.ok) {
				throw new Error(`Failed to fetch project content: ${response.statusText}`);
			}
			
			// Get the raw text content
			projectContent = await response.text();
			loading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unknown error occurred';
			loading = false;
		}
	});

	function goBack() {
		goto(`${base}/projects`);
	}
</script>

<div class="container content mx-auto px-4 py-8">
	<Button color="dark" class="mb-6" on:click={goBack}>
		<ArrowLeftOutline class="w-5 h-5 mr-2" />
		Back to Projects
	</Button>

	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
		</div>
	{:else if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
			<strong class="font-bold">Error!</strong>
			<span class="block sm:inline"> {error}</span>
		</div>
	{:else}
		{#if projectData}
			<article class="prose prose-lg dark:prose-invert max-w-none">
				<h1>{projectData.label}</h1>
				
				{#if projectData.description}
					<p class="lead">{projectData.description}</p>
				{/if}
				
				{#if projectData.tags && projectData.tags.length > 0}
					<div class="flex flex-wrap gap-2 my-4">
						{#each projectData.tags as tag}
							<span class="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-primary-900 dark:text-primary-300">
								{tag}
							</span>
						{/each}
					</div>
				{/if}
				
				<div class="mt-8 whitespace-pre-wrap">
					{projectContent}
				</div>
			</article>
		{/if}
	{/if}
</div>

<style>
	.content {
		padding: 20px;
		margin-top: 5vh;
	}
	:global(.prose) {
		max-width: 100%;
	}
	
	:global(.prose img) {
		margin: 2rem auto;
		border-radius: 0.5rem;
	}
	
	:global(.prose a) {
		color: var(--color-primary-600);
		text-decoration: none;
	}
	
	:global(.prose a:hover) {
		text-decoration: underline;
	}
</style> 