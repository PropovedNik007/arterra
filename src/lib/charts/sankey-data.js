import { sankey, sankeyJustify, sankeyLinkHorizontal } from 'd3-sankey';

/**
 * Pure data shaping for the "How the work flows" Sankey chart.
 *
 * Everything is derived from the public knowledge graph (`graph.json`, built by
 * $lib/graph/build.js): domain → field edges, item → field edges, and the
 * item nodes of the `projects` and `diy` sections. Sport notes are skipped.
 * No quantities are invented: every project counts as exactly 1 and is split
 * evenly across the n fields it is tagged with (1/n each), so the chart sums to
 * the number of classified projects.
 */

/** @typedef {import('$lib/graph/build.js').GraphData} GraphData */
/** @typedef {import('$lib/graph/build.js').GraphNode} GraphNode */

/**
 * @typedef {object} SankeyDomain
 * @property {string} id
 * @property {string} label
 * @property {number} value Sum of the project shares flowing through its fields.
 * @property {number} projectCount Distinct projects and DIY builds touching any of its fields.
 * @property {number} diyCount How many of those are DIY builds.
 * @property {string[]} fieldIds
 *
 * @typedef {object} SankeyField
 * @property {string} id
 * @property {string} label
 * @property {string | null} href Site-relative (no base).
 * @property {string} domainId
 * @property {number} value Sum of project shares.
 * @property {number} projectCount Projects and DIY builds tagged with it.
 * @property {number} diyCount How many of those are DIY builds (the field's
 *   `href` lists the projects section only, so it shows projectCount - diyCount).
 * @property {string[]} projectIds
 *
 * @typedef {object} SankeyProject
 * @property {string} id
 * @property {string} label
 * @property {string} shortLabel Label up to the first " — ", for the chart.
 * @property {string | null} href Site-relative (no base).
 * @property {'projects' | 'diy'} section
 * @property {string[]} fieldIds
 * @property {number} share 1 / fieldIds.length.
 *
 * @typedef {'domain' | 'field' | 'project'} SankeyNodeKind
 * @typedef {'field' | 'projects' | 'diy'} SankeyTone
 *
 * @typedef {object} SankeyNode
 * @property {string} id
 * @property {string} label
 * @property {string} shortLabel
 * @property {SankeyNodeKind} kind
 * @property {SankeyTone} tone Same colour families as the knowledge graph.
 * @property {string | null} href
 * @property {number} value
 * @property {number} column 0 = domain, 1 = field, 2 = project.
 * @property {number} order Rank inside its column (top to bottom).
 *
 * @typedef {object} SankeyLink
 * @property {string} id
 * @property {string} source
 * @property {string} target
 * @property {number} value
 * @property {'domain-field' | 'field-project'} kind
 * @property {SankeyTone} tone
 * @property {number} projectCount Projects carried by this flow.
 *
 * @typedef {object} SankeyData
 * @property {SankeyDomain[]} domains Sorted top to bottom.
 * @property {SankeyField[]} fields Sorted top to bottom.
 * @property {SankeyProject[]} projects Sorted top to bottom.
 * @property {SankeyNode[]} nodes
 * @property {SankeyLink[]} links
 * @property {number} total Number of classified projects (= sum of all shares).
 * @property {{ id: string, label: string, href: string | null, section: string }[]} unclassified
 *   Projects/DIY notes with no field of work; left out of the flow.
 */

const SECTIONS = new Set(['projects', 'diy']);

/** Deterministic, locale-independent string order. */
const byText = (/** @type {string} */ a, /** @type {string} */ b) => (a < b ? -1 : a > b ? 1 : 0);

/** @param {string} label */
export function shortLabel(label) {
	const [head] = label.split(/\s+—\s+/);
	return head.trim() || label;
}

/**
 * @param {GraphData} graphData
 * @returns {SankeyData}
 */
