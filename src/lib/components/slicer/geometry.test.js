import { describe, expect, it } from 'vitest';
import {
	PART,
	SETTINGS,
	buildPartMesh,
	contains,
	insetLoops,
	layerLevels,
	layerSurface,
	offsetLoop,
	orientLoops,
	planLayer,
	planarLayerFromSection,
	sectionAt,
	selfIntersects,
	serpentineInfill,
	signedArea,
	tidyLoop,
	sliceLayers,
	sliceMesh
} from './geometry.js';

/** Axis-aligned unit cube [0,1]³ as an outward-facing triangle mesh. */
function cube(size = 1) {
	const positions = [];
	for (let i = 0; i < 8; i += 1)
		positions.push((i & 1) * size, ((i >> 1) & 1) * size, (i >> 2) * size);
	// prettier-ignore
	const indices = [
		0, 2, 3, 0, 3, 1, // bottom (z = 0)
		4, 5, 7, 4, 7, 6, // top
		0, 1, 5, 0, 5, 4, // y = 0
		2, 6, 7, 2, 7, 3, // y = 1
		0, 4, 6, 0, 6, 2, // x = 0
		1, 3, 7, 1, 7, 5 // x = 1
	];
	return { positions, indices };
}

/** @param {number} size */
function square(size) {
	return [
		{ x: 0, y: 0 },
		{ x: size, y: 0 },
		{ x: size, y: size },
		{ x: 0, y: size }
	];
}

/** @param {{ positions: number[] }} mesh @param {number} h */
function planarValues(mesh, h) {
	const values = [];
	for (let i = 2; i < mesh.positions.length; i += 3) values.push(mesh.positions[i] - h);
	return values;
}

describe('sliceMesh', () => {
	it('cuts a cube into one closed square loop at the plane height', () => {
		const mesh = cube();
		const loops = sliceMesh(mesh, planarValues(mesh, 0.25));
		expect(loops).toHaveLength(1);
		const [loop] = loops;
		for (const p of loop) expect(p.z).toBeCloseTo(0.25);
		expect(Math.abs(signedArea(loop))).toBeCloseTo(1);
	});

	it('returns nothing above or below the mesh', () => {
		const mesh = cube();
		expect(sliceMesh(mesh, planarValues(mesh, 2))).toEqual([]);
		expect(sliceMesh(mesh, planarValues(mesh, -1))).toEqual([]);
	});

	it('matches the closed-form section of the part', () => {
		const mesh = buildPartMesh();
		for (const z of [7, 31, 52, 61]) {
			const [loop] = sliceMesh(mesh, planarValues(mesh, z));
			const exact = Math.abs(signedArea(sectionAt(z)));
			expect(Math.abs(signedArea(loop)) / exact).toBeCloseTo(1, 1);
		}
	});
});

describe('part mesh', () => {
	it('is closed: every edge is shared by exactly two triangles in opposite directions', () => {
		const { indices } = buildPartMesh();
		/** @type {Map<string, number>} */
		const edges = new Map();
		for (let t = 0; t < indices.length; t += 3) {
			for (let e = 0; e < 3; e += 1) {
				const key = `${indices[t + e]}>${indices[t + ((e + 1) % 3)]}`;
				edges.set(key, (edges.get(key) ?? 0) + 1);
			}
		}
		for (const [key, count] of edges) {
			const [a, b] = key.split('>');
			expect(count).toBe(1);
			expect(edges.get(`${b}>${a}`)).toBe(1);
		}
	});
});

describe('polygon helpers', () => {
	it('orients outer loops counter-clockwise and holes clockwise', () => {
		const outer = [...square(10)].reverse();
		const hole = square(4).map((p) => ({ x: p.x + 3, y: p.y + 3 }));
		const [o, h] = orientLoops([outer, hole]);
		expect(signedArea(o)).toBeGreaterThan(0);
		expect(signedArea(h)).toBeLessThan(0);
	});

	it('offsets a square inward by the exact distance', () => {
		const inset = offsetLoop(square(10), 1);
		expect(inset[0].x).toBeCloseTo(1);
		expect(inset[0].y).toBeCloseTo(1);
		expect(signedArea(inset)).toBeCloseTo(64);
	});

	it('refuses an inset larger than the region', () => {
		expect(insetLoops([square(4)], 1)).not.toBeNull();
		expect(insetLoops([square(4)], 2.5)).toBeNull();
	});

	it('detects a bow-tie as self-intersecting', () => {
		const bowTie = [
			{ x: 0, y: 0 },
			{ x: 2, y: 2 },
			{ x: 2, y: 0 },
			{ x: 0, y: 2 }
		];
		expect(selfIntersects(bowTie)).toBe(true);
		expect(selfIntersects(square(2))).toBe(false);
	});

	it('resamples loops evenly without shrinking them', () => {
		const dense = sectionAt(10, 600);
		const even = tidyLoop(dense, 1);
		expect(even.length).toBeLessThan(dense.length);
		expect(signedArea(even) / signedArea(dense)).toBeCloseTo(1, 2);
		const gaps = even.map((p, i) => {
			const q = even[(i + 1) % even.length];
			return Math.hypot(q.x - p.x, q.y - p.y);
		});
		expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(0.2);
	});
});

