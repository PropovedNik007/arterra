#!/usr/bin/env node
/**
 * Writes static/favicon.svg: the owner's initials in Armenian capitals (ԱՍ),
 * drawn from the same letter centrelines as the toolpath monogram
 * (src/lib/design/ornaments/letters.js) as single bold strokes, so they stay
 * legible at 16 px, on the site's dark background.
 *
 * The PNG and ICO fallbacks (favicon.png, apple-touch-icon.png, favicon.ico)
 * are rasterised from this SVG by hand when it changes, e.g. on macOS:
 *   sips -s format png -z 192 192 static/favicon.svg --out static/favicon.png
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CAP, GLYPHS, MONOGRAM_GAP } from '../src/lib/design/ornaments/letters.js';

const root = fileURLToPath(new URL('..', import.meta.url));

const BG = '#151514'; // --color-bg
const INK = '#e17b5a'; // --accent-coral

// Lay the two glyphs side by side (Ayb, then Se) and centre them in the tile.
const strokes = [
	...GLYPHS.ayb.strokes,
	...GLYPHS.se.strokes.map((stroke) =>
		stroke.map((p) => ({ x: p.x + GLYPHS.ayb.advance + MONOGRAM_GAP + 12, y: p.y }))
	)
];
const xs = strokes.flat().map((p) => p.x);
const minX = Math.min(...xs);
const width = Math.max(...xs) - minX;
const size = 128;
const pad = 22;
const scale = (size - pad * 2) / Math.max(width, CAP);
const dx = (size - width * scale) / 2 - minX * scale;
const dy = (size - CAP * scale) / 2;
const path = (stroke) =>
	'M' +
	stroke.map((p) => `${(p.x * scale + dx).toFixed(1)} ${(p.y * scale + dy).toFixed(1)}`).join('L');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" rx="28" fill="${BG}"/>
<g fill="none" stroke="${INK}" stroke-width="11" stroke-linejoin="round" stroke-linecap="round">
${strokes.map((stroke) => `<path d="${path(stroke)}"/>`).join('\n')}
</g>
</svg>
`;

writeFileSync(`${root}static/favicon.svg`, svg);
console.log(`[build-favicon] wrote static/favicon.svg (${svg.length} bytes)`);
