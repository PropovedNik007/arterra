/**
 * @typedef {object} GalleryImage
 * @property {string} src Site-relative image path (no leading slash, no base).
 * @property {string} alt
 * @property {string} [caption]
 */

/** @typedef {'projects' | 'diy' | 'sport'} Section */
/**
 * What `externalLink` points at: a live deployment of the work, an article
 * about it (e.g. a Medium write-up), or a related site such as a partner's.
 * @typedef {'live' | 'article' | 'site'} ExternalKind
 */
/** @typedef {'hiking' | 'boxing' | 'diving' | 'table-tennis'} Discipline */

/**
 * @typedef {object} ContentItem
 * @property {string} slug
 * @property {Section} section
 * @property {Discipline} [discipline]
 * @property {string} title
 * @property {string} date
 * @property {string} [updated]
 * @property {string[]} tags
 * @property {string} [cover]
 * @property {GalleryImage[]} [gallery] Extra images shown under the article.
 * @property {string} excerpt
 * @property {string} html
 * @property {string[]} links
 * @property {string[]} [tech]
 * @property {string} [externalLink]
 * @property {boolean} [externalLive] True when externalLink is a live deployment of the work.
 * @property {ExternalKind} [externalKind] Kind of externalLink; drives the button label.
 * @property {boolean} [featured]
 * @property {number} [featuredOrder]
 * @property {string} [printer]
 * @property {string} [material]
 * @property {number} [distance_km]
 * @property {number} [gain_m]
 * @property {string} [region]
 * @property {string} [gpx]
 * @property {boolean} [led_group]
 */

/** @type {Section[]} */
export const SECTIONS = ['projects', 'diy', 'sport'];

/** @type {Discipline[]} */
export const DISCIPLINES = ['hiking', 'boxing', 'diving', 'table-tennis'];

/**
 * @param {unknown} value
 * @returns {value is Section}
 */
export function isSection(value) {
	return typeof value === 'string' && SECTIONS.includes(/** @type {Section} */ (value));
}

/**
 * @param {unknown} value
 * @returns {value is Discipline}
 */
export function isDiscipline(value) {
	return typeof value === 'string' && DISCIPLINES.includes(/** @type {Discipline} */ (value));
}
