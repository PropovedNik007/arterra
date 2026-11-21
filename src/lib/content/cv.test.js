import { describe, expect, it } from 'vitest';
import { cv, cvProjectSlugs } from './cv.js';
import { loadContent } from './load.js';
import { deniedWords } from '../testing/denylist.js';

describe('cv', () => {
	it('links only to projects that exist', async () => {
		const slugs = new Set(
			(await loadContent()).filter((item) => item.section === 'projects').map((item) => item.slug)
		);
		for (const slug of cvProjectSlugs()) expect(slugs.has(slug), slug).toBe(true);
	});

	it('uses the approved MSc period and names no confidential work', () => {
		const text = JSON.stringify(cv);
		expect(text).toContain('2022–2026');
		expect(deniedWords(text)).toEqual([]);
	});

	it('links the CV as an https PDF', () => {
		const url = new URL(cv.pdf.href);
		expect(url.protocol).toBe('https:');
		expect(url.pathname.endsWith('.pdf')).toBe(true);
		expect(cv.pdf.label).toBeTruthy();
		expect(cv.pdf.note).toBe('PDF');
	});
});
