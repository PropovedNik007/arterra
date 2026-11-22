/**
 * Time plan for a nozzle that prints closed loops one after another: a print
 * move around each loop at the feed rate, and a faster travel move (nothing
 * deposited) from the end of one loop to the start of the next. Pure and
 * deterministic, so it runs the same on the server and in tests.
 */

/** @typedef {{ x: number, y: number }} Point */

/**
 * @typedef {object} Move
 * @property {number} island index of the loop being printed, or -1 for travel
 * @property {Point[]} points polyline, the closing point repeated for loops
 * @property {number[]} at cumulative length at each point
 * @property {number} length
 * @property {number} start seconds into the plan
 * @property {number} duration seconds
 */

/**
 * @typedef {object} Plan
 * @property {Move[]} moves
 * @property {number} duration
 */

/** @param {Point[]} points */
function cumulative(points) {
	const at = [0];
	for (let index = 1; index < points.length; index += 1) {
		const a = points[index - 1];
		const b = points[index];
		at.push(at[index - 1] + Math.hypot(b.x - a.x, b.y - a.y));
	}
	return at;
}

/**
 * @param {Point[][]} loops closed loops without a repeated closing point, in print order
 * @param {{ from?: Point, duration?: number, rapid?: number }} [options]
 *   from: where the nozzle starts (adds a first travel move); duration: total
 *   print time in seconds (travel included); rapid: travel speed as a multiple
 *   of the feed rate.
 * @returns {Plan}
 */
export function planTrace(loops, { from = undefined, duration = 4.5, rapid = 2.5 } = {}) {
	/** @type {Omit<Move, 'start' | 'duration'>[]} */
	const legs = [];
	/** @type {Point | undefined} */
	let cursor = from;
	loops.forEach((loop, island) => {
		if (loop.length < 2) return;
		if (cursor) {
			const points = [cursor, loop[0]];
			const at = cumulative(points);
			legs.push({ island: -1, points, at, length: at[1] });
		}
		const points = [...loop, loop[0]];
		const at = cumulative(points);
		legs.push({ island, points, at, length: at[at.length - 1] });
		cursor = loop[0];
	});
	// Distance-equivalent cost: travel counts 1/rapid of its length.
	const cost = (/** @type {{ island: number, length: number }} */ leg) =>
		leg.island < 0 ? leg.length / rapid : leg.length;
	const total = legs.reduce((sum, leg) => sum + cost(leg), 0) || 1;
	let start = 0;
	const moves = legs.map((leg) => {
		const time = (cost(leg) / total) * duration;
		const move = { ...leg, start, duration: time };
		start += time;
		return move;
	});
	return { moves, duration: moves.length ? duration : 0 };
}

/**
 * Point at `distance` along a move's polyline.
 * @param {Move} move
 * @param {number} distance
 * @returns {Point}
 */
export function pointAlong(move, distance) {
	const { points, at } = move;
	if (distance <= 0) return points[0];
	if (distance >= move.length) return points[points.length - 1];
	let lo = 0;
	let hi = at.length - 1;
	while (hi - lo > 1) {
		const mid = (lo + hi) >> 1;
		if (at[mid] <= distance) lo = mid;
		else hi = mid;
	}
	const span = at[hi] - at[lo] || 1;
	const t = (distance - at[lo]) / span;
	return {
		x: points[lo].x + (points[hi].x - points[lo].x) * t,
		y: points[lo].y + (points[hi].y - points[lo].y) * t
	};
}

/**
 * Where the nozzle is at `time`, which move it is on, and how much of that
 * move is done (0–1). Moves before it are complete, moves after it untouched.
 * @param {Plan} plan
 * @param {number} time seconds
 * @param {number} [hint] index of the move found last time, to search from
 * @returns {{ point: Point, index: number, fraction: number }}
 */
export function sampleTrace(plan, time, hint = 0) {
	const { moves } = plan;
	if (!moves.length) return { point: { x: 0, y: 0 }, index: -1, fraction: 1 };
	let index = Math.min(Math.max(0, hint), moves.length - 1);
	while (index > 0 && time < moves[index].start) index -= 1;
	while (index < moves.length - 1 && time >= moves[index].start + moves[index].duration) index += 1;
	const move = moves[index];
	const fraction = Math.min(1, Math.max(0, (time - move.start) / (move.duration || 1)));
	return { point: pointAlong(move, fraction * move.length), index, fraction };
}
