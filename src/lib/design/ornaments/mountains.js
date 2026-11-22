/**
 * Armenian mountains as a slicer preview: Mount Ararat (Masis and Sis) and
 * Mount Aragats built as one procedural heightfield, cut into iso-height
 * contours by marching squares, and shown in a low oblique view so the stacked
 * contour "layers" read as a skyline, the way a slicer previews a printed
 * relief model. Contours are perimeters, the snow caps get serpentine infill,
 * dashed travel moves join the islands, and every printed stroke starts at a
 * seam dot. The print ends on the summit of Masis, where the nozzle rests.
 *
 * Pure and deterministic (only + − × ÷ and √, integer-hash noise): no
 * randomness, no DOM, so the committed `mountains.svg` can be checked for
 * staleness in tests. Regenerate it with
 * `UPDATE_MOUNTAINS=1 npx vitest run src/lib/design/ornaments/mountains.test.js`.
 *
 * Orientation: one panorama from Yerevan, facing south toward Ararat, so u
 * runs east → west from left to right. Sis (Lesser Ararat, bearing ≈189°)
 * stands to the LEFT of Masis (Greater Ararat, ≈198°). Turning right, toward
 * the west and north-west, the view reaches Aragats (≈326°), a broad massif
 * with four summits around a crater; it is drawn to the RIGHT of Masis,
 * closer than its real bearing so the strip stays one picture.
 */
import { insideRegion, polylineLength, serpentineFill, simplify, toPath } from './geometry.js';

/** @typedef {import('./geometry.js').Point} Point */

export const MOUNTAINS_WIDTH = 2400;
export const MOUNTAINS_HEIGHT = 600;
export const MOUNTAINS_VIEWBOX = `0 0 ${MOUNTAINS_WIDTH} ${MOUNTAINS_HEIGHT}`;
/** Id of the drawing inside the generated SVG file. */
export const MOUNTAINS_ID = 'mountains';

/** Plan grid: u spans the strip, v the depth of the scene (positive toward the viewer). */
const GRID = { step: 8, minV: -560, maxV: 560 };

/** Elevation of the Ararat plain; heights below are kilometres above it. */
const BASE_M = 850;
/** @param {number} metres */
const km = (metres) => (metres - BASE_M) / 1000;

/* ------------------------------------------------------- marching squares */

/**
 * @typedef {object} Contour
 * @property {Point[]} points in grid coordinates (column, row); closed loops do not repeat the first point
 * @property {boolean} closed
 */

/**
 * Iso-lines of a scalar grid by marching squares. `values` is row-major,
 * `cols` × `rows`. A corner counts as inside when `value >= level`. Saddle
 * cells are resolved by the cell-centre average (inside centre joins the
 * inside corners). Segments are stitched through integer grid-edge ids, so
 * neighbouring cells always share the exact same crossing point.
 * @param {ArrayLike<number>} values
 * @param {number} cols
 * @param {number} rows
 * @param {number} level
 * @returns {Contour[]}
 */
