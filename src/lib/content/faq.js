/**
 * Frequently asked questions for the FAQ page, its FAQPage structured data, and
 * llms.txt. Answers are short, self-contained, and quotable on their own, so
 * search and answer engines can cite them without the surrounding page.
 *
 * Names, dates, slugs, the thesis, roles and awards come from `cv.js`, and the
 * featured projects from content frontmatter, so those facts cannot drift from
 * the About page. The remaining connective prose is checked against `cv.js` in
 * faq.test.js. Internal link hrefs are site-relative (no `base`); pages and
 * builders prefix them themselves.
 *
 * This module must stay free of Node APIs: the FAQ page imports it.
 */

import { cv, cvProjectPath } from './cv.js';
import { DISCIPLINE_META } from '../design/sections.js';
import { DISCIPLINES } from './types.js';
import { CITY, COUNTRY, PROFILE } from '../seo/site.js';

/**
 * @typedef {object} FaqLink
 * @property {string} label
 * @property {string} href Site-relative path ("/about") or absolute URL.
 */

/**
 * @typedef {'profile' | 'work' | 'site'} FaqGroup
 */

/**
 * @typedef {object} FaqEntry
 * @property {string} id Anchor id: /faq#<id> opens the entry.
 * @property {FaqGroup} group
 * @property {string} question
 * @property {string} answer Plain text, 1–3 sentences.
 * @property {FaqLink[]} [links]
 */

/**
 * @typedef {object} FeaturedProject
 * @property {string} slug
 * @property {string} title
 */

/** @type {{ id: FaqGroup, label: string }[]} */
export const FAQ_GROUPS = [
	{ id: 'profile', label: 'About Artur' },
	{ id: 'work', label: 'Work and skills' },
	{ id: 'site', label: 'CV, contact, and this site' }
];

/**
 * Featured projects in their published order, from loaded content items.
 * @param {import('./types.js').ContentItem[]} items
 * @returns {FeaturedProject[]}
 */
export function featuredProjects(items) {
	return items
		.filter((item) => item.section === 'projects' && item.featured)
		.sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99))
		.map((item) => ({ slug: item.slug, title: item.title }));
}

/**
 * "a, b, and c" (or "a; b; and c" with `separator` ";").
 * @param {string[]} values
 * @param {string} [separator]
 * @returns {string}
 */
function list(values, separator = ',') {
	if (values.length <= 2) return values.join(' and ');
	return `${values.slice(0, -1).join(`${separator} `)}${separator} and ${values.at(-1)}`;
}

/** @param {string} text */
function withArticle(text) {
	return `${/^[aeiou]/i.test(text) ? 'an' : 'a'} ${text}`;
}

/** @param {string} text */
function lowerFirst(text) {
	return text.charAt(0).toLowerCase() + text.slice(1);
}

/** @param {string} text */
function withoutPeriod(text) {
	return text.replace(/\.$/, '');
}

/**
 * "TU Wien · Rail4Future" → "TU Wien (Rail4Future)".
 * @param {string} org
 */
function orgLabel(org) {
	const [first, ...rest] = org.split(' · ');
	return rest.length ? `${first} (${rest.join(', ')})` : first;
}

/**
 * A CV entry by id; throws so a renamed entry fails the build instead of
 * publishing an answer with a hole in it.
 * @template {{ id: string }} T
 * @param {T[]} entries
 * @param {string} id
 * @returns {T}
 */
function byId(entries, id) {
	const entry = entries.find((candidate) => candidate.id === id);
	if (!entry) throw new Error(`cv.js has no entry "${id}"`);
	return entry;
}

/**
 * "2nd place · AIM Hackathon" → { place: '2nd', event: 'AIM Hackathon' }.
 * @param {string} title
 */
function awardParts(title) {
	const [rank, event = rank] = title.split(' · ');
	return { place: rank.replace(/\s*place$/i, ''), event };
}

/**
 * Builds the FAQ. Featured projects come from content frontmatter, so callers
 * pass them in (see `featuredProjects`).
 * @param {FeaturedProject[]} featured
 * @returns {FaqEntry[]}
 */
