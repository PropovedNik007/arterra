import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import matter from 'gray-matter';
import { renderMarkdown, extractLinkTargets } from './markdown.js';
import { isSection, isDiscipline } from './types.js';

/** @typedef {import('./types.js').ContentItem} ContentItem */

/**
 * @param {string} dir
 * @returns {string[]}
 */
function walkMarkdownFiles(dir) {
	const entries = readdirSync(dir, { withFileTypes: true });
	/** @type {string[]} */
	const files = [];
	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...walkMarkdownFiles(fullPath));
		} else if (extname(entry.name) === '.md') {
			files.push(fullPath);
		}
	}
	return files;
}

/**
 * @param {string} body
 * @returns {string | undefined}
 */
function firstHeading(body) {
	const match = body.match(/^#\s+(.+)$/m);
	return match?.[1]?.trim();
}

/**
 * @param {string} body
 * @returns {string}
 */
function firstParagraph(body) {
	const withoutHeadings = body.replace(/^#.*$/gm, '').trim();
	const paragraph = withoutHeadings.split(/\n\s*\n/)[0] ?? '';
	return paragraph.replace(/\s+/g, ' ').trim();
}

/**
 * Loads and normalizes every markdown file under `root`, skipping any that
 * carry `visibility: private` or a missing/invalid `section` (and, for
 * `section: sport`, a missing/invalid `discipline`). Returns `[]` (with a
 * warning) if `root` doesn't exist yet, rather than throwing — the vault's
 * export step may not have run.
 * @param {string} [root]
 * @returns {Promise<ContentItem[]>}
 */
export async function loadContent(root = join(process.cwd(), 'content')) {
	if (!existsSync(root)) {
		console.warn(`[content] "${root}" does not exist yet — returning no content items`);
		return [];
	}

	const filePaths = walkMarkdownFiles(root);
	const raw = filePaths.map((filePath) => {
		const source = readFileSync(filePath, 'utf8');
		const { data, content } = matter(source);
		return { slug: basename(filePath, '.md'), data, body: content };
	});

	const slugSet = new Set(raw.map((note) => note.slug.toLowerCase()));

	/** @type {ContentItem[]} */
	const items = [];

	for (const note of raw) {
		const { slug, data, body } = note;

		if (data.visibility === 'private') {
			console.warn(`[content] skipping "${slug}": visibility is private`);
			continue;
		}

		if (!isSection(data.section)) {
			console.warn(`[content] skipping "${slug}": missing/invalid section "${String(data.section)}"`);
			continue;
		}

		const section = data.section;

		if (section === 'sport' && !isDiscipline(data.discipline)) {
			console.warn(`[content] skipping "${slug}": section is "sport" but discipline is missing/invalid`);
			continue;
		}

		const rawLinks = extractLinkTargets(body);
		const links = rawLinks
			.map((target) => target.replace(/\.md$/i, '').split('/').pop() ?? target)
			.filter((target) => slugSet.has(target.toLowerCase()));

		// Helper to convert Date to YYYY-MM-DD string, or keep as-is if already string
		const dateToString = (dateValue) => {
			if (typeof dateValue === 'string') return dateValue;
			if (dateValue instanceof Date) {
				const year = dateValue.getUTCFullYear();
				const month = String(dateValue.getUTCMonth() + 1).padStart(2, '0');
				const day = String(dateValue.getUTCDate()).padStart(2, '0');
				return `${year}-${month}-${day}`;
			}
			return '';
		};

		items.push({
			slug,
			section,
			discipline: section === 'sport' ? data.discipline : undefined,
			title: typeof data.title === 'string' ? data.title : (firstHeading(body) ?? slug),
			date: typeof data.date === 'string' ? data.date : dateToString(data.created),
			updated: typeof data.updated === 'string' ? data.updated : undefined,
			tags: Array.isArray(data.tags) ? data.tags : [],
			cover: typeof data.cover === 'string' ? data.cover : undefined,
			excerpt: typeof data.description === 'string' ? data.description : firstParagraph(body),
			html: await renderMarkdown(body),
			links,
			tech: Array.isArray(data.tech) ? data.tech : undefined,
			externalLink: typeof data.link === 'string' ? data.link : undefined,
			printer: typeof data.printer === 'string' ? data.printer : undefined,
			material: typeof data.material === 'string' ? data.material : undefined,
			distance_km: typeof data.distance_km === 'number' ? data.distance_km : undefined,
			gain_m: typeof data.gain_m === 'number' ? data.gain_m : undefined,
			region: typeof data.region === 'string' ? data.region : undefined,
			gpx: typeof data.gpx === 'string' ? data.gpx : undefined,
			led_group: typeof data.led_group === 'boolean' ? data.led_group : undefined
		});
	}

	return items.sort((a, b) => (a.date < b.date ? 1 : -1));
}
