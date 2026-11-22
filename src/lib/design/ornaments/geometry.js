/**
 * Armenian ornaments drawn as if they were machine toolpaths.
 *
 * Every motif is built from first principles (spirals, offset bands, sine
 * strands, star polygons) and returned the way a slicer preview would show a
 * layer: closed perimeter loops in print order, serpentine infill inside the
 * innermost perimeter, straight "travel" moves between islands, and the seam
 * (start point) of every island. Output is SVG path data in a fixed user
 * space, rounded to 0.1 and written with relative coordinates to stay small.
 *
 * Pure and deterministic: no randomness, no DOM, safe for SSR and tests.
 */

/** @typedef {{ x: number, y: number }} Point */

/**
 * @typedef {object} Toolpath
 * @property {string} viewBox
 * @property {number} width
 * @property {number} height
 * @property {string[]} perimeters One path per island, in print order; an island may hold several closed loops.
 * @property {string[]} outlines The first (outermost) loop of each island, for the nozzle to follow.
 * @property {number[]} lengths Length of each outline, so islands can be timed at a constant feed rate.
 * @property {string[]} infill Serpentine fill moves.
 * @property {string[]} travel Non-printing moves between islands.
 * @property {Point[]} seams Start point of each island.
 */

const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ paths */

/** @param {number} tenths a coordinate in tenths of a unit */
function formatTenths(tenths) {
	if (tenths === 0) return '0';
	const abs = Math.abs(tenths);
	const whole = Math.floor(abs / 10);
	const frac = abs % 10;
	const body = frac ? `${whole || ''}.${frac}` : `${whole}`;
	return tenths < 0 ? `-${body}` : body;
}

/**
 * Compact SVG path for a polyline: absolute move, then relative line-tos with
 * the minimum separators the path grammar allows. Deltas are taken between
 * already-rounded points, so rounding never drifts along the path.
 * @param {Point[]} points
 * @param {boolean} [closed]
 */
export function toPath(points, closed = false) {
	if (points.length < 2) return '';
	let px = Math.round(points[0].x * 10);
	let py = Math.round(points[0].y * 10);
	/** @type {number[]} */
	const deltas = [];
	for (let index = 1; index < points.length; index += 1) {
		const x = Math.round(points[index].x * 10);
		const y = Math.round(points[index].y * 10);
		if (x === px && y === py) continue;
		deltas.push(x - px, y - py);
		px = x;
		py = y;
	}
	if (!deltas.length) return '';
	let out = '';
	let lastHadDot = false;
	/** @param {number[]} values */
	const write = (values) => {
		values.forEach((value, index) => {
			const text = formatTenths(value);
			const glued = index === 0 || text.startsWith('-') || (text.startsWith('.') && lastHadDot);
			out += (glued ? '' : ' ') + text;
			lastHadDot = text.includes('.');
		});
	};
	out += 'M';
	write([Math.round(points[0].x * 10), Math.round(points[0].y * 10)]);
	out += 'l';
	write(deltas);
	return closed ? `${out}z` : out;
}

/**
 * Parse path data written by `toPath` (M, l, z; also L and m) into absolute
 * point lists, one per subpath. Used by tests and by length measurement.
 * @param {string} d
 * @returns {{ points: Point[], closed: boolean }[]}
 */
export function parsePath(d) {
	const tokens = d.match(/[MmLlZz]|-?(?:\d+\.?\d*|\.\d+)/g) ?? [];
	/** @type {{ points: Point[], closed: boolean }[]} */
	const subpaths = [];
	let command = '';
	let x = 0;
	let y = 0;
	for (let index = 0; index < tokens.length;) {
		const token = tokens[index];
		if (/[A-Za-z]/.test(token)) {
			command = token;
			index += 1;
			if (command === 'z' || command === 'Z') {
				const current = subpaths.at(-1);
				if (current) {
					current.closed = true;
					x = current.points[0].x;
					y = current.points[0].y;
				}
			}
			continue;
		}
		const a = Number(tokens[index]);
		const b = Number(tokens[index + 1]);
		index += 2;
		if (command === 'M' || command === 'm') {
			x = command === 'M' ? a : x + a;
			y = command === 'M' ? b : y + b;
			subpaths.push({ points: [{ x, y }], closed: false });
			command = command === 'M' ? 'L' : 'l';
		} else {
			x = command === 'L' ? a : x + a;
			y = command === 'L' ? b : y + b;
			subpaths.at(-1)?.points.push({ x, y });
		}
	}
	return subpaths;
}

/* --------------------------------------------------------------- geometry */

/** @param {Point} a @param {Point} b */
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** @param {Point[]} points @param {boolean} [closed] */
export function polylineLength(points, closed = false) {
	let total = 0;
	for (let index = 1; index < points.length; index += 1) {
		total += distance(points[index - 1], points[index]);
	}
	if (closed && points.length > 2) total += distance(points.at(-1) ?? points[0], points[0]);
	return total;
}

/**
 * Ramer–Douglas–Peucker, iterative. Keeps the endpoints.
 * @param {Point[]} points
 * @param {number} tolerance
 */
