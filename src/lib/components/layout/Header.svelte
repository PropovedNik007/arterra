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
		{ href: `${base}/`, label: 'Home', soon: false },
		{ href: `${base}${SECTION_META.projects.path}`, label: 'Projects', soon: false },
		{ href: `${base}${SECTION_META.diy.path}`, label: 'DIY', soon: true },
		{ href: `${base}${SECTION_META.sport.path}`, label: 'Sport', soon: true },
		{ href: `${base}/about`, label: 'About', soon: false },
		{ href: `${base}/contact`, label: 'Contact', soon: false },
		{ href: `${base}/graph`, label: 'Graph', soon: true }
	];

	let pathname = $derived($page.url.pathname);
	let scrollY = $state(0);
	let scrolled = $derived(scrollY > 32);
	// The home hero is always a dark photo, so a transparent (unscrolled) header
	// sitting over it needs light text regardless of the site theme.
	let isHome = $derived(pathname === `${base}/` || pathname === base);
	let overHero = $derived(isHome && !scrolled);
</script>

<svelte:window bind:scrollY />

<header class="site-header" class:scrolled class:over-hero={overHero}>
	<nav aria-label="Primary">
		<a class="brand" href="{base}/">
			<span class="brand-mark" aria-hidden="true"></span>
			<span class="brand-text">Artur Sogomonyan</span>
		</a>

		<ul class="nav-links">
			{#each navItems as item (item.href)}
				<li aria-current={pathname === item.href ? 'page' : undefined} class:soon={item.soon}>
					{#if item.soon}
						<span class="nav-link" aria-disabled="true" title="{item.label} — coming soon">
							{item.label}
							<span class="soon-dot" aria-hidden="true"></span>
							<span class="visually-hidden">(coming soon)</span>
						</span>
					{:else}
						<a class="nav-link" href={item.href}>{item.label}</a>
					{/if}
				</li>
			{/each}
		</ul>

		<div class="header-actions">
			<a href="mailto:arthur.sogomonyan@gmail.com" aria-label="Email"><EnvelopeIcon class="icon" /></a>
			<a href="https://t.me/arterrai" target="_blank" rel="noreferrer" aria-label="Telegram">
				<TelegramIcon class="icon" />
			</a>
			<a
				href="https://linkedin.com/in/artur-sogomonyan"
				target="_blank"
				rel="noreferrer"
				aria-label="LinkedIn"
			>
				<LinkedinIcon class="icon" />
			</a>
			<a
				href="https://github.com/PropovedNik007"
				target="_blank"
				rel="noreferrer"
				aria-label="GitHub"
			>
				<GithubIcon class="icon" />
			</a>
			<span class="divider" aria-hidden="true"></span>
			<ThemeToggle />
		</div>
	</nav>
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 50;
		background: transparent;
		border-bottom: 1px solid transparent;
		transition:
			background 0.3s ease,
			border-color 0.3s ease,
			backdrop-filter 0.3s ease;
	}
	/* Frosted scrim only after scrolling away from the hero */
	.site-header.scrolled {
		background: var(--header-scrim);
		backdrop-filter: blur(16px) saturate(150%);
		-webkit-backdrop-filter: blur(16px) saturate(150%);
		border-bottom-color: var(--color-border);
	}

	nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4) var(--space-6);
		max-width: 78rem;
		margin: 0 auto;
		padding: var(--space-4) var(--space-6);
		flex-wrap: wrap;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.6em;
		font-family: var(--font-display);
		font-weight: 500;
		font-size: 1.15rem;
		letter-spacing: -0.01em;
		color: var(--color-heading);
		text-decoration: none;
		white-space: nowrap;
		transition:
			opacity 0.3s ease,
			transform 0.3s ease,
			color 0.18s ease;
	}
	.brand:hover {
		text-decoration: none;
	}
	/* Brand appears only once the header sticks (after scroll); hidden over the hero */
	.site-header.over-hero .brand {
		opacity: 0;
		transform: translateY(-6px);
		pointer-events: none;
	}
	.brand-mark {
		width: 0.62em;
		height: 0.62em;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.nav-link {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		letter-spacing: 0.01em;
		padding-block: var(--space-1);
		transition: color 0.18s ease;
	}
	a.nav-link::after {
		content: '';
		position: absolute;
		left: 0;
		bottom: -3px;
		width: 100%;
		height: 2px;
		border-radius: 2px;
		background: var(--accent);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.22s ease;
	}
	li[aria-current='page'] .nav-link {
		color: var(--color-heading);
	}
	li[aria-current='page'] a.nav-link::after {
		transform: scaleX(1);
	}
	a.nav-link:hover,
	a.nav-link:focus-visible {
		color: var(--color-heading);
		text-decoration: none;
	}
	a.nav-link:hover::after,
	a.nav-link:focus-visible::after {
		transform: scaleX(1);
	}
	li.soon .nav-link {
		cursor: default;
		opacity: 0.5;
	}
	.soon-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--color-text-muted);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}
	.header-actions a {
		color: var(--color-text-muted);
		display: inline-flex;
		transition: color 0.18s ease;
	}
	.header-actions a:hover {
		color: var(--accent);
	}
	.header-actions :global(.icon) {
		width: 1.05rem;
		height: 1.05rem;
	}
	.divider {
		width: 1px;
		height: 1.1rem;
		background: var(--color-border-strong);
	}

	a:focus-visible,
	:global(.site-header button:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
		border-radius: var(--radius-sm);
	}

	/* Transparent header over the dark hero (home, before scroll): force light
	   text so it's legible in either theme. Desktop only — on mobile the header
	   always carries its theme scrim (see below). */
	@media (min-width: 821px) {
		.site-header.over-hero .brand-text {
			color: #faf9f5;
		}
		.site-header.over-hero .nav-link {
			color: rgba(250, 249, 245, 0.82);
		}
		.site-header.over-hero li[aria-current='page'] .nav-link,
		.site-header.over-hero a.nav-link:hover,
		.site-header.over-hero a.nav-link:focus-visible {
			color: #faf9f5;
		}
		.site-header.over-hero .header-actions a {
			color: rgba(250, 249, 245, 0.78);
		}
		.site-header.over-hero .header-actions a:hover {
			color: #faf9f5;
		}
		.site-header.over-hero .divider {
			background: rgba(250, 249, 245, 0.28);
		}
		.site-header.over-hero :global(.theme-toggle) {
			color: rgba(250, 249, 245, 0.82);
		}
	}

	@media (max-width: 820px) {
		nav {
			justify-content: space-between;
			padding: var(--space-3) var(--space-4);
			gap: var(--space-2) var(--space-3);
			row-gap: var(--space-3);
		}
		/* row 1: brand (left) + actions (right); row 2: nav links, centered */
		.brand {
			order: 1;
			font-size: 1.05rem;
		}
		.header-actions {
			order: 2;
			gap: var(--space-3);
		}
		.nav-links {
			order: 3;
			flex-basis: 100%;
			justify-content: center;
			flex-wrap: wrap;
			gap: var(--space-2) var(--space-4);
		}
		.nav-link {
			font-size: 0.82rem;
		}
		/* On mobile the header always carries its scrim, and the brand always shows
		   (there's no tall transparent hero gap above it as on desktop). */
		.site-header,
		.site-header.over-hero {
			background: var(--header-scrim);
			backdrop-filter: blur(16px) saturate(150%);
			-webkit-backdrop-filter: blur(16px) saturate(150%);
			border-bottom-color: var(--color-border);
		}
		.site-header.over-hero .brand {
			opacity: 1;
			transform: none;
			pointer-events: auto;
		}
	}
</style>
