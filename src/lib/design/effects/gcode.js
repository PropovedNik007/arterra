/**
 * G-code view: turns the boxes of the current page into plausible slicer
 * output. Pure and DOM-free so it runs in tests and during prerender; the DOM
 * walk lives in `gcodeDom.js`.
 *
 * The result is a portfolio slicer preview, not the output of any real slicer:
 * every block becomes one perimeter loop (images also get serpentine infill),
 * each page section is one layer, and extrusion follows the usual
 * 1.75 mm filament / 0.4 mm line / 0.2 mm layer arithmetic.
 */

/** Page pixels to build-plate millimetres. */
export const PX_TO_MM = 0.2;
/** Blocks beyond this are left out, so huge pages stay cheap. */
export const MAX_BLOCKS = 150;
/** Layer height in mm; one page section is one layer. */
export const LAYER_HEIGHT = 0.2;
/** Filament mm per mm of line: 0.4 x 0.2 mm bead over a 1.75 mm filament. */
export const E_PER_MM = (0.4 * LAYER_HEIGHT) / (Math.PI * 0.875 ** 2);

const TRAVEL_FEED = 'F6000';
const PRINT_FEED = 'F1800';
/** Serpentine infill spacing in mm, and the most passes one image gets. */
const INFILL_SPACING = 4;
const MAX_INFILL_PASSES = 8;

/**
 * @typedef {'heading' | 'text' | 'button' | 'image' | 'card'} BlockKind
 * @typedef {{ x: number, y: number, width: number, height: number }} Rect
 * @typedef {{ kind: BlockKind, rect: Rect, layer: number, label?: string }} Block
 */

/** Slicer feature type per block kind, in Cura's comment vocabulary. */
export const BLOCK_TYPES = /** @type {const} */ ({
	heading: 'WALL-OUTER',
	card: 'WALL-INNER',
	button: 'WALL-OUTER',
	text: 'SKIN',
	image: 'FILL'
});

/**
 * Fixed-decimal number for G-code: never `-0.00`, `NaN` or `Infinity`.
 * @param {number} value
 * @param {number} [decimals]
 */
export function formatNumber(value, decimals = 2) {
	const text = (Number.isFinite(value) ? value : 0).toFixed(decimals);
	return /^-0\.?0*$/.test(text) ? text.slice(1) : text;
}

/**
 * Comment-safe text: one line, no `;`, trimmed to `max` characters.
 * @param {string | undefined} text
 * @param {number} [max]
 */
export function cleanLabel(text, max = 48) {
	const flat = (text ?? '').replace(/[\s;]+/g, ' ').trim();
	return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

/** @param {Rect} rect */
function isDrawable(rect) {
	return (
		Number.isFinite(rect.x) &&
		Number.isFinite(rect.y) &&
		Number.isFinite(rect.width) &&
		Number.isFinite(rect.height) &&
		rect.width > 0 &&
		rect.height > 0
	);
}

/**
 * @param {{
 *   title?: string,
 *   blocks: Block[],
 *   scale?: number,
 *   maxBlocks?: number
 * }} options
 * @returns {{ lines: string[], layers: number, blocks: number, skipped: number, filament: number }}
 *   `filament` is the total extruded length in mm.
 */
export function generateGcode({ title = '', blocks, scale = PX_TO_MM, maxBlocks = MAX_BLOCKS }) {
	const drawable = blocks.filter((block) => isDrawable(block.rect));
	const used = drawable.slice(0, Math.max(0, maxBlocks));
	const skipped = drawable.length - used.length;

	// Re-index layers 0..n in order of first appearance.
	/** @type {Map<number, number>} */
	const layerIndex = new Map();
	for (const block of used) {
		if (!layerIndex.has(block.layer)) layerIndex.set(block.layer, layerIndex.size);
	}

	const xy = (/** @type {number} */ x, /** @type {number} */ y) =>
		`X${formatNumber(x * scale)} Y${formatNumber(y * scale)}`;

	const name = cleanLabel(title, 80) || 'untitled page';
	const lines = [
		`; portfolio slicer preview of "${name}"`,
		'; generated in the browser from this page layout, not by a real slicer',
		`; scale 1px = ${formatNumber(scale, 2)}mm, origin at the top-left of the page`,
		';FLAVOR:Marlin',
		`;LAYER_COUNT:${layerIndex.size}`,
		'G21 ; millimetres',
		'G90 ; absolute positioning',
		'M82 ; absolute extrusion',
		'G28 ; home all axes',
		'G92 E0'
	];

	let e = 0;
	let filament = 0;
	let layer = -1;
	/** @type {string | null} */
	let type = null;
	let x = 0;
	let y = 0;

	/** Extrude in a straight line to (nx, ny) in page px. */
	const extrude = (/** @type {number} */ nx, /** @type {number} */ ny, feed = '') => {
		const length = Math.hypot(nx - x, ny - y) * scale;
		filament += length;
		e += length * E_PER_MM;
		x = nx;
		y = ny;
		return `G1${feed ? ` ${feed}` : ''} ${xy(nx, ny)} E${formatNumber(e, 5)}`;
	};

	for (const block of used) {
		const index = /** @type {number} */ (layerIndex.get(block.layer));
		if (index !== layer) {
			layer = index;
			type = null;
			lines.push(`;LAYER:${layer}`, `G0 Z${formatNumber((layer + 1) * LAYER_HEIGHT)}`);
		}
		const blockType = BLOCK_TYPES[block.kind] ?? 'WALL-INNER';
		if (blockType !== type) {
			type = blockType;
			lines.push(`;TYPE:${type}`);
		}
		const label = cleanLabel(block.label);
		lines.push(`; ${block.kind}${label ? ` "${label}"` : ''}`);

		const { x: left, y: top, width, height } = block.rect;
		const right = left + width;
		const bottom = top + height;
		x = left;
		y = top;
		lines.push(`G0 ${TRAVEL_FEED} ${xy(left, top)}`);
		lines.push(
			extrude(right, top, PRINT_FEED),
			extrude(right, bottom),
			extrude(left, bottom),
			extrude(left, top)
		);

		if (block.kind === 'image') {
			const passes = Math.min(
				MAX_INFILL_PASSES,
				Math.max(1, Math.floor((height * scale) / INFILL_SPACING) - 1)
			);
			const step = height / (passes + 1);
			for (let pass = 1; pass <= passes; pass++) {
				const row = top + step * pass;
				const [from, to] = pass % 2 ? [left, right] : [right, left];
				x = from;
				y = row;
				lines.push(`G0 ${xy(from, row)}`, extrude(to, row));
			}
		}
	}

	lines.push(
		';TYPE:END',
		'M107 ; fan off',
		'G91',
		'G0 Z5 ; lift clear of the page',
		'G90',
		'M84 ; motors off',
		`;Filament used: ${formatNumber(filament / 1000, 3)}m`,
		`; ${used.length} blocks on ${layerIndex.size} layers${
			skipped > 0 ? `, preview capped at ${maxBlocks} blocks (page has more)` : ''
		}`
	);

	return { lines, layers: layerIndex.size, blocks: used.length, skipped, filament };
}
