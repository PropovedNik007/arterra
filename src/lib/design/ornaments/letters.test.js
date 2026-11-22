import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parsePath } from './geometry.js';
import {
	BEAD,
	CAP,
	GLYPHS,
	HALF_WIDTH,
	contours,
	distanceField,
	initials,
	initialsMark,
	strokeDistance
} from './letters.js';

/** @typedef {import('./geometry.js').Point} Point */

/** @param {string} d */
const pointsOf = (d) => parsePath(d).flatMap((sub) => sub.points);

/** @param {Point[]} points */
const bounds = (points) => ({
	minX: Math.min(...points.map((p) => p.x)),
	maxX: Math.max(...points.map((p) => p.x)),
	minY: Math.min(...points.map((p) => p.y)),
	maxY: Math.max(...points.map((p) => p.y))
});

describe('contours', () => {
	it('traces a circle around a single point', () => {
		const grid = distanceField([[{ x: 0, y: 0 }]], 10, 1);
		const loops = contours(grid, 10);
		expect(loops).toHaveLength(1);
		for (const p of loops[0]) expect(Math.hypot(p.x, p.y)).toBeCloseTo(10, 0);
	});

	it('merges overlapping strokes into one loop per level', () => {
		const strokes = [
			[
				{ x: 0, y: 0 },
				{ x: 40, y: 0 }
			],
			[
				{ x: 20, y: -20 },
				{ x: 20, y: 20 }
			]
		];
		const grid = distanceField(strokes, 6);
		expect(contours(grid, 6)).toHaveLength(1);
		expect(contours(grid, 2)).toHaveLength(1);
	});

	it('returns loops on the iso-line, clockwise on screen', () => {
		const strokes = GLYPHS.se.strokes;
		const level = HALF_WIDTH - BEAD / 2;
		const [loop] = contours(distanceField(strokes, level), level);
		for (const p of loop) expect(strokeDistance(strokes, p)).toBeCloseTo(level, 0);
		let area = 0;
		loop.forEach((p, index) => {
			const q = loop[(index + 1) % loop.length];
			area += p.x * q.y - q.x * p.y;
		});
		expect(area).toBeGreaterThan(0);
	});
});

describe('glyphs', () => {
	it('fit the cap height with their stroke width', () => {
		for (const glyph of Object.values(GLYPHS)) {
			const box = bounds(glyph.strokes.flat());
			expect(box.minY - HALF_WIDTH).toBeGreaterThanOrEqual(0);
			expect(box.maxY + HALF_WIDTH).toBeLessThanOrEqual(CAP);
			expect(box.minX - HALF_WIDTH).toBeGreaterThanOrEqual(0);
			expect(box.maxX + HALF_WIDTH).toBeLessThanOrEqual(glyph.advance + 1e-9);
		}
	});

	it('give Ayb a tail to the baseline right of its stems, which Se lacks', () => {
		const aybStems = GLYPHS.ayb.strokes.map((stroke) => stroke[0].x);
		const tailFoot = GLYPHS.ayb.strokes[1].at(-1);
		expect(tailFoot?.y).toBeCloseTo(CAP - HALF_WIDTH, 9);
		expect(tailFoot?.x).toBeGreaterThan(Math.max(...aybStems) + 2 * HALF_WIDTH);
		// Se is one stroke that starts and ends at the cap line.
		const [se] = GLYPHS.se.strokes;
		expect(GLYPHS.se.strokes).toHaveLength(1);
		expect(se[0].y).toBeCloseTo(HALF_WIDTH, 9);
		expect(se.at(-1)?.y).toBeCloseTo(HALF_WIDTH, 9);
	});

	it('keep a visible notch under the tail arch', () => {
		const [, tail] = GLYPHS.ayb.strokes;
		const stem = tail[0].x;
		const foot = /** @type {Point} */ (tail.at(-1));
		// Just above the baseline, midway between stem and tail, the outer perimeter is open.
		const probe = { x: (stem + foot.x) / 2 + 3, y: CAP - 2 };
		expect(strokeDistance(GLYPHS.ayb.strokes, probe)).toBeGreaterThan(HALF_WIDTH - BEAD / 2);
	});
});

