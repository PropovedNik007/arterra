<script module>
	import hero from '#lib/design/ornaments/hero.json';
	import { parsePath } from '#lib/design/ornaments/geometry.js';
	import { solveArm } from '#lib/design/ornaments/ik.js';

	/** @typedef {{ x: number, y: number }} Point */

	/** Scene in SVG user units; the arm stands left of the print, which sits on the right. */
	const VIEW = '0 -30 1000 750';
	const ORNAMENT = { cx: 680, cy: 340, scale: 0.6 };
	const ORNAMENT_TRANSFORM = `translate(${ORNAMENT.cx} ${ORNAMENT.cy}) scale(${ORNAMENT.scale}) translate(-500 -500)`;
	/** Shoulder on its pedestal, link lengths, and a nozzle that always points down. */
	const ARM = { base: { x: 190, y: 600 }, upper: 440, fore: 420, tool: 60 };
	/** Parked nozzle: up and to the left of the print, clear of the skirt. */
	const REST = { x: 470, y: 110 };
	/** Pointer targets are kept over the print bed, so the elbow stays in the scene. */
	const BED = { x0: 420, x1: 980, y0: 60, y1: 640 };
	const FLOOR = 700;

	/** @param {Point} p hero (1000×1000) coordinates */
	const toScene = (p) => ({
		x: ORNAMENT.cx + (p.x - 500) * ORNAMENT.scale,
		y: ORNAMENT.cy + (p.y - 500) * ORNAMENT.scale
	});

	/**
	 * A link drawn as a printed part: a stadium along +x, as two perimeters.
	 * @param {number} length
	 * @param {number} radius
	 */
	const stadium = (length, radius) =>
		`M0 ${-radius}H${length}A${radius} ${radius} 0 0 1 ${length} ${radius}H0A${radius} ${radius} 0 0 1 0 ${-radius}Z`;
	/** @param {number} radius */
	const ring = (radius) =>
		`M0 ${-radius}A${radius} ${radius} 0 1 1 0 ${radius}A${radius} ${radius} 0 1 1 0 ${-radius}Z`;

	/** Pedestal: a trapezoid with two perimeters and a serpentine infill. */
	const PEDESTAL = (() => {
		const cx = ARM.base.x;
		const top = 616;
		const bottom = FLOOR;
		/** @param {number} inset */
		const loop = (inset) => {
			const t = 70 - inset;
			const b = 104 - inset;
			return `M${cx - t} ${top + inset}H${cx + t}L${cx + b} ${bottom - inset}H${cx - b}Z`;
		};
		const fill = [];
		const inset = 16;
		for (let y = top + inset, row = 0; y <= bottom - inset; y += 9, row += 1) {
			const k = (y - top) / (bottom - top);
			const half = 70 + (104 - 70) * k - inset;
			const [from, to] = row % 2 ? [cx + half, cx - half] : [cx - half, cx + half];
			fill.push(`${row ? 'L' : 'M'}${from.toFixed(1)} ${y}H${to.toFixed(1)}`);
		}
		return {
			perimeters: loop(0) + loop(8),
			infill: fill.join(''),
			seams: `M${cx - 70} ${top}h0M${cx - 62} ${top + 8}h0`
		};
	})();

	const LINKS = {
		upper: { outer: stadium(ARM.upper, 24), inner: stadium(ARM.upper, 16) },
		fore: { outer: stadium(ARM.fore, 20), inner: stadium(ARM.fore, 12) },
		tool: {
			outer: `M0 -11H${ARM.tool - 16}L${ARM.tool} 0L${ARM.tool - 16} 11H0A11 11 0 0 1 0 -11Z`,
			inner: `M0 -5H${ARM.tool - 22}L${ARM.tool - 12} 0L${ARM.tool - 22} 5H0A5 5 0 0 1 0 -5Z`
		}
	};
	const JOINTS = {
		shoulder: [ring(36), ring(28)],
		elbow: [ring(28), ring(20)],
		wrist: [ring(19), ring(12)]
	};

	/** Arm outlines (the skirt is left out of the trace), in scene units. */
	const TRACE_LOOPS = hero.outlines.slice(1).map((d) => parsePath(d)[0].points.map(toScene));
	const SEAMS = hero.seams.map((p) => `M${p.x} ${p.y}h0`).join('');

	/** @param {number} radians */
	const degrees = (radians) => ((radians * 180) / Math.PI).toFixed(2);
	const restPose = solveArm(ARM, REST);
</script>

