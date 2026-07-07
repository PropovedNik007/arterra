# Arterra Redesign — Phase (a): Scaffold — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the new toolchain (Svelte 5, dependency swap, design tokens), a build-time content/graph pipeline reading `content/<section>/**/*.md`, a redesigned header/footer/nav, and real migrated seed content — without touching the not-yet-redesigned pages (Projects, Home, About, Contact), which keep working exactly as they do today throughout this phase.

**Architecture:** Two repos change. `arterria` (the vault, sibling repo at `../arterria`) gets its `section`/`discipline` taxonomy updated first, since the site's migrated content is copied from it. `arterra` (this repo) gets a plain-JavaScript (JSDoc-typed) content/graph pipeline shared between SvelteKit route loaders and a standalone Node script (`scripts/build-graph.mjs`) — plain JS because Node 20 cannot execute `.ts` directly and the graph script runs outside Vite. The old UI kit (`flowbite-svelte` etc.) is deliberately **not** removed yet — pages that still use it (Projects, Home, About, Contact) are rewritten in later phases; removing the dependency now would break them for no benefit. The one forced exception is `svelte-chartjs`, which is incompatible with Svelte 5 and must be replaced now because the Home page renders it in every build.

Scope split from the design spec's §8 "Graph" section: this plan builds the **data** side (`buildGraph()`, `scripts/build-graph.mjs`, a real `graph.json` regenerated on every build) because it's pure pipeline work that belongs with the rest of the content pipeline and needs to exist before real content can be verified end-to-end (Task 16). The **UI** side (`GraphView.svelte`, the `/graph` route, per-section mini graphs) stays in Phase (d) as originally scoped, alongside the rest of that phase's graph-consuming UI work.

**Tech Stack:** SvelteKit 2, Svelte 5, `adapter-static`, Tailwind, `unified`/`remark`/`rehype`, `gray-matter`, `graphology`/`sigma`, `chart.js` (direct, no wrapper), `vitest`.

## Global Constraints

