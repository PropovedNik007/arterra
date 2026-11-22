/**
 * Site-owned knowledge-map vocabulary.
 *
 * `content/` is overwritten by the Life OS export, so the fields of work and the
 * organisations behind each project live here instead of in note frontmatter.
 * Fields are assigned two ways and merged:
 *   1. TAG_FIELDS — tag-based rules, so newly exported notes are classified
 *      automatically from the tags they already carry.
 *   2. ITEM_FIELDS — a curated per-note list restored from the original
 *      portfolio vault's `[[Field]]` links, for relations tags cannot express.
 *
 * Only organisations already named in public notes or on the public site may
 * appear in ORGS. Never add private employers, clients, or confidential work.
 */

import { cv } from '../content/cv.js';

/** @typedef {{ id: string, label: string, description: string }} Domain */
/** @typedef {{ id: string, label: string, domain: string, description: string }} Field */
/**
 * @typedef {object} Org
 * @property {string} id
 * @property {string} label
 * @property {'university' | 'company' | 'partner' | 'event' | 'club'} kind
 * @property {string} [meta] Short public role/period line shown in the tooltip.
 * @property {string} [url] Public website, only when already published on the site.
 * @property {string[]} [items] Content slugs this organisation is connected to.
 * @property {string[]} [fields] Field ids this organisation is connected to.
 * @property {string[]} [disciplines] Sport disciplines this organisation is connected to.
 */

/** @type {Domain[]} */
export const DOMAINS = [
	{
		id: 'data-science',
		label: 'Data Science',
		description: 'Modelling, perception, language, and analysis.'
	},
	{
		id: 'software',
		label: 'Software Engineering',
		description: 'Services, interfaces, and systems that ship.'
	},
	{
		id: 'making',
		label: 'Making & Hardware',
		description: 'Physical prototyping, printers, and fabrication.'
	}
];

/** @type {Field[]} */
export const FIELDS = [
	{
		id: 'ml',
		label: 'Machine Learning',
		domain: 'data-science',
		description: 'Supervised models, training pipelines, and evaluation.'
	},
	{
		id: 'cv',
		label: 'Computer Vision',
		domain: 'data-science',
		description: 'Detection, tracking, OCR, and video understanding.'
	},
	{
		id: '3d-geometry',
		label: '3D Segmentation & Geometry',
		domain: 'data-science',
		description: 'Mesh segmentation, part analysis, and computational geometry.'
	},
	{
		id: 'nlp',
		label: 'NLP',
		domain: 'data-science',
		description: 'Entity extraction, classification, and text understanding.'
	},
	{
		id: 'llm',
		label: 'LLMs & RAG',
		domain: 'data-science',
		description: 'Retrieval-augmented generation and applied language models.'
	},
	{
		id: 'analytics',
		label: 'Data Analytics',
		domain: 'data-science',
		description: 'Pipelines, geospatial data, and knowledge graphs.'
	},
	{
		id: 'time-series',
		label: 'Time Series',
		domain: 'data-science',
		description: 'Sequential signals, forecasting, and market data.'
	},
	{
		id: 'backend',
		label: 'Back-end',
		domain: 'software',
		description: 'APIs, async services, and cloud infrastructure.'
	},
	{
		id: 'frontend',
		label: 'Front-end',
		domain: 'software',
		description: 'Web interfaces in React, Svelte, and Next.js.'
	},
	{
		id: 'web3',
		label: 'Web3',
		domain: 'software',
		description: 'Blockchain integrations, wallets, and exchange APIs.'
	},
	{
		id: 'iot',
		label: 'IoT & Edge',
		domain: 'software',
		description: 'Real-time inference close to cameras and devices.'
	},
	{
		id: '3d-printing',
		label: '3D Printing',
		domain: 'making',
		description: 'Resin and multi-axis printing, from software to miniatures.'
	},
	{
		id: 'toolpaths',
		label: 'Toolpaths & G-code',
		domain: 'making',
		description: 'Slicing, toolpath generation, and G-code for additive manufacturing.'
	},
	{
		id: 'robotics',
		label: 'Robotics',
		domain: 'making',
		description: 'Robot arms and multi-axis motion for fabrication cells.'
	}
];

/**
 * Lower-cased tag → field ids. Tags that are themselves field names are also
 * listed in FIELD_TAGS so they don't reappear as separate topic nodes.
 * @type {Record<string, string[]>}
 */