<script>
	import { planTrace, sampleTrace } from './trace.js';
	import { smoothing } from '#lib/design/ornaments/ik.js';

	/**
	 * A three-joint robot arm printing Arevakhach, the Armenian eternity sign,
	 * in the same slicer-preview style as the site's ornaments. Decorative only
	 * (aria-hidden). Server render, no JS and reduced motion all show the
	 * finished layer with the arm parked. With motion allowed it prints the
	 * layer once and parks (about four seconds in all); on a mouse or trackpad the
	 * nozzle also follows the pointer, and resumes printing when it rests.
	 *
	 * @type {{ class?: string }}
	 */
	let { class: className = '' } = $props();

	/** @type {'static' | 'printing' | 'done'} */
	let phase = $state('static');
	/** @type {SVGSVGElement | undefined} */
	let svg = $state();
	/** @type {SVGGElement | undefined} */
	let upperJoint = $state();
	/** @type {SVGGElement | undefined} */
	let foreJoint = $state();
	/** @type {SVGGElement | undefined} */
	let toolJoint = $state();
	/** @type {SVGPathElement[]} */
	const deposits = $state([]);

	const PRINT_SECONDS = 3.4;
	const IDLE_MS = 1200;

	$effect(() => {
		if (!svg || !upperJoint || !foreJoint || !toolJoint) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (!('IntersectionObserver' in window)) return;
		const root = svg;
		const joints = [upperJoint, foreJoint, toolJoint];
		const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
		const plan = planTrace(TRACE_LOOPS, { from: REST, duration: PRINT_SECONDS });

		const nozzle = { ...REST };
		/** @type {Point | null} */
		let pointer = null;
		let lastPointer = -Infinity;
		let time = 0;
		let hint = 0;
		let filled = 0;
		let locked = false;
		let finished = false;
		let visible = false;
		let running = false;
		let frame = 0;
		let previous = 0;
		/** @type {DOMMatrix | null} */
		let screenToScene = null;

		/** @param {Point} target @param {number} factor */
		const approach = (target, factor) => {
			nozzle.x += (target.x - nozzle.x) * factor;
			nozzle.y += (target.y - nozzle.y) * factor;
			return Math.hypot(target.x - nozzle.x, target.y - nozzle.y);
		};

		const pose = () => {
			const { shoulder, elbow, wrist } = solveArm(ARM, nozzle);
			joints[0].setAttribute('transform', `rotate(${degrees(shoulder)})`);
			joints[1].setAttribute('transform', `rotate(${degrees(elbow)})`);
			joints[2].setAttribute('transform', `rotate(${degrees(wrist)})`);
		};

		/** Deposit everything printed up to the current plan time. */
		const deposit = () => {
			const sample = sampleTrace(plan, time, hint);
			hint = sample.index;
			for (; filled < sample.index; filled += 1) {
				const done = plan.moves[filled];
				if (done.island >= 0) deposits[done.island]?.setAttribute('stroke-dashoffset', '0');
			}
			const move = plan.moves[sample.index];
			if (move?.island >= 0) {
				deposits[move.island]?.setAttribute('stroke-dashoffset', String(1 - sample.fraction));
			}
			return sample.point;
		};

		/** @param {number} now */
		const tick = (now) => {
			const dt = Math.min(0.05, (now - previous) / 1000);
			previous = now;
			const following = finePointer && pointer && now - lastPointer < IDLE_MS;
			let settled = false;
			if (following && pointer) {
				approach(pointer, smoothing(dt, 0.12));
				locked = false;
			} else if (!finished) {
				const target = deposit();
				if (locked) {
					nozzle.x = target.x;
					nozzle.y = target.y;
					time += dt;
					if (time >= plan.duration) {
						time = plan.duration;
						deposit();
						finished = true;
						phase = 'done';
					}
				} else if (approach(target, smoothing(dt, 0.16)) < 3) {
					locked = true;
				}
			} else {
				settled = approach(REST, smoothing(dt, 0.15)) < 2;
			}
			pose();
			// Sleep once parked (or off-screen); a pointer move or scroll back wakes it.
			if (settled || !visible) {
				running = false;
				return;
			}
			frame = requestAnimationFrame(tick);
		};

		const wake = () => {
			if (running || !visible) return;
			running = true;
			previous = performance.now();
			frame = requestAnimationFrame(tick);
		};

		// Clear the bed right away (before the first paint of a client-side
		// render); printing starts once the scene is on screen.
		for (const path of deposits) path?.setAttribute('stroke-dashoffset', '1');
		phase = 'printing';
		const observer = new IntersectionObserver(
			(entries) => {
				visible = entries.some((entry) => entry.isIntersecting);
				wake();
			},
			{ threshold: 0.25 }
		);
		observer.observe(root);

		/** @param {PointerEvent} event */
		const onPointerMove = (event) => {
			if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
			screenToScene ??= root.getScreenCTM()?.inverse() ?? null;
			if (!screenToScene) return;
			const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(screenToScene);
			pointer = {
				x: Math.min(BED.x1, Math.max(BED.x0, p.x)),
				y: Math.min(BED.y1, Math.max(BED.y0, p.y))
			};
			lastPointer = performance.now();
			wake();
		};
		const onLeave = () => {
			lastPointer = -Infinity;
			wake();
		};
		const invalidate = () => {
			screenToScene = null;
		};

		if (finePointer) {
			window.addEventListener('pointermove', onPointerMove, { passive: true });
			document.documentElement.addEventListener('pointerleave', onLeave);
			window.addEventListener('blur', onLeave);
			window.addEventListener('scroll', invalidate, { passive: true });
			window.addEventListener('resize', invalidate, { passive: true });
		}

		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			window.removeEventListener('pointermove', onPointerMove);
			document.documentElement.removeEventListener('pointerleave', onLeave);
			window.removeEventListener('blur', onLeave);
			window.removeEventListener('scroll', invalidate);
			window.removeEventListener('resize', invalidate);
		};
	});
