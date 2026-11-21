import graphData from '$lib/graphs/graph.json';

export const prerender = true;

/** The full public knowledge graph: every section, field, organisation and shared tool. */
export function load() {
	return { graphData };
}
