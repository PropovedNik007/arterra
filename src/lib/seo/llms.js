/**
 * Pure builder for `/llms.txt` (https://llmstxt.org): a plain Markdown map of
 * the site for language models and answer engines.
 */

import { cv, cvProjectPath } from '../content/cv.js';
import { CITY, COUNTRY, SITE_URL } from './site.js';

/** Public pages with a one-line description each. */
export const LLMS_PAGES = [
	{
		path: '/',
		title: 'Home',
		description:
			'Introduction, selected projects, and entry points to DIY, sport, and the knowledge graph.'
	},
	{
		path: '/about',
		title: 'About',
		description: 'Experience, education, toolkit, languages, awards, and publication.'
	},
	{
		path: '/projects',
		title: 'Projects',
		description:
			'Case studies across applied AI, computer vision, document intelligence, data products, and the interfaces that make them useful.'
	},
	{
		path: '/diy',
		title: 'DIY',
		description: 'Build notes: miniature batches, print settings, and workshop experiments.'
	},
	{
		path: '/sport',
		title: 'Sport',
		description: 'Notes on hiking, boxing, diving, and table tennis.'
	},
	{
		path: '/graph',
		title: 'Knowledge graph',
		description: 'Interactive graph connecting projects, notes, fields of work, and shared topics.'
	},
	{
		path: '/insights',
		title: 'Insights',
		description:
			'Charts of how projects flow through fields of work, a self-assessed skills profile, and public GitHub activity plus anonymised totals from private organisation work.'
	},
	{
		path: '/faq',
		title: 'FAQ',
		description: 'Short, self-contained answers about background, work, CV, and contact.'
	},
	{
		path: '/contact',
		title: 'Contact',
		description: 'Email, Telegram, LinkedIn, and GitHub, plus what to include in a first message.'
	}
];

/**
 * @param {object} input
 * @param {import('../content/faq.js').FaqEntry[]} input.faq
 * @param {import('../content/faq.js').FeaturedProject[]} input.featured
 * @param {string} [input.siteUrl] Absolute site URL without a trailing slash.
 * @returns {string}
 */
export function buildLlmsTxt({ faq, featured, siteUrl = SITE_URL }) {
	/** @param {string} path */
	const url = (path) => (path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`);
	const article = /^[aeiou]/i.test(cv.headline) ? 'an' : 'a';

	const lines = [
		`# ${cv.name}`,
		'',
		`> ${cv.name} is ${article} ${cv.headline} based in ${CITY}, ${COUNTRY}. This is his public portfolio: applied machine learning, computer vision, LLM and RAG systems, and full-stack product work, plus DIY build notes and sport notes.`,
		'',
		'## Pages',
		'',
		...LLMS_PAGES.map((page) => `- [${page.title}](${url(page.path)}): ${page.description}`),
		`- [CV (PDF)](${cv.pdf.href}): ${cv.name}’s CV as a downloadable PDF.`,
		'',
		'## FAQ',
		''
	];
	// llms.txt H2 sections are link lists, so each FAQ entry is one link line:
	// the question deep-links to its answer on /faq, the answer follows as notes.
	for (const entry of faq) {
		lines.push(`- [${entry.question}](${url(`/faq#${entry.id}`)}): ${entry.answer}`);
	}
	lines.push('');
	if (featured.length) {
		lines.push('## Projects', '');
		for (const project of featured) {
			lines.push(`- [${project.title}](${url(cvProjectPath(project.slug))})`);
		}
		lines.push('');
	}
	return lines.join('\n');
}
