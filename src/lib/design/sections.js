/** @typedef {import('../content/types.js').Section} Section */
/** @typedef {import('../content/types.js').Discipline} Discipline */

/** @type {Record<Section, { label: string, accent: string, path: string }>} */
export const SECTION_META = {
	projects: { label: 'Projects', accent: 'var(--accent-projects)', path: '/projects' },
	diy: { label: 'DIY', accent: 'var(--accent-diy)', path: '/diy' },
	sport: { label: 'Sport', accent: 'var(--accent-sport)', path: '/sport' }
};

/** @type {Record<Discipline, { label: string, icon: string, path: string, description: string }>} */
export const DISCIPLINE_META = {
	hiking: {
		label: 'Hiking',
		icon: '🥾',
		path: '/sport/hiking',
		description: 'Routes, conditions, elevation, and the small decisions that shape a day outside.'
	},
	boxing: {
		label: 'Boxing',
		icon: '🥊',
		path: '/sport/boxing',
		description: 'Training notes, sparring lessons, and drills worth repeating.'
	},
	diving: {
		label: 'Diving',
		icon: '🤿',
		path: '/sport/diving',
		description: 'Sites, depth, conditions, and observations below the surface.'
	},
	'table-tennis': {
		label: 'Table Tennis',
		icon: '🏓',
		path: '/sport/table-tennis',
		description: 'Practice notes, matches, equipment, and tactical patterns.'
	}
};

/**
 * Site-relative path (without the SvelteKit base) for a content item's detail page.
 * @param {Pick<import('../content/types.js').ContentItem, 'section' | 'discipline' | 'slug'>} item
 * @returns {string}
 */
export function itemPath(item) {
	const sectionPath =
		item.section === 'sport' && item.discipline
			? DISCIPLINE_META[item.discipline].path
			: SECTION_META[item.section].path;
	return `${sectionPath}/${item.slug}`;
}

/**
 * Human-readable note date ("14 Jun 2026"). Only use this for DIY and sport
 * notes: a project's `created` date is the vault note date, not the project
 * period, so project pages never show it.
 * @param {string | undefined} date YYYY-MM-DD
 * @returns {string}
 */
export function formatNoteDate(date) {
	if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) return date ?? '';
	const parsed = new Date(`${date.slice(0, 10)}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return date;
	return parsed.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC'
	});
}

/**
 * Whether a section's items carry a meaningful date that may be shown.
 * @param {Section} section
 */
export function showsDate(section) {
	return section !== 'projects';
}

/**
 * Display label for a tag: lower-case kebab tags ("digital-twins") read as
 * words ("digital twins"); proper names ("LLaMA-3", "Next.js") stay as written.
 * @param {string} tag
 * @returns {string}
 */
export function tagLabel(tag) {
	return /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(tag) ? tag.replace(/-/g, ' ') : tag;
}
