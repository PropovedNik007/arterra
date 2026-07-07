# Arterra Redesign — Design Spec

Date: 2026-07-07
Status: Approved by Artur, moving to implementation planning.

## 1. Context

`arterra` is Artur's public site (`propovednik007.github.io/arterra/`), currently a
single CV-style page (SvelteKit 2 + `adapter-static`, deployed to GitHub Pages).
It visualizes an Obsidian vault as a knowledge graph (graphology + sigma), but the
vault is a stale copy pasted into this repo (`arterra_vault/`) and the graph is
built by a script (`parseVault.js`) that isn't run in CI.

`arterria` (sibling private repo) is Artur's Life OS — a PARA-structured Obsidian
vault that is the single source of truth for his whole life. It already contains
seed notes tagged `visibility: public` + `section: projects|3d-printing|hiking|boxing`
matching the four channels this redesign introduces. The vault's own export script
(`scripts/build-public-site.sh`) that will sync public notes into this repo's
`content/` directory is **out of scope** here — Artur owns that separately. This
redesign only needs to consume whatever lands in `content/<section>/*.md`.

## 2. Current-state findings (why parts of this are also a fix, not just a redesign)

- Project list comes from `arterra_vault/` (a copy of the old vault) parsed by a
  manually-run `parseVault.js` into `src/lib/graphs/graph.json`. Not part of the
  build — the committed `graph.json` can silently go stale.
- Project detail pages (`/projects/[id]`) fetch raw markdown from a `+server.js`
  API route that reads the filesystem **at request time**. This cannot work on a
  static export; in production it silently falls back to a "coming soon" message.
- CV content is duplicated (hardcoded) in `Cv.svelte` and inline in the home page's
  "Work Experience" tab, and is stale — it lists `CTO, Data Scientist @ susteam` as
  the current role, but Artur's real current roles (per `arterria/30-work/`) are
  **Flexam** and **aein.ai**, both currently private stub notes with no public copy.
- Project images are duplicated across `static/images/projects/`,
  `src/lib/images/projects/`, and `arterra_vault/imgs/`.
- The vault's actual seed notes don't have `title:`/`cover:` frontmatter as
  Artur's redesign brief assumed — title comes from the note's H1, date from
  `created:`. The site's content loader must bridge this gap without requiring
  vault-side changes now.

## 3. Decisions (confirmed with Artur)

| Decision | Choice |
|---|---|
| Framework | Stay on SvelteKit 2 + `adapter-static` (already correct) |
| Svelte version | Upgrade 4 → 5 (runes), since most components are rewritten anyway |
| Hiking GPX | Render an interactive map (Leaflet + `leaflet-gpx`), not just stats+link |
| Seed content | Migrate the vault's real seed notes into `content/` now, for real dev/test data |
| UI kit | Drop `flowbite-svelte`/`@smui/*` — hand-rolled Tailwind components for a non-generic look |

## 4. Target dependency changes

**Remove:** `flowbite`, `flowbite-svelte`, `flowbite-svelte-icons`, `@smui/*` (`@smui-extra/accordion`, `@smui/button`, `@smui/icon-button`, `@smui/paper`, `@smui/tab`, `@smui/tab-bar`), `@neoconfetti/svelte`, `mdbsvelte`, `marked`, `markdown-link-extractor`.

**Keep:** `graphology`, `graphology-layout-force`, `graphology-layout-forceatlas2`, `sigma`, `@sigma/edge-curve`, `chroma-js`, `gray-matter`, `chart.js`, `svelte-chartjs`, `gsap`, `fs-extra`, `@fontsource/fira-mono`.

**Add:** `svelte@^5`, `unified`, `remark-parse`, `remark-gfm`, `remark-rehype`, `rehype-highlight`, `rehype-slug`, `rehype-stringify`, `leaflet`, `leaflet-gpx`, `@fontsource/fraunces`.

## 5. Directory structure (target)

```
content/
  projects/*.md
  3d-printing/*.md
  hiking/*.md
  boxing/*.md
static/
  images/{projects,3d-printing,hiking,boxing}/*
  favicon.ico, favicon.png, profile.png, robots.txt
scripts/
  build-graph.mjs           # regenerates src/lib/graphs/graph.json from content/, run as part of `pnpm build`
src/
  lib/
    content/
      types.ts              # ContentItem, section enums, per-section extra fields
      load.ts                # import.meta.glob loader + gray-matter + markdown pipeline
      markdown.ts            # unified/remark/rehype pipeline (md -> html + extracted links/headings)
      cv.ts                  # structured resume data (education, experience, skills, awards, publications)
    graph/
      build.ts               # content items -> {nodes, edges} (link edges + tag-similarity edges)
      GraphView.svelte        # generalized sigma wrapper (accepts sectionFilter, colors by section)
    design/
      tokens.css             # colors, type scale, spacing, radius, per-section accent vars
      sections.ts             # section -> accent color / label / icon map (single source for tokens+graph+cards)
    components/
      ui/                    # Button, Card, Badge, Tag, Breadcrumb, ThemeToggle, TelegramCallout
      layout/                # Header, Footer, Nav
      cv/                    # Timeline, CurrentRoleCard, SkillsRadar, Awards, Publications
      cards/                 # ProjectCard, PrintCard, HikeCard, BoxingCard (share a base Card)
    icons/                   # hand-rolled inline SVG icon components
  routes/
    +layout.svelte, +layout.ts        # theme init, header/footer
    +page.svelte                       # Home
    projects/(+page.svelte,+page.ts) [slug]/+page.svelte
    3d-printing/... (same pattern)
    hiking/...      (same pattern; detail page embeds GraphView-free Leaflet map)
    boxing/...       (same pattern; index has pinned Unity Fight Club callout)
    about/+page.svelte
    contact/+page.svelte
    graph/+page.svelte
    sitemap.xml/+server.ts
    rss/[section].xml/+server.ts
```

