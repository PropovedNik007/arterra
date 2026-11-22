/**
 * Ornament ink by season. Outside the section pages (home, about, FAQ,
 * contact, the footer) the toolpath ornaments take a hue that drifts with the
 * month: cool slate and teal in winter, greens in spring, gold and coral in
 * summer, amber and rust in autumn. Section pages keep their own accent
 * (projects coral, DIY amber, sport red, insights graph green); see
 * `--ornament-section` in tokens.css.
 *
 * The hues sit at the lightness of the section accents, so the same
 * `--ornament-shade` darkening and `--ornament-opacity` ceiling keep text over
 * an ornament at WCAG AA in every month (checked in palette.test.js).
 */

/** One hue per month, January first. */
export const MONTH_INKS = /** @type {const} */ ([
	'#8fa6bd', // January: cool slate
	'#7fb0b4', // February: slate teal
	'#6fbf9c', // March: sea green
	'#86bf72', // April: new leaf
	'#a8bf5c', // May: meadow
	'#d6b247', // June: gold
	'#e39a4f', // July: apricot
	'#e17b5a', // August: coral
	'#dd9a3f', // September: amber
	'#cf7442', // October: rust
	'#b9785c', // November: russet
	'#7f9fb5' // December: winter slate
]);

/**
 * Ink for the month of `date` in the viewer's local time.
 * @param {Date} [date]
 */
export function monthInk(date = new Date()) {
	return MONTH_INKS[date.getMonth()];
}

/* ---------------------------------------------------------- colour maths */

/** @param {string} hex `#rrggbb` @returns {[number, number, number]} */
export function parseHex(hex) {
	const value = Number.parseInt(hex.replace('#', ''), 16);
	return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/**
 * `color-mix(in srgb, a share, b)` with `share` in 0–1.
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} share
 */
export function mix(a, b, share) {
	return a.map((channel, index) => channel * share + b[index] * (1 - share));
}

/** WCAG relative luminance of an sRGB colour (0–255 channels). @param {number[]} rgb */
export function luminance(rgb) {
	const [r, g, b] = rgb.map((channel) => {
		const c = channel / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio. @param {number[]} a @param {number[]} b */
export function contrast(a, b) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}