export function simplify(points, tolerance) {
	if (points.length < 3) return points.slice();
	const keep = new Uint8Array(points.length);
	keep[0] = 1;
	keep[points.length - 1] = 1;
	const stack = [[0, points.length - 1]];
	while (stack.length) {
		const [start, end] = /** @type {number[]} */ (stack.pop());
		const a = points[start];
		const b = points[end];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const span = Math.hypot(dx, dy) || 1;
		let worst = -1;
		let worstDistance = tolerance;
		for (let index = start + 1; index < end; index += 1) {
			const p = points[index];
			const offset = Math.abs(dy * (p.x - a.x) - dx * (p.y - a.y)) / span;
			if (offset > worstDistance) {
				worst = index;
				worstDistance = offset;
			}
		}
		if (worst !== -1) {
			keep[worst] = 1;
			stack.push([start, worst], [worst, end]);
		}
	}
	return points.filter((_, index) => keep[index]);
}

/**
 * Simplify a closed loop: split it at the point farthest from its start so
 * RDP never sees a degenerate (zero-length) chord.
 * @param {Point[]} loop without the repeated closing point
 * @param {number} tolerance
 */
function simplifyLoop(loop, tolerance) {
	if (loop.length < 4) return loop.slice();
	let far = 1;
	for (let index = 1; index < loop.length; index += 1) {
		if (distance(loop[0], loop[index]) > distance(loop[0], loop[far])) far = index;
	}
	const head = simplify(loop.slice(0, far + 1), tolerance);
	const tail = simplify([...loop.slice(far), loop[0]], tolerance);
	return [...head, ...tail.slice(1, -1)];
}

/** @param {Point[]} polygon */
function signedArea(polygon) {
	let area = 0;
	for (let index = 0; index < polygon.length; index += 1) {
		const a = polygon[index];
		const b = polygon[(index + 1) % polygon.length];
		area += a.x * b.y - b.x * a.y;
	}
	return area / 2;
}

/**
 * Inset a simple polygon by `amount` with mitred corners. Good for the small
 * insets used here (well under half the shortest edge), not a general offset.
 * @param {Point[]} polygon
 * @param {number} amount positive shrinks the polygon
 */
export function insetPolygon(polygon, amount) {
	const n = polygon.length;
	const inward = signedArea(polygon) > 0 ? 1 : -1;
	const lines = polygon.map((a, index) => {
		const b = polygon[(index + 1) % n];
		const length = distance(a, b) || 1;
		const nx = (-(b.y - a.y) / length) * inward;
		const ny = ((b.x - a.x) / length) * inward;
		return {
			a: { x: a.x + nx * amount, y: a.y + ny * amount },
			b: { x: b.x + nx * amount, y: b.y + ny * amount }
		};
	});
	return lines.map((line, index) => {
		const previous = lines[(index - 1 + n) % n];
		const d1x = previous.b.x - previous.a.x;
		const d1y = previous.b.y - previous.a.y;
		const d2x = line.b.x - line.a.x;
		const d2y = line.b.y - line.a.y;
		const cross = d1x * d2y - d1y * d2x;
		if (Math.abs(cross) < 1e-9) return line.a;
		const t = ((line.a.x - previous.a.x) * d2y - (line.a.y - previous.a.y) * d2x) / cross;
		return { x: previous.a.x + d1x * t, y: previous.a.y + d1y * t };
	});
}

/**
 * Even-odd point-in-region test; pass the outline and any holes together.
 * @param {Point[][]} polygons
 * @param {Point} point
 */
export function insideRegion(polygons, point) {
	let inside = false;
	for (const polygon of polygons) {
		for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
			const a = polygon[index];
			const b = polygon[previous];
			if (a.y > point.y !== b.y > point.y) {
				const x = a.x + ((point.y - a.y) * (b.x - a.x)) / (b.y - a.y);
				if (point.x < x) inside = !inside;
			}
		}
	}
	return inside;
}

/**
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 * @param {number} segments
 * @param {number} [start] angle of the first point, radians
 */
function circle(cx, cy, radius, segments, start = -Math.PI / 2) {
	return Array.from({ length: segments }, (_, index) => {
		const angle = start + (TAU * index) / segments;
		return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
	});
}

/**
 * Serpentine (boustrophedon) infill of an even-odd region: parallel scan lines
 * at `angle`, clipped against every edge, then chained line to line while the
 * short connector stays inside the region. A topology change (a hole, a star
 * point) starts a new chain, exactly where a slicer would insert a travel move.
 * @param {Point[][]} polygons outline plus holes
 * @param {number} spacing line pitch
 * @param {number} angleDegrees hatch direction
 * @param {Point} pivot
 * @returns {Point[][]} chains in print order
 */
