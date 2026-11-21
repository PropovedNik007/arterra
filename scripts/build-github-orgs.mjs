/**
 * Manual refresh of the ANONYMISED private-organisation statistics shown on
 * /insights (src/lib/github/orgs.json).
 *
 *   GITHUB_PRIVATE_ORGS="<org>[,<org>…]" npm run github:orgs
 *   GITHUB_PRIVATE_ORGS="..." node scripts/build-github-orgs.mjs [generatedAt]
 *
 * Organisation logins are read from the environment only and never written
 * anywhere. Everything listed is merged into ONE aggregate before anything is
 * stored: no breakdown, alias or organisation count is kept, so the snapshot
 * cannot be attributed to any organisation.
 *
 * Only aggregates are stored: repositories committed to, commits per month,
 * pull-request totals and language bytes summed over the repositories with at
 * least one commit by the login. No repository names, descriptions, URLs,
 * branches, topics, commit messages, SHAs, emails or collaborator names are
 * kept, and console output never names an organisation or repository (errors
 * carry only an ordinal and an HTTP status). Before writing, the output is
 * checked for every organisation login, every repository name (4+ characters)
 * and the site's hashed denylist; any match aborts without writing.
 *
 * Commits come from the REST commits endpoint, which only covers each
 * repository's default branch. Intentionally NOT part of `dev`/`build`.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deniedWords } from '../src/lib/testing/denylist.js';

const LOGIN = 'PropovedNik007';
const PER_PAGE = 100;
const MAX_REPO_PAGES = 10;
/** Cap per repository: 30 pages × 100 = 3,000 commits. */
const MAX_COMMIT_PAGES = 30;
const LANGUAGE_LIMIT = 8;

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outPath = join(root, 'src/lib/github/orgs.json');
const generatedAt = process.argv[2] ? new Date(process.argv[2]) : new Date();
if (Number.isNaN(generatedAt.getTime())) throw new Error('Invalid generatedAt argument');

/** @param {string | undefined} value */
const list = (value) =>
	(value ?? '')
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);

const orgs = list(process.env.GITHUB_PRIVATE_ORGS);
if (orgs.length === 0) throw new Error('Set GITHUB_PRIVATE_ORGS to a comma-separated list');

/**
 * GET a REST endpoint through the authenticated gh CLI.
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
 * HTTP status of a failed gh call, read from its stderr only. The error's
 * message, command line and stack name the request path, so they are never
 * printed or rethrown.
 * @param {unknown} error
 */
function statusOf(error) {
	const stderr = /** @type {any} */ (error)?.stderr?.toString?.() ?? '';
	return stderr.match(/HTTP (\d{3})/)?.[1] ?? 'error';
}

/**
 * Like api() but returns `fallback` on HTTP errors (e.g. 409 for an empty
 * repository). The warning names only the ordinal, never the path.
 * @param {string} path
 * @param {any} fallback
 * @param {string} label
 */
function apiOr(path, fallback, label) {
	try {
		return api(path);
	} catch (error) {
		console.warn(`[build-github-orgs] ${label}: a request was unavailable (${statusOf(error)})`);
		return fallback;
	}
}

/**
 * Page through an array endpoint until a short page or the page cap.
 * @param {string} path path including its own query string
 * @param {number} maxPages
 * @param {string} label
 * @param {{ strict?: boolean }} [options] strict: throw instead of returning a
 *   partial list, so a failed repo listing never overwrites a good snapshot
 * @returns {any[]}
 */
function paginate(path, maxPages, label, { strict = false } = {}) {
	/** @type {any[]} */
	const all = [];
	for (let page = 1; page <= maxPages; page++) {
		const url = `${path}&per_page=${PER_PAGE}&page=${page}`;
		let batch;
		if (strict) {
			try {
				batch = api(url);
			} catch (error) {
				// A fresh error without `cause`: the original carries the gh command line.
				throw new Error(
					`[build-github-orgs] ${label}: repository listing failed (${statusOf(error)}); snapshot not written`
				);
			}
		} else {
			batch = apiOr(url, [], label);
		}
		if (!Array.isArray(batch)) break;
		all.push(...batch);
		if (batch.length < PER_PAGE) break;
		if (page === maxPages) console.warn(`[build-github-orgs] ${label}: page cap reached`);
	}
	return all;
}