export function buildFaq(featured) {
	const name = cv.name;
	const place = `${CITY}, ${COUNTRY}`;
	const [msc, bsc, ...courses] = cv.education;
	const current = cv.experience.find((entry) => entry.current);
	const earlierRoles = cv.experience.filter((entry) => !entry.current && entry.role).slice(0, 3);
	const skillGroups = Object.entries(cv.skills).map(
		([group, values]) => `${lowerFirst(group)} (${values.join(', ')})`
	);
	const awards = cv.awards.map(
		(award) =>
			`${award.title.replace(' · ', ' at the ')} (${lowerFirst(withoutPeriod(award.detail))})`
	);
	const publications = cv.publications.map(
		(publication) => `“${publication.title}” (${publication.venue}, ${publication.year})`
	);
	const disciplines = DISCIPLINES.map((id) => DISCIPLINE_META[id].label.toLowerCase());
	const thesis = withArticle(
		lowerFirst(withoutPeriod((bsc.note ?? '').replace(/^Thesis:\s*/, '')))
	);
	const glosav = byId(cv.experience, 'glosav');
	const susteam = byId(cv.experience, 'susteam');
	const aim = byId(cv.awards, 'aim-hackathon');
	const aimParts = awardParts(aim.title);

	/** @type {FaqEntry[]} */
	const entries = [
		{
			id: 'who-is-artur-sogomonyan',
			group: 'profile',
			question: `Who is ${name}?`,
			answer: `${name} is ${withArticle(cv.headline)} based in ${place}. His background spans applied machine learning, computer vision, 3D geometry and toolpath software for multi-axis manufacturing, full-stack development, and hands-on making.`,
			links: [{ label: 'About', href: '/about' }]
		},
		{
			id: 'what-does-he-work-on',
			group: 'profile',
			question: `What does ${name} work on?`,
			answer: `${name} works where models meet products: shaping the data, testing the method, building the service, and making the result understandable to the person using it. His work covers applied machine learning, computer vision, 3D geometry and toolpath software for multi-axis manufacturing, LLM and retrieval-augmented generation (RAG) systems, and full-stack web development.`,
			links: [{ label: 'Projects', href: '/projects' }]
		},
		{
			id: 'education',
			group: 'profile',
			question: `What is ${name}’s education?`,
			answer: `${name}’s education includes an ${msc.degree} at ${msc.school} (${msc.schoolShort}, ${msc.period}) and a ${bsc.degree} at ${bsc.school} (${bsc.period}), where his thesis was ${thesis}. He also attended ${list(courses.map((entry) => `${entry.degree} (${entry.schoolShort ?? entry.school}, ${entry.period})`))}.`,
			links: bsc.project
				? [
						{ label: 'About', href: '/about' },
						{ label: 'Thesis project', href: cvProjectPath(bsc.project) }
					]
				: [{ label: 'About', href: '/about' }]
		},
		{
			id: 'languages',
			group: 'profile',
			question: `Which languages does ${name} speak?`,
			answer: `${name} speaks ${list(cv.languages.map((language) => `${language.name} (${language.level})`))}, with levels given on the CEFR scale.`
		},
		{
			id: 'experience',
			group: 'work',
			question: `What is ${name}’s work experience?`,
			answer: `${current ? `${name} currently works at ${current.org} on ${lowerFirst(withoutPeriod(current.summary))}. ` : ''}${name}’s earlier roles include ${list(
				earlierRoles.map((entry) => `${entry.role} at ${orgLabel(entry.org)}, ${entry.period}`),
				';'
			)}. Before that, he worked on 3D modelling and prototyping as well as frontend and full-stack web development.`,
			links: [{ label: 'Experience on the About page', href: '/about' }]
		},
		{
			id: 'technologies',
			group: 'work',
			question: `Which technologies does ${name} use?`,
			answer: `${name}’s toolkit covers ${list(skillGroups)}.`,
			links: [
				{ label: 'Toolkit', href: '/about' },
				{ label: 'Skills profile chart', href: '/insights#skills' }
			]
		},
		{
			id: 'llm-and-rag',
			group: 'work',
			question: `Does ${name} work with LLMs and RAG?`,
			answer: `Yes. ${name} built an ESG analytics platform (${susteam.org}) that combined OCR with retrieval-augmented language models to automate sustainability reporting, and his ${aimParts.event} project, which placed ${aimParts.place}, used RAG to detect greenwashing in corporate ESG reports.`,
			links: [
				...(susteam.project ? [{ label: susteam.org, href: cvProjectPath(susteam.project) }] : []),
				...(aim.project
					? [{ label: `${aimParts.event} project`, href: cvProjectPath(aim.project) }]
					: [])
			]
		},
		{
			id: 'computer-vision',
			group: 'work',
			question: `What computer-vision work has ${name} done?`,
			answer: `${name} worked on ${lowerFirst(withoutPeriod(glosav.summary))} at ${glosav.org}, and his thesis at ${bsc.school} was ${thesis}.`,
			links: [
				...(glosav.project ? [{ label: glosav.org, href: cvProjectPath(glosav.project) }] : []),
				...(bsc.project ? [{ label: 'Thesis project', href: cvProjectPath(bsc.project) }] : [])
			]
		},
		{
			id: 'featured-projects',
			group: 'work',
			question: `Which projects best show ${name}’s work?`,
			answer: featured.length
				? `The featured projects on ${name}’s site are ${list(featured.map((project) => project.title))}. Each has its own page with context, approach, and stack.`
				: `${name}’s projects are listed on the Projects page, each with context, approach, and stack.`,
			links: [
				...featured.map((project) => ({ label: project.title, href: cvProjectPath(project.slug) })),
				{ label: 'All projects', href: '/projects' }
			]
		},
		{
			id: 'awards-and-publications',
			group: 'work',
			question: `What awards and publications does ${name} have?`,
			answer: `${name} took ${list(awards)}. He also has ${publications.length === 1 ? 'a publication' : 'publications'}: ${list(publications)}.`,
			links: cv.awards
				.filter((award) => award.project)
				.map((award) => ({
					label: award.title.split(' · ')[1] ?? award.title,
					href: cvProjectPath(/** @type {string} */ (award.project))
				}))
		},
		{
			id: 'fit',
			group: 'work',
			question: `What kinds of problems is ${name} a good fit for?`,
			answer: `${name} is most useful on ambiguous work: incomplete data, a model that needs a real product around it, or a prototype that has to become dependable. Typical examples are applied-AI products, computer-vision pipelines, and systems that need both model and interface thinking.`,
			links: [{ label: 'Contact', href: '/contact' }]
		},
		{
			id: 'cv-download',
			group: 'site',
			question: `Where can I download ${name}’s CV?`,
			answer: `${name}’s CV is available as a PDF at ${cv.pdf.href}. The About page summarises the same experience, education, skills, and languages.`,
			links: [
				{ label: `${cv.pdf.label} (${cv.pdf.note})`, href: cv.pdf.href },
				{ label: 'About', href: '/about' }
			]
		},
		{
			id: 'contact',
			group: 'site',
			question: `How can I contact ${name}?`,
			answer: `You can reach ${name} by email at ${PROFILE.email}, on LinkedIn (${PROFILE.linkedin.replace('https://', '')}), on Telegram (${PROFILE.telegram.replace('https://', '')}), or on GitHub (${PROFILE.github.replace('https://', '')}); he also writes on Medium (${PROFILE.medium.replace('https://', '')}). A useful first message names the outcome you want, the current constraint, and the next decision.`,
			links: [
				{ label: 'Contact', href: '/contact' },
				{ label: 'Email', href: `mailto:${PROFILE.email}` },
				{ label: 'LinkedIn', href: PROFILE.linkedin },
				{ label: 'Telegram', href: PROFILE.telegram },
				{ label: 'GitHub', href: PROFILE.github },
				{ label: 'Medium', href: PROFILE.medium }
			]
		},
		{
			id: 'what-else-is-here',
			group: 'site',
			question: `What else is on ${name}’s site besides projects?`,
			answer: `Besides projects, the site has DIY build notes; sport notes on ${list(disciplines)}; and an Insights page with an interactive knowledge graph that connects the notes, a chart of how projects flow through fields of work, a self-assessed skills profile, and public GitHub activity plus anonymised totals from private organisation work.`,
			links: [
				{ label: 'DIY', href: '/diy' },
				{ label: 'Sport', href: '/sport' },
				{ label: 'Insights', href: '/insights' },
				{ label: 'Knowledge graph', href: '/insights#graph' }
			]
		}
	];
	return entries;
}