export function serpentineFill(polygons, spacing, angleDegrees, pivot) {
	const angle = (angleDegrees * Math.PI) / 180;
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	/** @param {Point} p */
	const toScan = (p) => ({
		x: pivot.x + (p.x - pivot.x) * cos + (p.y - pivot.y) * sin,
		y: pivot.y - (p.x - pivot.x) * sin + (p.y - pivot.y) * cos
	});
	/** @param {Point} p */
	const fromScan = (p) => ({
		x: pivot.x + (p.x - pivot.x) * cos - (p.y - pivot.y) * sin,
		y: pivot.y + (p.x - pivot.x) * sin + (p.y - pivot.y) * cos
	});
	const region = polygons.map((polygon) => polygon.map(toScan));
	const ys = region.flat().map((p) => p.y);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);

	/** @typedef {{ points: Point[], dir: number, end: Point }} Chain */
	/** @type {Chain[]} */
	const chains = [];
	/** @type {Chain[]} */
	let open = [];
	for (let y = minY + spacing / 2; y < maxY; y += spacing) {
		/** @type {number[]} */
		const xs = [];
		for (const polygon of region) {
			for (let index = 0; index < polygon.length; index += 1) {
				const a = polygon[index];
				const b = polygon[(index + 1) % polygon.length];
				if (a.y <= y !== b.y <= y) xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
			}
		}
		xs.sort((a, b) => a - b);
		/** @type {Chain[]} */
		const next = [];
		for (let index = 0; index + 1 < xs.length; index += 2) {
			const x0 = xs[index];
			const x1 = xs[index + 1];
			if (x1 - x0 < spacing * 0.4) continue;
			/** @type {Chain | null} */
			let best = null;
			let bestDistance = spacing * 3;
			for (const chain of open) {
				if (next.includes(chain)) continue;
				const entry = { x: chain.dir > 0 ? x1 : x0, y };
				const gap = distance(entry, chain.end);
				// Probe just inside the boundary: the connector runs along it.
				const middle = {
					x: (entry.x + chain.end.x) / 2 + (chain.dir > 0 ? -1 : 1) * spacing * 0.25,
					y: (entry.y + chain.end.y) / 2
				};
				if (gap < bestDistance && insideRegion(region, middle)) {
					best = chain;
					bestDistance = gap;
				}
			}
			if (best) {
				best.dir = -best.dir;
				const start = { x: best.dir > 0 ? x0 : x1, y };
				const end = { x: best.dir > 0 ? x1 : x0, y };
				best.points.push(start, end);
				best.end = end;
				next.push(best);
			} else {
				const chain = {
					points: [
						{ x: x0, y },
						{ x: x1, y }
					],
					dir: 1,
					end: { x: x1, y }
				};
				chains.push(chain);
				next.push(chain);
			}
		}
		open = next;
	}
	return chains.map((chain) => chain.points.map(fromScan));
}

/* ----------------------------------------------------------- the motifs */

/**
 * @typedef {object} Island
 * @property {Point[][]} loops closed perimeter loops, outermost first
 * @property {Point[][]} [open] open perimeter strokes (ribbon edges, frame lines)
 * @property {Point[][]} [fill] open infill chains (serpentine, spiral, centre groove)
 * @property {Point[][]} [fillLoops] closed infill loops (concentric fill)
 * @property {boolean} [reversible] a single open stroke the slicer may print from either end
 */

/**
 * 'Nearest' seam placement: start a closed loop at its vertex closest to where
 * the nozzle already is, so the travel move into it is as short as possible.
 * @param {Point[]} loop
 * @param {Point} target
 */
function seamNearest(loop, target) {
	let best = 0;
	let bestDistance = Infinity;
	loop.forEach((p, index) => {
		const gap = distance(p, target);
		if (gap < bestDistance) {
			best = index;
			bestDistance = gap;
		}
	});
	return best ? [...loop.slice(best), ...loop.slice(0, best)] : loop;
}

/**
 * Turn islands into the public toolpath shape: perimeters per island, the
 * outline the nozzle follows, travel moves from each island's last point to
 * the next island's seam. Closed loops start at the vertex nearest the nozzle.
 * @param {Island[]} islands
 * @param {number} width
 * @param {number} height
 * @param {number} tolerance simplification tolerance in user units
 * @returns {Toolpath}
 */
function assemble(islands, width, height, tolerance) {
	/** @type {Toolpath} */
	const result = {
		viewBox: `0 0 ${width} ${height}`,
		width,
		height,
		perimeters: [],
		outlines: [],
		lengths: [],
		infill: [],
		travel: [],
		seams: []
	};
	/** @type {Point | null} */
	let cursor = null;
	for (const island of islands) {
		/** @type {Point | null} */
		let anchor = cursor;
		/** @param {Point[]} loop */
		const place = (loop) => {
			const placed = anchor ? seamNearest(loop, anchor) : loop;
			anchor = placed[0];
			return placed;
		};
		const loops = island.loops.map((loop) => place(simplifyLoop(loop, tolerance)));
		let strokes = (island.open ?? []).map((stroke) => simplify(stroke, tolerance));
		if (island.reversible && cursor && strokes.length === 1) {
			const [stroke] = strokes;
			if (distance(cursor, stroke.at(-1) ?? stroke[0]) < distance(cursor, stroke[0])) {
				strokes = [stroke.slice().reverse()];
			}
		}
		const fill = (island.fill ?? [])
			.map((chain) => simplify(chain, tolerance))
			.filter((chain) => chain.length > 1);
		if (fill.length) anchor = fill.at(-1)?.at(-1) ?? anchor;
		else if (strokes.length) anchor = strokes.at(-1)?.at(-1) ?? anchor;
		const fillLoops = (island.fillLoops ?? []).map((loop) => place(simplifyLoop(loop, tolerance)));
		const first = loops[0] ?? strokes[0];
		if (!first || first.length < 2) continue;

		const d = [
			...loops.map((loop) => toPath(loop, true)),
			...strokes.map((stroke) => toPath(stroke))
		].join('');
		result.perimeters.push(d);
		const closed = Boolean(loops[0]);
		result.outlines.push(toPath(first, closed));
		result.lengths.push(Math.round(polylineLength(first, closed)));
		result.seams.push({ x: round1(first[0].x), y: round1(first[0].y) });
		if (cursor) result.travel.push(toPath([cursor, first[0]]));
		const fillPath = [
			...fill.map((chain) => toPath(chain)),
			...fillLoops.map((loop) => toPath(loop, true))
		].join('');
		if (fillPath) result.infill.push(fillPath);

		cursor =
			fillLoops.at(-1)?.[0] ??
			fill.at(-1)?.at(-1) ??
			strokes.at(-1)?.at(-1) ??
			loops.at(-1)?.[0] ??
			null;
	}
	return result;
}

