<script>
	// @ts-nocheck -- Sigma, graphology and d3-force are loaded only in the browser.
	import { tick, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { sitePath, staticPath } from '#lib/paths.js';

	/**
	 * Interactive knowledge graph.
	 * - graphData: GraphData from #lib/graph/build.js, already filtered by the caller.
	 * - compact: embedded mini map (no toolbar, page scroll is never hijacked).
	 * - focus: node id to emphasise and centre (detail-page "How this connects").
	 */
	let {
		graphData,
		compact = false,
		focus = null,
		title = 'Connected work',
		eyebrow = 'Knowledge map',
		showFullLink = compact
	} = $props();

	// ---------------------------------------------------------------- vocabulary

	/** Filter categories; hubs never hide. */
	const FILTERS = [
		{ id: 'projects', label: 'Projects', tone: 'projects' },
		{ id: 'diy', label: 'DIY', tone: 'diy' },
		{ id: 'sport', label: 'Sport', tone: 'sport' },
		{ id: 'fields', label: 'Fields', tone: 'field' },
		{ id: 'orgs', label: 'Organisations', tone: 'org' },
		{ id: 'topics', label: 'Tools & topics', tone: 'topic' }
	];

	/** Grouping used by the details panel and the list fallback. */
	const GROUPS = [
		{
			id: 'projects',
			label: 'Projects',
			test: (n) => n.kind === 'item' && n.section === 'projects'
		},
		{ id: 'diy', label: 'DIY notes', test: (n) => n.kind === 'item' && n.section === 'diy' },
		{ id: 'sport', label: 'Sport notes', test: (n) => n.kind === 'item' && n.section === 'sport' },
		{ id: 'sections', label: 'Sections', test: (n) => n.kind === 'hub' || n.kind === 'discipline' },
		{ id: 'domains', label: 'Domains', test: (n) => n.kind === 'domain' },
		{ id: 'fields', label: 'Fields of work', test: (n) => n.kind === 'field' },
		{ id: 'orgs', label: 'Organisations', test: (n) => n.kind === 'org' },
		{ id: 'topics', label: 'Tools & topics', test: (n) => n.kind === 'topic' }
	];

	const TONE_VAR = {
		projects: 'var(--accent-projects)',
		diy: 'var(--accent-diy)',
		sport: 'var(--accent-sport)',
		field: 'var(--graph-field)',
		org: 'var(--graph-org)',
		topic: 'var(--graph-topic)'
	};
	const TONE_LABEL = {
		projects: 'Projects',
		diy: 'DIY',
		sport: 'Sport',
		field: 'Fields of work',
		org: 'Organisations',
		topic: 'Tools & topics'
	};

	/** Node radius (px at zoom 1): base by kind, plus growth per connection. */
	const SIZE_BASE = { hub: 19, domain: 12, discipline: 9, field: 8, item: 7, org: 5, topic: 4.2 };
	const SIZE_GROWTH = {
		hub: 0,
		domain: 0.2,
		discipline: 0.3,
		field: 0.35,
		item: 0.3,
		org: 0.35,
		topic: 0.3
	};
	/** Many-body charge by kind (scaled by degree and layout unit). */
	const CHARGE = {
		hub: -900,
		domain: -520,
		discipline: -260,
		field: -400,
		item: -340,
		org: -130,
		topic: -120
	};
	/** Spring [distance, strength] per edge kind. */
	const SPRING = {
		taxonomy: [240, 0.2],
		section: [80, 0.8],
		discipline: [56, 0.9],
		domain: [72, 0.85],
		field: [135, 0.3],
		org: [62, 0.6],
		topic: [105, 0.12],
		link: [95, 0.6]
	};
	/** Edge [alpha, width, zIndex]; highlighted edges get brighter and thicker. */
	const EDGE_STYLE = {
		taxonomy: [0.4, 1.4, 2],
		section: [0.55, 1.3, 2],
		discipline: [0.55, 1.2, 2],
		domain: [0.6, 1.4, 2],
		field: [0.3, 0.8, 1],
		org: [0.45, 1, 1],
		topic: [0.14, 0.6, 0],
		link: [0.75, 1.5, 2]
	};
	const NAVIGABLE = new Set(['item', 'hub', 'discipline']);
	const KIND_ORDER = ['hub', 'domain', 'discipline', 'field', 'item', 'org', 'topic'];

	/** @param {{ kind: string, section?: string }} node */
	function categoryOf(node) {
		switch (node.kind) {
			case 'item':
				return node.section ?? null;
			case 'discipline':
				return 'sport';
			case 'domain':
			case 'field':
				return 'fields';
			case 'org':
				return 'orgs';
			case 'topic':
				return 'topics';
			default:
				return null;
		}
	}

	/** Deterministic string hash (FNV-1a) for seeding positions. */
	function hash(value) {
		let h = 2166136261;
		for (let i = 0; i < value.length; i++) {
			h ^= value.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		return h >>> 0;
	}

	const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
	const plural = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;
	const hrefOf = (node) => (node?.href ? sitePath(node.href) : null);
	const coverOf = (cover) =>
		!cover || /^https?:/.test(cover) ? cover : staticPath(cover.replace(/^\//, ''));
	const byLabel = (a, b) =>
		Number(!!b.featured) - Number(!!a.featured) || a.label.localeCompare(b.label);

	function openLabel(node) {
		if (node.kind === 'item') return node.section === 'projects' ? 'Open project' : 'Read note';
		return `Open ${node.label}`;
	}
	function hintFor(node) {
		// The focus node is the page being read: clicking it only selects it.
		if (node.id === focus) return 'Click to see its connections';
		if (node.kind === 'item')
			return node.section === 'projects' ? 'Click to open project' : 'Click to read note';
		if (node.kind === 'hub' || node.kind === 'discipline') return 'Click to open section';
		return 'Click to explore connections';
	}

	// ---------------------------------------------------------------- static model

	function buildModel(data) {
		const nodes = data?.nodes ?? [];
		const byId = new Map(nodes.map((node) => [node.id, node]));
		const edges = (data?.edges ?? []).filter(
			(edge) => edge.source !== edge.target && byId.has(edge.source) && byId.has(edge.target)
		);
		/** @type {Map<string, string[]>} */
		const adj = new Map(nodes.map((node) => [node.id, []]));
		for (const edge of edges) {
			adj.get(edge.source).push(edge.target);
			adj.get(edge.target).push(edge.source);
		}
		// Chip counts match the page stats: notes, fields, organisations, topics
		// (domains and disciplines hide with their category but aren't counted).
		const counts = {};
		for (const node of nodes) {
			const category = categoryOf(node);
			if (!category) continue;
			const primary = node.kind !== 'domain' && node.kind !== 'discipline';
			counts[category] = (counts[category] ?? 0) + (primary ? 1 : 0);
			if (!primary && !counts[category]) counts[category] = 0;
		}
		const kinds = {};
		for (const node of nodes) kinds[node.kind] = (kinds[node.kind] ?? 0) + 1;
		const tones = [...new Set(nodes.map((node) => node.tone))].sort(
			(a, b) => Object.keys(TONE_VAR).indexOf(a) - Object.keys(TONE_VAR).indexOf(b)
		);
		return { nodes, edges, byId, adj, counts, kinds, tones };
	}

	let model = $derived(buildModel(graphData));
	let summary = $derived(
		[
			'Knowledge graph',
			[
				model.kinds.item && plural(model.kinds.item, 'note'),
				model.kinds.field && plural(model.kinds.field, 'field'),
				model.kinds.org && plural(model.kinds.org, 'organisation'),
				model.kinds.topic && `${model.kinds.topic} tools and topics`
			]
				.filter(Boolean)
				.join(', ')
		]
			.filter(Boolean)
			.join(': ')
	);

	// ---------------------------------------------------------------- UI state

	let hidden = $state({});
	let query = $state('');
	let searchFocused = $state(false);
	let activeIndex = $state(-1);
	let selectedId = $state(null);
	let tipId = $state(null);
	let tipPos = $state({ x: 0, y: 0 });
	let tipW = $state(0);
	let tipH = $state(0);
	let wheelHint = $state(false);
	// Initial values only; the setup effect keeps them current. The server (and a
	// browser without JavaScript) renders the static state: a note plus the list
	// fallback already open. The client switches to 'loading' as soon as the setup
	// effect runs and collapses the list once the map is ready.
	let status = $state(untrack(() => graphData?.nodes?.length) ? 'static' : 'empty');
	let listOpen = $state(true);
	/** Set once the user toggles the list themselves; we then never collapse it. */
	let listPinned = false;

	let root = $state();
	let stage = $state();
	let container = $state();
	let panel = $state();
	let panelHeading = $state();
	let searchInput = $state();
	let zoomGroup = $state();

	let hiddenSet = $derived(new Set(FILTERS.filter((f) => hidden[f.id]).map((f) => f.id)));
	const isHidden = (node) => hiddenSet.has(categoryOf(node));
	let normalizedQuery = $derived(query.trim().toLowerCase());
	let matches = $derived.by(() => {
		if (!normalizedQuery) return [];
		const rank = (node) => {
			const label = node.label.toLowerCase();
			if (label.startsWith(normalizedQuery)) return 0;
			if (label.includes(normalizedQuery)) return 1;
			return 2;
		};
		return model.nodes
			.filter(
				(node) =>
					!isHidden(node) &&
					(node.label.toLowerCase().includes(normalizedQuery) ||
						node.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
						node.fields?.some((field) => field.toLowerCase().includes(normalizedQuery)))
			)
			.sort(
				(a, b) =>
					rank(a) - rank(b) ||
					KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
					a.label.localeCompare(b.label)
			);
	});
	let matchIds = $derived(normalizedQuery ? new Set(matches.map((node) => node.id)) : null);
	let suggestions = $derived(matches.slice(0, 8));
	let suggestionsOpen = $derived(searchFocused && normalizedQuery.length > 0);

	let selected = $derived(selectedId ? (model.byId.get(selectedId) ?? null) : null);
	let selectedGroups = $derived.by(() => {
		if (!selected) return [];
		const neighbors = (model.adj.get(selected.id) ?? [])
			.map((id) => model.byId.get(id))
			.filter((node) => node && !isHidden(node));
		return GROUPS.map((group) => ({
			...group,
			nodes: neighbors.filter(group.test).sort(byLabel)
		})).filter((group) => group.nodes.length);
	});
	let selectedProjectCount = $derived(
		selected
			? (model.adj.get(selected.id) ?? []).filter((id) => {
					const node = model.byId.get(id);
					return node?.kind === 'item' && node.section === 'projects';
				}).length
			: 0
	);
	let selectedConnections = $derived(selectedGroups.reduce((sum, g) => sum + g.nodes.length, 0));
	/** On detail pages the focus node is the current page: no "open" link for it. */
	let selectedIsFocus = $derived(!!selected && selected.id === focus);
	let tipNode = $derived(tipId ? (model.byId.get(tipId) ?? null) : null);
	let listGroups = $derived(
		GROUPS.map((group) => ({
			...group,
			nodes: model.nodes.filter((node) => group.test(node) && !isHidden(node)).sort(byLabel)
		})).filter((group) => group.nodes.length)
	);

	// ---------------------------------------------------------------- renderer state (not reactive)

	/** Shared with Sigma reducers; mutated in place, never re-created per frame. */
	const ui = {
		hovered: null,
		selected: null,
		hiddenCats: new Set(),
		matches: null,
		activeNeighbors: new Set(),
		zoomedIn: false,
		focus: null
	};
	let renderer = null;
	let graph = null;
	let sim = null;
	let reducedMotion = false;
	let pointerType = 'mouse';

	/** Hover wins, then an active search, then the selection. */
	const activeNode = () => ui.hovered ?? (ui.matches ? null : ui.selected);

	function recomputeActive() {
		const active = activeNode();
		ui.activeNeighbors =
			active && graph?.hasNode(active) ? new Set(graph.neighbors(active)) : new Set();
	}

	function refresh() {
		if (!renderer) return;
		recomputeActive();
		renderer.refresh();
	}

	// Keep the canvas in sync with filters, search and selection.
	$effect(() => {
		ui.hiddenCats = hiddenSet;
		ui.matches = matchIds;
		ui.selected = selectedId;
		untrack(refresh);
	});

	// Re-place the tooltip once its size is known.
	$effect(() => {
		void tipW;
		void tipH;
		void tipId;
		untrack(placeTip);
	});

	// (Re)build the renderer whenever the data, focus or mode changes. Client-only:
	// effects never run during prerender, and the heavy libraries load lazily.
	$effect(() => {
		const data = model;
		const focusId = focus;
		const isCompact = compact;
		const target = container;
		if (!target || !data.nodes.length) {
			status = data.nodes.length ? 'loading' : 'empty';
			return;
		}
		const token = { cancelled: false, cleanup: null, renderer: null };
		untrack(() => {
			selectedId = null;
			tipId = null;
			status = 'loading';
			setup(data, focusId, isCompact, target, token).catch((error) => {
				// A failure after the renderer exists leaves no cleanup behind: kill it here.
				if (token.renderer) {
					token.renderer.kill();
					if (renderer === token.renderer) {
						renderer = null;
						graph = null;
						sim = null;
					}
				}
				if (token.cancelled) return;
				console.error('GraphView: could not start the interactive graph', error);
				status = error?.graphWebGL ? 'no-webgl' : 'error';
				listOpen = true;
			});
		});
		return () => {
			token.cancelled = true;
			token.cleanup?.();
		};
	});

	// ---------------------------------------------------------------- colours

	function parseHex(value) {
		const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value).trim());
		if (!match) return null;
		let hex = match[1];
		if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
		return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
	}
	const rgba = ([r, g, b], alpha) => `rgba(${r}, ${g}, ${b}, ${alpha})`;
	const mix = (a, b, t) => a.map((value, i) => Math.round(value + (b[i] - value) * t));
	const hex = (rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

	function readPalette(element) {
		const styles = getComputedStyle(element);
		const read = (name, fallback) => parseHex(styles.getPropertyValue(name)) ?? parseHex(fallback);
		return {
			tones: {
				projects: read('--accent-projects', '#e17b5a'),
				diy: read('--accent-diy', '#dda544'),
				sport: read('--accent-sport', '#d76060'),
				field: read('--graph-field', '#5fbf9f'),
				org: read('--graph-org', '#a48be6'),
				topic: read('--graph-topic', '#8fa6bd')
			},
			bg: read('--graph-bg', '#10110f'),
			edge: read('--graph-edge', '#57544c'),
			label: read('--graph-label', '#ebe6dc'),
			font: styles.getPropertyValue('--font-body').trim() || 'system-ui, sans-serif'
		};
	}

	// ---------------------------------------------------------------- setup

	async function setup(data, focusId, isCompact, target, token) {
		const [{ default: Sigma }, { default: Graph }, d3] = await Promise.all([
			import('sigma'),
			import('graphology'),
			import('d3-force')
		]);
		if (token.cancelled) return;

		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		pointerType = window.matchMedia('(hover: none)').matches ? 'touch' : 'mouse';
		const palette = readPalette(target);
		ui.focus = focusId && data.byId.has(focusId) ? focusId : null;
		ui.hovered = null;
		ui.zoomedIn = false;

		// ---- layout model (fresh objects: d3 mutates nodes and links)
		const width = target.clientWidth || 800;
		const height = target.clientHeight || 520;
		const unit = clamp(Math.min(width, height * 1.5) / 1000, 0.5, 1.25);
		// Phones: smaller nodes and fewer forced labels so the map stays legible.
		const narrow = width < 640;
		const degree = new Map(data.nodes.map((node) => [node.id, data.adj.get(node.id).length]));
		const sizeOf = (node) =>
			(SIZE_BASE[node.kind] +
				SIZE_GROWTH[node.kind] * Math.min(degree.get(node.id), 10) +
				(node.featured ? 1.6 : 0)) *
			(isCompact ? 0.85 : 1) *
			(narrow ? 0.72 : 1) *
			(node.id === ui.focus ? 1.25 : 1);

		const ordered = [...data.nodes].sort(
			(a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)
		);
		const simNodes = ordered.map((node, index) => ({
			id: node.id,
			kind: node.kind,
			index,
			r: sizeOf(node),
			x: NaN,
			y: NaN,
			px: 0,
			py: 0
		}));
		const simById = new Map(simNodes.map((node) => [node.id, node]));

		// Deterministic seeding: hubs on a fixed triangle, everything else near the
		// average of its already-placed neighbours, at a hash-derived angle.
		const R = 230 * unit;
		const HUB_SEATS = {
			'hub-projects': [-R * 0.55, -R * 0.2],
			'hub-diy': [R * 0.75, -R * 0.55],
			'hub-sport': [R * 0.6, R * 0.7]
		};
		let spare = 0;
		for (const node of simNodes) {
			const h = hash(node.id);
			if (node.id === ui.focus) {
				node.x = 0;
				node.y = 0;
				continue;
			}
			if (node.kind === 'hub' && !ui.focus) {
				const seat = HUB_SEATS[node.id] ?? [Math.cos(spare) * R, Math.sin(spare) * R];
				spare += 2.1;
				node.x = seat[0];
				node.y = seat[1];
				continue;
			}
			let cx = 0;
			let cy = 0;
			let placed = 0;
			for (const id of data.adj.get(node.id)) {
				const other = simById.get(id);
				if (other && !Number.isNaN(other.x)) {
					cx += other.x;
					cy += other.y;
					placed++;
				}
			}
			if (placed) {
				cx /= placed;
				cy /= placed;
			}
			const angle = ((h % 3600) / 3600) * Math.PI * 2;
			const distance = (node.kind === 'topic' ? 60 : 40 + ((h >>> 12) % 40)) * unit;
			node.x = cx + Math.cos(angle) * distance;
			node.y = cy + Math.sin(angle) * distance;
		}
		if (ui.focus) {
			const anchor = simById.get(ui.focus);
			anchor.fx = 0;
			anchor.fy = 0;
		}

		const links = data.edges.map((edge) => ({
			source: edge.source,
			target: edge.target,
			kind: edge.kind
		}));
		const aspect = width / Math.max(height, 1);
		sim = d3
			.forceSimulation(simNodes)
			.stop()
			.force(
				'link',
				d3
					.forceLink(links)
					.id((node) => node.id)
					.distance((link) => (SPRING[link.kind]?.[0] ?? 100) * unit)
					.strength(
						(link) =>
							(SPRING[link.kind]?.[1] ?? 0.3) /
							Math.sqrt(
								Math.max(1, Math.min(degree.get(link.source.id), degree.get(link.target.id)))
							)
					)
			)
			.force(
				'charge',
				d3
					.forceManyBody()
					.strength(
						(node) =>
							CHARGE[node.kind] * unit * unit * (1 + Math.min(degree.get(node.id), 16) * 0.03)
					)
					.distanceMax(700 * unit)
			)
			.force(
				'collide',
				d3
					.forceCollide()
					.radius((node) => node.r + (node.kind === 'org' || node.kind === 'topic' ? 6 : 14))
					.strength(0.85)
					.iterations(2)
			)
			// Anisotropic centring: on wide stages pull harder vertically than
			// horizontally so the layout spreads to the canvas shape instead of
			// settling round and being fitted by height.
			.force('x', d3.forceX(0).strength(0.03 / Math.sqrt(clamp(aspect, 0.6, 3))))
			.force('y', d3.forceY(0).strength(0.03 * Math.sqrt(clamp(aspect, 0.6, 3))));

		// Pre-settle before first paint; reduced motion settles completely.
		// Settle to (near) rest so the pinned frame below matches the resting layout;
		// later motion only comes from dragging.
		sim.tick(420);
		sim.alpha(0);
		for (const node of simNodes) {
			node.px = node.x;
			node.py = node.y;
		}

		// ---- graphology graph mirroring the simulation
		graph = new Graph({ type: 'undirected', multi: false });
		for (const simNode of simNodes) {
			const node = data.byId.get(simNode.id);
			const tone = palette.tones[node.tone] ?? palette.tones.topic;
			const alwaysLabel = isCompact
				? node.kind === 'hub' || node.id === ui.focus
				: node.kind === 'hub' || (!narrow && (node.kind === 'domain' || node.kind === 'field'));
			graph.addNode(node.id, {
				x: simNode.x,
				y: simNode.y,
				si: simNode.index,
				size: simNode.r,
				label: node.label,
				kind: node.kind,
				cat: categoryOf(node),
				color: hex(tone),
				dimColor: hex(mix(tone, palette.bg, 0.8)),
				forceLabel: alwaysLabel,
				quiet: node.kind === 'org' || node.kind === 'topic',
				zIndex: node.kind === 'hub' || node.kind === 'domain' ? 2 : node.kind === 'topic' ? 0 : 1
			});
		}
		const parentTone = (edge) => {
			const a = data.byId.get(edge.source);
			const b = data.byId.get(edge.target);
			switch (edge.kind) {
				case 'section': {
					const hub = [a, b].find((n) => n.kind === 'hub');
					const domain = [a, b].find((n) => n.kind === 'domain');
					return domain ? palette.tones.field : (palette.tones[hub?.tone] ?? palette.edge);
				}
				case 'discipline':
					return palette.tones.sport;
				case 'domain':
				case 'field':
					return palette.tones.field;
				case 'org':
					return palette.tones.org;
				case 'topic':
					return palette.tones.topic;
				case 'link':
					return palette.label;
				default:
					return mix(palette.edge, palette.label, 0.35);
			}
		};
		data.edges.forEach((edge, index) => {
			if (graph.hasEdge(edge.source, edge.target)) return;
			const [alpha, size, zIndex] = EDGE_STYLE[edge.kind] ?? [0.3, 1, 1];
			const color = parentTone(edge);
			graph.addEdgeWithKey(`e${index}`, edge.source, edge.target, {
				kind: edge.kind,
				s: edge.source,
				t: edge.target,
				sc: categoryOf(data.byId.get(edge.source)),
				tc: categoryOf(data.byId.get(edge.target)),
				// Sigma blends premultiplied (ONE, ONE_MINUS_SRC_ALPHA), so translucent
				// rgba() edges render at full brightness. Pre-blend against the stage
				// background and pass opaque colours instead.
				color: hex(mix(palette.bg, color, alpha)),
				hiColor: hex(
					mix(palette.bg, mix(color, palette.label, 0.15), Math.min(0.95, alpha + 0.45))
				),
				size,
				hiSize: Math.max(size * 1.6, 1.8),
				zIndex
			});
		});

		// ---- label drawing tuned for the dark canvas
		const labelBg = rgba(palette.bg, 0.92);
		function labelFont(data, settings) {
			const scale = data.kind === 'hub' ? 1.25 : data.kind === 'domain' ? 1.1 : 1;
			const weight =
				data.kind === 'hub' || data.kind === 'domain'
					? 700
					: data.kind === 'field'
						? 600
						: settings.labelWeight;
			const size = settings.labelSize * scale;
			return { size, font: `${weight} ${size}px ${settings.labelFont}` };
		}
		/**
		 * Labels sit right of their node, or left of it when they would run off
		 * the stage's right edge (on phones the long domain names otherwise clip).
		 */
		function labelX(context, data, width) {
			const right = data.x + data.size + 5;
			const stage = context.canvas.clientWidth || Infinity;
			return right + width > stage - 4 ? Math.max(4, data.x - data.size - 5 - width) : right;
		}
		/**
		 * Phones, resting view only (nothing selected, hovered or searched): label
		 * boxes drawn this frame. A label that would overprint one of them is
		 * skipped unless it is a hub; hovering or tapping the node still shows it.
		 */
		const drawnLabels = [];
		function drawLabel(context, data, settings) {
			if (!data.label) return;
			const { size, font } = labelFont(data, settings);
			context.font = font;
			const width = context.measureText(data.label).width;
			const x = labelX(context, data, width);
			const y = data.y + size / 3;
			if (narrow && !isCompact && !activeNode() && !ui.matches) {
				const box = [x - 2, data.y - size * 0.75, x + width + 2, data.y + size * 0.75];
				const clash = drawnLabels.some(
					(other) =>
						box[0] < other[2] && other[0] < box[2] && box[1] < other[3] && other[1] < box[3]
				);
				if (clash && data.kind !== 'hub') return;
				drawnLabels.push(box);
			}
			context.lineJoin = 'round';
			context.lineWidth = 4;
			context.strokeStyle = labelBg;
			context.strokeText(data.label, x, y);
			context.fillStyle = settings.labelColor.color;
			context.fillText(data.label, x, y);
		}
		function drawHover(context, data, settings) {
			context.beginPath();
			context.arc(data.x, data.y, data.size + 3, 0, Math.PI * 2);
			context.lineWidth = 2;
			context.strokeStyle = rgba(palette.label, 0.85);
			context.stroke();
			if (!data.label) return;
			const { size, font } = labelFont(data, settings);
			context.font = font;
			const width = context.measureText(data.label).width;
			const x = labelX(context, data, width);
			context.fillStyle = labelBg;
			context.beginPath();
			if (context.roundRect)
				context.roundRect(x - 5, data.y - size * 0.8, width + 10, size * 1.6, 6);
			else context.rect(x - 5, data.y - size * 0.8, width + 10, size * 1.6);
			context.fill();
			context.fillStyle = settings.labelColor.color;
			context.fillText(data.label, x, data.y + size / 3);
		}

		// ---- reducers: mutate Sigma's shallow copy, never allocate
		function nodeReducer(id, data) {
			if (data.cat && ui.hiddenCats.has(data.cat)) {
				data.hidden = true;
				return data;
			}
			const active = activeNode();
			if (active) {
				if (id === active) {
					data.highlighted = true;
					data.forceLabel = true;
					data.zIndex = 4;
				} else if (ui.activeNeighbors.has(id)) {
					data.forceLabel = true;
					data.zIndex = 3;
				} else {
					data.color = data.dimColor;
					data.label = null;
					data.forceLabel = false;
				}
			} else if (ui.matches) {
				if (ui.matches.has(id)) {
					data.highlighted = true;
					data.forceLabel = true;
					data.zIndex = 3;
				} else {
					data.color = data.dimColor;
					data.label = null;
					data.forceLabel = false;
				}
			} else if (data.quiet && !ui.zoomedIn) {
				data.label = null;
			}
			if (id === ui.focus) {
				data.highlighted = true;
				data.forceLabel = true;
				data.zIndex = 5;
				if (data.label === null) data.label = graph.getNodeAttribute(id, 'label');
			}
			return data;
		}
		function edgeReducer(_id, data) {
			if (ui.hiddenCats.has(data.sc) || ui.hiddenCats.has(data.tc)) {
				data.hidden = true;
				return data;
			}
			const active = activeNode();
			if (active) {
				if (data.s === active || data.t === active) {
					data.color = data.hiColor;
					data.size = data.hiSize;
					data.zIndex = 3;
				} else data.hidden = true;
			} else if (ui.matches) {
				if (!ui.matches.has(data.s) && !ui.matches.has(data.t)) data.hidden = true;
			} else if (ui.focus && (data.s === ui.focus || data.t === ui.focus)) {
				data.color = data.hiColor;
			}
			return data;
		}

		// ---- renderer
		// Only a failure here means WebGL is missing; anything else gets the
		// generic error message.
		let instance;
		try {
			instance = new Sigma(graph, target, {
				allowInvalidContainer: true,
				defaultEdgeType: 'line',
				renderEdgeLabels: false,
				labelFont: palette.font,
				labelSize: isCompact ? 12 : 13,
				labelWeight: '500',
				labelColor: { color: hex(palette.label) },
				labelDensity: isCompact || narrow ? 0.5 : 0.85,
				labelGridCellSize: isCompact || narrow ? 110 : 90,
				labelRenderedSizeThreshold: isCompact ? 7.5 : 6,
				defaultDrawNodeLabel: drawLabel,
				defaultDrawNodeHover: drawHover,
				stagePadding: isCompact ? 18 : 28,
				minCameraRatio: 0.12,
				maxCameraRatio: 2.5,
				zIndex: true,
				// Reduced motion: no inertia glide after a pan, no animated
				// double-click zoom. Sigma divides by the duration on the first
				// (synchronous) animation step, so 0 would yield NaN; 1 ms finishes
				// on the next frame, and a zero inertia ratio makes the glide a no-op.
				...(reducedMotion
					? { inertiaDuration: 1, inertiaRatio: 0, doubleClickZoomingDuration: 1 }
					: {}),
				nodeReducer,
				edgeReducer
			});
		} catch (cause) {
			throw Object.assign(new Error('GraphView: WebGL renderer unavailable', { cause }), {
				graphWebGL: true
			});
		}
		renderer = instance;
		token.renderer = instance;
		renderer.on('beforeRender', () => {
			drawnLabels.length = 0;
		});

		// Pin the normalisation box after the settle so the camera never "breathes"
		// as nodes move or are dragged toward the edge.
		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;
		for (const node of simNodes) {
			minX = Math.min(minX, node.x - node.r);
			maxX = Math.max(maxX, node.x + node.r);
			minY = Math.min(minY, node.y - node.r);
			maxY = Math.max(maxY, node.y + node.r);
		}
		const padX = (maxX - minX) * 0.04 + 8;
		const padY = (maxY - minY) * 0.04 + 8;
		renderer.setCustomBBox({ x: [minX - padX, maxX + padX], y: [minY - padY, maxY + padY] });
		refresh();

		const camera = renderer.getCamera();
		const mouseCanvas = renderer.getCanvases().mouse;
		if (isCompact && mouseCanvas) mouseCanvas.style.touchAction = 'pan-y';

		// ---- animation loop: our own rAF so we can pause offscreen / hidden tabs
		let raf = 0;
		let visible = true;
		let drag = null;
		let suppressClickUntil = 0;
		const canAnimate = () => visible && !document.hidden && !reducedMotion;

		function mirror() {
			let moved = false;
			for (const node of simNodes) {
				if (Math.abs(node.x - node.px) > 0.01 || Math.abs(node.y - node.py) > 0.01) {
					moved = true;
					break;
				}
			}
			if (!moved) return;
			graph.updateEachNodeAttributes(
				(_id, attributes) => {
					const node = simNodes[attributes.si];
					attributes.x = node.x;
					attributes.y = node.y;
					return attributes;
				},
				{ attributes: ['x', 'y'] }
			);
			for (const node of simNodes) {
				node.px = node.x;
				node.py = node.y;
			}
		}
		function frame() {
			raf = 0;
			if (!sim || !canAnimate()) return;
			sim.tick();
			mirror();
			if (drag?.moved || sim.alpha() >= sim.alphaMin()) raf = requestAnimationFrame(frame);
		}
		function wake(heat = 0) {
			if (!sim || reducedMotion) return;
			if (heat) sim.alpha(Math.max(sim.alpha(), heat));
			if (!raf && canAnimate() && (drag?.moved || sim.alpha() >= sim.alphaMin()))
				raf = requestAnimationFrame(frame);
		}

		// ---- tooltip / hover
		function setHover(id) {
			if (ui.hovered === id) return;
			ui.hovered = id;
			tipId = id && pointerType !== 'touch' ? id : null;
			refresh();
		}
		// While dragging, hover stays on the dragged node; remember whether the
		// pointer is still over it so release can clear a stale highlight.
		let leftDuringDrag = false;
		renderer.on('enterNode', ({ node }) => {
			if (pointerType === 'touch') return;
			if (drag?.moved) {
				if (node === drag.id) leftDuringDrag = false;
				return;
			}
			target.style.cursor = 'pointer';
			setHover(node);
		});
		renderer.on('leaveNode', ({ node }) => {
			if (drag?.moved) {
				if (node === drag.id) leftDuringDrag = true;
				return;
			}
			target.style.cursor = '';
			setHover(null);
		});
		renderer.on('afterRender', placeTip);

		// ---- clicks
		function activate(id, original) {
			const node = data.byId.get(id);
			if (!node) return;
			const newTab = original && (original.ctrlKey || original.metaKey);
			if (pointerType !== 'touch' && NAVIGABLE.has(node.kind) && node.href && id !== ui.focus) {
				navigate(node, newTab);
				return;
			}
			select(id);
		}
		renderer.on('clickNode', ({ node, event }) => {
			if (performance.now() < suppressClickUntil) return;
			activate(node, event.original);
		});
		renderer.on('clickStage', () => {
			if (performance.now() < suppressClickUntil) return;
			select(null);
		});
		renderer.on('doubleClickNode', ({ event }) => event.preventSigmaDefault());

		// ---- dragging (works for mouse and touch through Sigma's unified events)
		// A second finger means pinch-zoom: drop any drag and leave the gesture to
		// Sigma (never preventSigmaDefault for multi-touch).
		const multiTouch = (event) => (event.original?.touches?.length ?? 0) > 1;
		renderer.on('downNode', ({ node, event }) => {
			if (multiTouch(event)) {
				release();
				return;
			}
			const original = event.original;
			if (original && 'button' in original && original.button !== 0) return;
			drag = { id: node, sx: event.x, sy: event.y, moved: false };
		});
		renderer.on('moveBody', ({ event }) => {
			if (!drag) return;
			if (multiTouch(event)) {
				release();
				return;
			}
			event.preventSigmaDefault();
			if (event.original?.cancelable && event.original.type === 'mousemove')
				event.original.preventDefault();
			const threshold = pointerType === 'touch' ? 8 : 4;
			if (!drag.moved) {
				if (Math.hypot(event.x - drag.sx, event.y - drag.sy) < threshold) return;
				drag.moved = true;
				tipId = null;
				target.style.cursor = 'grabbing';
				if (!reducedMotion) sim.alphaTarget(0.22);
			}
			const position = renderer.viewportToGraph(event);
			const simNode = simById.get(drag.id);
			simNode.fx = position.x;
			simNode.fy = position.y;
			if (reducedMotion) {
				simNode.x = position.x;
				simNode.y = position.y;
				mirror();
			} else wake(0.12);
		});
		function release() {
			if (!drag) return;
			if (drag.moved) {
				suppressClickUntil = performance.now() + 320;
				const simNode = simById.get(drag.id);
				if (drag.id !== ui.focus) {
					simNode.fx = null;
					simNode.fy = null;
				}
				sim.alphaTarget(0);
				drag = null;
				if (leftDuringDrag || pointerType === 'touch') setHover(null);
				else tipId = ui.hovered;
				target.style.cursor = ui.hovered ? 'pointer' : '';
				leftDuringDrag = false;
				wake();
			}
			drag = null;
		}
		renderer.on('upNode', release);
		renderer.on('upStage', release);
		const onWindowUp = () => release();
		window.addEventListener('mouseup', onWindowUp);
		window.addEventListener('touchend', onWindowUp);

		// ---- camera: reveal org/topic labels once zoomed in
		camera.on('updated', (state) => {
			const zoomedIn = state.ratio < 0.55;
			if (zoomedIn !== ui.zoomedIn) {
				ui.zoomedIn = zoomedIn;
				refresh();
			}
		});

		// ---- DOM listeners on the stage (capture phase, before Sigma's)
		const onPointer = (event) => {
			pointerType = event.pointerType === 'touch' ? 'touch' : 'mouse';
		};
		let wheelTimer = 0;
		const onWheel = (event) => {
			if (event.ctrlKey || event.metaKey || !target.contains(event.target)) return;
			// In every mode the graph sits inside a scrolling page, so a plain wheel
			// scrolls the page; Ctrl/⌘ (and trackpad pinch, which sets ctrlKey) zooms.
			// Stop Sigma from seeing the wheel, but don't preventDefault.
			event.stopPropagation();
			wheelHint = true;
			clearTimeout(wheelTimer);
			wheelTimer = window.setTimeout(() => (wheelHint = false), 1400);
		};
		let touchStart = null;
		const onTouchStart = (event) => {
			pointerType = 'touch';
			// Only the canvas: taps on the panel, zoom buttons or tooltip stay native.
			if (!isCompact || event.touches.length !== 1 || !target.contains(event.target)) {
				touchStart = null;
				return;
			}
			// One finger scrolls the page in compact mode; taps are hit-tested here.
			event.stopPropagation();
			const touch = event.touches[0];
			touchStart = { x: touch.clientX, y: touch.clientY, time: performance.now(), moved: false };
		};
		const onTouchMove = (event) => {
			if (!touchStart || event.touches.length !== 1) return;
			const touch = event.touches[0];
			if (Math.hypot(touch.clientX - touchStart.x, touch.clientY - touchStart.y) > 10)
				touchStart.moved = true;
		};
		const onTouchEnd = (event) => {
			if (!touchStart) return;
			const start = touchStart;
			touchStart = null;
			if (start.moved || performance.now() - start.time > 600) return;
			// Handled here: suppress the emulated mouse events/click that would follow.
			event.stopPropagation();
			if (event.cancelable) event.preventDefault();
			suppressClickUntil = performance.now() + 450;
			const rect = target.getBoundingClientRect();
			const id = nodeAt(start.x - rect.left, start.y - rect.top);
			select(id);
		};
		const onAuxClick = (event) => {
			if (event.button !== 1 || !ui.hovered) return;
			const node = data.byId.get(ui.hovered);
			if (node && NAVIGABLE.has(node.kind) && node.href) {
				event.preventDefault();
				navigate(node, true);
			}
		};
		const onMouseDown = (event) => {
			if (event.button === 1 && ui.hovered) event.preventDefault();
		};
		const stageEl = stage;
		stageEl.addEventListener('pointerdown', onPointer, { capture: true, passive: true });
		stageEl.addEventListener('pointermove', onPointer, { capture: true, passive: true });
		stageEl.addEventListener('wheel', onWheel, { capture: true, passive: true });
		stageEl.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
		stageEl.addEventListener('touchmove', onTouchMove, { capture: true, passive: true });
		stageEl.addEventListener('touchend', onTouchEnd, { capture: true });
		target.addEventListener('auxclick', onAuxClick);
		target.addEventListener('mousedown', onMouseDown);

		function nodeAt(x, y) {
			let best = null;
			let bestDistance = Infinity;
			graph.forEachNode((id) => {
				const display = renderer.getNodeDisplayData(id);
				if (!display || display.hidden) return;
				const point = renderer.framedGraphToViewport(display);
				const distance = Math.hypot(point.x - x, point.y - y);
				if (distance < renderer.scaleSize(display.size) + 8 && distance < bestDistance) {
					best = id;
					bestDistance = distance;
				}
			});
			return best;
		}

		// ---- pause offscreen / in background tabs; follow container resizes
		const io = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			if (visible) wake();
		});
		io.observe(target);
		const onVisibility = () => {
			if (!document.hidden) wake();
		};
		document.addEventListener('visibilitychange', onVisibility);
		const ro = new ResizeObserver(() => {
			renderer?.resize();
			renderer?.refresh();
		});
		ro.observe(target);

		wake();
		status = 'ready';
		// The list was open as the no-JS / loading fallback; tuck it away now
		// unless the user chose its state themselves.
		if (!listPinned) listOpen = false;

		token.cleanup = () => {
			cancelAnimationFrame(raf);
			raf = 0;
			clearTimeout(wheelTimer);
			sim?.stop();
			io.disconnect();
			ro.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			window.removeEventListener('mouseup', onWindowUp);
			window.removeEventListener('touchend', onWindowUp);
			stageEl.removeEventListener('pointerdown', onPointer, { capture: true });
			stageEl.removeEventListener('pointermove', onPointer, { capture: true });
			stageEl.removeEventListener('wheel', onWheel, { capture: true });
			stageEl.removeEventListener('touchstart', onTouchStart, { capture: true });
			stageEl.removeEventListener('touchmove', onTouchMove, { capture: true });
			stageEl.removeEventListener('touchend', onTouchEnd, { capture: true });
			target.removeEventListener('auxclick', onAuxClick);
			target.removeEventListener('mousedown', onMouseDown);
			camera.removeAllListeners();
			renderer?.kill();
			renderer = null;
			graph = null;
			sim = null;
			target.style.cursor = '';
		};
	}

	// ---------------------------------------------------------------- actions

	function navigate(node, newTab = false) {
		const href = hrefOf(node);
		if (!href) return;
		if (newTab) window.open(href, '_blank', 'noopener');
		else goto(href);
	}

	function placeTip() {
		if (!tipId || !renderer || !graph?.hasNode(tipId) || !container) return;
		const attributes = graph.getNodeAttributes(tipId);
		const display = renderer.getNodeDisplayData(tipId);
		const point = renderer.graphToViewport(attributes);
		const radius = renderer.scaleSize(display?.size ?? attributes.size);
		const width = container.clientWidth;
		const height = container.clientHeight;
		const w = tipW || 260;
		const h = tipH || 140;
		const gap = 14;
		let x = point.x + radius + gap;
		if (x + w > width - 8) x = point.x - radius - gap - w;
		x = clamp(x, 8, Math.max(8, width - w - 8));
		const y = clamp(point.y - Math.min(h / 2, 44), 8, Math.max(8, height - h - 8));
		if (x !== tipPos.x || y !== tipPos.y) tipPos = { x, y };
	}

	function moveCamera(state) {
		const camera = renderer?.getCamera();
		if (!camera) return;
		if (reducedMotion) camera.setState(state);
		else camera.animate(state, { duration: 480, easing: 'quadraticInOut' });
	}
	function zoom(factor) {
		const camera = renderer?.getCamera();
		if (!camera) return;
		moveCamera({ ratio: camera.getBoundedRatio(camera.getState().ratio / factor) });
	}
	function resetView() {
		moveCamera({ x: 0.5, y: 0.5, ratio: 1, angle: 0 });
	}
	function panTo(id) {
		const display = renderer?.getNodeDisplayData(id);
		if (!display) return;
		const ratio = Math.min(renderer.getCamera().getState().ratio, 0.8);
		moveCamera({ x: display.x, y: display.y, ratio });
	}

	/** @param {string | null} id */
	function select(id, { pan = false, focusPanel = false } = {}) {
		// Clearing unmounts the panel; if focus is inside it, it would fall to <body>.
		const restoreFocus = !id && !!panel?.contains(document.activeElement);
		selectedId = id;
		if (id && pan) panTo(id);
		if (id && focusPanel) tick().then(() => panelHeading?.focus());
		if (restoreFocus) tick().then(focusAfterPanel);
	}

	/** A stable landing spot once the panel closes: search, else the map controls. */
	function focusAfterPanel() {
		// Touch skips the search box so closing the panel doesn't pop the keyboard.
		const search = !compact && pointerType !== 'touch' ? searchInput : null;
		const target = search ?? zoomGroup?.querySelector('button') ?? stage;
		target?.focus({ preventScroll: true });
	}

	function toggleFilter(id) {
		hidden[id] = !hidden[id];
		if (selected && hidden[categoryOf(selected)]) selectedId = null;
		activeIndex = -1;
	}

	function choose(node) {
		select(node.id, { pan: true });
		query = '';
		activeIndex = -1;
	}

	function onSearchKey(event) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = Math.min(activeIndex + 1, suggestions.length - 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (event.key === 'Enter') {
			const node = suggestions[activeIndex] ?? suggestions[0];
			if (node) {
				event.preventDefault();
				choose(node);
			}
		} else if (event.key === 'Escape' && query) {
			event.stopPropagation();
			query = '';
			activeIndex = -1;
		}
	}

	function onWindowKey(event) {
		if (event.key !== 'Escape' || !selectedId) return;
		const target = event.target;
		if (target === document.body || root?.contains(target)) select(null);
	}

	const propsId = $props.id();
	const uid = `graph-${propsId}`;
</script>

<svelte:window onkeydown={onWindowKey} />

<section class="graph" class:compact bind:this={root} aria-labelledby="{uid}-title">
	<header class="graph-head">
		<div class="graph-titles">
			<p class="eyebrow">{eyebrow}</p>
			<h2 id="{uid}-title">{title}</h2>
		</div>
		{#if compact}
			{#if showFullLink}
				<a class="full-link" href={sitePath('/insights#graph')}
					>Open full graph <span aria-hidden="true">→</span></a
				>
			{/if}
		{:else}
			<div class="search">
				<label for="{uid}-search">Find a node</label>
				<input
					id="{uid}-search"
					type="search"
					role="combobox"
					autocomplete="off"
					spellcheck="false"
					placeholder="Project, field, tool, organisation…"
					aria-expanded={suggestionsOpen}
					aria-controls="{uid}-suggestions"
					aria-autocomplete="list"
					aria-activedescendant={suggestionsOpen && activeIndex >= 0
						? `${uid}-option-${activeIndex}`
						: undefined}
					bind:this={searchInput}
					bind:value={query}
					oninput={() => (activeIndex = -1)}
					onkeydown={onSearchKey}
					onfocus={() => (searchFocused = true)}
					onblur={() => (searchFocused = false)}
				/>
				{#if normalizedQuery}
					<span class="match-count" aria-live="polite">
						{matches.length ? `${plural(matches.length, 'match')} highlighted` : 'No matches'}
					</span>
				{/if}
				<ul id="{uid}-suggestions" class="suggestions" role="listbox" hidden={!suggestionsOpen}>
					{#each suggestions as node, index (node.id)}
						<!-- Keyboard selection is handled by the combobox input (↑/↓/Enter). -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<li
							id="{uid}-option-{index}"
							role="option"
							aria-selected={index === activeIndex}
							class:active={index === activeIndex}
							onmousedown={(event) => event.preventDefault()}
							onclick={() => choose(node)}
						>
							<i class="dot" style:--tone={TONE_VAR[node.tone]}></i>
							<span class="option-label">{node.label}</span>
							<small>{node.subtitle ?? ''}</small>
						</li>
					{:else}
						<li class="empty" role="option" aria-selected="false" aria-disabled="true">
							Nothing matches “{query.trim()}”
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</header>

	{#if !compact && Object.keys(model.counts).length}
		<div class="filters" role="group" aria-label="Show or hide kinds of nodes">
			{#each FILTERS.filter((f) => f.id in model.counts) as filter (filter.id)}
				<button
					type="button"
					class="chip"
					aria-pressed={!hidden[filter.id]}
					onclick={() => toggleFilter(filter.id)}
				>
					<i class="dot" style:--tone={TONE_VAR[filter.tone]}></i>
					{filter.label}
					<span class="count">{model.counts[filter.id]}</span>
				</button>
			{/each}
		</div>
	{/if}

	<!-- tabindex="-1": last-resort focus target when the details panel closes. -->
	<div class="stage" class:has-panel={!!selected} bind:this={stage} tabindex="-1">
		<div class="canvas" bind:this={container} role="img" aria-label={summary}></div>

		{#if status === 'static'}
			<p class="stage-note">The interactive map needs JavaScript — browse the list below.</p>
		{:else if status === 'loading'}
			<p class="stage-note" aria-hidden="true">Laying out the map…</p>
		{:else if status === 'no-webgl'}
			<p class="stage-note">
				The interactive map needs WebGL, which isn’t available here. The list below has every node.
			</p>
		{:else if status === 'error'}
			<p class="stage-note">
				The interactive map couldn’t load. Reload the page, or browse the list below.
			</p>
		{:else if status === 'empty'}
			<p class="stage-note">Nothing to map yet.</p>
		{/if}

		{#if tipNode}
			<div
				class="tooltip"
				aria-hidden="true"
				style:transform="translate({tipPos.x}px, {tipPos.y}px)"
				bind:offsetWidth={tipW}
				bind:offsetHeight={tipH}
			>
				{#if tipNode.cover}
					<img src={coverOf(tipNode.cover)} alt="" loading="lazy" decoding="async" />
				{/if}
				<p class="tip-meta">
					<i class="dot" style:--tone={TONE_VAR[tipNode.tone]}></i>{tipNode.subtitle ??
						TONE_LABEL[tipNode.tone]}
				</p>
				<p class="tip-title">{tipNode.label}</p>
				{#if tipNode.excerpt}<p class="tip-excerpt">{tipNode.excerpt}</p>{/if}
				{#if tipNode.fields?.length}
					<ul class="tags">
						{#each tipNode.fields.slice(0, 4) as field (field)}<li>{field}</li>{/each}
					</ul>
				{/if}
				<p class="tip-hint">{hintFor(tipNode)}</p>
			</div>
		{/if}

		{#if wheelHint}
			<p class="wheel-hint" aria-hidden="true">Hold Ctrl or ⌘ and scroll to zoom</p>
		{/if}

		{#if status === 'ready'}
			<div class="zoom" role="group" aria-label="Map view" bind:this={zoomGroup}>
				<button type="button" onclick={() => zoom(1.5)} aria-label="Zoom in">+</button>
				<button type="button" onclick={() => zoom(1 / 1.5)} aria-label="Zoom out">−</button>
				<button type="button" onclick={resetView} aria-label="Reset view"
					><svg viewBox="0 0 16 16" aria-hidden="true"
						><path
							d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
						/></svg
					></button
				>
			</div>
			{#if !compact && !selected}
				<p class="stage-hint" aria-hidden="true">
					Hover to trace · drag to rearrange · click to open · Ctrl/⌘ + scroll to zoom
				</p>
			{/if}
		{/if}

		{#if selected}
			<aside class="panel" aria-labelledby="{uid}-panel-title" bind:this={panel}>
				<button
					type="button"
					class="close"
					aria-label="Clear selection"
					onclick={() => select(null)}>×</button
				>
				{#if selected.cover}
					<img class="panel-cover" src={coverOf(selected.cover)} alt="" loading="lazy" />
				{/if}
				<p class="tip-meta">
					<i class="dot" style:--tone={TONE_VAR[selected.tone]}></i>{selected.subtitle ??
						TONE_LABEL[selected.tone]}
				</p>
				<h3 id="{uid}-panel-title" tabindex="-1" bind:this={panelHeading}>{selected.label}</h3>
				{#if selected.excerpt}<p class="panel-excerpt">{selected.excerpt}</p>{/if}
				{#if selected.fields?.length}
					<ul class="tags">
						{#each selected.fields as field (field)}<li>{field}</li>{/each}
					</ul>
				{/if}

				<div class="panel-actions">
					{#if selectedIsFocus}
						<!-- The focus node is the page being read; linking to it goes nowhere. -->
					{:else if NAVIGABLE.has(selected.kind) && selected.href}
						<a class="button primary small" href={hrefOf(selected)}
							>{openLabel(selected)} <span aria-hidden="true">→</span></a
						>
					{:else if (selected.kind === 'field' || selected.kind === 'topic') && selected.href && selectedProjectCount}
						<a class="button small" href={hrefOf(selected)}
							>See all {plural(selectedProjectCount, 'project')}
							<span aria-hidden="true">→</span></a
						>
					{/if}
					{#if selected.external}
						<a
							class="button small"
							href={selected.external}
							target="_blank"
							rel="noopener noreferrer"
							>{selected.kind === 'item' ? 'Visit live site' : 'Visit'}
							<span aria-hidden="true">↗</span><span class="visually-hidden">
								(opens in a new tab)</span
							></a
						>
					{/if}
				</div>

				{#if selectedGroups.length}
					<p class="panel-count">Connected to {plural(selectedConnections, 'node')}</p>
					{#each selectedGroups as group (group.id)}
						<h4>{group.label}</h4>
						<ul class="panel-list">
							{#each group.nodes as node (node.id)}
								<li>
									{#if node.kind === 'item' && node.href}
										<a href={hrefOf(node)}
											><i class="dot" style:--tone={TONE_VAR[node.tone]}></i>{node.label}</a
										>
									{:else}
										<button
											type="button"
											onclick={() => select(node.id, { pan: true, focusPanel: true })}
											><i class="dot" style:--tone={TONE_VAR[node.tone]}></i>{node.label}</button
										>
									{/if}
								</li>
							{/each}
						</ul>
					{/each}
				{/if}
			</aside>
		{/if}
	</div>

	<footer class="graph-foot">
		{#if compact}
			<ul class="legend" aria-label="Legend">
				{#each model.tones as tone (tone)}
					<li><i class="dot" style:--tone={TONE_VAR[tone]}></i>{TONE_LABEL[tone]}</li>
				{/each}
			</ul>
		{:else}
			<ul class="legend" aria-label="How to read the map">
				<li><i class="dot big" style:--tone="var(--graph-label)"></i>Larger = more connected</li>
				<li><i class="line"></i>Structure: sections, fields, organisations</li>
				<li><i class="line faint"></i>Shared tools &amp; topics</li>
				<li class="keys">Ctrl/⌘-click opens in a new tab · Esc clears</li>
			</ul>
		{/if}
		<details class="graph-list" bind:open={listOpen}>
			<summary onclick={() => (listPinned = true)}>Browse as a list</summary>
			<div class="list-groups">
				{#each listGroups as group (group.id)}
					<div>
						<h3>{group.label} <span class="count">{group.nodes.length}</span></h3>
						<ul>
							{#each group.nodes as node (node.id)}
								<li>
									{#if node.href}
										<a href={hrefOf(node)}>{node.label}</a>
									{:else if node.external}
										<a href={node.external} target="_blank" rel="noopener noreferrer"
											>{node.label} <span aria-hidden="true">↗</span></a
										>
									{:else}
										<span>{node.label}</span>
									{/if}
									{#if node.subtitle}<small>{node.subtitle}</small>{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</details>
	</footer>

	<p class="visually-hidden" aria-live="polite">
		{selected ? `${selected.label} selected, ${plural(selectedConnections, 'connection')}.` : ''}
	</p>
</section>

<style>
	.graph {
		--panel-bg: rgba(21, 21, 20, 0.94);
		position: relative;
		overflow: hidden;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		background: var(--graph-bg);
		box-shadow: var(--shadow-card);
	}

	/* ---------- header & toolbar */
	.graph-head {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: var(--space-5);
		padding: var(--space-5) var(--space-6) var(--space-4);
	}
	.graph-titles .eyebrow {
		margin-bottom: var(--space-2);
	}
	.graph-head h2 {
		margin: 0;
		font-size: clamp(1.6rem, 3.4vw, 2.3rem);
	}
	.full-link {
		flex-shrink: 0;
		font-size: var(--text-sm);
		font-weight: 650;
	}
	.search {
		position: relative;
		display: grid;
		gap: 0.35rem;
		width: min(22rem, 100%);
	}
	.search label {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.04em;
	}
	.search input {
		width: 100%;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-full);
		background: var(--color-bg-sunken);
		color: var(--color-heading);
		padding: 0.65rem 1rem;
	}
	.search input::placeholder {
		color: var(--color-text-muted);
	}
	.match-count {
		position: absolute;
		right: 0.2rem;
		top: 0;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	.suggestions {
		position: absolute;
		z-index: 6;
		top: calc(100% + 0.4rem);
		right: 0;
		left: 0;
		margin: 0;
		padding: var(--space-1);
		list-style: none;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
		box-shadow: var(--shadow-card);
	}
	.suggestions[hidden] {
		display: none;
	}
	.suggestions li {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 0 var(--space-2);
		padding: 0.45rem 0.6rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	.suggestions li small {
		grid-column: 2;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	.suggestions li.active,
	.suggestions li:hover {
		background: rgba(255, 255, 255, 0.06);
	}
	.suggestions li.empty {
		display: block;
		color: var(--color-text-muted);
		cursor: default;
	}
	.option-label {
		color: var(--color-heading);
		font-size: var(--text-sm);
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		padding: 0 var(--space-6) var(--space-4);
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 2.2rem;
		padding: 0.3rem 0.8rem;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--color-heading);
		font-size: var(--text-sm);
		cursor: pointer;
		transition:
			color 160ms ease,
			border-color 160ms ease;
	}
	.chip:hover {
		border-color: var(--tone, var(--color-text-muted));
	}
	/* Off: muted (AA-contrast) text and a faded dot/border, not whole-chip opacity. */
	.chip[aria-pressed='false'] {
		border-color: var(--color-border);
		color: var(--color-text-muted);
		text-decoration: line-through;
	}
	.chip[aria-pressed='false']:hover {
		border-color: var(--color-text-muted);
	}
	.chip .dot {
		transition: opacity 160ms ease;
	}
	.chip[aria-pressed='false'] .dot {
		opacity: 0.3;
	}
	.chip .count {
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.dot {
		display: inline-block;
		flex-shrink: 0;
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: var(--tone);
	}
	.dot.big {
		width: 0.85rem;
		height: 0.85rem;
	}

	/* ---------- stage */
	.stage {
		position: relative;
		height: clamp(34rem, 76vh, 54rem);
		border-block: 1px solid var(--color-border);
		background: radial-gradient(ellipse at 50% 45%, rgba(95, 191, 159, 0.05), transparent 62%);
	}
	.stage:focus:not(:focus-visible) {
		outline: none;
	}
	.canvas {
		position: absolute;
		inset: 0;
	}
	.stage-note {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		margin: 0;
		padding: var(--space-6);
		color: var(--color-text-muted);
		text-align: center;
		pointer-events: none;
	}
	.stage-hint,
	.wheel-hint {
		position: absolute;
		left: var(--space-4);
		bottom: var(--space-3);
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		pointer-events: none;
	}
	.wheel-hint {
		left: 50%;
		bottom: auto;
		top: 50%;
		padding: 0.5rem 0.9rem;
		border-radius: var(--radius-full);
		background: var(--panel-bg);
		color: var(--color-heading);
		transform: translate(-50%, -50%);
	}

	.zoom {
		position: absolute;
		right: var(--space-3);
		bottom: var(--space-3);
		z-index: 3;
		display: grid;
		overflow: hidden;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		background: var(--panel-bg);
	}
	.has-panel .zoom {
		right: calc(min(21rem, 100% - 1.5rem) + var(--space-5));
	}
	.zoom button {
		display: grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		border: 0;
		background: transparent;
		color: var(--color-heading);
		font-size: 1.15rem;
		line-height: 1;
		cursor: pointer;
	}
	.zoom button + button {
		border-top: 1px solid var(--color-border);
	}
	.zoom button:hover {
		background: rgba(255, 255, 255, 0.06);
	}
	.zoom button:focus-visible {
		outline-offset: -3px;
	}
	.zoom svg {
		width: 1rem;
		height: 1rem;
	}

	/* ---------- tooltip */
	.tooltip {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 4;
		width: min(17rem, calc(100% - 1rem));
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		background: var(--panel-bg);
		box-shadow: 0 18px 40px -20px rgba(0, 0, 0, 0.9);
		pointer-events: none;
		backdrop-filter: blur(6px);
	}
	.tooltip img {
		display: block;
		width: 100%;
		height: 6.5rem;
		margin-bottom: var(--space-3);
		border-radius: var(--radius-sm);
		object-fit: cover;
	}
	.tip-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin: 0 0 0.2rem;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		line-height: 1.4;
	}
	.tip-title {
		margin: 0;
		color: var(--color-heading);
		font-family: var(--font-display);
		font-size: 1.15rem;
		line-height: 1.2;
	}
	.tip-excerpt {
		display: -webkit-box;
		overflow: hidden;
		margin: var(--space-2) 0 0;
		color: var(--color-text);
		font-size: var(--text-sm);
		line-height: 1.45;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
	}
	.tip-hint {
		margin: var(--space-2) 0 0;
		color: var(--link);
		font-size: var(--text-xs);
		font-weight: 650;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin: var(--space-2) 0 0;
		padding: 0;
		list-style: none;
	}
	.tags li {
		padding: 0.1rem 0.5rem;
		border: 1px solid rgba(95, 191, 159, 0.35);
		border-radius: var(--radius-full);
		color: var(--graph-field);
		font-size: 0.7rem;
	}

	/* ---------- details panel */
	.panel {
		position: absolute;
		top: var(--space-3);
		right: var(--space-3);
		bottom: var(--space-3);
		z-index: 5;
		width: min(21rem, calc(100% - 1.5rem));
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: var(--space-5);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-lg);
		background: var(--panel-bg);
		box-shadow: var(--shadow-card);
		backdrop-filter: blur(8px);
	}
	.panel h3 {
		margin: 0;
		font-size: 1.45rem;
	}
	.panel h3:focus {
		outline: none;
	}
	.panel h3:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 4px;
	}
	.panel-cover {
		display: block;
		width: 100%;
		height: 8rem;
		margin-bottom: var(--space-4);
		border-radius: var(--radius-md);
		object-fit: cover;
	}
	.panel-excerpt {
		margin: var(--space-3) 0 0;
		font-size: var(--text-sm);
		line-height: 1.55;
	}
	.close {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 1.4rem;
		line-height: 1;
		cursor: pointer;
	}
	.close:hover {
		background: rgba(255, 255, 255, 0.06);
		color: var(--color-heading);
	}
	.panel-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-top: var(--space-4);
	}
	.panel-actions:empty {
		display: none;
	}
	.button.small {
		min-height: 2.3rem;
		padding: 0.45rem 0.95rem;
		font-size: var(--text-sm);
	}
	.panel-count {
		margin: var(--space-5) 0 0;
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	.panel h4,
	.graph-list h3 {
		margin: var(--space-4) 0 var(--space-2);
		color: var(--color-text-muted);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.panel-list {
		display: grid;
		gap: 0.15rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.panel-list a,
	.panel-list button {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: 0.35rem 0.5rem;
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-heading);
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
	}
	.panel-list a {
		color: var(--link);
	}
	.panel-list a:hover,
	.panel-list button:hover {
		background: rgba(255, 255, 255, 0.06);
		text-decoration: none;
	}
	.panel-list a:focus-visible,
	.panel-list button:focus-visible {
		outline-offset: 0;
	}

	/* ---------- footer: legend + list fallback */
	.graph-foot {
		padding: var(--space-4) var(--space-6) var(--space-5);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-5);
		margin: 0;
		padding: 0;
		list-style: none;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	.legend li {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}
	.legend .keys {
		margin-left: auto;
	}
	.line {
		display: inline-block;
		width: 1.4rem;
		height: 2px;
		border-radius: 2px;
		background: rgba(235, 230, 220, 0.55);
	}
	.line.faint {
		height: 1px;
		background: rgba(143, 166, 189, 0.45);
	}
	.graph-list {
		margin-top: var(--space-4);
		font-size: var(--text-sm);
	}
	.graph-list summary {
		width: fit-content;
		color: var(--link);
		font-weight: 650;
		cursor: pointer;
	}
	.graph-list summary:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 4px;
	}
	.list-groups {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
		gap: var(--space-2) var(--space-6);
		margin-top: var(--space-2);
	}
	.list-groups ul {
		display: grid;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.list-groups li {
		display: grid;
		line-height: 1.35;
	}
	.list-groups li > span {
		color: var(--color-heading);
	}
	.list-groups small {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	.graph-list .count {
		margin-left: var(--space-1);
		font-weight: 500;
		letter-spacing: 0;
	}

	/* ---------- compact */
	.compact {
		border-radius: var(--radius-lg);
	}
	.compact .graph-head {
		align-items: baseline;
		padding: var(--space-4) var(--space-5) var(--space-3);
	}
	.compact .graph-head h2 {
		font-size: 1.45rem;
	}
	.compact .stage {
		height: 24rem;
	}
	.compact .graph-foot {
		padding: var(--space-3) var(--space-5) var(--space-4);
	}
	.compact .zoom,
	.compact .has-panel .zoom {
		top: var(--space-3);
		right: var(--space-3);
		bottom: auto;
	}
	.compact .panel {
		top: auto;
		left: var(--space-2);
		right: var(--space-2);
		bottom: var(--space-2);
		width: auto;
		max-height: 75%;
		padding: var(--space-4);
	}

	@media (max-width: 700px) {
		.graph-head {
			flex-direction: column;
			align-items: stretch;
			padding: var(--space-5) var(--space-4) var(--space-3);
		}
		.compact .graph-head {
			flex-direction: row;
			align-items: baseline;
			flex-wrap: wrap;
		}
		.search {
			width: 100%;
		}
		.filters {
			flex-wrap: nowrap;
			overflow-x: auto;
			padding: 0 var(--space-4) var(--space-3);
			scrollbar-width: none;
		}
		.chip {
			flex-shrink: 0;
		}
		.stage {
			height: 70svh;
			min-height: 26rem;
			max-height: 38rem;
		}
		.compact .stage {
			height: 21rem;
			min-height: 0;
		}
		.panel {
			top: auto;
			left: var(--space-2);
			right: var(--space-2);
			bottom: var(--space-2);
			width: auto;
			max-height: 62%;
			padding: var(--space-4);
		}
		.stage-hint {
			display: none;
		}
		.zoom,
		.has-panel .zoom {
			top: var(--space-3);
			right: var(--space-3);
			bottom: auto;
		}
		.graph-foot {
			padding: var(--space-4);
		}
		.legend .keys {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.chip,
		.chip .dot {
			transition: none;
		}
	}
</style>
