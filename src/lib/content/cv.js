/**
 * Single source of truth for the public CV facts rendered on Home and About.
 *
 * Only facts already published on the site or explicitly approved for the
 * public profile belong here. Never add private employers or client
 * identities. Project links are content slugs from `content/projects`; pages
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
 * @property {string} [thesis] Diploma-thesis topic, without a trailing period.
 * @property {string} [note] Display line; for a thesis, built by `thesisNote()`.
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
 * @property {string} title "<place> · <event>", e.g. "2nd place · AIM Hackathon".
 * @property {string} period Month and year, e.g. "Oct 2024".
 * @property {string} detail One sentence.
 * @property {string} [project] Content slug in `content/projects`; omitted when
 *   the award has no project page.
 */

/**
 * @typedef {object} PublicationEntry
 * @property {string} id
 * @property {string} title Exact published title.
 * @property {string} venue Full proceedings name.
 * @property {string} venueShort Compact venue label, e.g. "IEEE IEEM 2024".
 * @property {string} year
 * @property {string} pages Page range with an en dash.
 * @property {string} doi DOI without the resolver prefix.
 * @property {string} url DOI resolver URL (https://doi.org/<doi>).
 * @property {string} credit Authorship line, e.g. "Co-authored with S. Zhou et al.".
 * @property {string} leadAuthor First author as credited publicly, e.g. "S. Zhou".
 */

/**
 * @typedef {object} RadarSeries
 * @property {string} id
 * @property {string} label
 * @property {number[]} values One score per radar axis, 0–100.
 */

/**
 * Self-assessed skill radar: one score per axis for each series, 0–100. These
 * are the owner's own ratings; keep them exactly as given.
 * @typedef {object} SkillRadar
 * @property {string[]} axes
 * @property {number} max
 * @property {RadarSeries[]} series
 */

/**
 * Public CV document. The owner approved linking this PDF from the site.
 * @typedef {object} CvPdf
 * @property {string} href Absolute https URL of the PDF.
 * @property {string} label Visible call-to-action text.
 * @property {string} note File-type hint shown next to the label.
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
 * @property {SkillRadar} radar
 * @property {LanguageEntry[]} languages
 * @property {AwardEntry[]} awards
 * @property {PublicationEntry[]} publications
 * @property {CvPdf} pdf
 */

const BSC_THESIS = '3D-printer failure-detection system based on computer vision';

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
			thesis: BSC_THESIS,
			note: thesisNote(BSC_THESIS),
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
			summary:
				'Software for industrial multi-axis additive manufacturing: 3D segmentation, slicing, toolpath and G-code generation for robot arms and multi-axis machines, and the full-stack slicer product in Go, Rust, Python, and TypeScript.',
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
		'Software engineering': [
			'Python',
			'Go',
			'Rust',
			'TypeScript',
			'JavaScript',
			'C++',
			'Node.js',
			'Bun',
			'Svelte',
			'React',
			'three.js',
			'FastAPI',
			'Docker'
		],
		'3D & manufacturing': [
			'3D segmentation',
			'mesh processing',
			'slicing',
			'toolpath generation',
			'G-code',
			'robot arms',
			'multi-axis printing',
			'trimesh'
		],
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
	radar: {
		axes: [
			'Data Science',
			'Computer Vision',
			'NLP',
			'Blockchain',
			'IoT',
			'3D/AR',
			'Front-End',
			'Back-End',
			'DevOps',
			'Databases'
		],
		max: 100,
		series: [
			{ id: 'experience', label: 'Experience', values: [90, 80, 75, 30, 50, 60, 70, 80, 50, 70] },
			{ id: 'interest', label: 'Interest', values: [80, 100, 100, 60, 60, 90, 80, 90, 60, 70] }
		]
	},
	languages: [
		{ name: 'English', level: 'C1' },
		{ name: 'Russian', level: 'C2' },
		{ name: 'Armenian', level: 'B2' },
		{ name: 'German', level: 'A2' }
	],
	// Newest first.
	awards: [
		{
			id: 'ai-mission-hackathon-3',
			title: '1st place · AI Mission Hackathon 3',
			period: 'Oct 2025',
			detail:
				'Team “Nightwalkers” — a multi-tool AI agent that autonomously answered complex sustainability questions, reaching over 70% accuracy on database and Wikipedia queries.'
		},
		{
			id: 'aim-hackathon',
			title: '2nd place · AIM Hackathon',
			period: 'Oct 2024',
			detail: 'Hosted by TIMETOACT Group — RAG for greenwashing detection.',
			project: 'aim-hackathon-greenwashing-rag'
		},
		{
			id: 'tourism-hackathon',
			title: '2nd place · Tourism Technology Hackathon',
			period: 'Nov 2023',
			detail: 'Tourism knowledge graph with an interactive map.',
			project: 'tourism-knowledge-graph'
		}
	],
	publications: [
		{
			id: 'ieee-ieem-2024-surrogate',
			title:
				'Comparative Analysis of Machine Learning-based Surrogate Modeling Approaches for Multi-body Dynamic Simulation in Railway Digital Twin Platform',
			venue:
				'2024 IEEE International Conference on Industrial Engineering and Engineering Management (IEEM)',
			venueShort: 'IEEE IEEM 2024',
			year: '2024',
			pages: '1074–1078',
			doi: '10.1109/IEEM62345.2024.10857013',
			url: 'https://doi.org/10.1109/IEEM62345.2024.10857013',
			credit: 'Co-authored with S. Zhou et al.',
			leadAuthor: 'S. Zhou'
		}
	],
	pdf: {
		href: 'https://github.com/PropovedNik007/cv/raw/main/Artur_Sogomonyan_cv_long.pdf',
		label: 'Download CV',
		note: 'PDF'
	}
};

/**
 * Display line for a thesis topic: "Diploma thesis: <topic>." (the BSc thesis
 * is a diploma thesis in the owner's CV).
 * @param {string} topic
 * @returns {string}
 */
export function thesisNote(topic) {
	return `Diploma thesis: ${topic}.`;
}

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
