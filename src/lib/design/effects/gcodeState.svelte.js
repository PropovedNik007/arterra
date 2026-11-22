/**
 * Shared on/off state of the G-code view. The footer toggle and the `g`
 * shortcut flip it; SiteEffects.svelte applies it to <html data-gcode>,
 * renders the panel and persists the choice per visitor.
 */

export const GCODE_STORAGE_KEY = 'arterra:gcode';

export const gcode = $state({
	/** The slicer view is showing. */
	on: false,
	/** SiteEffects has mounted, so the toggle works (no dead button without JS). */
	ready: false,
	/** Polite status text, set only by a user toggle. */
	status: ''
});

/** @param {boolean} on */
function persist(on) {
	try {
		if (on) localStorage.setItem(GCODE_STORAGE_KEY, 'on');
		else localStorage.removeItem(GCODE_STORAGE_KEY);
	} catch {
		// Storage blocked (private mode, sandbox): the view still works this visit.
	}
}

/** @returns {boolean} */
export function readStoredGcode() {
	try {
		return localStorage.getItem(GCODE_STORAGE_KEY) === 'on';
	} catch {
		return false;
	}
}

/**
 * Turn the view on or off from a user action: persists and announces once.
 * @param {boolean} [on]
 */
export function setGcode(on = !gcode.on) {
	if (on === gcode.on) return;
	gcode.on = on;
	gcode.status = on ? 'G-code view on' : 'G-code view off';
	persist(on);
}
