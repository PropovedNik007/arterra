/**
 * Manual refresh of the public GitHub snapshot shown on the dashboard.
 *
 *   npm run github:refresh            # uses the authenticated `gh` CLI
 *   node scripts/build-github.mjs 2026-11-21T00:00:00Z   # pin generatedAt
 *
 * This is intentionally NOT part of `dev`/`build`: the site is static and must
 * build without network access, so the snapshot is committed as JSON.
 *
 * Privacy: the `gh` token belongs to the account owner, so only endpoints that
 * are scoped to the *public* profile are used (users/<login>/..., repos/<login>/
 * <repo>/...). Never `user/repos` or GraphQL contributionsCollection, which can
 * return private repositories or private contributions. Private repos are also
 * skipped defensively, and only an allow-listed set of fields is stored — no
 * commit messages, SHAs, emails or author names.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deniedWords } from '../src/lib/testing/denylist.js';

const LOGIN = 'PropovedNik007';
const PER_PAGE = 100;
const MAX_REPO_PAGES = 10;
/** Cap per repository: 20 pages × 100 = 2,000 commits. */
const MAX_COMMIT_PAGES = 20;

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outPath = join(root, 'src/lib/github/github.json');
const generatedAt = process.argv[2] ? new Date(process.argv[2]) : new Date();
if (Number.isNaN(generatedAt.getTime())) throw new Error('Invalid generatedAt argument');

/**
 * GET a public REST endpoint through the authenticated gh CLI.
 * @param {string} path
 * @returns {any}
 */
function api(path) {
	const out = execFileSync('gh', ['api', '-H', 'Accept: application/vnd.github+json', path], {
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
		stdio: ['ignore', 'pipe', 'pipe']
	});
	return JSON.parse(out);
}

/**
 * Like api() but returns `fallback` on HTTP errors (e.g. 409 for an empty repo).
 * @param {string} path
 * @param {any} fallback
 */
function apiOr(path, fallback) {
	try {
		return api(path);
	} catch (error) {
		const message = /** @type {any} */ (error)?.stderr?.toString?.() ?? String(error);
		console.warn(
			`[build-github] ${path.split('?')[0]} unavailable: ${message.trim().split('\n')[0]}`
		);
		return fallback;
	}
}

/**
 * Page through an array endpoint until a short page or the page cap.
 * @param {string} path path including its own query string
 * @param {number} maxPages
 * @param {{ strict?: boolean }} [options] strict: throw on HTTP errors instead of
 *   returning what was fetched so far (used for the repo list, so a failed call can
 *   never overwrite a good snapshot with an empty one)
 * @returns {any[]}
 */
function paginate(path, maxPages, { strict = false } = {}) {
	/** @type {any[]} */
	const all = [];
	for (let page = 1; page <= maxPages; page++) {
		const url = `${path}&per_page=${PER_PAGE}&page=${page}`;
		const batch = strict ? api(url) : apiOr(url, []);
		if (!Array.isArray(batch)) break;
		all.push(...batch);
		if (batch.length < PER_PAGE) break;
		if (page === maxPages)
			console.warn(`[build-github] page cap reached for ${path.split('?')[0]}`);
	}
	return all;
}

/** Strings that look like an email address are never stored. */
const EMAIL_LIKE = /[^\s@]+@[^\s@]+/;
/** The public site is English-only: descriptions in another script are dropped. */
const NON_LATIN_LETTER = /(?!\p{Script=Latin})\p{L}/u;
const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF]/g;

/** @param {unknown} value */
function cleanText(value) {
	if (typeof value !== 'string') return null;
	const text = value.replace(ZERO_WIDTH, '').replace(/\s+/g, ' ').trim();
	if (!text || EMAIL_LIKE.test(text) || NON_LATIN_LETTER.test(text)) return null;
	return text;
}

/**
 * Every string value inside a JSON-ish value.
 * @param {unknown} value
 * @returns {string[]}
 */
