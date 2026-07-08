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
</script>

<header class="site-header">
	<nav aria-label="Primary">
		<a class="brand" href="{base}/">
			<span class="brand-mark" aria-hidden="true">✦</span>
			Artur Sogomonyan
		</a>
		<ul>
			{#each navItems as item (item.href)}
				<li aria-current={pathname === item.href ? 'page' : undefined} class:soon={item.soon}>
					<a href={item.href}>
						{item.label}
						{#if item.soon}<span class="soon-dot" aria-label="coming soon"></span>{/if}
					</a>
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
		position: sticky;
		top: 0;
		z-index: 50;
		width: 100%;
		background: rgba(15, 20, 24, 0.6);
		backdrop-filter: blur(14px) saturate(140%);
		-webkit-backdrop-filter: blur(14px) saturate(140%);
		border-bottom: 1px solid rgba(178, 200, 214, 0.12);
		box-shadow: 0 12px 32px -16px rgba(0, 0, 0, 0.7);
	}
	nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3) var(--space-5);
		padding: var(--space-3) var(--space-5);
		flex-wrap: wrap;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-family: var(--font-display);
		font-weight: 700;
		font-size: var(--text-base);
		letter-spacing: -0.01em;
		color: var(--color-heading);
		text-decoration: none;
		white-space: nowrap;
	}
	.brand-mark {
		color: var(--accent-projects);
		font-size: 0.9em;
		text-shadow: 0 0 10px color-mix(in srgb, var(--accent-projects) 70%, transparent);
	}
	ul {
		display: flex;
		gap: var(--space-5);
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li a {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.09em;
		padding-block: var(--space-2);
	}
	li a::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 2px;
		background: var(--accent-projects);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.2s ease;
	}
	li[aria-current='page'] a {
		color: var(--color-heading);
	}
	li[aria-current='page'] a::after {
		transform: scaleX(1);
	}
	li a:hover,
	li a:focus-visible {
		color: var(--color-heading);
	}
	li a:hover::after,
	li a:focus-visible::after {
		transform: scaleX(1);
	}
	li.soon a {
		color: var(--color-text-muted);
		opacity: 0.55;
	}
	.soon-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--accent-diy);
		box-shadow: 0 0 6px color-mix(in srgb, var(--accent-diy) 80%, transparent);
	}
	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	.header-actions a {
		color: var(--color-text-muted);
		display: inline-flex;
		transition: color 0.15s ease;
	}
	.header-actions a:hover {
		color: var(--color-heading);
	}
	.header-actions :global(.icon) {
		width: 1.05rem;
		height: 1.05rem;
	}
	a:focus-visible,
	button:focus-visible {
		outline: 2px solid var(--accent-projects);
		outline-offset: 2px;
	}
	@media (max-width: 768px) {
		nav {
			justify-content: center;
			padding: var(--space-3) var(--space-4);
			gap: var(--space-2) var(--space-3);
		}
		.brand {
			flex-basis: 100%;
			justify-content: center;
		}
		ul {
			flex-basis: 100%;
			justify-content: center;
			flex-wrap: wrap;
			gap: var(--space-2) var(--space-4);
		}
		.header-actions {
			flex-basis: 100%;
			justify-content: center;
		}
	}
</style>