- Production builds must keep `BASE_PATH=/arterra` (GitHub Pages project-page path); dev keeps an empty base. Do not change `svelte.config.js`'s existing base-path logic.
- `engine-strict=true` is set in `.npmrc` — respect the Node/pnpm versions declared in `package.json`.
- This environment's default corepack-installed pnpm (11.x) crashes with `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING` on Node 20.19.6. Verified fix: `corepack prepare pnpm@8.15.9 --activate` (matches the version CI already pins via `pnpm/action-setup@v3` with `version: 8`). Pin this in `package.json`'s `packageManager` field so it's not a one-off local fix.
- Shared content/graph logic must be plain `.js` (JSDoc-typed, `allowJs`/`checkJs` are already on in `tsconfig.json`) — not `.ts` — because `scripts/build-graph.mjs` runs via plain `node`, with no bundler or TS loader available.
- Empirically verified compatible toolchain (tested in a disposable copy of this repo, not committed): `svelte@^5.0.0`, `@sveltejs/vite-plugin-svelte@^4.0.0`, `@sveltejs/kit@^2.5.18` (resolves to 2.69.x), `flowbite-svelte@^0.46.15` (resolves to 0.46.23, declares `svelte: '^5.0.0'` support and builds cleanly). `svelte-chartjs@3.1.5` does **not** work under Svelte 5 (imports `current_component` from `svelte/internal`, which Svelte 5 removed) — it must be dropped in favor of using `chart.js` directly.
- Never `git push --force`. Small, descriptive commits in both repos. In `arterria`, commit messages are present-tense per its `AGENTS.md` (e.g. "update taxonomy", not "updated taxonomy").
- Do not touch `arterria`'s encrypted paths, CSV data files, or anything outside what this plan explicitly names.
- Do not delete or rewrite `src/components/{Cv,Header,Skills,Education}.svelte`'s siblings that are out of this phase's scope (`Cv.svelte`, `Projects.svelte`, `Skills.svelte`, `Education.svelte` stay as-is — they're rewritten in Phase (b)/(c)). Only `Header.svelte` (replaced) and `SkillsRadar.svelte` (patched for Svelte 5 compatibility, not redesigned) are touched.

---

### Task 1: Vault taxonomy docs (`arterria`)

**Files:**
- Modify: `../arterria/AGENTS.md` (frontmatter schema section, "Repo map" table row, "Portfolio export" section)
- Modify: `../arterria/README.md` (repository map table, phase-1 status line)
- Modify: `../arterria/70-portfolio/portfolio.md` (dataview note + prose)

**Interfaces:**
- Consumes: nothing.
- Produces: the documented `section: projects | diy | sport` + `discipline: hiking | boxing | diving | table-tennis` vocabulary that Task 2 applies to real notes, and that this repo's content model (Task 5 onward) assumes.

- [ ] **Step 1: Update `AGENTS.md`'s frontmatter schema block**

In `../arterria/AGENTS.md`, find the frontmatter code block under "Frontmatter — required on every note" (currently `section:              # only set for public notes: projects | 3d-printing | hiking | boxing`). Replace that line and add a discipline line:

```yaml
section:              # only set for public notes: projects | diy | sport
discipline:           # only set when section is "sport": hiking | boxing | diving | table-tennis
```

Then find this row in the "Repo map — where things go" table:

```
| Public project/hike/print/boxing note | anywhere in its home folder, set `visibility: public` + `section:` | — |
```

and replace it with:

```
| Public project/DIY/sport note | anywhere in its home folder, set `visibility: public` + `section:` (+ `discipline:` for sport) | — |
```

The "trip (hiking)" bullet under "Type-specific fields on top of the base schema" describes trip-specific fields (`date`, `region`, `distance_km`, etc.), not the `section` enum itself — it needs no change. In the "Portfolio export (public projection)" section (two consecutive bullets both need updating), replace:

```
- Any note can go public by setting `visibility: public` and a `section:`
  (`projects | 3d-printing | hiking | boxing`).
- `70-portfolio/projects/` is the source of truth for the programming/ML
  channel. Hiking, 3D-printing, and boxing notes stay in their home folders
  under `20-areas/` and simply get `visibility: public` + `section` when
  ready to publish.
```

with:

```
- Any note can go public by setting `visibility: public` and a `section:`
  (`projects | diy | sport`). Notes with `section: sport` also need a
  `discipline:` (`hiking | boxing | diving | table-tennis`).
- `70-portfolio/projects/` is the source of truth for the programming/ML
  channel. Sport (hiking, boxing, diving, table tennis) and DIY notes stay
  in their home folders under `20-areas/` and simply get
  `visibility: public` + `section` (+ `discipline` for sport) when ready
  to publish.
```

- [ ] **Step 2: Update `README.md`'s repository map and status**

In `../arterria/README.md`, the "Repository map" table row for `70-portfolio/` currently reads "Public projection — source for the `arterra` site" — leave it, but update the "Status" section's phase-1 line:

```
Phase 1 (this commit): full folder tree, templates, MOCs, seed notes, empty
data files with headers, and seed public notes for the portfolio's four
channels (projects, 3d-printing, hiking, boxing).
```

becomes:

```
Phase 1 (this commit): full folder tree, templates, MOCs, seed notes, empty
data files with headers, and seed public notes for the portfolio's three
channels (projects, diy, sport).
```

- [ ] **Step 3: Update `70-portfolio/portfolio.md` prose**

In `../arterria/70-portfolio/portfolio.md`, replace:

```
This folder is the source of truth for the **programming/ML channel** of
the public site (`arterra`). Hiking, 3D-printing, and boxing public notes
stay in their home folders under `20-areas/` — they just get
`visibility: public` + a `section:` when ready to publish.

`scripts/build-public-site.sh` (Phase 3) exports every `visibility: public`
note across the vault, groups it by `section`
(`projects | 3d-printing | hiking | boxing`), strips private frontmatter,
and syncs the result into the sibling `arterra` site repo.
```

with:

```
This folder is the source of truth for the **programming/ML channel** of
the public site (`arterra`). Sport (hiking, boxing, diving, table tennis)
and DIY public notes stay in their home folders under `20-areas/` — they
just get `visibility: public` + a `section:` (+ `discipline:` for sport)
when ready to publish.

`scripts/build-public-site.sh` (Phase 3) exports every `visibility: public`
note across the vault, groups it by `section` (`projects | diy | sport`,
with `discipline` further splitting `sport` into
`hiking | boxing | diving | table-tennis`), strips private frontmatter,
and syncs the result into the sibling `arterra` site repo.
```

- [ ] **Step 4: Verify and commit**

Run: `cd ../arterria && grep -in "3d-printing" AGENTS.md README.md 70-portfolio/portfolio.md`
Expected: **exactly one** match:
```
AGENTS.md:| 3D print | append row → `20-areas/hobbies/3d-printing/print-log.csv` | ...
```
That one is a real, unchanged vault folder path (`20-areas/hobbies/3d-printing/`) — physical filing locations aren't renamed, only the `section:`/`discipline:` export tags are (design spec §3a). If any other line still contains "3d-printing", Steps 1-3 were incomplete — go back and fix it before committing.

Run: `cd ../arterria && grep -n "discipline:" AGENTS.md`
Expected: at least one match — the new discipline line added to the frontmatter schema block in Step 1.

```bash
cd ../arterria
git diff --stat
```
Expected: exactly `AGENTS.md`, `README.md`, `70-portfolio/portfolio.md` listed, no other files touched.

```bash
cd ../arterria
git add AGENTS.md README.md 70-portfolio/portfolio.md
git commit -m "update public taxonomy to projects/diy/sport"
```

---

### Task 2: Vault seed note frontmatter migration (`arterria`)

**Files:**
- Modify: `../arterria/20-areas/hiking/trips/2026-06-14-rax.md`
- Modify: `../arterria/20-areas/health/boxing/2026-05-first-sparring.md`
- Modify: `../arterria/20-areas/hobbies/3d-printing/2026-04-miniature-batch.md`

**Interfaces:**
- Consumes: taxonomy documented in Task 1.
- Produces: the three real notes Task 16 copies into `content/`.

- [ ] **Step 1: Update the hiking trip note's frontmatter**

In `../arterria/20-areas/hiking/trips/2026-06-14-rax.md`, change:

```yaml
section: hiking
```

to:

```yaml
section: sport
discipline: hiking
```

Also bump `updated: 2026-06-14` to today's date if you're doing this on a different day (leave as-is if same day). Body text is untouched.

- [ ] **Step 2: Update the boxing note's frontmatter**

In `../arterria/20-areas/health/boxing/2026-05-first-sparring.md`, change:

```yaml
section: boxing
```

to:

```yaml
section: sport
discipline: boxing
```

Body text untouched.

- [ ] **Step 3: Update the 3D-printing note's frontmatter**

In `../arterria/20-areas/hobbies/3d-printing/2026-04-miniature-batch.md`, change:

```yaml
section: 3d-printing
```

to:

```yaml
section: diy
```

Body text untouched.

- [ ] **Step 4: Verify and commit**

Run: `cd ../arterria && grep -A1 "^section:" 20-areas/hiking/trips/2026-06-14-rax.md 20-areas/health/boxing/2026-05-first-sparring.md 20-areas/hobbies/3d-printing/2026-04-miniature-batch.md`
Expected:
```
20-areas/hiking/trips/2026-06-14-rax.md:section: sport
20-areas/hiking/trips/2026-06-14-rax.md-discipline: hiking
20-areas/health/boxing/2026-05-first-sparring.md:section: sport
20-areas/health/boxing/2026-05-first-sparring.md-discipline: boxing
20-areas/hobbies/3d-printing/2026-04-miniature-batch.md:section: diy
20-areas/hobbies/3d-printing/2026-04-miniature-batch.md-created: 2026-04-10
```

```bash
cd ../arterria
git add 20-areas/hiking/trips/2026-06-14-rax.md 20-areas/health/boxing/2026-05-first-sparring.md 20-areas/hobbies/3d-printing/2026-04-miniature-batch.md
git commit -m "retag public notes with the projects/diy/sport taxonomy"
```

---

### Task 3: Remove dead code and duplicate assets (`arterra`)

**Files:**
- Delete: `arterra_vault/` (entire directory)
- Delete: `src/routes/api/` (entire directory)
- Delete: `parseVault.js`
- Delete: `src/lib/images/projects/` (orphaned duplicate images — nothing imports them; confirmed by grep in Step 1)

**Interfaces:**
- Consumes: nothing.
- Produces: a clean tree with no dangling references, verified by grep in Step 1.

Note: `src/lib/images/github.svg` and `src/lib/images/space.jpg` are **not** deleted in this task — they're still imported by `src/components/Header.svelte` and `src/routes/+page.svelte` (Home) respectively, both of which are rewritten in later tasks/phases (Header in Task 13 of this phase; Home in Phase (e)). Deleting them now would break the build. `github.svg`'s removal is folded into Task 13; `space.jpg`'s removal is deferred to Phase (e)'s Home rewrite.

- [ ] **Step 1: Confirm what's actually dead before deleting anything**

Run: `grep -rn "lib/images/projects" src/ --include="*.svelte" --include="*.js" --include="*.ts"`
Expected: no output — confirms nothing imports the `src/lib/images/projects/` subfolder (verified against the real repo: only `src/lib/images/github.svg` and `src/lib/images/space.jpg`, both outside this subfolder, have live importers).

Run: `grep -rln "arterra_vault\|parseVault" src/ package.json 2>/dev/null`
Expected:
```
src/routes/api/projects/[id]/+server.js
```
(only the file being deleted itself references these — no external consumer.)

- [ ] **Step 2: Delete the directories and file**

```bash
cd /home/artur/life/arterra
git rm -r arterra_vault src/routes/api src/lib/images/projects
git rm parseVault.js
```

- [ ] **Step 3: Verify the reference set didn't shrink unexpectedly**

Run: `git status --short | head -30`
Expected: every line starts with `D ` (deleted) and only paths under `arterra_vault/`, `src/routes/api/`, `src/lib/images/projects/`, and `parseVault.js`.

Run: `BASE_PATH=/arterra pnpm build`
Expected: build still succeeds — `src/lib/images/github.svg` and `space.jpg` are untouched, so Header and Home still resolve their imports.

- [ ] **Step 4: Commit**

```bash
git commit -m "remove stale vault copy, broken runtime content API, and orphaned duplicate images"
```

---

### Task 4: Toolchain upgrade — pnpm pin, Svelte 5, dependency swap

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `src/components/skills/SkillsRadar.svelte`
- Create: `src/lib/sanity.test.js` (temporary, deleted at the end of this task)

**Interfaces:**
- Consumes: nothing.
- Produces: `svelte@5`, `vitest` wired and runnable via `pnpm test`, `chart.js` usable directly without a wrapper (pattern Task 7-8's tests don't need, but later phases reusing `SkillsRadar.svelte` do).

- [ ] **Step 1: Pin the package manager**

In `package.json`, add a top-level field (after `"version"`):

```json
"packageManager": "pnpm@8.15.9",
```

Run: `corepack prepare pnpm@8.15.9 --activate`
Expected: `Preparing pnpm@8.15.9 for immediate activation...` with no errors. If `pnpm --version` still errors afterward with `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`, corepack's default pnpm is being invoked instead — re-run the `corepack prepare` command with `--activate` and confirm `pnpm --version` prints `8.15.9` before continuing.

- [ ] **Step 2: Edit `package.json` dependency versions**

This step replaces three whole blocks verbatim (safer than line-by-line edits — JSON has no trailing commas, so adding/removing an item at the end of a block is an easy way to break the file if done piecemeal).

Replace the whole `"scripts"` block:

```json
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"preview": "vite preview",
		"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
		"check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
		"test": "vitest run",
		"test:watch": "vitest",
		"lint": "prettier --check . && eslint .",
		"format": "prettier --write .",
		"deploy": "gh-pages -d build -t true"
	},
```

Replace the whole `"devDependencies"` block:

```json
	"devDependencies": {
		"@fontsource/fira-mono": "^4.5.10",
		"@fontsource/fraunces": "^5.1.0",
		"@neoconfetti/svelte": "^1.0.0",
		"@smui-extra/accordion": "^7.0.0",
		"@smui/button": "^7.0.0",
		"@smui/icon-button": "^7.0.0",
		"@smui/paper": "^7.0.0",
		"@smui/tab": "^7.0.0",
		"@smui/tab-bar": "^7.0.0",
		"@sveltejs/adapter-auto": "^3.2.2",
		"@sveltejs/adapter-static": "^3.0.2",
		"@sveltejs/kit": "^2.5.18",
		"@sveltejs/vite-plugin-svelte": "^4.0.0",
		"@types/chroma-js": "^2.4.4",
		"@types/eslint": "^9.6.0",
		"autoprefixer": "^10.4.19",
		"eslint": "^9.8.0",
		"eslint-config-prettier": "^9.1.0",
		"eslint-plugin-svelte": "^2.43.0",
		"flowbite": "^2.4.1",
		"flowbite-svelte": "^0.46.15",
		"flowbite-svelte-icons": "^1.6.1",
		"gh-pages": "^6.1.1",
		"globals": "^15.8.0",
		"postcss": "^8.4.40",
		"prettier": "^3.3.3",
		"prettier-plugin-svelte": "^3.2.6",
		"svelte": "^5.0.0",
		"svelte-check": "^3.8.5",
		"tailwindcss": "^3.4.7",
		"typescript": "^5.5.4",
		"typescript-eslint": "8.0.0-alpha.60",
		"vite": "^5.3.5",
		"vitest": "^2.1.4"
	},
```

Replace the whole `"dependencies"` block (note `svelte-chartjs` is gone, and there's no longer a stray trailing comma since it's rebuilt from scratch):

```json
	"dependencies": {
		"@sigma/edge-curve": "3.0.0-beta.13",
		"chart.js": "^4.4.4",
		"chroma-js": "^3.0.0",
		"fs-extra": "^11.2.0",
		"graphology": "^0.25.4",
		"graphology-layout-force": "^0.2.4",
		"graphology-layout-forceatlas2": "^0.10.1",
		"gray-matter": "^4.0.3",
		"gsap": "^3.12.5",
		"leaflet": "^1.9.4",
		"leaflet-gpx": "^2.1.2",
		"markdown-link-extractor": "^4.0.2",
		"marked": "^15.0.8",
		"mdbsvelte": "^1.0.12",
		"rehype-highlight": "^7.0.0",
		"rehype-slug": "^6.0.0",
		"rehype-stringify": "^10.0.0",
		"remark-gfm": "^4.0.0",
		"remark-parse": "^11.0.0",
		"remark-rehype": "^11.1.0",
		"sigma": "3.0.0-beta.26",
		"unified": "^11.0.5"
	}
```

(`marked`, `markdown-link-extractor`, and `mdbsvelte` stay in `dependencies` for now even though nothing actively imports them — `SkillsRadar.svelte` has a leftover *commented-out* `mdbsvelte` import that Step 4 of this task deletes along with the rest of that file's rewrite. Since they cost nothing to leave and removing them is a one-line follow-up whenever convenient, pulling them out isn't worth a separate verification pass in this already-large task.)

- [ ] **Step 3: Install**

```bash
cd /home/artur/life/arterra
pnpm install
```

Expected: install completes. A `WARN Issues with peer dependencies` block, if any, should **not** mention `svelte-hmr` or `svelte-chartjs` (those are exactly the two issues this task fixes) — any other peer warning is fine to leave for now.

- [ ] **Step 4: Fix `SkillsRadar.svelte` (Svelte-5-incompatible `svelte-chartjs` removed)**

Replace the full contents of `src/components/skills/SkillsRadar.svelte`:

```svelte
<script>
	import { onMount, onDestroy } from 'svelte';
	import { Chart, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

	Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
	Chart.defaults.backgroundColor = '#0000';
	Chart.defaults.borderColor = '#36A2EB';
	Chart.defaults.color = '#ffffff';

	let canvasEl;
	let chart;

	let dataRadar = {
		labels: ['Data Science', 'Computer Vision', 'NLP', 'Blockchain', 'IoT', '3D/AR', 'Front-End', 'Back-End', 'DevOps', 'Databases'],
		datasets: [
			{
				label: 'Expirience',
				backgroundColor: 'rgba(71, 225, 167, 0.5)',
				borderColor: 'rgb(0, 150, 136)',
				hoverBackgroundColor: 'rgba(0, 150, 136, 0.75)',
				data: [90, 80, 75, 30, 50, 60, 70, 80, 50, 70]
			},
			{
				label: 'Interest',
				backgroundColor: 'rgba(0, 150, 136, 0.5)',
				borderColor: 'rgb(0, 150, 136)',
				data: [80, 100, 100, 60, 60, 90, 80, 90, 60, 70]
			}
		]
	};

	const options = {
		responsive: true,
		scales: {
			r: {
				ticks: {
					color: '#607D8B',
					font: {
						size: 16
					},
					backdropColor: 'rgba(0, 0, 0, 0.1)'
				},
				grid: {
					color: '#546E7A'
				}
			}
		}
	};

	onMount(() => {
		chart = new Chart(canvasEl, { type: 'radar', data: dataRadar, options });
	});

	onDestroy(() => {
		chart?.destroy();
	});
</script>

<canvas bind:this={canvasEl}></canvas>
```

(This is a functional fix, not the visual re-skin — re-skinning to the new design tokens happens when About/CV is rebuilt in Phase (b).)

- [ ] **Step 5: Add the vitest config**

Replace the full contents of `vite.config.ts`:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.test.{js,ts}']
	}
});
```

- [ ] **Step 6: Prove vitest is wired with a throwaway sanity test**

Create `src/lib/sanity.test.js`:

```js
import { describe, expect, it } from 'vitest';