**Deleted:** `arterra_vault/`, `src/routes/api/`, `parseVault.js`, `src/lib/images/` (dupes consolidated into `static/images/`).

## 6. Content model & loader

Normalized shape every section maps into:

```ts
type ContentItem = {
  slug: string;            // filename minus extension
  section: 'projects' | '3d-printing' | 'hiking' | 'boxing';
  title: string;           // frontmatter.title ?? first H1 in body
  date: string;            // frontmatter.date ?? frontmatter.created
  updated?: string;
  tags: string[];
  cover?: string;           // frontmatter.cover, optional
  excerpt: string;          // frontmatter.description ?? first paragraph
  html: string;             // rendered body (unified pipeline)
  links: string[];          // resolved slugs this note links to (for the graph)
  // section-specific, all optional (gracefully omitted in UI if absent):
  tech?: string[];          // projects (falls back to `tags`)
  externalLink?: string;    // projects — if present, card CTA opens it instead of the detail page
  distance_km?: number; gain_m?: number; region?: string; gpx?: string; led_group?: boolean; // hiking
  printer?: string; material?: string;  // 3d-printing
};
```

Loaded via `import.meta.glob('/content/**/*.md', { query: '?raw', import: 'default', eager: true })` in `src/lib/content/load.ts` — pure build-time, no server needed, compatible with prerendering. Files with `visibility: private` are skipped with a `console.warn` at build time (defense in depth; `content/` should only ever contain already-public exports).

Markdown pipeline (`src/lib/content/markdown.ts`): `remark-parse` → `remark-gfm` → `remark-rehype` → `rehype-slug` → `rehype-highlight` → `rehype-stringify`. Internal links are extracted from the mdast tree before the html conversion (matching both `[[Wikilink]]` and `[text](slug)` forms), resolved against known slugs, unresolved links are dropped silently (build warning only in verbose mode).

## 7. Design system

