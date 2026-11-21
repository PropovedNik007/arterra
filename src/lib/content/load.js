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
 * Detail-page headers already render the note title and excerpt. Remove that
 * same leading H1 and paragraph from the article body so they are not repeated.
 * @param {string} body
 * @returns {string}
 */
function articleBody(body) {
	const withoutTitle = body.trimStart().replace(/^#\s+.*(?:\r?\n)+/, '');
	if (withoutTitle.startsWith('#')) return withoutTitle;
	return withoutTitle.replace(/^[\s\S]*?(?:\r?\n){2}/, '');
}

/**
 * First public http(s) URL listed under a `## Links` heading, used as the
 * project's external link when the note has no `link:` frontmatter. `live` is
 * true only when its line is labelled `Live:` — a partner or programme homepage
 * (e.g. Rail4Future's) is not a live deployment of the work.
 * @param {string} body
 * @returns {{ url: string, live: boolean } | undefined}
 */
function linksSectionUrl(body) {
	const section = body.match(/^##\s+Links\s*$([\s\S]*?)(?=^#{1,2}\s|(?![\s\S]))/im)?.[1] ?? '';
	for (const line of section.split(/\r?\n/)) {
		const url = line.match(/https?:\/\/[^\s)>\]]+/)?.[0];
		if (url) return { url, live: /^\s*[-*]?\s*live\s*:/i.test(line) };
	}
	return undefined;
}

/**
 * Converts a Date or string value to a YYYY-MM-DD string.
 * Returns an empty string if value is undefined, null, or neither a string nor a Date.
 * @param {string | Date | undefined} dateValue
 * @returns {string}
 */
function dateToString(dateValue) {
	if (typeof dateValue === 'string') return dateValue;
	if (dateValue instanceof Date) {
		const year = dateValue.getUTCFullYear();
		const month = String(dateValue.getUTCMonth() + 1).padStart(2, '0');
		const day = String(dateValue.getUTCDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}
	return '';
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
			console.warn(
				`[content] skipping "${slug}": missing/invalid section "${String(data.section)}"`
			);
			continue;
		}

		const section = data.section;

		if (section === 'sport' && !isDiscipline(data.discipline)) {
			console.warn(
				`[content] skipping "${slug}": section is "sport" but discipline is missing/invalid`
			);
			continue;
		}

		const rawLinks = extractLinkTargets(body);
		const links = rawLinks
			.map((target) => target.replace(/\.md$/i, '').split('/').pop() ?? target)
			.filter((target) => slugSet.has(target.toLowerCase()));

		const listed = typeof data.link === 'string' && data.link ? undefined : linksSectionUrl(body);

		items.push({
			slug,
			section,
			discipline: section === 'sport' ? data.discipline : undefined,
			title: typeof data.title === 'string' ? data.title : (firstHeading(body) ?? slug),
			date: dateToString(data.date) || dateToString(data.created),
			updated: dateToString(data.updated) || undefined,
			tags: Array.isArray(data.tags) ? data.tags : [],
			cover: typeof data.cover === 'string' ? data.cover : undefined,
			excerpt: typeof data.description === 'string' ? data.description : firstParagraph(body),
			html: await renderMarkdown(articleBody(body)),
			links,
			tech: Array.isArray(data.tech) ? data.tech : undefined,
			externalLink: typeof data.link === 'string' && data.link ? data.link : listed?.url,
			// Frontmatter `link:` is the project's own link; a listed URL is live only if labelled so.
			externalLive: typeof data.link === 'string' && data.link ? true : Boolean(listed?.live),
			featured: data.featured === true,
			featuredOrder: typeof data.featured_order === 'number' ? data.featured_order : undefined,
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

/**
 * Featured items first (by `featured_order`), then everything else by date.
 * Returns a new array.
 * @param {ContentItem[]} items
 * @returns {ContentItem[]}
 */
export function byFeatured(items) {
	return [...items].sort((a, b) => {
		if (a.featured !== b.featured) return a.featured ? -1 : 1;
		if (a.featured && b.featured) return (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99);
		return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
	});
}
