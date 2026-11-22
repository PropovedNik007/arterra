import { loadContent, byFeatured } from '#lib/content/load.js';
import { sectionSubgraph } from '#lib/graph/subgraph.js';
import { cardItem, fieldGroups, toolTags } from '#lib/components/view-data.js';
import graph from '#lib/graphs/graph.json';

export const prerender = true;

export async function load() {
	const items = byFeatured((await loadContent()).filter((item) => item.section === 'projects')).map(
		cardItem
	);
	return {
		items,
		fieldGroups: fieldGroups(items),
		tools: toolTags(items),
		graphData: sectionSubgraph(
			/** @type {import('#lib/graph/build.js').GraphData} */ (graph),
			'projects'
		)
	};
}
