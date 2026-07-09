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
