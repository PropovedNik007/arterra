/**
 * Geometry for the mini slicer on the Flexam page: a procedurally generated
 * part (a vase with a twisted, rounded five-point star section and a domed
 * top), a triangle mesh of it, and a tiny slicing pipeline that turns that
 * mesh into per-layer toolpaths the way a slicer preview shows them: outer
 * perimeter, inner perimeters, serpentine infill, travel moves and the seam.
 *
 * Coordinates are millimetre-like units with z up. Everything here is pure
 * and deterministic (no DOM, no three.js), so it runs in tests, during
 * prerendering for the static fallback, and in the browser.
 *
 * It is a teaching sketch, not a production slicer: no tolerances for
 * open meshes, no bridging or supports, and the non-planar mode only bends
 * layers toward the domed top (see `layerSurface`).
 */

/** @typedef {{ x: number, y: number }} Point2 */
/** @typedef {{ x: number, y: number, z: number }} Point3 */
/** @typedef {{ positions: number[], indices: number[] }} Mesh */
/** @typedef {'planar' | 'nonplanar'} SliceMode */

/**
 * @typedef {object} Toolpath2D One layer's moves, in print order, in the XY plane.
 * @property {Point2[][]} outer Outer perimeter loops (closed; first point is the seam).
 * @property {Point2[][]} inner Inner perimeter loops, outermost first.
 * @property {Point2[][]} infill Serpentine infill polylines.
 * @property {[Point2, Point2][]} travel Non-printing moves between paths.
 * @property {Point2 | null} seam Start point of the layer.
 */

/**
 * @typedef {object} Layer A toolpath lifted onto its layer surface.
 * @property {number} level Slicing parameter (height of the plane, or of the surface rim).
 * @property {Point3[][]} outer
 * @property {Point3[][]} inner
 * @property {Point3[][]} infill
 * @property {[Point3, Point3][]} travel
 * @property {Point3 | null} seam
 */

const TAU = Math.PI * 2;

/** Shape of the demo part. */
export const PART = Object.freeze({
	/** Height of the twisted wall. */
	height: 56,
	/** Extra height of the domed top above the wall. */
	dome: 10,
	/** Base radius of the star section. */
	radius: 21,
	/** Number of star points. */
	lobes: 5,
	/** Depth of the star points relative to the radius (kept small so offsets stay clean). */
	amplitude: 0.14,
	/** Total twist of the section from bottom to top of the wall. */
	twist: Math.PI / 3,
	/** Samples around the section. */
	segments: 120,
	/** Rings up the wall. */
	rings: 40,
	/** Rings over the dome. */
	domeRings: 10
});

/** Exaggerated print settings so individual moves stay readable on screen. */
export const SETTINGS = Object.freeze({
	layerHeight: 2,
	lineWidth: 1.4,
	perimeters: 3,
	infillSpacing: 3
});

/* ------------------------------------------------------------------ part */

/** Wall radius scale over normalised height t in [0, 1]: a gentle vase belly. */
export function wallScale(/** @type {number} */ t) {
	return 0.82 + 0.3 * Math.sin(Math.PI * t) - 0.08 * t;
}

/** Twist of the section at height z (the dome keeps the top twist). */
export function twistAt(/** @type {number} */ z) {
	return (PART.twist * Math.min(Math.max(z, 0), PART.height)) / PART.height;
}

/** Rounded star factor for a polar angle measured in the section's own frame. */
function star(/** @type {number} */ angle) {
	return 1 + PART.amplitude * Math.cos(PART.lobes * angle);
}

/**
 * Radius scale of the section at height z, including the dome, where the
 * section shrinks as z = H + D (1 - u²) for u from 1 to 0.
 * @param {number} z
 */
function sectionScale(z) {
	if (z <= PART.height) return PART.radius * wallScale(z / PART.height);
	const u = Math.sqrt(Math.max(0, 1 - (z - PART.height) / PART.dome));
	return PART.radius * wallScale(1) * u;
}

/**
 * Exact cross-section of the part at height z as a counter-clockwise loop.
 * Used by the static fallback and by tests that compare it with `sliceMesh`.
 * @param {number} z
 * @param {number} [segments]
 * @returns {Point2[]}
 */
export function sectionAt(z, segments = PART.segments) {
	const scale = sectionScale(z);
	const twist = twistAt(z);
	/** @type {Point2[]} */
	const loop = [];
	for (let index = 0; index < segments; index += 1) {
		const angle = (TAU * index) / segments;
		const radius = scale * star(angle - twist);
		loop.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
	}
	return loop;
}

