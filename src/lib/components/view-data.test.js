import { describe, expect, it } from 'vitest';
import { articleContext, cardItem, fieldGroups, toolTags } from './view-data.js';

/** @typedef {import('$lib/content/types.js').ContentItem} ContentItem */

/** @param {Partial<ContentItem>} overrides @returns {ContentItem} */
const item = (overrides) => ({
	slug: 'example',
	section: 'projects',
	title: 'Example',
	date: '2024-01-01',
	tags: [],
	excerpt: 'Example excerpt.',
	html: '<p>Body</p>',
	links: [],
	...overrides
});

/** @type {import('$lib/graph/build.js').GraphData} */
const graph = {
	nodes: [
		{ id: 'hub-projects', label: 'Projects', kind: 'hub', tone: 'projects', href: '/projects' },
		{ id: 'alpha', label: 'Alpha', kind: 'item', tone: 'projects', href: '/projects/alpha' },
		{ id: 'beta', label: 'Beta', kind: 'item', tone: 'projects', href: '/projects/beta' },
		{ id: 'lonely', label: 'Lonely', kind: 'item', tone: 'projects', href: '/projects/lonely' },
		{ id: 'field-ml', label: 'Machine Learning', kind: 'field', tone: 'field', href: null },
		{ id: 'org-uni', label: 'Uni', kind: 'org', tone: 'org', href: null, subtitle: 'University' }
	],
	edges: [
		{ source: 'hub-projects', target: 'alpha', kind: 'section' },
		{ source: 'hub-projects', target: 'beta', kind: 'section' },
		{ source: 'hub-projects', target: 'lonely', kind: 'section' },
		{ source: 'alpha', target: 'field-ml', kind: 'field' },
		{ source: 'beta', target: 'field-ml', kind: 'field' },
		{ source: 'org-uni', target: 'alpha', kind: 'org' },
		{ source: 'org-uni', target: 'beta', kind: 'org' }
	]
};

describe('cardItem', () => {
	it('drops the rendered body and adds field ids', () => {
		const card = cardItem(item({ slug: 'x', tags: ['PyTorch', 'React'] }));
		expect(card).not.toHaveProperty('html');
		expect(card.fields).toEqual(['ml', 'frontend']);
	});
});

describe('fieldGroups and toolTags', () => {
	const cards = [
		cardItem(item({ slug: 'a', tags: ['PyTorch', 'RAG', 'Docker'] })),
		cardItem(item({ slug: 'b', tags: ['React', 'docker'] }))
	];

	it('groups used fields by domain with counts', () => {
		const groups = fieldGroups(cards);
		expect(groups.map((group) => group.id)).toEqual(['data-science', 'software']);
		expect(groups[0].fields.map((field) => [field.id, field.count])).toEqual([
			['ml', 1],
			['llm', 1]
		]);
	});

	it('lists tools without field tags, merged case-insensitively', () => {
		expect(toolTags(cards)).toEqual([
			{ tag: 'Docker', count: 2 },
			{ tag: 'PyTorch', count: 1 },
			{ tag: 'React', count: 1 }
		]);
	});
});

describe('articleContext', () => {
	it('collects fields, organisations (either edge direction), related work and a focus graph', () => {
		const context = articleContext(graph, item({ slug: 'alpha', tags: ['PyTorch'] }));
		expect(context.fields).toEqual([
			{ id: 'ml', label: 'Machine Learning', href: '/projects?field=ml' }
		]);
		expect(context.orgs).toEqual([
			{ id: 'org-uni', label: 'Uni', subtitle: 'University', external: undefined }
		]);
		expect(context.related.map((related) => [related.id, related.shared])).toEqual([
			['beta', ['Machine Learning', 'Uni']]
		]);
		expect(context.focusGraph?.nodes.map((node) => node.id)).toContain('field-ml');
	});

	it('skips the focus graph when a note only connects to its section hub', () => {
		const context = articleContext(graph, item({ slug: 'lonely' }));
		expect(context.focusGraph).toBeNull();
		expect(context.orgs).toEqual([]);
		expect(context.related).toEqual([]);
	});
});
