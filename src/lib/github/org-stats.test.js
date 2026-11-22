import { describe, expect, it } from 'vitest';
import { deniedWords } from '#lib/testing/denylist.js';
import graphJson from '#lib/graphs/graph.json';
import orgsJson from './orgs.json';
import githubJson from './github.json';
import {
	PRIVATE_KEYS,
	SNAPSHOT_KEYS,
	combinedMonths,
	languageMix,
	monthRange,
	orgActivity,
	privateMonths,
	privateTotals,
	shiftMonth
} from './org-stats.js';

/** @typedef {import('./org-stats.js').OrgSnapshot} OrgSnapshot */

const snapshot = /** @type {OrgSnapshot} */ (/** @type {unknown} */ (orgsJson));
const publicSnapshot = /** @type {import('./stats.js').Snapshot} */ (
	/** @type {unknown} */ (githubJson)
);
const serialised = JSON.stringify(orgsJson);
const derived = JSON.stringify(orgActivity(snapshot, publicSnapshot));

/**
 * Names of public projects and organisations the site already mentions. The
 * private statistics must not be linkable to any of them, even where an
 * organisation has a public project page elsewhere on the site.
 */
const publicNames = /** @type {{ kind: string, id: string, label: string }[]} */ (graphJson.nodes)
	.filter((node) => node.kind === 'item' || node.kind === 'org')
	.flatMap((node) => [node.label, String(node.id).split('/').at(-1) ?? ''])
	.map((name) => name.toLowerCase().trim())
	.filter((name) => name.length >= 4);

