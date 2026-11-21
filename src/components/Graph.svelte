<script>
	// @ts-nocheck -- Sigma and graphology are initialized only in the browser
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { itemPath } from '$lib/design/sections.js';

	let { graphData, section = null, compact = false } = $props();
	let container;
	let renderer;
	let graph;
	let query = $state('');
	const interaction = { hovered: null, neighbors: new Set(), matches: null };

	const colors = { projects: '#e17b5a', diy: '#dda544', sport: '#d76060', topic: '#79a8bb' };
	let legendColors = $derived(
		Object.entries(colors).filter(([name]) => graphData.nodes.some((node) => node.section === name))
	);
	const centers = { projects: [-4.2, 1.5], diy: [0, -3.5], sport: [4.2, 1.5] };

	function hrefFor(node) {
		if (node.isTopic) return null;
		return node.isHub
			? `${base}/${node.section}`
			: `${base}${itemPath({ ...node, slug: node.id })}`;
	}

	function hash(value) {
		return [...value].reduce(
			(total, character) => (total * 31 + character.charCodeAt(0)) % 10007,
			7
		);
	}

	function search(event) {
		query = event.currentTarget.value;
		const normalized = query.trim().toLowerCase();
		interaction.matches = normalized
			? new Set(
					graph.filterNodes((node, attributes) =>
						attributes.label.toLowerCase().includes(normalized)
					)
				)
			: null;
		renderer?.refresh();
	}

	onMount(async () => {
		const [{ default: Sigma }, { default: Graph }, { default: forceAtlas2 }] = await Promise.all([
			import('sigma'),
			import('graphology'),
			import('graphology-layout-forceatlas2')
		]);

		graph = new Graph({ type: 'undirected', multi: true });
		const sectionIds = new Set(
			graphData.nodes.filter((node) => !section || node.section === section).map((node) => node.id)
		);
		if (section) {
			for (const edge of graphData.edges) {
				if (sectionIds.has(edge.source) && edge.target.startsWith('topic-'))
					sectionIds.add(edge.target);
				if (sectionIds.has(edge.target) && edge.source.startsWith('topic-'))
					sectionIds.add(edge.source);
			}
		}
		const visible = graphData.nodes.filter((node) => !section || sectionIds.has(node.id));
		const visibleIds = new Set(visible.map((node) => node.id));

		for (const node of visible) {
			const [centerX, centerY] = centers[node.section] ?? [0, 0];
			const seed = hash(node.id);
			const angle = ((seed % 360) / 180) * Math.PI;
			const radius = node.isHub ? 0 : 1.4 + ((seed % 100) / 100) * 2.2;
			graph.addNode(node.id, {
				label: node.label,
				section: node.section,
				isHub: Boolean(node.isHub),
				href: hrefFor(node),
				x: centerX + Math.cos(angle) * radius,
				y: centerY + Math.sin(angle) * radius,
				size: node.isHub ? 16 : node.isTopic ? 5.5 : 8,
				color: colors[node.section]
			});
		}

		graphData.edges.forEach((edge, index) => {
			if (!visibleIds.has(edge.source) || !visibleIds.has(edge.target)) return;
			graph.addEdgeWithKey(`edge-${index}`, edge.source, edge.target, {
				kind: edge.kind,
				size: edge.kind === 'section' ? 1.6 : edge.kind === 'taxonomy' ? 1.25 : 0.8,
				color: edge.kind === 'tag' ? '#755e57' : edge.kind === 'taxonomy' ? '#7c7469' : '#5f6567'
			});
		});

		if (graph.order > 1) {
			forceAtlas2.assign(graph, {
				iterations: compact ? 90 : 180,
				settings: {
					barnesHutOptimize: graph.order > 25,
					gravity: 0.16,
					scalingRatio: compact ? 8 : 11,
					slowDown: 4,
					strongGravityMode: false
				}
			});
		}

		renderer = new Sigma(graph, container, {
			allowInvalidContainer: true,
			defaultEdgeColor: '#5f6567',
			defaultNodeColor: '#e17b5a',
			edgeColor: 'default',
			labelColor: { color: '#e9e5de' },
			labelDensity: compact ? 0.35 : 0.75,
			labelGridCellSize: compact ? 120 : 90,
			labelRenderedSizeThreshold: compact ? 10 : 7,
			zIndex: true,
			nodeReducer(node, data) {
				const result = { ...data };
				const isNeighbor = interaction.neighbors.has(node);
				if (interaction.hovered && node !== interaction.hovered && !isNeighbor) {
					result.color = '#343638';
					result.label = '';
					result.zIndex = 0;
				}
				if (interaction.matches && !interaction.matches.has(node)) {
					result.color = '#343638';
					result.label = '';
				}
				if (node === interaction.hovered || interaction.matches?.has(node)) {
					result.highlighted = true;
					result.forceLabel = true;
					result.zIndex = 2;
				}
				return result;
			},
			edgeReducer(edge, data) {
				const result = { ...data };
				if (interaction.hovered && !graph.hasExtremity(edge, interaction.hovered)) {
					result.hidden = true;
				} else if (interaction.hovered) {
					result.color = '#c4d9e3';
					result.size = Math.max(data.size, 2.2);
				}
				if (interaction.matches) {
					const [source, target] = graph.extremities(edge);
					if (!interaction.matches.has(source) && !interaction.matches.has(target))
						result.hidden = true;
				}
				return result;
			}
		});

		function hover(node = null) {
			interaction.hovered = node;
			interaction.neighbors = node ? new Set(graph.neighbors(node)) : new Set();
			renderer.refresh({ skipIndexation: true });
		}

		renderer.on('enterNode', ({ node }) => hover(node));
		renderer.on('leaveNode', () => hover());
		let suppressClick = false;
		renderer.on('clickNode', ({ node }) => {
			if (suppressClick) {
				suppressClick = false;
				return;
			}
			const href = graph.getNodeAttribute(node, 'href');
			if (href) window.location.href = href;
		});

		let draggedNode = null;
		let dragging = false;
		let dragStart = null;
		renderer.on('downNode', ({ node, event }) => {
			dragging = true;
			draggedNode = node;
			dragStart = { x: event.x, y: event.y };
			graph.setNodeAttribute(node, 'highlighted', true);
		});
		renderer.getMouseCaptor().on('mousemovebody', (event) => {
			if (!dragging || !draggedNode) return;
			if (dragStart && Math.hypot(event.x - dragStart.x, event.y - dragStart.y) > 4) {
				suppressClick = true;
			}
			const position = renderer.viewportToGraph(event);
			graph.mergeNodeAttributes(draggedNode, position);
			event.preventSigmaDefault();
			event.original.preventDefault();
			event.original.stopPropagation();
		});
		renderer.getMouseCaptor().on('mouseup', () => {
			if (draggedNode) graph.removeNodeAttribute(draggedNode, 'highlighted');
			draggedNode = null;
			dragging = false;
			dragStart = null;
			setTimeout(() => {
				suppressClick = false;
			}, 120);
		});

		return () => renderer?.kill();
	});
