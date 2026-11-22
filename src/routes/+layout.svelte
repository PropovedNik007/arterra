<script>
	import '../app.css';
	import { page } from '$app/state';
	import Header from '#lib/components/layout/Header.svelte';
	import Footer from '#lib/components/layout/Footer.svelte';
	import { cv } from '#lib/content/cv.js';
	import {
		CITY,
		COUNTRY_CODE,
		PROFILE,
		SITE_URL,
		absoluteUrl,
		jsonLdScript
	} from '#lib/seo/site.js';

	let { children } = $props();
	// route.id is base-independent; `base` is relative ('.') during prerender.
	let isRetro = $derived(page.route.id === '/retro');

	const alumniOf = cv.education
		.filter((entry) => entry.degree.startsWith('MSc') || entry.degree.startsWith('BSc'))
		.map((entry) => ({ '@type': 'CollegeOrUniversity', name: entry.school }));

	// Abbreviations already covered by a long-form topic below.
	const KNOWS_ABOUT_ALIASES = new Set(['NLP', 'LLMs', 'RAG']);

	// Person + WebSite graph for search and answer engines; every fact comes
	// from cv.js or the shared site constants.
	const siteSchema = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Person',
				'@id': `${SITE_URL}/#person`,
				name: cv.name,
				jobTitle: cv.headline,
				url: `${SITE_URL}/`,
				image: `${SITE_URL}/images/profile.png`,
				email: `mailto:${PROFILE.email}`,
				address: {
					'@type': 'PostalAddress',
					addressLocality: CITY,
					addressCountry: COUNTRY_CODE
				},
				alumniOf,
				knowsAbout: [
					...new Set([
						'Machine Learning',
						'Computer Vision',
						'Deep Learning',
						'Natural Language Processing',
						'Large Language Models',
						'Retrieval-Augmented Generation',
						'Full-stack Development',
						'3D Printing',
						...Object.values(cv.skills)
							.flat()
							.filter((skill) => !KNOWS_ABOUT_ALIASES.has(skill))
					])
				],
				knowsLanguage: cv.languages.map((language) => ({
					'@type': 'Language',
					name: language.name
				})),
				award: cv.awards.map((award) => `${award.title} (${award.period})`),
				sameAs: [PROFILE.linkedin, PROFILE.github, PROFILE.telegram, PROFILE.medium]
			},
			...cv.publications.map((publication) => ({
				'@type': 'ScholarlyArticle',
				'@id': publication.url,
				url: publication.url,
				name: publication.title,
				headline: publication.title,
				datePublished: publication.year,
				pagination: publication.pages,
				identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: publication.doi },
				isPartOf: { '@type': 'Book', name: publication.venue },
				// Not sole-authored: the lead author first, the owner as co-author.
				author: [
					{ '@type': 'Person', name: publication.leadAuthor },
					{ '@id': `${SITE_URL}/#person` }
				],
				creditText: `${publication.leadAuthor} et al.`
			})),
			{
				'@type': 'WebSite',
				'@id': `${SITE_URL}/#website`,
				url: `${SITE_URL}/`,
				name: cv.name,
				inLanguage: 'en',
				author: { '@id': `${SITE_URL}/#person` },
				publisher: { '@id': `${SITE_URL}/#person` }
			}
		]
	};
</script>

<svelte:head>
	<meta name="author" content="Artur Sogomonyan" />
	{#if !isRetro}<meta name="robots" content="index, follow" />{/if}
	<meta property="og:site_name" content="Artur Sogomonyan" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#151514" />
	<!-- robots.txt under /arterra is not read by crawlers, so advertise the sitemap here too. -->
	<link rel="sitemap" type="application/xml" href={absoluteUrl('/sitemap.xml')} />
	{@html jsonLdScript(siteSchema)}
</svelte:head>

<div class="app">
	{#if !isRetro}<Header />{/if}
	<!-- Skip-link target: the header's first focusable link points at #main. -->
	<main id="main" tabindex="-1">
		{@render children()}
	</main>
	{#if !isRetro}<Footer />{/if}
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
	main:focus {
		outline: none;
	}
</style>