/**
 * Closed, outward-facing triangle mesh of the part: bottom fan, twisted wall
 * rings, dome rings and a top fan. Flat arrays, ready for a BufferGeometry.
 * @returns {Mesh}
 */
export function buildPartMesh() {
	const { segments, rings, domeRings, height, dome } = PART;
	/** @type {number[]} */
	const positions = [0, 0, 0];
	/** @type {number[]} */
	const heights = [];
	for (let ring = 0; ring <= rings; ring += 1) heights.push((height * ring) / rings);
	for (let ring = 1; ring < domeRings; ring += 1) {
		const u = Math.cos(((ring / domeRings) * Math.PI) / 2);
		heights.push(height + dome * (1 - u * u));
	}
	for (const z of heights) {
		for (const point of sectionAt(z, segments)) positions.push(point.x, point.y, z);
	}
	const top = positions.length / 3;
	positions.push(0, 0, height + dome);

	/** @type {number[]} */
	const indices = [];
	const at = (/** @type {number} */ ring, /** @type {number} */ step) =>
		1 + ring * segments + (step % segments);
	for (let step = 0; step < segments; step += 1) {
		indices.push(0, at(0, step + 1), at(0, step));
	}
	for (let ring = 0; ring < heights.length - 1; ring += 1) {
		for (let step = 0; step < segments; step += 1) {
			const a = at(ring, step);
			const b = at(ring, step + 1);
			const c = at(ring + 1, step + 1);
			const d = at(ring + 1, step);
			indices.push(a, b, c, a, c, d);
		}
	}
	const last = heights.length - 1;
	for (let step = 0; step < segments; step += 1) {
		indices.push(top, at(last, step), at(last, step + 1));
	}
	return { positions, indices };
}

/* --------------------------------------------------------------- slicing */

/**
 * Slice a closed triangle mesh where a scalar field crosses zero. With
 * `values[i] = z_i - h` this is ordinary planar slicing at height h; any other
 * field gives curved (non-planar) layers. Crossings are keyed by mesh edge, so
 * segments chain into loops exactly, without coordinate matching.
 * @param {Mesh} mesh
 * @param {ArrayLike<number>} values Field value per vertex; >= 0 counts as above.
 * @returns {Point3[][]} Closed loops, unoriented, first point not repeated.
 */
export function sliceMesh({ positions, indices }, values) {
	const vertexCount = positions.length / 3;
	/** @type {Map<number, Point3>} */
	const points = new Map();
	/** @type {Map<number, number>} */
	const next = new Map();

	/** @param {number} i @param {number} j */
	const cross = (i, j) => {
		const key = i < j ? i * vertexCount + j : j * vertexCount + i;
		if (!points.has(key)) {
			const t = values[i] / (values[i] - values[j]);
			points.set(key, {
				x: positions[i * 3] + t * (positions[j * 3] - positions[i * 3]),
				y: positions[i * 3 + 1] + t * (positions[j * 3 + 1] - positions[i * 3 + 1]),
				z: positions[i * 3 + 2] + t * (positions[j * 3 + 2] - positions[i * 3 + 2])
			});
		}
		return key;
	};

	for (let index = 0; index < indices.length; index += 3) {
		/** @type {number | undefined} */
		let up;
		/** @type {number | undefined} */
		let down;
		for (let edge = 0; edge < 3; edge += 1) {
			const i = indices[index + edge];
			const j = indices[index + ((edge + 1) % 3)];
			const above = values[i] >= 0;
			if (above === values[j] >= 0) continue;
			if (above) down = cross(i, j);
			else up = cross(i, j);
		}
		if (up !== undefined && down !== undefined) next.set(down, up);
	}

	/** @type {Point3[][]} */
	const loops = [];
	/** @type {Set<number>} */
	const seen = new Set();
	for (const start of next.keys()) {
		if (seen.has(start)) continue;
		/** @type {Point3[]} */
		const loop = [];
		/** @type {number | undefined} */
		let key = start;
		while (key !== undefined && !seen.has(key)) {
			seen.add(key);
			loop.push(/** @type {Point3} */ (points.get(key)));
			key = next.get(key);
		}
		if (loop.length >= 3) loops.push(loop);
	}
	return loops;
}

/* -------------------------------------------------------------- polygons */

