import { loadContent } from '#lib/content/load.js';
import { DISCIPLINES } from '#lib/content/types.js';
import { DISCIPLINE_META, itemPath } from '#lib/design/sections.js';
import { sectionSubgraph } from '#lib/graph/subgraph.js';
import graph from '#lib/graphs/graph.json';

export const prerender = true;

export async function load() {
	// loadContent() returns notes newest first, so the first match is the latest.
	const items = (await loadContent()).filter((item) => item.section === 'sport');
	const disciplines = DISCIPLINES.map((discipline) => {
		const notes = items.filter((item) => item.discipline === discipline);
		const latest = notes[0];
		return {
			id: discipline,
			...DISCIPLINE_META[discipline],
			count: notes.length,
			latest: latest ? { title: latest.title, date: latest.date, href: itemPath(latest) } : null
		};
	});
	return {
		disciplines,
		total: items.length,
		graphData: sectionSubgraph(
			/** @type {import('#lib/graph/build.js').GraphData} */ (graph),
			'sport'
		)
	};
}