/** @param {number} value */
export function round1(value) {
	return Math.round(value * 10) / 10;
}

/**
 * Bisection for the parameter where a continuous function crosses zero.
 * @param {(t: number) => number} f
 * @param {number} lo
 * @param {number} hi
 */
function root(f, lo, hi) {
	let a = lo;
	let b = hi;
	const signA = Math.sign(f(a));
	for (let step = 0; step < 40; step += 1) {
		const mid = (a + b) / 2;
		if (Math.sign(f(mid)) === signA) a = mid;
		else b = mid;
	}
	return (a + b) / 2;
}

/**
 * Construction of the classic Arevakhach: `arms` circles of radius r = radius/2
 * whose centres lie evenly on a circle of the same radius r round the centre,
 * so every circle passes through the centre and reaches out to `radius`. The
 * first centre lies straight up from the sign's centre.
 * @param {{ cx: number, cy: number, radius: number, arms: number, turn?: number }} options
 *   `turn` 1 or -1 picks which way the arms sweep (a mirror image)
 */
export function eternityCircles({ cx, cy, radius, arms, turn = 1 }) {
	const r = radius / 2;
	const step = TAU / arms;
	const centres = Array.from({ length: arms }, (_, index) => {
		const angle = -Math.PI / 2 + step * index;
		return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
	});
	return { cx, cy, r, arms, turn: turn < 0 ? -1 : 1, centres };
}

/**
 * Points on a circle from angle `from`, sweeping `sweep` radians (signed),
 * about every `step` units of arc, both ends included.
 * @param {Point} centre
 * @param {number} radius
 * @param {number} from
 * @param {number} sweep
 * @param {number} step
 */
function arcPoints(centre, radius, from, sweep, step) {
	const count = Math.max(4, Math.ceil((Math.abs(sweep) * radius) / step));
	return Array.from({ length: count + 1 }, (_, index) => {
		const angle = from + (sweep * index) / count;
		return { x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) };
	});
}

/**
 * Arm `index` of the Arevakhach, inset by `inset`: the crescent inside circle
 * `index` and outside the circle before it in the sweep direction. Arms tile
 * the sign exactly (every point of it lies in exactly one crescent), and its
 * boundary is two circular arcs that meet at the centre and on the rim: the
 * long arc of its own circle (along the neighbour, then out round the rim
 * scallop) and the short arc of the neighbour's circle. Insetting a disc minus
 * a disc is exact with circles: the own circle shrinks by `inset`, the
 * neighbour's grows by it, and the two are re-intersected for the cusps.
 * @param {ReturnType<typeof eternityCircles>} construction
 * @param {number} index
 * @param {number} inset
 * @param {number} [step] sampling interval along the arcs
 * @returns {Point[] | null} closed loop (no repeated point) starting at the
 *   cusp nearest the centre, or null when the inset arm has vanished
 */
export function eternityArm({ cx, cy, r, arms, turn, centres }, index, inset, step = 3) {
	const own = centres[((index % arms) + arms) % arms];
	const other = centres[(((index - turn) % arms) + arms) % arms];
	const ra = r - inset;
	const rb = r + inset;
	const dx = other.x - own.x;
	const dy = other.y - own.y;
	const gap = Math.hypot(dx, dy);
	const along = (ra * ra - rb * rb + gap * gap) / (2 * gap);
	const across = ra * ra - along * along;
	if (ra <= 0 || across <= 1) return null;
	const h = Math.sqrt(across);
	const ux = dx / gap;
	const uy = dy / gap;
	const base = { x: own.x + ux * along, y: own.y + uy * along };
	const cusps = [
		{ x: base.x - uy * h, y: base.y + ux * h },
		{ x: base.x + uy * h, y: base.y - ux * h }
	];
	const centreDistance = (/** @type {Point} */ p) => Math.hypot(p.x - cx, p.y - cy);
	if (centreDistance(cusps[1]) < centreDistance(cusps[0])) cusps.reverse();
	const [hub, rim] = cusps;
	const angleOf = (/** @type {Point} */ c, /** @type {Point} */ p) =>
		Math.atan2(p.y - c.y, p.x - c.x);
	/**
	 * Signed sweep from `p` to `q` round circle `c`, picking the arc whose
	 * midpoint passes `keep`.
	 * @param {Point} c @param {number} radius @param {Point} p @param {Point} q
	 * @param {(m: Point) => boolean} keep
	 */
	const sweepOf = (c, radius, p, q, keep) => {
		const from = angleOf(c, p);
		const ccw = (((angleOf(c, q) - from) % TAU) + TAU) % TAU;
		const middle = from + ccw / 2;
		const m = { x: c.x + radius * Math.cos(middle), y: c.y + radius * Math.sin(middle) };
		return { from, sweep: keep(m) ? ccw : ccw - TAU };
	};
	// The own circle's arc that stays outside the neighbour …
	const outer = sweepOf(own, ra, hub, rim, (m) => Math.hypot(m.x - other.x, m.y - other.y) > rb);
	// … and the neighbour's arc that runs inside the own circle, back to the centre.
	const inner = sweepOf(other, rb, rim, hub, (m) => Math.hypot(m.x - own.x, m.y - own.y) < ra);
	return [
		...arcPoints(own, ra, outer.from, outer.sweep, step),
		...arcPoints(other, rb, inner.from, inner.sweep, step).slice(1, -1)
	];
}

