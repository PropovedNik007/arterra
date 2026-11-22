import { MAX_BLOCKS } from './gcode.js';

/** Page blocks the slicer view outlines and turns into G-code. */
export const GCODE_BLOCK_SELECTOR = [
	'h1',
	'h2',
	'h3',
	'p',
	'a.button',
	'button.button',
	'img',
	'figure',
	'article',
	'.card',
	'blockquote',
	'pre'
].join(', ');

/** Never walked: decorative, hidden or the G-code panel itself. */
const SKIP_SELECTOR = '[aria-hidden="true"], .visually-hidden, [data-gcode-skip]';

/**
 * @param {Element} element
 * @returns {import('./gcode.js').BlockKind}
 */
function kindOf(element) {
	const tag = element.tagName;
	if (tag === 'H1' || tag === 'H2' || tag === 'H3') return 'heading';
	if (tag === 'P' || tag === 'BLOCKQUOTE' || tag === 'PRE') return 'text';
	if (tag === 'IMG') return 'image';
	if (element.classList.contains('button')) return 'button';
	return 'card';
}

/** @param {Element} element @param {import('./gcode.js').BlockKind} kind */
function labelOf(element, kind) {
	if (kind === 'image') return element.getAttribute('alt') ?? '';
	if (kind === 'heading' || kind === 'button') {
		// innerText keeps rendered line breaks ("Artur<br>Sogomonyan" → two words);
		// layout is already being read, so it costs nothing extra.
		const text = element instanceof HTMLElement ? element.innerText : element.textContent;
		return (text ?? '').replace(/\s+/g, ' ').trim();
	}
	return '';
}

/**
 * Visible blocks inside `root`, in document order, as page-coordinate rects
 * (CSS px, scroll included). A layer is the block's nearest section, or the
 * top-level child of `root` it sits in. Reads layout only, never writes.
 * Collects one block past `cap`, so the generator can say it truncated.
 * @param {Element} root
 * @param {number} [cap]
 * @returns {import('./gcode.js').Block[]}
 */
export function collectBlocks(root, cap = MAX_BLOCKS) {
	/** @type {Map<Element, number>} */
	const layers = new Map();
	/** @type {import('./gcode.js').Block[]} */
	const blocks = [];
	const { scrollX, scrollY } = window;

	for (const element of root.querySelectorAll(GCODE_BLOCK_SELECTOR)) {
		if (blocks.length > cap) break;
		if (element.closest(SKIP_SELECTOR)) continue;
		const box = element.getBoundingClientRect();
		if (box.width < 1 || box.height < 1) continue;

		/** @type {Element} */
		let section = element;
		const nearest = element.closest('section');
		if (nearest && root.contains(nearest)) section = nearest;
		else {
			while (section.parentElement && section.parentElement !== root) {
				section = section.parentElement;
			}
		}
		if (!layers.has(section)) layers.set(section, layers.size);

		const kind = kindOf(element);
		blocks.push({
			kind,
			layer: /** @type {number} */ (layers.get(section)),
			label: labelOf(element, kind),
			rect: { x: box.left + scrollX, y: box.top + scrollY, width: box.width, height: box.height }
		});
	}
	return blocks;
}
