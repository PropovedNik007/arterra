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

// Temporary compatibility bridge: the pre-redesign Projects.svelte / Graph.svelte
// / projects/[id] page (not yet migrated to the new content pipeline — that's
// Phase (b)) still read the old graph.json node shape (`folder`, `description`,
// `tags`, `img`, `link`). Layer those fields onto the new nodes so those pages
// keep working until they're rewritten. Remove this block once Phase (b) lands.
const itemsBySlug = new Map(items.map((item) => [item.slug, item]));
for (const node of graph.nodes) {
	const item = itemsBySlug.get(node.id);
	if (!item) continue;
	if (item.section === 'projects') node.folder = 'Projects';
	node.type = 'file';
	node.description = item.excerpt;
	node.tags = item.tags;
	if (item.cover) node.img = item.cover;
	if (item.externalLink) node.link = item.externalLink;
	node.order = 0;
}

writeFileSync(outPath, JSON.stringify(graph, null, 2));
console.log(`[build-graph] wrote ${graph.nodes.length} nodes, ${graph.edges.length} edges to ${outPath}`);
