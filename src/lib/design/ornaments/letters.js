/**
 * The owner's initials in Armenian capitals, ԱՍ (Ayb, Se), as a printed
 * monogram layer. Each letter is designed as centreline strokes (the path a pen or
 * nozzle would follow); the printed shape is everything within `halfWidth` of
 * those strokes. Perimeters are iso-lines of the distance to the strokes,
 * traced with marching squares, so overlapping strokes (Ayb's stem and tail)
 * merge into one island exactly the way a slicer unions and insets a layer.
 *
 * Letterforms follow the Mesropian capitals as set in Noto Sans Armenian:
 * - Ա (U+0531, Ayb): a U whose right stem ends, near the baseline, in a small
 *   arch that turns right and down to the baseline; the bowl leaves the tall
 *   left stem low and rises to meet the right stem above the baseline.
 * - Ս (U+054D, Se): a plain, symmetric U.
 *
 * Pure and deterministic: no DOM, safe for SSR and tests.
 */
import { simplify, toPath } from './geometry.js';

/** @typedef {import('./geometry.js').Point} Point */

/**
 * @typedef {object} MarkIsland
 * @property {string[]} loops closed perimeters, outermost first, in print order
 * @property {number[]} lengths length of each loop, for timing the draw
 * @property {Point} seam start point of the outer loop
 */

/**
 * @typedef {object} InitialsMark
 * @property {string} viewBox
 * @property {number} width
 * @property {number} height
 * @property {MarkIsland[]} islands Ա, then Ս
 * @property {string[]} travel non-printing moves between islands
 */

/**
 * Space between Ա's ink and Ս's ink box, in design units (cap height 100).
 * Ա's tail reaches right along the baseline while Ս's left stem rises from
 * its bowl, so at this setting the closest perimeters stay about two beads
 * apart (a little under Ա's own tail notch): close enough to read as one
 * monogram, open enough that the two outlines never read as one more loop.
 */
export const MONOGRAM_GAP = 2;

/** Cap height of the design space; letters sit on y = CAP. */
export const CAP = 100;
/** Half the printed stroke width. */
export const HALF_WIDTH = 9;
/** Distance between the two perimeters (one bead). */
export const BEAD = 4.5;

const top = HALF_WIDTH;
const baseline = CAP - HALF_WIDTH;

/**
 * Quarter or half ellipse from `from` to `to` degrees (y down: 90° is the
 * bottom of the ellipse), `count` segments.
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {number} from
 * @param {number} to
 * @param {number} [count]
 * @returns {Point[]}
 */
function arc(cx, cy, rx, ry, from, to, count = 14) {
	return Array.from({ length: count + 1 }, (_, index) => {
		const angle = ((from + ((to - from) * index) / count) * Math.PI) / 180;
		return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
	});
}

/**
 * Centreline strokes per glyph, in a box whose ink spans x ≥ 0 and
 * y ∈ [0, CAP], in writing order.
 * @type {Record<'ayb' | 'se', { advance: number, strokes: Point[][] }>}
 */
export const GLYPHS = {
	ayb: (() => {
		const left = top;
		const right = left + 48;
		const half = (right - left) / 2;
		const join = 78;
		const tail = 13;
		return {
			advance: right + 2 * tail + HALF_WIDTH,
			strokes: [
				// Left stem, then the bowl: deep on the left, rising to meet the right stem.
				[
					{ x: left, y: top },
					...arc(left + half, 58, half, baseline - 58, 180, 90),
					...arc(left + half, join, half, baseline - join, 90, 0).slice(1)
				],
				// Right stem, then the tail: a small arch to the right and down to the baseline.
				[
					{ x: right, y: top },
					...arc(right + tail, join + 2, tail, tail, 180, 360),
					{ x: right + 2 * tail, y: baseline }
				]
			]
		};
	})(),
	se: (() => {
		const left = top;
		const right = left + 56;
		const half = (right - left) / 2;
		const bowl = 55;
		return {
			advance: right + HALF_WIDTH,
			strokes: [
				[
					{ x: left, y: top },
					...arc(left + half, bowl, half, baseline - bowl, 180, 0, 24),
					{ x: right, y: top }
				]
			]
		};
	})()
};

