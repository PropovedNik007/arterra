import { describe, expect, it } from 'vitest';
import graphData from '$lib/graphs/graph.json';
import { buildHighlights, buildSankeyData, layoutSankey, shortLabel } from './sankey-data.js';

/** @typedef {import('$lib/graph/build.js').GraphData} GraphData */

const graph = /** @type {GraphData} */ (/** @type {unknown} */ (graphData));

/** Projects and DIY notes in the graph that have at least one field edge. */
function expectedProjects(/** @type {GraphData} */ data) {
	const kinds = new Map(data.nodes.map((node) => [node.id, node.kind]));
	const withFields = new Set(
		data.edges
			.filter((edge) => edge.kind === 'field')
			.flatMap((edge) => [edge.source, edge.target])
			.filter((id) => kinds.get(id) === 'item')
	);
	return data.nodes.filter(
		(node) =>
			node.kind === 'item' &&
			(node.section === 'projects' || node.section === 'diy') &&
			withFields.has(node.id)
	);
}

/** Small synthetic graph: one sport note, one unclassified project, edges in both directions. */
const fixture = /** @type {GraphData} */ ({
	nodes: [
		{ id: 'domain-a', label: 'Domain A', kind: 'domain', tone: 'field', href: null },
		{ id: 'domain-b', label: 'Domain B', kind: 'domain', tone: 'field', href: null },
		{ id: 'field-x', label: 'X', kind: 'field', tone: 'field', href: '/projects?field=x' },
		{ id: 'field-y', label: 'Y', kind: 'field', tone: 'field', href: '/projects?field=y' },
		{ id: 'field-z', label: 'Z', kind: 'field', tone: 'field', href: '/projects?field=z' },
		{
			id: 'p1',
			label: 'One — subtitle',
			kind: 'item',
			tone: 'projects',
			section: 'projects',
			href: '/projects/p1'
		},
		{ id: 'p2', label: 'Two', kind: 'item', tone: 'projects', section: 'projects', href: '/p2' },
		{ id: 'd1', label: 'Build', kind: 'item', tone: 'diy', section: 'diy', href: '/diy/d1' },
		{ id: 'p3', label: 'Bare', kind: 'item', tone: 'projects', section: 'projects', href: '/p3' },
		{ id: 's1', label: 'Hike', kind: 'item', tone: 'sport', section: 'sport', href: '/s1' }
	],
	edges: [
		{ source: 'domain-a', target: 'field-x', kind: 'domain' },
		{ source: 'field-y', target: 'domain-a', kind: 'domain' },
		{ source: 'domain-b', target: 'field-z', kind: 'domain' },
		{ source: 'p1', target: 'field-x', kind: 'field' },
		{ source: 'p1', target: 'field-y', kind: 'field' },
		{ source: 'field-z', target: 'p1', kind: 'field' },
		{ source: 'p2', target: 'field-x', kind: 'field' },
		{ source: 'd1', target: 'field-z', kind: 'field' },
		{ source: 's1', target: 'field-x', kind: 'field' }
	]
});

/** @param {import('./sankey-data.js').SankeyData} data */
function checkInvariants(data) {
	const sum = (/** @type {number[]} */ values) => values.reduce((a, b) => a + b, 0);
	const fieldProject = data.links.filter((link) => link.kind === 'field-project');
	const domainField = data.links.filter((link) => link.kind === 'domain-field');

	expect(sum(fieldProject.map((link) => link.value))).toBeCloseTo(data.total, 9);
	expect(sum(domainField.map((link) => link.value))).toBeCloseTo(data.total, 9);
	expect(sum(data.domains.map((domain) => domain.value))).toBeCloseTo(data.total, 9);

	for (const project of data.projects) {
		const shares = fieldProject.filter((link) => link.target === project.id);
		expect(shares.length).toBe(project.fieldIds.length);
		expect(sum(shares.map((link) => link.value))).toBeCloseTo(1, 9);
	}
	for (const field of data.fields) {
		const into = domainField.find((link) => link.target === field.id);
		const out = fieldProject.filter((link) => link.source === field.id);
		expect(into?.value).toBeCloseTo(sum(out.map((link) => link.value)), 9);
	}
}

