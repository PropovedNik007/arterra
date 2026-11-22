// Minimal ambient types for d3-sankey@0.12 (the package ships no declarations).
// Only the surface used by #lib/charts/sankey-data.js is described. Keep this
// file free of top-level import/export so it stays an ambient declaration.

declare module 'd3-sankey' {
	export interface SankeyNodeLayout {
		index: number;
		depth: number;
		height: number;
		layer: number;
		value: number;
		x0: number;
		x1: number;
		y0: number;
		y1: number;
		sourceLinks: SankeyLinkLayout[];
		targetLinks: SankeyLinkLayout[];
		[key: string]: unknown;
	}

	export interface SankeyLinkLayout {
		index: number;
		value: number;
		width: number;
		y0: number;
		y1: number;
		source: SankeyNodeLayout;
		target: SankeyNodeLayout;
		[key: string]: unknown;
	}

	export interface SankeyGraphInput {
		nodes: Record<string, unknown>[];
		links: { source: string | number; target: string | number; value: number }[];
	}

	export interface SankeyGraphLayout {
		nodes: SankeyNodeLayout[];
		links: SankeyLinkLayout[];
	}

	export interface SankeyLayout {
		(graph: SankeyGraphInput): SankeyGraphLayout;
		nodeId(id: (node: never) => string | number): SankeyLayout;
		nodeAlign(align: (node: SankeyNodeLayout, n: number) => number): SankeyLayout;
		nodeSort(sort: ((a: never, b: never) => number) | undefined | null): SankeyLayout;
		linkSort(sort: ((a: never, b: never) => number) | undefined | null): SankeyLayout;
		nodeWidth(width: number): SankeyLayout;
		nodePadding(padding: number): SankeyLayout;
		extent(extent: [[number, number], [number, number]]): SankeyLayout;
		size(size: [number, number]): SankeyLayout;
		iterations(iterations: number): SankeyLayout;
	}

	export function sankey(): SankeyLayout;
	export function sankeyJustify(node: SankeyNodeLayout, n: number): number;
	export function sankeyLeft(node: SankeyNodeLayout, n: number): number;
	export function sankeyRight(node: SankeyNodeLayout, n: number): number;
	export function sankeyCenter(node: SankeyNodeLayout, n: number): number;
	export function sankeyLinkHorizontal(): (link: SankeyLinkLayout) => string | null;
}