export const TAG_FIELDS = {
	'machine-learning': ['ml'],
	ml: ['ml'],
	pytorch: ['ml'],
	tensorflow: ['ml'],
	'scikit-learn': ['ml'],
	lstm: ['ml', 'time-series'],
	bert: ['ml', 'nlp'],
	yolo: ['ml', 'cv'],
	yolov4: ['ml', 'cv'],
	'computer-vision': ['cv'],
	opencv: ['cv'],
	ocr: ['cv'],
	tesseract: ['cv'],
	'av-hubert': ['cv'],
	nlp: ['nlp'],
	spacy: ['nlp'],
	llm: ['llm'],
	rag: ['llm'],
	langchain: ['llm'],
	openai: ['llm'],
	'llama-3': ['llm'],
	'data-science': ['analytics'],
	analytics: ['analytics'],
	geopandas: ['analytics'],
	folium: ['analytics'],
	'knowledge-graph': ['analytics'],
	'time-series': ['time-series'],
	fastapi: ['backend'],
	flask: ['backend'],
	django: ['backend'],
	asyncio: ['backend'],
	aws: ['backend'],
	'full-stack': ['backend', 'frontend'],
	backend: ['backend'],
	react: ['frontend'],
	svelte: ['frontend'],
	'next.js': ['frontend'],
	frontend: ['frontend'],
	'web-development': ['frontend', 'backend'],
	web3: ['web3'],
	nft: ['web3'],
	metamask: ['web3'],
	polygon: ['web3'],
	solidity: ['web3'],
	crypto: ['web3'],
	binance: ['web3'],
	iot: ['iot'],
	'3d-printing': ['3d-printing'],
	'multi-axis': ['3d-printing', 'robotics'],
	'additive-manufacturing': ['3d-printing'],
	'3d-segmentation': ['3d-geometry', 'cv'],
	'mesh-processing': ['3d-geometry'],
	'computational-geometry': ['3d-geometry'],
	trimesh: ['3d-geometry'],
	slicing: ['toolpaths', '3d-printing'],
	'toolpath-generation': ['toolpaths'],
	'g-code': ['toolpaths'],
	robotics: ['robotics'],
	'robot-arms': ['robotics'],
	resin: ['3d-printing']
};

/**
 * Tags that name a field (or a generic discipline) rather than a concrete tool
 * or topic; they are expressed through field nodes, not topic nodes.
 */
export const FIELD_TAGS = new Set([
	'machine-learning',
	'ml',
	'computer-vision',
	'nlp',
	'llm',
	'rag',
	'data-science',
	'analytics',
	'time-series',
	'full-stack',
	'backend',
	'frontend',
	'web-development',
	'web3',
	'iot',
	'3d-printing',
	'additive-manufacturing',
	'multi-axis',
	'3d-segmentation',
	'mesh-processing',
	'computational-geometry',
	'slicing',
	'toolpath-generation',
	'g-code',
	'robotics',
	'robot-arms',
	'software-engineering'
]);

/**
 * Curated fields per note, restored from the original portfolio vault's
 * `[[Field]]` links (its `WEB` field is folded into Front-end).
 * @type {Record<string, string[]>}
 */
export const ITEM_FIELDS = {
	'aim-hackathon-greenwashing-rag': ['ml', 'llm', 'nlp'],
	cryptex: ['web3', 'frontend', 'backend'],
	'davu-ocr': ['cv', 'ml', 'llm', 'nlp'],
	flexam: [
		'3d-printing',
		'3d-geometry',
		'toolpaths',
		'robotics',
		'cv',
		'ml',
		'backend',
		'frontend'
	],
	glosav: ['iot', 'cv', 'ml'],
	lawsyncr: ['ml', 'llm', 'nlp'],
	printerra: ['iot', 'cv', 'ml', '3d-printing'],
	rail4future: ['ml', 'time-series'],
	'red-cross-lip-reading': ['cv', 'llm', 'backend'],
	reelmate: ['backend', 'llm', 'frontend'],
	susteam: ['backend', 'frontend', 'ml', 'llm', 'nlp'],
	'tourism-knowledge-graph': ['ml', 'analytics', 'backend', 'frontend'],
	tradebot: ['backend', 'web3', 'analytics', 'time-series'],
	'web-development-path': ['frontend', 'backend'],
	'2026-04-miniature-batch': ['3d-printing']
};

/**
 * Tooltip line for an organisation, read from the CV so the two never drift.
 * @param {'education' | 'experience'} list
 * @param {string} id CV entry id
 * @returns {string}
 */
function cvMeta(list, id) {
	/** @type {{ id: string, degree?: string, role?: string, period: string }[]} */
	const entries = cv[list];
	const entry = entries.find((candidate) => candidate.id === id);
	if (!entry) throw new Error(`taxonomy: no CV ${list} entry "${id}"`);
	return `${entry.degree ?? entry.role} · ${entry.period}`;
}

/**
 * Tooltip line for a hackathon, read from the CV awards: "Oct 2024 · 2nd place".
 * @param {string} id CV award id
 * @returns {string}
 */
