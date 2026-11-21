import { error } from '@sveltejs/kit';
import { loadContent } from '$lib/content/load.js';
import { DISCIPLINES } from '$lib/content/types.js';

export const prerender = true;
export function entries() {
	return DISCIPLINES.map((discipline) => ({ discipline }));
}

export async function load({ params }) {
	if (!DISCIPLINES.some((discipline) => discipline === params.discipline)) {
		error(404, 'Sport discipline not found');
	}
	const discipline = /** @type {import('$lib/content/types.js').Discipline} */ (params.discipline);
	const items = (await loadContent()).filter(
		(item) => item.section === 'sport' && item.discipline === discipline
	);
	return { discipline, items };
}