function strings(value) {
	if (typeof value === 'string') return [value];
	if (Array.isArray(value)) return value.flatMap(strings);
	if (value && typeof value === 'object')
		return Object.entries(value).flatMap(([key, v]) => [key, ...strings(v)]);
	return [];
}

const user = api(`users/${LOGIN}`);
if (user.login !== LOGIN) throw new Error(`Unexpected login ${user.login}`);

const rawRepos = paginate(`users/${LOGIN}/repos?type=owner&sort=pushed`, MAX_REPO_PAGES, {
	strict: true
});
if (rawRepos.length === 0) throw new Error('No public repositories returned; snapshot not written');

let skippedPrivate = 0;
let droppedDenied = 0;
const repos = [];

for (const raw of rawRepos) {
	if (raw.private !== false || raw.visibility === 'private' || raw.owner?.login !== LOGIN) {
		skippedPrivate++;
		continue;
	}
	const name = String(raw.name);
	const enc = encodeURIComponent(name);
	const languages = apiOr(`repos/${LOGIN}/${enc}/languages`, {});

	/** @type {Record<string, number>} */
	const commitsByMonth = {};
	// Forks are excluded from activity stats, so their (mostly upstream) history
	// is not fetched at all.
	if (!raw.fork && raw.size > 0) {
		const commits = paginate(`repos/${LOGIN}/${enc}/commits?author=${LOGIN}`, MAX_COMMIT_PAGES);
		for (const commit of commits) {
			const date = commit?.commit?.author?.date ?? commit?.commit?.committer?.date;
			if (typeof date !== 'string') continue;
			const month = date.slice(0, 7);
			commitsByMonth[month] = (commitsByMonth[month] ?? 0) + 1;
		}
	}

	const repo = {
		name,
		// Forks are only counted on the site; their upstream-written descriptions are
		// not needed and may name third parties, so they are not stored.
		description: raw.fork ? null : cleanText(raw.description),
		html_url: `https://github.com/${LOGIN}/${enc}`,
		fork: Boolean(raw.fork),
		language: typeof raw.language === 'string' ? raw.language : null,
		languages:
			languages && typeof languages === 'object' && !Array.isArray(languages)
				? Object.fromEntries(
						Object.entries(languages).filter(([, bytes]) => typeof bytes === 'number')
					)
				: {},
		stargazers_count: Number(raw.stargazers_count) || 0,
		forks_count: Number(raw.forks_count) || 0,
		created_at: String(raw.created_at),
		pushed_at: String(raw.pushed_at),
		topics:
			!raw.fork && Array.isArray(raw.topics) ? raw.topics.filter((t) => typeof t === 'string') : [],
		archived: Boolean(raw.archived),
		commitsByMonth: Object.fromEntries(
			Object.entries(commitsByMonth).sort(([a], [b]) => a.localeCompare(b))
		)
	};

	if (strings(repo).some((text) => deniedWords(text).length > 0)) {
		droppedDenied++;
		continue;
	}
	repos.push(repo);
}

repos.sort((a, b) => a.name.localeCompare(b.name));

const snapshot = {
	generatedAt: generatedAt.toISOString(),
	login: LOGIN,
	profileUrl: `https://github.com/${LOGIN}`,
	repos
};

const leaked = strings(snapshot).flatMap(deniedWords);
if (leaked.length) throw new Error('Denied word survived filtering; snapshot not written');

// Format like the rest of the repo so `prettier --check` stays clean.
const prettier = await import('prettier');
const options = (await prettier.resolveConfig(outPath)) ?? {};
writeFileSync(
	outPath,
	await prettier.format(JSON.stringify(snapshot), { ...options, parser: 'json' })
);
const commitTotal = repos.reduce(
	(sum, r) => sum + Object.values(r.commitsByMonth).reduce((a, b) => a + b, 0),
	0
);
console.log(
	`[build-github] wrote ${repos.length} repos (${repos.filter((r) => r.fork).length} forks, ` +
		`${commitTotal} commits) to ${outPath}; skipped ${skippedPrivate} non-public/foreign, ` +
		`dropped ${droppedDenied} by denylist`
);
