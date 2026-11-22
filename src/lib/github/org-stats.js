/**
 * Pure helpers for the private-work snapshot (src/lib/github/orgs.json,
 * refreshed by hand with `npm run github:refresh:all`; see
 * scripts/build-github-orgs.mjs).
 *
 * The snapshot holds only combined totals over all work in private
 * repositories: repositories contributed to, commits, pull requests, commits
 * per month and the language mix. Nothing is kept per organisation (not even
 * how many there are), and it never holds an organisation login, repository,
 * collaborator, email, SHA or URL; nothing here may add any. Every function
 * tolerates an empty or missing snapshot.
 */
import { MONTH_LABELS, commitsByMonth as publicCommitsByMonth, formatDate } from './stats.js';

/**
 * @typedef {object} PrivateAggregate
 * @property {number} reposContributed repositories with at least one commit by the owner
 * @property {number} commits commits by the owner on default branches
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

/** The only keys of the combined private aggregate (see org-stats.test.js). */
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
	if (!iso) return null;
	const date = new Date(iso);
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
 * Valid month keys with positive counts only.
 * @param {Record<string, number> | null | undefined} byMonth
 * @returns {Record<string, number>}
 */
function cleanMonths(byMonth) {
	/** @type {Record<string, number>} */
	const months = {};
	for (const [month, count] of Object.entries(byMonth ?? {})) {
		const value = Number(count) || 0;
		if (MONTH_KEY.test(month) && value > 0) months[month] = value;
	}
	return months;
}

/**
 * Combined private commits per YYYY-MM.
 * @param {OrgSnapshot | null | undefined} snapshot
 * @returns {Record<string, number>}
 */
export function privateCommitsByMonth(snapshot) {
	return cleanMonths(snapshot?.private?.commitsByMonth);
}

/**
 * Totals of the combined private aggregate (zeros when missing).
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
 * Last month a series can speak for: its snapshot month, else its latest
 * active month.
 * @param {string | null | undefined} generatedAt
 * @param {Record<string, number>} byMonth
 */
function seriesEnd(generatedAt, byMonth) {
	return monthOf(generatedAt) ?? (Object.keys(byMonth).sort().at(-1) || null);
}

/**
 * Public and private commits for the `months` months ending with the later of
 * the two snapshot months. A series is `null` (not collected) for months after
 * its own snapshot, so a stale snapshot never reads as zero activity.
 * @param {OrgSnapshot | null | undefined} snapshot
 * @param {import('./stats.js').Snapshot | null | undefined} publicSnapshot
 * @param {{ months?: number }} [options]
 * @returns {{ month: string, public: number | null, private: number | null }[]}
 */
export function combinedMonths(snapshot, publicSnapshot, { months = 24 } = {}) {
	const privateByMonth = privateCommitsByMonth(snapshot);
	const publicByMonth = cleanMonths(publicCommitsByMonth(publicSnapshot));
	const hasPrivate = Object.keys(privateByMonth).length > 0;
	const hasPublic = Object.keys(publicByMonth).length > 0;
	if (!hasPrivate && !hasPublic) return [];
	const privateEnd = hasPrivate ? seriesEnd(snapshot?.generatedAt, privateByMonth) : null;
	const publicEnd = hasPublic ? seriesEnd(publicSnapshot?.generatedAt, publicByMonth) : null;
	const end = [privateEnd, publicEnd]
		.filter((m) => m != null)
		.sort()
		.at(-1);
	if (!end) return [];
	return monthRange(shiftMonth(end, -(months - 1)), end).map((month) => ({
		month,
		public: publicEnd && month <= publicEnd ? (publicByMonth[month] ?? 0) : null,
		private: privateEnd && month <= privateEnd ? (privateByMonth[month] ?? 0) : null
	}));
}

/**
 * The month a snapshot was taken in, with its date, when that month is still
 * running (the snapshot is not from its last day): that month's counts are
 * month-to-date, not a full month.
 * @param {string | null | undefined} generatedAt
 * @returns {{ month: string, through: string } | null}
 */
function partialMonth(generatedAt) {
	const month = monthOf(generatedAt);
	if (!month || !generatedAt) return null;
	const date = new Date(generatedAt);
	const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
	if (next.getUTCMonth() !== date.getUTCMonth()) return null;
	const day = date.getUTCDate();
	const name = MONTH_LABELS[date.getUTCMonth()];
	return { month, through: `${day} ${name}` };
}

/**
 * Everything the GitHub activity panel renders, derived once on the server.
 * @param {OrgSnapshot | null | undefined} snapshot
 * @param {import('./stats.js').Snapshot | null | undefined} [publicSnapshot]
 */
export function orgActivity(snapshot, publicSnapshot) {
	const active = Object.keys(privateCommitsByMonth(snapshot)).sort();
	const totals = privateTotals(snapshot);
	const combined = combinedMonths(snapshot, publicSnapshot);
	const lastMonth = combined.at(-1)?.month ?? null;
	// The newest column is month-to-date when the later snapshot is from it.
	const latest = [snapshot?.generatedAt, publicSnapshot?.generatedAt]
		.filter((iso) => iso && monthOf(iso) === lastMonth)
		.sort()
		.at(-1);
	const partial = lastMonth ? partialMonth(latest) : null;
	return {
		asOf: formatDate(snapshot?.generatedAt),
		asOfIso: snapshot?.generatedAt ?? '',
		publicAsOf: formatDate(publicSnapshot?.generatedAt),
		publicAsOfIso: publicSnapshot?.generatedAt ?? '',
		isEmpty: totals.commits === 0 && totals.pullRequests === 0,
		totals,
		firstMonth: active[0] ?? null,
		lastMonth: active.at(-1) ?? null,
		languages: languageMix(snapshot?.private?.languageBytes),
		combined,
		combinedTotals: {
			public: combined.reduce((sum, row) => sum + (row.public ?? 0), 0),
			private: combined.reduce((sum, row) => sum + (row.private ?? 0), 0)
		},
		partial
	};
}

/** @typedef {ReturnType<typeof orgActivity>} OrgActivityData */
