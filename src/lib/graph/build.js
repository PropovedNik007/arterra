import { DISCIPLINE_META, SECTION_META, itemPath } from '../design/sections.js';
import { DOMAINS, FIELDS, FIELD_TAGS, ORGS, ORG_KIND_LABELS, fieldsFor } from './taxonomy.js';

/** @typedef {import('../content/types.js').ContentItem} ContentItem */

/**
 * @typedef {'hub' | 'discipline' | 'domain' | 'field' | 'item' | 'org' | 'topic'} NodeKind
 * @typedef {'taxonomy' | 'section' | 'discipline' | 'domain' | 'field' | 'org' | 'topic' | 'link'} EdgeKind
 * @typedef {'projects' | 'diy' | 'sport' | 'field' | 'org' | 'topic'} Tone
 *
 * @typedef {object} GraphNode
 * @property {string} id
 * @property {string} label
 * @property {NodeKind} kind
 * @property {Tone} tone Colour family used by the renderer.
 * @property {'projects' | 'diy' | 'sport'} [section]
 * @property {string} [discipline]
 * @property {string | null} href Site-relative path (no base), or null if not navigable.
 * @property {string} [external] Public external URL.
 * @property {string} [subtitle] Short line under the label (kind, role, period…).
 * @property {string} [excerpt]
 * @property {string} [cover]
 * @property {string[]} [tags]
 * @property {string[]} [fields] Field labels, for item tooltips.
 * @property {boolean} [featured]
 *
 * @typedef {{ source: string, target: string, kind: EdgeKind }} GraphEdge
 * @typedef {{ nodes: GraphNode[], edges: GraphEdge[] }} GraphData
 */

/** @param {string} value */
const slugify = (value) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

