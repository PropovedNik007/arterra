import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';

// If needed, resolve __dirname since it is not available in ES modules by default
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vaultPath = './arterra_vault'; // Replace with your actual vault path

// Regular expression to match Obsidian-style internal links: [[link]]
const internalLinkRegex = /\[\[([^\]]+)\]\]/g;

function parseVault(vaultPath) {
  const graph = { nodes: [], edges: [] };

  function traverseDirectory(dirPath, parentFolder = null) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const folderName = path.relative(vaultPath, fullPath);
        if (!folderName.startsWith('.')) {
          graph.nodes.push({ id: folderName, label: folderName, type: 'folder' });

          if (parentFolder) {
            graph.edges.push({ source: parentFolder, target: folderName });
          }
        }

        traverseDirectory(fullPath, folderName);
      } else if (file.endsWith('.md')) {
        const node = path.relative(vaultPath, fullPath).replace(/\.md$/, '');
        const nodeName = path.basename(node);
        const fileContent = fs.readFileSync(fullPath, 'utf8');

        const { content, data } = matter(fileContent); // Extract frontmatter

        // Extract tags, name, description, img from frontmatter
        const tags = data.tags || [];
        const name = data.name || nodeName;
        const description = data.description || '';
        const img = data.img ? data.img.match(internalLinkRegex)?.[0]?.replace(/\[\[|\]\]/g, '') : null;
        const link = data.link || null;
        const order = data.order || 0;

        graph.nodes.push({
          id: nodeName,
          label: name,
          type: 'file',
          folder: parentFolder,
          description,
          tags,
          img,
          link,
          order
        });

        if (parentFolder) {
          graph.edges.push({ source: parentFolder, target: nodeName });
        }

        const links = [...content.matchAll(internalLinkRegex)].map((match) => match[1]);

        links.forEach((link) => {
          const linkedFile = path.join(path.dirname(nodeName), link).replace(/\.md$/, '');
          const targetNode = graph.nodes.find((node) => node.label === linkedFile);

          if (targetNode) {
            graph.edges.push({ source: nodeName, target: linkedFile });
          } else {
            console.warn(`Link target not found: ${linkedFile}`);
          }
        });
      }
    });
  }

  traverseDirectory(vaultPath);
  return graph;
}

const graphData = parseVault(vaultPath);
fs.writeFileSync('./src/lib/graphs/graph.json', JSON.stringify(graphData, null, 2));
console.log('Graph data generated: graph.json');
