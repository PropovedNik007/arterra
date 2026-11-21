import { error } from '@sveltejs/kit';
import { loadContent } from '$lib/content/load.js';
import { articleContext } from '$lib/components/view-data.js';
import graph from '$lib/graphs/graph.json';

export const prerender = true;
export async function entries() {
	return (await loadContent())
		.filter((item) => item.section === 'sport' && item.discipline)
		.map((item) => ({ discipline: /** @type {string} */ (item.discipline), id: item.slug }));
}
export async function load({ params }) {
	const item = (await loadContent()).find(
		(candidate) =>
			candidate.section === 'sport' &&
			candidate.discipline === params.discipline &&
			candidate.slug === params.id
	);
	if (!item) error(404, 'Sport note not found');
	return {
		item,
		context: articleContext(/** @type {import('$lib/graph/build.js').GraphData} */ (graph), item)
	};
}
