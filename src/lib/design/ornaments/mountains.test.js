import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parsePath } from './geometry.js';
import {
	MOUNTAINS_HEIGHT,
	MOUNTAINS_ID,
	MOUNTAINS_VIEWBOX,
	MOUNTAINS_WIDTH,
	PEAKS,
	marchingSquares,
	mountainScene,
	renderMountainsSvg,
	terrainHeight
} from './mountains.js';

/** @typedef {import('./geometry.js').Point} Point */

/**
 * @param {number} cols
 * @param {number} rows
 * @param {(x: number, y: number) => number} f
 */
function grid(cols, rows, f) {
	const values = new Float64Array(cols * rows);
	for (let y = 0; y < rows; y += 1) {
		for (let x = 0; x < cols; x += 1) values[y * cols + x] = f(x, y);
	}
	return values;
}

/** @param {Point[]} loop */
function area(loop) {
	let sum = 0;
	loop.forEach((a, index) => {
		const b = loop[(index + 1) % loop.length];
		sum += a.x * b.y - b.x * a.y;
	});
	return Math.abs(sum / 2);
}

describe('marchingSquares', () => {
	it('traces a disc as one closed loop at the right radius', () => {
		const values = grid(41, 41, (x, y) => 20 - Math.sqrt((x - 20) ** 2 + (y - 20) ** 2));
		const contours = marchingSquares(values, 41, 41, 10);
		expect(contours).toHaveLength(1);
		const [loop] = contours;
		expect(loop.closed).toBe(true);
		expect(loop.points.length).toBeGreaterThan(30);
		for (const p of loop.points) {
			expect(Math.abs(Math.sqrt((p.x - 20) ** 2 + (p.y - 20) ** 2) - 10)).toBeLessThan(0.05);
		}
		expect(area(loop.points)).toBeCloseTo(Math.PI * 100, -1);
	});

	it('returns nothing above the maximum or below the minimum', () => {
		const values = grid(10, 10, (x, y) => x + y);
		expect(marchingSquares(values, 10, 10, 100)).toEqual([]);
		expect(marchingSquares(values, 10, 10, -1)).toEqual([]);
	});

	it('splits two bumps into separate islands high up and merges them lower down', () => {
		/** @param {number} x @param {number} y */
		const bumps = (x, y) =>
			Math.max(0, 10 - Math.hypot(x - 12, y - 15)) + Math.max(0, 10 - Math.hypot(x - 28, y - 15));
		const values = grid(41, 31, bumps);
		const high = marchingSquares(values, 41, 31, 6);
		expect(high).toHaveLength(2);
		expect(high.every((contour) => contour.closed)).toBe(true);
		const low = marchingSquares(values, 41, 31, 1);
		expect(low).toHaveLength(1);
		expect(low[0].closed).toBe(true);
	});

	it('resolves saddle cells by the centre value', () => {
		// tl and br inside: a high centre joins them, a low centre separates them.
		const joined = marchingSquares([1, 0, 0, 1], 2, 2, 0.4);
		const split = marchingSquares([1, 0, 0, 1], 2, 2, 0.6);
		expect(joined).toHaveLength(2);
		expect(split).toHaveLength(2);
		/** @param {import('./mountains.js').Contour[]} contours @param {Point} corner */
		const cutsCorner = (contours, corner) =>
			contours.some((contour) =>
				contour.points.every((p) => Math.hypot(p.x - corner.x, p.y - corner.y) < 0.75)
			);
		// Centre 0.5 ≥ 0.4: the outside corners (tr, bl) are cut off.
		expect(cutsCorner(joined, { x: 1, y: 0 })).toBe(true);
		expect(cutsCorner(joined, { x: 0, y: 1 })).toBe(true);
		// Centre 0.5 < 0.6: the inside corners (tl, br) are cut off.
		expect(cutsCorner(split, { x: 0, y: 0 })).toBe(true);
		expect(cutsCorner(split, { x: 1, y: 1 })).toBe(true);
	});

	it('leaves contours open where they leave the grid', () => {
		const values = grid(5, 5, (x) => x);
		const contours = marchingSquares(values, 5, 5, 2.5);
		expect(contours).toHaveLength(1);
		expect(contours[0].closed).toBe(false);
		expect(contours[0].points).toHaveLength(5);
	});
});