/** Signed area in the XY plane; positive for counter-clockwise loops. */
export function signedArea(/** @type {Point2[]} */ loop) {
	let sum = 0;
	for (let index = 0; index < loop.length; index += 1) {
		const a = loop[index];
		const b = loop[(index + 1) % loop.length];
		sum += a.x * b.y - b.x * a.y;
	}
	return sum / 2;
}

/** Even-odd point-in-polygon test. */
export function contains(/** @type {Point2[]} */ loop, /** @type {Point2} */ point) {
	let inside = false;
	for (let index = 0, prev = loop.length - 1; index < loop.length; prev = index, index += 1) {
		const a = loop[index];
		const b = loop[prev];
		if (a.y > point.y !== b.y > point.y) {
			const x = a.x + ((point.y - a.y) / (b.y - a.y)) * (b.x - a.x);
			if (point.x < x) inside = !inside;
		}
	}
	return inside;
}

/**
 * Resample a closed loop at even arc-length steps, then smooth it lightly
 * (Taubin smoothing, which does not shrink the loop). Slices of a faceted
 * mesh, especially along curved surfaces, carry small zig-zags that would
 * otherwise fold over when the loop is offset.
 * @param {Point2[]} loop
 * @param {number} step
 * @param {number} [passes]
 * @returns {Point2[]}
 */
export function tidyLoop(loop, step, passes = 2) {
	const count = loop.length;
	if (count < 3) return loop;
	let perimeter = 0;
	for (let index = 0; index < count; index += 1) {
		const a = loop[index];
		const b = loop[(index + 1) % count];
		perimeter += Math.hypot(b.x - a.x, b.y - a.y);
	}
	const samples = Math.max(8, Math.round(perimeter / step));
	const spacing = perimeter / samples;
	/** @type {Point2[]} */
	let points = [];
	let index = 0;
	let walked = 0;
	for (let sample = 0; sample < samples; sample += 1) {
		const target = sample * spacing;
		let a = loop[index % count];
		let b = loop[(index + 1) % count];
		let length = Math.hypot(b.x - a.x, b.y - a.y);
		while (walked + length < target && index < count) {
			walked += length;
			index += 1;
			a = loop[index % count];
			b = loop[(index + 1) % count];
			length = Math.hypot(b.x - a.x, b.y - a.y);
		}
		const t = length ? (target - walked) / length : 0;
		points.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
	}
	for (let pass = 0; pass < passes * 2; pass += 1) {
		const factor = pass % 2 ? -0.53 : 0.5;
		points = points.map((p, i) => {
			const prev = points[(i - 1 + samples) % samples];
			const next = points[(i + 1) % samples];
			return {
				x: p.x + factor * ((prev.x + next.x) / 2 - p.x),
				y: p.y + factor * ((prev.y + next.y) / 2 - p.y)
			};
		});
	}
	return points;
}

/**
 * Orient loops for offsetting: outer boundaries counter-clockwise, holes
 * (loops inside an odd number of others) clockwise, so the material is always
 * on the left of the direction of travel.
 * @template {Point2} P
 * @param {P[][]} loops
 * @returns {P[][]}
 */
export function orientLoops(loops) {
	return loops.map((loop) => {
		const depth = loops.filter((other) => other !== loop && contains(other, loop[0])).length;
		const ccw = signedArea(loop) > 0;
		const wantCcw = depth % 2 === 0;
		return ccw === wantCcw ? loop : [...loop].reverse();
	});
}

/**
 * Offset a loop to its left (inward for an oriented boundary) by `distance`,
 * moving each vertex along its mitred bisector.
 * @param {Point2[]} loop
 * @param {number} distance
 * @returns {Point2[]}
 */
export function offsetLoop(loop, distance) {
	const count = loop.length;
	return loop.map((point, index) => {
		const prev = loop[(index - 1 + count) % count];
		const next = loop[(index + 1) % count];
		const n1 = leftNormal(prev, point);
		const n2 = leftNormal(point, next);
		let mx = n1.x + n2.x;
		let my = n1.y + n2.y;
		const length = Math.hypot(mx, my) || 1;
		mx /= length;
		my /= length;
		const scale = distance / Math.max(0.35, mx * n1.x + my * n1.y);
		return { x: point.x + mx * scale, y: point.y + my * scale };
	});
}

/** @param {Point2} a @param {Point2} b */
function leftNormal(a, b) {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const length = Math.hypot(dx, dy) || 1;
	return { x: -dy / length, y: dx / length };
}

