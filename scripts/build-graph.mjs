import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../src/lib/content/load.js';
import { buildGraph } from '../src/lib/graph/build.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const contentRoot = join(root, 'content');
const outPath = join(root, 'src/lib/graphs/graph.json');

const items = await loadContent(contentRoot);
const graph = buildGraph(items);

writeFileSync(outPath, JSON.stringify(graph, null, 2));
console.log(`[build-graph] wrote ${graph.nodes.length} nodes, ${graph.edges.length} edges to ${outPath}`);