export function buildSankeyData(graphData) {
	const nodes = graphData?.nodes ?? [];
	const edges = graphData?.edges ?? [];
	const byId = new Map(nodes.map((node) => [node.id, node]));
	const kindOf = (/** @type {string} */ id) => byId.get(id)?.kind;

	/** field id → domain id, from domain edges (direction-agnostic). */
	const fieldDomain = new Map();
	/** item id → Set of field ids, from field edges (direction-agnostic). */
	const itemFieldSet = new Map();
	for (const edge of edges) {
		const pair = [edge.source, edge.target];
		const domain = pair.find((id) => kindOf(id) === 'domain');
		const field = pair.find((id) => kindOf(id) === 'field');
		const item = pair.find((id) => kindOf(id) === 'item');
		if (edge.kind === 'domain' && domain && field) fieldDomain.set(field, domain);
		if (edge.kind === 'field' && item && field) {
			if (!itemFieldSet.has(item)) itemFieldSet.set(item, new Set());
			itemFieldSet.get(item).add(field);
		}
	}

	// Graph order of fields/domains is the taxonomy order; keep it as the final tiebreak.
	const graphIndex = new Map(nodes.map((node, index) => [node.id, index]));

	/** @type {SankeyProject[]} */
	const classified = [];
	/** @type {SankeyData['unclassified']} */
	const unclassified = [];
	for (const node of nodes) {
		if (node.kind !== 'item' || !node.section || !SECTIONS.has(node.section)) continue;
		const fieldIds = [...(itemFieldSet.get(node.id) ?? [])]
			.filter((id) => fieldDomain.has(id))
			.sort((a, b) => (graphIndex.get(a) ?? 0) - (graphIndex.get(b) ?? 0));
		if (!fieldIds.length) {
			unclassified.push({
				id: node.id,
				label: node.label,
				href: node.href,
				section: node.section
			});
			continue;
		}
		classified.push({
			id: node.id,
			label: node.label,
			shortLabel: shortLabel(node.label),
			href: node.href,
			section: /** @type {'projects' | 'diy'} */ (node.section),
			fieldIds,
			share: 1 / fieldIds.length
		});
	}

	// Field values: sum of shares from the projects tagged with them.
	/** @type {Map<string, SankeyField>} */
	const fieldMap = new Map();
	for (const project of classified) {
		for (const id of project.fieldIds) {
			const node = /** @type {GraphNode} */ (byId.get(id));
			/** @type {SankeyField} */
			const field = fieldMap.get(id) ?? {
				id,
				label: node.label,
				href: node.href,
				domainId: fieldDomain.get(id),
				value: 0,
				projectCount: 0,
				diyCount: 0,
				projectIds: []
			};
			field.value += project.share;
			field.projectCount += 1;
			if (project.section === 'diy') field.diyCount += 1;
			field.projectIds.push(project.id);
			fieldMap.set(id, field);
		}
	}

	/** @type {Map<string, SankeyDomain>} */
	const domainMap = new Map();
	for (const field of fieldMap.values()) {
		const node = /** @type {GraphNode} */ (byId.get(field.domainId));
		/** @type {SankeyDomain} */
		const domain = domainMap.get(field.domainId) ?? {
			id: field.domainId,
			label: node.label,
			value: 0,
			projectCount: 0,
			diyCount: 0,
			fieldIds: []
		};
		domain.value += field.value;
		domain.fieldIds.push(field.id);
		domainMap.set(field.domainId, domain);
	}
	for (const domain of domainMap.values()) {
		const touching = new Set(domain.fieldIds.flatMap((id) => fieldMap.get(id)?.projectIds ?? []));
		domain.projectCount = touching.size;
		domain.diyCount = classified.filter(
			(project) => project.section === 'diy' && touching.has(project.id)
		).length;
	}

	// Fixed ordering: value desc, then label, then graph order.
	/** @param {{ id: string, label: string, value: number }} a @param {{ id: string, label: string, value: number }} b */
	const byWeight = (a, b) =>
		round(b.value) - round(a.value) ||
		byText(a.label, b.label) ||
		(graphIndex.get(a.id) ?? 0) - (graphIndex.get(b.id) ?? 0);

	const domains = [...domainMap.values()].sort(byWeight);
	const domainRank = new Map(domains.map((domain, index) => [domain.id, index]));
	for (const domain of domains) {
		domain.fieldIds.sort((a, b) =>
			byWeight(
				/** @type {SankeyField} */ (fieldMap.get(a)),
				/** @type {SankeyField} */ (fieldMap.get(b))
			)
		);
	}
	// Fields grouped by domain (so domain ribbons never cross), heaviest first.
	const fields = [...fieldMap.values()].sort(
		(a, b) =>
			(domainRank.get(a.domainId) ?? 0) - (domainRank.get(b.domainId) ?? 0) || byWeight(a, b)
	);
	const fieldRank = new Map(fields.map((field, index) => [field.id, index]));
	for (const field of fields) {
		field.projectIds.sort(byText);
	}

	// Projects by the weighted mean rank of their fields (barycentre), which keeps
	// ribbons short and untangled, then section, then label.
	const barycentre = (/** @type {SankeyProject} */ project) =>
		project.fieldIds.reduce((sum, id) => sum + (fieldRank.get(id) ?? 0), 0) /
		project.fieldIds.length;
	const projects = classified.sort(
		(a, b) =>
			round(barycentre(a)) - round(barycentre(b)) ||
			byText(a.section, b.section) ||
			byText(a.label, b.label) ||
			byText(a.id, b.id)
	);
	const projectRank = new Map(projects.map((project, index) => [project.id, index]));
	for (const field of fields) {
		field.projectIds.sort((a, b) => (projectRank.get(a) ?? 0) - (projectRank.get(b) ?? 0));
	}

	/** @type {SankeyNode[]} */
	const sankeyNodes = [
		...domains.map((domain, order) => ({
			id: domain.id,
			label: domain.label,
			shortLabel: domain.label,
			kind: /** @type {const} */ ('domain'),
			tone: /** @type {const} */ ('field'),
			href: null,
			value: domain.value,
			column: 0,
			order
		})),
		...fields.map((field, order) => ({
			id: field.id,
			label: field.label,
			shortLabel: field.label,
			kind: /** @type {const} */ ('field'),
			tone: /** @type {const} */ ('field'),
			href: field.href,
			value: field.value,
			column: 1,
			order
		})),
		...projects.map((project, order) => ({
			id: project.id,
			label: project.label,
			shortLabel: project.shortLabel,
			kind: /** @type {const} */ ('project'),
			tone: project.section,
			href: project.href,
			value: 1,
			column: 2,
			order
		}))
	];

	/** @type {SankeyLink[]} */
	const links = [];
	for (const field of fields) {
		links.push({
			id: `${field.domainId}->${field.id}`,
			source: field.domainId,
			target: field.id,
			value: field.value,
			kind: 'domain-field',
			tone: 'field',
			projectCount: field.projectCount
		});
	}
	for (const field of fields) {
		for (const projectId of field.projectIds) {
			const project = projects[/** @type {number} */ (projectRank.get(projectId))];
			links.push({
				id: `${field.id}->${project.id}`,
				source: field.id,
				target: project.id,
				value: project.share,
				kind: 'field-project',
				tone: project.section,
				projectCount: 1
			});
		}
	}

	unclassified.sort((a, b) => byText(a.label, b.label));

	return {
		domains,
		fields,
		projects,
		nodes: sankeyNodes,
		links,
		total: projects.length,
		unclassified
	};
}

