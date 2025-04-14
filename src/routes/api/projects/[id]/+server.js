// @ts-nocheck
import { error } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the vault directory
const vaultPath = resolve(__dirname, '../../../../../arterra_vault');

export async function GET({ params }) {
	try {
		const { id } = params;
		
		// Construct the path to the markdown file
		const filePath = join(vaultPath, 'Projects', `${id}.md`);
		
		// Check if the file exists
		try {
			// Read the file content
			const content = readFileSync(filePath, 'utf8');
			
			// Return the content with appropriate headers
			return new Response(content, {
				headers: {
					'Content-Type': 'text/markdown'
				}
			});
		} catch (fileError) {
			// File not found or other file system error
			throw error(404, 'Project not found');
		}
	} catch (err) {
		console.error('Error serving project content:', err);
		throw error(500, 'Internal Server Error');
	}
} 