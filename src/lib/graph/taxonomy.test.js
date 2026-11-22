import { describe, expect, it } from 'vitest';
import { cv } from '../content/cv.js';
import { FIELDS, FIELD_TAGS, ORGS, TAG_FIELDS, displayFields, leadDomain } from './taxonomy.js';

const slugOf = (/** @type {string} */ text) =>
	text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

describe('taxonomy', () => {
	it('lists every tag that names a field in FIELD_TAGS', () => {
		const fieldNames = new Set(FIELDS.flatMap((field) => [field.id, slugOf(field.label)]));
		const missing = Object.keys(TAG_FIELDS).filter(
			(tag) => fieldNames.has(tag) && !FIELD_TAGS.has(tag)
		);
		expect(missing).toEqual([]);
	});

	it('orders curated fields first and picks the majority domain', () => {
		const ids = ['ml', 'cv', '3d-geometry', 'backend', 'frontend', '3d-printing', 'toolpaths'];
		const ordered = displayFields('flexam', ids);
		expect(ordered.slice(0, 3)).toEqual(['3d-printing', '3d-geometry', 'toolpaths']);
		expect(new Set(ordered)).toEqual(new Set(ids));
		expect(leadDomain(['ml', 'cv', 'backend'])).toBe('data-science');
		// A tie goes to the domain of the first field.
		expect(leadDomain(['backend', 'ml'])).toBe('software');
	});

	it('reads organisation periods from the CV', () => {
		const meta = Object.fromEntries(ORGS.map((org) => [org.id, org.meta]));
		const bsc = cv.education.find((entry) => entry.id === 'bsc-bmstu');
		expect(meta.bmstu).toBe(`${bsc?.degree} · ${bsc?.period}`);
		const arterra = cv.experience.find((entry) => entry.id === 'arterra-miniature');
		expect(meta['arterra-miniature']).toBe(`${arterra?.role} · ${arterra?.period}`);
		expect(meta.timetoact).toBe('Oct 2024 · 2nd place');
		expect(meta['tourism-technology-hackathon']).toBe('Nov 2023 · 2nd place');
	});
});
