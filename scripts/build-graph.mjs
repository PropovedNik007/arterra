import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../src/lib/content/load.js';
import { buildGraph, unclassifiedItems } from '../src/lib/graph/build.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const contentRoot = join(root, 'content');
const outPath = join(root, 'src/lib/graphs/graph.json');

const items = await loadContent(contentRoot);
const graph = buildGraph(items);

for (const item of unclassifiedItems(items)) {
	console.warn(
		`[build-graph] "${item.slug}" has no field of work — add tags or an ITEM_FIELDS entry in src/lib/graph/taxonomy.js`
	);
}

writeFileSync(outPath, `${JSON.stringify(graph, null, '\t')}\n`);
const kinds = graph.nodes.reduce(
	(counts, node) => ({ ...counts, [node.kind]: (counts[node.kind] ?? 0) + 1 }),
	/** @type {Record<string, number>} */ ({})
);
console.log(
	`[build-graph] wrote ${graph.nodes.length} nodes (${Object.entries(kinds)
		.map(([kind, count]) => `${count} ${kind}`)
		.join(', ')}), ${graph.edges.length} edges to ${outPath}`
);
