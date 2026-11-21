import graphJson from '$lib/graphs/graph.json';
import githubJson from '$lib/github/github.json';
import { buildSankeyData } from '$lib/charts/sankey-data.js';
import { githubDashboard } from '$lib/github/stats.js';

export const prerender = true;

// JSON imports widen string unions (node kinds, optional languages), so narrow
// them to the generated shapes once here.
const graphData = /** @type {import('$lib/graph/build.js').GraphData} */ (
	/** @type {unknown} */ (graphJson)
);
const github = /** @type {import('$lib/github/stats.js').Snapshot} */ (
	/** @type {unknown} */ (githubJson)
);

/**
 * Charts over data the site already publishes: the knowledge graph (as a flow),
 * the self-assessed skills profile from the CV, and a manual public GitHub snapshot.
 */
export function load() {
	const flow = buildSankeyData(graphData);
	// Ship only what the dashboard renders: the raw snapshot (fork records,
	// per-repo language bytes and commit histories) would otherwise be serialised
	// into the page's hydration data and __data.json.
	const dashboard = githubDashboard(github);
	return {
		graphData,
		github: dashboard,
		summary: {
			projects: flow.total,
			fields: flow.fields.length,
			repos: dashboard.counts.own
		}
	};
}
