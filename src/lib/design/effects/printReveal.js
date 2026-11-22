/**
 * Layer-print headings: large `main h1, main h2` titles print in from the
 * bottom in discrete layers (clip-path steps, CSS in app.css) the first time
 * they enter the viewport on a page view, with a nozzle line on the current
 * layer.
 *
 * Headings are visible by default (prerendered HTML, no JS, reduced motion).
 * A heading is only clipped once this module has armed it, and headings that
 * were already on screen at first paint are left alone, so text never flashes
 * out after it was readable.
 */

const HEADINGS = 'main h1, main h2';
/** Small labels, hidden text, and headings inside charts, the graph or cards. */
const SKIP =
	'[data-no-print], .visually-hidden, .aside-label, [aria-hidden="true"], .graph, figure, svg, .chart, .card, [class*="-card"]';
/** Below this computed font size a heading is a label, not a section title. */
const MIN_FONT_PX = 22;
/** Longest the animation can take before the heading is forced visible. */
const FALLBACK_MS = 1200;

export const PRINT_CLASS = {
	armed: 'print-reveal',
	printing: 'print-reveal--printing',
	nozzle: 'print-reveal--nozzle'
};

/** @typedef {{ scan: () => void, destroy: () => void }} PrintReveal */

/** @type {PrintReveal} */
const NOOP = { scan() {}, destroy() {} };

/**
 * Start watching headings inside `main`. Call `scan()` after client-side
 * navigation (same nodes may now carry a new page's text); DOM additions such
 * as tab panels are picked up on their own.
 * @returns {PrintReveal}
 */
export function attachPrintReveal() {
	if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return NOOP;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
	if (reduce.matches || !CSS.supports('clip-path', 'inset(0 0 0 0)')) return NOOP;
	const main = document.querySelector('main');
	if (!main) return NOOP;

	/** Elements already considered on this page view. */
	let seen = new WeakSet();
	/** Heading texts already printed (or skipped) on this page view. */
	let printed = new Set();
	let path = location.pathname;
	let first = true;
	/** @type {Map<Element, ReturnType<typeof setTimeout>>} */
	const timers = new Map();

	/** @param {Element} el */
	const finish = (el) => {
		clearTimeout(timers.get(el));
		timers.delete(el);
		el.classList.remove(PRINT_CLASS.armed, PRINT_CLASS.printing, PRINT_CLASS.nozzle);
		el.removeEventListener('animationend', onEnd);
	};

	/** @param {Event} event */
	function onEnd(event) {
		const anim = /** @type {AnimationEvent} */ (event);
		if (anim.animationName !== 'print-layers' || anim.pseudoElement) return;
		finish(/** @type {Element} */ (event.currentTarget));
	}

	const io = new IntersectionObserver(
		(entries) => {
			const viewport = window.innerHeight;
			// Client navigation can report entries from the previous page's scroll
			// position; confirm against the live position before printing.
			const live = entries
				.filter((entry) => entry.isIntersecting)
				.map((entry) => ({ el: entry.target, box: entry.target.getBoundingClientRect() }));
			for (const { el, box } of live) {
				if (box.bottom <= 0 || box.top >= viewport) continue;
				io.unobserve(el);
				el.addEventListener('animationend', onEnd);
				el.classList.add(PRINT_CLASS.printing);
				timers.set(
					el,
					setTimeout(() => finish(el), FALLBACK_MS)
				);
			}
		},
		{ rootMargin: '0px 0px -6% 0px' }
	);

	function scan() {
		if (location.pathname !== path) {
			path = location.pathname;
			seen = new WeakSet();
			printed = new Set();
		}
		/** @type {HTMLElement[]} */
		const fresh = [];
		for (const el of main?.querySelectorAll(HEADINGS) ?? []) {
			if (seen.has(el)) continue;
			seen.add(el);
			if (!el.closest(SKIP)) fresh.push(/** @type {HTMLElement} */ (el));
		}
		if (!fresh.length) return;

		// Read everything first, then write, so a scan costs one layout.
		const viewport = window.innerHeight;
		const measured = fresh.map((el) => {
			const style = getComputedStyle(el);
			const box = el.getBoundingClientRect();
			return {
				el,
				large: parseFloat(style.fontSize) >= MIN_FONT_PX,
				staticPosition: style.position === 'static',
				onScreen: box.bottom > 0 && box.top < viewport && box.height > 0,
				key: (el.textContent ?? '').trim()
			};
		});
		for (const { el, large, staticPosition, onScreen, key } of measured) {
			if (!large || !key || printed.has(key)) continue;
			printed.add(key);
			// Already painted and readable on first load: never hide it again.
			if (first && onScreen) continue;
			if (timers.has(el)) continue;
			el.classList.add(PRINT_CLASS.armed);
			if (staticPosition) el.classList.add(PRINT_CLASS.nozzle);
			io.observe(el);
		}
	}

	scan();
	first = false;

	// Tab panels, filtered lists and similar add headings without navigating.
	// MutationObserver callbacks run before paint, so new headings arm unseen.
	const mo = new MutationObserver((records) => {
		if (records.some((record) => record.addedNodes.length)) scan();
	});
	mo.observe(main, { childList: true, subtree: true });

	const onReduce = () => {
		if (reduce.matches) destroy();
	};
	reduce.addEventListener('change', onReduce);

	function destroy() {
		io.disconnect();
		mo.disconnect();
		reduce.removeEventListener('change', onReduce);
		for (const el of main?.querySelectorAll(`.${PRINT_CLASS.armed}`) ?? []) finish(el);
		for (const timer of timers.values()) clearTimeout(timer);
		timers.clear();
	}

	return { scan, destroy };
}