/**
 * Islands for an Arevakhach: one crescent arm per construction circle (see
 * `eternityArm`), each printed as its own island. Neighbouring arms share a
 * boundary arc, so every perimeter is inset far enough (half a bead plus half
 * the `gap`) that a clear channel opens between neighbours, the way a slicer
 * keeps touching islands apart. Inner perimeters are the same crescent inset
 * further; the infill is a serpentine raster across the arm (perpendicular to
 * its horn-to-horn chord, so it turns with the arm), printed from the rim
 * horn back to the centre so the next arm starts a short hop away.
 * @param {{
 *   cx: number, cy: number, radius: number, arms: number, turn: number,
 *   offsets: number, spacing: number, gap: number,
 *   infill: boolean, infillSpacing: number
 * }} options
 * @returns {Island[]}
 */
function eternityIslands({
	cx,
	cy,
	radius,
	arms,
	turn,
	offsets,
	spacing,
	gap,
	infill,
	infillSpacing
}) {
	const construction = eternityCircles({ cx, cy, radius, arms, turn });
	const first = (gap + spacing) / 2;
	const centre = { x: cx, y: cy };
	/** @type {Island[]} */
	const islands = [];
	for (let index = 0; index < arms; index += 1) {
		/** @type {Point[][]} */
		const loops = [];
		for (let offset = 0; offset < offsets; offset += 1) {
			const loop = eternityArm(construction, index, first + offset * spacing);
			if (loop) loops.push(loop);
		}
		if (!loops.length) continue;
		/** @type {Point[][]} */
		let fill = [];
		const region = infill
			? eternityArm(construction, index, first + (loops.length - 0.4) * spacing)
			: null;
		if (region) {
			// Hatch across the arm: perpendicular to the chord from hub to rim cusp.
			const rim = region.reduce((best, p) =>
				distance(p, centre) > distance(best, centre) ? p : best
			);
			const chord = Math.atan2(rim.y - region[0].y, rim.x - region[0].x);
			fill = serpentineFill([region], infillSpacing, (chord * 180) / Math.PI + 90, centre);
			const start = fill[0]?.[0];
			const end = fill.at(-1)?.at(-1);
			if (start && end && distance(end, centre) > distance(start, centre)) {
				fill = fill.map((chain) => chain.slice().reverse()).reverse();
			}
		}
		islands.push({ loops, fill });
	}
	return islands;
}

/**
 * Arevakhach, the Armenian eternity sign, in its classic circle-arc form, as
 * one printed layer: a skirt loop, then the crescent arms in rotation order.
 * Each arm is two circular arcs from the centre to the rim (see
 * `eternityCircles`); together the arms sweep one way like a pinwheel and
 * their outer arcs form the scalloped rim. Arms meet at the centre, with no
 * separate hub: the inset perimeters leave only a small open star there.
 * @param {{
 *   arms?: number, turn?: number, offsets?: number, spacing?: number, gap?: number,
 *   infill?: boolean, infillSpacing?: number, skirt?: boolean
 * }} [options] `turn` 1 or -1 mirrors the sweep; `gap` is the clear channel
 *   between neighbouring arms' outer beads
 * @returns {Toolpath}
 */
export function eternitySign({
	arms = 8,
	turn = 1,
	offsets = 3,
	spacing = 7,
	gap = spacing,
	infill = true,
	infillSpacing = 9.5,
	skirt = true
} = {}) {
	const size = 1000;
	const cx = size / 2;
	const cy = size / 2;
	const radius = 410;
	/** @type {Island[]} */
	const islands = [];
	if (skirt) {
		islands.push({ loops: [circle(cx, cy, radius * 1.1, 96)] });
	}
	islands.push(
		...eternityIslands({
			cx,
			cy,
			radius,
			arms,
			turn,
			offsets,
			spacing,
			gap,
			infill,
			infillSpacing
		})
	);
	return assemble(islands, size, size, 0.5);
}

