import { describe, expect, it } from 'vitest';
import { itemPath } from './sections.js';

describe('itemPath', () => {
	it('builds a top-level section path for a project', () => {
		expect(itemPath({ section: 'projects', slug: 'printerra' })).toBe('/projects/printerra');
	});

	it('builds a discipline sub-path for a sport item', () => {
		expect(itemPath({ section: 'sport', discipline: 'hiking', slug: '2026-06-14-rax' })).toBe(
			'/sport/hiking/2026-06-14-rax'
		);
	});
});

describe('tagLabel', () => {
	it('turns lower-case kebab tags into words and keeps proper names', async () => {
		const { tagLabel } = await import('./sections.js');
		expect(tagLabel('digital-twins')).toBe('digital twins');
		expect(tagLabel('LLaMA-3')).toBe('LLaMA-3');
		expect(tagLabel('Next.js')).toBe('Next.js');
		expect(tagLabel('rail')).toBe('rail');
	});
});

describe('formatNoteDate', () => {
	it('formats ISO dates without timezone drift', async () => {
		const { formatNoteDate } = await import('./sections.js');
		expect(formatNoteDate('2026-06-14')).toBe('14 Jun 2026');
		expect(formatNoteDate('')).toBe('');
	});
});