/** Round away floating-point noise before comparing sums. */
function round(/** @type {number} */ value) {
	return Math.round(value * 1e6) / 1e6;
}

/**
 * Ids of every link and node that light up when a node or a link is active:
 * the active element, everything upstream of its source end and everything
 * downstream of its target end (never back-tracking through other branches).
 * @param {SankeyData} data
 * @returns {Map<string, { links: Set<string>, nodes: Set<string> }>} keyed by node id or link id
 */
export function buildHighlights(data) {
	/** @type {Map<string, SankeyLink[]>} */
	const incoming = new Map();
	/** @type {Map<string, SankeyLink[]>} */
	const outgoing = new Map();
	for (const link of data.links) {
		incoming.set(link.target, [...(incoming.get(link.target) ?? []), link]);
		outgoing.set(link.source, [...(outgoing.get(link.source) ?? []), link]);
	}

	/** @param {string} start @param {Map<string, SankeyLink[]>} step @param {'source' | 'target'} next @param {Set<string>} into */
	function walk(start, step, next, into) {
		const queue = [start];
		while (queue.length) {
			const id = /** @type {string} */ (queue.shift());
			for (const link of step.get(id) ?? []) {
				if (into.has(link.id)) continue;
				into.add(link.id);
				queue.push(link[next]);
			}
		}
	}

	/** @param {Set<string>} linkIds @param {string[]} extraNodes */
	function withNodes(linkIds, extraNodes) {
		const nodes = new Set(extraNodes);
		for (const link of data.links) {
			if (!linkIds.has(link.id)) continue;
			nodes.add(link.source);
			nodes.add(link.target);
		}
		return { links: linkIds, nodes };
	}

	/** @type {Map<string, { links: Set<string>, nodes: Set<string> }>} */
	const result = new Map();
	for (const node of data.nodes) {
		const linkIds = new Set();
		walk(node.id, incoming, 'source', linkIds);
		walk(node.id, outgoing, 'target', linkIds);
		result.set(node.id, withNodes(linkIds, [node.id]));
	}
	for (const link of data.links) {
		const linkIds = new Set([link.id]);
		walk(link.source, incoming, 'source', linkIds);
		walk(link.target, outgoing, 'target', linkIds);
		result.set(link.id, withNodes(linkIds, []));
	}
	return result;
}