/* ---------------------------------------------------------------- distance */

/**
 * Stroke segments as flat records [ax, ay, bx, by, minX, minY, maxX, maxY];
 * a single-point stroke becomes a zero-length segment.
 * @param {Point[][]} strokes
 */
function segmentsOf(strokes) {
	/** @type {number[]} */
	const out = [];
	for (const stroke of strokes) {
		const points = stroke.length === 1 ? [stroke[0], stroke[0]] : stroke;
		for (let index = 1; index < points.length; index += 1) {
			const a = points[index - 1];
			const b = points[index];
			out.push(
				a.x,
				a.y,
				b.x,
				b.y,
				Math.min(a.x, b.x),
				Math.min(a.y, b.y),
				Math.max(a.x, b.x),
				Math.max(a.y, b.y)
			);
		}
	}
	return Float64Array.from(out);
}

/**
 * Squared distance from (px, py) to the nearest segment, or `cap` when every
 * segment is at least that far (segments whose bounding box is already out of
 * range are skipped, which keeps the empty parts of the grid cheap).
 * @param {Float64Array} segments
 * @param {number} px
 * @param {number} py
 * @param {number} [cap] squared distance beyond which exact values do not matter
 */
function distanceSquared(segments, px, py, cap = Infinity) {
	let best = cap;
	for (let k = 0; k < segments.length; k += 8) {
		const gx = Math.max(segments[k + 4] - px, 0, px - segments[k + 6]);
		const gy = Math.max(segments[k + 5] - py, 0, py - segments[k + 7]);
		if (gx * gx + gy * gy >= best) continue;
		const ax = segments[k];
		const ay = segments[k + 1];
		const dx = segments[k + 2] - ax;
		const dy = segments[k + 3] - ay;
		const lengthSquared = dx * dx + dy * dy || 1;
		const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
		const ex = px - ax - t * dx;
		const ey = py - ay - t * dy;
		const squared = ex * ex + ey * ey;
		if (squared < best) best = squared;
	}
	return best;
}

/**
 * Distance from p to the nearest stroke (a single point counts as a stroke).
 * @param {Point[][]} strokes
 * @param {Point} p
 */
export function strokeDistance(strokes, p) {
	return Math.sqrt(distanceSquared(segmentsOf(strokes), p.x, p.y));
}

/**
 * @typedef {object} DistanceField
 * @property {Float64Array} values distance to the strokes at each grid point
 * @property {number} nx
 * @property {number} ny
 * @property {number} x0
 * @property {number} y0
 * @property {number} step
 */

/**
 * Distance to the strokes sampled on a `step` grid around them, with room for
 * iso-lines up to `reach` to close inside the grid. Values are exact up to
 * `reach + 2·step` and clamped there.
 * @param {Point[][]} strokes
 * @param {number} reach
 * @param {number} [step]
 * @returns {DistanceField}
 */
export function distanceField(strokes, reach, step = 1) {
	const points = strokes.flat();
	const margin = reach + 2 * step;
	const x0 = Math.min(...points.map((p) => p.x)) - margin;
	const y0 = Math.min(...points.map((p) => p.y)) - margin;
	const x1 = Math.max(...points.map((p) => p.x)) + margin;
	const y1 = Math.max(...points.map((p) => p.y)) + margin;
	const nx = Math.ceil((x1 - x0) / step) + 1;
	const ny = Math.ceil((y1 - y0) / step) + 1;
	const segments = segmentsOf(strokes);
	// Beyond `reach` plus one cell, only "outside" matters, not the exact value.
	const cap = (reach + 2 * step) ** 2;
	const values = new Float64Array(nx * ny);
	for (let j = 0; j < ny; j += 1) {
		for (let i = 0; i < nx; i += 1) {
			values[j * nx + i] = Math.sqrt(distanceSquared(segments, x0 + i * step, y0 + j * step, cap));
		}
	}
	return { values, nx, ny, x0, y0, step };
}