function awardMeta(id) {
	const award = cv.awards.find((candidate) => candidate.id === id);
	if (!award) throw new Error(`taxonomy: no CV award "${id}"`);
	return `${award.period} · ${award.title.split(' · ')[0]}`;
}

/** @type {Org[]} */
export const ORGS = [
	{
		id: 'tu-wien',
		label: 'TU Wien',
		kind: 'university',
		meta: cvMeta('education', 'msc-tu-wien'),
		items: ['rail4future', 'davu-ocr']
	},
	{
		id: 'bmstu',
		label: 'Bauman Moscow State Technical University',
		kind: 'university',
		meta: cvMeta('education', 'bsc-bmstu'),
		items: ['printerra']
	},
	{
		id: 'siemens',
		label: 'Siemens',
		kind: 'partner',
		meta: 'Industrial partner on Rail4Future',
		items: ['rail4future']
	},
	{
		id: 'oebb',
		label: 'ÖBB',
		kind: 'partner',
		meta: 'Austrian Federal Railways · Rail4Future partner',
		items: ['rail4future']
	},
	{
		id: 'austrian-red-cross',
		label: 'Austrian Red Cross',
		kind: 'partner',
		meta: 'Client of the lip-reading app',
		items: ['red-cross-lip-reading']
	},
	{
		id: 'coding-austria',
		label: 'Coding Austria',
		kind: 'company',
		meta: 'Delivered the Red Cross lip-reading app',
		items: ['red-cross-lip-reading']
	},
	{
		id: 'timetoact',
		label: 'AIM Hackathon · TIMETOACT Group',
		kind: 'event',
		meta: awardMeta('aim-hackathon'),
		items: ['aim-hackathon-greenwashing-rag']
	},
	{
		id: 'tourism-technology-hackathon',
		label: 'Tourism Technology Hackathon',
		kind: 'event',
		meta: awardMeta('tourism-hackathon'),
		items: ['tourism-knowledge-graph']
	},
	{
		id: 'linwood',
		label: 'Linwood',
		kind: 'company',
		meta: cvMeta('experience', 'linwood'),
		items: ['web-development-path']
	},
	{
		id: 'krk-group',
		label: 'KRK Group',
		kind: 'company',
		meta: cvMeta('experience', 'krk-group'),
		items: ['web-development-path']
	},
	{
		id: 'arterra-miniature',
		label: 'Arterra Miniature',
		kind: 'company',
		meta: cvMeta('experience', 'arterra-miniature'),
		fields: ['3d-printing']
	},
	{
		id: 'unity-fight-club',
		label: 'Unity Fight Club',
		kind: 'club',
		meta: 'Boxing gym · Vienna',
		url: 'https://unity-fight.club/feed',
		disciplines: ['boxing']
	}
];

export const ORG_KIND_LABELS = {
	university: 'University',
	company: 'Company',
	partner: 'Partner',
	event: 'Hackathon',
	club: 'Club'
};

/**
 * Field ids for a content item: curated list ∪ tag rules, in FIELDS order.
 * @param {{ slug: string, tags: string[] }} item
 * @returns {string[]}
 */
export function fieldsFor(item) {
	const ids = new Set(ITEM_FIELDS[item.slug] ?? []);
	for (const tag of item.tags) {
		for (const id of TAG_FIELDS[String(tag).toLowerCase()] ?? []) ids.add(id);
	}
	return FIELDS.filter((field) => ids.has(field.id)).map((field) => field.id);
}

/**
 * Field ids ordered for display: the curated ITEM_FIELDS order first (it puts
 * a note's defining fields up front), then any tag-derived fields in FIELDS order.
 * @param {string} slug
 * @param {string[]} ids field ids, e.g. from `fieldsFor`
 * @returns {string[]}
 */
export function displayFields(slug, ids) {
	const present = new Set(ids);
	const curated = (ITEM_FIELDS[slug] ?? []).filter((id) => present.has(id));
	const chosen = new Set(curated);
	return [...curated, ...ids.filter((id) => !chosen.has(id))];
}

/**
 * Domain id that best describes a list of fields: the domain with the most
 * fields, ties broken by the earliest field in the list.
 * @param {string[]} ids field ids in display order
 * @returns {string | undefined}
 */
export function leadDomain(ids) {
	/** @type {Map<string, number>} */
	const counts = new Map();
	for (const id of ids) {
		const domain = FIELDS.find((field) => field.id === id)?.domain;
		if (domain) counts.set(domain, (counts.get(domain) ?? 0) + 1);
	}
	let best;
	let bestCount = 0;
	for (const [domain, count] of counts) {
		if (count > bestCount) {
			best = domain;
			bestCount = count;
		}
	}
	return best;
}
