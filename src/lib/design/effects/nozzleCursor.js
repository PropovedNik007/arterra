/**
 * Nozzle cursor: on fine-pointer, hover-capable devices a small nozzle dot
 * follows the pointer and leaves a short extrusion trail on a fixed canvas
 * (pointer-events: none, styled in app.css, drawn at 1 canvas px per CSS px). Over interactive controls the
 * trail turns into a dashed travel move. Off under reduced motion, on touch,
 * while the page is hidden, and over the knowledge graph, charts and anything
 * marked `data-no-nozzle`.
 */

/** Pointer over these: dashed travel move, no extrusion. */
const INTERACTIVE =
	'a[href], button, [role="button"], input, select, textarea, label, summary, [contenteditable=""], [contenteditable="true"]';
/**
 * Pointer over these: no nozzle at all (they have their own pointer UI). The
 * home hero (constellation) and the 404 robot arm carry `data-no-nozzle`.
 */
const EXCLUDED =
	'[data-no-nozzle], .graph .canvas, .sigma-container, figure.radar, figure.sankey, .skills-chart, .chart, canvas, [data-gcode-skip]';
const TRAIL_MS = 400;
const MAX_POINTS = 40;

/** @typedef {{ x: number, y: number, t: number, travel: boolean }} TrailPoint */

/** @returns {() => void} cleanup */
export function attachNozzleCursor() {
	if (typeof window === 'undefined') return () => {};
	const fine = window.matchMedia('(pointer: fine) and (hover: hover)');
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

	/** @type {HTMLCanvasElement | null} */
	let canvas = null;
	/** @type {CanvasRenderingContext2D | null} */
	let ctx = null;
	/** @type {TrailPoint[]} */
	let points = [];
	let frame = 0;
	let sized = false;
	/** Pointer position, or null when it left the page or sits over an excluded area. */
	/** @type {{ x: number, y: number } | null} */
	let head = null;
	/** @type {Element | null} */
	let lastTarget = null;
	let colors = { ink: '#e17b5a', head: '#fbf8f2', travel: '#8f8c84' };

	function readColors() {
		const root = getComputedStyle(document.documentElement);
		const local = lastTarget ? getComputedStyle(lastTarget) : root;
		colors = {
			ink: local.getPropertyValue('--accent').trim() || colors.ink,
			head: root.getPropertyValue('--color-heading').trim() || colors.head,
			travel: root.getPropertyValue('--color-text-muted').trim() || colors.travel
		};
	}

	// One canvas pixel per CSS pixel: a soft 2–4 px trail gains nothing from a
	// retina backing store, which would be 4× the memory (~20 MB at 1440×900).
	function resize() {
		if (!canvas) return;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		sized = true;
	}

	/** @param {number} now */
	function draw(now) {
		frame = 0;
		if (!canvas || !ctx) return;
		if (!sized) resize();
		points = points.filter((point) => now - point.t < TRAIL_MS).slice(-MAX_POINTS);

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.lineCap = 'round';

		for (let i = 1; i < points.length; i++) {
			const a = points[i - 1];
			const b = points[i];
			if (b.t - a.t > 120) continue; // a gap in movement is not a line
			const life = 1 - (now - b.t) / TRAIL_MS;
			const travel = a.travel || b.travel;
			ctx.globalAlpha = Math.max(0, life) * (travel ? 0.7 : 0.55);
			ctx.strokeStyle = travel ? colors.travel : colors.ink;
			ctx.lineWidth = travel ? 1 : 1 + 1.6 * life;
			ctx.setLineDash(travel ? [3, 5] : []);
			ctx.beginPath();
			ctx.moveTo(a.x, a.y);
			ctx.lineTo(b.x, b.y);
			ctx.stroke();
		}
		ctx.setLineDash([]);

		if (head) {
			ctx.globalAlpha = 0.9;
			ctx.fillStyle = colors.ink;
			ctx.beginPath();
			ctx.arc(head.x, head.y, 4.5, 0, Math.PI * 2);
			ctx.globalAlpha = 0.25;
			ctx.fill();
			ctx.globalAlpha = 0.95;
			ctx.fillStyle = colors.head;
			ctx.beginPath();
			ctx.arc(head.x, head.y, 2, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;

		// Keep animating only while the trail is fading; an idle nozzle stays drawn.
		if (points.length) frame = requestAnimationFrame(draw);
	}

	function wake() {
		if (!frame && !document.hidden) {
			readColors();
			frame = requestAnimationFrame(draw);
		}
	}

	/** @param {PointerEvent} event */
	function onMove(event) {
		if (event.pointerType === 'touch') return;
		const target = event.target instanceof Element ? event.target : null;
		if (target !== lastTarget) {
			lastTarget = target;
			if (frame) readColors();
		}
		if (target?.closest(EXCLUDED)) {
			head = null;
			wake();
			return;
		}
		const now = performance.now();
		head = { x: event.clientX, y: event.clientY };
		points.push({ x: head.x, y: head.y, t: now, travel: !!target?.closest(INTERACTIVE) });
		if (points.length > MAX_POINTS * 2) points = points.slice(-MAX_POINTS);
		wake();
	}

	function onLeave() {
		head = null;
		wake();
	}

	function onScroll() {
		// Page content moved under a still pointer: drop the trail, keep the dot.
		points = [];
		wake();
	}

	function onResize() {
		sized = false;
		wake();
	}

	function onVisibility() {
		if (!document.hidden) return;
		cancelAnimationFrame(frame);
		frame = 0;
		points = [];
		head = null;
		ctx?.clearRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0);
	}

	function enable() {
		if (canvas) return;
		canvas = document.createElement('canvas');
		canvas.className = 'nozzle-cursor';
		canvas.setAttribute('aria-hidden', 'true');
		document.body.append(canvas);
		ctx = canvas.getContext('2d');
		sized = false;
		window.addEventListener('pointermove', onMove, { passive: true });
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize, { passive: true });
		window.addEventListener('blur', onLeave);
		document.documentElement.addEventListener('pointerleave', onLeave);
		document.addEventListener('visibilitychange', onVisibility);
	}

	function disable() {
		if (!canvas) return;
		cancelAnimationFrame(frame);
		frame = 0;
		points = [];
		head = null;
		window.removeEventListener('pointermove', onMove);
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('resize', onResize);
		window.removeEventListener('blur', onLeave);
		document.documentElement.removeEventListener('pointerleave', onLeave);
		document.removeEventListener('visibilitychange', onVisibility);
		canvas.remove();
		canvas = null;
		ctx = null;
	}

	function update() {
		if (fine.matches && !reduce.matches) enable();
		else disable();
	}

	update();
	fine.addEventListener('change', update);
	reduce.addEventListener('change', update);

	return () => {
		fine.removeEventListener('change', update);
		reduce.removeEventListener('change', update);
		disable();
	};
}