describe('buildSankeyData', () => {
	it('sums to the number of published projects and DIY notes', () => {
		const data = buildSankeyData(graph);
		const expected = expectedProjects(graph);
		expect(data.total).toBe(expected.length);
		expect(data.total).toBeGreaterThan(0);
		expect(data.projects.map((project) => project.id).sort()).toEqual(
			expected.map((node) => node.id).sort()
		);
		checkInvariants(data);
	});

	it('never includes sport notes', () => {
		const data = buildSankeyData(graph);
		const sport = new Set(
			graph.nodes.filter((node) => node.section === 'sport').map((node) => node.id)
		);
		expect(data.nodes.some((node) => sport.has(node.id))).toBe(false);
		expect(data.links.some((link) => sport.has(link.target) || sport.has(link.source))).toBe(false);
		expect(data.projects.every((p) => p.section === 'projects' || p.section === 'diy')).toBe(true);
	});

	it('handles the synthetic fixture: shares, unclassified notes and sport', () => {
		const data = buildSankeyData(fixture);
		expect(data.total).toBe(3);
		expect(data.unclassified.map((item) => item.id)).toEqual(['p3']);
		expect(data.projects.find((p) => p.id === 'p1')?.share).toBeCloseTo(1 / 3, 12);
		expect(data.projects.find((p) => p.id === 'p1')?.shortLabel).toBe('One');
		expect(data.nodes.find((node) => node.id === 'd1')?.tone).toBe('diy');
		expect(data.nodes.some((node) => node.id === 's1')).toBe(false);
		const fieldX = data.fields.find((field) => field.id === 'field-x');
		expect(fieldX?.value).toBeCloseTo(1 / 3 + 1, 12);
		expect(fieldX?.projectCount).toBe(2);
		expect(fieldX?.diyCount).toBe(0);
		// Field links list the projects section only, so DIY builds are counted apart.
		const fieldZ = data.fields.find((field) => field.id === 'field-z');
		expect([fieldZ?.projectCount, fieldZ?.diyCount]).toEqual([2, 1]);
		const domainB = data.domains.find((domain) => domain.id === 'domain-b');
		expect([domainB?.projectCount, domainB?.diyCount]).toEqual([2, 1]);
		// Domain A: X (1⅓) + Y (⅓) outweighs Domain B: Z (⅓ + 1).
		expect(data.domains.map((domain) => domain.id)).toEqual(['domain-a', 'domain-b']);
		checkInvariants(data);
	});

	it('is deterministic, even when the input order is shuffled', () => {
		const reversed = {
			nodes: [...graph.nodes].reverse(),
			edges: [...graph.edges].reverse()
		};
		const first = buildSankeyData(graph);
		expect(buildSankeyData(graph)).toEqual(first);
		const shuffled = buildSankeyData(reversed);
		expect(shuffled.nodes.map((node) => node.id)).toEqual(first.nodes.map((node) => node.id));
		expect(shuffled.links.map((link) => link.id).sort()).toEqual(
			first.links.map((link) => link.id).sort()
		);
	});

	it('returns an empty, honest result for an empty graph', () => {
		const data = buildSankeyData({ nodes: [], edges: [] });
		expect(data.total).toBe(0);
		expect(data.nodes).toEqual([]);
		expect(layoutSankey(data, { width: 400, height: 300 }).nodes).toEqual([]);
	});
});

describe('shortLabel', () => {
	it('keeps the part before an em-dash subtitle', () => {
		expect(shortLabel('AIM Hackathon — greenwashing RAG')).toBe('AIM Hackathon');
		expect(shortLabel('Printerra')).toBe('Printerra');
	});
});

describe('buildHighlights', () => {
	it('lights up a project, its fields and their domains only', () => {
		const data = buildSankeyData(fixture);
		const p1 = buildHighlights(data).get('p1');
		expect([...(p1?.nodes ?? [])].sort()).toEqual(
			['domain-a', 'domain-b', 'field-x', 'field-y', 'field-z', 'p1'].sort()
		);
		expect(p1?.links.has('field-x->p2')).toBe(false);
	});

	it('follows a field → project link back to its domain', () => {
		const data = buildSankeyData(fixture);
		const link = buildHighlights(data).get('field-z->d1');
		expect([...(link?.links ?? [])].sort()).toEqual(['domain-b->field-z', 'field-z->d1']);
	});
});

describe('layoutSankey', () => {
	it('lays out every node inside the extent without NaN, identically each time', () => {
		const data = buildSankeyData(graph);
		const options = { width: 960, height: 560, right: 200 };
		const layout = layoutSankey(data, options);
		expect(layout.nodes).toHaveLength(data.nodes.length);
		expect(layout.links).toHaveLength(data.links.length);
		for (const node of layout.nodes) {
			for (const value of [node.x0, node.x1, node.y0, node.y1]) {
				expect(Number.isFinite(value)).toBe(true);
			}
			expect(node.x0).toBeGreaterThanOrEqual(0);
			expect(node.x1).toBeLessThanOrEqual(options.width - options.right + 0.01);
			expect(node.y0).toBeGreaterThanOrEqual(-0.01);
			expect(node.y1).toBeLessThanOrEqual(options.height + 0.01);
		}
		for (const link of layout.links) expect(link.path).not.toMatch(/NaN/);
		expect(layoutSankey(data, options)).toEqual(layout);
		// Columns: domain, field, project.
		const columns = new Set(layout.nodes.map((node) => `${node.column}:${node.x0}`));
		expect(columns.size).toBe(3);
	});

	it('keeps each column in its fixed order', () => {
		const data = buildSankeyData(graph);
		const layout = layoutSankey(data, { width: 960, height: 560 });
		for (const column of [0, 1, 2]) {
			const ys = layout.nodes
				.filter((node) => node.column === column)
				.sort((a, b) => a.order - b.order)
				.map((node) => node.y0);
			expect(ys).toEqual([...ys].sort((a, b) => a - b));
		}
	});
});
