/** @typedef {import('./build.js').GraphData} GraphData */
/** @typedef {import('./build.js').GraphNode} GraphNode */

/**
 * Induced subgraph over a set of node ids.
 * @param {GraphData} graph
 * @param {Set<string>} ids
 * @returns {GraphData}
 */
function induced(graph, ids) {
	return {
		nodes: graph.nodes.filter((node) => ids.has(node.id)),
		edges: graph.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target))
	};
}

/** @param {GraphData} graph */
function adjacency(graph) {
	/** @type {Map<string, Set<string>>} */
	const map = new Map(graph.nodes.map((node) => [node.id, new Set()]));
	for (const edge of graph.edges) {
		map.get(edge.source)?.add(edge.target);
		map.get(edge.target)?.add(edge.source);
	}
	return map;
}

/**
 * Everything one section touches: its hub, its notes, sport disciplines, and
 * the fields, domains, organisations and topics those notes connect to.
 * Topics are kept only when they still link two or more visible notes.
 * @param {GraphData} graph
 * @param {'projects' | 'diy' | 'sport'} section
 * @returns {GraphData}
 */
export function sectionSubgraph(graph, section) {
	const byId = new Map(graph.nodes.map((node) => [node.id, node]));
	const adj = adjacency(graph);
	const ids = new Set(
		graph.nodes
			.filter(
				(node) =>
					node.section === section &&
					(node.kind === 'item' || node.kind === 'hub' || node.kind === 'discipline')
			)
			.map((node) => node.id)
	);
	const items = [...ids].filter((id) => byId.get(id)?.kind === 'item');
	for (const id of [...ids]) {
		for (const neighbor of adj.get(id) ?? []) {
			const kind = byId.get(neighbor)?.kind;
			if (kind === 'field' || kind === 'org') ids.add(neighbor);
		}
	}
	for (const id of [...ids]) {
		if (byId.get(id)?.kind !== 'field') continue;
		for (const neighbor of adj.get(id) ?? []) {
			if (byId.get(neighbor)?.kind === 'domain') ids.add(neighbor);
		}
	}
	for (const node of graph.nodes) {
		if (node.kind !== 'topic') continue;
		const linked = [...(adj.get(node.id) ?? [])].filter((id) => items.includes(id));
		if (linked.length >= 2) ids.add(node.id);
	}
	return induced(graph, ids);
}

/**
 * Neighbourhood of one note: the note, everything it connects to, and the
 * other notes that share a field, organisation, topic or link with it.
 * @param {GraphData} graph
 * @param {string} focus
 * @returns {GraphData}
 */
export function focusSubgraph(graph, focus) {
	const byId = new Map(graph.nodes.map((node) => [node.id, node]));
	if (!byId.has(focus)) return { nodes: [], edges: [] };
	const adj = adjacency(graph);
	const ids = new Set([focus]);
	for (const neighbor of adj.get(focus) ?? []) {
		ids.add(neighbor);
		const kind = byId.get(neighbor)?.kind;
		if (kind === 'hub' || kind === 'discipline') continue;
		for (const second of adj.get(neighbor) ?? []) {
			if (byId.get(second)?.kind === 'item') ids.add(second);
		}
	}
	return induced(graph, ids);
}

/** Relationship weights for ranking related notes. */
const WEIGHTS = { link: 4, org: 3, field: 2, topic: 1 };

/**
 * Other notes ranked by how much they share with `slug` (links, organisations,
 * fields, topics). Hubs don't count — sharing a section isn't a relation.
 * @param {GraphData} graph
 * @param {string} slug
 * @param {number} [limit]
 * @returns {Array<GraphNode & { score: number, shared: string[] }>}
 */
export function relatedItems(graph, slug, limit = 3) {
	const byId = new Map(graph.nodes.map((node) => [node.id, node]));
	/** @type {Map<string, { score: number, shared: Set<string> }>} */
	const scores = new Map();
	/** @param {string} id @param {number} weight @param {string} [label] */
	const bump = (id, weight, label) => {
		if (id === slug || byId.get(id)?.kind !== 'item') return;
		const entry = scores.get(id) ?? { score: 0, shared: new Set() };
		entry.score += weight;
		if (label) entry.shared.add(label);
		scores.set(id, entry);
	};
	for (const edge of graph.edges) {
		if (edge.kind === 'link' && (edge.source === slug || edge.target === slug)) {
			bump(edge.source === slug ? edge.target : edge.source, WEIGHTS.link);
		}
	}
	const hubs = graph.edges.filter(
		(edge) =>
			(edge.source === slug || edge.target === slug) &&
			(edge.kind === 'org' || edge.kind === 'field' || edge.kind === 'topic')
	);
	for (const edge of hubs) {
		const via = edge.source === slug ? edge.target : edge.source;
		const label = byId.get(via)?.label;
		for (const other of graph.edges) {
			if (other.kind !== edge.kind) continue;
			if (other.source === via) bump(other.target, WEIGHTS[edge.kind], label);
			else if (other.target === via) bump(other.source, WEIGHTS[edge.kind], label);
		}
	}
	return [...scores.entries()]
		.sort((a, b) => b[1].score - a[1].score || a[0].localeCompare(b[0]))
		.slice(0, limit)
		.map(([id, entry]) => ({
			.../** @type {GraphNode} */ (byId.get(id)),
			score: entry.score,
			shared: [...entry.shared].slice(0, 4)
		}));
}
