import { describe, expect, it } from 'vitest';
import { buildFaq, featuredProjects, FAQ_GROUPS } from './faq.js';
import { byFeatured, loadContent } from './load.js';
import { cv, cvProjectPath } from './cv.js';
import { deniedWords } from '../testing/denylist.js';
import { buildSitemap, sitemapEntries } from '../seo/sitemap.js';
import { buildLlmsTxt } from '../seo/llms.js';
import { SITE_URL, jsonLdScript } from '../seo/site.js';

const items = await loadContent();
const featured = featuredProjects(items);
const faq = buildFaq(featured);
const sitePaths = new Set(sitemapEntries(items).map((entry) => entry.path));

/** Phone-number shapes: "+43 …", "(01) 234 …", "0664 123 4567". */
const PHONE = /\+\d[\d\s().-]{6,}\d|\(\d{2,5}\)\s?\d|\b\d{3,5}[\s.-]\d{3,4}[\s.-]?\d{3,4}\b/;

describe('faq', () => {
	it('has 10–14 entries with unique ids in known groups', () => {
		expect(faq.length).toBeGreaterThanOrEqual(10);
		expect(faq.length).toBeLessThanOrEqual(14);
		const ids = faq.map((entry) => entry.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
		const groups = new Set(FAQ_GROUPS.map((group) => group.id));
		for (const entry of faq) expect(groups.has(entry.group), entry.id).toBe(true);
	});

	it('gives every question a short, non-empty answer', () => {
		for (const entry of faq) {
			expect(entry.question.trim().endsWith('?'), entry.id).toBe(true);
			expect(entry.answer.trim().length, entry.id).toBeGreaterThan(20);
			expect(entry.answer, entry.id).not.toMatch(/undefined|null|\[object/);
			const sentences = entry.answer.split(/(?<=[.!?])\s+(?=[A-Z])/).length;
			expect(sentences, entry.id).toBeLessThanOrEqual(3);
		}
	});

	it('names no confidential work', () => {
		expect(deniedWords(JSON.stringify(faq))).toEqual([]);
	});

	it('mentions no phone numbers', () => {
		expect(PHONE.test('Call +43 664 123 4567')).toBe(true);
		for (const entry of faq) expect(entry.answer, entry.id).not.toMatch(PHONE);
	});

	it('links internally with site-relative paths that exist', () => {
		for (const entry of faq) {
			for (const link of entry.links ?? []) {
				expect(link.label, entry.id).toBeTruthy();
				if (/^(https:|mailto:)/.test(link.href)) continue;
				expect(link.href.startsWith('/'), link.href).toBe(true);
				expect(sitePaths.has(link.href.split('#')[0]), link.href).toBe(true);
			}
		}
	});

	it('lists the featured projects in published order', () => {
		const expected = byFeatured(items.filter((item) => item.section === 'projects'))
			.filter((item) => item.featured)
			.map((item) => item.slug);
		expect(featured.map((project) => project.slug)).toEqual(expected);
		const answer = faq.find((entry) => entry.id === 'featured-projects')?.answer ?? '';
		for (const project of featured) expect(answer).toContain(project.title);
	});

	it('takes CV facts from cv.js so they cannot drift', () => {
		/** @param {string} id */
		const answer = (id) => faq.find((entry) => entry.id === id)?.answer ?? '';
		const bsc = cv.education.find((entry) => entry.id === 'bsc-bmstu');
		const thesis = (bsc?.note ?? '').replace(/^Thesis:\s*/, '').replace(/\.$/, '');
		expect(thesis.length).toBeGreaterThan(10);
		expect(answer('education').toLowerCase()).toContain(thesis.toLowerCase());
		expect(answer('computer-vision').toLowerCase()).toContain(thesis.toLowerCase());
		const glosav = cv.experience.find((entry) => entry.id === 'glosav');
		expect(answer('computer-vision').toLowerCase()).toContain(
			(glosav?.summary ?? '?').replace(/\.$/, '').toLowerCase()
		);
		const aim = cv.awards.find((entry) => entry.id === 'aim-hackathon');
		const [place, event] = (aim?.title ?? '?').split(' · ');
		expect(answer('llm-and-rag')).toContain(event);
		expect(answer('llm-and-rag')).toContain(`placed ${place.replace(/\s*place$/, '')}`);
		const linked = faq.flatMap((entry) => entry.links ?? []).map((link) => link.href);
		for (const slug of [bsc?.project, glosav?.project, aim?.project]) {
			expect(slug).toBeTruthy();
			expect(linked).toContain(cvProjectPath(/** @type {string} */ (slug)));
		}
	});

	it('links the approved CV PDF', () => {
		const entry = faq.find((candidate) => candidate.id === 'cv-download');
		expect(entry?.answer).toContain(cv.pdf.href);
		expect(entry?.links?.some((link) => link.href === cv.pdf.href)).toBe(true);
	});
});

describe('sitemap', () => {
	const xml = buildSitemap(items);

	it('includes the FAQ, section pages, and every detail page with absolute URLs', () => {
		expect(xml).toContain(`<loc>${SITE_URL}/</loc>`);
		expect(xml).toContain(`<loc>${SITE_URL}/faq</loc>`);
		expect(xml).toContain(`<loc>${SITE_URL}/insights</loc>`);
		expect(xml).toContain(`<loc>${SITE_URL}/graph</loc>`);
		for (const item of items.slice(0, 5)) expect(xml).toContain(item.slug);
		for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
			expect(match[1].startsWith(`${SITE_URL}/`), match[1]).toBe(true);
		}
	});

	it('excludes the retro archive and names no confidential work', () => {
		expect(xml).not.toContain('/retro');
		expect(deniedWords(xml)).toEqual([]);
	});
});

describe('llms.txt', () => {
	const text = buildLlmsTxt({ faq, featured });

	it('follows the llms.txt shape and links the FAQ', () => {
		expect(text.startsWith(`# ${cv.name}\n`)).toBe(true);
		expect(text).toContain('## Pages');
		expect(text).toContain('## FAQ');
		expect(text).toContain('## Projects');
		expect(text).toContain(`(${SITE_URL}/faq)`);
		for (const entry of faq) expect(text).toContain(entry.question);
	});

	it('lists FAQ entries as llms.txt link lines with deep links', () => {
		const section = text.split('## FAQ')[1]?.split('\n## ')[0] ?? '';
		const lines = section.split('\n').filter((line) => line.trim());
		expect(lines).toHaveLength(faq.length);
		for (const line of lines)
			expect(line).toMatch(/^- \[[^\]]+\]\(https:\/\/[^)\s]+\/faq#[a-z0-9-]+\): \S/);
		expect(text).not.toMatch(/^###/m);
	});

	it('excludes the retro archive and names no confidential work', () => {
		expect(text).not.toContain('/retro');
		expect(deniedWords(text)).toEqual([]);
	});
});

describe('jsonLdScript', () => {
	it('escapes "<" so data cannot close the script element', () => {
		const html = jsonLdScript({ text: '</script><b>' });
		expect(html.match(/<\/script>/g)?.length).toBe(1);
		expect(html).toContain('\\u003c/script>');
	});
});
