/**
 * Server-side helpers that shape content items and graph data for the section
 * index and detail pages. Keep them pure (no filesystem access) so they can be
 * unit-tested and reused from any `+page.server.js`.
 */
import { FIELDS, DOMAINS, FIELD_TAGS, fieldsFor } from '$lib/graph/taxonomy.js';
import { focusSubgraph, relatedItems } from '$lib/graph/subgraph.js';

/** @typedef {import('$lib/content/types.js').ContentItem} ContentItem */
/** @typedef {import('$lib/graph/build.js').GraphData} GraphData */

/**
 * @typedef {object} CardItem
 * @property {string} slug
 * @property {ContentItem['section']} section
 * @property {ContentItem['discipline']} [discipline]
 * @property {string} title
 * @property {string} date
 * @property {string[]} tags
 * @property {string} [cover]
 * @property {string} excerpt
 * @property {string} [externalLink]
 * @property {boolean} [externalLive]
 * @property {boolean} [featured]
 * @property {string[]} fields Field ids, in FIELDS order.
 */

/**
 * The subset of a content item a card needs — drops the rendered HTML body so
 * index pages don't ship every article in their page data.
 * @param {ContentItem} item
 * @returns {CardItem}
 */
export function cardItem(item) {
	return {
		slug: item.slug,
		section: item.section,
		discipline: item.discipline,
		title: item.title,
		date: item.date,
		tags: item.tags,
		cover: item.cover,
		excerpt: item.excerpt,
		externalLink: item.externalLink,
		externalLive: item.externalLive,
		featured: item.featured,
		fields: fieldsFor(item)
	};
}

/**
 * Whether a tag names a field of work rather than a concrete tool or topic.
 * @param {string} tag
 */
export function isFieldTag(tag) {
	return FIELD_TAGS.has(String(tag).toLowerCase());
}

/**
 * Fields used by `items`, grouped by domain (DOMAINS order) with counts.
 * Domains without any used field are omitted.
 * @param {CardItem[]} items
 */
export function fieldGroups(items) {
	/** @type {Map<string, number>} */
	const counts = new Map();
	for (const item of items) {
		for (const id of item.fields) counts.set(id, (counts.get(id) ?? 0) + 1);
	}
	return DOMAINS.map((domain) => ({
		id: domain.id,
		label: domain.label,
		fields: FIELDS.filter((field) => field.domain === domain.id && counts.has(field.id)).map(
			(field) => ({
				id: field.id,
				label: field.label,
				description: field.description,
				count: counts.get(field.id) ?? 0
			})
		)
	})).filter((group) => group.fields.length);
}

/**
 * Tool/topic tags (everything that isn't a field tag) with counts, most used
 * first, then alphabetical.
 * @param {CardItem[]} items
 */
export function toolTags(items) {
	/** @type {Map<string, { tag: string, count: number }>} */
	const tags = new Map();
	for (const item of items) {
		for (const tag of item.tags) {
			if (isFieldTag(tag)) continue;
			const key = tag.toLowerCase();
			const entry = tags.get(key) ?? { tag, count: 0 };
			entry.count += 1;
			tags.set(key, entry);
		}
	}
	return [...tags.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * Graph-derived context for a detail page: fields of work, organisations,
 * related notes, and the note's neighbourhood graph.
 * @param {GraphData} graph
 * @param {ContentItem} item
 */
export function articleContext(graph, item) {
	const byId = new Map(graph.nodes.map((node) => [node.id, node]));
	const fields = fieldsFor(item).map((id) => {
		const field = /** @type {import('$lib/graph/taxonomy.js').Field} */ (
			FIELDS.find((candidate) => candidate.id === id)
		);
		return { id, label: field.label, href: `/projects?field=${id}` };
	});
	const orgs = graph.edges
		.filter(
			(edge) => edge.kind === 'org' && (edge.source === item.slug || edge.target === item.slug)
		)
		.map((edge) => byId.get(edge.source === item.slug ? edge.target : edge.source))
		.filter((node) => node?.kind === 'org')
		.map((node) => {
			const org = /** @type {import('$lib/graph/build.js').GraphNode} */ (node);
			return { id: org.id, label: org.label, subtitle: org.subtitle, external: org.external };
		});
	const related = relatedItems(graph, item.slug, 3).map((node) => ({
		id: node.id,
		label: node.label,
		href: node.href,
		subtitle: node.subtitle,
		cover: node.cover,
		shared: node.shared
	}));
	const focusGraph = focusSubgraph(graph, item.slug);
	// Only worth drawing when the note connects to more than its own section hub.
	const meaningful = focusGraph.nodes.some(
		(node) => node.id !== item.slug && node.kind !== 'hub' && node.kind !== 'discipline'
	);
	return { fields, orgs, related, focusGraph: meaningful ? focusGraph : null };
}
