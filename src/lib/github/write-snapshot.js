/**
 * Shared writer for the GitHub snapshot scripts (scripts/build-github.mjs and
 * scripts/build-github-orgs.mjs). Node-only: never import it from a page.
 *
 * A refresh should only produce a diff when the data changed, so the write is
 * skipped when the new snapshot equals the committed one apart from
 * `generatedAt` AND both fall in the same UTC month (the charts anchor their
 * month window to `generatedAt`, so a new month always rewrites it).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/** @param {string} iso */
const monthOf = (iso) => String(iso ?? '').slice(0, 7);

/**
 * @param {string} outPath
 * @param {{ generatedAt: string } & Record<string, unknown>} snapshot
 * @param {{ force?: boolean }} [options] force: always write (pinned generatedAt)
 * @returns {Promise<boolean>} whether the file was written
 */
export async function writeSnapshot(outPath, snapshot, { force = false } = {}) {
	if (!force && existsSync(outPath)) {
		try {
			const previous = JSON.parse(readFileSync(outPath, 'utf8'));
			const strip = (/** @type {Record<string, unknown>} */ value) =>
				JSON.stringify({ ...value, generatedAt: null });
			if (
				strip(previous) === strip(snapshot) &&
				monthOf(previous.generatedAt) === monthOf(snapshot.generatedAt)
			) {
				return false;
			}
		} catch {
			// Unreadable or invalid previous snapshot: overwrite it.
		}
	}
	// Format like the rest of the repo so `prettier --check` stays clean.
	const prettier = await import('prettier');
	const options = (await prettier.resolveConfig(outPath)) ?? {};
	writeFileSync(
		outPath,
		await prettier.format(JSON.stringify(snapshot), { ...options, parser: 'json' })
	);
	return true;
}
