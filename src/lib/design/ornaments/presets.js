/**
 * Every toolpath ornament the site shows, by placement. Geometry is computed
 * at build time (scripts/build-ornaments.mjs) into one cached sprite,
 * `static/ornaments/toolpaths.svg`, plus `hero.json` for the one animated
 * ornament; components only reference a preset by name. `viewBox` repeats the
 * size each preset produces so components never import the geometry code.
 *
 * Bands are generated at least as long as the widest slot's aspect ratio
 * (shell width / band height), so `fit="slice"` only ever trims their ends and
 * the ribbon keeps the same on-screen thickness from 375px to 1440px.
 */
export const ORNAMENT_PRESETS = /** @type {const} */ ({
	hero: { motif: 'eternity', options: {}, viewBox: '0 0 1000 1000' },
	corner: {
		motif: 'eternity',
		options: { offsets: 2, spacing: 13, infill: false, skirt: false },
		viewBox: '0 0 1000 1000'
	},
	star: { motif: 'star', options: {}, viewBox: '0 0 1000 1000' },
	/** Under page intros: 2.5rem tall, up to 76rem wide (30.4:1). */
	'intro-band': {
		motif: 'interlace',
		options: { length: 4960, height: 160 },
		viewBox: '0 0 4960 160'
	},
	/** On the footer's top edge: 1.5rem tall, up to 76rem wide (50.7:1). */
	'footer-band': {
		motif: 'interlace',
		options: { length: 2600, height: 50, grooves: 2, eyelets: 1 },
		viewBox: '0 0 2600 50'
	}
});

/** @typedef {keyof typeof ORNAMENT_PRESETS} OrnamentPreset */

/** Published path of the sprite inside `static/`. */
export const SPRITE_FILE = 'ornaments/toolpaths.svg';
