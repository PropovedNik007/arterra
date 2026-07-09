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
</script>

<svelte:window bind:scrollY />

<header class="site-header" class:scrolled>
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
	}
	.brand:hover {
		text-decoration: none;
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

	@media (max-width: 820px) {
		nav {
			justify-content: center;
			padding: var(--space-3) var(--space-4);
			gap: var(--space-2) var(--space-4);
		}
		.brand {
			flex-basis: 100%;
			justify-content: center;
		}
		.nav-links {
			flex-basis: 100%;
			justify-content: center;
			flex-wrap: wrap;
			gap: var(--space-3) var(--space-5);
		}
		.header-actions {
			flex-basis: 100%;
			justify-content: center;
		}
		/* On mobile the header always needs its scrim (no tall hero gap above it) */
		.site-header {
			background: var(--header-scrim);
			backdrop-filter: blur(16px) saturate(150%);
			-webkit-backdrop-filter: blur(16px) saturate(150%);
			border-bottom-color: var(--color-border);
		}
	}
</style>