/**
 * @typedef {SankeyNode & { x0: number, x1: number, y0: number, y1: number }} LaidOutNode
 * @typedef {SankeyLink & { path: string, width: number, y0: number, y1: number }} LaidOutLink
 * @typedef {{ width: number, height: number, nodes: LaidOutNode[], links: LaidOutLink[] }} SankeyLayoutResult
 */

/**
 * Synchronous d3-sankey layout (safe to run during SSR/prerender). The input is
 * cloned, so `data` is never mutated. Node order inside each column is fixed by
 * `order`, so the layout is identical on every build.
 * @param {SankeyData} data
 * @param {object} options
 * @param {number} options.width viewBox width
 * @param {number} options.height viewBox height
 * @param {number} [options.nodeWidth]
 * @param {number} [options.nodePadding]
 * @param {number} [options.left] Space reserved left of the first column.
 * @param {number} [options.right] Space reserved right of the last column (labels).
 * @param {number} [options.top]
 * @param {number} [options.bottom]
 * @returns {SankeyLayoutResult}
 */
export function layoutSankey(data, options) {
	const {
		width,
		height,
		nodeWidth = 12,
		nodePadding = 8,
		left = 0,
		right = 0,
		top = 0,
		bottom = 0
	} = options;
	if (!data.nodes.length || !data.links.length) return { width, height, nodes: [], links: [] };

	const layout = sankey()
		.nodeId((/** @type {SankeyNode} */ node) => node.id)
		.nodeAlign(sankeyJustify)
		.nodeSort(
			(/** @type {SankeyNode} */ a, /** @type {SankeyNode} */ b) =>
				a.column - b.column || a.order - b.order
		)
		.nodeWidth(nodeWidth)
		.nodePadding(nodePadding)
		.extent([
			[left, top],
			[width - right, height - bottom]
		]);

	const graph = layout({
		nodes: data.nodes.map((node) => ({ ...node })),
		links: data.links.map((link) => ({ ...link }))
	});
	const linkPath = sankeyLinkHorizontal();
	const fix = (/** @type {number} */ value) => Math.round(value * 100) / 100;
	const nodeById = new Map(data.nodes.map((node) => [node.id, node]));
	const linkById = new Map(data.links.map((link) => [link.id, link]));

	return {
		width,
		height,
		nodes: graph.nodes.map((node) => ({
			.../** @type {SankeyNode} */ (nodeById.get(String(node.id))),
			x0: fix(node.x0),
			x1: fix(node.x1),
			y0: fix(node.y0),
			y1: fix(node.y1)
		})),
		links: graph.links.map((link) => {
			const original = /** @type {SankeyLink} */ (linkById.get(String(link.id)));
			return {
				...original,
				path: (linkPath(link) ?? '').replace(/\d+\.\d+/g, (n) => String(fix(Number(n)))),
				width: fix(Math.max(1, link.width)),
				y0: fix(link.y0),
				y1: fix(link.y1)
			};
		})
	};
}

/**
 * Vertical positions for one column of labels so that none overlap. Each label
 * keeps its anchor (the node's centre) when it can; a label that would collide
 * with the one above is pushed down, and labels that would run past `max` are
 * pushed back up. Deterministic, so the prerendered chart never changes.
 * @param {{ id: string, y: number, size: number }[]} labels `y` is the wanted centre, `size` the label's height
 * @param {{ min: number, max: number, gap?: number }} bounds
 * @returns {Map<string, number>} centre y per label id
 */
export function spreadLabels(labels, { min, max, gap = 0 }) {
	const sorted = [...labels].sort((a, b) => a.y - b.y || a.id.localeCompare(b.id));
	const centres = sorted.map((label) => label.y);
	let floor = min;
	sorted.forEach((label, index) => {
		const top = Math.max(centres[index] - label.size / 2, floor);
		centres[index] = top + label.size / 2;
		floor = top + label.size + gap;
	});
	let ceiling = max;
	for (let index = sorted.length - 1; index >= 0; index -= 1) {
		const label = sorted[index];
		const bottom = Math.min(centres[index] + label.size / 2, ceiling);
		centres[index] = bottom - label.size / 2;
		ceiling = bottom - label.size - gap;
	}
	return new Map(sorted.map((label, index) => [label.id, Math.round(centres[index] * 100) / 100]));
}
