import { describe, expect, it } from 'vitest';
import { isSection, isDiscipline, SECTIONS, DISCIPLINES } from './types.js';

describe('isSection', () => {
	it('accepts every declared section', () => {
		for (const section of SECTIONS) {
			expect(isSection(section)).toBe(true);
		}
	});

	it('rejects an old-taxonomy value', () => {
		expect(isSection('hiking')).toBe(false);
	});

	it('rejects non-strings', () => {
		expect(isSection(undefined)).toBe(false);
		expect(isSection(42)).toBe(false);
	});
});

describe('isDiscipline', () => {
	it('accepts every declared discipline', () => {
		for (const discipline of DISCIPLINES) {
			expect(isDiscipline(discipline)).toBe(true);
		}
	});

	it('rejects an unknown discipline', () => {
		expect(isDiscipline('chess')).toBe(false);
	});
});
