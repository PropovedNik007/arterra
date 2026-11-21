<script>
	import '../app.css';
	import { page } from '$app/stores';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { cv } from '$lib/content/cv.js';

	let { children } = $props();
	// route.id is base-independent; `base` is relative ('.') during prerender.
	let isRetro = $derived($page.route.id === '/retro');

	const personSchema = {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: cv.name,
		jobTitle: cv.headline,
		address: {
			'@type': 'PostalAddress',
			addressLocality: cv.location,
			addressCountry: 'AT'
		},
		url: 'https://propovednik007.github.io/arterra/',
		sameAs: [
			'https://github.com/PropovedNik007',
			'https://linkedin.com/in/artur-sogomonyan',
			'https://t.me/arterrai'
		],
		knowsAbout: [
			'Machine Learning',
			'Computer Vision',
			'Deep Learning',
			'Natural Language Processing',
			'Full-stack Development',
			'3D Printing'
		]
	};
</script>

<svelte:head>
	<meta name="author" content="Artur Sogomonyan" />
	{#if !isRetro}<meta name="robots" content="index, follow" />{/if}
	<meta property="og:site_name" content="Artur Sogomonyan" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#151514" />
	{@html `<script type="application/ld+json">${JSON.stringify(personSchema)}</` + `script>`}
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