/**
 * Khachkar border (hyusvatsk) as one endless knot: a two-strand guilloche
 * whose strands cross steeply (crossing angle 2·atan(slope)) and are joined by
 * a U-turn at each end, so the whole ribbon is a single closed path. Over and
 * under alternate along it, the under ribbon broken where it passes beneath.
 * The ribbon is cut as a triple groove: two edge lines (perimeters) and, with
 * `grooves: 3`, a centre line printed as its infill bead. Every eye of the
 * guilloche holds a round eyelet (a ring, with an inner ring as its fill when
 * `eyelets` is 2), and fillet lines frame the band above and below.
 * @param {{
 *   length?: number, height?: number, ribbon?: number, slope?: number,
 *   grooves?: number, eyelets?: number, frame?: boolean
 * }} [options]
 * @returns {Toolpath}
 */
export function khachkarBand({
	length = 2400,
	height = 160,
	ribbon = 0.2,
	slope = 1.25,
	grooves = 3,
	eyelets = 2,
	frame = true
} = {}) {
	const w = height * ribbon;
	const frameInset = frame ? height * 0.06 : 0;
	const clearance = Math.max(1.5, w * 0.2);
	const amplitude = height / 2 - frameInset - w / 2 - height * 0.05;
	const period = (TAU * amplitude) / slope;
	const cy = height / 2;
	const reach = amplitude + w / 2;
	// An even number of half periods, so strand A is on top at both ends.
	let halves = Math.floor((length - 2 * (reach + height * 0.1)) / (period / 2));
	if (halves % 2) halves -= 1;
	halves = Math.max(2, halves);
	const x0 = (length - (halves * period) / 2) / 2;
	const x1 = x0 + (halves * period) / 2;
	const k = TAU / period;
	/** @param {number} x */
	const yA = (x) => cy - amplitude * Math.cos(k * (x - x0));
	/** @param {number} x */
	const yB = (x) => cy + amplitude * Math.cos(k * (x - x0));
	const crossings = Array.from({ length: halves }, (_, j) => x0 + period / 4 + (j * period) / 2);

	// The closed centreline, each sample tagged with its strand.
	/** @type {{ p: Point, strand: 'A' | 'B' | 'U' }[]} */
	const line = [];
	const step = Math.min(2, period / 160);
	const turnSteps = Math.ceil((Math.PI * amplitude) / step);
	/** @param {number} cx @param {number} from @param {number} to */
	const arc = (cx, from, to) => {
		for (let index = 0; index < turnSteps / 2; index += 1) {
			const angle = from + ((to - from) * index) / (turnSteps / 2);
			line.push({
				p: { x: cx + amplitude * Math.cos(angle), y: cy + amplitude * Math.sin(angle) },
				strand: 'U'
			});
		}
	};
	arc(x0, Math.PI, 1.5 * Math.PI);
	for (let x = x0; x < x1; x += step) line.push({ p: { x, y: yA(x) }, strand: 'A' });
	arc(x1, -0.5 * Math.PI, 0.5 * Math.PI);
	for (let x = x1; x > x0; x -= step) line.push({ p: { x, y: yB(x) }, strand: 'B' });
	arc(x0, 0.5 * Math.PI, Math.PI);

	// Along A the crossings alternate over/under; B is the opposite at each,
	// which also alternates along B and stays consistent across both U-turns.
	/** @param {'A' | 'B'} strand @param {number} j */
	const isUnder = (strand, j) => (strand === 'A' ? j % 2 === 1 : j % 2 === 0);
	/** @param {Point} q @param {'A' | 'B'} other */
	const distanceToOther = (q, other) => {
		const y = other === 'A' ? yA : yB;
		let best = Infinity;
		for (let x = q.x - w; x <= q.x + w; x += w / 24)
			best = Math.min(best, distance(q, { x, y: y(x) }));
		return best;
	};
	const n = line.length;
	/** @param {number} offset @returns {Point[][]} */
	const runsAt = (offset) => {
		/** @type {Point[][]} */
		const runs = [];
		/** @type {Point[]} */
		let run = [];
		line.forEach(({ p, strand }, index) => {
			const a = line[(index - 1 + n) % n].p;
			const b = line[(index + 1) % n].p;
			const span = distance(a, b) || 1;
			const q = { x: p.x - ((b.y - a.y) / span) * offset, y: p.y + ((b.x - a.x) / span) * offset };
			let hidden = false;
			if (strand !== 'U') {
				const j = crossings.findIndex((x) => Math.abs(q.x - x) < w * 1.6);
				hidden =
					j !== -1 &&
					isUnder(strand, j) &&
					distanceToOther(q, strand === 'A' ? 'B' : 'A') < w / 2 + clearance;
			}
			if (hidden) {
				if (run.length > 1) runs.push(run);
				run = [];
			} else run.push(q);
		});
		// The loop starts and ends on the left U-turn, which is never hidden:
		// the last run continues straight into the first.
		if (run.length && runs.length) runs[0] = [...run, ...runs[0]];
		else if (run.length > 1) runs.push(run);
		return runs;
	};

	/** @type {Island[]} */
	const islands = [];
	if (frame) {
		// Right to left, so the top fillet ends where the knot begins.
		islands.push({
			loops: [],
			open: [
				[
					{ x: length, y: frameInset },
					{ x: 0, y: frameInset }
				]
			]
		});
	}
	islands.push({
		loops: [],
		open: [...runsAt(-w / 2), ...runsAt(w / 2)],
		fill: grooves === 3 ? runsAt(0) : []
	});
	if (eyelets) {
		const ring = (amplitude - w / 2) * 0.55;
		const centres = [x0, ...crossings.slice(0, -1).map((x) => x + period / 4), x1];
		for (const x of centres) {
			islands.push({
				loops: [circle(x, cy, ring, 28)],
				fillLoops: eyelets > 1 ? [circle(x, cy, ring * 0.45, 16)] : []
			});
		}
	}
	if (frame) {
		islands.push({
			loops: [],
			open: [
				[
					{ x: 0, y: height - frameInset },
					{ x: length, y: height - frameInset }
				]
			],
			reversible: true
		});
	}
	return assemble(islands, length, height, 0.4);
}

