import { describe, expect, it } from 'vitest';
import { deniedWords } from '$lib/testing/denylist.js';
import snapshotJson from './github.json';
import {
	activeSpan,
	activityGrid,
	commitsPerYear,
	formatDate,
	formatMonth,
	githubDashboard,
	languageShare,
	languagesByRepos,
	mostActiveRepos,
	recentMonths,
	recentlyPushed,
	repoCounts,
	reposCreatedPerYear,
	topLanguages,
	totalCommits,
	totalStars
} from './stats.js';

/** @typedef {import('./stats.js').Repo} Repo */
/** @typedef {import('./stats.js').Snapshot} Snapshot */

/**
 * @param {Partial<Repo> & { name: string }} repo
 * @returns {Repo}
 */
function repo(repo) {
	return {
		description: null,
		html_url: `https://github.com/someone/${repo.name}`,
		fork: false,
		language: null,
		languages: {},
		stargazers_count: 0,
		forks_count: 0,
		created_at: '2020-01-01T00:00:00Z',
		pushed_at: '2020-01-01T00:00:00Z',
		topics: [],
		archived: false,
		commitsByMonth: {},
		...repo
	};
}

/** @type {Snapshot} */
const fixture = {
	generatedAt: '2024-03-10T08:00:00Z',
	login: 'someone',
	repos: [
		repo({
			name: 'alpha',
			language: 'Python',
			languages: { Python: 600, Shell: 100 },
			stargazers_count: 2,
			created_at: '2021-05-01T00:00:00Z',
			pushed_at: '2024-02-01T00:00:00Z',
			commitsByMonth: { '2021-05': 4, '2024-02': 6 }
		}),
		repo({
			name: 'beta',
			language: null,
			languages: { JavaScript: 300 },
			created_at: '2023-01-01T00:00:00Z',
			pushed_at: '2023-06-01T00:00:00Z',
			commitsByMonth: { '2023-06': 10 }
		}),
		repo({
			name: 'gamma',
			language: 'Python',
			languages: { Python: 100 },
			created_at: '2023-02-01T00:00:00Z',
			pushed_at: '2023-02-01T00:00:00Z'
		}),
		repo({
			name: 'upstream-fork',
			fork: true,
			language: 'Rust',
			languages: { Rust: 99999 },
			stargazers_count: 50,
			created_at: '2019-01-01T00:00:00Z',
			pushed_at: '2024-03-01T00:00:00Z',
			commitsByMonth: { '2024-03': 99 }
		})
	]
};