/**
 * Top `limit` languages by bytes plus an "Other" bucket.
 * @param {Record<string, number>} totals
 */
function topLanguages(totals) {
	const sorted = Object.entries(totals)
		.filter(([, bytes]) => bytes > 0)
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
	/** @type {Record<string, number>} */
	const out = Object.fromEntries(sorted.slice(0, LANGUAGE_LIMIT));
	const other = sorted.slice(LANGUAGE_LIMIT).reduce((sum, [, bytes]) => sum + bytes, 0);
	if (other > 0) out.Other = (out.Other ?? 0) + other;
	return out;
}

/** Every lower-cased string that must never appear in the output. */
const secrets = new Set(orgs.map((org) => org.toLowerCase()));

/** @type {Record<string, number>} */
const languageBytes = {};
/** @type {Record<string, number>} */
const commitsByMonth = {};
let reposContributed = 0;
let commits = 0;
let pullRequests = 0;

orgs.forEach((org, index) => {
	const label = `organisation ${index + 1}`;
	const enc = encodeURIComponent(org);

	const rawRepos = paginate(`orgs/${enc}/repos?type=all`, MAX_REPO_PAGES, label, {
		strict: true
	});
	for (const repo of rawRepos) {
		const name = String(repo.name ?? '').toLowerCase();
		if (name.length >= 4) secrets.add(name);
	}

	for (const repo of rawRepos.filter((candidate) => !candidate.fork)) {
		if (!(repo.size > 0)) continue;
		const name = encodeURIComponent(String(repo.name));
		const history = paginate(
			`repos/${enc}/${name}/commits?author=${LOGIN}`,
			MAX_COMMIT_PAGES,
			label
		);
		let mine = 0;
		for (const commit of history) {
			const date = commit?.commit?.author?.date ?? commit?.commit?.committer?.date;
			if (typeof date !== 'string' || !/^\d{4}-\d{2}/.test(date)) continue;
			const month = date.slice(0, 7);
			commitsByMonth[month] = (commitsByMonth[month] ?? 0) + 1;
			mine++;
		}
		if (mine === 0) continue;
		reposContributed++;
		commits += mine;
		// Languages only of repositories the login committed to.
		const languages = apiOr(`repos/${enc}/${name}/languages`, {}, label);
		if (languages && typeof languages === 'object' && !Array.isArray(languages)) {
			for (const [language, bytes] of Object.entries(languages)) {
				if (typeof bytes === 'number')
					languageBytes[language] = (languageBytes[language] ?? 0) + bytes;
			}
		}
	}

	const search = apiOr(
		`search/issues?q=is:pr+author:${LOGIN}+org:${enc}&per_page=1`,
		{ total_count: 0 },
		label
	);
	pullRequests += Number(search?.total_count) || 0;
});

const months = Object.keys(commitsByMonth).sort();
const output = {
	generatedAt: generatedAt.toISOString(),
	login: LOGIN,
	private: {
		reposContributed,
		commits,
		pullRequests,
		commitsByMonth: Object.fromEntries(months.map((month) => [month, commitsByMonth[month]])),
		languageBytes: topLanguages(languageBytes)
	}
};

// Leak guard: nothing identifying may reach the committed file.
const serialised = JSON.stringify(output);
const lower = serialised.toLowerCase();
for (const secret of secrets) {
	if (lower.includes(secret))
		throw new Error('Output contains an organisation or repository name; snapshot not written');
}
if (deniedWords(serialised).length) throw new Error('Denied word in output; snapshot not written');
if (/@|https?:/i.test(serialised)) throw new Error('Output contains an address; not written');

// Format like the rest of the repo so `prettier --check` stays clean.
const prettier = await import('prettier');
const options = (await prettier.resolveConfig(outPath)) ?? {};
writeFileSync(outPath, await prettier.format(serialised, { ...options, parser: 'json' }));
console.log(
	`[build-github-orgs] private aggregate: ${reposContributed} repos committed to, ` +
		`${commits} commits, ${pullRequests} PRs, ${months[0] ?? '—'} → ${months.at(-1) ?? '—'}`
);
console.log(`[build-github-orgs] wrote ${outPath}`);
