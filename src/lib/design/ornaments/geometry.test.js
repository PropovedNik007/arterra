import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	eternityArm,
	eternitySign,
	insetPolygon,
	insideRegion,
	khachkarBand,
	ornament,
	plaitBand,
	parsePath,
	serpentineFill,
	starPolygon,
	starRosette,
	toPath
} from './geometry.js';
import { ORNAMENT_PRESETS, SPRITE_FILE } from './presets.js';
import { heroToolpath, renderSprite } from './sprite.js';

/** @typedef {import('./geometry.js').Toolpath} Toolpath */
/** @typedef {import('./geometry.js').Point} Point */

/** @param {string[]} paths */
const pointsOf = (paths) => paths.flatMap((d) => parsePath(d).flatMap((sub) => sub.points));

/** @param {Toolpath} toolpath */
const allPoints = (toolpath) =>
	pointsOf([...toolpath.perimeters, ...toolpath.infill, ...toolpath.travel]);

/** @param {Toolpath} toolpath */
const bytes = (toolpath) =>
	[...toolpath.perimeters, ...toolpath.infill, ...toolpath.travel].join('').length;

/**
 * Points every `step` units along each segment of a polyline.
 * @param {Point[]} points
 * @param {number} step
 */
function samplesAlong(points, step) {
	/** @type {Point[]} */
	const out = [];
	for (let index = 1; index < points.length; index += 1) {
		const a = points[index - 1];
		const b = points[index];
		const count = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
		for (let k = 0; k <= count; k += 1) {
			out.push({ x: a.x + ((b.x - a.x) * k) / count, y: a.y + ((b.y - a.y) * k) / count });
		}
	}
	return out;
}

/**
 * @param {Point} p
 * @param {number} angle
 */
const rotate = (p, angle) => ({
	x: 500 + (p.x - 500) * Math.cos(angle) - (p.y - 500) * Math.sin(angle),
	y: 500 + (p.x - 500) * Math.sin(angle) + (p.y - 500) * Math.cos(angle)
});

/**
 * Every point of `set` has a partner in `set` after rotation by `angle`.
 * @param {Point[]} set
 * @param {number} angle
 * @param {number} tolerance
 */
function invariantUnderRotation(set, angle, tolerance) {
	return set.every((p) => {
		const q = rotate(p, angle);
		return set.some((r) => Math.hypot(r.x - q.x, r.y - q.y) < tolerance);
	});
}

/** Lengths of every travel move. @param {Toolpath} toolpath */
const travelLengths = (toolpath) =>
	toolpath.travel.map((d) => {
		const [a, b] = parsePath(d)[0].points;
		return Math.hypot(b.x - a.x, b.y - a.y);
	});

/** Smallest distance from any point of `a` to any segment of closed loop `b`. */
function loopGap(/** @type {Point[]} */ a, /** @type {Point[]} */ b) {
	let best = Infinity;
	for (const p of a) {
		for (let index = 0; index < b.length; index += 1) {
			const s = b[index];
			const e = b[(index + 1) % b.length];
			const dx = e.x - s.x;
			const dy = e.y - s.y;
			const u = Math.max(
				0,
				Math.min(1, ((p.x - s.x) * dx + (p.y - s.y) * dy) / (dx * dx + dy * dy || 1))
			);
			best = Math.min(best, Math.hypot(p.x - s.x - u * dx, p.y - s.y - u * dy));
		}
	}
	return best;
}

