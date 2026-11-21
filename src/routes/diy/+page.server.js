import { loadContent } from '$lib/content/load.js';

export const prerender = true;

export async function load() {
	const items = await loadContent();
	return { items: items.filter((item) => item.section === 'diy') };
}
