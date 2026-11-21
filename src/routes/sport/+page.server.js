import { loadContent } from '$lib/content/load.js';

export const prerender = true;

export async function load() {
	const items = (await loadContent()).filter((item) => item.section === 'sport');
	return { items };
}