/** GitHub language names may contain these characters, nothing else. */
const LANGUAGE_NAME = /^[A-Za-z][A-Za-z0-9+#.' -]{0,39}$/;

/**
 * Every string value (not key) in the snapshot, except language names, which
 * come from GitHub's fixed language list.
 * @param {unknown} value
 * @param {string} [key]
 * @returns {string[]}
 */
function freeText(value, key = '') {
	if (typeof value === 'string') return key === 'languages' ? [] : [value];
	if (Array.isArray(value)) return value.flatMap((item) => freeText(item, key));
	if (value && typeof value === 'object')
		return Object.entries(value).flatMap(([k, v]) => (k === 'languageBytes' ? [] : freeText(v, k)));
	return [];
}

/**
 * Slug-like tokens such as a GitHub login or repository name: a word of four
 * or more letters/digits joined to another by "-" or "_", a dotted name, or a
 * camelCase identifier.
 */
const SLUG_LIKE = [
	/[a-z0-9]{4,}[-_][a-z0-9]{2,}/i,
	/[a-z0-9]{2,}\.[a-z]{2,}/i,
	/\b[a-z]+[A-Z][a-z]+[A-Za-z]*\b/
];

describe('orgs.json (work in private repositories)', () => {
	it('has only whitelisted keys at every level', () => {
		expect(Object.keys(snapshot).sort()).toEqual([...SNAPSHOT_KEYS].sort());
		expect(typeof snapshot.generatedAt).toBe('string');
		expect(Number.isNaN(new Date(snapshot.generatedAt).getTime())).toBe(false);
		expect(snapshot.login).toBe('PropovedNik007');
		const agg = snapshot.private;
		expect(agg).not.toBeNull();
		if (!agg) return;
		expect(Object.keys(agg).sort()).toEqual([...PRIVATE_KEYS].sort());
		for (const key of ['reposContributed', 'commits', 'pullRequests']) {
			const value = /** @type {Record<string, unknown>} */ (agg)[key];
			expect(Number.isInteger(value) && /** @type {number} */ (value) >= 0).toBe(true);
		}
		// Nested maps: month keys and language names only, numeric values only.
		for (const [month, count] of Object.entries(agg.commitsByMonth)) {
			expect(month).toMatch(/^\d{4}-\d{2}$/);
			expect(Number.isInteger(count) && count > 0).toBe(true);
		}
		const languages = Object.entries(agg.languageBytes);
		expect(languages.length).toBeLessThanOrEqual(9);
		for (const [language, bytes] of languages) {
			expect(language).toMatch(LANGUAGE_NAME);
			expect(Number.isInteger(bytes) && bytes > 0).toBe(true);
		}
	});

	it('holds combined totals only, nothing per organisation', () => {
		const agg = snapshot.private;
		const sum = (/** @type {Record<string, number>} */ byMonth) =>
			Object.values(byMonth).reduce((a, b) => a + b, 0);
		expect(sum(agg?.commitsByMonth ?? {})).toBe(agg?.commits ?? 0);
		// No breakdown, alias or count of organisations, in the file or the page data.
		for (const text of [serialised, derived]) {
			expect(text.toLowerCase()).not.toMatch(/organi[sz]ation|alias|anonymi/);
		}
	});

	it('contains nothing identifying', () => {
		for (const text of [serialised, derived]) {
			expect(deniedWords(text)).toEqual([]);
			expect(text).not.toContain('@');
			expect(text.toLowerCase()).not.toContain('http');
			expect(text.toLowerCase()).not.toContain('github.com');
			expect(text.toLowerCase()).not.toContain('www.');
		}
	});

	it('contains no token that looks like a login or repository name', () => {
		const texts = [...freeText(orgsJson), ...freeText(JSON.parse(derived))];
		expect(texts.length).toBeGreaterThan(0);
		for (const text of texts) {
			if (text === snapshot.login || /^\d{4}-\d{2}(-\d{2}T[\d:.]+Z)?$/.test(text)) continue;
			for (const pattern of SLUG_LIKE) expect(text, String(pattern)).not.toMatch(pattern);
		}
	});

	it('cannot be linked to any public project or organisation on the site', () => {
		expect(publicNames.length).toBeGreaterThan(10);
		const lower = `${serialised}\n${derived}`.toLowerCase();
		for (const name of publicNames) expect(lower, name).not.toContain(name);
	});

	it('derives the panel data with whitelisted keys only', () => {
		const data = orgActivity(snapshot, publicSnapshot);
		expect(Object.keys(data).sort()).toEqual(
			[
				'asOf',
				'asOfIso',
				'publicAsOf',
				'publicAsOfIso',
				'isEmpty',
				'totals',
				'firstMonth',
				'lastMonth',
				'languages',
				'combined',
				'combinedTotals',
				'partial'
			].sort()
		);
		expect(data.combined).toHaveLength(24);
		expect(Object.keys(data.totals).sort()).toEqual(
			['commits', 'pullRequests', 'reposContributed'].sort()
		);
	});
});

describe('month helpers', () => {
	it('shifts across year boundaries', () => {
		expect(shiftMonth('2026-01', -1)).toBe('2025-12');
		expect(shiftMonth('2025-12', 1)).toBe('2026-01');
		expect(shiftMonth('2026-11', -11)).toBe('2025-12');
	});

	it('builds inclusive ranges and rejects invalid ones', () => {
		expect(monthRange('2025-11', '2026-02')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
		expect(monthRange('2026-02', '2026-01')).toEqual([]);
		expect(monthRange(null, '2026-01')).toEqual([]);
		expect(monthRange('bad', '2026-01')).toEqual([]);
	});
});

describe('languageMix', () => {
	it('sorts by bytes, puts Other last and sums to 1', () => {
		const rows = languageMix({ Other: 500, Go: 100, Python: 400 });
		expect(rows.map((r) => r.language)).toEqual(['Python', 'Go', 'Other']);
		expect(rows.reduce((sum, r) => sum + r.share, 0)).toBeCloseTo(1);
	});

	it('handles empty input', () => {
		expect(languageMix({})).toEqual([]);
		expect(languageMix(undefined)).toEqual([]);
	});
});

/** @type {OrgSnapshot} */
const fixture = {
	generatedAt: '2026-06-15T00:00:00Z',
	login: 'PropovedNik007',
	private: {
		reposContributed: 3,
		commits: 11,
		pullRequests: 4,
		commitsByMonth: { '2026-02': 5, '2026-03': 4, '2026-04': 2 },
		languageBytes: { Python: 30, Shell: 10, Go: 5 }
	}
};

/**
 * @param {string} generatedAt
 * @param {Record<string, number>} commitsByMonth
 * @returns {import('./stats.js').Snapshot}
 */
const publicFixture = (generatedAt, commitsByMonth) => ({
	generatedAt,
	login: 'x',
	repos: [
		{
			name: 'r',
			description: null,
			html_url: '',
			fork: false,
			language: null,
			languages: {},
			stargazers_count: 0,
			forks_count: 0,
			created_at: '2025-01-01T00:00:00Z',
			pushed_at: '2026-06-01T00:00:00Z',
			topics: [],
			archived: false,
			commitsByMonth
		}
	]
});

describe('aggregates', () => {
	it('reads totals and the active window', () => {
		expect(privateTotals(fixture)).toEqual({ reposContributed: 3, commits: 11, pullRequests: 4 });
		expect(privateMonths(fixture)).toEqual(['2026-02', '2026-03', '2026-04', '2026-05', '2026-06']);
		const data = orgActivity(fixture);
		expect(data.isEmpty).toBe(false);
		expect(data.firstMonth).toBe('2026-02');
		expect(data.lastMonth).toBe('2026-04');
		expect(data.languages.map((row) => row.language)).toEqual(['Python', 'Shell', 'Go']);
		expect(data.asOf).toBe('15 Jun 2026');
	});

	it('combines public and private commits over the last 24 months', () => {
		const pub = publicFixture('2026-06-15T00:00:00Z', { '2024-01': 9, '2025-08': 2, '2026-02': 1 });
		const rows = combinedMonths(fixture, pub);
		expect(rows).toHaveLength(24);
		expect(rows[0]).toEqual({ month: '2024-07', public: 0, private: 0 });
		expect(rows.find((r) => r.month === '2025-08')).toEqual({
			month: '2025-08',
			public: 2,
			private: 0
		});
		expect(rows.find((r) => r.month === '2026-02')).toEqual({
			month: '2026-02',
			public: 1,
			private: 5
		});
		expect(rows.at(-1)?.month).toBe('2026-06');
		// Months before the window are left out of the window totals.
		const data = orgActivity(fixture, pub);
		expect(data.combinedTotals).toEqual({ public: 3, private: 11 });
	});

	it('marks months after a series snapshot as not collected, never as zero', () => {
		const pub = publicFixture('2026-08-02T00:00:00Z', { '2026-07': 4 });
		const rows = combinedMonths(fixture, pub);
		expect(rows.at(-1)).toEqual({ month: '2026-08', public: 0, private: null });
		expect(rows.find((r) => r.month === '2026-07')).toEqual({
			month: '2026-07',
			public: 4,
			private: null
		});
		expect(rows.find((r) => r.month === '2026-06')?.private).toBe(0);
	});

	it('shows public activity even without a private snapshot', () => {
		const pub = publicFixture('2026-06-15T00:00:00Z', { '2026-05': 2 });
		const rows = combinedMonths(null, pub);
		expect(rows).toHaveLength(24);
		expect(rows.at(-1)).toEqual({ month: '2026-06', public: 0, private: null });
	});

	it('marks a running month as month-to-date', () => {
		const pub = publicFixture('2026-06-10T00:00:00Z', { '2026-05': 2 });
		expect(orgActivity(fixture, pub).partial).toEqual({ month: '2026-06', through: '15 Jun' });
		const endOfMonth = { ...fixture, generatedAt: '2026-06-30T12:00:00Z' };
		const pubEnd = publicFixture('2026-06-30T00:00:00Z', {});
		expect(orgActivity(endOfMonth, pubEnd).partial).toBeNull();
		expect(orgActivity(null).partial).toBeNull();
	});

	it('ignores any per-organisation field a snapshot might carry', () => {
		const leaky = /** @type {OrgSnapshot} */ (
			/** @type {unknown} */ ({
				...fixture,
				organisations: [{ alias: 'some-company', commits: 8 }]
			})
		);
		const text = JSON.stringify(orgActivity(leaky)).toLowerCase();
		expect(text).not.toContain('some-company');
		expect(text).not.toContain('organisation');
	});

	it('renders nothing for an empty or missing snapshot', () => {
		for (const empty of [null, undefined, { generatedAt: '', login: '', private: null }]) {
			const data = orgActivity(empty);
			expect(data.isEmpty).toBe(true);
			expect(data.combined).toEqual([]);
			expect(data.languages).toEqual([]);
			expect(data.firstMonth).toBeNull();
		}
	});
});