/** @param {string} text @param {number} max */
function truncate(text, max) {
	if (text.length <= max) return text;
	return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

export const hubId = (/** @type {string} */ section) => `hub-${section}`;
export const disciplineId = (/** @type {string} */ discipline) => `discipline-${discipline}`;
export const domainId = (/** @type {string} */ id) => `domain-${id}`;
export const fieldId = (/** @type {string} */ id) => `field-${id}`;
export const orgId = (/** @type {string} */ id) => `org-${id}`;
export const topicId = (/** @type {string} */ tag) => `topic-${slugify(tag)}`;

/**
 * Build the public knowledge graph:
 *   section hubs → (sport disciplines) → notes,
 *   domains → fields of work → notes,
 *   organisations → notes they were done with/for,
 *   shared tools/topics (tags used by 2+ notes that aren't field names),
 *   explicit note-to-note links.
 * Nodes carry everything tooltips need so the client never re-reads content.
 * @param {ContentItem[]} items
 * @returns {GraphData}
 */
export function buildGraph(items) {
	/** @type {GraphNode[]} */
	const nodes = [];
	/** @type {GraphEdge[]} */
	const edges = [];
	const nodeIds = new Set();
	const edgeKeys = new Set();

	/** @param {GraphNode} node */
	function addNode(node) {
		if (nodeIds.has(node.id)) return;
		nodeIds.add(node.id);
		nodes.push(node);
	}

	/** @param {string} source @param {string} target @param {EdgeKind} kind */
	function addEdge(source, target, kind) {
		if (source === target || !nodeIds.has(source) || !nodeIds.has(target)) return;
		const key = [source, target].sort().join('::');
		if (edgeKeys.has(key)) return;
		edgeKeys.add(key);
		edges.push({ source, target, kind });
	}

	const countBy = (/** @type {(item: ContentItem) => boolean} */ predicate) =>
		items.filter(predicate).length;
	/** @param {number} count @param {string} noun */
	const plural = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;

	// Section hubs and sport disciplines (disciplines stay visible even when empty).
	for (const [section, meta] of Object.entries(SECTION_META)) {
		const count = countBy((item) => item.section === section);
		addNode({
			id: hubId(section),
			label: meta.label,
			kind: 'hub',
			tone: /** @type {Tone} */ (section),
			section: /** @type {'projects' | 'diy' | 'sport'} */ (section),
			href: meta.path,
			subtitle: `Section · ${plural(count, section === 'projects' ? 'project' : 'note')}`
		});
	}
	for (const [discipline, meta] of Object.entries(DISCIPLINE_META)) {
		const count = countBy((item) => item.discipline === discipline);
		addNode({
			id: disciplineId(discipline),
			label: meta.label,
			kind: 'discipline',
			tone: 'sport',
			section: 'sport',
			discipline,
			href: meta.path,
			subtitle: count ? `Sport · ${plural(count, 'note')}` : 'Sport · nothing published yet'
		});
	}

	// Fields of work, only when at least one note or organisation uses them.
	const itemFields = new Map(items.map((item) => [item.slug, fieldsFor(item)]));
	const usedFields = new Set([
		...[...itemFields.values()].flat(),
		...ORGS.flatMap((org) => org.fields ?? [])
	]);
	const fieldLabels = new Map(FIELDS.map((field) => [field.id, field.label]));
	for (const domain of DOMAINS) {
		const fields = FIELDS.filter((f) => f.domain === domain.id && usedFields.has(f.id));
		if (!fields.length) continue;
		addNode({
			id: domainId(domain.id),
			label: domain.label,
			kind: 'domain',
			tone: 'field',
			href: null,
			subtitle: `Domain · ${plural(fields.length, 'field')}`,
			excerpt: domain.description
		});
		for (const field of fields) {
			const count = [...itemFields.values()].filter((ids) => ids.includes(field.id)).length;
			addNode({
				id: fieldId(field.id),
				label: field.label,
				kind: 'field',
				tone: 'field',
				href: `/projects?field=${field.id}`,
				subtitle: `Field · ${plural(count, 'note')}`,
				excerpt: field.description
			});
		}
	}

	// Content notes.
	const slugSet = new Set(items.map((item) => item.slug));
	for (const item of items) {
		const discipline = item.discipline ? DISCIPLINE_META[item.discipline] : null;
		addNode({
			id: item.slug,
			label: item.title,
			kind: 'item',
			tone: item.section,
			section: item.section,
			discipline: item.discipline,
			href: itemPath(item),
			external: item.externalLive ? item.externalLink : undefined,
			subtitle: discipline ? `Sport · ${discipline.label}` : SECTION_META[item.section].label,
			excerpt: truncate(item.excerpt, 170),
			cover: item.cover,
			tags: item.tags.slice(0, 6).map(String),
			fields: (itemFields.get(item.slug) ?? []).map((id) => fieldLabels.get(id) ?? id),
			featured: item.featured || undefined
		});
	}

	// Organisations, only when connected to something that exists.
	for (const org of ORGS) {
		const targets = [
			...(org.items ?? []).filter((slug) => slugSet.has(slug)),
			...(org.fields ?? []).map(fieldId).filter((id) => nodeIds.has(id)),
			...(org.disciplines ?? []).map(disciplineId)
		];
		if (!targets.length) continue;
		addNode({
			id: orgId(org.id),
			label: org.label,
			kind: 'org',
			tone: 'org',
			href: null,
			external: org.url,
			subtitle: [ORG_KIND_LABELS[org.kind], org.meta].filter(Boolean).join(' · ')
		});
	}

	// Shared tools and topics: tags on 2+ notes that aren't already a field name.
	/** @type {Map<string, { label: string, slugs: string[] }>} */
	const topics = new Map();
	for (const item of items) {
		for (const raw of item.tags) {
			const tag = String(raw);
			if (FIELD_TAGS.has(tag.toLowerCase())) continue;
			const id = topicId(tag);
			const entry = topics.get(id) ?? { label: tag, slugs: [] };
			if (!entry.slugs.includes(item.slug)) entry.slugs.push(item.slug);
			topics.set(id, entry);
		}
	}
	for (const [id, entry] of topics) {
		if (entry.slugs.length < 2) continue;
		addNode({
			id,
			label: entry.label,
			kind: 'topic',
			tone: 'topic',
			href: `/projects?tag=${encodeURIComponent(entry.label)}`,
			subtitle: `Tool / topic · ${plural(entry.slugs.length, 'note')}`
		});
	}

	// Edges — strongest structure first so de-duplication keeps the meaningful kind.
	addEdge(hubId('projects'), hubId('diy'), 'taxonomy');
	addEdge(hubId('diy'), hubId('sport'), 'taxonomy');
	addEdge(hubId('sport'), hubId('projects'), 'taxonomy');
	for (const discipline of Object.keys(DISCIPLINE_META)) {
		addEdge(hubId('sport'), disciplineId(discipline), 'section');
	}
	addEdge(domainId('making'), hubId('diy'), 'section');
	addEdge(domainId('data-science'), hubId('projects'), 'section');
	addEdge(domainId('software'), hubId('projects'), 'section');
	for (const field of FIELDS) addEdge(domainId(field.domain), fieldId(field.id), 'domain');

	for (const item of items) {
		if (item.section === 'sport' && item.discipline) {
			addEdge(disciplineId(item.discipline), item.slug, 'discipline');
		} else {
			addEdge(hubId(item.section), item.slug, 'section');
		}
	}
	for (const item of items) {
		for (const target of item.links) {
			if (slugSet.has(target)) addEdge(item.slug, target, 'link');
		}
	}
	for (const item of items) {
		for (const id of itemFields.get(item.slug) ?? []) addEdge(item.slug, fieldId(id), 'field');
	}
	for (const org of ORGS) {
		const id = orgId(org.id);
		for (const slug of org.items ?? []) addEdge(id, slug, 'org');
		for (const field of org.fields ?? []) addEdge(id, fieldId(field), 'org');
		for (const discipline of org.disciplines ?? []) addEdge(id, disciplineId(discipline), 'org');
	}
	for (const [id, entry] of topics) {
		for (const slug of entry.slugs) addEdge(slug, id, 'topic');
	}

	return { nodes, edges };
}

/**
 * Content items whose fields resolve to nothing — surfaced as a build warning so
 * new exports don't silently float unclassified in the graph.
 * @param {ContentItem[]} items
 */
export function unclassifiedItems(items) {
	return items.filter((item) => item.section === 'projects' && fieldsFor(item).length === 0);
}
