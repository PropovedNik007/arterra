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

	it('uses the approved MSc period and contains no phone numbers', () => {
		const text = JSON.stringify(cv);
		expect(text).toContain('2022–2026');
		expect(text).not.toMatch(/\+\d[\d\s]{8,}/);
		expect(text.toLowerCase()).not.toMatch(/whatsapp/);
		expect(deniedWords(text)).toEqual([]);
	});
});