describe('serpentineInfill', () => {
	it('fills a square with one continuous zig-zag', () => {
		const chains = serpentineInfill([square(10)], 1, 0);
		expect(chains).toHaveLength(1);
		const [chain] = chains;
		expect(chain).toHaveLength(20);
		for (const p of chain) expect([0, 10]).toContain(Math.round(p.x));
		// Passes alternate direction.
		expect(chain[1].x).toBeGreaterThan(chain[0].x);
		expect(chain[3].x).toBeLessThan(chain[2].x);
	});

	it('splits around a hole', () => {
		const outer = square(10);
		const hole = [...square(4).map((p) => ({ x: p.x + 3, y: p.y + 3 }))].reverse();
		const chains = serpentineInfill([outer, hole], 1, 0);
		expect(chains.length).toBeGreaterThan(1);
		for (const chain of chains) {
			for (let i = 0; i + 1 < chain.length; i += 2) {
				const mid = { x: (chain[i].x + chain[i + 1].x) / 2, y: chain[i].y };
				expect(contains(hole, mid)).toBe(false);
			}
		}
	});
});

describe('planLayer', () => {
	it('plans perimeters, infill and travel for a square', () => {
		const plan = planLayer([square(20)], {
			lineWidth: 1,
			perimeters: 3,
			infillSpacing: 2,
			infillAngle: Math.PI / 4,
			seamAngle: 0
		});
		expect(plan.outer).toHaveLength(1);
		expect(plan.inner).toHaveLength(2);
		expect(plan.infill.length).toBeGreaterThan(0);
		expect(plan.seam).toEqual(plan.outer[0][0]);
		// Every path after the first begins with a travel move.
		expect(plan.travel.length).toBeGreaterThanOrEqual(2);
	});

	it('drops inner perimeters and infill where the layer is too small', () => {
		const plan = planLayer([square(2)], {
			lineWidth: 1,
			perimeters: 3,
			infillSpacing: 2,
			infillAngle: 0,
			seamAngle: 0
		});
		expect(plan.outer).toHaveLength(1);
		expect(plan.inner).toHaveLength(0);
	});
});

describe('layers', () => {
	it('covers the part with planar and non-planar layers', () => {
		const planar = layerLevels('planar');
		const nonPlanar = layerLevels('nonplanar');
		expect(planar.at(-1)).toBeLessThan(PART.height + PART.dome);
		expect(nonPlanar.at(-1)).toBeLessThan(PART.height);
		expect(planar.length).toBeGreaterThan(nonPlanar.length);
	});

	it('bends non-planar layers toward the dome and keeps them stacked', () => {
		const levels = layerLevels('nonplanar');
		const top = levels.at(-1) ?? 0;
		expect(layerSurface('nonplanar', top, 0, 0)).toBeGreaterThan(top + PART.dome * 0.9);
		expect(layerSurface('planar', top, 0, 0)).toBe(top);
		for (let i = 1; i < levels.length; i += 1) {
			expect(layerSurface('nonplanar', levels[i], 5, 3)).toBeGreaterThan(
				layerSurface('nonplanar', levels[i - 1], 5, 3)
			);
		}
	});

	it('slices the part into planned layers in both modes', () => {
		const mesh = buildPartMesh();
		for (const mode of /** @type {const} */ (['planar', 'nonplanar'])) {
			const layers = sliceLayers(mesh, mode);
			expect(layers).toHaveLength(layerLevels(mode).length);
			for (const layer of layers) {
				expect(layer.outer.length).toBeGreaterThan(0);
				expect(layer.seam).not.toBeNull();
			}
			// The wall layers carry full perimeters and infill.
			const mid = layers[Math.floor(layers.length / 2)];
			expect(mid.inner).toHaveLength(SETTINGS.perimeters - 1);
			expect(mid.infill.length).toBeGreaterThan(0);
		}
	});

	it('plans the static fallback layer from the exact section', () => {
		const plan = planarLayerFromSection(4);
		expect(plan.outer).toHaveLength(1);
		expect(plan.inner).toHaveLength(SETTINGS.perimeters - 1);
		expect(plan.infill.length).toBeGreaterThan(0);
	});
});
