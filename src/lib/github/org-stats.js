/**
 * Pure helpers for the anonymised private-organisation snapshot
 * (src/lib/github/orgs.json, refreshed manually with `npm run github:orgs`).
 *
 * The snapshot holds ONE merged aggregate over the private repositories:
 * repositories committed to, commits per month, pull-request totals and summed
 * language bytes. There is no breakdown, alias or organisation count, and no
 * organisation, repository or collaborator name, and nothing here may add any. Every function tolerates an empty or missing snapshot.
 */
import { commitsByMonth as publicCommitsByMonth, formatDate } from './stats.js';

/**
 * @typedef {object} PrivateAggregate
 * @property {number} reposContributed repositories with at least one commit by the login
 * @property {number} commits commits by the login on default branches
 * @property {number} pullRequests pull requests opened by the login (any state)
 * @property {Record<string, number>} commitsByMonth YYYY-MM -> commits
 * @property {Record<string, number>} languageBytes language -> bytes (top 8 + Other)
 */

/**
 * @typedef {object} OrgSnapshot
 * @property {string} generatedAt
 * @property {string} login
 * @property {PrivateAggregate | null} private
 */

/** The only keys of the private aggregate (see org-stats.test.js). */
export const PRIVATE_KEYS = Object.freeze([
	'reposContributed',
	'commits',
	'pullRequests',
	'commitsByMonth',
	'languageBytes'
]);

/** The only top-level keys of the snapshot. */
export const SNAPSHOT_KEYS = Object.freeze(['generatedAt', 'login', 'private']);

const MONTH_KEY = /^\d{4}-\d{2}$/;

/**
 * YYYY-MM of an ISO date (UTC), or null.
 * @param {string | undefined | null} iso
 */
function monthOf(iso) {
	const date = new Date(iso ?? '');
	if (Number.isNaN(date.getTime())) return null;
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * @param {string} month YYYY-MM
 * @param {number} delta months to add (may be negative)
 */
export function shiftMonth(month, delta) {
	const index = Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1 + delta;
	return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

/**
 * Every YYYY-MM from `from` to `to`, inclusive (empty when reversed or invalid).
 * @param {string | null | undefined} from
 * @param {string | null | undefined} to
 * @returns {string[]}
 */
export function monthRange(from, to) {
	if (!from || !to || !MONTH_KEY.test(from) || !MONTH_KEY.test(to) || from > to) return [];
	const out = [];
	for (let month = from; month <= to && out.length < 600; month = shiftMonth(month, 1)) {
		out.push(month);
	}
	return out;
}

/**
 * Language bytes as shares, largest first with "Other" always last.
 * @param {Record<string, number> | null | undefined} languageBytes
 * @returns {{ language: string, bytes: number, share: number }[]}
 */
export function languageMix(languageBytes) {
	const entries = Object.entries(languageBytes ?? {}).filter(
		([, bytes]) => Number.isFinite(bytes) && bytes > 0
	);
	const sum = entries.reduce((total, [, bytes]) => total + bytes, 0);
	if (sum === 0) return [];
	return entries
		.sort(
			(a, b) =>
				Number(a[0] === 'Other') - Number(b[0] === 'Other') ||
				b[1] - a[1] ||
				a[0].localeCompare(b[0])
		)
		.map(([language, bytes]) => ({ language, bytes, share: bytes / sum }));
}

/**
 * Private commits per YYYY-MM (valid month keys, positive counts only).
 * @param {OrgSnapshot | null | undefined} snapshot
 * @returns {Record<string, number>}
 */
export function privateCommitsByMonth(snapshot) {
	/** @type {Record<string, number>} */
	const months = {};
	for (const [month, count] of Object.entries(snapshot?.private?.commitsByMonth ?? {})) {
		const value = Number(count) || 0;
		if (MONTH_KEY.test(month) && value > 0) months[month] = value;
	}
	return months;
}

/**
 * Totals of the private aggregate (zeros when missing).
 * @param {OrgSnapshot | null | undefined} snapshot
 */
export function privateTotals(snapshot) {
	const agg = snapshot?.private;
	return {
		reposContributed: Number(agg?.reposContributed) || 0,
		commits: Number(agg?.commits) || 0,
		pullRequests: Number(agg?.pullRequests) || 0
	};
}

/**
 * Private month window: from the earliest active month to the snapshot month
 * (or the latest active month without a date).
 * @param {OrgSnapshot | null | undefined} snapshot
 * @returns {string[]}
 */
export function privateMonths(snapshot) {
	const active = Object.keys(privateCommitsByMonth(snapshot)).sort();
	if (active.length === 0) return [];
	const last = active[active.length - 1];
	const end = monthOf(snapshot?.generatedAt);
	return monthRange(active[0], end && end > last ? end : last);
}

/**
 * Public and private commits per month for the combined chart: at least the
 * last `minMonths` months up to the snapshot month, extended back to the first
 * private month, never more than `maxMonths`.
 * @param {OrgSnapshot | null | undefined} snapshot
 * @param {import('./stats.js').Snapshot | null | undefined} publicSnapshot
 * @param {{ minMonths?: number, maxMonths?: number }} [options]
 * @returns {{ month: string, public: number, private: number }[]}
 */
export function combinedMonths(snapshot, publicSnapshot, { minMonths = 12, maxMonths = 24 } = {}) {
	const months = privateMonths(snapshot);
	if (months.length === 0) return [];
	const end = months.at(-1) ?? '';
	const start = [months[0], shiftMonth(end, -(minMonths - 1))].sort()[0];
	const window = monthRange(start, end).slice(-maxMonths);
	const privateByMonth = privateCommitsByMonth(snapshot);
	const publicByMonth = publicCommitsByMonth(publicSnapshot);
	return window.map((month) => ({
		month,
		public: publicByMonth[month] ?? 0,
		private: privateByMonth[month] ?? 0
	}));
}

/**
 * Everything the private-work panel renders, derived once on the server.
 * @param {OrgSnapshot | null | undefined} snapshot
 * @param {import('./stats.js').Snapshot | null | undefined} [publicSnapshot]
 */
export function orgActivity(snapshot, publicSnapshot) {
	const active = Object.keys(privateCommitsByMonth(snapshot)).sort();
	const totals = privateTotals(snapshot);
	const combined = combinedMonths(snapshot, publicSnapshot);
	return {
		asOf: formatDate(snapshot?.generatedAt),
		asOfIso: snapshot?.generatedAt ?? '',
		isEmpty: totals.commits === 0 && totals.pullRequests === 0,
		totals,
		firstMonth: active[0] ?? null,
		lastMonth: active.at(-1) ?? null,
		languages: languageMix(snapshot?.private?.languageBytes),
		combined,
		combinedTotals: {
			public: combined.reduce((sum, row) => sum + row.public, 0),
			private: combined.reduce((sum, row) => sum + row.private, 0)
		}
	};
}

/** @typedef {ReturnType<typeof orgActivity>} OrgActivityData */