/**
 * Closed iso-lines `distance = level` of a distance field, by marching
 * squares with linear interpolation along cell edges. Every loop is returned
 * clockwise on screen (y down), without a repeated closing point.
 * @param {DistanceField} grid
 * @param {number} level
 * @returns {Point[][]}
 */
export function contours({ values, nx, ny, x0, y0, step }, level) {
	// Negative inside the printed shape.
	const at = (/** @type {number} */ i, /** @type {number} */ j) => values[j * nx + i] - level;
	const inside = (/** @type {number} */ i, /** @type {number} */ j) => at(i, j) < 0;

	/** Crossing point on an edge, keyed so neighbouring cells share it. */
	/** @type {Map<number, Point>} */
	const crossings = new Map();
	/**
	 * @param {number} i
	 * @param {number} j
	 * @param {boolean} horizontal edge from (i, j) to (i + 1, j), else to (i, j + 1)
	 */
	const edge = (i, j, horizontal) => {
		const key = (j * nx + i) * 2 + (horizontal ? 0 : 1);
		if (!crossings.has(key)) {
			const a = at(i, j);
			const b = horizontal ? at(i + 1, j) : at(i, j + 1);
			const t = a / (a - b);
			crossings.set(key, {
				x: x0 + (i + (horizontal ? t : 0)) * step,
				y: y0 + (j + (horizontal ? 0 : t)) * step
			});
		}
		return key;
	};

	/** @type {[number, number][]} */
	const segments = [];
	for (let j = 0; j < ny - 1; j += 1) {
		for (let i = 0; i < nx - 1; i += 1) {
			const a = inside(i, j);
			const b = inside(i + 1, j);
			const c = inside(i + 1, j + 1);
			const d = inside(i, j + 1);
			if (a === b && b === c && c === d) continue;
			const topEdge = a !== b ? edge(i, j, true) : -1;
			const rightEdge = b !== c ? edge(i + 1, j, false) : -1;
			const bottomEdge = d !== c ? edge(i, j + 1, true) : -1;
			const leftEdge = a !== d ? edge(i, j, false) : -1;
			const crossed = [topEdge, rightEdge, bottomEdge, leftEdge].filter((key) => key >= 0);
			if (crossed.length === 2) {
				segments.push([crossed[0], crossed[1]]);
			} else {
				// Saddle: the cell centre decides which diagonal pair is connected.
				const centre = (at(i, j) + at(i + 1, j) + at(i + 1, j + 1) + at(i, j + 1)) / 4 < 0;
				if (centre === a) {
					segments.push([topEdge, rightEdge], [bottomEdge, leftEdge]);
				} else {
					segments.push([leftEdge, topEdge], [rightEdge, bottomEdge]);
				}
			}
		}
	}

	/** @type {Map<number, number[]>} */
	const touching = new Map();
	segments.forEach(([p, q], index) => {
		for (const key of [p, q]) {
			const list = touching.get(key);
			if (list) list.push(index);
			else touching.set(key, [index]);
		}
	});
	const used = new Uint8Array(segments.length);
	/** @type {Point[][]} */
	const loops = [];
	for (let first = 0; first < segments.length; first += 1) {
		if (used[first]) continue;
		used[first] = 1;
		const start = segments[first][0];
		/** @type {number[]} */
		const keys = [start];
		let current = segments[first][1];
		while (current !== start) {
			keys.push(current);
			const next = (touching.get(current) ?? []).find((index) => !used[index]);
			if (next === undefined) break;
			used[next] = 1;
			const [p, q] = segments[next];
			current = p === current ? q : p;
		}
		const loop = keys.map((key) => /** @type {Point} */ (crossings.get(key)));
		if (loop.length > 2) loops.push(signedArea(loop) < 0 ? loop.reverse() : loop);
	}
	return loops;
}

/**
 * Shoelace area; positive for clockwise loops on screen (y down).
 * @param {Point[]} loop
 */
function signedArea(loop) {
	let sum = 0;
	loop.forEach((p, index) => {
		const q = loop[(index + 1) % loop.length];
		sum += p.x * q.y - q.x * p.y;
	});
	return sum / 2;
}

