/**
 * Static, server-rendered stand-in for the 3D mini slicer: an isometric stack
 * of planar layer outlines with the selected layer's full toolpath on top.
 * It is what visitors see without JavaScript or WebGL, and before three.js
 * has loaded. Built from the exact cross-section (no mesh), so it is cheap
 * enough to recompute when the layer slider moves.
 */
import { toPath } from '#lib/design/ornaments/geometry.js';
import { layerLevels, planarLayerFromSection, sectionAt } from './geometry.js';

/** @typedef {import('./geometry.js').Point2} Point2 */

const YAW = (-35 * Math.PI) / 180;
const PITCH = (28 * Math.PI) / 180;
const COS_YAW = Math.cos(YAW);
const SIN_YAW = Math.sin(YAW);

/**
 * Isometric-style projection: turn the part, then tilt the view so farther
 * points and higher layers appear higher on screen (SVG y grows downward).
 * @param {Point2} p
 * @param {number} z
 */
export function project(p, z) {
	const x = p.x * COS_YAW - p.y * SIN_YAW;
	const depth = p.x * SIN_YAW + p.y * COS_YAW;
	return { x, y: -(z * Math.cos(PITCH) + depth * Math.sin(PITCH)) };
}

const LEVELS = layerLevels('planar');

/** Number of planar layers the fallback can show. */
export const FALLBACK_LAYERS = LEVELS.length;

/** View box that fits the whole part. */
export const FALLBACK_VIEWBOX = '-34 -72 68 88';

/** @type {string[] | undefined} */
let outlines;

/** Outline of every layer, bottom to top, as compact path data. */
function layerOutlines() {
	outlines ??= LEVELS.map((z) =>
		toPath(
			sectionAt(z, 48).map((p) => project(p, z)),
			true
		)
	);
	return outlines;
}

/**
 * Everything the fallback SVG draws with `layer` (0-based) as the current one.
 * @param {number} layer
 */
export function fallbackScene(layer) {
	const index = Math.min(Math.max(layer, 0), LEVELS.length - 1);
	const z = LEVELS[index];
	const plan = planarLayerFromSection(index);
	const at = (/** @type {Point2} */ p) => project(p, z);
	const all = layerOutlines();
	return {
		below: all.slice(0, index),
		above: all.slice(index + 1),
		current: {
			outline: all[index],
			outer: plan.outer.map((loop) => toPath(loop.map(at), true)).join(''),
			inner: plan.inner.map((loop) => toPath(loop.map(at), true)).join(''),
			infill: plan.infill.map((line) => toPath(line.map(at))).join(''),
			travel: plan.travel.map(([a, b]) => toPath([at(a), at(b)])).join(''),
			seam: plan.seam ? at(plan.seam) : null
		}
	};
}
