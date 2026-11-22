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

describe('orgs.json (anonymised snapshot)', () => {
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
			expect(language).toMatch(/^[A-Za-z][A-Za-z0-9+#. -]{0,39}$/);
			expect(Number.isInteger(bytes) && bytes > 0).toBe(true);
		}
	});

	it('keeps month totals consistent with the commit count', () => {
		const agg = snapshot.private;
		const sum = Object.values(agg?.commitsByMonth ?? {}).reduce((a, b) => a + b, 0);
		expect(sum).toBe(agg?.commits ?? 0);
	});

	it('is one merged aggregate with no breakdown', () => {
		// One merged aggregate: no per-organisation array, alias or count anywhere.
		for (const text of [serialised, derived]) {
			expect(text).not.toMatch(/organi[sz]ation [A-Z]\b/i);
			expect(text).not.toMatch(/"(orgs|alias|kind|repos|orgCount|organisations?)"\s*:/);
		}
		expect(Object.keys(orgActivity(snapshot, publicSnapshot)).sort()).toEqual(
			[
				'asOf',
				'asOfIso',
				'isEmpty',
				'totals',
				'firstMonth',
				'lastMonth',
				'languages',
				'combined',
				'combinedTotals'
			].sort()
		);
	});

	it('contains nothing identifying', () => {
		for (const text of [serialised, derived]) {
			expect(deniedWords(text)).toEqual([]);
			expect(text).not.toContain('@');
			expect(text.toLowerCase()).not.toContain('http');
			expect(text.toLowerCase()).not.toContain('github.com');
		}
	});

	it('cannot be linked to any public project or organisation on the site', () => {
		expect(publicNames.length).toBeGreaterThan(10);
		const lower = `${serialised}\n${derived}`.toLowerCase();
		for (const name of publicNames) expect(lower, name).not.toContain(name);
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

	it('combines public and private commits over at least twelve months', () => {
		/** @type {import('./stats.js').Snapshot} */
		const pub = {
			generatedAt: '2026-06-15T00:00:00Z',
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
					commitsByMonth: { '2025-08': 2, '2026-02': 1 }
				}
			]
		};
		const rows = combinedMonths(fixture, pub);
		expect(rows).toHaveLength(12);
		expect(rows[0]).toEqual({ month: '2025-07', public: 0, private: 0 });
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
