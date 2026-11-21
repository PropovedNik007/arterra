import { loadContent } from '$lib/content/load.js';
import { sectionSubgraph } from '$lib/graph/subgraph.js';
import { cardItem } from '$lib/components/view-data.js';
import graph from '$lib/graphs/graph.json';

export const prerender = true;

export async function load() {
	const items = (await loadContent()).filter((item) => item.section === 'diy').map(cardItem);
	return {
		items,
		graphData: sectionSubgraph(
			/** @type {import('$lib/graph/build.js').GraphData} */ (graph),
			'diy'
		)
	};
}
