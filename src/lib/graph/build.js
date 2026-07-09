/** @typedef {import('../content/types.js').ContentItem} ContentItem */

/**
 * @typedef {object} GraphNode
 * @property {string} id
 * @property {string} label
 * @property {import('../content/types.js').Section} section
 * @property {import('../content/types.js').Discipline} [discipline]
 */

/**
 * @typedef {object} GraphEdge
 * @property {string} source
 * @property {string} target
 * @property {'link' | 'tag'} kind
 */

/**
 * Builds a graph from content items: an edge per resolved internal link
 * (kind: 'link'), plus a lighter-weight edge between any two items that
 * share at least one tag (kind: 'tag') so sparse sections aren't isolated
 * dots on the graph.
 * @param {ContentItem[]} items
 * @returns {{ nodes: GraphNode[], edges: GraphEdge[] }}
 */
export function buildGraph(items) {
	/** @type {GraphNode[]} */
	const nodes = items.map((item) => ({
		id: item.slug,
		label: item.title,
		section: item.section,
		discipline: item.discipline
	}));

	const edgeKeys = new Set();
	/** @type {GraphEdge[]} */
	const edges = [];

	/**
	 * @param {string} source
	 * @param {string} target
	 * @param {GraphEdge['kind']} kind
	 */
	function addEdge(source, target, kind) {
		if (source === target) return;
		const key = [source, target].sort().join('::') + `::${kind}`;
		if (edgeKeys.has(key)) return;
		edgeKeys.add(key);
		edges.push({ source, target, kind });
	}

	const slugSet = new Set(items.map((item) => item.slug));

	for (const item of items) {
		for (const target of item.links) {
			if (slugSet.has(target)) {
				addEdge(item.slug, target, 'link');
			}
		}
	}

	for (let i = 0; i < items.length; i++) {
		for (let j = i + 1; j < items.length; j++) {
			const shared = items[i].tags.some((tag) => items[j].tags.includes(tag));
			if (shared) {
				addEdge(items[i].slug, items[j].slug, 'tag');
			}
		}
	}

	return { nodes, edges };
}
