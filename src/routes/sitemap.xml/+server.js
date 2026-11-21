import { loadContent } from '$lib/content/load.js';
import { buildSitemap } from '$lib/seo/sitemap.js';

export const prerender = true;

export async function GET() {
	return new Response(buildSitemap(await loadContent()), {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' }
	});
}