</script>

<div class:compact class="graph-frame">
	<div class="graph-heading">
		<div>
			<p class="eyebrow">Knowledge map</p>
			<h2>
				{section ? `${section[0].toUpperCase()}${section.slice(1)} connections` : 'Connected work'}
			</h2>
		</div>
		{#if !compact}
			<label
				><span>Find a node</span><input
					type="search"
					value={query}
					oninput={search}
					placeholder="Search projects or notes"
				/></label
			>
		{/if}
	</div>
	<div
		class="sigma-stage"
		bind:this={container}
		aria-label="Interactive portfolio knowledge graph"
	></div>
	{#if !compact}
		<div class="legend">
			{#each legendColors as [name, color] (name)}<span
					><i style={`--legend-color:${color}`}></i>{name}</span
				>{/each}
			<small>Hover to isolate connections · drag to rearrange · click to open</small>
		</div>
	{/if}
</div>

<style>
	.graph-frame {
		overflow: hidden;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		background: #111619;
		box-shadow: var(--shadow-card);
	}
	.graph-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: var(--space-6);
		padding: var(--space-6);
		border-bottom: 1px solid rgba(156, 217, 249, 0.1);
	}
	.graph-heading h2 {
		margin: 0;
		font-size: clamp(1.8rem, 4vw, 2.6rem);
	}
	.graph-heading label {
		display: grid;
		gap: 0.4rem;
		width: min(20rem, 100%);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	.graph-heading input {
		width: 100%;
		border: 1px solid #3c474c;
		border-radius: var(--radius-full);
		background: #0b1013;
		color: #e9e5de;
		padding: 0.7rem 1rem;
	}
	.sigma-stage {
		height: clamp(34rem, 66vh, 48rem);
		background: radial-gradient(circle at center, rgba(57, 91, 104, 0.22), transparent 64%);
		cursor: grab;
	}
	.sigma-stage:active {
		cursor: grabbing;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-6);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		text-transform: capitalize;
	}
	.legend span {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}
	.legend i {
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 50%;
		background: var(--legend-color);
	}
	.legend small {
		margin-left: auto;
		color: var(--color-text-muted);
		text-transform: none;
	}
	.compact .graph-heading {
		padding: var(--space-5);
	}
	.compact .graph-heading h2 {
		font-size: 1.7rem;
	}
	.compact .sigma-stage {
		height: 23rem;
	}
	@media (max-width: 700px) {
		.graph-heading {
			align-items: start;
			flex-direction: column;
		}
		.sigma-stage {
			height: 30rem;
		}
		.legend small {
			width: 100%;
			margin-left: 0;
		}
	}
</style>
