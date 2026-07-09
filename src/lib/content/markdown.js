import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const MD_LINK_RE = /\[[^\]]*\]\(([^)#\s]+)(?:[^)]*)?\)/g;

/**
 * Converts `[[Target]]` / `[[Target|Label]]` wikilinks into standard markdown links.
 * @param {string} raw
 * @returns {string}
 */
export function convertWikilinks(raw) {
	return raw.replace(WIKILINK_RE, (_match, target, label) => {
		const cleanTarget = target.trim();
		const text = (label ?? cleanTarget).trim();
		return `[${text}](${encodeURI(cleanTarget)})`;
	});
}

/**
 * Extracts every internal link target (wikilink or markdown link) from raw markdown source.
 * External http(s)/mailto links are excluded. Order-preserving, deduplicated.
 * @param {string} raw
 * @returns {string[]}
 */
export function extractLinkTargets(raw) {
	/** @type {Set<string>} */
	const targets = new Set();

	for (const match of raw.matchAll(WIKILINK_RE)) {
		targets.add(match[1].trim());
	}

	const withoutWikilinks = raw.replace(WIKILINK_RE, '');
	for (const match of withoutWikilinks.matchAll(MD_LINK_RE)) {
		const url = decodeURI(match[1].trim());
		if (/^https?:\/\//i.test(url) || url.startsWith('mailto:')) continue;
		targets.add(url);
	}

	return [...targets];
}

const processor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkRehype)
	.use(rehypeSlug)
	.use(rehypeHighlight)
	.use(rehypeStringify);

/**
 * Renders a markdown body (with wikilinks resolved to normal links) to an HTML string.
 * @param {string} raw
 * @returns {Promise<string>}
 */
export async function renderMarkdown(raw) {
	const withLinks = convertWikilinks(raw);
	const file = await processor.process(withLinks);
	return String(file);
}
