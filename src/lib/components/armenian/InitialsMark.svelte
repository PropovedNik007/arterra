<script>
	// Precomputed by scripts/build-ornaments.mjs (from letters.js): pages never
	// run the distance-field tracing themselves.
	import initials from '#lib/design/ornaments/initials.json';

	/**
	 * The owner's initials in Armenian capitals (ԱՍ) drawn as a printed
	 * monogram: two perimeters per glyph and nothing else, so no full stops,
	 * seam dots or dotted travel moves read as punctuation between the letters.
	 * Purely decorative (aria-hidden); the visible name next to it carries the
	 * meaning.
	 *
	 * Set `printing` to draw it again once, stroke by stroke; `onprinted` fires
	 * when the last perimeter finishes so the caller can re-arm it. The default
	 * (SSR, no JS, reduced motion) is the finished drawing.
	 *
	 * @type {{
	 *   class?: string,
	 *   printing?: boolean,
	 *   duration?: number,
	 *   onprinted?: () => void
	 * }}
	 */
	let { class: className = '', printing = false, duration = 1.1, onprinted } = $props();

	/** @type {import('#lib/design/ornaments/letters.js').InitialsMark} */
	const mark = initials;
	const total = mark.islands.reduce(
		(sum, island) => sum + island.lengths.reduce((a, b) => a + b, 0),
		0
	);
	/** Every loop with its share of the pass and when it starts, in print order. */
	const loops = (() => {
		let start = 0;
		return mark.islands.flatMap((island) =>
			island.loops.map((d, index) => {
				const share = island.lengths[index] / total;
				const loop = { d, delay: start, share };
				start += share;
				return loop;
			})
		);
	})();
	const last = loops.length - 1;
</script>

<svg
	class="initials-mark {className}"
	class:printing
	viewBox={mark.viewBox}
	style:aspect-ratio="{mark.width} / {mark.height}"
	style:--print-duration="{duration}s"
	focusable="false"
	aria-hidden="true"
>
	{#each loops as loop, index (index)}
		<path
			class="perimeter"
			d={loop.d}
			pathLength="1"
			style:--delay={loop.delay}
			style:--share={loop.share}
			onanimationend={index === last ? () => onprinted?.() : undefined}
		/>
	{/each}
</svg>

<style>
	.initials-mark {
		display: block;
		flex: none;
		height: var(--mark-height, 2rem);
		width: auto;
		overflow: visible;
		color: var(--mark-ink, var(--accent));
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.perimeter {
		vector-effect: non-scaling-stroke;
		stroke-width: var(--mark-stroke, 1);
	}

	/* One pass: each loop draws in turn at a constant feed rate. Only ever
	   armed from script. */
	@media (prefers-reduced-motion: no-preference) {
		.printing .perimeter {
			stroke-dasharray: 1 1;
			animation: mark-print calc(var(--print-duration) * var(--share)) linear
				calc(var(--print-duration) * var(--delay)) both;
		}
	}
	@keyframes mark-print {
		from {
			stroke-dashoffset: 1;
		}
		to {
			stroke-dashoffset: 0;
		}
	}
</style>
