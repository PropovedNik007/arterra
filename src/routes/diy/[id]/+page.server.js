import { error } from '@sveltejs/kit';
import { loadContent } from '$lib/content/load.js';

export const prerender = true;

export async function entries() {
	return (await loadContent())
		.filter((item) => item.section === 'diy')
		.map((item) => ({ id: item.slug }));
}

export async function load({ params }) {
	const item = (await loadContent()).find(
		(candidate) => candidate.section === 'diy' && candidate.slug === params.id
	);
	if (!item) error(404, 'DIY note not found');
	return { item };
}