describe('vitest wiring', () => {
	it('runs', () => {
		expect(1 + 1).toBe(2);
	});
});
```

Run: `pnpm test`
Expected: `Test Files  1 passed (1)`, `Tests  1 passed (1)`.

Delete the sanity test — it's served its purpose and real tests start in Task 5:

```bash
rm src/lib/sanity.test.js
```

- [ ] **Step 7: Verify the full build still succeeds**

```bash
BASE_PATH=/arterra pnpm build
```

Expected: build completes with `✓ built in`, `Wrote site to "build"`, `✔ done`, and no fatal errors. Peer-dependency warnings unrelated to `svelte-chartjs`/`svelte-hmr` are fine.

```bash
pnpm dev &
sleep 4
curl -s -o /dev/null -w "home: %{http_code}\n" http://localhost:5173/
curl -s -o /dev/null -w "about: %{http_code}\n" http://localhost:5173/about
kill %1
```

Expected: both print `200`.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.ts src/components/skills/SkillsRadar.svelte
git commit -m "upgrade to Svelte 5, pin pnpm, add markdown/graph/testing/map dependencies"
```

---

### Task 5: Content types module

**Files:**
- Create: `src/lib/content/types.js`
- Test: `src/lib/content/types.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `SECTIONS`, `DISCIPLINES`, `isSection(value)`, `isDiscipline(value)` — used by Task 7's loader. JSDoc `@typedef {'projects'|'diy'|'sport'} Section`, `@typedef {'hiking'|'boxing'|'diving'|'table-tennis'} Discipline`, `@typedef {object} ContentItem` (full shape below) — referenced in JSDoc `@param`/`@returns` by every later content/graph module.

- [ ] **Step 1: Write the failing test**

Create `src/lib/content/types.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { isSection, isDiscipline, SECTIONS, DISCIPLINES } from './types.js';

describe('isSection', () => {
	it('accepts every declared section', () => {
		for (const section of SECTIONS) {
			expect(isSection(section)).toBe(true);
		}
	});

	it('rejects an old-taxonomy value', () => {
		expect(isSection('hiking')).toBe(false);
	});

	it('rejects non-strings', () => {
		expect(isSection(undefined)).toBe(false);
		expect(isSection(42)).toBe(false);
	});
});

