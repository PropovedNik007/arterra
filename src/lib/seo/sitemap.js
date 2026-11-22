/**
 * Pure builders for the prerendered sitemap. Routes load content and pass it
 * in, so these stay testable without the filesystem.
 */

import { DISCIPLINES } from '../content/types.js';
import { DISCIPLINE_META, SECTION_META, itemPath } from '../design/sections.js';
import { SITE_URL } from './site.js';

/** Public routes without parameters, in navigation order. */
export const STATIC_PATHS = [
	'/',
	'/insights',
	SECTION_META.projects.path,
	SECTION_META.diy.path,
	SECTION_META.sport.path,
	...DISCIPLINES.map((discipline) => DISCIPLINE_META[discipline].path),
	'/about',
	'/contact',
	'/faq'
];

/** Routes that exist but are kept out of the sitemap (the archived design, the /graph redirect). */
export const EXCLUDED_PATHS = ['/retro', '/graph'];

/**
 * @typedef {object} SitemapEntry
 * @property {string} path Site-relative path without `base`.
 * @property {string} [lastmod] YYYY-MM-DD.
 */

/**
 * Every public page: static routes, then one detail page per content item.
 * @param {import('../content/types.js').ContentItem[]} items
 * @returns {SitemapEntry[]}
 */
export function sitemapEntries(items) {
	/** @type {SitemapEntry[]} */
	const entries = STATIC_PATHS.map((path) => ({ path }));
	for (const item of items) {
		const date = item.updated || item.date;
		entries.push({
			path: itemPath(item),
			lastmod: /^\d{4}-\d{2}-\d{2}$/.test(date ?? '') ? date : undefined
		});
	}
	const seen = new Set();
	return entries.filter((entry) => {
		if (EXCLUDED_PATHS.includes(entry.path) || seen.has(entry.path)) return false;
		seen.add(entry.path);
		return true;
	});
}

/** @param {string} value */
function escapeXml(value) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * @param {import('../content/types.js').ContentItem[]} items
 * @param {string} [siteUrl] Absolute site URL without a trailing slash.
 * @returns {string}
 */
export function buildSitemap(items, siteUrl = SITE_URL) {
	const urls = sitemapEntries(items).map((entry) => {
		const loc = entry.path === '/' ? `${siteUrl}/` : `${siteUrl}${entry.path}`;
		const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : '';
		return `\t<url><loc>${escapeXml(loc)}</loc>${lastmod}</url>`;
	});
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls,
		'</urlset>',
		''
	].join('\n');
}
