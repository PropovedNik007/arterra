<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;

	interface Point {
		x: number;
		y: number;
		originX: number;
		originY: number;
		closest?: Point[];
		circle?: Circle;
		active?: number;
	}

	class Circle {
		pos: Point;
		radius: number;
		active?: number;
		context: CanvasRenderingContext2D;

		constructor(pos: Point, radius: number, context: CanvasRenderingContext2D) {
			this.pos = pos;
			this.radius = radius;
			this.context = context;
		}

		draw() {
			if (!this.active) return;
			this.context.beginPath();
			this.context.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
			this.context.fillStyle = `rgba(156,217,249,${this.active})`;
			this.context.fill();
		}
	}

	onMount(() => {
		let context = canvas.getContext('2d')!;
		let width = window.innerWidth;
		let height = window.innerHeight;
		let points: Point[] = [];
		let target = { x: width / 2, y: height / 2 };
		let animateHeader = true;
		let frame = 0;
		let disposed = false;
		let gsapContext: typeof import('gsap').gsap | null = null;

		const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
			Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);

		function initHeader() {
			width = window.innerWidth;
			height = window.innerHeight;
			target = { x: width / 2, y: height / 2 };
			canvas.width = width;
			canvas.height = height;
			context = canvas.getContext('2d')!;

			points = [];
			for (let x = 0; x < width; x += width / 20) {
				for (let y = 0; y < height; y += height / 20) {
					const px = x + Math.random() * (width / 20);
					const py = y + Math.random() * (height / 20);
					points.push({ x: px, originX: px, y: py, originY: py });
				}
			}

			for (const point of points) {
				const closest: Point[] = [];
				for (const candidate of points) {
					if (point === candidate) continue;
					let placed = false;
					for (let index = 0; index < 5; index += 1) {
						if (!placed && closest[index] === undefined) {
							closest[index] = candidate;
							placed = true;
						}
					}
					for (let index = 0; index < 5; index += 1) {
						if (!placed && getDistance(point, candidate) < getDistance(point, closest[index])) {
							closest[index] = candidate;
							placed = true;
						}
					}
				}
				point.closest = closest;
				point.circle = new Circle(point, 2 + Math.random() * 2, context);
			}
		}

		function drawLines(point: Point) {
			if (!point.active) return;
			for (const closest of point.closest!) {
				context.beginPath();
				context.moveTo(point.x, point.y);
				context.lineTo(closest.x, closest.y);
				context.strokeStyle = `rgba(156,217,249,${point.active})`;
				context.stroke();
			}
		}

		function shiftPoint(point: Point) {
			if (!gsapContext || disposed) return;
			gsapContext.to(point, {
				duration: 1 + Math.random(),
				x: point.originX - 50 + Math.random() * 100,
				y: point.originY - 50 + Math.random() * 100,
				ease: 'circ.inOut',
				onComplete: () => shiftPoint(point)
			});
		}

		function animate() {
			if (animateHeader) {
				context.clearRect(0, 0, width, height);
				for (const point of points) {
					const distance = Math.abs(getDistance(target, point));
					if (distance < 4000) {
						point.active = 0.3;
						point.circle!.active = 0.6;
					} else if (distance < 20000) {
						point.active = 0.1;
						point.circle!.active = 0.3;
					} else if (distance < 40000) {
						point.active = 0.02;
						point.circle!.active = 0.1;
					} else {
						point.active = 0;
						point.circle!.active = 0;
					}
					drawLines(point);
					point.circle!.draw();
				}
			}
			frame = requestAnimationFrame(animate);
		}

		function mouseMove(event: MouseEvent) {
			target.x = event.pageX;
			target.y = event.pageY;
		}

		function scrollCheck() {
			animateHeader = window.scrollY <= height;
		}

		function resize() {
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = width;
			canvas.height = height;
		}

		initHeader();
		import('gsap').then(({ gsap }) => {
			if (disposed) return;
			gsapContext = gsap;
			for (const point of points) shiftPoint(point);
		});
		animate();
		if (!('ontouchstart' in window)) window.addEventListener('mousemove', mouseMove);
		window.addEventListener('scroll', scrollCheck);
		window.addEventListener('resize', resize);

		return () => {
			disposed = true;
			cancelAnimationFrame(frame);
			gsapContext?.killTweensOf(points);
			window.removeEventListener('mousemove', mouseMove);
			window.removeEventListener('scroll', scrollCheck);
			window.removeEventListener('resize', resize);
		};
	});
</script>

<canvas id="demo-canvas" bind:this={canvas} aria-hidden="true"></canvas>

<style>
	#demo-canvas {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 1;
		pointer-events: none;
	}
</style>
