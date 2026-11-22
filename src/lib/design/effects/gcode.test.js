import { describe, expect, it } from 'vitest';
import { E_PER_MM, MAX_BLOCKS, cleanLabel, formatNumber, generateGcode } from './gcode.js';

/** @param {number} x @param {number} y @param {number} width @param {number} height */
const rect = (x, y, width, height) => ({ x, y, width, height });

describe('formatNumber', () => {
	it('uses fixed decimals', () => {
		expect(formatNumber(1)).toBe('1.00');
		expect(formatNumber(12.3456)).toBe('12.35');
		expect(formatNumber(0.123456, 5)).toBe('0.12346');
	});

	it('never prints negative zero, NaN or Infinity', () => {
		expect(formatNumber(-0)).toBe('0.00');
		expect(formatNumber(-0.001)).toBe('0.00');
		expect(formatNumber(-0.4, 0)).toBe('0');
		expect(formatNumber(Number.NaN)).toBe('0.00');
		expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('0.00');
		expect(formatNumber(-2.5)).toBe('-2.50');
	});
});

describe('cleanLabel', () => {
	it('flattens whitespace and removes comment separators', () => {
		expect(cleanLabel('  Hello;\n world  ')).toBe('Hello world');
	});

	it('truncates long text with an ellipsis', () => {
		expect(cleanLabel('abcdefghij', 6)).toBe('abcde…');
		expect(cleanLabel(undefined)).toBe('');
	});
});

describe('generateGcode', () => {
	it('emits a header, one layer and a perimeter loop for a single block', () => {
		const { lines, layers, blocks } = generateGcode({
			title: 'Home\npage',
			blocks: [{ kind: 'heading', rect: rect(10, 20, 100, 50), layer: 7, label: 'Hello' }]
		});
		expect(layers).toBe(1);
		expect(blocks).toBe(1);
		expect(lines[0]).toBe('; portfolio slicer preview of "Home page"');
		expect(lines).toContain(';LAYER_COUNT:1');

		const body = lines.slice(lines.indexOf(';LAYER:0'));
		const e1 = formatNumber(100 * 0.2 * E_PER_MM, 5);
		const e2 = formatNumber(150 * 0.2 * E_PER_MM, 5);
		const e3 = formatNumber(250 * 0.2 * E_PER_MM, 5);
		const e4 = formatNumber(300 * 0.2 * E_PER_MM, 5);
		expect(body.slice(0, 9)).toEqual([
			';LAYER:0',
			'G0 Z0.20',
			';TYPE:WALL-OUTER',
			'; heading "Hello"',
			'G0 F6000 X2.00 Y4.00',
			`G1 F1800 X22.00 Y4.00 E${e1}`,
			`G1 X22.00 Y14.00 E${e2}`,
			`G1 X2.00 Y14.00 E${e3}`,
			`G1 X2.00 Y4.00 E${e4}`
		]);
		expect(lines).toContain(';Filament used: 0.060m');
	});

	it('re-indexes layers in order and only repeats TYPE when it changes', () => {
		const { lines, layers } = generateGcode({
			blocks: [
				{ kind: 'text', rect: rect(0, 0, 10, 10), layer: 4 },
				{ kind: 'text', rect: rect(0, 20, 10, 10), layer: 4 },
				{ kind: 'card', rect: rect(0, 40, 10, 10), layer: 9 }
			]
		});
		expect(layers).toBe(2);
		expect(lines.filter((line) => line.startsWith(';LAYER:'))).toEqual([';LAYER:0', ';LAYER:1']);
		expect(lines.filter((line) => line.startsWith(';TYPE:'))).toEqual([
			';TYPE:SKIN',
			';TYPE:WALL-INNER',
			';TYPE:END'
		]);
		expect(lines).toContain('G0 Z0.40');
	});

	it('keeps extrusion monotonic across travel moves and infill', () => {
		const { lines } = generateGcode({
			blocks: [
				{ kind: 'image', rect: rect(0, 0, 200, 200), layer: 0, label: 'Cover' },
				{ kind: 'button', rect: rect(300, 0, 80, 30), layer: 0 }
			]
		});
		const values = lines
			.filter((line) => line.startsWith('G1'))
			.map((line) => Number(/E(\S+)/.exec(line)?.[1]));
		expect(values.length).toBeGreaterThan(8);
		for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1]);
		expect(lines.some((line) => line.startsWith('G1') && line.includes('-'))).toBe(false);
		// 200px = 40mm tall image: floor(40 / 4) - 1 = 9 passes, capped at 8.
		const infillTravel = lines.filter((line) => /^G0 X/.test(line));
		expect(infillTravel).toHaveLength(8);
	});

	it('drops empty or non-finite rects', () => {
		const { blocks, lines } = generateGcode({
			blocks: [
				{ kind: 'text', rect: rect(0, 0, 0, 10), layer: 0 },
				{ kind: 'text', rect: rect(Number.NaN, 0, 10, 10), layer: 0 },
				{ kind: 'text', rect: rect(0, 0, 10, 10), layer: 1 }
			]
		});
		expect(blocks).toBe(1);
		expect(lines.join('\n')).not.toMatch(/NaN|Infinity|-0\.00/);
	});

	it('caps the number of blocks and says so', () => {
		const many = Array.from({ length: MAX_BLOCKS + 25 }, (_, i) => ({
			kind: /** @type {const} */ ('text'),
			rect: rect(0, i * 20, 50, 10),
			layer: Math.floor(i / 10)
		}));
		const { blocks, skipped, lines } = generateGcode({ blocks: many });
		expect(blocks).toBe(MAX_BLOCKS);
		expect(skipped).toBe(25);
		expect(lines.filter((line) => line.startsWith('G0 F6000'))).toHaveLength(MAX_BLOCKS);
		expect(lines.at(-1)).toBe(
			`; ${MAX_BLOCKS} blocks on 15 layers, preview capped at ${MAX_BLOCKS} blocks (page has more)`
		);
	});

	it('handles a page with no blocks', () => {
		const { lines, layers } = generateGcode({ title: '', blocks: [] });
		expect(layers).toBe(0);
		expect(lines[0]).toBe('; portfolio slicer preview of "untitled page"');
		expect(lines).toContain(';Filament used: 0.000m');
	});
});
