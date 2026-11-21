/**
 * Pure helpers that turn the committed GitHub snapshot (src/lib/github/github.json,
 * refreshed manually with `npm run github:refresh`) into dashboard data.
 *
 * Forks are other people's projects: they are only ever counted, never included
 * in language, activity or "most active" statistics. Every function tolerates an
 * empty or missing snapshot and returns zeros/empty arrays rather than NaN.
 */

/**
 * @typedef {object} Repo
 * @property {string} name
 * @property {string | null} description
 * @property {string} html_url
 * @property {boolean} fork
 * @property {string | null} language
 * @property {Record<string, number>} languages bytes per language
 * @property {number} stargazers_count
 * @property {number} forks_count
 * @property {string} created_at ISO date
 * @property {string} pushed_at ISO date
 * @property {string[]} topics
 * @property {boolean} archived
 * @property {Record<string, number>} commitsByMonth YYYY-MM -> commits by the login
 */

/**
 * @typedef {object} Snapshot
 * @property {string} generatedAt ISO date the snapshot was taken
 * @property {string} login
 * @property {string} [profileUrl]
 * @property {Repo[]} repos
 */

/** @typedef {{ label: string, count: number }} Bucket */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * @param {Snapshot | null | undefined} snapshot
 * @returns {Repo[]}
 */
function allRepos(snapshot) {
	return Array.isArray(snapshot?.repos) ? snapshot.repos : [];
}

/**
 * Own, non-fork repositories.
 * @param {Snapshot | null | undefined} snapshot
 */
export function ownRepos(snapshot) {
	return allRepos(snapshot).filter((repo) => !repo.fork);
}

/**
 * @param {Snapshot | null | undefined} snapshot
 * @returns {{ own: number, forks: number, total: number }}
 */
export function repoCounts(snapshot) {
	const repos = allRepos(snapshot);
	const forks = repos.filter((repo) => repo.fork).length;
	return { own: repos.length - forks, forks, total: repos.length };
}

/**
 * Sum of a repo's commit counts.
 * @param {Repo} repo
 */
