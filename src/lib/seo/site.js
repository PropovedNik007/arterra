/**
 * Public site identity shared by structured data, the sitemap, and llms.txt.
 *
 * The production site always lives under `/arterra` on GitHub Pages, so these
 * absolute URLs are constants rather than derived from `base` (which is
 * relative during prerender and empty in development).
 */

import { cv } from '../content/cv.js';

export const SITE_ORIGIN = 'https://propovednik007.github.io';
export const SITE_URL = `${SITE_ORIGIN}/arterra`;

/** City part of `cv.location`, in case it ever carries a country suffix. */
export const CITY = cv.location.split(',')[0].trim();
export const COUNTRY = 'Austria';
export const COUNTRY_CODE = 'AT';

/** Approved public contact channels. */
export const PROFILE = {
	email: 'arthur.sogomonyan@gmail.com',
	linkedin: 'https://linkedin.com/in/artur-sogomonyan',
	github: 'https://github.com/PropovedNik007',
	telegram: 'https://t.me/arterrai',
	medium: 'https://medium.com/@artur.sogomonyan'
};

/**
 * Absolute production URL for a site-relative path ("/" → the home page).
 * @param {string} path
 * @returns {string}
 */
export function absoluteUrl(path) {
	return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

/**
 * Serialise structured data for an inline `<script type="application/ld+json">`.
 * `<` is escaped so no string in the data can close the script element.
 * @param {unknown} data
 * @returns {string}
 */
export function jsonLdScript(data) {
	const json = JSON.stringify(data).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${json}</` + `script>`;
}