/** Whether a closed polygon crosses itself (segments that share no vertex). */
function selfIntersects(/** @type {Point[]} */ loop) {
	const n = loop.length;
	const cross = (/** @type {Point} */ o, /** @type {Point} */ a, /** @type {Point} */ b) =>
		(a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
	for (let i = 0; i < n; i += 1) {
		const a = loop[i];
		const b = loop[(i + 1) % n];
		for (let j = i + 2; j < n; j += 1) {
			if ((j + 1) % n === i) continue;
			const c = loop[j];
			const d = loop[(j + 1) % n];
			if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return true;
		}
	}
	return false;
}

const motifs = {
	eternity: () => eternitySign(),
	interlace: () => khachkarBand(),
	plait: () => plaitBand(),
	star: () => starRosette()
};

describe('toPath / parsePath', () => {
	it('round-trips points at 0.1 precision with compact relative syntax', () => {
		const points = [
			{ x: 10, y: 10 },
			{ x: 10.55, y: 9.5 },
			{ x: 0.04, y: 120.26 },
			{ x: 500, y: 0 }
		];
		const d = toPath(points, true);
		expect(d.startsWith('M10 10l')).toBe(true);
		expect(d.endsWith('z')).toBe(true);
		const [sub] = parsePath(d);
		expect(sub.closed).toBe(true);
		sub.points.forEach((p, index) => {
			expect(p.x).toBeCloseTo(points[index].x, 0);
			expect(p.y).toBeCloseTo(points[index].y, 0);
		});
	});

	it('drops repeated points and refuses degenerate paths', () => {
		expect(
			toPath([
				{ x: 1, y: 1 },
				{ x: 1.01, y: 1 }
			])
		).toBe('');
	});
});

describe.each(Object.entries(motifs))('%s toolpath', (name, build) => {
	const toolpath = build();

	it('is deterministic', () => {
		expect(build()).toEqual(toolpath);
	});

	it('contains only finite coordinates inside the viewBox', () => {
		const points = allPoints(toolpath);
		expect(points.length).toBeGreaterThan(50);
		for (const p of points) {
			expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
			expect(p.x).toBeGreaterThanOrEqual(-0.1);
			expect(p.y).toBeGreaterThanOrEqual(-0.1);
			expect(p.x).toBeLessThanOrEqual(toolpath.width + 0.1);
			expect(p.y).toBeLessThanOrEqual(toolpath.height + 0.1);
		}
	});

	it('keeps the path data within the size budget', () => {
		expect(bytes(toolpath), name).toBeLessThan(25_000);
	});

	it('describes every island with an outline, a length and a seam', () => {
		expect(toolpath.outlines).toHaveLength(toolpath.perimeters.length);
		expect(toolpath.lengths).toHaveLength(toolpath.perimeters.length);
		expect(toolpath.seams).toHaveLength(toolpath.perimeters.length);
		expect(toolpath.travel).toHaveLength(toolpath.perimeters.length - 1);
		for (const outline of toolpath.outlines) expect(parsePath(outline)).toHaveLength(1);
		expect(toolpath.lengths.every((length) => length > 0)).toBe(true);
	});

	// The plain plait is kept as a bare option; every motif the site shows has infill.
	it.runIf(name !== 'plait')('has infill to print', () => {
		expect(toolpath.infill.join('').length, name).toBeGreaterThan(0);
	});
});

describe('eternitySign', () => {
	it.each([8, 6])('has %i arms in rotational symmetry', (arms) => {
		const toolpath = eternitySign({ arms });
		// Skirt and hub come first, then one island per arm.
		expect(toolpath.perimeters).toHaveLength(arms + 2);
		const outer = toolpath.perimeters.slice(2).flatMap((d) => parsePath(d)[0].points);
		expect(invariantUnderRotation(outer, (2 * Math.PI) / arms, 2)).toBe(true);
		expect(invariantUnderRotation(outer, Math.PI / 7, 2)).toBe(false);
	});

	it('nests the requested number of perimeters in each arm', () => {
		const toolpath = eternitySign({ offsets: 3 });
		for (const arm of toolpath.perimeters.slice(2)) {
			const loops = parsePath(arm);
			expect(loops).toHaveLength(3);
			expect(loops.every((loop) => loop.closed)).toBe(true);
		}
	});

	it('fills each arm with concentric loops inside that arm', () => {
		const toolpath = eternitySign();
		const arms = toolpath.perimeters.slice(2).map((d) => parsePath(d)[0].points);
		const fills = toolpath.infill.slice(1); // the first fill is the hub spiral
		expect(fills).toHaveLength(arms.length);
		fills.forEach((fill, index) => {
			const loops = parsePath(fill);
			expect(loops.length).toBeGreaterThan(0);
			expect(loops.every((loop) => loop.closed)).toBe(true);
			for (const loop of loops) {
				for (const p of samplesAlong(loop.points, 4)) {
					expect(insideRegion([arms[index]], p)).toBe(true);
				}
			}
		});
	});

	it.each([8, 6])('keeps a channel between neighbouring arms (%i arms)', (arms) => {
		const toolpath = eternitySign({ arms });
		const [a, b] = toolpath.perimeters.slice(2, 4).map((d) => parsePath(d)[0].points);
		const overlap = b.some((p) => insideRegion([a], p)) || a.some((p) => insideRegion([b], p));
		expect(overlap).toBe(false);
		// Outer perimeters sit half a loop spacing inside the arm: channel 22.5 + 7.
		expect(loopGap(a, b)).toBeGreaterThan(15);
	});

	it('packs the arms out to the rim with round tips', () => {
		const toolpath = eternitySign();
		const reach = toolpath.perimeters
			.slice(2)
			.flatMap((d) => parsePath(d)[0].points)
			.map((p) => Math.hypot(p.x - 500, p.y - 500));
		expect(Math.max(...reach)).toBeGreaterThan(395);
		expect(Math.max(...reach)).toBeLessThan(411);
	});

	it.each([8, 6])(
		'travels arm to arm in short hops near the hub, not radial spokes (%i arms)',
		(arms) => {
			// Skirt → hub and hub → first arm, then arm to arm.
			const toolpath = eternitySign({ arms });
			const radial = (/** @type {Point} */ p) => Math.hypot(p.x - 500, p.y - 500);
			for (const d of toolpath.travel.slice(2)) {
				const [a, b] = parsePath(d)[0].points;
				const reach = Math.max(radial(a), radial(b));
				// Both ends in the inner half of the sign (the rim is at 410) …
				expect(reach).toBeLessThan(230);
				// … and no longer than the chord between neighbouring arms there.
				expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThan(
					2 * reach * Math.sin(Math.PI / arms) + 10
				);
			}
		}
	);

	it('ends every arm in a hook that curls back towards the hub', () => {
		const arm = eternityArm({
			radius: 410,
			hub: 0.15,
			lean: 0.35,
			bend: 1.3,
			curl: 4.6,
			weight: 0.085,
			tip: 0.3
		});
		const radial = (/** @type {number} */ u) => Math.hypot(arm.frame(u).p.x, arm.frame(u).p.y);
		// The last 40% of the arm turns by well over a half turn …
		expect(arm.heading(1) - arm.heading(0.6)).toBeGreaterThan(Math.PI * 1.25);
		// … so the tip lies clearly inside the arm's outermost point.
		const outermost = Math.max(...Array.from({ length: 101 }, (_, i) => radial(i / 100)));
		expect(outermost - radial(1)).toBeGreaterThan(40);
		// The hook keeps its eye open: the half-width stays under the radius of curvature.
		for (let i = 0; i < 100; i += 1) {
			const u = i / 100;
			const du = 0.005;
			const turn = arm.heading(u + du) - arm.heading(u);
			const radiusOfCurvature = (arm.length * du) / turn;
			expect(arm.half(u)).toBeLessThan(radiusOfCurvature);
		}
	});

	it.each([8, 6])('draws each arm as one simple, non-self-intersecting loop (%i arms)', (arms) => {
		const toolpath = eternitySign({ arms });
		for (const d of toolpath.perimeters.slice(2)) {
			const loop = parsePath(d)[0].points;
			expect(selfIntersects(loop)).toBe(false);
		}
	});
});

describe('starRosette', () => {
	const toolpath = starRosette();
	const petals = toolpath.perimeters.slice(0, 8).map((d) => parsePath(d)[0].points);

	it('builds an eight-pointed star from eight petal islands with 8-fold symmetry', () => {
		// Petals, the core ring, then one island per core arm.
		expect(toolpath.perimeters).toHaveLength(8 + 1 + 8);
		for (const d of toolpath.perimeters.slice(0, 8)) expect(parsePath(d)).toHaveLength(2);
		const points = petals.flat();
		expect(invariantUnderRotation(points, Math.PI / 4, 1.5)).toBe(true);
		expect(invariantUnderRotation(points, Math.PI / 8, 1.5)).toBe(false);
	});

	it('has sharp points, clearly narrower than the 90° octagram', () => {
		const top = petals[0];
		const tip = top.reduce((best, p) => (p.y < best.y ? p : best));
		const others = top.filter((p) => p !== tip);
		const angles = others.map((p) => Math.atan2(p.y - tip.y, p.x - tip.x));
		const spread = ((Math.max(...angles) - Math.min(...angles)) * 180) / Math.PI;
		expect(spread).toBeGreaterThan(55);
		expect(spread).toBeLessThan(80);
	});

	it('rasters each petal inside itself, alternating ±45° to the petal axis', () => {
		const relative = toolpath.infill.slice(0, 8).map((d, index) => {
			const chains = parsePath(d);
			for (const chain of chains) {
				for (const p of samplesAlong(chain.points, 3)) {
					expect(insideRegion([petals[index]], p)).toBe(true);
				}
			}
			const [a, b] = chains[0].points;
			const raster = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
			const axis = -90 + 45 * index;
			return (((raster - axis) % 180) + 180) % 180;
		});
		relative.forEach((angle, index) => {
			expect(
				Math.min(
					Math.abs(angle - (index % 2 ? 135 : 45)),
					180 - Math.abs(angle - (index % 2 ? 135 : 45))
				)
			).toBeLessThan(1);
		});
	});
});

describe('khachkarBand', () => {
	it('weaves one closed knot with an eyelet in every eye, between two fillets', () => {
		const toolpath = khachkarBand();
		const eyelets = toolpath.perimeters.length - 3;
		expect(eyelets).toBeGreaterThan(4);
		// Every crossing breaks both edges of the under ribbon once; the loop
		// is closed, so n crossings leave exactly 2n edge runs.
		const crossings = eyelets - 1;
		expect(parsePath(toolpath.perimeters[1])).toHaveLength(2 * crossings);
	});

	it('cuts the centre groove as infill, broken at the same crossings', () => {
		const toolpath = khachkarBand({ grooves: 3 });
		const crossings = toolpath.perimeters.length - 4;
		expect(parsePath(toolpath.infill[0])).toHaveLength(crossings);
		expect(khachkarBand({ grooves: 2, eyelets: 1 }).infill).toHaveLength(0);
	});

	it.each([
		[{}, 160],
		[{ length: 4960, height: 160 }, 160],
		[{ length: 2600, height: 50, grooves: 2, eyelets: 1 }, 50]
	])('travels only in short hops (%o)', (options, height) => {
		for (const hop of travelLengths(khachkarBand(options))) expect(hop).toBeLessThan(height * 1.5);
	});
});

describe('plaitBand', () => {
	it('weaves one strand island per lane between two frame lines', () => {
		const toolpath = plaitBand({ strands: 3 });
		expect(toolpath.perimeters).toHaveLength(3 + 2);
	});

	it('sends every strand under about half of its crossings', () => {
		const toolpath = plaitBand({ crossings: 30, offsets: 2 });
		const strands = toolpath.perimeters.slice(1, -1);
		const unders = strands.map((d) => (parsePath(d).length - 2) / 2);
		// 30 crossings over 3 strands → each strand meets 20 crossings, half of them under.
		for (const count of unders) expect(Math.abs(count - 10)).toBeLessThanOrEqual(1);
	});

	it.each([
		[{}, 200],
		[{ length: 2400, height: 160, crossings: 30 }, 160],
		[{ length: 2400, height: 50, crossings: 40 }, 50]
	])('travels only in short hops (%o)', (options, height) => {
		for (const hop of travelLengths(plaitBand(options))) expect(hop).toBeLessThan(height * 1.5);
	});

	it('keeps two-strand ribbons free of cusps', () => {
		const toolpath = plaitBand({ strands: 2 });
		for (const run of toolpath.perimeters.slice(1, -1).flatMap((d) => parsePath(d))) {
			const p = run.points;
			for (let i = 1; i < p.length; i += 1) {
				// A cusp folds the edge back on itself: x must keep moving one way.
				expect(Math.sign(p[i].x - p[i - 1].x) || 1).toBe(
					Math.sign((p.at(-1) ?? p[0]).x - p[0].x) || 1
				);
			}
		}
	});
});

describe('ornament sprite', () => {
	/**
	 * Group id → its layer paths as point lists. Compared within 0.2 units
	 * rather than byte for byte, so a last-digit rounding difference between
	 * Node versions cannot fail CI while a stale sprite still does.
	 * @param {string} svg
	 */
	const spriteShape = (svg) =>
		Object.fromEntries(
			[...svg.matchAll(/<g id="([^"]+)"[^>]*>(.*?)<\/g>/g)].map(([, id, body]) => [
				id,
				// Seam dots (`h0`) are compared as text; parsePath reads M/l/z only.
				[...body.matchAll(/ d="([^"]+)"/g)].map(([, d]) => (d.includes('h') ? d : parsePath(d)))
			])
		);
	/** @type {(a: unknown, b: unknown) => boolean} */
	const close = (a, b) => {
		if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 0.2;
		if (Array.isArray(a) && Array.isArray(b))
			return a.length === b.length && a.every((v, i) => close(v, b[i]));
		if (a && b && typeof a === 'object' && typeof b === 'object') {
			const keys = Object.keys(a);
			return (
				keys.length === Object.keys(b).length &&
				keys.every((key) => close(/** @type {any} */ (a)[key], /** @type {any} */ (b)[key]))
			);
		}
		return a === b;
	};

	it('matches the generated sprite and hero data (run scripts/build-ornaments.mjs)', () => {
		const root = fileURLToPath(new URL('../../../../', import.meta.url));
		const committed = spriteShape(readFileSync(`${root}static/${SPRITE_FILE}`, 'utf8'));
		const fresh = spriteShape(renderSprite());
		expect(Object.keys(committed)).toEqual(
			Object.keys(ORNAMENT_PRESETS).filter((name) => name !== 'hero')
		);
		expect(close(committed, fresh)).toBe(true);
		const hero = JSON.parse(readFileSync(`${root}src/lib/design/ornaments/hero.json`, 'utf8'));
		const expected = JSON.parse(JSON.stringify(heroToolpath()));
		expect(hero.viewBox).toBe(expected.viewBox);
		for (const key of ['perimeters', 'outlines', 'infill', 'travel']) {
			expect(close(hero[key].map(parsePath), expected[key].map(parsePath)), key).toBe(true);
		}
		expect(close(hero.seams, expected.seams)).toBe(true);
	});

	it('declares every preset viewBox correctly', () => {
		for (const preset of Object.values(ORNAMENT_PRESETS)) {
			expect(ornament(preset.motif, preset.options).viewBox).toBe(preset.viewBox);
		}
	});
});

describe('geometry helpers', () => {
	it('insets a star polygon to a shape inside the original', () => {
		const star = starPolygon(500, 500, 400, 8, 0.6);
		const inset = insetPolygon(star, 12);
		for (const p of inset) expect(insideRegion([star], p)).toBe(true);
	});

	it('fills a square with one serpentine chain', () => {
		const square = [
			{ x: 0, y: 0 },
			{ x: 100, y: 0 },
			{ x: 100, y: 100 },
			{ x: 0, y: 100 }
		];
		const chains = serpentineFill([square], 10, 0, { x: 50, y: 50 });
		expect(chains).toHaveLength(1);
		expect(chains[0]).toHaveLength(20);
	});

	it('memoises motif geometry', () => {
		expect(ornament('star')).toBe(ornament('star'));
		expect(ornament('interlace', { slope: 1 })).not.toBe(ornament('interlace'));
	});
});
