import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MONTH_INKS, contrast, luminance, mix, monthInk, parseHex } from './palette.js';

const tokens = readFileSync(fileURLToPath(new URL('../tokens.css', import.meta.url)), 'utf8');

/** First declaration of a custom property in tokens.css. @param {string} name */
function token(name) {
	const match = tokens.match(new RegExp(`${name}:\\s*([^;]+);`));
	if (!match) throw new Error(`missing ${name}`);
	return match[1].trim();
}

const black = [0, 0, 0];
const background = parseHex(token('--color-bg'));
const textMuted = parseHex(token('--color-text-muted'));
const shade = Number.parseFloat(token('--ornament-shade')) / 100;
const opacity = Number(token('--ornament-opacity'));

/**
 * The darkest-to-brightest pixel a text glyph can sit on: a full-strength
 * ornament stroke, as ToolpathOrnament composites it over the page.
 * @param {number[]} ink
 * @param {number} alpha
 */
const strokeOver = (ink, alpha) => mix(mix(ink, black, shade), background, alpha);

const SECTIONS = {
	projects: token('--accent-projects'),
	diy: token('--accent-diy'),
	sport: token('--accent-sport'),
	insights: token('--graph-field')
};

/** @param {string} hex */
function hue(hex) {
	const [r, g, b] = parseHex(hex).map((c) => c / 255);
	const max = Math.max(r, g, b);
	const d = max - Math.min(r, g, b);
	const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
	return (h * 60 + 360) % 360;
}

describe('seasonal ornament palette', () => {
	it('has twelve distinct month inks', () => {
		expect(MONTH_INKS).toHaveLength(12);
		expect(new Set(MONTH_INKS).size).toBe(12);
	});

	it('follows the seasons: cool winter, green spring, warm summer and autumn', () => {
		const months = MONTH_INKS.map(hue);
		for (const m of [11, 0, 1]) expect(months[m]).toBeGreaterThan(170);
		for (const m of [11, 0, 1]) expect(months[m]).toBeLessThan(230);
		for (const m of [2, 3, 4]) expect(months[m]).toBeGreaterThan(65);
		for (const m of [2, 3, 4]) expect(months[m]).toBeLessThan(170);
		for (const m of [5, 6, 7, 8, 9, 10]) expect(months[m]).toBeLessThan(50);
	});

	it('picks the ink for the local month', () => {
		expect(monthInk(new Date(2026, 0, 15))).toBe(MONTH_INKS[0]);
		expect(monthInk(new Date(2026, 6, 31, 23, 59))).toBe(MONTH_INKS[6]);
		expect(monthInk(new Date(2026, 11, 1))).toBe(MONTH_INKS[11]);
	});

	it('stays close to the section accents in lightness, so the shading holds', () => {
		const accents = Object.values(SECTIONS).map((hex) => luminance(parseHex(hex)));
		for (const ink of MONTH_INKS) {
			expect(luminance(parseHex(ink))).toBeGreaterThan(Math.min(...accents) * 0.8);
			expect(luminance(parseHex(ink))).toBeLessThan(Math.max(...accents) * 1.1);
		}
	});

	it.each([...MONTH_INKS.map((ink, m) => [`month ${m + 1}`, ink]), ...Object.entries(SECTIONS)])(
		'keeps muted text at AA over a full %s stroke',
		(_, ink) => {
			const stroke = strokeOver(parseHex(ink), opacity);
			expect(contrast(textMuted, stroke)).toBeGreaterThanOrEqual(4.5);
		}
	);

	it.each(MONTH_INKS)('keeps the default coral eyebrow at AA over %s', (ink) => {
		const stroke = strokeOver(parseHex(ink), opacity);
		expect(contrast(parseHex(token('--accent-coral')), stroke)).toBeGreaterThanOrEqual(4.5);
	});

	it.each(['projects', 'diy', 'sport'])('keeps the %s eyebrow at AA over its own ink', (name) => {
		const accent = parseHex(SECTIONS[/** @type {keyof typeof SECTIONS} */ (name)]);
		expect(contrast(accent, strokeOver(accent, opacity))).toBeGreaterThanOrEqual(4.5);
	});
});
