import { loadContent } from '$lib/content/load.js';
import { buildFaq, featuredProjects } from '$lib/content/faq.js';

export const prerender = true;

export async function load() {
	return { faq: buildFaq(featuredProjects(await loadContent())) };
}