</script>

<svg
	bind:this={svg}
	class="robot-arm {className}"
	data-phase={phase}
	viewBox={VIEW}
	preserveAspectRatio="xMidYMid meet"
	focusable="false"
	aria-hidden="true"
>
	<!-- Build plate edge. -->
	<path class="floor" d="M30 {FLOOR + 6}H990" />

	<g class="print" transform={ORNAMENT_TRANSFORM}>
		<g class="layer">
			<path class="travel" d={hero.travel.join('')} />
			<path class="infill" d={hero.infill.join('')} />
			<path class="perimeter" d={hero.perimeters.join('')} />
			<path class="seams" d={SEAMS} />
		</g>
		<g class="deposit">
			{#each hero.outlines.slice(1) as d, index (index)}
				<path
					bind:this={deposits[index]}
					{d}
					pathLength="1"
					stroke-dasharray="1 1"
					stroke-dashoffset="1"
				/>
			{/each}
		</g>
	</g>

	<g class="arm">
		<g class="pedestal">
			<path class="infill" d={PEDESTAL.infill} />
			<path class="part" d={PEDESTAL.perimeters} />
			<path class="seams" d={PEDESTAL.seams} />
		</g>
		<g transform="translate({ARM.base.x} {ARM.base.y})">
			<g bind:this={upperJoint} transform="rotate({degrees(restPose.shoulder)})">
				<path class="part" d={LINKS.upper.outer + LINKS.upper.inner} />
				<path class="part joint" d={JOINTS.shoulder.join('')} />
				<path class="seams" d="M0 -36h0M{ARM.upper} -24h0" />
				<g transform="translate({ARM.upper} 0)">
					<g bind:this={foreJoint} transform="rotate({degrees(restPose.elbow)})">
						<path class="part" d={LINKS.fore.outer + LINKS.fore.inner} />
						<path class="part joint" d={JOINTS.elbow.join('')} />
						<path class="seams" d="M0 -28h0M{ARM.fore} -20h0" />
						<g transform="translate({ARM.fore} 0)">
							<g bind:this={toolJoint} transform="rotate({degrees(restPose.wrist)})">
								<path class="part" d={LINKS.tool.outer + LINKS.tool.inner} />
								<path class="part joint" d={JOINTS.wrist.join('')} />
								<path class="seams" d="M0 -19h0" />
								<g class="nozzle" transform="translate({ARM.tool} 0)">
									<path class="glow" d="M0 0h0" />
									<path class="bead" d="M0 0h0" />
								</g>
							</g>
						</g>
					</g>
				</g>
			</g>
		</g>
	</g>
</svg>

<style>
	.robot-arm {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 1000 / 750;
		overflow: visible;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		pointer-events: none;
		user-select: none;
	}
	path {
		vector-effect: non-scaling-stroke;
	}

	/* The printed layer, in the section accent. */
	.print {
		color: var(--accent);
	}
	.layer {
		opacity: 0.55;
		transition: opacity 900ms ease;
	}
	.layer .perimeter {
		stroke-width: 1.1;
	}
	.layer .infill {
		stroke-width: 0.7;
		stroke-opacity: 0.6;
	}
	.layer .travel,
	.floor {
		stroke-width: 0.8;
		stroke-opacity: 0.55;
		stroke-dasharray: 3 6;
	}
	.seams {
		stroke-width: 4;
	}
	/* Fresh extrusion: brighter than the settled layer, drawn as the nozzle passes. */
	.deposit {
		stroke-width: 1.6;
		opacity: 0;
		transition: opacity 900ms ease;
	}
	[data-phase='printing'] .layer {
		opacity: 0;
		transition: none;
	}
	[data-phase='printing'] .deposit {
		opacity: 0.95;
		transition: none;
	}

	/* The machine, in muted ink, so the print stays the subject. */
	.arm,
	.floor {
		color: var(--color-text-muted);
	}
	.part {
		stroke-width: 1.1;
	}
	.joint {
		stroke-width: 1.3;
	}
	.pedestal .infill {
		stroke-width: 0.7;
		stroke-opacity: 0.45;
	}
	.arm .seams {
		stroke-width: 3.5;
	}
	.nozzle {
		color: var(--accent);
	}
	.nozzle .glow {
		stroke-width: 16;
		stroke-opacity: 0.22;
	}
	.nozzle .bead {
		stroke-width: 6;
		color: var(--color-heading);
	}
	[data-phase='printing'] .nozzle .glow {
		stroke-width: 22;
		stroke-opacity: 0.35;
	}
</style>
