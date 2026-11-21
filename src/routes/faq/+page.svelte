<script>
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import PageIntro from '$lib/components/ui/PageIntro.svelte';
	import { cv } from '$lib/content/cv.js';
	import { FAQ_GROUPS } from '$lib/content/faq.js';
	import { absoluteUrl, jsonLdScript } from '$lib/seo/site.js';

	let { data } = $props();

	let groups = $derived(
		FAQ_GROUPS.map((group) => ({
			...group,
			entries: data.faq.filter((entry) => entry.group === group.id)
		})).filter((group) => group.entries.length)
	);

	let faqSchema = $derived({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		url: absoluteUrl('/faq'),
		mainEntity: data.faq.map((entry) => ({
			'@type': 'Question',
			name: entry.question,
			acceptedAnswer: { '@type': 'Answer', text: entry.answer }
		}))
	});

	/** @param {string} href */
	const resolve = (href) => (href.startsWith('/') ? `${base}${href}` : href);
	/** @param {string} href */
	const isExternal = (href) => href.startsWith('http');

	// /faq#<id> deep-links: open the matching entry and bring it into view.
	function openFromHash() {
		// FAQ ids are ASCII slugs, so the raw fragment is used as is: decoding a
		// malformed fragment (e.g. "#%E0") would throw.
		const id = window.location.hash.slice(1);
		if (!id) return;
		const target = document.getElementById(id);
		if (target instanceof HTMLDetailsElement) {
			target.open = true;
			target.scrollIntoView({ block: 'start' });
			target.querySelector('summary')?.focus({ preventScroll: true });
		}
	}

	onMount(() => {
		openFromHash();
		window.addEventListener('hashchange', openFromHash);
		return () => window.removeEventListener('hashchange', openFromHash);
	});
</script>

<svelte:head>
	<title>FAQ — {cv.name}</title>
	<meta
		name="description"
		content="Frequently asked questions about {cv.name}, {cv.headline} in {cv.location}: background, education, languages, skills, projects, CV download, and contact."
	/>
	{@html jsonLdScript(faqSchema)}
</svelte:head>

<div class="shell page">
	<Breadcrumb items={[{ label: 'FAQ' }]} />
	<PageIntro
		eyebrow="Questions and answers"
		title="Frequently asked questions"
		description="Short answers about who I am, what I work on, and how to reach me. Each answer stands on its own and links to the page with more detail."
	>
		<a class="button primary" href={cv.pdf.href} target="_blank" rel="noopener noreferrer"
			>{cv.pdf.label} ({cv.pdf.note}) <span aria-hidden="true">↗</span></a
		>
		<a class="button" href="{base}/contact">Get in touch</a>
	</PageIntro>

	{#each groups as group (group.id)}
		<section class="faq-group" aria-labelledby="faq-group-{group.id}">
			<h2 id="faq-group-{group.id}">{group.label}</h2>
			<div class="faq-list">
				{#each group.entries as entry (entry.id)}
					<details id={entry.id}>
						<summary>
							<span class="question">{entry.question}</span>
							<span class="marker" aria-hidden="true"></span>
						</summary>
						<div class="answer">
							<p>{entry.answer}</p>
							{#if entry.links?.length}
								<ul class="links">
									{#each entry.links as link (link.href)}
										<li>
											<a
												href={resolve(link.href)}
												target={isExternal(link.href) ? '_blank' : undefined}
												rel={isExternal(link.href) ? 'noopener noreferrer' : undefined}
												>{link.label}
												<span aria-hidden="true">{isExternal(link.href) ? '↗' : '→'}</span></a
											>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</details>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.faq-group {
		display: grid;
		grid-template-columns: 0.72fr 1.28fr;
		gap: clamp(2rem, 6vw, 6rem);
		padding-block: var(--space-7);
		border-top: 1px solid var(--color-border);
	}
	.faq-group h2 {
		max-width: 12ch;
		margin: 0;
		font-size: clamp(1.6rem, 3vw, 2.2rem);
	}
	.faq-list {
		border-top: 1px solid var(--color-border);
	}
	details {
		border-bottom: 1px solid var(--color-border);
		scroll-margin-top: calc(var(--header-h) + var(--space-4));
	}
	summary {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-5) 0;
		color: var(--color-heading);
		font-size: var(--text-lg);
		font-weight: 650;
		line-height: 1.35;
		list-style: none;
		cursor: pointer;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary:hover .question {
		color: var(--accent);
	}
	.marker {
		position: relative;
		flex: none;
		width: 0.85rem;
		height: 0.85rem;
	}
	.marker::before,
	.marker::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		width: 100%;
		height: 2px;
		background: var(--accent);
		transition: transform 180ms ease;
	}
	.marker::after {
		transform: rotate(90deg);
	}
	details[open] .marker::after {
		transform: rotate(0deg);
	}
	.answer {
		padding-bottom: var(--space-5);
	}
	.answer p {
		max-width: var(--reading-width);
		margin: 0;
		color: var(--color-text);
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-5);
		margin: var(--space-4) 0 0;
		padding: 0;
		list-style: none;
		font-size: var(--text-sm);
		font-weight: 650;
	}
	@media (prefers-reduced-motion: reduce) {
		.marker::before,
		.marker::after {
			transition: none;
		}
	}
	@media (max-width: 760px) {
		.faq-group {
			grid-template-columns: 1fr;
			gap: var(--space-5);
		}
		.faq-group h2 {
			max-width: none;
		}
		summary {
			font-size: var(--text-base);
		}
	}
</style>
