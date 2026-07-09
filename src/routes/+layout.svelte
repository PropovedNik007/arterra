<script>
	import '../app.css';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';

	let { children } = $props();

	const personSchema = {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: 'Artur Sogomonyan',
		jobTitle: 'Software & Machine Learning Engineer',
		address: {
			'@type': 'PostalAddress',
			addressLocality: 'Vienna',
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
	<meta name="robots" content="index, follow" />
	<meta property="og:site_name" content="Artur Sogomonyan" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#262624" />
	{@html `<script type="application/ld+json">${JSON.stringify(personSchema)}</` + `script>`}
</svelte:head>

<div class="app">
	<Header />
	<main>
		{@render children()}
	</main>
	<Footer />
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
</style>
