# Portfolio repository rules

This repository is Artur Sogomonyan's public, English-only portfolio. It is a
static SvelteKit site deployed under `/arterra` on GitHub Pages. `AGENTS.md` and
`CLAUDE.md` intentionally carry the same guidance so every coding agent follows
the same public-content boundary.

## Public-content boundary

- `content/` is a public projection of the private sibling Life OS, never a
  place to copy private vault material wholesale.
- Only publish notes explicitly approved for a public `section`: `projects`,
  `diy`, or `sport`. Sport notes also require `discipline`: `hiking`, `boxing`,
  `diving`, or `table-tennis`.
- Never expose private links, attachments, people data, finances, health data,
  memories, client identities, or confidential work in this public repository,
  generated output, metadata, graph, or source comments.
- The public website is English-only.

## Site architecture

- `content/**/*.md` is loaded at build time by `src/lib/content/load.js`.
- `scripts/build-graph.mjs` regenerates `src/lib/graphs/graph.json`; do not edit
  the generated JSON by hand.
- Project, DIY, and sport detail pages must be prerenderable. Do not add
  runtime filesystem APIs or server-only endpoints to serve Markdown.
- Use `$app/paths` (`base`) for route and static-asset URLs so local development
  and the GitHub Pages `/arterra` base path both work.
- The current primary design is dark-only. `/retro` preserves the older
  starfield portfolio identity.

## Design and quality

- Keep page chrome aligned to the shared `.shell` width.
- Use semantic headings, meaningful breadcrumb labels, keyboard focus states,
  and honest empty states. Do not ship placeholder claims or fabricated notes.
- Prefer shared design tokens and reusable components over route-specific
  magic values or third-party UI kits.
- Keep the graph stable and comprehensible: section hubs, explicit links, and
  restrained shared-topic edges; avoid random layouts and forced label clutter.

## Verification

Before declaring a change complete, run:

```bash
npm run test
npm run check
npm run lint
BASE_PATH=/arterra npm run build
npm audit
```

Visually check every public route at desktop and mobile widths, including one
content detail page, all empty states, the graph, and `/retro`.

## Git

Keep commits small and descriptive, never force-push, and do not commit secrets
or private Life OS attachments.
