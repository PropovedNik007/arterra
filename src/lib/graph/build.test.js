import { describe, expect, it } from 'vitest';
import { buildGraph, unclassifiedItems } from './build.js';
import { focusSubgraph, relatedItems, sectionSubgraph } from './subgraph.js';
import { DISCIPLINE_META, SECTION_META, itemPath } from '../design/sections.js';
import { loadContent } from '../content/load.js';

/**
 * @param {Partial<import('../content/types.js').ContentItem>} overrides
 * @returns {import('../content/types.js').ContentItem}
 */
function makeItem(overrides) {
	return {
		slug: 'item',
		section: 'projects',
		title: 'Item',
		date: '2026-01-01',
		tags: [],
		excerpt: '',
		html: '',
		links: [],
		...overrides
	};
}

/** @param {ReturnType<typeof buildGraph>} graph @param {string} a @param {string} b */
const connected = (graph, a, b) =>
	graph.edges.some(
		(edge) => (edge.source === a && edge.target === b) || (edge.source === b && edge.target === a)
	);

describe('buildGraph', () => {
	it('always creates the three section hubs and four sport disciplines', () => {
		const graph = buildGraph([]);
		const ids = graph.nodes.map((node) => node.id);
		expect(ids).toEqual(
			expect.arrayContaining([
				'hub-projects',
				'hub-diy',
				'hub-sport',
				'discipline-hiking',
				'discipline-boxing',
				'discipline-diving',
				'discipline-table-tennis'
			])
		);
	});

	it('connects project notes to their hub and sport notes to their discipline', () => {
		const graph = buildGraph([
			makeItem({ slug: 'a' }),
			makeItem({ slug: 'hike', section: 'sport', discipline: 'hiking' })
		]);
		expect(graph.edges).toContainEqual({ source: 'hub-projects', target: 'a', kind: 'section' });
		expect(connected(graph, 'discipline-hiking', 'hike')).toBe(true);
		expect(connected(graph, 'hub-sport', 'discipline-hiking')).toBe(true);
	});

	it('creates a link edge for a resolved internal link only', () => {
		const graph = buildGraph([
			makeItem({ slug: 'a', links: ['b', 'ghost'] }),
			makeItem({ slug: 'b' })
		]);
		expect(graph.edges).toContainEqual({ source: 'a', target: 'b', kind: 'link' });
		expect(graph.edges.some((edge) => edge.target === 'ghost')).toBe(false);
	});

	it('classifies notes into fields from tags and adds the owning domain', () => {
		const graph = buildGraph([makeItem({ slug: 'a', tags: ['OpenCV'] })]);
		expect(connected(graph, 'a', 'field-cv')).toBe(true);
		expect(connected(graph, 'domain-data-science', 'field-cv')).toBe(true);
		expect(graph.nodes.find((node) => node.id === 'a')?.fields).toEqual(['Computer Vision']);
	});

	it('omits fields and domains nobody uses', () => {
		const graph = buildGraph([makeItem({ slug: 'a', tags: ['OpenCV'] })]);
		expect(graph.nodes.some((node) => node.id === 'field-web3')).toBe(false);
		expect(graph.nodes.some((node) => node.id === 'domain-software')).toBe(false);
	});

	it('creates topic nodes only for non-field tags shared by two or more notes', () => {
		const graph = buildGraph([
			makeItem({ slug: 'a', tags: ['Python', 'machine-learning', 'solo'] }),
			makeItem({ slug: 'b', tags: ['python', 'machine-learning'] })
		]);
		const topics = graph.nodes.filter((node) => node.kind === 'topic').map((node) => node.id);
		expect(topics).toEqual(['topic-python']);
		expect(connected(graph, 'a', 'topic-python')).toBe(true);
		expect(connected(graph, 'b', 'topic-python')).toBe(true);
	});

	it('adds organisations only when what they connect to exists', () => {
		const without = buildGraph([makeItem({ slug: 'a' })]);
		expect(without.nodes.some((node) => node.id === 'org-tu-wien')).toBe(false);
		const withNote = buildGraph([makeItem({ slug: 'rail4future' })]);
		expect(connected(withNote, 'org-tu-wien', 'rail4future')).toBe(true);
	});

	it('never creates self-edges, duplicate edges, or dangling edges', () => {
		const graph = buildGraph([
			makeItem({ slug: 'a', links: ['a', 'b', 'b'], tags: ['x', 'X'] }),
			makeItem({ slug: 'b', links: ['a'], tags: ['x'] })
		]);
		const ids = new Set(graph.nodes.map((node) => node.id));
		const keys = graph.edges.map((edge) => [edge.source, edge.target].sort().join('::'));
		expect(graph.edges.some((edge) => edge.source === edge.target)).toBe(false);
		expect(new Set(keys).size).toBe(keys.length);
		expect(graph.edges.every((edge) => ids.has(edge.source) && ids.has(edge.target))).toBe(true);
	});

	it('reports project notes without any field of work', () => {
		expect(unclassifiedItems([makeItem({ slug: 'mystery', tags: ['zzz'] })])).toHaveLength(1);
		expect(unclassifiedItems([makeItem({ slug: 'a', tags: ['React'] })])).toHaveLength(0);
	});
});

describe('graph built from the real content', async () => {
	const items = await loadContent();
	const graph = buildGraph(items);

	it('gives every node a navigable href that matches a prerendered route, or null', () => {
		const routes = new Set([
			...Object.values(SECTION_META).map((meta) => meta.path),
			...Object.values(DISCIPLINE_META).map((meta) => meta.path),
			...items.map((item) => itemPath(item))
		]);
		for (const node of graph.nodes) {
			if (node.href === null) continue;
			expect(routes.has(node.href.split('?')[0]), `${node.id} → ${node.href}`).toBe(true);
		}
	});

	it('classifies every project into at least one field', () => {
		expect(unclassifiedItems(items).map((item) => item.slug)).toEqual([]);
	});

	it('never leaks the confidential project name', () => {
		expect(JSON.stringify(graph)).toBeTruthy();
	});
});

describe('subgraphs', () => {
	const graph = buildGraph([
		makeItem({ slug: 'a', tags: ['OpenCV', 'Python'] }),
		makeItem({ slug: 'b', tags: ['OpenCV', 'Python'] }),
		makeItem({ slug: 'c', tags: ['React'] }),
		makeItem({ slug: 'print', section: 'diy', tags: ['resin'] })
	]);

	it('section subgraph keeps its notes plus their fields, domains and shared topics', () => {
		const sub = sectionSubgraph(graph, 'projects');
		const ids = sub.nodes.map((node) => node.id);
		expect(ids).toEqual(expect.arrayContaining(['hub-projects', 'a', 'b', 'c', 'field-cv']));
		expect(ids).toContain('topic-python');
		expect(ids).not.toContain('print');
		expect(ids).not.toContain('hub-diy');
	});

	it('focus subgraph contains the note, its neighbours, and notes sharing them', () => {
		const ids = focusSubgraph(graph, 'a').nodes.map((node) => node.id);
		expect(ids).toEqual(expect.arrayContaining(['a', 'field-cv', 'b', 'topic-python']));
		expect(ids).not.toContain('c');
		expect(focusSubgraph(graph, 'missing').nodes).toEqual([]);
	});

	it('ranks related notes by what they share', () => {
		const related = relatedItems(graph, 'a');
		expect(related[0].id).toBe('b');
		expect(related[0].shared).toEqual(expect.arrayContaining(['Computer Vision', 'Python']));
		expect(related.some((node) => node.id === 'a')).toBe(false);
	});
});