describe('initialsMark', () => {
	const mark = initialsMark();

	it('prints Ա and Ս without full stops, two perimeters each', () => {
		expect(Object.keys(GLYPHS)).toEqual(['ayb', 'se']);
		expect(mark.islands).toHaveLength(2);
		for (const island of mark.islands) {
			expect(island.loops).toHaveLength(2);
			for (const d of island.loops) {
				const subpaths = parsePath(d);
				expect(subpaths).toHaveLength(1);
				expect(subpaths[0].closed).toBe(true);
			}
			expect(island.lengths[0]).toBeGreaterThan(island.lengths[1]);
		}
		expect(mark.travel).toHaveLength(1);
	});

	it('nests the inner perimeter one bead inside the outer one', () => {
		for (const island of mark.islands) {
			const outer = bounds(pointsOf(island.loops[0]));
			const inner = bounds(pointsOf(island.loops[1]));
			expect(outer.minX).toBeCloseTo(inner.minX - BEAD, 0);
			expect(outer.maxY).toBeCloseTo(inner.maxY + BEAD, 0);
		}
	});

	it('stays inside its viewBox and starts each island at its seam', () => {
		const all = mark.islands.flatMap((island) => island.loops.flatMap(pointsOf));
		const box = bounds(all);
		expect(box.minX).toBeGreaterThanOrEqual(0);
		expect(box.minY).toBeGreaterThanOrEqual(0);
		expect(box.maxX).toBeLessThanOrEqual(mark.width);
		expect(box.maxY).toBeLessThanOrEqual(mark.height);
		mark.islands.forEach((island, index) => {
			const [first] = pointsOf(island.loops[0]);
			expect(first.x).toBeCloseTo(island.seam.x, 0);
			expect(first.y).toBeCloseTo(island.seam.y, 0);
			if (index > 0) {
				const travel = pointsOf(mark.travel[index - 1]);
				expect(travel.at(-1)?.x).toBeCloseTo(island.seam.x, 0);
				expect(travel.at(-1)?.y).toBeCloseTo(island.seam.y, 0);
			}
		});
	});

	it('starts where the pen would, at the top of the first stem', () => {
		expect(mark.islands[0].seam.y).toBeLessThan(HALF_WIDTH);
		expect(mark.islands[0].seam.x).toBeLessThan(2 * HALF_WIDTH);
	});

	it('sets the two letters as a monogram: close, but never touching', () => {
		const [ayb, se] = mark.islands.map((island) => bounds(pointsOf(island.loops[0])));
		const between = se.minX - ayb.maxX;
		// Closer than the old Ա.Ս. spacing (a stop's width plus two gaps)…
		expect(between).toBeLessThan(2 * HALF_WIDTH);
		// …while every point of Ս's outer perimeter clears Ա's by over a bead.
		const aybLoop = pointsOf(mark.islands[0].loops[0]);
		const seLoop = pointsOf(mark.islands[1].loops[0]);
		let nearest = Infinity;
		for (const p of seLoop)
			for (const q of aybLoop) nearest = Math.min(nearest, Math.hypot(p.x - q.x, p.y - q.y));
		expect(nearest).toBeGreaterThan(BEAD * 1.5);
	});

	it('keeps travel moves short, between the glyphs', () => {
		for (const d of mark.travel) {
			const [a, b] = pointsOf(d);
			expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThan(CAP * 0.45);
		}
	});

	it('is deterministic and cached', () => {
		expect(JSON.stringify(initialsMark())).toBe(JSON.stringify(mark));
		expect(initials()).toBe(initials());
	});

	it('matches the precomputed initials.json the header ships (run scripts/build-ornaments.mjs)', () => {
		const file = new URL('./initials.json', import.meta.url);
		expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(JSON.parse(JSON.stringify(initials())));
	});
});
