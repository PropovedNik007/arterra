import { loadContent } from '$lib/content/load.js';

export const prerender = true;

export async function load() {
	const items = await loadContent();
	const projects = items.filter((item) => item.section === 'projects');
	return {
		projects,
		featured: projects.slice(0, 3),
		latest: items.slice(0, 4),
		counts: {
			projects: items.filter((item) => item.section === 'projects').length,
			diy: items.filter((item) => item.section === 'diy').length,
			sport: items.filter((item) => item.section === 'sport').length
		}
	};
}