describe('terrain', () => {
	const peak = (/** @type {string} */ name) => {
		const found = PEAKS.find((candidate) => candidate.name === name);
		if (!found) throw new Error(name);
		return found;
	};
	const heightOf = (/** @type {string} */ name) => terrainHeight(peak(name).u, peak(name).v);

	it('puts Masis to the right of Sis, as seen from Yerevan facing south, and makes it the highest summit', () => {
		expect(peak('Masis').u).toBeGreaterThan(peak('Sis').u);
		expect(heightOf('Masis')).toBeGreaterThan(heightOf('Sis') + 1);
		expect(heightOf('Masis')).toBeCloseTo((5137 - 850) / 1000, 0);
	});

	it('draws Sis as a straight-sided cone as steep as the upper flanks of Masis', () => {
		const sis = peak('Sis');
		expect(sis.shape).toBe('linear');
		// Heights down the far-left flank (away from the saddle) fall in a straight line.
		const at = (/** @type {number} */ share) => terrainHeight(sis.u - share * sis.radius, sis.v);
		const drops = [0.3, 0.45, 0.6, 0.75].map((share) => at(share) - at(share + 0.15));
		for (const drop of drops) expect(Math.abs(drop - drops[0])).toBeLessThan(0.1);
		const sisSlope = (at(0.3) - at(0.75)) / (0.45 * sis.radius);
		const masis = peak('Masis');
		const flank = (/** @type {number} */ r) => terrainHeight(masis.u - r, masis.v);
		const masisSlope = (flank(80) - flank(200)) / 120;
		expect(sisSlope / masisSlope).toBeGreaterThan(0.7);
		expect(sisSlope / masisSlope).toBeLessThan(1.4);
	});

	it('builds Aragats to the right of Ararat (north-west, turning right from the south) as four summits around a crater', () => {
		const summits = PEAKS.filter((candidate) =>
			/^Aragats (North|South|East|West)$/.test(candidate.name)
		);
		expect(summits).toHaveLength(4);
		// Facing south, west is on the right.
		expect(peak('Aragats West').u).toBeGreaterThan(peak('Aragats East').u);
		for (const summit of summits) {
			expect(summit.u).toBeGreaterThan(peak('Masis').u + peak('Masis').radius);
			expect(heightOf(summit.name)).toBeGreaterThan(terrainHeight(peak('Aragats crater').u, 0));
		}
		expect(heightOf('Aragats North')).toBeGreaterThan(heightOf('Aragats South'));
	});

	it('is deterministic and flat at the border, so every contour closes', () => {
		expect(terrainHeight(1234.5, -77)).toBe(terrainHeight(1234.5, -77));
		for (let u = 0; u <= MOUNTAINS_WIDTH; u += 100) {
			expect(terrainHeight(u, -560)).toBe(0);
			expect(terrainHeight(u, 560)).toBe(0);
		}
		expect(terrainHeight(0, 0)).toBe(0);
		expect(terrainHeight(MOUNTAINS_WIDTH, 0)).toBe(0);
	});
});

describe('mountainScene', () => {
	const scene = mountainScene();
	const points = [
		scene.skyline,
		scene.horizon,
		...scene.perimeters,
		...scene.infill,
		...scene.travel
	]
		.flatMap((d) => parsePath(d))
		.flatMap((subpath) => subpath.points);

	it('is cached', () => {
		expect(mountainScene()).toBe(scene);
	});

	it('stays inside the strip', () => {
		expect(scene.viewBox).toBe(`0 0 ${MOUNTAINS_WIDTH} ${MOUNTAINS_HEIGHT}`);
		for (const p of points) {
			expect(p.x).toBeGreaterThanOrEqual(0);
			expect(p.x).toBeLessThanOrEqual(MOUNTAINS_WIDTH);
			expect(p.y).toBeGreaterThanOrEqual(0);
			expect(p.y).toBeLessThanOrEqual(MOUNTAINS_HEIGHT);
		}
	});

	it('prints nested perimeters, snow infill, travel and one seam per stroke', () => {
		expect(scene.levels.length).toBeGreaterThanOrEqual(10);
		expect(scene.perimeters.length).toBeGreaterThan(scene.levels.length);
		expect(scene.seams).toHaveLength(scene.perimeters.length);
		// Snow on Masis and on the Aragats summit plateau.
		expect(scene.infill.length).toBeGreaterThanOrEqual(2);
		expect(scene.travel.length).toBeGreaterThan(5);
		scene.perimeters.forEach((d, index) => {
			const [first] = parsePath(d);
			expect(first.points[0]).toEqual(scene.seams[index]);
		});
	});

	it('ends the print on the summit of Masis', () => {
		const skyline = parsePath(scene.skyline).flatMap((subpath) => subpath.points);
		const summit = skyline.reduce((a, b) => (b.y < a.y ? b : a));
		expect(Math.abs(summit.x - (PEAKS.find((p) => p.name === 'Masis')?.u ?? 0))).toBeLessThan(80);
		// The last layer is the top contour of Masis, just below the summit.
		expect(Math.abs(scene.nozzle.x - summit.x)).toBeLessThan(150);
		expect(Math.abs(scene.nozzle.y - summit.y)).toBeLessThan(40);
	});
});

describe('mountains.svg', () => {
	const file = fileURLToPath(new URL('./mountains.svg', import.meta.url));
	const svg = renderMountainsSvg();

	it('is light enough to ship as a page background', () => {
		expect(svg.length).toBeLessThan(40_000);
		expect(svg).toContain(`viewBox="${MOUNTAINS_VIEWBOX}"`);
		expect(svg).toContain(`<g id="${MOUNTAINS_ID}"`);
	});

	it('is committed up to date (UPDATE_MOUNTAINS=1 regenerates it)', () => {
		if (process.env.UPDATE_MOUNTAINS) writeFileSync(file, svg);
		expect(readFileSync(file, 'utf8')).toBe(svg);
	});

	it('matches the viewBox MountainsBackdrop hard-codes', () => {
		const component = readFileSync(
			fileURLToPath(new URL('../../components/ui/MountainsBackdrop.svelte', import.meta.url)),
			'utf8'
		);
		expect(component).toContain(`viewBox="${MOUNTAINS_VIEWBOX}"`);
		expect(component).toContain(`#${MOUNTAINS_ID}`);
	});
});
