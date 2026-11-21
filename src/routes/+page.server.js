import { loadContent, byFeatured } from '$lib/content/load.js';
import { DISCIPLINE_META } from '$lib/design/sections.js';
import { cardItem } from '$lib/components/view-data.js';
import graph from '$lib/graphs/graph.json';

/** @typedef {import('$lib/graph/build.js').GraphData} GraphData */

export const prerender = true;

export async function load() {
	const items = await loadContent();
	const projects = items.filter((item) => item.section === 'projects');
	const sport = items.filter((item) => item.section === 'sport');

	/** Sport disciplines that actually have notes, so the copy never over-claims. */
	const sportDisciplines = [
		...new Set(sport.map((item) => item.discipline).filter((value) => value !== undefined))
	].map((discipline) => DISCIPLINE_META[discipline].label);

	return {
		projects: byFeatured(projects).slice(0, 6).map(cardItem),
		counts: {
			projects: projects.length,
			diy: items.filter((item) => item.section === 'diy').length,
			sport: sport.length
		},
		sportDisciplines,
		graphData: /** @type {GraphData} */ (graph)
	};
}
