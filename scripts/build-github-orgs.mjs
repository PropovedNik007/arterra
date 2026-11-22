/**
 * Refreshing GitHub data
 * ======================
 * Both GitHub snapshots on /insights are refreshed by hand (no CI job, no
 * stored secrets) and committed as JSON:
 *
 *   GITHUB_PRIVATE_ORGS="<org>[,<org>…]" \
 *   GITHUB_EXTRA_AUTHORS="<commit email>[,<commit email>…]" \
 *     npm run github:refresh:all
 *
 * - GITHUB_EXTRA_AUTHORS: commit emails that are not linked to the GitHub
 *   account; both scripts count their commits too (set it on every refresh,
 *   or the totals drop).
 * - GITHUB_PRIVATE_ORGS: organisation logins whose private repositories hold
 *   company work. Without it only the public snapshot refreshes.
 *
 * This script writes src/lib/github/orgs.json ("Work in private repositories").
 * Run it alone with `npm run github:orgs [-- generatedAt]`. Authentication: the
 * `gh` CLI, logged in locally or through GH_TOKEN (a token that can read those
 * private repositories); it fails before any request when there is none.
 *
 * Every identifying value arrives through the environment only and is never
 * written to source or to the snapshot: organisation logins, repository names
 * and commit emails. Only combined totals over all private work are published:
 * repositories contributed to, commits, pull requests, commits per month and
 * the language mix. Nothing is kept or printed per organisation, not even a
 * count of them.
 *
 * Commits are those authored by the login or by any GITHUB_EXTRA_AUTHORS email,
 * de-duplicated by SHA in memory per repository; SHAs and emails are never
 * stored or printed. Commits come from the REST commits endpoint, which only
 * covers each repository's default branch.
 *
 * Console output and errors never name an organisation, repository or email:
 * warnings carry only an ordinal and an HTTP status, and any unexpected error is
 * replaced by a fixed message. Before writing, the output is checked for every
 * login, repository name (4+ characters), email, the site's hashed denylist and
 * anything that looks like an address; any match aborts without writing. A good
 * snapshot is never replaced by a degraded one: authorisation, rate-limit and
 * server errors, or an organisation without any commits, abort the run instead.
 *
 * Intentionally NOT part of `dev`/`build`: the site builds offline from JSON.
 */
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deniedWords } from '../src/lib/testing/denylist.js';
import { writeSnapshot } from '../src/lib/github/write-snapshot.js';

const LOGIN = 'PropovedNik007';
const PER_PAGE = 100;
const MAX_REPO_PAGES = 10;
/** Cap per repository and author: 30 pages × 100 = 3,000 commits. */
const MAX_COMMIT_PAGES = 30;
/** Combined language bytes: top 8 + Other. */
const LANGUAGE_LIMIT = 8;
/** HTTP statuses that mean "nothing here" rather than "something is wrong". */
const BENIGN_STATUS = new Set(['404', '409', '422']);

/** An error whose message is known to contain nothing identifying. */
class SafeError extends Error {}

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outPath = join(root, 'src/lib/github/orgs.json');

/** @param {string | undefined} value */
const list = (value) =>
	(value ?? '')
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);

/** Environment for every gh call: never prompt, never print update notices. */
const ghEnv = { ...process.env, GH_PROMPT_DISABLED: '1', GH_NO_UPDATE_NOTIFIER: '1' };

/** Fail early, with a clear message, when gh has no credentials. */
function ensureAuth() {
	if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) return;
	try {
		execFileSync('gh', ['auth', 'status'], { env: ghEnv, stdio: 'ignore' });
	} catch {
		throw new SafeError(
			'[build-github-orgs] no GitHub credentials: set GH_TOKEN to a token that can read the ' +
				'private organisation repositories (or run `gh auth login`); snapshot not written'
		);
	}
}

/**
 * GET a REST endpoint through the authenticated gh CLI.
 * @param {string} path
 * @returns {any}
 */
