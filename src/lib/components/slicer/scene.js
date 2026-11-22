/**
 * three.js view of the mini slicer. This module is the only importer of
 * three; MiniSlicer.svelte loads it with a dynamic import inside onMount, so
 * three ships only to the Flexam page and never runs during prerendering.
 *
 * The part is drawn as a translucent ghost above the current layer; the
 * toolpaths of every layer below it are drawn as lines, and the current
 * layer is highlighted with a nozzle that follows its outer perimeter.
 */
import {
	AdditiveBlending,
	BufferGeometry,
	Color,
	DirectionalLight,
	Float32BufferAttribute,
	GridHelper,
	HemisphereLight,
	LineBasicMaterial,
	LineDashedMaterial,
	LineSegments,
	Mesh,
	MeshBasicMaterial,
	MeshLambertMaterial,
	PerspectiveCamera,
	Plane,
	Points,
	PointsMaterial,
	Scene,
	SphereGeometry,
	Vector3,
	WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PART, SETTINGS, buildPartMesh, sliceLayers } from './geometry.js';

/** @typedef {import('./geometry.js').Point3} Point3 */
/** @typedef {import('./geometry.js').Layer} Layer */
/** @typedef {import('./geometry.js').SliceMode} SliceMode */

/**
 * @typedef {object} Palette Colours read from the design tokens.
 * @property {string} accent
 * @property {string} heading
 * @property {string} text
 * @property {string} muted
 * @property {string} border
 * @property {string} borderStrong
 * @property {string} background
 */

/**
 * @typedef {object} SlicerView
 * @property {(index: number) => void} setLayer 0-based layer to highlight.
 * @property {(mode: SliceMode) => void} setMode
 * @property {(playing: boolean) => void} setPlaying Auto-rotation and nozzle motion.
 * @property {() => void} destroy
 */

const PART_TOP = PART.height + PART.dome;
const TARGET = new Vector3(0, PART_TOP * 0.45, 0);
/** Bounding sphere of the part around TARGET, for framing. */
const FRAME_RADIUS = 40;
const NOZZLE_SPEED = 32;
const CATEGORIES = /** @type {const} */ (['outer', 'inner', 'infill', 'travel', 'seam']);

/** Slicer space is z-up; three.js is y-up. */
function toThree(/** @type {Point3} */ p) {
	return [p.x, p.z, -p.y];
}

/**
 * Pack every layer's moves into one vertex buffer per category (line segment
 * pairs, or points for seams), with the vertex offset at which each layer
 * starts, so showing layers 0..n is a draw-range change, not a rebuild.
 * @param {Layer[]} layers
 */
function packLayers(layers) {
	/** @type {Record<(typeof CATEGORIES)[number], number[]>} */
	const data = { outer: [], inner: [], infill: [], travel: [], seam: [] };
	/** @type {Record<(typeof CATEGORIES)[number], number[]>} */
	const starts = { outer: [0], inner: [0], infill: [0], travel: [0], seam: [0] };
	/** @param {number[]} target @param {Point3[]} points @param {boolean} closed */
	const segments = (target, points, closed) => {
		const end = closed ? points.length : points.length - 1;
		for (let index = 0; index < end; index += 1) {
			target.push(...toThree(points[index]), ...toThree(points[(index + 1) % points.length]));
		}
	};
	for (const layer of layers) {
		for (const loop of layer.outer) segments(data.outer, loop, true);
		for (const loop of layer.inner) segments(data.inner, loop, true);
		for (const line of layer.infill) segments(data.infill, line, false);
		for (const move of layer.travel) segments(data.travel, move, false);
		if (layer.seam) data.seam.push(...toThree(layer.seam));
		for (const key of CATEGORIES) starts[key].push(data[key].length / 3);
	}
	return { data, starts };
}

/**
 * Arc-length table of the current layer's first outer loop, for the nozzle.
 * @param {Layer | undefined} layer
 */