/**
 * Plain plait border: `strands` sine strands with equal phase steps, each a
 * constant-width ribbon drawn as parallel edge lines, alternating over/under.
 * Kept as an option next to the khachkar knot. The amplitude is clamped so the
 * tightest bend stays wider than the ribbon (no cusps on two strands).
 * @param {{
 *   length?: number, height?: number, crossings?: number, offsets?: number,
 *   strands?: number, ribbon?: number, frame?: boolean
 * }} [options]
 * @returns {Toolpath}
 */
export function plaitBand({
	length = 2000,
	height = 200,
	crossings = 30,
	offsets = 2,
	strands = 3,
	ribbon = 0.15,
	frame = true
} = {}) {
	const count = Math.max(2, Math.round(strands));
	const crossingsPerPeriod = count === 2 ? 2 : count * (count - 1);
	const period = (length * crossingsPerPeriod) / crossings;
	const w = height * ribbon;
	const frameInset = frame ? height * 0.06 : 0;
	const clearance = Math.max(2, w * 0.18);
	// The bend radius at a crest is period²/(4π²·A); keep it above w/2 + clearance.
	const amplitude = Math.min(
		height / 2 - frameInset - w / 2 - height * 0.06,
		(period * period) / (4 * Math.PI * Math.PI * (w / 2 + clearance))
	);
	const cy = height / 2;
	/** @param {number} strand */
	const phaseOf = (strand) => (count === 2 ? strand * Math.PI : (TAU * strand) / count);
	/** @param {number} strand @param {number} x */
	const yOf = (strand, x) => cy + amplitude * Math.sin((TAU * x) / period + phaseOf(strand));
	/** @param {number} strand @param {number} x */
	const slopeOf = (strand, x) =>
		((amplitude * TAU) / period) * Math.cos((TAU * x) / period + phaseOf(strand));

	/** @type {{ x: number, pair: [number, number] }[]} */
	const found = [];
	const probe = period / 360;
	for (let a = 0; a < count; a += 1) {
		for (let b = a + 1; b < count; b += 1) {
			const gap = (/** @type {number} */ x) => yOf(a, x) - yOf(b, x);
			for (let x = 0; x < length; x += probe) {
				if (Math.sign(gap(x)) !== Math.sign(gap(x + probe)) && gap(x + probe) !== 0) {
					found.push({ x: root(gap, x, x + probe), pair: [a, b] });
				}
			}
		}
	}
	found.sort((p, q) => p.x - q.x);
	/** @type {(boolean | undefined)[]} */
	const lastOver = Array.from({ length: count });
	const plan = found.map(({ x, pair: [a, b] }) => {
		let over;
		if (lastOver[a] !== undefined) over = lastOver[a] ? b : a;
		else if (lastOver[b] !== undefined) over = lastOver[b] ? a : b;
		else over = slopeOf(a, x) < slopeOf(b, x) ? a : b;
		const under = over === a ? b : a;
		lastOver[over] = true;
		lastOver[under] = false;
		return { x, over, under };
	});

	/** @param {number} strand @param {number} x */
	const pointOn = (strand, x) => ({ x, y: yOf(strand, x) });
	/** @param {Point} p @param {number} strand */
	const distanceToStrand = (p, strand) => {
		let best = Infinity;
		for (let x = p.x - w; x <= p.x + w; x += w / 24) {
			best = Math.min(best, distance(p, pointOn(strand, x)));
		}
		return best;
	};

	const edges =
		offsets <= 1
			? [0]
			: Array.from({ length: offsets }, (_, i) => -w / 2 + (w * i) / (offsets - 1));
	/** @type {Island[]} */
	const islands = [];
	// Right to left, so the top fillet ends where strand 0 begins.
	if (frame)
		islands.push({
			loops: [],
			open: [
				[
					{ x: length, y: frameInset },
					{ x: 0, y: frameInset }
				]
			]
		});
	for (let strand = 0; strand < count; strand += 1) {
		const unders = plan.filter((crossing) => crossing.under === strand);
		/** @type {Point[][]} */
		const lines = [];
		for (const edge of edges) {
			/** @type {Point[]} */
			let run = [];
			for (let x = 0; x <= length; x += 1) {
				const slope = slopeOf(strand, x);
				const norm = Math.hypot(1, slope);
				const p = { x: x - (slope / norm) * edge, y: yOf(strand, x) + edge / norm };
				const hidden =
					p.x < 0 ||
					p.x > length ||
					unders.some(
						(crossing) =>
							Math.abs(p.x - crossing.x) < w * 1.6 &&
							distanceToStrand(p, crossing.over) < w / 2 + clearance
					);
				if (hidden) {
					if (run.length > 1) lines.push(run);
					run = [];
				} else run.push(p);
			}
			if (run.length > 1) lines.push(run);
		}
		// Alternate direction so each strand starts where the previous ended.
		if (strand % 2 === 1) lines.reverse().forEach((line) => line.reverse());
		islands.push({ loops: [], open: lines });
	}
	if (frame) {
		islands.push({
			loops: [],
			open: [
				[
					{ x: 0, y: height - frameInset },
					{ x: length, y: height - frameInset }
				]
			],
			reversible: true
		});
	}
	return assemble(islands, length, height, 0.4);
}

