/** @typedef {'projects' | 'diy' | 'sport'} Section */
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
 * @property {string} excerpt
 * @property {string} html
 * @property {string[]} links
 * @property {string[]} [tech]
 * @property {string} [externalLink]
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