function nozzlePath(layer) {
	const loop = layer?.outer[0] ?? [];
	const points = loop.map((p) => new Vector3(...toThree(p)));
	/** @type {number[]} */
	const lengths = [0];
	for (let index = 0; index < points.length; index += 1) {
		const next = points[(index + 1) % points.length];
		lengths.push(lengths[index] + points[index].distanceTo(next));
	}
	return { points, lengths, total: lengths[lengths.length - 1] };
}

/**
 * Mount the slicer view into `host`. Throws when WebGL is unavailable, so the
 * caller can keep the static fallback.
 * @param {{
 *   host: HTMLElement,
 *   palette: Palette,
 *   mode: SliceMode,
 *   layer: number,
 *   playing: boolean,
 *   onContextChange?: (lost: boolean) => void
 * }} options
 * @returns {SlicerView}
 */
export function createSlicerView({ host, palette, mode, layer, playing, onContextChange }) {
	const renderer = new WebGLRenderer({
		antialias: true,
		alpha: true,
		powerPreference: 'low-power'
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.setClearColor(0x000000, 0);
	renderer.localClippingEnabled = true;
	const canvas = renderer.domElement;
	canvas.setAttribute('aria-hidden', 'true');
	host.append(canvas);

	const color = (/** @type {string} */ value) => new Color(value);
	const accent = color(palette.accent);
	const heading = color(palette.heading);
	const background = color(palette.background);
	const mix = (/** @type {Color} */ a, /** @type {Color} */ b, /** @type {number} */ t) =>
		a.clone().lerp(b, t);

	const scene = new Scene();
	const camera = new PerspectiveCamera(30, 1, 1, 1000);
	camera.position.set(80, 125, 95);

	scene.add(new HemisphereLight(heading, background, 1.6));
	const sun = new DirectionalLight(heading, 1.4);
	sun.position.set(60, 120, 80);
	scene.add(sun);

	const grid = new GridHelper(84, 12, color(palette.borderStrong), color(palette.border));
	scene.add(grid);

	// The unprinted part above the current layer, as a translucent ghost.
	const clip = new Plane(new Vector3(0, 1, 0), 0);
	const mesh = buildPartMesh();
	const partGeometry = new BufferGeometry();
	const partPositions = new Float32Array(mesh.positions.length);
	for (let index = 0; index < mesh.positions.length; index += 3) {
		partPositions[index] = mesh.positions[index];
		partPositions[index + 1] = mesh.positions[index + 2];
		partPositions[index + 2] = -mesh.positions[index + 1];
	}
	partGeometry.setAttribute('position', new Float32BufferAttribute(partPositions, 3));
	partGeometry.setIndex(mesh.indices);
	partGeometry.computeVertexNormals();
	const ghostMaterial = new MeshLambertMaterial({
		color: color(palette.muted),
		transparent: true,
		opacity: 0.2,
		depthWrite: false,
		clippingPlanes: [clip]
	});
	scene.add(new Mesh(partGeometry, ghostMaterial));

	// Line materials: printed layers below, the current layer bright.
	const materials = {
		past: {
			outer: new LineBasicMaterial({ color: accent, transparent: true, opacity: 0.9 }),
			inner: new LineBasicMaterial({
				color: mix(accent, background, 0.35),
				transparent: true,
				opacity: 0.8
			}),
			infill: new LineBasicMaterial({
				color: mix(accent, background, 0.6),
				transparent: true,
				opacity: 0.7
			}),
			travel: new LineBasicMaterial({ visible: false }),
			seam: new PointsMaterial({
				color: mix(heading, accent, 0.3),
				size: 2.5,
				sizeAttenuation: false
			})
		},
		current: {
			outer: new LineBasicMaterial({ color: heading }),
			inner: new LineBasicMaterial({ color: accent }),
			infill: new LineBasicMaterial({ color: mix(accent, heading, 0.35) }),
			travel: new LineDashedMaterial({ color: color(palette.text), dashSize: 1.2, gapSize: 1.6 }),
			seam: new PointsMaterial({ color: heading, size: 6, sizeAttenuation: false })
		}
	};

	/** @type {{ past: Record<string, LineSegments | Points>, current: Record<string, LineSegments | Points> } | null} */
	let objects = null;
	/** @type {Record<(typeof CATEGORIES)[number], number[]> | null} */
	let starts = null;
	/** @type {Partial<Record<SliceMode, Layer[]>>} */
	const sliced = {};
	/** @type {Layer[]} */
	let layers = [];
	let current = layer;

	const nozzle = new Mesh(
		new SphereGeometry(0.9, 16, 12),
		new MeshBasicMaterial({ color: heading })
	);
	const halo = new Mesh(
		new SphereGeometry(2.6, 16, 12),
		new MeshBasicMaterial({
			color: accent,
			transparent: true,
			opacity: 0.3,
			depthWrite: false,
			blending: AdditiveBlending
		})
	);
	scene.add(nozzle, halo);
	let path = nozzlePath(undefined);
	let travelled = 0;

	function placeNozzle() {
		const { points, lengths, total } = path;
		nozzle.visible = halo.visible = points.length > 1;
		if (!nozzle.visible) return;
		const distance = total ? travelled % total : 0;
		let index = 0;
		while (index < points.length - 1 && lengths[index + 1] < distance) index += 1;
		const span = lengths[index + 1] - lengths[index] || 1;
		const point = points[index]
			.clone()
			.lerp(points[(index + 1) % points.length], (distance - lengths[index]) / span);
		nozzle.position.copy(point);
		halo.position.copy(point);
	}

	function disposeObjects() {
		if (!objects) return;
		for (const group of [objects.past, objects.current]) {
			for (const object of Object.values(group)) {
				scene.remove(object);
				object.geometry.dispose();
			}
		}
		objects = null;
	}

	/** @param {SliceMode} next */
	function build(next) {
		layers = sliced[next] ??= sliceLayers(mesh, next);
		const packed = packLayers(layers);
		starts = packed.starts;
		disposeObjects();
		/** @type {Record<string, LineSegments | Points>} */
		const past = {};
		/** @type {Record<string, LineSegments | Points>} */
		const now = {};
		for (const key of CATEGORIES) {
			const attribute = new Float32BufferAttribute(packed.data[key], 3);
			const make = (/** @type {'past' | 'current'} */ which) => {
				const geometry = new BufferGeometry();
				geometry.setAttribute('position', attribute);
				const material = materials[which][key];
				/** @type {LineSegments | Points} */
				let object;
				if (key === 'seam') {
					object = new Points(geometry, /** @type {PointsMaterial} */ (material));
				} else {
					const lines = new LineSegments(geometry, material);
					if (key === 'travel') lines.computeLineDistances();
					object = lines;
				}
				object.frustumCulled = false;
				scene.add(object);
				return object;
			};
			past[key] = make('past');
			now[key] = make('current');
		}
		objects = { past, current: now };
		show(Math.min(current, layers.length - 1));
	}

	/** @param {number} index */
	function show(index) {
		current = Math.min(Math.max(index, 0), layers.length - 1);
		if (!objects || !starts) return;
		for (const key of CATEGORIES) {
			const at = starts[key];
			objects.past[key].geometry.setDrawRange(0, at[current]);
			objects.current[key].geometry.setDrawRange(at[current], at[current + 1] - at[current]);
		}
		const level = layers[current]?.level ?? 0;
		// Ghost the part from the top of the current layer upward.
		clip.constant = -(level + SETTINGS.layerHeight / 2);
		path = nozzlePath(layers[current]);
		travelled = 0;
		placeNozzle();
	}

	const controls = new OrbitControls(camera, canvas);
	controls.target.copy(TARGET);
	controls.enableZoom = false;
	controls.enablePan = false;
	controls.enableDamping = true;
	controls.dampingFactor = 0.08;
	controls.autoRotateSpeed = 1.4;
	controls.minPolarAngle = 0.25;
	controls.maxPolarAngle = Math.PI / 2 - 0.05;
	// OrbitControls blocks all touch scrolling; keep vertical page scroll on
	// touch screens and rotate with horizontal drags.
	canvas.style.touchAction = 'pan-y';

	let isPlaying = playing;
	let onScreen = false;
	let pageVisible = document.visibilityState === 'visible';
	let settleUntil = 0;
	let frame = 0;
	let last = 0;
	let ticking = false;
	let destroyed = false;

	const looping = () => onScreen && pageVisible && (isPlaying || performance.now() < settleUntil);

	/** @param {number} now */
	function tick(now) {
		frame = 0;
		if (destroyed) return;
		// controls.update() emits 'change'; don't let it schedule a second frame.
		ticking = true;
		const delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
		last = now;
		controls.autoRotate = isPlaying;
		controls.update(delta);
		if (isPlaying) {
			travelled += NOZZLE_SPEED * delta;
			placeNozzle();
		}
		renderer.render(scene, camera);
		ticking = false;
		if (looping()) frame = requestAnimationFrame(tick);
		else last = 0;
	}
	/** Schedule one frame; at most one is ever pending. */
	function request() {
		if (destroyed || ticking || frame || !onScreen || !pageVisible) return;
		frame = requestAnimationFrame(tick);
	}

	controls.addEventListener('start', () => {
		settleUntil = Infinity;
		request();
	});
	controls.addEventListener('end', () => {
		settleUntil = performance.now() + 1500;
	});
	controls.addEventListener('change', request);

	function resize() {
		const width = host.clientWidth;
		const height = host.clientHeight;
		if (!width || !height) return;
		renderer.setSize(width, height, false);
		camera.aspect = width / height;
		// Fit the part's bounding sphere in the narrower field of view.
		const vertical = (camera.fov * Math.PI) / 360;
		const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
		const distance = (FRAME_RADIUS / Math.sin(Math.min(vertical, horizontal))) * 1.02;
		const offset = camera.position.clone().sub(controls.target).setLength(distance);
		camera.position.copy(controls.target).add(offset);
		camera.updateProjectionMatrix();
		request();
	}
	const resizer = new ResizeObserver(resize);
	resizer.observe(host);

	const visibility = new IntersectionObserver((entries) => {
		onScreen = entries.some((entry) => entry.isIntersecting);
		request();
	});
	visibility.observe(host);
	const onVisibility = () => {
		pageVisible = document.visibilityState === 'visible';
		request();
	};
	document.addEventListener('visibilitychange', onVisibility);
	const lost = (/** @type {Event} */ event) => {
		// Allow the browser to restore the context; three.js rebuilds on restore.
		event.preventDefault();
		onContextChange?.(true);
	};
	const restored = () => {
		onContextChange?.(false);
		request();
	};
	canvas.addEventListener('webglcontextlost', lost);
	canvas.addEventListener('webglcontextrestored', restored);

	build(mode);
	resize();

	return {
		setLayer(index) {
			show(index);
			request();
		},
		setMode(next) {
			build(next);
			request();
		},
		setPlaying(value) {
			isPlaying = value;
			if (!value) {
				travelled = 0;
				placeNozzle();
			}
			request();
		},
		destroy() {
			destroyed = true;
			cancelAnimationFrame(frame);
			frame = 0;
			resizer.disconnect();
			visibility.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			canvas.removeEventListener('webglcontextlost', lost);
			canvas.removeEventListener('webglcontextrestored', restored);
			controls.dispose();
			disposeObjects();
			partGeometry.dispose();
			ghostMaterial.dispose();
			for (const group of Object.values(materials)) {
				for (const material of Object.values(group)) material.dispose();
			}
			for (const object of [nozzle, halo]) {
				object.geometry.dispose();
				/** @type {MeshBasicMaterial} */ (object.material).dispose();
			}
			grid.dispose();
			renderer.dispose();
			canvas.remove();
		}
	};
}