function api(path) {
	const out = execFileSync('gh', ['api', '-H', 'Accept: application/vnd.github+json', path], {
		encoding: 'utf8',
		env: ghEnv,
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
 * Like api() but returns `fallback` for benign statuses (404, 409 for an empty
 * repository, 422 for an unsearchable query). Anything else (401, 403, 429,
 * 5xx, network) aborts the run so a partial snapshot is never written. Messages
 * name only the ordinal and the status, never the path.
 * @param {string} path
 * @param {any} fallback
 * @param {string} label
 */
function apiOr(path, fallback, label) {
	try {
		return api(path);
	} catch (error) {
		const status = statusOf(error);
		if (!BENIGN_STATUS.has(status)) {
			throw new SafeError(
				`[build-github-orgs] ${label}: a request failed (${status}); snapshot not written`
			);
		}
		console.warn(`[build-github-orgs] ${label}: a request was unavailable (${status})`);
		return fallback;
	}
}

/**
 * Page through an array endpoint until a short page or the page cap.
 * @param {string} path path including its own query string
 * @param {number} maxPages
 * @param {string} label
 * @returns {any[]}
 */
function paginate(path, maxPages, label) {
	/** @type {any[]} */
	const all = [];
	for (let page = 1; page <= maxPages; page++) {
		const batch = apiOr(`${path}&per_page=${PER_PAGE}&page=${page}`, [], label);
		if (!Array.isArray(batch)) break;
		all.push(...batch);
		if (batch.length < PER_PAGE) break;
		if (page === maxPages) console.warn(`[build-github-orgs] ${label}: page cap reached`);
	}
	return all;
}

/**
 * Language entries sorted by bytes, largest first (ties by name).
 * @param {Record<string, number>} totals
 */
const sortedLanguages = (totals) =>
	Object.entries(totals)
		.filter(([, bytes]) => bytes > 0)
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

/**
 * Top `LANGUAGE_LIMIT` languages by bytes plus an "Other" bucket.
 * @param {Record<string, number>} totals
 */
function topLanguageBytes(totals) {
	const sorted = sortedLanguages(totals);
	/** @type {Record<string, number>} */
	const out = Object.fromEntries(sorted.slice(0, LANGUAGE_LIMIT));
	const other = sorted.slice(LANGUAGE_LIMIT).reduce((sum, [, bytes]) => sum + bytes, 0);
	if (other > 0) out.Other = (out.Other ?? 0) + other;
	return out;
}

/** @param {Record<string, number>} byMonth */
const sortedMonths = (byMonth) =>
	Object.fromEntries(Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)));

/**
 * Collect the aggregates of one source of private repositories; the caller
 * only ever keeps their sum. `secrets` gains every repository name.
 * @param {string} org
 * @param {string} label ordinal used in log lines
 * @param {string[]} authors login and extra emails
 * @param {Set<string>} secrets
 */
function collectOrg(org, label, authors, secrets) {
	const enc = encodeURIComponent(org);
	let rawRepos;
	try {
		rawRepos = [];
		for (let page = 1; page <= MAX_REPO_PAGES; page++) {
			const batch = api(`orgs/${enc}/repos?type=all&per_page=${PER_PAGE}&page=${page}`);
			if (!Array.isArray(batch)) break;
			rawRepos.push(...batch);
			if (batch.length < PER_PAGE) break;
		}
	} catch (error) {
		throw new SafeError(
			`[build-github-orgs] ${label}: repository listing failed (${statusOf(error)}); snapshot not written`
		);
	}
	for (const repo of rawRepos) {
		const name = String(repo.name ?? '').toLowerCase();
		if (name.length >= 4) secrets.add(name);
	}

	/** @type {Record<string, number>} */
	const languageBytes = {};
	/** @type {Record<string, number>} */
	const commitsByMonth = {};
	let reposContributed = 0;
	let commits = 0;

	for (const repo of rawRepos.filter((candidate) => !candidate.fork)) {
		if (!(repo.size > 0)) continue;
		const name = encodeURIComponent(String(repo.name));
		/** SHAs already counted in this repository; memory only, never stored. */
		const seen = new Set();
		let mine = 0;
		for (const author of authors) {
			const history = paginate(
				`repos/${enc}/${name}/commits?author=${encodeURIComponent(author)}`,
				MAX_COMMIT_PAGES,
				label
			);
			for (const commit of history) {
				const sha = commit?.sha;
				if (typeof sha !== 'string' || seen.has(sha)) continue;
				const date = commit?.commit?.author?.date ?? commit?.commit?.committer?.date;
				if (typeof date !== 'string' || !/^\d{4}-\d{2}/.test(date)) continue;
				seen.add(sha);
				const month = date.slice(0, 7);
				commitsByMonth[month] = (commitsByMonth[month] ?? 0) + 1;
				mine++;
			}
		}
		if (mine === 0) continue;
		reposContributed++;
		commits += mine;
		// Languages only of repositories the owner committed to.
		const languages = apiOr(`repos/${enc}/${name}/languages`, {}, label);
		if (languages && typeof languages === 'object' && !Array.isArray(languages)) {
			for (const [language, bytes] of Object.entries(languages)) {
				if (typeof bytes === 'number')
					languageBytes[language] = (languageBytes[language] ?? 0) + bytes;
			}
		}
	}

	const search = apiOr(
		`search/issues?q=${encodeURIComponent(`is:pr author:${LOGIN} org:${org}`)}&per_page=1`,
		{ total_count: 0 },
		label
	);
	return {
		reposContributed,
		commits,
		pullRequests: Number(search?.total_count) || 0,
		commitsByMonth: sortedMonths(commitsByMonth),
		languageBytes
	};
}

async function main() {
	const generatedAt = process.argv[2] ? new Date(process.argv[2]) : new Date();
	if (Number.isNaN(generatedAt.getTime()))
		throw new SafeError('[build-github-orgs] invalid generatedAt argument');

	const orgs = list(process.env.GITHUB_PRIVATE_ORGS);
	if (orgs.length === 0)
		throw new SafeError('[build-github-orgs] set GITHUB_PRIVATE_ORGS to a comma-separated list');
	const extraAuthors = list(process.env.GITHUB_EXTRA_AUTHORS);
	const authors = [LOGIN, ...extraAuthors];

	ensureAuth();

	/** Every lower-cased string that must never appear in the output. */
	const secrets = new Set(orgs.map((org) => org.toLowerCase()));
	for (const email of extraAuthors) {
		secrets.add(email.toLowerCase());
		const local = email.split('@')[0].toLowerCase();
		if (local.length >= 4) secrets.add(local);
	}

	/** @type {Record<string, number>} */
	const combinedMonths = {};
	/** @type {Record<string, number>} */
	const combinedBytes = {};
	const totals = { reposContributed: 0, commits: 0, pullRequests: 0 };
	orgs.forEach((org, index) => {
		const label = `source ${index + 1}`;
		const stats = collectOrg(org, label, authors, secrets);
		if (stats.commits === 0) {
			throw new SafeError(
				`[build-github-orgs] ${label}: no commits found; check the token's access. Snapshot not written`
			);
		}
		totals.reposContributed += stats.reposContributed;
		totals.commits += stats.commits;
		totals.pullRequests += stats.pullRequests;
		for (const [month, count] of Object.entries(stats.commitsByMonth))
			combinedMonths[month] = (combinedMonths[month] ?? 0) + count;
		for (const [language, bytes] of Object.entries(stats.languageBytes))
			combinedBytes[language] = (combinedBytes[language] ?? 0) + bytes;
	});

	const output = {
		generatedAt: generatedAt.toISOString(),
		login: LOGIN,
		private: {
			...totals,
			commitsByMonth: sortedMonths(combinedMonths),
			languageBytes: topLanguageBytes(combinedBytes)
		}
	};

	// Leak guard: nothing identifying may reach the committed file.
	const serialised = JSON.stringify(output);
	const lowered = serialised.toLowerCase();
	for (const secret of secrets) {
		if (lowered.includes(secret))
			throw new SafeError('[build-github-orgs] output contains an identifying name; not written');
	}
	if (deniedWords(serialised).length)
		throw new SafeError('[build-github-orgs] denied word in output; snapshot not written');
	if (/@|https?:|www\./i.test(serialised))
		throw new SafeError('[build-github-orgs] output contains an address; not written');

	const written = await writeSnapshot(outPath, output, { force: Boolean(process.argv[2]) });
	console.log(
		`[build-github-orgs] private work: ${output.private.reposContributed} repos, ` +
			`${output.private.commits} commits, ${output.private.pullRequests} PRs`
	);
	console.log(
		written ? `[build-github-orgs] wrote ${outPath}` : '[build-github-orgs] unchanged, not written'
	);
}

try {
	await main();
} catch (error) {
	// Only our own messages are printed: anything else (a gh error, a stack
	// trace) may carry a request path with an organisation or repository name.
	console.error(
		error instanceof SafeError
			? error.message
			: '[build-github-orgs] unexpected failure; details suppressed; snapshot not written'
	);
	process.exit(1);
}