export function marchingSquares(values, cols, rows, level) {
	const at = (/** @type {number} */ i, /** @type {number} */ j) => values[j * cols + i];
	// Horizontal edge (i,j)→(i+1,j) is 2·node, vertical edge (i,j)→(i,j+1) is 2·node+1.
	const hEdge = (/** @type {number} */ i, /** @type {number} */ j) => (j * cols + i) * 2;
	const vEdge = (/** @type {number} */ i, /** @type {number} */ j) => (j * cols + i) * 2 + 1;

	/** @type {Map<number, Point>} */
	const crossing = new Map();
	/** @param {number} edge */
	const point = (edge) => {
		const cached = crossing.get(edge);
		if (cached) return cached;
		const node = edge >> 1;
		const i = node % cols;
		const j = (node - i) / cols;
		const vertical = edge & 1;
		const a = at(i, j);
		const b = vertical ? at(i, j + 1) : at(i + 1, j);
		const t = b === a ? 0.5 : (level - a) / (b - a);
		const p = vertical ? { x: i, y: j + t } : { x: i + t, y: j };
		crossing.set(edge, p);
		return p;
	};

	/** @type {[number, number][]} */
	const segments = [];
	for (let j = 0; j + 1 < rows; j += 1) {
		for (let i = 0; i + 1 < cols; i += 1) {
			const tl = at(i, j);
			const tr = at(i + 1, j);
			const br = at(i + 1, j + 1);
			const bl = at(i, j + 1);
			const index =
				(tl >= level ? 8 : 0) |
				(tr >= level ? 4 : 0) |
				(br >= level ? 2 : 0) |
				(bl >= level ? 1 : 0);
			if (index === 0 || index === 15) continue;
			const T = hEdge(i, j);
			const B = hEdge(i, j + 1);
			const L = vEdge(i, j);
			const R = vEdge(i + 1, j);
			const centre = (tl + tr + br + bl) / 4 >= level;
			switch (index) {
				case 1:
				case 14:
					segments.push([L, B]);
					break;
				case 2:
				case 13:
					segments.push([B, R]);
					break;
				case 3:
				case 12:
					segments.push([L, R]);
					break;
				case 4:
				case 11:
					segments.push([T, R]);
					break;
				case 6:
				case 9:
					segments.push([T, B]);
					break;
				case 7:
				case 8:
					segments.push([T, L]);
					break;
				case 5: // tr and bl inside
					if (centre) segments.push([T, L], [B, R]);
					else segments.push([T, R], [L, B]);
					break;
				case 10: // tl and br inside
					if (centre) segments.push([T, R], [L, B]);
					else segments.push([T, L], [B, R]);
					break;
			}
		}
	}

	/** @type {Map<number, number[]>} */
	const byEdge = new Map();
	segments.forEach(([a, b], index) => {
		for (const edge of [a, b]) {
			const list = byEdge.get(edge);
			if (list) list.push(index);
			else byEdge.set(edge, [index]);
		}
	});
	const used = new Uint8Array(segments.length);
	/**
	 * Follow unused segments from `edge` until the chain closes or ends.
	 * @param {number} edge
	 * @param {number[]} chain edge ids, extended in place
	 */
	const walk = (edge, chain) => {
		let current = edge;
		for (;;) {
			const next = (byEdge.get(current) ?? []).find((index) => !used[index]);
			if (next === undefined) return;
			used[next] = 1;
			const [a, b] = segments[next];
			current = a === current ? b : a;
			chain.push(current);
		}
	};

	/** @type {Contour[]} */
	const contours = [];
	segments.forEach(([a, b], index) => {
		if (used[index]) return;
		used[index] = 1;
		const forward = [a, b];
		walk(b, forward);
		const closed = forward.length > 2 && forward.at(-1) === forward[0];
		let edges = forward;
		if (closed) edges = forward.slice(0, -1);
		else {
			const backward = [a];
			walk(a, backward);
			edges = [...backward.slice(1).reverse(), ...forward];
		}
		contours.push({ points: edges.map(point), closed });
	});
	return contours;
}

/* ------------------------------------------------------------ heightfield */

/** Share of a `linear` cone's radius that is rounded off at the summit. */
const CONE_TIP = 0.1;

/**
 * Radial profiles, each 1 at the centre. `dome` has a rounded top and long
 * concave slopes (Masis, the Aragats massif and summits); `linear` is a
 * straight-sided cone that reaches zero at `radius`, its tip rounded over the
 * inner `CONE_TIP` share (Sis, a near-perfect volcanic cone).
 * @param {'dome' | 'linear'} shape
 * @param {number} r distance from the centre
 * @param {number} radius
 */
function profile(shape, r, radius) {
	if (shape === 'linear') {
		const x = r / radius;
		const tip = CONE_TIP;
		// 1 − x outside the tip, a parabola inside it that meets it with the same slope.
		const raw = x < tip ? 1 - tip / 2 - (x * x) / (2 * tip) : 1 - x;
		return Math.max(0, raw / (1 - tip / 2));
	}
	const q = 1 + (r * r) / (radius * radius);
	return 1 / (q * q);
}

