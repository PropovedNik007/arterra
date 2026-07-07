<script>
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { SECTION_META } from '$lib/design/sections.js';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import GithubIcon from '$lib/icons/GithubIcon.svelte';
	import LinkedinIcon from '$lib/icons/LinkedinIcon.svelte';
	import EnvelopeIcon from '$lib/icons/EnvelopeIcon.svelte';
	import TelegramIcon from '$lib/icons/TelegramIcon.svelte';

	const navItems = [
		{ href: `${base}/`, label: 'Home' },
		{ href: `${base}${SECTION_META.projects.path}`, label: 'Projects' },
		{ href: `${base}${SECTION_META.diy.path}`, label: 'DIY' },
		{ href: `${base}${SECTION_META.sport.path}`, label: 'Sport' },
		{ href: `${base}/about`, label: 'About' },
		{ href: `${base}/contact`, label: 'Contact' },
		{ href: `${base}/graph`, label: 'Graph' }
	];

	let pathname = $derived($page.url.pathname);
</script>

<header class="site-header">
	<nav aria-label="Primary">
		<a class="brand" href="{base}/">Artur Sogomonyan</a>
		<ul>
			{#each navItems as item (item.href)}
				<li aria-current={pathname === item.href ? 'page' : undefined}>
					<a href={item.href}>{item.label}</a>
				</li>
			{/each}
		</ul>
		<div class="header-actions">
			<a href="mailto:arthur.sogomonyan@gmail.com" aria-label="Email"><EnvelopeIcon class="icon" /></a>
			<a href="https://t.me/arterrai" target="_blank" rel="noreferrer" aria-label="Telegram">
				<TelegramIcon class="icon" />
			</a>
			<a href="https://linkedin.com/in/artur-sogomonyan" target="_blank" rel="noreferrer" aria-label="LinkedIn">
				<LinkedinIcon class="icon" />
			</a>
			<a href="https://github.com/PropovedNik007" target="_blank" rel="noreferrer" aria-label="GitHub">
				<GithubIcon class="icon" />
			</a>
			<ThemeToggle />
		</div>
	</nav>
</header>

<style>
	.site-header {
		width: 100%;
		border-bottom: 1px solid var(--color-border);
		background-color: var(--color-bg);
	}
	nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		flex-wrap: wrap;
	}
	.brand {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		color: var(--color-heading);
		text-decoration: none;
	}
	ul {
		display: flex;
		gap: var(--space-4);
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li a {
		color: var(--color-text);
		text-decoration: none;
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: 0.02em;
		padding-block: var(--space-1);
		border-bottom: 2px solid transparent;
	}
	li[aria-current='page'] a {
		color: var(--color-heading);
		border-bottom-color: var(--accent-projects);
	}
	li a:hover,
	li a:focus-visible {
		color: var(--color-heading);
	}
	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	.header-actions a {
		color: var(--color-text);
		display: inline-flex;
	}
	.header-actions :global(.icon) {
		width: 1.1rem;
		height: 1.1rem;
	}
	a:focus-visible,
	button:focus-visible {
		outline: 2px solid var(--accent-projects);
		outline-offset: 2px;
	}
	@media (max-width: 768px) {
		nav {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
