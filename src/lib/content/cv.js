/**
 * Single source of truth for the public CV facts rendered on Home and About.
 *
 * Only facts already published on the site or explicitly approved for the
 * public profile belong here. Never add phone numbers, private employers,
 * client identities, or a link to a CV PDF until it has been regenerated and
 * approved. Project links are content slugs from `content/projects`; pages
 * turn them into URLs with `cvProjectPath()` and prefix `base` themselves.
 */

import { itemPath } from '../design/sections.js';

/**
 * @typedef {object} EducationEntry
 * @property {string} id
 * @property {string} degree
 * @property {string} school
 * @property {string} [schoolShort] Compact school name for tight layouts.
 * @property {string} period
 * @property {string} [note]
 * @property {string} [project] Content slug in `content/projects`.
 */

/**
 * @typedef {object} ExperienceEntry
 * @property {string} id
 * @property {string} org
 * @property {string} [role] Omitted when the public note gives no title.
 * @property {string} period
 * @property {boolean} [current]
 * @property {string} summary
 * @property {string} [project] Content slug in `content/projects`.
 */

/**
 * @typedef {object} LanguageEntry
 * @property {string} name
 * @property {string} level CEFR level.
 */

/**
 * @typedef {object} AwardEntry
 * @property {string} id
 * @property {string} title
 * @property {string} detail
 * @property {string} [project] Content slug in `content/projects`.
 */

/**
 * @typedef {object} PublicationEntry
 * @property {string} id
 * @property {string} venue
 * @property {string} year
 * @property {string} title
 */

/**
 * @typedef {object} Cv
 * @property {string} name
 * @property {string} headline
 * @property {string} location
 * @property {string[]} focus
 * @property {EducationEntry[]} education
 * @property {ExperienceEntry[]} experience
 * @property {Record<string, string[]>} skills
 * @property {LanguageEntry[]} languages
 * @property {AwardEntry[]} awards
 * @property {PublicationEntry[]} publications
 */

/** @type {Cv} */
export const cv = {
	name: 'Artur Sogomonyan',
	headline: 'AI Engineer',
	location: 'Vienna',
	focus: [
		'Data Scientist',
		'Machine Learning Engineer',
		'Computer Vision',
		'Deep Learning',
		'Full-stack Development'
	],
	education: [
		{
			id: 'msc-tu-wien',
			degree: 'MSc Data Science',
			school: 'Technische Universität Wien',
			schoolShort: 'TU Wien',
			period: '2022–2026'
		},
		{
			id: 'bsc-bmstu',
			degree: 'BSc Information Technologies and Telecommunications',
			school: 'Bauman Moscow State Technical University',
			schoolShort: 'Bauman MSTU',
			period: '2014–2020',
			note: 'Thesis: 3D-printer failure-detection system based on computer vision.',
			project: 'printerra'
		},
		{
			id: 'dls-mipt',
			degree: 'Deep Learning School',
			school: 'Moscow Institute of Physics and Technology',
			schoolShort: 'MIPT',
			period: '2020–2021'
		},
		{
			id: 'sda-hse-yandex',
			degree: 'School of Data Analysis',
			school: 'Higher School of Economics & Yandex',
			schoolShort: 'HSE & Yandex',
			period: '2020'
		}
	],
	experience: [
		{
			id: 'flexam',
			org: 'Flexam',
			period: 'Current',
			current: true,
			summary: 'Software for multi-axis 3D printers. Further details are intentionally omitted.',
			project: 'flexam'
		},
		{
			id: 'susteam',
			org: 'susteam',
			role: 'CTO & Data Scientist',
			period: 'Jan 2023 – Feb 2025',
			summary:
				'ESG analytics platform for hospitality: product architecture, full-stack implementation, ML pipeline, and cloud infrastructure.',
			project: 'susteam'
		},
		{
			id: 'rail4future',
			org: 'TU Wien · Rail4Future',
			role: 'Research Scientist',
			period: 'Feb – Jul 2024',
			summary:
				'Rail-irregularity analysis and LSTM modelling for a digital-twin platform with Siemens and ÖBB.',
			project: 'rail4future'
		},
		{
			id: 'glosav',
			org: 'GLOSAV',
			role: 'Machine Learning Analyst',
			period: 'Feb – Jul 2021',
			summary: 'Real-time computer vision for railway-route and obstacle detection.',
			project: 'glosav'
		},
		{
			id: 'arterra-miniature',
			org: 'Arterra Miniature',
			role: 'Engineer & Project Manager',
			period: '2020–2021',
			summary: '3D modelling, prototyping, software, and end-to-end delivery.'
		},
		{
			id: 'krk-group',
			org: 'KRK Group',
			role: 'Frontend developer',
			period: '2019',
			summary: 'React interfaces and API integrations for a corporate education platform.',
			project: 'web-development-path'
		},
		{
			id: 'linwood',
			org: 'Linwood',
			role: 'Full-stack developer',
			period: '2018–2019',
			summary: 'Developed and tested e-commerce applications.',
			project: 'web-development-path'
		},
		{
			id: 'freelance-web',
			org: 'Freelance',
			role: 'Web developer',
			period: '2017–2018',
			summary: 'Frontend and backend work: new applications and extensions to existing systems.',
			project: 'web-development-path'
		}
	],
	skills: {
		'Machine learning & vision': ['PyTorch', 'TensorFlow', 'scikit-learn', 'OpenCV', 'YOLO'],
		'Language & retrieval': ['NLP', 'LLMs', 'RAG', 'LangChain'],
		'Software engineering': ['Python', 'C++', 'JavaScript', 'Svelte', 'React', 'FastAPI', 'Docker'],
		'Data & infrastructure': [
			'PostgreSQL',
			'MongoDB',
			'Redis',
			'AWS',
			'Linux',
			'nginx',
			'Git',
			'CI/CD'
		]
	},
	languages: [
		{ name: 'English', level: 'C1' },
		{ name: 'Russian', level: 'C2' },
		{ name: 'Armenian', level: 'B2' },
		{ name: 'German', level: 'A2' }
	],
	awards: [
		{
			id: 'aim-hackathon',
			title: '2nd place · AIM Hackathon',
			detail: 'Hosted by TIMETOACT Group — RAG for greenwashing detection.',
			project: 'aim-hackathon-greenwashing-rag'
		},
		{
			id: 'tourism-hackathon',
			title: '2nd place · Tourism Technology Hackathon 2023',
			detail: 'Tourism knowledge graph with an interactive map.',
			project: 'tourism-knowledge-graph'
		}
	],
	publications: [
		{
			id: 'ieee-2024-surrogate',
			venue: 'IEEE',
			year: '2024',
			title: 'Surrogate modelling for railway digital twins'
		}
	]
};

/**
 * Site-relative path (without `base`) of a project referenced from the CV.
 * @param {string} slug
 * @returns {string}
 */
export function cvProjectPath(slug) {
	return itemPath({ section: 'projects', slug });
}

/**
 * Every project slug the CV links to, for consistency checks.
 * @returns {string[]}
 */
export function cvProjectSlugs() {
	return [
		...new Set(
			[...cv.education, ...cv.experience, ...cv.awards]
				.map((entry) => entry.project)
				.filter((slug) => typeof slug === 'string')
		)
	];
}