/**
 * Rotate a closed loop to start at its vertex nearest `target`.
 * @param {Point[]} loop
 * @param {Point} target
 */
function startNear(loop, target) {
	let best = 0;
	loop.forEach((p, index) => {
		const q = loop[best];
		if (Math.hypot(p.x - target.x, p.y - target.y) < Math.hypot(q.x - target.x, q.y - target.y))
			best = index;
	});
	return [...loop.slice(best), ...loop.slice(0, best)];
}

/**
 * Simplify a closed loop (kept closed, no repeated end point).
 * @param {Point[]} loop
 * @param {number} tolerance
 */
function simplifyLoop(loop, tolerance) {
	// Douglas–Peucker needs distinct end points: split at the vertex farthest
	// from the start and simplify both halves.
	let far = 0;
	loop.forEach((p, index) => {
		const q = loop[far];
		if (Math.hypot(p.x - loop[0].x, p.y - loop[0].y) > Math.hypot(q.x - loop[0].x, q.y - loop[0].y))
			far = index;
	});
	const first = simplify(loop.slice(0, far + 1), tolerance);
	const second = simplify([...loop.slice(far), loop[0]], tolerance);
	return [...first, ...second.slice(1, -1)];
}

/** @param {Point[]} loop */
function loopLength(loop) {
	let sum = 0;
	loop.forEach((p, index) => {
		const q = loop[(index + 1) % loop.length];
		sum += Math.hypot(q.x - p.x, q.y - p.y);
	});
	return sum;
}

/**
 * ԱՍ as one printed layer: per glyph two perimeters, outer then inner.
 * The first letter starts where a pen would (top of its first stem); after
 * that, each outer loop starts nearest the nozzle, and each inner loop ends
 * nearest the next glyph, so the travel move stays short and runs between the
 * glyphs instead of across them.
 * @param {{ gap?: number, step?: number }} [options] gap: space between glyphs
 * @returns {InitialsMark}
 */
export function initialsMark({ gap = MONOGRAM_GAP, step = 1 } = {}) {
	const sequence = [GLYPHS.ayb, GLYPHS.se];
	const levels = [HALF_WIDTH - BEAD / 2, HALF_WIDTH - (3 * BEAD) / 2];
	let x = 0;
	const placed = sequence.map((glyph, index) => {
		if (index > 0) x += gap;
		const strokes = glyph.strokes.map((stroke) => stroke.map((p) => ({ x: p.x + x, y: p.y })));
		x += glyph.advance;
		return strokes;
	});
	/** @type {MarkIsland[]} */
	const islands = [];
	/** @type {string[]} */
	const travel = [];
	/** @type {Point | null} */
	let cursor = null;
	placed.forEach((strokes, index) => {
		const next = placed[index + 1]?.[0][0];
		const grid = distanceField(strokes, levels[0], step);
		const loops = levels.map((level, depth) => {
			const found = contours(grid, level);
			// The longest loop is the island's perimeter; any others would be holes.
			const loop = simplifyLoop(
				found.reduce((a, b) => (loopLength(b) > loopLength(a) ? b : a)),
				0.12
			);
			const target = depth === 0 ? (cursor ?? strokes[0][0]) : (next ?? strokes[0][0]);
			return startNear(loop, target);
		});
		const seam = { x: round1(loops[0][0].x), y: round1(loops[0][0].y) };
		if (cursor) travel.push(toPath([cursor, seam]));
		cursor = loops.at(-1)?.[0] ?? seam;
		islands.push({
			loops: loops.map((loop) => toPath(loop, true)),
			lengths: loops.map((loop) => Math.round(loopLength(loop))),
			seam
		});
	});
	const width = Math.ceil(x);
	return { viewBox: `0 0 ${width} ${CAP}`, width, height: CAP, islands, travel };
}

/** @param {number} value */
function round1(value) {
	return Math.round(value * 10) / 10;
}

/** @type {InitialsMark | undefined} */
let cached;

/** The mark with default options, computed once per process. */
export function initials() {
	cached ??= initialsMark();
	return cached;
}
