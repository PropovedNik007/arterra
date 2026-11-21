<script>
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import GithubIcon from '$lib/icons/GithubIcon.svelte';
	import LinkedinIcon from '$lib/icons/LinkedinIcon.svelte';
	import EnvelopeIcon from '$lib/icons/EnvelopeIcon.svelte';
	import TelegramIcon from '$lib/icons/TelegramIcon.svelte';

	// The brand link is the home link (and every breadcrumb starts with Home),
	// so the row stays focused on destinations. Retro lives in the footer.
	const navItems = [
		{ href: '/projects', label: 'Projects' },
		{ href: '/diy', label: 'DIY' },
		{ href: '/sport', label: 'Sport' },
		{ href: '/graph', label: 'Graph' },
		{ href: '/about', label: 'About' },
		{ href: '/contact', label: 'Contact' }
	];

	let scrollY = $state(0);
	// Use the route id, not url.pathname: with relative paths `base` is "." or ".."
	// during prerender, so stripping it from the pathname is unreliable.
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
		<a class="brand" href="{base}/" aria-current={isHome ? 'page' : undefined}>Artur Sogomonyan</a>

		<nav class="nav" aria-label="Primary">
			<ul class="nav-links">
				{#each navItems as item (item.href)}
					<li>
						<a href={`${base}${item.href}`} aria-current={isActive(item.href) ? 'page' : undefined}
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
		transition: transform 160ms ease;
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
			background 220ms ease,
			border-color 220ms ease,
			backdrop-filter 220ms ease;
	}
	.site-header.scrolled {
		border-bottom-color: var(--color-border);
		background: var(--header-scrim);
		backdrop-filter: blur(16px) saturate(145%);
	}
	.bar {
		display: flex;
		min-height: 4.5rem;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
	}
	.brand {
		color: var(--color-heading);
		font: 500 1.08rem var(--font-display);
		white-space: nowrap;
		transition:
			opacity 180ms ease,
			transform 180ms ease;
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
		font-size: 0.82rem;
		font-weight: 650;
		letter-spacing: 0.045em;
		white-space: nowrap;
	}
	.nav-links a:focus-visible {
		outline-offset: -2px;
	}
	.over-hero .nav-links a,
	.over-hero .header-actions a {
		color: rgba(226, 235, 240, 0.68);
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
		transition: transform 180ms ease;
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
		padding: 0.45rem;
		border-radius: var(--radius-full);
		color: var(--color-text-muted);
	}
	.header-actions a:hover {
		color: var(--accent);
	}
	.header-actions :global(.icon) {
		width: 1rem;
		height: 1rem;
	}
	@media (max-width: 1040px) {
		.bar {
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
		}
		.nav {
			order: 3;
			width: 100%;
			margin: 0;
		}
		/* Horizontal scroll row; the fade on the right hints at more items. */
		.nav-links {
			overflow-x: auto;
			padding-right: var(--space-6);
			scrollbar-width: none;
			-webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 2.5rem), transparent);
			mask-image: linear-gradient(90deg, #000 calc(100% - 2.5rem), transparent);
		}
		.nav-links::-webkit-scrollbar {
			display: none;
		}
		.nav-links a {
			padding: 0.75rem 0 0.9rem;
		}
	}
	@media (max-width: 520px) {
		.header-actions a:nth-child(-n + 2) {
			display: none;
		}
		.brand {
			font-size: 1rem;
		}
		.nav-links {
			gap: 1.05rem;
		}
		.nav-links a {
			font-size: 0.8rem;
			letter-spacing: 0.02em;
		}
	}
</style>