/**
 * @typedef {object} Peak
 * @property {string} name
 * @property {number} u plan position, east → west as seen facing south (left → right)
 * @property {number} v plan depth, positive toward the viewer
 * @property {number} radius
 * @property {'dome' | 'linear'} shape
 * @property {number | null} elevation summit in metres, or null for a fixed-amplitude term
 * @property {number} [amplitude] km, for fixed terms (negative carves the crater)
 * @property {number} [stretch] squeeze along u on the right-hand side (Masis: its longer western flank)
 * @property {number} [depth] squeeze along v (an elongated ridge)
 */

/** @type {Peak[]} */
export const PEAKS = [
	// Ararat: Sis (3896 m) to the left, Masis (5137 m) to the right, joined by
	// the Sardar-Bulakh saddle. Sis's straight flanks match the slope of
	// Masis's upper flanks.
	{ name: 'Sis', u: 990, v: -40, radius: 175, shape: 'linear', elevation: 3896 },
	{
		name: 'Sardar-Bulakh saddle',
		u: 1170,
		v: -30,
		radius: 150,
		shape: 'dome',
		elevation: null,
		amplitude: 0.35,
		depth: 1.9
	},
	{ name: 'Masis', u: 1390, v: 0, radius: 285, shape: 'dome', elevation: 5137, stretch: 1.1 },
	// Aragats (4090 m): one broad, high massif with a jagged crest of four low
	// summits around the crater. Facing south, its west summit is on the right.
	{
		name: 'Aragats massif',
		u: 2110,
		v: 0,
		radius: 250,
		shape: 'dome',
		elevation: null,
		amplitude: 2.7
	},
	{
		name: 'Aragats crater',
		u: 2110,
		v: 0,
		radius: 60,
		shape: 'dome',
		elevation: null,
		amplitude: -0.5
	},
	{ name: 'Aragats North', u: 2110, v: -75, radius: 62, shape: 'dome', elevation: 4090 },
	{ name: 'Aragats West', u: 2188, v: 0, radius: 58, shape: 'dome', elevation: 3995 },
	{ name: 'Aragats East', u: 2032, v: 0, radius: 56, shape: 'dome', elevation: 3916 },
	{ name: 'Aragats South', u: 2110, v: 75, radius: 56, shape: 'dome', elevation: 3879 },
	// Low foothills on the plain: small separate islands on the first layers.
	{
		name: 'foothill',
		u: 640,
		v: 330,
		radius: 70,
		shape: 'dome',
		elevation: null,
		amplitude: 0.62
	},
	{ name: 'foothill', u: 260, v: 300, radius: 80, shape: 'dome', elevation: null, amplitude: 0.55 },
	{ name: 'foothill', u: 1790, v: 400, radius: 60, shape: 'dome', elevation: null, amplitude: 0.5 }
];

/** @param {Peak} peak @param {number} u @param {number} v */
function term(peak, u, v) {
	let du = u - peak.u;
	if (du > 0 && peak.stretch) du /= peak.stretch;
	const dv = (v - peak.v) * (peak.depth ?? 1);
	return profile(peak.shape, Math.sqrt(du * du + dv * dv), peak.radius);
}

/**
 * Amplitudes so each named summit lands on its real elevation (relative to
 * the plain) once every other term's tail is added: a few Jacobi sweeps.
 */
const AMPLITUDES = (() => {
	const amplitudes = PEAKS.map((peak) => peak.amplitude ?? km(peak.elevation ?? BASE_M));
	for (let sweep = 0; sweep < 6; sweep += 1) {
		PEAKS.forEach((peak, index) => {
			if (peak.elevation === null) return;
			let others = 0;
			PEAKS.forEach((other, k) => {
				if (k !== index) others += amplitudes[k] * term(other, peak.u, peak.v);
			});
			amplitudes[index] = km(peak.elevation) - others;
		});
	}
	return amplitudes;
})();

/** @param {number} ix @param {number} iy @param {number} seed */
function hash(ix, iy, seed) {
	let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041)) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	h ^= h >>> 16;
	return (h >>> 0) / 4294967296;
}

