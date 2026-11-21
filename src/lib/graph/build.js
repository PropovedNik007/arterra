/** @typedef {import('../content/types.js').ContentItem} ContentItem */

/**
 * Build a compact, stable public knowledge graph. Section hubs give every
 * published note a meaningful anchor; explicit note links and shared tags add
 * the secondary relationships without turning the view into a hairball.
 * @param {ContentItem[]} items
 */
export function buildGraph(items) {
	const sections = [
		{ id: 'hub-projects', label: 'Projects', section: 'projects', isHub: true },
		{ id: 'hub-diy', label: 'DIY', section: 'diy', isHub: true },
		{ id: 'hub-sport', label: 'Sport', section: 'sport', isHub: true }
	];

	const sharedTags = new Map();
	for (const item of items) {
		for (const tag of item.tags) {
			const key = tag.toLowerCase();
			const entry = sharedTags.get(key) ?? { label: tag, items: [] };
			entry.items.push(item.slug);
			sharedTags.set(key, entry);
		}
	}
	const topics = [...sharedTags.entries()]
		.filter(([, entry]) => entry.items.length > 1)
		.map(([key, entry]) => ({
			id: `topic-${key.replace(/[^a-z0-9]+/g, '-')}`,
			label: entry.label,
			section: 'topic',
			isTopic: true
		}));

	const nodes = [
		...sections,
		...topics,
		...items.map((item) => ({
			id: item.slug,
			label: item.title,
			section: item.section,
			discipline: item.discipline
		}))
	];
	/** @type {Array<{ source: string, target: string, kind: 'taxonomy' | 'section' | 'link' | 'tag' }>} */
	const edges = [];
	const edgeKeys = new Set();

	/**
	 * @param {string} source
	 * @param {string} target
	 * @param {'taxonomy' | 'section' | 'link' | 'tag'} kind
	 */
	function addEdge(source, target, kind) {
		if (source === target) return;
		const key = `${[source, target].sort().join('::')}::${kind}`;
		if (edgeKeys.has(key)) return;
		edgeKeys.add(key);
		edges.push({ source, target, kind });
	}

	addEdge('hub-projects', 'hub-diy', 'taxonomy');
	addEdge('hub-diy', 'hub-sport', 'taxonomy');
	addEdge('hub-sport', 'hub-projects', 'taxonomy');

	const slugSet = new Set(items.map((item) => item.slug));
	for (const item of items) {
		addEdge(`hub-${item.section}`, item.slug, 'section');
		for (const target of item.links) {
			if (slugSet.has(target)) addEdge(item.slug, target, 'link');
		}
	}

	for (const topic of topics) {
		const tag = topic.id.slice('topic-'.length);
		const entry = [...sharedTags.entries()].find(
			([key]) => key.replace(/[^a-z0-9]+/g, '-') === tag
		)?.[1];
		for (const slug of entry?.items ?? []) addEdge(slug, topic.id, 'tag');
	}

	return { nodes, edges };
}
