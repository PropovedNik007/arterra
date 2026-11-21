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
	'multi-axis': ['3d-printing'],
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
	flexam: ['3d-printing'],
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

/** @type {Org[]} */
export const ORGS = [
	{
		id: 'tu-wien',
		label: 'TU Wien',
		kind: 'university',
		meta: 'MSc Data Science · 2022–2026',
		items: ['rail4future', 'davu-ocr']
	},
	{
		id: 'bmstu',
		label: 'Bauman Moscow State Technical University',
		kind: 'university',
		meta: 'BSc Information Technologies · 2014–2020',
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
		meta: '2nd place',
		items: ['aim-hackathon-greenwashing-rag']
	},
	{
		id: 'tourism-technology-hackathon',
		label: 'Tourism Technology Hackathon',
		kind: 'event',
		meta: '2023 · 2nd place',
		items: ['tourism-knowledge-graph']
	},
	{
		id: 'linwood',
		label: 'Linwood',
		kind: 'company',
		meta: 'Full-stack developer · 2018–2019',
		items: ['web-development-path']
	},
	{
		id: 'krk-group',
		label: 'KRK Group',
		kind: 'company',
		meta: 'Frontend developer · 2019',
		items: ['web-development-path']
	},
	{
		id: 'arterra-miniature',
		label: 'Arterra Miniature',
		kind: 'company',
		meta: 'Engineer & project manager · 2020–2021',
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