- **Base palette**: keep the existing dark blue-grey identity (`#263238`/`#607D8B`/`#425B67` family) as the dark theme; add a light-theme pair with equivalent contrast ratios (WCAG AA minimum).
- **Section accents** (`src/lib/design/sections.ts`, applied via `data-section="..."` on each section's layout wrapper):
  - Projects — teal `#009688` (continuity with the existing project-node color)
  - 3D Printing — amber `#F2A93B`
  - Hiking — green `#4CAF50`
  - Boxing — red `#E05353`
- **Type scale**: Fraunces (display/headings, self-hosted via `@fontsource/fraunces`) + existing body sans; Fira Mono retained for code blocks.
- **Tokens**: CSS custom properties for spacing (`--space-1`…`--space-8`), radius, and a modular type scale, defined once in `tokens.css` and consumed everywhere — no per-component magic numbers.
- **Dark/light mode**: `data-theme` attribute on `<html>`, initialized from `localStorage` else `prefers-color-scheme`, toggled by a `ThemeToggle` component; inline blocking script in `app.html` to avoid flash-of-wrong-theme.
- Accessible focus states and keyboard nav are a baseline requirement for every new interactive component (cards, nav, toggle, tag filters).

## 8. Graph

- `scripts/build-graph.mjs` runs as a `prebuild` step (wired into `pnpm build`) — loads all content, builds `{nodes, edges}` via `src/lib/graph/build.ts`, writes `src/lib/graphs/graph.json`. No more manual `node parseVault.js`.
- Edges: explicit resolved links between notes (`links[]` from the content loader), plus a lighter-weight "shares a tag" edge layer (visually thinner/dashed) so sparse early sections (currently one note each) aren't isolated dots.
- `GraphView.svelte` (generalized from today's `Graph.svelte`): accepts `graphData` + optional `sectionFilter`; node color resolved from `sections.ts`; click → `goto('${base}/${section}/${slug}')`. Same dynamic-import-in-`onMount` pattern as today (sigma/graphology client-only).
- `/graph` route: full graph, all sections, legend mapping color → section.
- Each section index page embeds a `GraphView` pre-filtered to that section, above or beside the card grid.

## 9. Section pages

Shared `Card` base + section-specific card variants, all image-forward (lazy-loaded cover, `loading="lazy" decoding="async"`):

- **Projects**: tech chips (from `tech` or `tags`); if `externalLink` present, the card's primary CTA opens it in a new tab instead of linking to the detail page (preserves current behavior for projects with live demos).
- **3D Printing**: printer/material badges when present, otherwise omitted cleanly (vault's current seed notes don't have these fields yet).
- **Hiking**: distance/elevation/region badge row on the card; detail page adds an embedded Leaflet map (`leaflet-gpx`, dynamically imported client-only) rendering the linked `.gpx`, plus a guided-hike badge when `led_group: true`.
- **Boxing**: a pinned callout card above the grid — "Unity Fight Club" with a short description and a link to `https://unity-fight.club/feed`, visually distinct (bordered/accent, not just another grid card).

Every index page: sort by date (desc, default), client-side tag filter (plain array filter over already-loaded prerendered data — no server needed).

## 10. Home page

Hero (keep the gsap particle canvas, re-skinned to new tokens) + short intro, a cross-section "highlights" strip (e.g. latest item per section, or a curated pick), and a small "Follow on Telegram" callout (`t.me/arterrai`) — link/badge only, no live embed. The callout component accepts an optional `posts` prop for a future real feed, defaulting to the simple link-badge state when absent.

## 11. About / CV

- `src/lib/content/cv.ts`: structured data (not markdown — this is site-owned resume data, not a vault export), typed as `{ education: [], experience: [], skills: {}, awards: [], publications: [] }`.
- `experience` entries carry `current: boolean`. **Flexam and aein.ai each get their own entry with `current: true`**, rendered as two distinct timeline cards (each with a "Current" badge) rather than merged — copy (title/dates/bullets) to be supplied by Artur before this phase ships.
- Skills radar (chart.js) retained, re-skinned to new tokens. Skills lists become chip groups. Awards/publications migrated verbatim from the current `Cv.svelte`.
- CV PDF download button stays pointed at the existing external URL (`github.com/PropovedNik007/cv`).

## 12. Telegram

- Footer: new Telegram icon link next to Email/LinkedIn/GitHub → `https://t.me/arterrai`.
- Contact page: Telegram added as a primary contact method card.
- Home page: the callout described in §10.
- No live feed integration in this pass — explicitly deferred.

## 13. SEO / CI/CD

- Reusable per-page `<svelte:head>` pattern (title, description, canonical, OG tags, `twitter:card`), image falling back to a default when a page/item has no cover.
- `sitemap.xml` and `rss/[section].xml` as prerendered `+server.ts` endpoints, generated from the same content loader.
- `robots.txt` updated to reference the sitemap.
- CI (`deploy.yml`) unchanged in shape (checkout → pnpm install → `pnpm build` with `BASE_PATH=/arterra` → deploy to `gh-pages` via `peaceiris/actions-gh-pages`), except `pnpm build` now regenerates the graph itself — no separate manual step required before or during CI.

## 14. Migration steps (one-time, not ongoing)

1. Copy vault's real public notes into `content/`:
   - `arterria/70-portfolio/projects/*.md` → `content/projects/*.md`
   - `arterria/20-areas/hiking/trips/2026-06-14-rax.md` → `content/hiking/2026-06-14-rax.md`
   - `arterria/20-areas/health/boxing/2026-05-first-sparring.md` → `content/boxing/2026-05-first-sparring.md`
   - `arterria/20-areas/hobbies/3d-printing/2026-04-miniature-batch.md` → `content/3d-printing/2026-04-miniature-batch.md`
   - Strip vault-private frontmatter fields on copy (`area`, `status`, `visibility` — keep `type`, `section`, `created`/`updated`, `tags`, and type-specific fields).
2. Consolidate images: move `static/images/projects/*` (already there) and `arterra_vault/imgs/*` (dedupe against existing) into `static/images/projects/`; drop `src/lib/images/`.
3. Delete `arterra_vault/`, `src/routes/api/`, `parseVault.js`.

## 15. Implementation phases

Mirrors Artur's requested phases; each ends with `pnpm dev`, a manual route/asset check, and a check-in before continuing.

- **(a) Scaffold** — dependency swap (incl. Svelte 5 upgrade), design tokens, layout/header/footer/nav (theme toggle, Telegram link), content loader + markdown pipeline, migrate seed content into `content/`, delete dead code.
- **(b) Projects + About/CV** — project index/detail off the new loader, About page rebuilt on structured CV data (placeholder copy for Flexam/aein.ai pending Artur's text), CV PDF link retained.
- **(c) 3D Printing, Hiking, Boxing** — index + detail for each, incl. Leaflet/GPX map and the Unity Fight Club callout.
- **(d) Graph rebuild** — build-time graph generation, `/graph`, per-section mini graphs.
- **(e) Home + SEO + CI** — Home page assembly (needs highlights from all sections, so it lands last), OG/sitemap/RSS, CI script fix, final base-path audit.

## 16. Open item requiring Artur before phase (b) ships

Copy (title, org, dates, 2-3 bullets each) for the two current roles: **Flexam** and **aein.ai**.
