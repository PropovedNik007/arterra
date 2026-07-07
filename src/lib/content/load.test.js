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
