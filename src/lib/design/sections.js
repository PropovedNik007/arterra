/** @typedef {import('../content/types.js').Section} Section */
/** @typedef {import('../content/types.js').Discipline} Discipline */

/** @type {Record<Section, { label: string, accent: string, path: string }>} */
export const SECTION_META = {
	projects: { label: 'Projects', accent: 'var(--accent-projects)', path: '/projects' },
	diy: { label: 'DIY', accent: 'var(--accent-diy)', path: '/diy' },
	sport: { label: 'Sport', accent: 'var(--accent-sport)', path: '/sport' }
};

/** @type {Record<Discipline, { label: string, icon: string, path: string }>} */
export const DISCIPLINE_META = {
	hiking: { label: 'Hiking', icon: '🥾', path: '/sport/hiking' },
	boxing: { label: 'Boxing', icon: '🥊', path: '/sport/boxing' },
	diving: { label: 'Diving', icon: '🤿', path: '/sport/diving' },
	'table-tennis': { label: 'Table Tennis', icon: '🏓', path: '/sport/table-tennis' }
};

/**
 * Site-relative path (without the SvelteKit base) for a content item's detail page.
 * @param {import('../content/types.js').ContentItem} item
 * @returns {string}
 */
export function itemPath(item) {
	const sectionPath =
		item.section === 'sport' && item.discipline
			? DISCIPLINE_META[item.discipline].path
			: SECTION_META[item.section].path;
	return `${sectionPath}/${item.slug}`;
}