/** @param {Point2} a @param {Point2} b @param {Point2} c */
function orient(a, b, c) {
	return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

/** True when an offset edge points against its source edge (a folded corner). */
function flipsEdges(/** @type {Point2[]} */ loop, /** @type {Point2[]} */ inset) {
	const count = loop.length;
	for (let index = 0; index < count; index += 1) {
		const a = loop[index];
		const b = loop[(index + 1) % count];
		const c = inset[index];
		const d = inset[(index + 1) % count];
		if ((b.x - a.x) * (d.x - c.x) + (b.y - a.y) * (d.y - c.y) <= 0) return true;
	}
	return false;
}

/** True when two non-adjacent edges of the loop cross. */
export function selfIntersects(/** @type {Point2[]} */ loop) {
	const count = loop.length;
	for (let i = 0; i < count; i += 1) {
		const a = loop[i];
		const b = loop[(i + 1) % count];
		const minX = Math.min(a.x, b.x);
		const maxX = Math.max(a.x, b.x);
		const minY = Math.min(a.y, b.y);
		const maxY = Math.max(a.y, b.y);
		for (let j = i + 2; j < count; j += 1) {
			if (i === 0 && j === count - 1) continue;
			const c = loop[j];
			const d = loop[(j + 1) % count];
			if (Math.max(c.x, d.x) < minX || Math.min(c.x, d.x) > maxX) continue;
			if (Math.max(c.y, d.y) < minY || Math.min(c.y, d.y) > maxY) continue;
			if (orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Inset a set of oriented loops. Returns null once the region is too thin for
 * the offset: a loop flips, collapses, or starts crossing itself.
 * @param {Point2[][]} loops
 * @param {number} distance
 * @returns {Point2[][] | null}
 */
export function insetLoops(loops, distance) {
	/** @type {Point2[][]} */
	const result = [];
	for (const loop of loops) {
		const area = signedArea(loop);
		const inset = offsetLoop(loop, distance);
		const insetArea = signedArea(inset);
		const isHole = area < 0;
		// An outer loop must shrink and keep its orientation; holes grow.
		if (!isHole && (insetArea <= 0 || insetArea >= area)) return null;
		if (!isHole && insetArea < 0.04 * area) return null;
		if (isHole && insetArea >= 0) return null;
		if (flipsEdges(loop, inset) || selfIntersects(inset)) return null;
		result.push(inset);
	}
	return result;
}

/* ---------------------------------------------------------------- infill */

/**
 * Serpentine (zig-zag) infill of the region bounded by oriented loops, with
 * parallel passes `spacing` apart at `angle` radians. Passes on neighbouring
 * scanlines are joined into one continuous path while they overlap one to
 * one; where the region splits or merges, a new path starts, and the caller
 * links paths with travel moves.
 * @param {Point2[][]} loops
 * @param {number} spacing
 * @param {number} angle
 * @returns {Point2[][]}
 */
export function serpentineInfill(loops, spacing, angle) {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	// u runs along the passes, v across them.
	const rotated = loops.map((loop) =>
		loop.map((p) => ({ u: p.x * cos + p.y * sin, v: -p.x * sin + p.y * cos }))
	);
	let minV = Infinity;
	let maxV = -Infinity;
	for (const loop of rotated) {
		for (const p of loop) {
			minV = Math.min(minV, p.v);
			maxV = Math.max(maxV, p.v);
		}
	}
	if (!Number.isFinite(minV)) return [];
	const toXY = (/** @type {number} */ u, /** @type {number} */ v) => ({
		x: u * cos - v * sin,
		y: u * sin + v * cos
	});

	/**
	 * @typedef {object} Chain
	 * @property {Point2[]} points
	 * @property {number} from
	 * @property {number} to
	 * @property {number} row
	 * @property {boolean} forward
	 */
	/** @type {Chain[]} */
	const chains = [];
	/** @type {Chain[]} */
	let open = [];
	const first = Math.ceil(minV / spacing - 0.5);
	for (let row = first; (row + 0.5) * spacing < maxV; row += 1) {
		const v = (row + 0.5) * spacing;
		/** @type {number[]} */
		const hits = [];
		for (const loop of rotated) {
			for (let index = 0; index < loop.length; index += 1) {
				const a = loop[index];
				const b = loop[(index + 1) % loop.length];
				if (a.v < v !== b.v < v) hits.push(a.u + ((v - a.v) / (b.v - a.v)) * (b.u - a.u));
			}
		}
		hits.sort((a, b) => a - b);
		/** @type {[number, number][]} */
		const intervals = [];
		for (let index = 0; index + 1 < hits.length; index += 2) {
			if (hits[index + 1] - hits[index] > spacing * 0.25) {
				intervals.push([hits[index], hits[index + 1]]);
			}
		}
		const previous = open.filter((chain) => chain.row === row - 1);
		const links = intervals.map(([from, to]) =>
			previous.filter((chain) => Math.max(chain.from, from) < Math.min(chain.to, to))
		);
		/** @type {Map<Chain, number>} */
		const uses = new Map();
		for (const list of links) for (const chain of list) uses.set(chain, (uses.get(chain) ?? 0) + 1);

		/** @type {Chain[]} */
		const nextOpen = [];
		intervals.forEach(([from, to], index) => {
			const candidates = links[index];
			let chain = candidates.length === 1 && uses.get(candidates[0]) === 1 ? candidates[0] : null;
			if (chain) {
				// Join only when the connecting move hugs the boundary.
				const start = chain.forward ? from : to;
				const last = chain.points[chain.points.length - 1];
				const lastU = last.x * cos + last.y * sin;
				if (Math.abs(start - lastU) > spacing * 3) chain = null;
			}
			if (!chain) {
				chain = { points: [], from, to, row, forward: true };
				chains.push(chain);
			}
			const [start, end] = chain.forward ? [from, to] : [to, from];
			chain.points.push(toXY(start, v), toXY(end, v));
			chain.forward = !chain.forward;
			chain.from = from;
			chain.to = to;
			chain.row = row;
			nextOpen.push(chain);
		});
		open = nextOpen;
	}
	return chains.map((chain) => chain.points);
}

/* ---------------------------------------------------------------- layers */

/** Rotate a closed loop so it starts at the vertex furthest along `direction`. */
function startAt(/** @type {Point2[]} */ loop, /** @type {Point2} */ direction) {
	let best = 0;
	let bestDot = -Infinity;
	loop.forEach((p, index) => {
		const dot = p.x * direction.x + p.y * direction.y;
		if (dot > bestDot) {
			bestDot = dot;
			best = index;
		}
	});
	return [...loop.slice(best), ...loop.slice(0, best)];
}

/** Squared distance between two points. */
function dist2(/** @type {Point2} */ a, /** @type {Point2} */ b) {
	return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/**
 * Plan one layer: perimeters from the outside in, then infill paths in
 * nearest-neighbour order, with a travel move wherever the nozzle has to jump.
 * @param {Point2[][]} boundary Oriented boundary loops of the layer.
 * @param {{ lineWidth: number, perimeters: number, infillSpacing: number, infillAngle: number, seamAngle: number }} options
 * @returns {Toolpath2D}
 */
export function planLayer(boundary, options) {
	const { lineWidth, perimeters, infillSpacing, infillAngle, seamAngle } = options;
	const seamDirection = { x: Math.cos(seamAngle), y: Math.sin(seamAngle) };
	/** @type {Point2[][][]} */
	const shells = [];
	for (let index = 0; index < perimeters; index += 1) {
		const shell = insetLoops(boundary, (index + 0.5) * lineWidth);
		if (!shell) break;
		shells.push(shell.map((loop) => startAt(loop, seamDirection)));
	}
	const core = shells.length ? insetLoops(boundary, shells.length * lineWidth) : null;
	const chains = core ? serpentineInfill(core, infillSpacing, infillAngle) : [];

	const outer = shells[0] ?? [];
	const inner = shells.slice(1).flat();
	/** @type {[Point2, Point2][]} */
	const travel = [];
	/** @type {Point2 | null} */
	let at = null;
	const moveTo = (/** @type {Point2} */ point) => {
		if (at && dist2(at, point) > 1e-6) travel.push([at, point]);
	};
	for (const loop of [...outer, ...inner]) {
		moveTo(loop[0]);
		at = loop[0];
	}
	/** @type {Point2[][]} */
	const infill = [];
	const pending = [...chains];
	while (pending.length) {
		let best = 0;
		let reverse = false;
		let bestDistance = Infinity;
		pending.forEach((chain, index) => {
			const here = at ?? chain[0];
			const head = dist2(here, chain[0]);
			const tail = dist2(here, chain[chain.length - 1]);
			if (head < bestDistance) [bestDistance, best, reverse] = [head, index, false];
			if (tail < bestDistance) [bestDistance, best, reverse] = [tail, index, true];
		});
		const [chain] = pending.splice(best, 1);
		const path = reverse ? [...chain].reverse() : chain;
		moveTo(path[0]);
		infill.push(path);
		at = path[path.length - 1];
	}
	return { outer, inner, infill, travel, seam: outer[0]?.[0] ?? null };
}

/**
 * Normalised radius of an XY point relative to the top section (1 on the
 * rim of the dome, 0 at its centre), used to shape non-planar layers.
 * @param {number} x
 * @param {number} y
 */
function domeRadius(x, y) {
	const rim = PART.radius * wallScale(1) * star(Math.atan2(y, x) - twistAt(PART.height));
	return Math.hypot(x, y) / rim;
}

/**
 * Height of layer `level`'s surface above the XY point. Planar layers are
 * flat. Non-planar layers are a simplified illustration: inside the dome's
 * footprint each one bends toward the domed top, by more the higher it is, so
 * the last layers follow the dome instead of stepping up it; outside the
 * footprint they stay flat. Real multi-axis toolpaths also tilt the
 * tool and plan the layer field from the part's geometry.
 * @param {SliceMode} mode
 * @param {number} level
 * @param {number} x
 * @param {number} y
 */
export function layerSurface(mode, level, x, y) {
	if (mode === 'planar') return level;
	const u = Math.min(1, domeRadius(x, y));
	const weight = Math.min(1, Math.max(0, level / PART.height));
	return level + weight * PART.dome * (1 - u * u);
}

/**
 * Slicing parameters of every layer: plane heights for planar slicing (the
 * dome is cut into shrinking rings), surface rim heights for non-planar
 * slicing (the dome is covered by the bent top layers).
 * @param {SliceMode} mode
 * @returns {number[]}
 */
export function layerLevels(mode) {
	const { layerHeight } = SETTINGS;
	const top = mode === 'planar' ? PART.height + PART.dome : PART.height;
	/** @type {number[]} */
	const levels = [];
	for (let index = 0; (index + 0.5) * layerHeight < top; index += 1) {
		levels.push((index + 0.5) * layerHeight);
	}
	return levels;
}

/** Infill direction alternates by 90° every layer, as most slicers do. */
export function infillAngle(/** @type {number} */ index) {
	return index % 2 ? (Math.PI * 3) / 4 : Math.PI / 4;
}

/**
 * Lift a 2D toolpath onto its layer surface.
 * @param {Toolpath2D} path
 * @param {(p: Point2) => number} height
 * @param {number} level
 * @returns {Layer}
 */
export function liftToolpath(path, height, level) {
	const lift = (/** @type {Point2} */ p) => ({ x: p.x, y: p.y, z: height(p) });
	return {
		level,
		outer: path.outer.map((loop) => loop.map(lift)),
		inner: path.inner.map((loop) => loop.map(lift)),
		infill: path.infill.map((line) => line.map(lift)),
		travel: path.travel.map(([a, b]) => /** @type {[Point3, Point3]} */ ([lift(a), lift(b)])),
		seam: path.seam ? lift(path.seam) : null
	};
}

/**
 * Slice the mesh in the given mode and plan every layer.
 * @param {Mesh} mesh
 * @param {SliceMode} mode
 * @returns {Layer[]}
 */
export function sliceLayers(mesh, mode) {
	const { positions } = mesh;
	const count = positions.length / 3;
	const values = new Float64Array(count);
	return layerLevels(mode).map((level, index) => {
		for (let vertex = 0; vertex < count; vertex += 1) {
			const x = positions[vertex * 3];
			const y = positions[vertex * 3 + 1];
			values[vertex] = positions[vertex * 3 + 2] - layerSurface(mode, level, x, y);
		}
		const loops = orientLoops(sliceMesh(mesh, values).map((loop) => tidyLoop(loop, 1)));
		const path = planLayer(loops, layerOptions(index, level));
		return liftToolpath(path, (p) => layerSurface(mode, level, p.x, p.y), level);
	});
}

/** Per-layer planning options. */
export function layerOptions(/** @type {number} */ index, /** @type {number} */ level) {
	return {
		lineWidth: SETTINGS.lineWidth,
		perimeters: SETTINGS.perimeters,
		infillSpacing: SETTINGS.infillSpacing,
		infillAngle: infillAngle(index),
		// The seam follows a star point as the section twists.
		seamAngle: twistAt(level)
	};
}

/**
 * Planar layer from the exact section, without building or slicing the mesh;
 * cheap enough for the server-rendered fallback and its layer slider.
 * @param {number} index
 */
export function planarLayerFromSection(index) {
	const level = layerLevels('planar')[index];
	const loops = orientLoops([sectionAt(level, 96)]);
	return planLayer(loops, layerOptions(index, level));
}
