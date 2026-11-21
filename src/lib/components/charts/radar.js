/**
 * Pure geometry for the hand-built SVG radar chart. Everything is computed in
 * SVG user units around a centre at (0, 0), so the component can render on
 * the server and simply scale with its `viewBox`.
 */

/** Outer ring radius in user units; a value of `max` lands on this ring. */
export const RADAR_RADIUS = 100;

/**
 * Label font size in user units. With the viewBox below, the chart renders
 * labels at ~12px on a 375px phone and ~16px at its desktop max width.
 */
export const LABEL_FONT = 15;

/** Distance between the outer ring and the axis label anchor point. */
export const LABEL_GAP = 12;

/** Line height of multi-line labels, in user units. */
export const LABEL_LINE = LABEL_FONT * 1.15;

/**
 * Conservative average glyph width as a fraction of the font size, used to
 * keep labels inside the viewBox without measuring text in the browser.
 */
export const GLYPH_WIDTH = 0.6;

/** Breathing room around the outermost label boxes. */
const PAD = 4;

/** @param {number} value */
const round = (value) => Math.round(value * 100) / 100 || 0;

/**
 * Angle (radians) of axis `index`: the first axis points straight up and the
 * rest follow clockwise at equal steps.
 * @param {number} index
 * @param {number} count
 */
export function axisAngle(index, count) {
	return -Math.PI / 2 + (index * 2 * Math.PI) / count;
}

/**
 * Point at `radius` along axis `index`, rounded to two decimals.
 * @param {number} index
 * @param {number} count
 * @param {number} radius
 * @returns {{ x: number, y: number }}
 */
export function pointAt(index, count, radius) {
	const angle = axisAngle(index, count);
	return { x: round(Math.cos(angle) * radius), y: round(Math.sin(angle) * radius) };
}

/**
 * Position of a score on its axis.
 * @param {number} index
 * @param {number} count
 * @param {number} value
 * @param {number} [max]
 */
export function valuePoint(index, count, value, max = 100) {
	const clamped = Math.min(Math.max(value, 0), max);
	return pointAt(index, count, (clamped / max) * RADAR_RADIUS);
}

/**
 * SVG `points` attribute for a closed polygon of scores, one per axis.
 * @param {number[]} values
 * @param {number} [max]
 */
export function polygonPoints(values, max = 100) {
	return values
		.map((value, index) => {
			const { x, y } = valuePoint(index, values.length, value, max);
			return `${x},${y}`;
		})
		.join(' ');
}

/**
 * Text anchor for a label on an axis at `angle`: labels on the right start at
 * the anchor point, labels on the left end at it, top and bottom are centred.
 * @param {number} angle
 * @returns {'start' | 'middle' | 'end'}
 */
export function labelAnchor(angle) {
	const cos = Math.cos(angle);
	if (cos > 0.15) return 'start';
	if (cos < -0.15) return 'end';
	return 'middle';
}

/**
 * Side labels wrap at their first space so long two-word labels do not push
 * the viewBox wide; centred labels have room to stay on one line.
 * @param {string} label
 * @param {'start' | 'middle' | 'end'} anchor
 * @returns {string[]}
 */
export function labelLines(label, anchor) {
	if (anchor === 'middle' || label.length <= 10) return [label];
	const space = label.indexOf(' ');
	return space === -1 ? [label] : [label.slice(0, space), label.slice(space + 1)];
}

/**
 * @typedef {object} RadarLabel
 * @property {string} text Full label, for accessible names.
 * @property {number} x
 * @property {'start' | 'middle' | 'end'} anchor
 * @property {{ text: string, y: number }[]} lines Baselines per line.
 * @property {{ x0: number, x1: number, y0: number, y1: number }} box Estimated bounds.
 */

/**
 * Estimated label placement just outside the outer ring. Multi-line labels are
 * pushed away from the centre in proportion to how vertical their axis is.
 * @param {string} text
 * @param {number} index
 * @param {number} count
 * @returns {RadarLabel}
 */
export function placeLabel(text, index, count) {
	const angle = axisAngle(index, count);
	const anchor = labelAnchor(angle);
	const lines = labelLines(text, anchor);
	const { x, y } = pointAt(index, count, RADAR_RADIUS + LABEL_GAP);
	const width = Math.max(...lines.map((line) => line.length)) * GLYPH_WIDTH * LABEL_FONT;
	const height = lines.length * LABEL_LINE;
	const top = y + Math.sin(angle) * (height / 2) - height / 2;
	const x0 = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
	return {
		text,
		x,
		anchor,
		lines: lines.map((line, i) => ({
			text: line,
			y: round(top + i * LABEL_LINE + LABEL_FONT * 0.85)
		})),
		box: { x0: round(x0), x1: round(x0 + width), y0: round(top), y1: round(top + height) }
	};
}

/**
 * Full layout: label placements plus a viewBox that is horizontally centred
 * on the radar and wide enough for every estimated label box.
 * @param {string[]} axes
 * @returns {{ labels: RadarLabel[], viewBox: { x: number, y: number, width: number, height: number } }}
 */
export function radarLayout(axes) {
	const labels = axes.map((axis, index) => placeLabel(axis, index, axes.length));
	let half = RADAR_RADIUS;
	let top = -RADAR_RADIUS;
	let bottom = RADAR_RADIUS;
	for (const { box } of labels) {
		half = Math.max(half, -box.x0, box.x1);
		top = Math.min(top, box.y0);
		bottom = Math.max(bottom, box.y1);
	}
	half = Math.ceil(half + PAD);
	top = Math.floor(top - PAD);
	bottom = Math.ceil(bottom + PAD);
	return { labels, viewBox: { x: -half, y: top, width: half * 2, height: bottom - top } };
}

/**
 * Closed wedge around axis `index` (half a step either side), used as a
 * generous hover and tap target for that axis.
 * @param {number} index
 * @param {number} count
 * @param {number} radius
 */
export function wedgePath(index, count, radius) {
	const half = Math.PI / count;
	const angle = axisAngle(index, count);
	const a = {
		x: round(Math.cos(angle - half) * radius),
		y: round(Math.sin(angle - half) * radius)
	};
	const b = {
		x: round(Math.cos(angle + half) * radius),
		y: round(Math.sin(angle + half) * radius)
	};
	return `M0 0L${a.x} ${a.y}A${radius} ${radius} 0 0 1 ${b.x} ${b.y}Z`;
}
