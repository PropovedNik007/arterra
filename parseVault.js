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
        // Handle directory as a node
        const folderName = path.relative(vaultPath, fullPath);
        if (!folderName.startsWith('.')) {
          graph.nodes.push({ id: folderName, label: folderName, type: 'folder' });

          // Create an edge between the folder and its parent folder
          if (parentFolder) {
            graph.edges.push({ source: parentFolder, target: folderName });
          }
        }

        // Recurse into the folder
        traverseDirectory(fullPath, folderName);
      } else if (file.endsWith('.md')) {
        // Handle Markdown file as a node
        const node = path.relative(vaultPath, fullPath).replace(/\.md$/, '');
        const nodeName = path.basename(node);
        graph.nodes.push({ id: nodeName, label: nodeName, type: 'file', folder: parentFolder });

        // Create an edge between the file and its containing folder
        if (parentFolder) {
          graph.edges.push({ source: parentFolder, target: nodeName });
        }

        const content = fs.readFileSync(fullPath, 'utf8');
        const links = [...content.matchAll(internalLinkRegex)].map(match => match[1]);
        console.log(links);
        // Add edges for internal links between Markdown files
        links.forEach((link) => {
          // Normalize the link to match the node IDs (remove .md, handle subfolder paths, etc.)
          const linkedFile = path.join(path.dirname(nodeName), link).replace(/\.md$/, '');
          const targetNode = graph.nodes.find(node => node.label === linkedFile);

          if (targetNode) {
            graph.edges.push({ source: nodeName, target: linkedFile });
          }
          else {
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
