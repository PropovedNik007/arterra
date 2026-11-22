<script>
	import { page } from '$app/state';
	import { sitePath } from '#lib/paths.js';
	import GithubIcon from '#lib/icons/GithubIcon.svelte';
	import LinkedinIcon from '#lib/icons/LinkedinIcon.svelte';
	import EnvelopeIcon from '#lib/icons/EnvelopeIcon.svelte';
	import TelegramIcon from '#lib/icons/TelegramIcon.svelte';

	// The brand link is the home link (and every breadcrumb starts with Home),
	// so the row stays focused on destinations. Retro lives in the footer.
	const navItems = [
		{ href: '/insights', label: 'Insights' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/diy', label: 'DIY' },
		{ href: '/sport', label: 'Sport' },
		{ href: '/about', label: 'About' },
		{ href: '/contact', label: 'Contact' }
	];

	let scrollY = $state(0);
	// Use the route id, not url.pathname: with relative paths `base` is "." or ".."
	// during prerender, so stripping it from the pathname is unreliable.
	const base = sitePath('/').slice(0, -1);
	let pathname = $derived(page.route.id ?? (page.url.pathname.replace(base, '') || '/'));
	let isHome = $derived(pathname === '/');
	let overHero = $derived(isHome && scrollY < 48);

	/** @param {string} href */
	function isActive(href) {
		const normalized = href.replace(/\/$/, '');
		return pathname === normalized || pathname.startsWith(`${normalized}/`);
	}
</script>

<svelte:window bind:scrollY />

<a class="skip-link" href="#main">Skip to content</a>

<header class:over-hero={overHero} class:scrolled={scrollY >= 48 || !isHome} class="site-header">
	<div class="shell bar">
		<a class="brand" href={sitePath('/')} aria-current={isHome ? 'page' : undefined}
			>Artur Sogomonyan</a
		>

		<nav class="nav" aria-label="Primary">
			<ul class="nav-links">
				{#each navItems as item (item.href)}
					<li>
						<a href={sitePath(item.href)} aria-current={isActive(item.href) ? 'page' : undefined}
							>{item.label}</a
						>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="header-actions">
			<a href="mailto:arthur.sogomonyan@gmail.com" aria-label="Email" title="Email"
				><EnvelopeIcon class="icon" /></a
			>
			<a
				href="https://t.me/arterrai"
				target="_blank"
				rel="noopener noreferrer"
				aria-label="Telegram"
				title="Telegram"><TelegramIcon class="icon" /></a
			>
			<a
				href="https://linkedin.com/in/artur-sogomonyan"
				target="_blank"
				rel="noopener noreferrer"
				aria-label="LinkedIn"
				title="LinkedIn"><LinkedinIcon class="icon" /></a
			>
			<a
				href="https://github.com/PropovedNik007"
				target="_blank"
				rel="noopener noreferrer"
				aria-label="GitHub"
				title="GitHub"><GithubIcon class="icon" /></a
			>
		</div>
	</div>
</header>

<style>
	.skip-link {
		position: fixed;
		top: var(--space-3);
		left: var(--space-3);
		z-index: 200;
		padding: 0.6rem 1rem;
		border-radius: var(--radius-full);
		background: var(--accent);
		color: var(--accent-contrast);
		font-weight: 700;
		transform: translateY(-200%);
		transition: transform var(--duration-fast) ease;
	}
	.skip-link:focus,
	.skip-link:focus-visible {
		transform: translateY(0);
		text-decoration: none;
		outline: 2px solid var(--color-heading);
		outline-offset: 2px;
	}
	.site-header {
		position: sticky;
		top: 0;
		z-index: 50;
		border-bottom: 1px solid transparent;
		background: transparent;
		transition:
			background var(--duration-base) ease,
			border-color var(--duration-base) ease,
			backdrop-filter var(--duration-base) ease;
	}
	.site-header.scrolled {
		border-bottom-color: var(--color-border);
		background: var(--header-scrim);
		backdrop-filter: blur(16px) saturate(145%);
	}
	.bar {
		display: flex;
		min-height: var(--header-h);
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--color-heading);
		font: 500 1.08rem var(--font-display);
		white-space: nowrap;
		transition:
			opacity var(--duration-fast) ease,
			transform var(--duration-fast) ease;
	}
	.brand:hover,
	.nav-links a:hover {
		text-decoration: none;
	}
	.over-hero .brand:not(:focus-visible) {
		opacity: 0;
		transform: translateY(-5px);
		pointer-events: none;
	}
	.nav {
		min-width: 0;
		margin-left: auto;
	}
	.nav-links {
		display: flex;
		align-items: center;
		gap: clamp(0.9rem, 2vw, 1.6rem);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.nav-links a {
		position: relative;
		display: block;
		padding: 1.6rem 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		font-weight: 700;
		letter-spacing: 0.045em;
		white-space: nowrap;
	}
	.nav-links a:focus-visible {
		outline-offset: -2px;
	}
	/* Foreground over the dark hero image (fixed, since the image is the same in
	   every theme): one local token, mixed for the softer variants. */
	.over-hero {
		--on-hero-fg: rgb(226 235 240);
	}
	.over-hero .nav-links a,
	.over-hero .header-actions a {
		color: color-mix(in srgb, var(--on-hero-fg) 68%, transparent);
	}
	.nav-links a::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 2px;
		background: var(--accent);
		transform: scaleX(0);
		transition: transform var(--duration-base) ease;
	}
	.nav-links a[aria-current='page'],
	.nav-links a:hover,
	.over-hero .nav-links a:hover {
		color: var(--color-heading);
	}
	.nav-links a[aria-current='page']::after,
	.nav-links a:hover::after {
		transform: scaleX(1);
	}
	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}
	.header-actions a {
		display: inline-flex;
		padding: 0.5rem;
		border-radius: var(--radius-full);
		color: var(--color-text-muted);
	}
	.header-actions a:hover {
		color: var(--accent);
	}
	.header-actions :global(.icon) {
		width: var(--icon-sm);
		height: var(--icon-sm);
	}
	/* Below 760px one row no longer fits: name and all four icons on the first
	   row, the six menu items spread evenly across the second. */
	@media (max-width: 760px) {
		.bar {
			box-sizing: border-box;
			flex-wrap: wrap;
			gap: 0;
			padding-top: var(--space-2);
		}
		.brand {
			order: 1;
		}
		.header-actions {
			order: 2;
			margin-left: auto;
			margin-right: -0.5rem;
		}
		.nav {
			order: 3;
			width: 100%;
			margin: 0;
		}
		.nav-links {
			justify-content: center;
			gap: 1.75rem;
		}
		.nav-links a {
			padding: 0.8rem 0 0.85rem;
		}
	}
	/* Phones: the six items span the full width, edge to edge. */
	@media (max-width: 520px) {
		.nav-links {
			justify-content: space-between;
			gap: 0.5rem;
		}
	}
	@media (max-width: 400px) {
		.brand {
			font-size: 1rem;
		}
		.header-actions {
			gap: 0;
		}
		.header-actions a {
			padding: 0.45rem;
		}
		/* Off the type scale on purpose: all six items share one row down to 320px. */
		.nav-links a {
			font-size: 0.8rem;
			letter-spacing: 0.02em;
		}
	}
	@media (max-width: 340px) {
		.nav-links a {
			font-size: 0.75rem;
			letter-spacing: 0;
		}
	}
</style>
