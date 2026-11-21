import graphData from '$lib/graphs/graph.json';
export const prerender = true;
export function load() {
	const projectIds = new Set(
		graphData.nodes.filter((node) => node.section === 'projects').map((node) => node.id)
	);
	for (const edge of graphData.edges) {
		if (projectIds.has(edge.source) && edge.target.startsWith('topic-'))
			projectIds.add(edge.target);
		if (projectIds.has(edge.target) && edge.source.startsWith('topic-'))
			projectIds.add(edge.source);
	}
	return {
		graphData: {
			nodes: graphData.nodes.filter((node) => projectIds.has(node.id)),
			edges: graphData.edges.filter(
				(edge) => projectIds.has(edge.source) && projectIds.has(edge.target)
			)
		}
	};
}
