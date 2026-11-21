import { describe, expect, it } from 'vitest';
import { buildGraph } from './build.js';

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

describe('buildGraph', () => {
	it('creates section hubs plus one node per content item when there are no shared topics', () => {
		const graph = buildGraph([makeItem({ slug: 'a' }), makeItem({ slug: 'b' })]);
		expect(graph.nodes.map((n) => n.id)).toEqual([
			'hub-projects',
			'hub-diy',
			'hub-sport',
			'a',
			'b'
		]);
		expect(graph.edges).toContainEqual({ source: 'hub-projects', target: 'a', kind: 'section' });
	});

	it('creates a link edge for a resolved internal link', () => {
		const graph = buildGraph([makeItem({ slug: 'a', links: ['b'] }), makeItem({ slug: 'b' })]);
		expect(graph.edges).toContainEqual({ source: 'a', target: 'b', kind: 'link' });
	});

	it('does not create an edge for an unresolved link target', () => {
		const graph = buildGraph([makeItem({ slug: 'a', links: ['ghost'] })]);
		expect(graph.edges.some((edge) => edge.source === 'a' && edge.target === 'ghost')).toBe(false);
	});

	it('creates a topic node and connects items that share the tag', () => {
		const graph = buildGraph([
			makeItem({ slug: 'a', tags: ['python'] }),
			makeItem({ slug: 'b', tags: ['python', 'ml'] })
		]);
		expect(graph.nodes).toContainEqual({
			id: 'topic-python',
			label: 'python',
			section: 'topic',
			isTopic: true
		});
		expect(graph.edges).toContainEqual({ source: 'a', target: 'topic-python', kind: 'tag' });
		expect(graph.edges).toContainEqual({ source: 'b', target: 'topic-python', kind: 'tag' });
	});

	it('does not duplicate an edge already created by a link', () => {
		const graph = buildGraph([
			makeItem({ slug: 'a', links: ['b'], tags: ['python'] }),
			makeItem({ slug: 'b', tags: ['python'] })
		]);
		expect(graph.edges.filter((e) => e.kind === 'link')).toHaveLength(1);
		expect(graph.edges.filter((e) => e.kind === 'tag')).toHaveLength(2);
	});

	it('never creates a self-edge', () => {
		const graph = buildGraph([makeItem({ slug: 'a', links: ['a'], tags: ['x'] })]);
		expect(graph.edges.some((edge) => edge.source === edge.target)).toBe(false);
	});
});
