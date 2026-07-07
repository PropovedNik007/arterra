import { describe, expect, it } from 'vitest';
import { buildGraph } from './build.js';

/** @param {Partial<import('../content/types.js').ContentItem>} overrides */
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

describe('buildGraph', () => {
	it('creates one node per content item', () => {
		const graph = buildGraph([makeItem({ slug: 'a' }), makeItem({ slug: 'b' })]);
		expect(graph.nodes.map((n) => n.id)).toEqual(['a', 'b']);
	});

	it('creates a link edge for a resolved internal link', () => {
		const graph = buildGraph([makeItem({ slug: 'a', links: ['b'] }), makeItem({ slug: 'b' })]);
		expect(graph.edges).toContainEqual({ source: 'a', target: 'b', kind: 'link' });
	});

	it('does not create an edge for an unresolved link target', () => {
		const graph = buildGraph([makeItem({ slug: 'a', links: ['ghost'] })]);
		expect(graph.edges).toHaveLength(0);
	});

	it('creates a tag edge between items sharing a tag', () => {
		const graph = buildGraph([
			makeItem({ slug: 'a', tags: ['python'] }),
			makeItem({ slug: 'b', tags: ['python', 'ml'] })
		]);
		expect(graph.edges).toContainEqual({ source: 'a', target: 'b', kind: 'tag' });
	});

	it('does not duplicate an edge already created by a link', () => {
		const graph = buildGraph([
			makeItem({ slug: 'a', links: ['b'], tags: ['python'] }),
			makeItem({ slug: 'b', tags: ['python'] })
		]);
		expect(graph.edges.filter((e) => e.kind === 'link')).toHaveLength(1);
		expect(graph.edges.filter((e) => e.kind === 'tag')).toHaveLength(1);
	});

	it('never creates a self-edge', () => {
		const graph = buildGraph([makeItem({ slug: 'a', links: ['a'], tags: ['x'] })]);
		expect(graph.edges).toHaveLength(0);
	});
});
