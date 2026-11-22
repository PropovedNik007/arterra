/**
 * Give the GitHub Pages fallback (build/404.html) a static "Page not found"
 * for visitors without JavaScript. The adapter writes that file as an empty
 * client-rendered shell, so without scripts a missing URL would be blank; the
 * real error page (src/routes/+error.svelte) only renders once JS runs.
 *
 * Runs after `vite build`. Only 404.html gets the <noscript> block: putting it
 * in src/app.html would show it on every page when scripts are off.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const file = join(root, 'build', '404.html');
// Same base as vite.config.ts for a production build.
const base = process.env.BASE_PATH ?? '/arterra';
const MARK = 'data-static-404';

if (!existsSync(file)) {
	console.error('[build-404-fallback] build/404.html not found; run vite build first');
	process.exit(1);
}

const html = readFileSync(file, 'utf8');
if (html.includes(MARK)) {
	console.log('[build-404-fallback] already present');
} else {
	/** @param {string} path */
	const href = (path) => `${base}${path}`.replace(/\/{2,}/g, '/') || '/';
	const links = [
		['/', 'Home'],
		['/projects', 'Projects'],
		['/insights', 'Insights']
	]
		.map(([path, label]) => `<li><a style="color:#f09a7d" href="${href(path)}">${label}</a></li>`)
		.join('');
	const block =
		`<noscript ${MARK}><style>body{margin:0;background:#151514}</style><main style="max-width:40rem;margin:0 auto;padding:4rem 1rem;` +
		`font:1rem/1.6 system-ui,sans-serif;color:#cbc7bd;background:#151514">` +
		`<p>Error 404</p><h1 style="color:#fbf8f2">Page not found.</h1>` +
		`<p>This address does not exist on the site. Try one of these instead:</p>` +
		`<ul>${links}</ul></main></noscript>`;
	if (!html.includes('</body>')) {
		console.error('[build-404-fallback] no </body> in build/404.html');
		process.exit(1);
	}
	writeFileSync(file, html.replace('</body>', `${block}</body>`));
	console.log('[build-404-fallback] added the no-JS page to build/404.html');
}