/** Smooth value noise in [0, 1). @param {number} x @param {number} y @param {number} seed */
function valueNoise(x, y, seed) {
	const ix = Math.floor(x);
	const iy = Math.floor(y);
	const fx = x - ix;
	const fy = y - iy;
	const sx = fx * fx * (3 - 2 * fx);
	const sy = fy * fy * (3 - 2 * fy);
	const top = hash(ix, iy, seed) + (hash(ix + 1, iy, seed) - hash(ix, iy, seed)) * sx;
	const bottom =
		hash(ix, iy + 1, seed) + (hash(ix + 1, iy + 1, seed) - hash(ix, iy + 1, seed)) * sx;
	return top + (bottom - top) * sy;
}

/** Smoothstep from 0 at the plan border to 1 one `BORDER` inside it. */
const BORDER = 140;
/** @param {number} u @param {number} v */
function borderTaper(u, v) {
	const edge = Math.min(u, MOUNTAINS_WIDTH - u, v - GRID.minV, GRID.maxV - v) / BORDER;
	const t = Math.min(1, Math.max(0, edge));
	return t * t * (3 - 2 * t);
}

/**
 * Terrain height in km above the plain at plan point (u, v): the radial terms
 * plus low-frequency noise that only roughens the slopes, never the plain.
 * @param {number} u
 * @param {number} v
 */
export function terrainHeight(u, v) {
	let height = 0;
	PEAKS.forEach((peak, index) => {
		height += AMPLITUDES[index] * term(peak, u, v);
	});
	const rough =
		(valueNoise(u / 230, v / 230, 11) - 0.5) * 0.5 +
		(valueNoise(u / 95, v / 95, 23) - 0.5) * 0.3 +
		(valueNoise(u / 44, v / 44, 37) - 0.5) * 0.2;
	const slope = Math.min(1, height / 1.2);
	return Math.max(0, (height + rough * 0.34 * slope) * borderTaper(u, v));
}

/* -------------------------------------------------------------- the view */

/** Screen y of the plain at depth v = 0. */
const HORIZON_Y = 500;
/** Screen pixels per km of height (a gentle vertical exaggeration). */
const LIFT = 96;
/** Screen pixels per plan unit of depth: a low oblique view. */
const TILT = 0.16;
/** Contour levels, km above the plain. */
const FIRST_LEVEL = 0.4;
const LEVEL_STEP = 0.3;
/** Snow caps that get serpentine infill. */
const SNOW = [
	{ peak: 'Masis', level: 3.2, spacing: 11, angle: 45 },
	{ peak: 'Aragats North', level: 2.65, spacing: 10, angle: 45 }
];
/** Simplification tolerance for contour strokes, screen units. */
const TOLERANCE = 0.5;
/** Longer repositioning moves are left out: they would only cross the drawing. */
const MAX_TRAVEL = 260;
/** Everything right of this plan u is the Aragats object, printed first, so the
 * print ends on Ararat (the summit of Masis). */
const SPLIT_U = 1780;
/** Print order of a plan position: 0 = Aragats (first), 1 = Ararat (last). */
const objectOf = (/** @type {number} */ u) => (u > SPLIT_U ? 0 : 1);

/** @param {number} u @param {number} v @param {number} h */
const project = (u, v, h) => ({ x: u, y: HORIZON_Y - h * LIFT + v * TILT });
/** Height on screen ("up" from the horizon line), larger is higher. */
const upOf = (/** @type {number} */ v, /** @type {number} */ h) => h * LIFT - v * TILT;

/**
 * @typedef {object} Stroke
 * @property {Point[]} points screen coordinates
 * @property {boolean} closed
 */

/**
 * @typedef {object} MountainScene
 * @property {string} viewBox
 * @property {string} skyline the silhouette above the plain: the outer wall
 * @property {string} horizon the far edge of the plain where no mountain stands
 * @property {string[]} perimeters visible contour strokes in print order
 * @property {string[]} infill serpentine snow-cap fill
 * @property {string[]} travel non-printing moves between strokes
 * @property {Point[]} seams first point of every printed stroke
 * @property {Point} nozzle where the print ends
 * @property {number[]} levels contour heights in km
 */

/** @param {Point} a @param {Point} b */
const gap = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));

