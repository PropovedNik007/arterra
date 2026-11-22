// SvelteKit 3 removed `base` from `$app/paths`. These helpers keep the site's
// data model (site-relative paths with a leading slash, e.g. from graph.json,
// cv.js and the sitemap) and prefix them through `resolve()` / `asset()`, so
// the GitHub Pages `/arterra` base path and relative prerender paths still work.
import { asset, resolve } from '$app/paths';

/**
 * URL of a site page from a site-relative path (leading slash, may carry a
 * `?query` or `#hash`), e.g. `sitePath('/projects?tag=go')`.
 * @param {string} path
 * @returns {string}
 */
export function sitePath(path) {
	return resolve(/** @type {import('$app/types').Path} */ (path.replace(/^\//, '')));
}

/**
 * URL of a file in `static/`, with or without a leading slash, e.g.
 * `staticPath('images/profile.png')`.
 * @param {string} file
 * @returns {string}
 */
export function staticPath(file) {
	return asset(/** @type {import('$app/types').AssetPath} */ (file.replace(/^\//, '')));
}
