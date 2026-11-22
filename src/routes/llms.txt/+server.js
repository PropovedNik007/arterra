import { loadContent } from '#lib/content/load.js';
import { buildFaq, featuredProjects } from '#lib/content/faq.js';
import { buildLlmsTxt } from '#lib/seo/llms.js';

export const prerender = true;

export async function GET() {
	const featured = featuredProjects(await loadContent());
	return new Response(buildLlmsTxt({ faq: buildFaq(featured), featured }), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
}