/** @param {Point} p */
const snap = (p) => ({ x: Math.round(p.x), y: Math.round(p.y) });

/** @type {MountainScene | null} */
let cached = null;

/**
 * The whole scene, computed once and cached.
 * @returns {MountainScene}
 */
export function mountainScene() {
	if (cached) return cached;
	const { step, minV, maxV } = GRID;
	const cols = Math.round(MOUNTAINS_WIDTH / step) + 1;
	const rows = Math.round((maxV - minV) / step) + 1;
	const heights = new Float64Array(cols * rows);
	for (let j = 0; j < rows; j += 1) {
		for (let i = 0; i < cols; i += 1) {
			heights[j * cols + i] = terrainHeight(i * step, minV + j * step);
		}
	}
	const toPlan = (/** @type {Point} */ p) => ({ u: p.x * step, v: minV + p.y * step });

	// Hidden lines: the highest screen point of the terrain strictly in front
	// of each grid row, per column (a suffix maximum toward the viewer).
	const front = new Float64Array(cols * rows);
	/** @type {number[]} */
	const skylineUp = [];
	for (let i = 0; i < cols; i += 1) {
		let best = -Infinity;
		for (let j = rows - 1; j >= 0; j -= 1) {
			front[j * cols + i] = best;
			best = Math.max(best, upOf(minV + j * step, heights[j * cols + i]));
		}
		skylineUp.push(best);
	}
	/** @param {number} u @param {number} v @param {number} h */
	const visible = (u, v, h) => {
		const fi = Math.min(Math.max(u / step, 0), cols - 1);
		const i0 = Math.floor(fi);
		const i1 = Math.min(i0 + 1, cols - 1);
		const j = Math.min(Math.max(Math.floor((v - minV) / step), 0), rows - 1);
		const a = front[j * cols + i0];
		const b = front[j * cols + i1];
		const occluder = a + (b - a) * (fi - i0);
		return upOf(v, h) >= occluder - 1.2;
	};

	const top = Math.max(...heights);
	/** @type {number[]} */
	const levels = [];
	for (let level = FIRST_LEVEL; level < top; level += LEVEL_STEP) {
		levels.push(Math.round(level * 1000) / 1000);
	}

	/**
	 * Visible screen strokes of one closed plan contour at height `h`.
	 * @param {Point[]} ring plan points (grid space)
	 * @param {number} h
	 * @returns {Stroke[]}
	 */
	const visibleStrokes = (ring, h) => {
		const plan = ring.map(toPlan);
		const flags = plan.map((p) => visible(p.u, p.v, h));
		const screen = plan.map((p) => project(p.u, p.v, h));
		const hidden = flags.indexOf(false);
		if (hidden === -1) return [{ points: screen, closed: true }];
		/** @type {Stroke[]} */
		const strokes = [];
		/** @type {Point[]} */
		let run = [];
		for (let k = 1; k <= plan.length; k += 1) {
			const index = (hidden + k) % plan.length;
			if (flags[index]) run.push(screen[index]);
			else if (run.length) {
				strokes.push({ points: run, closed: false });
				run = [];
			}
		}
		return strokes;
	};

	/** @type {{ object: number, level: number, stroke: Stroke }[]} */
	const pieces = [];
	/** @type {Map<string, Stroke[]>} */
	const snowRings = new Map();
	for (const level of levels.concat(SNOW.map((snow) => snow.level))) {
		const isSnow = !levels.includes(level);
		for (const contour of marchingSquares(heights, cols, rows, level)) {
			if (!contour.closed) continue;
			const plan = contour.points.map(toPlan);
			const us = plan.map((p) => p.u);
			const vs = plan.map((p) => p.v);
			const extent = Math.max(
				Math.max(...us) - Math.min(...us),
				(Math.max(...vs) - Math.min(...vs)) * 0.5
			);
			if (extent < 40) continue; // noise specks
			const strokes = visibleStrokes(contour.points, level)
				.map((stroke) => ({
					points: stroke.closed
						? simplify([...stroke.points, stroke.points[0]], TOLERANCE).slice(0, -1)
						: simplify(stroke.points, TOLERANCE),
					closed: stroke.closed
				}))
				.filter((stroke) => polylineLength(stroke.points, stroke.closed) > 14);
			if (isSnow) {
				const polygon = contour.points.map((p) => ({ x: toPlan(p).u, y: toPlan(p).v }));
				for (const snow of SNOW) {
					const peak = PEAKS.find((candidate) => candidate.name === snow.peak);
					if (snow.level !== level || !peak) continue;
					if (insideRegion([polygon], { x: peak.u, y: peak.v })) snowRings.set(snow.peak, strokes);
				}
				continue;
			}
			const centreU = (Math.min(...us) + Math.max(...us)) / 2;
			const object = objectOf(centreU);
			for (const stroke of strokes) pieces.push({ object, level, stroke });
		}
	}

	// Skyline and horizon from the per-column maximum.
	const farUp = upOf(minV, 0);
	/** @type {Point[][]} */
	const skylineRuns = [];
	/** @type {Point[][]} */
	const horizonRuns = [];
	/** @type {boolean | null} */
	let previousKind = null;
	/** @type {Point | null} */
	let previousPoint = null;
	skylineUp.forEach((up, i) => {
		const mountain = up > farUp + 3;
		const runs = mountain ? skylineRuns : horizonRuns;
		const p = { x: i * step, y: HORIZON_Y - up };
		if (mountain === previousKind) runs.at(-1)?.push(p);
		else runs.push(previousPoint ? [previousPoint, p] : [p]);
		previousKind = mountain;
		previousPoint = p;
	});
	/** @param {number} x */
	const skylineAt = (x) => {
		const fi = Math.min(Math.max(x / step, 0), cols - 1);
		const i0 = Math.floor(fi);
		const i1 = Math.min(i0 + 1, cols - 1);
		return HORIZON_Y - (skylineUp[i0] + (skylineUp[i1] - skylineUp[i0]) * (fi - i0));
	};

	// Snow caps: between the visible front arc of the snowline and the skyline.
	/** @type {Map<string, Point[][]>} */
	const snowFill = new Map();
	for (const snow of SNOW) {
		const strokes = snowRings.get(snow.peak);
		if (!strokes?.length) continue;
		const longest = strokes.reduce((a, b) =>
			polylineLength(b.points) > polylineLength(a.points) ? b : a
		);
		let arc = longest.points;
		if ((arc[0]?.x ?? 0) > (arc.at(-1)?.x ?? 0)) arc = arc.slice().reverse();
		const x0 = arc[0].x;
		const x1 = arc.at(-1)?.x ?? x0;
		/** @type {Point[]} */
		const ridge = [];
		for (let x = Math.floor(x1 / step) * step; x > x0; x -= step) {
			ridge.push({ x, y: skylineAt(x) });
		}
		const polygon = [...arc, { x: x1, y: skylineAt(x1) }, ...ridge, { x: x0, y: skylineAt(x0) }];
		const pivot = { x: (x0 + x1) / 2, y: arc[0].y };
		snowFill.set(
			snow.peak,
			serpentineFill([polygon], snow.spacing, snow.angle, pivot).map((chain) =>
				simplify(chain, 0.6)
			)
		);
	}

	// Print order: one object at a time (Aragats on the right, then Ararat), each bottom
	// layer up, nearest stroke next; a layer's snow infill follows its walls.
	/** @type {MountainScene} */
	const scene = {
		viewBox: MOUNTAINS_VIEWBOX,
		skyline: skylineRuns
			.filter((run) => run.length > 1)
			.map((run) => toPath(simplify(run, 0.8).map(snap)))
			.join(''),
		horizon: horizonRuns
			.filter((run) => run.length > 1)
			.map((run) => toPath([run[0], run.at(-1) ?? run[0]].map(snap)))
			.join(''),
		perimeters: [],
		infill: [],
		travel: [],
		seams: [],
		nozzle: { x: 0, y: 0 },
		levels
	};
	/** @type {Point | null} */
	let cursor = null;
	/** @param {Point} start */
	const travelTo = (start) => {
		if (cursor && gap(cursor, start) > 6 && gap(cursor, start) < MAX_TRAVEL)
			scene.travel.push(toPath([cursor, start].map(snap)));
	};
	for (const object of [0, 1]) {
		for (const level of levels) {
			const pending = pieces.filter((piece) => piece.object === object && piece.level === level);
			while (pending.length) {
				const from = cursor ?? { x: MOUNTAINS_WIDTH, y: HORIZON_Y };
				let bestIndex = 0;
				let bestGap = Infinity;
				let bestPoints = pending[0].stroke.points;
				pending.forEach((piece, index) => {
					const { points, closed } = piece.stroke;
					/** @type {Point[][]} */
					const options = [];
					if (closed) {
						let nearest = 0;
						points.forEach((p, k) => {
							if (gap(p, from) < gap(points[nearest], from)) nearest = k;
						});
						options.push([...points.slice(nearest), ...points.slice(0, nearest)]);
					} else options.push(points, points.slice().reverse());
					for (const option of options) {
						if (gap(option[0], from) < bestGap) {
							bestGap = gap(option[0], from);
							bestIndex = index;
							bestPoints = option;
						}
					}
				});
				const [piece] = pending.splice(bestIndex, 1);
				const points = bestPoints.map(snap);
				travelTo(points[0]);
				scene.perimeters.push(toPath(points, piece.stroke.closed));
				scene.seams.push(points[0]);
				cursor = piece.stroke.closed ? points[0] : (points.at(-1) ?? points[0]);
			}
			for (const snow of SNOW) {
				const peak = PEAKS.find((candidate) => candidate.name === snow.peak);
				const nextLevel = levels.find((candidate) => candidate > level) ?? Infinity;
				if (!peak || objectOf(peak.u) !== object) continue;
				if (!(snow.level >= level && snow.level < nextLevel)) continue;
				for (const chain of snowFill.get(snow.peak) ?? []) {
					const points = chain.map(snap);
					if (points.length < 2) continue;
					travelTo(points[0]);
					scene.infill.push(toPath(points));
					cursor = points.at(-1) ?? points[0];
				}
			}
		}
	}
	scene.nozzle = cursor ?? { x: 0, y: 0 };
	cached = scene;
	return scene;
}