describe('github stats', () => {
	it('counts own repos and forks separately', () => {
		expect(repoCounts(fixture)).toEqual({ own: 3, forks: 1, total: 4 });
	});

	it('excludes forks from language share and buckets the tail as Other', () => {
		const shares = languageShare(fixture, 2);
		expect(shares.map((s) => s.language)).toEqual(['Python', 'JavaScript', 'Other']);
		expect(shares.find((s) => s.language === 'Python')?.bytes).toBe(700);
		expect(shares.find((s) => s.language === 'Other')?.bytes).toBe(100);
		expect(shares.reduce((sum, s) => sum + s.share, 0)).toBeCloseTo(1);
		expect(shares.some((s) => s.language === 'Rust')).toBe(false);
	});

	it('groups repos by primary language, falling back to the largest byte count', () => {
		expect(languagesByRepos(fixture).map((r) => [r.language, r.repos])).toEqual([
			['Python', 2],
			['JavaScript', 1]
		]);
		expect(topLanguages(fixture)).toEqual({ languages: ['Python'], repos: 2 });
	});

	it('returns every tied top language', () => {
		const tied = { ...fixture, repos: fixture.repos.slice(0, 2) };
		expect(topLanguages(tied).languages).toEqual(['Python', 'JavaScript']);
	});

	it('counts repos created per year with gap years filled', () => {
		expect(reposCreatedPerYear(fixture)).toEqual([
			{ year: 2021, count: 1 },
			{ year: 2022, count: 0 },
			{ year: 2023, count: 2 }
		]);
	});

	it('aggregates commits from own repos only', () => {
		expect(totalCommits(fixture)).toBe(20);
		expect(commitsPerYear(fixture)).toEqual([
			{ year: 2021, count: 4 },
			{ year: 2022, count: 0 },
			{ year: 2023, count: 10 },
			{ year: 2024, count: 6 }
		]);
		expect(activeSpan(fixture)).toEqual({ first: 2021, last: 2024, years: 4, activeYears: 3 });
	});

	it('zero-fills the recent months window ending at the snapshot month', () => {
		const months = recentMonths(fixture, 24);
		expect(months).toHaveLength(24);
		expect(months[0].month).toBe('2022-04');
		expect(months.at(-1)).toEqual({ month: '2024-03', count: 0 });
		expect(months.find((m) => m.month === '2023-06')?.count).toBe(10);
		expect(months.reduce((sum, m) => sum + m.count, 0)).toBe(16);
	});

	it('builds a year by month grid', () => {
		const grid = activityGrid(fixture);
		expect(grid.rows.map((r) => r.year)).toEqual([2021, 2022, 2023, 2024]);
		expect(grid.rows.every((r) => r.months.length === 12)).toBe(true);
		expect(grid.max).toBe(10);
	});

	it('ranks most active and recently pushed own repos', () => {
		expect(mostActiveRepos(fixture).map((r) => [r.name, r.commits])).toEqual([
			['alpha', 10],
			['beta', 10]
		]);
		expect(recentlyPushed(fixture, 2).map((r) => r.name)).toEqual(['alpha', 'beta']);
		expect(totalStars(fixture)).toBe(2);
	});

	it('formats dates in UTC without the runtime locale', () => {
		expect(formatDate('2026-11-21T23:30:00Z')).toBe('21 Nov 2026');
		expect(formatDate('nope')).toBe('');
		expect(formatMonth('2024-01')).toBe('Jan 2024');
	});

	it('returns zeros, never NaN, for an empty or missing snapshot', () => {
		for (const input of [undefined, null, { generatedAt: '', login: '', repos: [] }]) {
			const data = githubDashboard(input);
			expect(data.isEmpty).toBe(true);
			expect(data.commits).toBe(0);
			expect(data.stars).toBe(0);
			expect(data.languageBytes).toEqual([]);
			expect(data.span).toBeNull();
			expect(JSON.stringify(data)).not.toMatch(/NaN|undefined/);
		}
	});
});

describe('committed github.json snapshot', () => {
	const snapshot = /** @type {Snapshot} */ (/** @type {unknown} */ (snapshotJson));
	const text = JSON.stringify(snapshot);

	it('has the expected shape', () => {
		expect(snapshot.login).toBe('PropovedNik007');
		expect(Number.isNaN(new Date(snapshot.generatedAt).getTime())).toBe(false);
		expect(Array.isArray(snapshot.repos)).toBe(true);
	});

	it('derives a dashboard that ships no fork records or per-repo histories', () => {
		const data = githubDashboard(snapshot);
		const shipped = JSON.stringify(data);
		for (const fork of snapshot.repos.filter((repo) => repo.fork)) {
			expect(shipped).not.toContain(`"${fork.name}"`);
			expect(shipped).not.toContain(fork.html_url);
		}
		expect(shipped).not.toContain('commitsByMonth');
		for (const repo of [...data.mostActive, ...data.recentlyPushed]) {
			expect(Object.keys(repo).sort()).toEqual([
				'commits',
				'description',
				'html_url',
				'language',
				'name',
				'pushed_at'
			]);
		}
	});

	it('contains no denied words', () => {
		expect(deniedWords(text)).toEqual([]);
	});

	it('contains no email-like strings', () => {
		expect(text).not.toMatch(/[^\s"@]+@[^\s"@]+\.[a-z]{2,}/i);
		expect(text).not.toContain('@');
	});

	it('contains no private repositories and only allow-listed fields', () => {
		const allowed = [
			'archived',
			'commitsByMonth',
			'created_at',
			'description',
			'fork',
			'forks_count',
			'html_url',
			'language',
			'languages',
			'name',
			'pushed_at',
			'stargazers_count',
			'topics'
		];
		for (const entry of snapshot.repos) {
			expect(/** @type {any} */ (entry).private).not.toBe(true);
			expect(Object.keys(entry).sort()).toEqual(allowed);
			expect(entry.html_url.startsWith(`https://github.com/${snapshot.login}/`)).toBe(true);
		}
		expect(text).not.toMatch(/"private"\s*:\s*true/);
	});
});
