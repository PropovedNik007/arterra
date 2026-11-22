import { error } from '@sveltejs/kit';
import { loadContent } from '#lib/content/load.js';
import { articleContext } from '#lib/components/view-data.js';
import graph from '#lib/graphs/graph.json';

export const prerender = true;

export async function entries() {
	return (await loadContent())
		.filter((item) => item.section === 'projects')
		.map((item) => ({ id: item.slug }));
}

export async function load({ params }) {
	const item = (await loadContent()).find(
		(candidate) => candidate.section === 'projects' && candidate.slug === params.id
	);
	if (!item) error(404, 'Project not found');
	return {
		item,
		context: articleContext(/** @type {import('#lib/graph/build.js').GraphData} */ (graph), item)
	};
}