/* ------------------------------------------------------------ the SVG file */

/**
 * Layer styles baked into the file: an external `<use>` cannot be styled by
 * the page, so weights live here; colour (`currentColor`) and overall alpha
 * come from the referencing `<svg>`.
 */
const LAYERS = {
	horizon: 'stroke-width="0.8" stroke-opacity="0.6" stroke-dasharray="2 7"',
	travel: 'stroke-width="0.7" stroke-opacity="0.55" stroke-dasharray="3 6"',
	infill: 'stroke-width="0.7" stroke-opacity="0.75"',
	perimeter: 'stroke-width="1"',
	skyline: 'stroke-width="1.6"',
	seams: 'stroke-width="3.5"',
	halo: 'stroke-width="14" stroke-opacity="0.3"',
	nozzle: 'stroke-width="6"'
};

/**
 * The generated `mountains.svg`: one `<g id="mountains">` in slicer layers.
 * @returns {string}
 */
export function renderMountainsSvg() {
	const scene = mountainScene();
	const dot = (/** @type {Point[]} */ points) => points.map((p) => `M${p.x} ${p.y}h0`).join('');
	const layer = (/** @type {keyof typeof LAYERS} */ kind, /** @type {string} */ d) =>
		d ? `<path vector-effect="non-scaling-stroke" ${LAYERS[kind]} d="${d}"/>` : '';
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${scene.viewBox}">`,
		'<!-- Generated by src/lib/design/ornaments/mountains.js; do not edit. -->',
		`<g id="${MOUNTAINS_ID}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">`,
		layer('horizon', scene.horizon),
		layer('travel', scene.travel.join('')),
		layer('infill', scene.infill.join('')),
		layer('perimeter', scene.perimeters.join('')),
		layer('skyline', scene.skyline),
		layer('seams', dot(scene.seams)),
		layer('halo', dot([scene.nozzle])),
		layer('nozzle', dot([scene.nozzle])),
		'</g>',
		'</svg>',
		''
	].join('\n');
}