/**
 * Eight-pointed carpet star (ութաթև) round a medallion: each point is its own
 * petal island, a kite that rises from the core ring to a sharp tip, separated
 * from its neighbours by a constant-width channel. Petals get two perimeters
 * and a serpentine raster that alternates ±45° to the petal axis from one
 * petal to the next, the way the points of knotted stars are split into two
 * tones (and the way a slicer rasters each island on its own). The core ring
 * holds a small eternity sign.
 * @param {{
 *   points?: number, shoulder?: number, offsets?: number, spacing?: number,
 *   infillSpacing?: number, channel?: number, core?: number
 * }} [options]
 * @returns {Toolpath}
 */
export function starRosette({
	points = 8,
	shoulder = 0.68,
	offsets = 2,
	spacing = 8,
	infillSpacing = 16,
	channel = 16,
	core = 0.38
} = {}) {
	const size = 1000;
	const cx = size / 2;
	const cy = size / 2;
	const radius = 470;
	const coreRadius = radius * core;
	const inner = coreRadius + channel;
	const shoulderRadius = radius * shoulder;
	const sector = Math.PI / points;
	/** @param {number} r @param {number} angle */
	const polar = (r, angle) => ({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });

	/** @type {Island[]} */
	const islands = [];
	for (let index = 0; index < points; index += 1) {
		const axis = -Math.PI / 2 + 2 * sector * index;
		// Edges facing a neighbour run parallel to the bisector, channel/2 away.
		const atShoulder = sector - Math.asin(channel / 2 / shoulderRadius);
		const atCore = sector - Math.asin(channel / 2 / inner);
		/** @type {Point[]} */
		const arc = Array.from({ length: 9 }, (_, step) =>
			polar(inner, axis + atCore - (2 * atCore * step) / 8)
		);
		const petal = [
			polar(radius, axis),
			polar(shoulderRadius, axis + atShoulder),
			...arc,
			polar(shoulderRadius, axis - atShoulder)
		];
		const loops = Array.from({ length: offsets }, (_, offset) =>
			insetPolygon(petal, (offset + 0.5) * spacing)
		);
		const rasterAngle = (axis * 180) / Math.PI + (index % 2 ? -45 : 45);
		const fill = serpentineFill(
			[insetPolygon(petal, (offsets + 0.25) * spacing)],
			infillSpacing,
			rasterAngle,
			{ x: cx, y: cy }
		);
		islands.push({ loops, fill });
	}
	islands.push({
		loops: Array.from({ length: offsets }, (_, offset) =>
			circle(cx, cy, coreRadius - (offset + 0.5) * spacing, 64)
		)
	});
	islands.push(
		...eternityIslands({
			cx,
			cy,
			radius: coreRadius - (offsets + 1) * spacing,
			arms: points,
			turn: 1,
			offsets: 1,
			spacing: 5,
			gap: 5,
			infill: false,
			infillSpacing: 10
		})
	);
	return assemble(islands, size, size, 0.5);
}

/**
 * Star polygon with alternating outer and inner vertices, one point straight up.
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 * @param {number} points
 * @param {number} innerRatio
 */
export function starPolygon(cx, cy, radius, points, innerRatio) {
	return Array.from({ length: points * 2 }, (_, index) => {
		const angle = -Math.PI / 2 + (Math.PI * index) / points;
		const r = index % 2 ? radius * innerRatio : radius;
		return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
	});
}

/** @typedef {'eternity' | 'interlace' | 'plait' | 'star'} Motif */

/** @type {Map<string, Toolpath>} */
const cache = new Map();

/**
 * Memoised motif lookup, used at build time by the ornament sprite and by
 * tests: each geometry is computed once per process.
 * @param {Motif} motif
 * @param {Record<string, unknown>} [options]
 * @returns {Toolpath}
 */
export function ornament(motif, options = {}) {
	const key = `${motif}:${JSON.stringify(options)}`;
	let toolpath = cache.get(key);
	if (!toolpath) {
		if (motif === 'interlace') toolpath = khachkarBand(options);
		else if (motif === 'plait') toolpath = plaitBand(options);
		else if (motif === 'star') toolpath = starRosette(options);
		else toolpath = eternitySign(options);
		cache.set(key, toolpath);
	}
	return toolpath;
}