export function repoCommits(repo) {
	return Object.values(repo.commitsByMonth ?? {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

/**
 * GitHub's primary language, falling back to the language with the most bytes.
 * @param {Repo} repo
 * @returns {string | null}
 */
export function primaryLanguage(repo) {
	if (repo.language) return repo.language;
	const top = Object.entries(repo.languages ?? {}).sort((a, b) => b[1] - a[1])[0];
	return top ? top[0] : null;
}

/**
 * Share of code bytes per language across own non-fork repos: the top `limit`
 * languages plus an "Other" bucket. Shares are fractions in [0, 1].
 * @param {Snapshot | null | undefined} snapshot
 * @param {number} [limit]
 * @returns {{ language: string, bytes: number, share: number }[]}
 */
export function languageShare(snapshot, limit = 8) {
	/** @type {Record<string, number>} */
	const totals = {};
	for (const repo of ownRepos(snapshot)) {
		for (const [language, bytes] of Object.entries(repo.languages ?? {})) {
			totals[language] = (totals[language] ?? 0) + (Number(bytes) || 0);
		}
	}
	const sum = Object.values(totals).reduce((a, b) => a + b, 0);
	if (sum === 0) return [];
	const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
	const rows = sorted.slice(0, limit).map(([language, bytes]) => ({ language, bytes }));
	const otherBytes = sorted.slice(limit).reduce((total, [, bytes]) => total + bytes, 0);
	if (otherBytes > 0) rows.push({ language: 'Other', bytes: otherBytes });
	return rows.map((row) => ({ ...row, share: row.bytes / sum }));
}

/**
 * Own non-fork repos grouped by primary language, most repos first (ties by
 * bytes, then name). Byte share is included as secondary context, because one
 * large notebook repository can dominate byte counts.
 * @param {Snapshot | null | undefined} snapshot
 * @returns {{ language: string, repos: number, bytes: number, byteShare: number }[]}
 */
export function languagesByRepos(snapshot) {
	/** @type {Record<string, number>} */
	const repos = {};
	/** @type {Record<string, number>} */
	const bytes = {};
	let byteSum = 0;
	for (const repo of ownRepos(snapshot)) {
		const language = primaryLanguage(repo);
		if (language) repos[language] = (repos[language] ?? 0) + 1;
		for (const [name, count] of Object.entries(repo.languages ?? {})) {
			bytes[name] = (bytes[name] ?? 0) + (Number(count) || 0);
			byteSum += Number(count) || 0;
		}
	}
	return Object.entries(repos)
		.map(([language, count]) => ({
			language,
			repos: count,
			bytes: bytes[language] ?? 0,
			byteShare: byteSum ? (bytes[language] ?? 0) / byteSum : 0
		}))
		.sort((a, b) => b.repos - a.repos || b.bytes - a.bytes || a.language.localeCompare(b.language));
}

/**
 * The most common primary language(s) across own repos; ties are all returned
 * (sorted by bytes, then name) so the dashboard never silently picks one.
 * @param {Snapshot | null | undefined} snapshot
 * @returns {{ languages: string[], repos: number }}
 */
export function topLanguages(snapshot) {
	const rows = languagesByRepos(snapshot);
	if (rows.length === 0) return { languages: [], repos: 0 };
	const max = rows[0].repos;
	return { languages: rows.filter((r) => r.repos === max).map((r) => r.language), repos: max };
}

/**
 * Inclusive integer range.
 * @param {number} from
 * @param {number} to
 */
function range(from, to) {
	return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

/**
 * Own non-fork repos created per calendar year, gap years filled with 0.
 * @param {Snapshot | null | undefined} snapshot
 * @returns {{ year: number, count: number }[]}
 */
export function reposCreatedPerYear(snapshot) {
	/** @type {Record<number, number>} */
	const counts = {};
	for (const repo of ownRepos(snapshot)) {
		const year = Number(String(repo.created_at).slice(0, 4));
		if (Number.isFinite(year) && year > 0) counts[year] = (counts[year] ?? 0) + 1;
	}
	const years = Object.keys(counts).map(Number);
	if (years.length === 0) return [];
	return range(Math.min(...years), Math.max(...years)).map((year) => ({
		year,
		count: counts[year] ?? 0
	}));
}

/**
 * Commits per YYYY-MM summed over own non-fork repos.
 * @param {Snapshot | null | undefined} snapshot
 * @returns {Record<string, number>}
 */
export function commitsByMonth(snapshot) {
	/** @type {Record<string, number>} */
	const months = {};
	for (const repo of ownRepos(snapshot)) {
		for (const [month, count] of Object.entries(repo.commitsByMonth ?? {})) {
			if (!/^\d{4}-\d{2}$/.test(month)) continue;
			months[month] = (months[month] ?? 0) + (Number(count) || 0);
		}
	}
	return months;
}

/**
 * Total commits attributed to the login on the repos' default branches.
 * @param {Snapshot | null | undefined} snapshot
 */
export function totalCommits(snapshot) {
	return Object.values(commitsByMonth(snapshot)).reduce((a, b) => a + b, 0);
}

/**
 * YYYY-MM of an ISO date (UTC), or null.
 * @param {string | undefined} iso
 */
function monthOf(iso) {
	const date = new Date(iso ?? '');
	if (Number.isNaN(date.getTime())) return null;
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Zero-filled monthly commit counts for the `months` months ending with the
 * snapshot month. Anchored to `snapshot.generatedAt` (never the current date) so
 * the prerendered output is deterministic; falls back to the latest month with
 * data when generatedAt is missing.
 * @param {Snapshot | null | undefined} snapshot
 * @param {number} [months]
 * @returns {{ month: string, count: number }[]}
 */
export function recentMonths(snapshot, months = 24) {
	const byMonth = commitsByMonth(snapshot);
	const end = monthOf(snapshot?.generatedAt) ?? Object.keys(byMonth).sort().at(-1);
	if (!end) return [];
	let year = Number(end.slice(0, 4));
	let month = Number(end.slice(5, 7));
	const out = [];
	for (let i = 0; i < months; i++) {
		const key = `${year}-${String(month).padStart(2, '0')}`;
		out.unshift({ month: key, count: byMonth[key] ?? 0 });
		month -= 1;
		if (month === 0) {
			month = 12;
			year -= 1;
		}
	}
	return out;
}

/**
 * Commits per calendar year from the first to the last year with commits.
 * @param {Snapshot | null | undefined} snapshot
 * @returns {{ year: number, count: number }[]}
 */
export function commitsPerYear(snapshot) {
	/** @type {Record<number, number>} */
	const counts = {};
	for (const [month, count] of Object.entries(commitsByMonth(snapshot))) {
		if (!count) continue;
		const year = Number(month.slice(0, 4));
		counts[year] = (counts[year] ?? 0) + count;
	}
	const years = Object.keys(counts).map(Number);
	if (years.length === 0) return [];
	return range(Math.min(...years), Math.max(...years)).map((year) => ({
		year,
		count: counts[year] ?? 0
	}));
}

/**
 * Year × month grid of commit counts (rows = years with any commits in range).
 * @param {Snapshot | null | undefined} snapshot
 * @returns {{ rows: { year: number, total: number, months: { month: string, count: number }[] }[], max: number }}
 */
export function activityGrid(snapshot) {
	const byMonth = commitsByMonth(snapshot);
	const years = commitsPerYear(snapshot);
	let max = 0;
	const rows = years.map(({ year, count }) => ({
		year,
		total: count,
		months: MONTHS.map((_, i) => {
			const month = `${year}-${String(i + 1).padStart(2, '0')}`;
			const value = byMonth[month] ?? 0;
			max = Math.max(max, value);
			return { month, count: value };
		})
	}));
	return { rows, max };
}

/**
 * First and last year with commits.
 * @param {Snapshot | null | undefined} snapshot
 * @returns {{ first: number, last: number, years: number, activeYears: number } | null}
 */
export function activeSpan(snapshot) {
	const years = commitsPerYear(snapshot);
	if (years.length === 0) return null;
	const first = years[0].year;
	const last = years[years.length - 1].year;
	return {
		first,
		last,
		years: last - first + 1,
		activeYears: years.filter((y) => y.count > 0).length
	};
}

/**
 * Own repos with the most commits (repos with none are left out); ties go to the
 * more recently pushed repo, then name.
 * @param {Snapshot | null | undefined} snapshot
 * @param {number} [limit]
 * @returns {(Repo & { commits: number })[]}
 */
export function mostActiveRepos(snapshot, limit = 6) {
	return ownRepos(snapshot)
		.map((repo) => ({ ...repo, commits: repoCommits(repo) }))
		.filter((repo) => repo.commits > 0)
		.sort(
			(a, b) =>
				b.commits - a.commits ||
				String(b.pushed_at).localeCompare(String(a.pushed_at)) ||
				a.name.localeCompare(b.name)
		)
		.slice(0, limit);
}

/**
 * Own repos ordered by last push, newest first.
 * @param {Snapshot | null | undefined} snapshot
 * @param {number} [limit]
 * @returns {Repo[]}
 */
export function recentlyPushed(snapshot, limit = 5) {
	return [...ownRepos(snapshot)]
		.sort(
			(a, b) =>
				String(b.pushed_at).localeCompare(String(a.pushed_at)) || a.name.localeCompare(b.name)
		)
		.slice(0, limit);
}

/**
 * Stars across own non-fork repos.
 * @param {Snapshot | null | undefined} snapshot
 */
export function totalStars(snapshot) {
	return ownRepos(snapshot).reduce((sum, repo) => sum + (Number(repo.stargazers_count) || 0), 0);
}

/**
 * "21 Nov 2026" in UTC, independent of the runtime locale.
 * @param {string | undefined | null} iso
 */
export function formatDate(iso) {
	const date = new Date(iso ?? '');
	if (Number.isNaN(date.getTime())) return '';
	return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * "Nov 2026" for a YYYY-MM key.
 * @param {string} month
 */
export function formatMonth(month) {
	const index = Number(month.slice(5, 7)) - 1;
	return `${MONTHS[index] ?? ''} ${month.slice(0, 4)}`.trim();
}

/** Short month labels, January first. */
export const MONTH_LABELS = MONTHS;

/**
 * Only the fields the dashboard shows for a listed repository.
 * @param {Repo & { commits?: number }} repo
 */
function repoRow(repo) {
	return {
		name: repo.name,
		html_url: repo.html_url,
		description: repo.description ?? null,
		language: repo.language ?? null,
		pushed_at: repo.pushed_at,
		commits: repo.commits ?? repoCommits(repo)
	};
}

/**
 * Everything the dashboard renders, derived once. This is the only GitHub data a
 * page should ship: aggregates plus the few repositories it lists. The raw
 * snapshot (fork names, per-repo language bytes and commit histories) stays on
 * the server during prerender.
 * @param {Snapshot | null | undefined} snapshot
 */
export function githubDashboard(snapshot) {
	const counts = repoCounts(snapshot);
	const grid = activityGrid(snapshot);
	let peak = null;
	for (const row of grid.rows) {
		for (const cell of row.months) {
			if (cell.count > 0 && (!peak || cell.count > peak.count)) peak = cell;
		}
	}
	return {
		login: snapshot?.login ?? '',
		profileUrl:
			snapshot?.profileUrl ?? (snapshot?.login ? `https://github.com/${snapshot.login}` : ''),
		asOf: formatDate(snapshot?.generatedAt),
		asOfIso: snapshot?.generatedAt ?? '',
		isEmpty: counts.total === 0,
		counts,
		commits: totalCommits(snapshot),
		stars: totalStars(snapshot),
		top: topLanguages(snapshot),
		span: activeSpan(snapshot),
		grid,
		peak,
		perYear: commitsPerYear(snapshot),
		recent: recentMonths(snapshot, 24),
		languages: languagesByRepos(snapshot),
		languageBytes: languageShare(snapshot, 8),
		created: reposCreatedPerYear(snapshot),
		mostActive: mostActiveRepos(snapshot, 6).map(repoRow),
		recentlyPushed: recentlyPushed(snapshot, 4).map(repoRow)
	};
}

/** @typedef {ReturnType<typeof githubDashboard>} GithubDashboardData */