describe('isDiscipline', () => {
	it('accepts every declared discipline', () => {
		for (const discipline of DISCIPLINES) {
			expect(isDiscipline(discipline)).toBe(true);
		}
	});

	it('rejects an unknown discipline', () => {
		expect(isDiscipline('chess')).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- types.test`
Expected: FAIL — `Cannot find module './types.js'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/content/types.js`:

```js
/** @typedef {'projects' | 'diy' | 'sport'} Section */
/** @typedef {'hiking' | 'boxing' | 'diving' | 'table-tennis'} Discipline */

/**
 * @typedef {object} ContentItem
 * @property {string} slug
 * @property {Section} section
 * @property {Discipline} [discipline]
 * @property {string} title
 * @property {string} date
 * @property {string} [updated]
 * @property {string[]} tags
 * @property {string} [cover]
 * @property {string} excerpt
 * @property {string} html
 * @property {string[]} links
 * @property {string[]} [tech]
 * @property {string} [externalLink]
 * @property {string} [printer]
 * @property {string} [material]
 * @property {number} [distance_km]
 * @property {number} [gain_m]
 * @property {string} [region]
 * @property {string} [gpx]
 * @property {boolean} [led_group]
 */

/** @type {Section[]} */
export const SECTIONS = ['projects', 'diy', 'sport'];

/** @type {Discipline[]} */
export const DISCIPLINES = ['hiking', 'boxing', 'diving', 'table-tennis'];

/**
 * @param {unknown} value
 * @returns {value is Section}
 */
export function isSection(value) {
	return typeof value === 'string' && SECTIONS.includes(/** @type {Section} */ (value));
}

/**
 * @param {unknown} value
 * @returns {value is Discipline}
 */
export function isDiscipline(value) {
	return typeof value === 'string' && DISCIPLINES.includes(/** @type {Discipline} */ (value));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- types.test`
Expected: `Test Files  1 passed (1)`, `Tests  6 passed (6)`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/types.js src/lib/content/types.test.js
git commit -m "add content section/discipline types and validators"
```

---

### Task 6: Markdown pipeline module

**Files:**
- Create: `src/lib/content/markdown.js`
- Test: `src/lib/content/markdown.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `convertWikilinks(raw: string): string`, `extractLinkTargets(raw: string): string[]`, `renderMarkdown(raw: string): Promise<string>` — used by Task 7's loader.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/content/markdown.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { convertWikilinks, extractLinkTargets, renderMarkdown } from './markdown.js';

describe('convertWikilinks', () => {
	it('converts a plain wikilink into a markdown link', () => {
		expect(convertWikilinks('See [[Printerra]] for details.')).toBe(
			'See [Printerra](Printerra) for details.'
		);
	});

	it('converts a piped wikilink using the alias as link text', () => {
		expect(convertWikilinks('See [[Printerra|the thesis]].')).toBe('See [the thesis](Printerra).');
	});
});

describe('extractLinkTargets', () => {
	it('extracts wikilink targets', () => {
		expect(extractLinkTargets('Related: [[Printerra]] and [[Cryptex|the NFT one]].')).toEqual([
			'Printerra',
			'Cryptex'
		]);
	});

	it('extracts standard markdown link targets', () => {
		expect(extractLinkTargets('See [Printerra](printerra) for details.')).toEqual(['printerra']);
	});

	it('ignores external http(s) and mailto links', () => {
		expect(extractLinkTargets('[GitHub](https://github.com/x) or [email](mailto:a@b.com)')).toEqual(
			[]
		);
	});

	it('deduplicates repeated targets', () => {
		expect(extractLinkTargets('[[Printerra]] again [[Printerra]]')).toEqual(['Printerra']);
	});
});

describe('renderMarkdown', () => {
	it('renders a heading and paragraph to HTML', async () => {
		const html = await renderMarkdown('# Title\n\nHello world.');
		expect(html).toContain('<h1');
		expect(html).toContain('Hello world.');
	});

	it('renders a wikilink as an anchor tag', async () => {
		const html = await renderMarkdown('See [[Printerra]].');
		expect(html).toContain('<a href="Printerra">Printerra</a>');
	});

	it('applies syntax highlighting classes to fenced code blocks', async () => {
		const html = await renderMarkdown('```js\nconst x = 1;\n```');
		expect(html).toContain('hljs');
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- markdown.test`
Expected: FAIL — `Cannot find module './markdown.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/content/markdown.js`:

```js
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const MD_LINK_RE = /\[[^\]]*\]\(([^)#\s]+)(?:[^)]*)?\)/g;

/**
 * Converts `[[Target]]` / `[[Target|Label]]` wikilinks into standard markdown links.
 * @param {string} raw
 * @returns {string}
 */
export function convertWikilinks(raw) {
	return raw.replace(WIKILINK_RE, (_match, target, label) => {
		const cleanTarget = target.trim();
		const text = (label ?? cleanTarget).trim();
		return `[${text}](${encodeURI(cleanTarget)})`;
	});
}

/**
 * Extracts every internal link target (wikilink or markdown link) from raw markdown source.
 * External http(s)/mailto links are excluded. Order-preserving, deduplicated.
 * @param {string} raw
 * @returns {string[]}
 */
export function extractLinkTargets(raw) {
	/** @type {Set<string>} */
	const targets = new Set();

	for (const match of raw.matchAll(WIKILINK_RE)) {
		targets.add(match[1].trim());
	}

	const withoutWikilinks = raw.replace(WIKILINK_RE, '');
	for (const match of withoutWikilinks.matchAll(MD_LINK_RE)) {
		const url = decodeURI(match[1].trim());
		if (/^https?:\/\//i.test(url) || url.startsWith('mailto:')) continue;
		targets.add(url);
	}

	return [...targets];
}

const processor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkRehype)
	.use(rehypeSlug)
	.use(rehypeHighlight)
	.use(rehypeStringify);

/**
 * Renders a markdown body (with wikilinks resolved to normal links) to an HTML string.
 * @param {string} raw
 * @returns {Promise<string>}
 */
export async function renderMarkdown(raw) {
	const withLinks = convertWikilinks(raw);
	const file = await processor.process(withLinks);
	return String(file);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- markdown.test`
Expected: `Test Files  1 passed (1)`, `Tests  9 passed (9)`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/markdown.js src/lib/content/markdown.test.js
git commit -m "add markdown rendering and internal-link extraction pipeline"
```

---

### Task 7: Content loader module

**Files:**
- Create: `src/lib/content/load.js`
- Test: `src/lib/content/load.test.js`
- Test fixtures:
  - Create: `src/lib/content/__fixtures__/content/projects/example-project.md`
  - Create: `src/lib/content/__fixtures__/content/sport/hiking/example-hike.md`
  - Create: `src/lib/content/__fixtures__/content/sport/boxing/private-note.md`
  - Create: `src/lib/content/__fixtures__/content/diy/no-section.md`

**Interfaces:**
- Consumes: `isSection`, `isDiscipline` from `./types.js` (Task 5); `extractLinkTargets`, `renderMarkdown` from `./markdown.js` (Task 6).
- Produces: `loadContent(root?: string): Promise<ContentItem[]>` — used by Task 9's `build-graph.mjs` and by every route `+page.ts` from Phase (b) onward. Items are sorted by `date` descending. Returns `[]` (with a console warning) if `root` doesn't exist, rather than throwing.

- [ ] **Step 1: Write the fixtures**

Create `src/lib/content/__fixtures__/content/projects/example-project.md`:

```markdown
---
type: project
area: personal
status: done
visibility: public
section: projects
created: 2024-06-01
tags: [python, opencv]
link: https://example.com
---

# Example Project

A short description used as the excerpt.

## Stack

Python, OpenCV.
```

Create `src/lib/content/__fixtures__/content/sport/hiking/example-hike.md`:

```markdown
---
type: trip
area: hiking
status: done
visibility: public
section: sport
discipline: hiking
created: 2026-06-14
date: 2026-06-14
region: Rax, Lower Austria
distance_km: 14
gain_m: 950
gpx: "attachments/example.gpx"
led_group: false
tags: []
---

# Example Hike

See [[example-project]] for gear notes.
```

Create `src/lib/content/__fixtures__/content/sport/boxing/private-note.md`:

```markdown
---
type: note
area: health
status: active
visibility: private
section: sport
discipline: boxing
created: 2026-05-01
tags: []
---

# Private Note

Should never be loaded.
```

Create `src/lib/content/__fixtures__/content/diy/no-section.md`:

```markdown
---
type: note
area: hobbies
status: idea
visibility: public
created: 2026-01-01
tags: []
---

# Missing Section

Should be skipped for missing section.
```

- [ ] **Step 2: Write the failing tests**

Create `src/lib/content/load.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadContent } from './load.js';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(here, '__fixtures__', 'content');

describe('loadContent', () => {
	it('loads public notes and skips private ones', async () => {
		const items = await loadContent(FIXTURES);
		const slugs = items.map((item) => item.slug);
		expect(slugs).toContain('example-project');
		expect(slugs).toContain('example-hike');
		expect(slugs).not.toContain('private-note');
	});

	it('skips notes with a missing or invalid section', async () => {
		const items = await loadContent(FIXTURES);
		expect(items.map((item) => item.slug)).not.toContain('no-section');
	});

	it('derives title from the first H1 when frontmatter has none', async () => {
		const items = await loadContent(FIXTURES);
		const hike = items.find((item) => item.slug === 'example-hike');
		expect(hike?.title).toBe('Example Hike');
	});

	it('falls back to created: when frontmatter has no date:', async () => {
		const items = await loadContent(FIXTURES);
		const project = items.find((item) => item.slug === 'example-project');
		expect(project?.date).toBe('2024-06-01');
	});

	it('requires a discipline for sport-section notes', async () => {
		const items = await loadContent(FIXTURES);
		const hike = items.find((item) => item.slug === 'example-hike');
		expect(hike?.discipline).toBe('hiking');
	});

	it('resolves internal links against known slugs', async () => {
		const items = await loadContent(FIXTURES);
		const hike = items.find((item) => item.slug === 'example-hike');
		expect(hike?.links).toEqual(['example-project']);
	});

	it('carries section-specific fields through', async () => {
		const items = await loadContent(FIXTURES);
		const hike = items.find((item) => item.slug === 'example-hike');
		expect(hike?.distance_km).toBe(14);
		expect(hike?.gain_m).toBe(950);
		expect(hike?.region).toBe('Rax, Lower Austria');
	});

	it('returns an empty array for a missing content root instead of throwing', async () => {
		const items = await loadContent(join(here, '__fixtures__', 'does-not-exist'));
		expect(items).toEqual([]);
	});
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test -- load.test`
Expected: FAIL — `Cannot find module './load.js'`.

- [ ] **Step 4: Write the implementation**

Create `src/lib/content/load.js`:

```js
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import matter from 'gray-matter';
import { renderMarkdown, extractLinkTargets } from './markdown.js';
import { isSection, isDiscipline } from './types.js';

/** @typedef {import('./types.js').ContentItem} ContentItem */

/**
 * @param {string} dir
 * @returns {string[]}
 */
function walkMarkdownFiles(dir) {
	const entries = readdirSync(dir, { withFileTypes: true });
	/** @type {string[]} */
	const files = [];
	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...walkMarkdownFiles(fullPath));
		} else if (extname(entry.name) === '.md') {
			files.push(fullPath);
		}
	}
	return files;
}

/**
 * @param {string} body
 * @returns {string | undefined}
 */
function firstHeading(body) {
	const match = body.match(/^#\s+(.+)$/m);
	return match?.[1]?.trim();
}

/**
 * @param {string} body
 * @returns {string}
 */
function firstParagraph(body) {
	const withoutHeadings = body.replace(/^#.*$/gm, '').trim();
	const paragraph = withoutHeadings.split(/\n\s*\n/)[0] ?? '';
	return paragraph.replace(/\s+/g, ' ').trim();
}

/**
 * Loads and normalizes every markdown file under `root`, skipping any that
 * carry `visibility: private` or a missing/invalid `section` (and, for
 * `section: sport`, a missing/invalid `discipline`). Returns `[]` (with a
 * warning) if `root` doesn't exist yet, rather than throwing — the vault's
 * export step may not have run.
 * @param {string} [root]
 * @returns {Promise<ContentItem[]>}
 */
export async function loadContent(root = join(process.cwd(), 'content')) {
	if (!existsSync(root)) {
		console.warn(`[content] "${root}" does not exist yet — returning no content items`);
		return [];
	}

	const filePaths = walkMarkdownFiles(root);
	const raw = filePaths.map((filePath) => {
		const source = readFileSync(filePath, 'utf8');
		const { data, content } = matter(source);
		return { slug: basename(filePath, '.md'), data, body: content };
	});

	const slugSet = new Set(raw.map((note) => note.slug.toLowerCase()));

	/** @type {ContentItem[]} */
	const items = [];

	for (const note of raw) {
		const { slug, data, body } = note;

		if (data.visibility === 'private') {
			console.warn(`[content] skipping "${slug}": visibility is private`);
			continue;
		}

		if (!isSection(data.section)) {
			console.warn(`[content] skipping "${slug}": missing/invalid section "${String(data.section)}"`);
			continue;
		}

		const section = data.section;

		if (section === 'sport' && !isDiscipline(data.discipline)) {
			console.warn(`[content] skipping "${slug}": section is "sport" but discipline is missing/invalid`);
			continue;
		}

		const rawLinks = extractLinkTargets(body);
		const links = rawLinks
			.map((target) => target.replace(/\.md$/i, '').split('/').pop() ?? target)
			.filter((target) => slugSet.has(target.toLowerCase()));

		items.push({
			slug,
			section,
			discipline: section === 'sport' ? data.discipline : undefined,
			title: typeof data.title === 'string' ? data.title : (firstHeading(body) ?? slug),
			date: typeof data.date === 'string' ? data.date : String(data.created ?? ''),
			updated: typeof data.updated === 'string' ? data.updated : undefined,
			tags: Array.isArray(data.tags) ? data.tags : [],
			cover: typeof data.cover === 'string' ? data.cover : undefined,
			excerpt: typeof data.description === 'string' ? data.description : firstParagraph(body),
			html: await renderMarkdown(body),
			links,
			tech: Array.isArray(data.tech) ? data.tech : undefined,
			externalLink: typeof data.link === 'string' ? data.link : undefined,
			printer: typeof data.printer === 'string' ? data.printer : undefined,
			material: typeof data.material === 'string' ? data.material : undefined,
			distance_km: typeof data.distance_km === 'number' ? data.distance_km : undefined,
			gain_m: typeof data.gain_m === 'number' ? data.gain_m : undefined,
			region: typeof data.region === 'string' ? data.region : undefined,
			gpx: typeof data.gpx === 'string' ? data.gpx : undefined,
			led_group: typeof data.led_group === 'boolean' ? data.led_group : undefined
		});
	}

	return items.sort((a, b) => (a.date < b.date ? 1 : -1));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- load.test`
Expected: `Test Files  1 passed (1)`, `Tests  8 passed (8)`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content/load.js src/lib/content/load.test.js src/lib/content/__fixtures__
git commit -m "add build-time content loader with frontmatter/H1/date fallbacks"
```

---

### Task 8: Graph builder module

**Files:**
- Create: `src/lib/graph/build.js`
- Test: `src/lib/graph/build.test.js`

**Interfaces:**
- Consumes: `ContentItem` shape from `../content/types.js` (Task 5, JSDoc only, no runtime import needed).
- Produces: `buildGraph(items: ContentItem[]): { nodes: GraphNode[], edges: GraphEdge[] }` — used by Task 9's `build-graph.mjs`. `GraphNode = { id, label, section, discipline? }`, `GraphEdge = { source, target, kind: 'link' | 'tag' }`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/graph/build.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { buildGraph } from './build.js';

/** @param {Partial<import('../content/types.js').ContentItem>} overrides */
function makeItem(overrides) {
	return {
		slug: 'item',
		section: 'projects',
		title: 'Item',
		date: '2026-01-01',
		tags: [],
		excerpt: '',
		html: '',
		links: [],
		...overrides
	};
}

describe('buildGraph', () => {
	it('creates one node per content item', () => {
		const graph = buildGraph([makeItem({ slug: 'a' }), makeItem({ slug: 'b' })]);
		expect(graph.nodes.map((n) => n.id)).toEqual(['a', 'b']);
	});

	it('creates a link edge for a resolved internal link', () => {
		const graph = buildGraph([makeItem({ slug: 'a', links: ['b'] }), makeItem({ slug: 'b' })]);
		expect(graph.edges).toContainEqual({ source: 'a', target: 'b', kind: 'link' });
	});

	it('does not create an edge for an unresolved link target', () => {
		const graph = buildGraph([makeItem({ slug: 'a', links: ['ghost'] })]);
		expect(graph.edges).toHaveLength(0);
	});

	it('creates a tag edge between items sharing a tag', () => {
		const graph = buildGraph([
			makeItem({ slug: 'a', tags: ['python'] }),
			makeItem({ slug: 'b', tags: ['python', 'ml'] })
		]);
		expect(graph.edges).toContainEqual({ source: 'a', target: 'b', kind: 'tag' });
	});

	it('does not duplicate an edge already created by a link', () => {
		const graph = buildGraph([
			makeItem({ slug: 'a', links: ['b'], tags: ['python'] }),
			makeItem({ slug: 'b', tags: ['python'] })
		]);
		expect(graph.edges.filter((e) => e.kind === 'link')).toHaveLength(1);
		expect(graph.edges.filter((e) => e.kind === 'tag')).toHaveLength(1);
	});

	it('never creates a self-edge', () => {
		const graph = buildGraph([makeItem({ slug: 'a', links: ['a'], tags: ['x'] })]);
		expect(graph.edges).toHaveLength(0);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- build.test`
Expected: FAIL — `Cannot find module './build.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/graph/build.js`:

```js
/** @typedef {import('../content/types.js').ContentItem} ContentItem */

/**
 * @typedef {object} GraphNode
 * @property {string} id
 * @property {string} label
 * @property {import('../content/types.js').Section} section
 * @property {import('../content/types.js').Discipline} [discipline]
 */

/**
 * @typedef {object} GraphEdge
 * @property {string} source
 * @property {string} target
 * @property {'link' | 'tag'} kind
 */

/**
 * Builds a graph from content items: an edge per resolved internal link
 * (kind: 'link'), plus a lighter-weight edge between any two items that
 * share at least one tag (kind: 'tag') so sparse sections aren't isolated
 * dots on the graph.
 * @param {ContentItem[]} items
 * @returns {{ nodes: GraphNode[], edges: GraphEdge[] }}
 */
export function buildGraph(items) {
	/** @type {GraphNode[]} */
	const nodes = items.map((item) => ({
		id: item.slug,
		label: item.title,
		section: item.section,
		discipline: item.discipline
	}));

	const edgeKeys = new Set();
	/** @type {GraphEdge[]} */
	const edges = [];

	/**
	 * @param {string} source
	 * @param {string} target
	 * @param {GraphEdge['kind']} kind
	 */
	function addEdge(source, target, kind) {
		if (source === target) return;
		const key = [source, target].sort().join('::') + `::${kind}`;
		if (edgeKeys.has(key)) return;
		edgeKeys.add(key);
		edges.push({ source, target, kind });
	}

	const slugSet = new Set(items.map((item) => item.slug));

	for (const item of items) {
		for (const target of item.links) {
			if (slugSet.has(target)) {
				addEdge(item.slug, target, 'link');
			}
		}
	}

	for (let i = 0; i < items.length; i++) {
		for (let j = i + 1; j < items.length; j++) {
			const shared = items[i].tags.some((tag) => items[j].tags.includes(tag));
			if (shared) {
				addEdge(items[i].slug, items[j].slug, 'tag');
			}
		}
	}

	return { nodes, edges };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- build.test`
Expected: `Test Files  1 passed (1)`, `Tests  6 passed (6)`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/graph/build.js src/lib/graph/build.test.js
git commit -m "add graph builder: link edges plus shared-tag edges"
```

---

### Task 9: `build-graph.mjs` script + package.json wiring

**Files:**
- Create: `scripts/build-graph.mjs`
- Modify: `package.json` (`"dev"` and `"build"` scripts)

**Interfaces:**
- Consumes: `loadContent` from `src/lib/content/load.js` (Task 7), `buildGraph` from `src/lib/graph/build.js` (Task 8).
- Produces: `src/lib/graphs/graph.json`, regenerated on every `pnpm dev`/`pnpm build` — no more manual `node parseVault.js` step.

- [ ] **Step 1: Write the script**

Create `scripts/build-graph.mjs`:

```js
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../src/lib/content/load.js';
import { buildGraph } from '../src/lib/graph/build.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const contentRoot = join(root, 'content');
const outPath = join(root, 'src/lib/graphs/graph.json');

const items = await loadContent(contentRoot);
const graph = buildGraph(items);

writeFileSync(outPath, JSON.stringify(graph, null, 2));
console.log(`[build-graph] wrote ${graph.nodes.length} nodes, ${graph.edges.length} edges to ${outPath}`);
```

- [ ] **Step 2: Run it standalone to verify it works with no `content/` directory yet**

Run: `node scripts/build-graph.mjs`
Expected:
```
[content] "/home/artur/life/arterra/content" does not exist yet — returning no content items
[build-graph] wrote 0 nodes, 0 edges to /home/artur/life/arterra/src/lib/graphs/graph.json
```

Run: `cat src/lib/graphs/graph.json`
Expected: `{\n  "nodes": [],\n  "edges": []\n}`

- [ ] **Step 3: Wire it into `dev` and `build`**

In `package.json`, change:

```json
"dev": "vite dev",
"build": "vite build",
```

to:

```json
"dev": "node scripts/build-graph.mjs && vite dev",
"build": "node scripts/build-graph.mjs && vite build",
```

- [ ] **Step 4: Verify the build still succeeds with the new wiring**

Run: `BASE_PATH=/arterra pnpm build`
Expected: the `[build-graph] wrote 0 nodes, 0 edges` line appears before the Vite build output, and the build still ends with `✔ done`.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-graph.mjs package.json src/lib/graphs/graph.json
git commit -m "regenerate graph.json from content/ automatically on dev/build"
```

---

### Task 10: Design tokens

**Files:**
- Create: `src/lib/design/tokens.css`
- Create: `src/lib/design/sections.js`
- Modify: `src/app.html` (theme-init script)
- Modify: `src/app.css` (import tokens)

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties (`--space-*`, `--text-*`, `--radius-*`, `--color-*`, `--accent-*`) consumed by every component from this task onward. `SECTION_META`, `DISCIPLINE_META`, `itemPath(item)` from `sections.js` — consumed by Header (Task 13), and by cards/GraphView in later phases.

- [ ] **Step 1: Create the tokens stylesheet**

Create `src/lib/design/tokens.css`:

```css
:root {
	--font-display: 'Fraunces', Georgia, serif;
	--font-body: 'Roboto', sans-serif;
	--font-mono: 'Fira Mono', monospace;

	--space-1: 0.25rem;
	--space-2: 0.5rem;
	--space-3: 0.75rem;
	--space-4: 1rem;
	--space-5: 1.5rem;
	--space-6: 2rem;
	--space-7: 3rem;
	--space-8: 4rem;

	--radius-sm: 0.25rem;
	--radius-md: 0.5rem;
	--radius-lg: 1rem;

	--text-xs: 0.75rem;
	--text-sm: 0.875rem;
	--text-base: 1rem;
	--text-lg: 1.25rem;
	--text-xl: 1.563rem;
	--text-2xl: 1.953rem;
	--text-3xl: 2.441rem;
	--text-4xl: 3.052rem;
	--text-5xl: 3.815rem;

	--accent-projects: #009688;
	--accent-diy: #f2a93b;
	--accent-sport: #e05353;
	--accent: var(--accent-projects);
}

:root[data-theme='dark'] {
	--color-bg: #263238;
	--color-bg-raised: #32424a;
	--color-text: #b0bec5;
	--color-text-muted: #90a4ae;
	--color-heading: #eceff1;
	--color-border: #425b67;
}

:root[data-theme='light'] {
	--color-bg: #f7f5f2;
	--color-bg-raised: #ffffff;
	--color-text: #33424a;
	--color-text-muted: #5b6b73;
	--color-heading: #1e272c;
	--color-border: #d8dee1;
}

[data-section='projects'] {
	--accent: var(--accent-projects);
}
[data-section='diy'] {
	--accent: var(--accent-diy);
}
[data-section='sport'] {
	--accent: var(--accent-sport);
}
```

- [ ] **Step 2: Create the section/discipline metadata module**

Create `src/lib/design/sections.js`:

```js
/** @typedef {import('../content/types.js').Section} Section */
/** @typedef {import('../content/types.js').Discipline} Discipline */

/** @type {Record<Section, { label: string, accent: string, path: string }>} */
export const SECTION_META = {
	projects: { label: 'Projects', accent: 'var(--accent-projects)', path: '/projects' },
	diy: { label: 'DIY', accent: 'var(--accent-diy)', path: '/diy' },
	sport: { label: 'Sport', accent: 'var(--accent-sport)', path: '/sport' }
};

/** @type {Record<Discipline, { label: string, icon: string, path: string }>} */
export const DISCIPLINE_META = {
	hiking: { label: 'Hiking', icon: '🥾', path: '/sport/hiking' },
	boxing: { label: 'Boxing', icon: '🥊', path: '/sport/boxing' },
	diving: { label: 'Diving', icon: '🤿', path: '/sport/diving' },
	'table-tennis': { label: 'Table Tennis', icon: '🏓', path: '/sport/table-tennis' }
};

/**
 * Site-relative path (without the SvelteKit base) for a content item's detail page.
 * @param {import('../content/types.js').ContentItem} item
 * @returns {string}
 */
export function itemPath(item) {
	const sectionPath =
		item.section === 'sport' && item.discipline
			? DISCIPLINE_META[item.discipline].path
			: SECTION_META[item.section].path;
	return `${sectionPath}/${item.slug}`;
}
```

- [ ] **Step 3: Write a test for `itemPath`**

Create `src/lib/design/sections.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { itemPath } from './sections.js';

describe('itemPath', () => {
	it('builds a top-level section path for a project', () => {
		expect(itemPath({ section: 'projects', slug: 'printerra' })).toBe('/projects/printerra');
	});

	it('builds a discipline sub-path for a sport item', () => {
		expect(itemPath({ section: 'sport', discipline: 'hiking', slug: '2026-06-14-rax' })).toBe(
			'/sport/hiking/2026-06-14-rax'
		);
	});
});
```

Run: `pnpm test -- sections.test`
Expected: `Test Files  1 passed (1)`, `Tests  2 passed (2)`.

- [ ] **Step 4: Wire the theme-init script into `app.html`**

Replace the full contents of `src/app.html`:

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<script>
			(function () {
				var stored = localStorage.getItem('arterra-theme');
				var theme =
					stored === 'light' || stored === 'dark'
						? stored
						: window.matchMedia('(prefers-color-scheme: light)').matches
							? 'light'
							: 'dark';
				document.documentElement.setAttribute('data-theme', theme);
			})();
		</script>
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
```

- [ ] **Step 5: Import the tokens and the new display font into `app.css`**

At the top of `src/app.css`, change:

```css
@import '@fontsource/fira-mono';
```

to:

```css
@import '@fontsource/fira-mono';
@import '@fontsource/fraunces';
@import './lib/design/tokens.css';
```

- [ ] **Step 6: Verify**

Run: `BASE_PATH=/arterra pnpm build`
Expected: build still succeeds (tokens/font imports don't affect the still-untouched pages' rendering, but shouldn't break the build).

- [ ] **Step 7: Commit**

```bash
git add src/lib/design/tokens.css src/lib/design/sections.js src/lib/design/sections.test.js src/app.html src/app.css
git commit -m "add design tokens, section/discipline metadata, and theme-init script"
```

---

### Task 11: Icon components

**Files:**
- Create: `src/lib/icons/GithubIcon.svelte`
- Create: `src/lib/icons/LinkedinIcon.svelte`
- Create: `src/lib/icons/EnvelopeIcon.svelte`
- Create: `src/lib/icons/TelegramIcon.svelte`
- Create: `src/lib/icons/SunIcon.svelte`
- Create: `src/lib/icons/MoonIcon.svelte`

**Interfaces:**
- Consumes: nothing.
- Produces: six Svelte components, each accepting an optional `class` prop (Svelte 5 `$props()` syntax), rendering a `<svg>`. Consumed by Header (Task 13), Footer (Task 14), ThemeToggle (Task 12).

- [ ] **Step 1: Create the icon components**

Create `src/lib/icons/GithubIcon.svelte`:

```svelte
<script>
	let { class: className = '' } = $props();
</script>

<svg viewBox="0 0 24 24" fill="currentColor" class={className} aria-hidden="true">
	<path
		d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.77.12 3.06.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.4-5.27 5.68.42.36.78 1.08.78 2.18 0 1.57-.01 2.84-.01 3.23 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12c0-6.27-5.23-11.5-11.5-11.5Z"
	/>
</svg>
```

Create `src/lib/icons/LinkedinIcon.svelte`:

```svelte
<script>
	let { class: className = '' } = $props();
</script>

<svg viewBox="0 0 24 24" fill="currentColor" class={className} aria-hidden="true">
	<path
		d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45Z"
	/>
</svg>
```

Create `src/lib/icons/EnvelopeIcon.svelte`:

```svelte
<script>
	let { class: className = '' } = $props();
</script>

<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class={className} aria-hidden="true">
	<rect x="2.5" y="4.5" width="19" height="15" rx="2" />
	<path d="m3 6 9 6.5L21 6" stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

Create `src/lib/icons/TelegramIcon.svelte`:

```svelte
<script>
	let { class: className = '' } = $props();
</script>

<svg viewBox="0 0 24 24" fill="currentColor" class={className} aria-hidden="true">
	<path
		d="M21.5 3.5 2.7 10.9c-1.1.44-1.09 1.05-.2 1.32l4.8 1.5 1.85 5.63c.23.63.4.88.82.88.35 0 .5-.16.7-.35l1.85-1.8 4.83 3.57c.79.44 1.35.21 1.55-.73l3.1-14.6c.28-1.13-.44-1.64-1.5-1.13Zm-2.9 3.4-8.86 8-.36 3.7-1.74-5.28 10.4-6.7c.49-.3.94.13.56.28Z"
	/>
</svg>
```

Create `src/lib/icons/SunIcon.svelte`:

```svelte
<script>
	let { class: className = '' } = $props();
</script>

<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class={className} aria-hidden="true">
	<circle cx="12" cy="12" r="4.5" />
	<path
		stroke-linecap="round"
		d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"
	/>
</svg>
```

Create `src/lib/icons/MoonIcon.svelte`:

```svelte
<script>
	let { class: className = '' } = $props();
</script>

<svg viewBox="0 0 24 24" fill="currentColor" class={className} aria-hidden="true">
	<path d="M20.5 14.6a8.6 8.6 0 0 1-10.9-10.9 9 9 0 1 0 10.9 10.9Z" />
</svg>
```

- [ ] **Step 2: Verify the components compile**

Run: `BASE_PATH=/arterra pnpm build`
Expected: build succeeds (these components aren't imported anywhere yet, so this just confirms no syntax errors via `svelte-check` if you also run it).

Run: `pnpm run check`
Expected: no new errors attributable to `src/lib/icons/*.svelte`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/icons
git commit -m "add hand-rolled inline SVG icon components"
```

---

### Task 12: ThemeToggle component

**Files:**
- Create: `src/lib/components/ui/ThemeToggle.svelte`

**Interfaces:**
- Consumes: `SunIcon`, `MoonIcon` from `$lib/icons/*.svelte` (Task 11); reads/writes `data-theme` on `<html>` and `localStorage['arterra-theme']` (contract established by Task 10's `app.html` script).
- Produces: `<ThemeToggle />`, a self-contained button — consumed by Header (Task 13).

- [ ] **Step 1: Create the component**

Create `src/lib/components/ui/ThemeToggle.svelte`:

```svelte
<script>
	import { onMount } from 'svelte';
	import SunIcon from '$lib/icons/SunIcon.svelte';
	import MoonIcon from '$lib/icons/MoonIcon.svelte';

	let theme = $state('dark');

	onMount(() => {
		theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
	});

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('arterra-theme', theme);
	}
</script>

<button
	type="button"
	class="theme-toggle"
	onclick={toggle}
	aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
>
	{#if theme === 'dark'}
		<SunIcon class="icon" />
	{:else}
		<MoonIcon class="icon" />
	{/if}
</button>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		color: var(--color-text);
		cursor: pointer;
		border-radius: var(--radius-sm);
	}
	.theme-toggle:hover,
	.theme-toggle:focus-visible {
		color: var(--color-heading);
	}
	.theme-toggle :global(.icon) {
		width: 1.1rem;
		height: 1.1rem;
	}
</style>
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm run check`
Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/ui/ThemeToggle.svelte
git commit -m "add dark/light ThemeToggle component"
```

---

### Task 13: Header/Nav rewrite

**Files:**
- Create: `src/lib/components/layout/Header.svelte`
- Delete: `src/components/Header.svelte`
- Delete: `src/lib/images/github.svg` (only importer was the old Header, which used a raw image instead of the icon set added in Task 11)

**Interfaces:**
- Consumes: `SECTION_META` from `$lib/design/sections.js` (Task 10); `ThemeToggle` (Task 12); `GithubIcon`/`LinkedinIcon`/`EnvelopeIcon`/`TelegramIcon` (Task 11).
- Produces: `<Header />` — consumed by `+layout.svelte` (Task 15).

- [ ] **Step 1: Create the new Header**

Create `src/lib/components/layout/Header.svelte`:

```svelte
<script>
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { SECTION_META } from '$lib/design/sections.js';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import GithubIcon from '$lib/icons/GithubIcon.svelte';
	import LinkedinIcon from '$lib/icons/LinkedinIcon.svelte';
	import EnvelopeIcon from '$lib/icons/EnvelopeIcon.svelte';
	import TelegramIcon from '$lib/icons/TelegramIcon.svelte';

	const navItems = [
		{ href: `${base}/`, label: 'Home' },
		{ href: `${base}${SECTION_META.projects.path}`, label: 'Projects' },
		{ href: `${base}${SECTION_META.diy.path}`, label: 'DIY' },
		{ href: `${base}${SECTION_META.sport.path}`, label: 'Sport' },
		{ href: `${base}/about`, label: 'About' },
		{ href: `${base}/contact`, label: 'Contact' },
		{ href: `${base}/graph`, label: 'Graph' }
	];

	let pathname = $derived($page.url.pathname);
</script>

<header class="site-header">
	<nav aria-label="Primary">
		<a class="brand" href="{base}/">Artur Sogomonyan</a>
		<ul>
			{#each navItems as item (item.href)}
				<li aria-current={pathname === item.href ? 'page' : undefined}>
					<a href={item.href}>{item.label}</a>
				</li>
			{/each}
		</ul>
		<div class="header-actions">
			<a href="mailto:arthur.sogomonyan@gmail.com" aria-label="Email"><EnvelopeIcon class="icon" /></a>
			<a href="https://t.me/arterrai" target="_blank" rel="noreferrer" aria-label="Telegram">
				<TelegramIcon class="icon" />
			</a>
			<a href="https://linkedin.com/in/artur-sogomonyan" target="_blank" rel="noreferrer" aria-label="LinkedIn">
				<LinkedinIcon class="icon" />
			</a>
			<a href="https://github.com/PropovedNik007" target="_blank" rel="noreferrer" aria-label="GitHub">
				<GithubIcon class="icon" />
			</a>
			<ThemeToggle />
		</div>
	</nav>
</header>

<style>
	.site-header {
		width: 100%;
		border-bottom: 1px solid var(--color-border);
		background-color: var(--color-bg);
	}
	nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		flex-wrap: wrap;
	}
	.brand {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		color: var(--color-heading);
		text-decoration: none;
	}
	ul {
		display: flex;
		gap: var(--space-4);
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li a {
		color: var(--color-text);
		text-decoration: none;
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: 0.02em;
		padding-block: var(--space-1);
		border-bottom: 2px solid transparent;
	}
	li[aria-current='page'] a {
		color: var(--color-heading);
		border-bottom-color: var(--accent-projects);
	}
	li a:hover,
	li a:focus-visible {
		color: var(--color-heading);
	}
	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	.header-actions a {
		color: var(--color-text);
		display: inline-flex;
	}
	.header-actions :global(.icon) {
		width: 1.1rem;
		height: 1.1rem;
	}
	a:focus-visible,
	button:focus-visible {
		outline: 2px solid var(--accent-projects);
		outline-offset: 2px;
	}
	@media (max-width: 768px) {
		nav {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
```

- [ ] **Step 2: Delete the old Header and its now-unused image import**

```bash
git rm src/components/Header.svelte src/lib/images/github.svg
```

Run: `grep -rn "lib/images/github" src/` to confirm no other file references it first — expected: no output (only the just-deleted `Header.svelte` ever imported it, confirmed earlier in Task 3's investigation).

- [ ] **Step 3: Verify**

Run: `pnpm run check`
Expected: a new error that `../components/Header.svelte` is imported by `src/routes/+layout.svelte` but no longer exists — this is expected and fixed in Task 15. Confirm the error is exactly that one missing-import error and nothing else new.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/layout/Header.svelte
git commit -m "rewrite Header as a hand-rolled nav with theme toggle and Telegram link"
```

(The `git rm` from Step 2 is staged as part of this same commit.)

(`+layout.svelte` still points at the deleted old Header until Task 15 — the dev server/build will be broken for exactly one task, which is fine since Tasks 13-15 are reviewed together before the phase-end verification in Task 17.)

---

### Task 14: Footer component

**Files:**
- Create: `src/lib/components/layout/Footer.svelte`

**Interfaces:**
- Consumes: `GithubIcon`/`LinkedinIcon`/`EnvelopeIcon`/`TelegramIcon` (Task 11).
- Produces: `<Footer />` — consumed by `+layout.svelte` (Task 15).

- [ ] **Step 1: Create the Footer**

Create `src/lib/components/layout/Footer.svelte`:

```svelte
<script>
	import { base } from '$app/paths';
	import GithubIcon from '$lib/icons/GithubIcon.svelte';
	import LinkedinIcon from '$lib/icons/LinkedinIcon.svelte';
	import EnvelopeIcon from '$lib/icons/EnvelopeIcon.svelte';
	import TelegramIcon from '$lib/icons/TelegramIcon.svelte';

	const year = new Date().getFullYear();
</script>

<footer class="site-footer">
	<p>&copy; {year} Artur Sogomonyan</p>
	<ul>
		<li>
			<a href="mailto:arthur.sogomonyan@gmail.com"><EnvelopeIcon class="icon" /> Email</a>
		</li>
		<li>
			<a href="https://t.me/arterrai" target="_blank" rel="noreferrer"><TelegramIcon class="icon" /> Telegram</a>
		</li>
		<li>
			<a href="https://linkedin.com/in/artur-sogomonyan" target="_blank" rel="noreferrer">
				<LinkedinIcon class="icon" /> LinkedIn
			</a>
		</li>
		<li>
			<a href="https://github.com/PropovedNik007" target="_blank" rel="noreferrer"><GithubIcon class="icon" /> GitHub</a>
		</li>
		<li><a href="{base}/contact">Contact</a></li>
	</ul>
</footer>

<style>
	.site-footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-6) var(--space-5);
		border-top: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li a {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-text-muted);
		text-decoration: none;
	}
	li a:hover,
	li a:focus-visible {
		color: var(--color-heading);
	}
	:global(.icon) {
		width: 1rem;
		height: 1rem;
	}
</style>
```

- [ ] **Step 2: Verify**

Run: `pnpm run check`
Expected: no new errors from this file (it isn't imported yet — that's Task 15).

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/layout/Footer.svelte
git commit -m "add hand-rolled Footer with Telegram link"
```

---

### Task 15: Wire `+layout.svelte`

**Files:**
- Modify: `src/routes/+layout.svelte`

**Interfaces:**
- Consumes: `Header` (Task 13), `Footer` (Task 14).
- Produces: every route now renders through the new chrome; this is the task that makes the dev server/build green again after Task 13's expected breakage.

- [ ] **Step 1: Replace `+layout.svelte`**

Replace the full contents of `src/routes/+layout.svelte`:

```svelte
<script>
	import '../app.css';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';

	let { children } = $props();
</script>

<div class="app">
	<Header />
	<main>
		{@render children()}
	</main>
	<Footer />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
	main {
		flex: 1;
	}
</style>
```

- [ ] **Step 2: Verify the build and dev server are green again**

Run: `pnpm run check`
Expected: no errors about missing `Header`/`Footer` imports (there may still be pre-existing, unrelated warnings from untouched pages — those are out of scope for this phase).

```bash
BASE_PATH=/arterra pnpm build
```

Expected: `✔ done`.

```bash
pnpm dev &
sleep 4
for path in / /projects /about /contact; do
  curl -s -o /dev/null -w "$path: %{http_code}\n" "http://localhost:5173$path"
done
kill %1
```

Expected: every path prints `200`.

- [ ] **Step 3: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "wire new Header/Footer into the root layout"
```

---

### Task 16: Migrate real seed content into `content/`

**Files:**
- Create: `content/projects/*.md` (12 files, copied from the vault)
- Create: `content/diy/2026-04-miniature-batch.md`
- Create: `content/sport/hiking/2026-06-14-rax.md`
- Create: `content/sport/boxing/2026-05-first-sparring.md`
- Create: `content/sport/diving/.gitkeep`
- Create: `content/sport/table-tennis/.gitkeep`
- Create, then delete: `scripts/migrate-seed-content.mjs` (one-time migration tool, not part of the ongoing build)

**Interfaces:**
- Consumes: `gray-matter`'s `matter`/`matter.stringify`; the vault notes updated in Tasks 1-2.
- Produces: real content for `loadContent()` (Task 7) and `build-graph.mjs` (Task 9) to pick up.

- [ ] **Step 1: Confirm the sibling vault checkout is where expected**

Run: `ls ../arterria/70-portfolio/projects/*.md | wc -l`
Expected: `12`

- [ ] **Step 2: Write the one-time migration script**

Create `scripts/migrate-seed-content.mjs`:

```js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const VAULT = '../arterria';
const STRIP_KEYS = ['area', 'status', 'visibility'];

function migrate(srcPath, destPath) {
	const raw = readFileSync(srcPath, 'utf8');
	const { data, content } = matter(raw);
	for (const key of STRIP_KEYS) delete data[key];
	writeFileSync(destPath, matter.stringify(content, data));
	console.log(`migrated ${srcPath} -> ${destPath}`);
}

mkdirSync('content/projects', { recursive: true });
mkdirSync('content/diy', { recursive: true });
mkdirSync('content/sport/hiking', { recursive: true });
mkdirSync('content/sport/boxing', { recursive: true });
mkdirSync('content/sport/diving', { recursive: true });
mkdirSync('content/sport/table-tennis', { recursive: true });

const projectSlugs = [
	'aim-hackathon-greenwashing-rag',
	'cryptex',
	'davu-ocr',
	'glosav',
	'lawsyncr',
	'printerra',
	'rail4future',
	'red-cross-lip-reading',
	'reelmate',
	'susteam',
	'tourism-knowledge-graph',
	'tradebot'
];

for (const slug of projectSlugs) {
	migrate(join(VAULT, '70-portfolio/projects', `${slug}.md`), join('content/projects', `${slug}.md`));
}

migrate(join(VAULT, '20-areas/hiking/trips/2026-06-14-rax.md'), 'content/sport/hiking/2026-06-14-rax.md');
migrate(
	join(VAULT, '20-areas/health/boxing/2026-05-first-sparring.md'),
	'content/sport/boxing/2026-05-first-sparring.md'
);
migrate(
	join(VAULT, '20-areas/hobbies/3d-printing/2026-04-miniature-batch.md'),
	'content/diy/2026-04-miniature-batch.md'
);

writeFileSync('content/sport/diving/.gitkeep', '');
writeFileSync('content/sport/table-tennis/.gitkeep', '');

console.log('migration complete');
```

- [ ] **Step 3: Run it**

Run: `node scripts/migrate-seed-content.mjs`
Expected: 15 `migrated ...` lines (12 projects + hiking + boxing + diy) followed by `migration complete`.

- [ ] **Step 4: Verify the loader and graph pick up the real content**

Run: `node scripts/build-graph.mjs`
Expected: `[build-graph] wrote 15 nodes, N edges to .../src/lib/graphs/graph.json` (15 = 12 projects + 1 diy + 1 hiking + 1 boxing; N depends on shared tags/links, any N ≥ 0 is fine — just confirm it's no longer `0 nodes`).

Run: `cat src/lib/graphs/graph.json | head -20`
Expected: real node entries with `"section": "projects"` / `"diy"` / `"sport"`, and `"discipline"` present on the two sport nodes.

- [ ] **Step 5: Delete the one-time migration script**

```bash
rm scripts/migrate-seed-content.mjs
```

- [ ] **Step 6: Commit**

```bash
git add content src/lib/graphs/graph.json
git commit -m "migrate vault seed content (projects, diy, hiking, boxing) into content/"
```

---

### Task 17: Final phase verification

**Files:** none (verification only).

**Interfaces:** none — this task confirms every prior task's produced interface actually works end to end.

- [ ] **Step 1: Full clean install and test run**

```bash
cd /home/artur/life/arterra
rm -rf node_modules .svelte-kit build
pnpm install
pnpm test
```

Expected: all vitest suites pass (`types.test.js`, `markdown.test.js`, `load.test.js`, `build.test.js`, `sections.test.js`).

- [ ] **Step 2: Type check**

Run: `pnpm run check`
Expected: no errors. (Pre-existing warnings in untouched files like `Cv.svelte`/`Projects.svelte` are acceptable — they're rewritten in later phases. Any error inside `src/lib/**` or `src/routes/+layout.svelte` must be fixed before this task is considered done.)

- [ ] **Step 3: Production build with the real base path**

```bash
BASE_PATH=/arterra pnpm build
```

Expected: `[build-graph] wrote 15 nodes, ...`, then a successful Vite build, then `Using @sveltejs/adapter-static`, `Wrote site to "build"`, `✔ done`.

- [ ] **Step 4: Manual route/asset check against the built output**

```bash
pnpm preview &
sleep 4
for path in /arterra/ /arterra/projects /arterra/about /arterra/contact; do
  curl -s -o /dev/null -w "$path: %{http_code}\n" "http://localhost:4173$path"
done
kill %1
```

Expected: every path prints `200`. (`pnpm preview` serves the `build/` output; confirm it also serves under the `/arterra` base path, matching production.)

- [ ] **Step 5: Visual check in a browser**

Run `pnpm dev`, open the site, and confirm:
- New header/footer render with working nav links (Home/Projects/DIY/Sport/About/Contact/Graph), Telegram/Email/LinkedIn/GitHub icon links, and a working theme toggle that persists across reloads.
- Projects/About/Contact/Home pages still render exactly as before (old flowbite-based content, untouched) — no visual regression from the Svelte 5 upgrade.
- No console errors.

- [ ] **Step 6: Report to Artur and stop**

This is the phase (a) checkpoint. Summarize what changed, flag anything unexpected found during execution, and wait for sign-off before Phase (b)'s plan is written (Projects + About/CV — including the Flexam/aein.ai current-role copy Artur still owes, per the design spec's open item).
