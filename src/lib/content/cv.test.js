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

	it('dates every award, newest first', () => {
		const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
		/** @param {string} period */
		const order = (period) => {
			const [month, year] = period.split(' ');
			return Number(year) * 12 + MONTHS.indexOf(month);
		};
		for (const award of cv.awards) {
			expect(award.period, award.id).toMatch(
				/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/
			);
			expect(award.title, award.id).toMatch(/^(\d+(st|nd|rd|th) place|Finalist) · \S/);
			expect(award.title, award.id).not.toMatch(/\d{4}$/);
		}
		const periods = cv.awards.map((award) => order(award.period));
		expect(periods).toEqual([...periods].sort((a, b) => b - a));
	});

	it('cites the publication with its exact title and a resolvable DOI', () => {
		expect(cv.publications.length).toBeGreaterThan(0);
		for (const publication of cv.publications) {
			expect(publication.title).toBe(
				'Comparative Analysis of Machine Learning-based Surrogate Modeling Approaches for Multi-body Dynamic Simulation in Railway Digital Twin Platform'
			);
			expect(publication.doi).toMatch(/^10\.\d{4,9}\/\S+$/);
			expect(publication.url).toBe(`https://doi.org/${publication.doi}`);
			expect(publication.pages).toMatch(/^\d+–\d+$/);
			expect(publication.venue).toContain(publication.year);
			expect(publication.credit).toContain(publication.leadAuthor);
		}
	});

	it('calls the BSc thesis a diploma thesis', () => {
		const bsc = cv.education.find((entry) => entry.id === 'bsc-bmstu');
		expect(bsc?.thesis).toBeTruthy();
		expect(bsc?.note).toBe(`Diploma thesis: ${bsc?.thesis}.`);
	});

	it('links the CV as an https PDF', () => {
		const url = new URL(cv.pdf.href);
		expect(url.protocol).toBe('https:');
		expect(url.pathname.endsWith('.pdf')).toBe(true);
		expect(cv.pdf.label).toBeTruthy();
		expect(cv.pdf.note).toBe('PDF');
	});
});
