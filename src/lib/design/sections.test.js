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
