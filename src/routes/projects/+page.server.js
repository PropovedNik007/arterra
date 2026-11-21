import { loadContent } from '$lib/content/load.js';
import graphData from '$lib/graphs/graph.json';

export const prerender = true;

export async function load() {
	const items = await loadContent();
	return { items: items.filter((item) => item.section === 'projects'), graphData };
}
