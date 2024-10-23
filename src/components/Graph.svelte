<script context="module">
	export const ssr = false;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import chroma from 'chroma-js';

	let container;

	export let graphData;

	// State management similar to the example
	interface State {
		hoveredNode?: string;
		searchQuery: string;
		selectedNode?: string;
		suggestions?: Set<string>;
		hoveredNeighbors?: Set<string>;
	}

	const state: State = { searchQuery: '' };

	onMount(async () => {
		if (typeof window !== 'undefined') {
			// Dynamically import Sigma.js and related libraries only in the browser
			const { default: Sigma } = await import('sigma');
			const { default: Graph } = await import('graphology');
			const { default: ForceSupervisor } = await import('graphology-layout-force/worker');

			const graph = new Graph();

			// Add nodes from graphData
			graphData.nodes.forEach((node) => {
				if (node.type !== 'folder') {
					const nodeAttributes = {
						label: node.id,
						x: Math.random(),
						y: Math.random(),
						size: 10,
						color: '#f00',
						labelColor: '#ffffff', // Set label color to white
						labelSize: 24, // Label size
						highlightedColor: '#ff0', // Color on hover
						forceLabel: true // Ensure label is always displayed
					};

					if (node.folder?.startsWith('Projects')) {
						nodeAttributes.color = '#009688';
						nodeAttributes.y = 0;
					} else if (node.folder?.startsWith('Fields')) {
						nodeAttributes.color = '#546E7A';
						nodeAttributes.y = 2;
					} else {
						nodeAttributes.color = '#425B67';
						nodeAttributes.size = 5;
						nodeAttributes.y = 1;
					}

					graph.addNode(node.id, nodeAttributes);
				}
			});

			// Add edges from graphData
			graphData.edges.forEach((edge) => {
				if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
					graph.addEdge(edge.source, edge.target, {
						color: 'rgba(156,217,249,0.1)', // Edge color
						size: 1 // Edge thickness
					});
				}
			});

			// Apply a layout algorithm
			// const layout = new ForceSupervisor(graph, {
			// 	isNodeFixed: (_, attr) => attr.highlighted
			// });
			// layout.start();
			const layout = new ForceSupervisor(graph, {
				// Adjust the force-directed layout settings
				settings: {
					// strongGravityMode: true, // Helps keep the nodes from drifting away
					gravity: 0.01, // Controls the strength of the "gravity" that attracts nodes
					// scalingRatio: 10, // Controls the repulsion between nodes (higher values push nodes further apart)
					// nodeStrength: -50, // Increases the repulsion force between nodes
					// centerGravity: 0.1, // Pulls nodes towards the center
					// maxIterations: 1000 // Ensure that the layout has enough iterations to settle
				},
				isNodeFixed: (_, attr) => attr.highlighted
			});
			layout.start();

			// Create the sigma renderer with reducers
			const renderer = new Sigma(graph, container, {
				enableEdgeEvents: true,
				allowInvalidContainer: true,
				nodeReducer: (node, data) => {
					const res: Partial<NodeDisplayData> = { ...data };
					res.color = chroma(res.color).alpha(0.8).hex();
					res.label = data.label;
					res.labelColor = '#ffffff'; // Ensure label color is white
					res.forceLabel = true; // Force labels to be shown

					if (
						state.hoveredNeighbors &&
						!state.hoveredNeighbors.has(node) &&
						state.hoveredNode !== node
					) {
						res.label = '';
						res.color = chroma(res.color).alpha(0.1).hex();
					}

					if (state.selectedNode === node) {
						res.highlighted = true;
					} else if (state.suggestions) {
						if (state.suggestions.has(node)) {
							res.forceLabel = true;
						} else {
							res.label = '';
							res.color = chroma(res.color).alpha(0.1).hex();
						}
					}

					return res;
				},
				edgeReducer: (edge, data) => {
					const res: Partial<EdgeDisplayData> = { ...data };

					if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
						res.hidden = true;
					}

					if (
						state.suggestions &&
						(!state.suggestions.has(graph.source(edge)) ||
							!state.suggestions.has(graph.target(edge)))
					) {
						res.hidden = true;
					}

					return res;
				}
			});

			// Implement hover and selection logic
			function setHoveredNode(node?: string) {
				if (node) {
					state.hoveredNode = node;
					state.hoveredNeighbors = new Set(graph.neighbors(node));
				} else {
					state.hoveredNode = undefined;
					state.hoveredNeighbors = undefined;
				}
				renderer.refresh({ skipIndexation: true });
			}

			// Drag'n'drop feature
			let draggedNode: string | null = null;
			let isDragging = false;

			renderer.on('downNode', (e) => {
				isDragging = true;
				draggedNode = e.node;
				graph.setNodeAttribute(draggedNode, 'highlighted', true);
			});

			renderer.getMouseCaptor().on('mousemovebody', (e) => {
				if (!isDragging || !draggedNode) return;

				const pos = renderer.viewportToGraph(e);
				graph.setNodeAttribute(draggedNode, 'x', pos.x);
				graph.setNodeAttribute(draggedNode, 'y', pos.y);

				e.preventSigmaDefault();
				e.original.preventDefault();
				e.original.stopPropagation();
			});

			renderer.getMouseCaptor().on('mouseup', () => {
				if (draggedNode) {
					graph.removeNodeAttribute(draggedNode, 'highlighted');
				}
				isDragging = false;
				draggedNode = null;
			});

			renderer.getMouseCaptor().on('mousedown', () => {
				if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
			});

			renderer.on('enterNode', ({ node }) => {
				setHoveredNode(node);
			});

			renderer.on('leaveNode', () => {
				setHoveredNode(undefined);
			});

			return () => {
				renderer.kill();
			};
		}
	});
</script>

<div bind:this={container} style="width: 100%; height: 500px;"></div>

<style>
	.sigma-node {
		cursor: pointer;
	}

	.sigma-node.highlighted {
		stroke: #ffffff;
		stroke-width: 2px;
	}

	.sigma-edge {
		cursor: pointer;
	}

	.sigma-labels {
		font-size: 10px;
		color: white;
		stroke: white;
	}
</style>
