<script>
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import GithubIcon from '$lib/icons/GithubIcon.svelte';
	import LinkedinIcon from '$lib/icons/LinkedinIcon.svelte';
	import EnvelopeIcon from '$lib/icons/EnvelopeIcon.svelte';
	import TelegramIcon from '$lib/icons/TelegramIcon.svelte';

	const navItems = [
		{ href: '/', label: 'Home' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/diy', label: 'DIY' },
		{ href: '/sport', label: 'Sport' },
		{ href: '/about', label: 'About' },
		{ href: '/graph', label: 'Graph' },
		{ href: '/retro', label: 'Retro' }
	];

	let scrollY = $state(0);
	let pathname = $derived($page.url.pathname.replace(base, '') || '/');
	let isHome = $derived(pathname === '/');
	let overHero = $derived(isHome && scrollY < 48);

	/** @param {string} href */
	function isActive(href) {
		const normalized = href === '/' ? href : href.replace(/\/$/, '');
		return normalized === '/'
			? pathname === '/'
			: pathname === normalized || pathname.startsWith(`${normalized}/`);
	}
</script>

<svelte:window bind:scrollY />

<header class:over-hero={overHero} class:scrolled={scrollY >= 48 || !isHome} class="site-header">
	<nav class="shell" aria-label="Primary navigation">
		<a class="brand" href="{base}/">Artur Sogomonyan</a>

		<ul class="nav-links">
			{#each navItems as item (item.href)}
				<li aria-current={isActive(item.href) ? 'page' : undefined}>
					<a href={`${base}${item.href}`}>{item.label}</a>
				</li>
			{/each}
		</ul>

		<div class="header-actions" aria-label="Social links">
			<a href="mailto:arthur.sogomonyan@gmail.com" aria-label="Email"
				><EnvelopeIcon class="icon" /></a
			>
			<a href="https://t.me/arterrai" target="_blank" rel="noreferrer" aria-label="Telegram"
				><TelegramIcon class="icon" /></a
			>
			<a
				href="https://linkedin.com/in/artur-sogomonyan"
				target="_blank"
				rel="noreferrer"
				aria-label="LinkedIn"><LinkedinIcon class="icon" /></a
			>
			<a
				href="https://github.com/PropovedNik007"
				target="_blank"
				rel="noreferrer"
				aria-label="GitHub"><GithubIcon class="icon" /></a
			>
		</div>
	</nav>
</header>

<style>
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
	nav {
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
	.over-hero .brand {
		opacity: 0;
		transform: translateY(-5px);
		pointer-events: none;
	}
	.nav-links {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: clamp(0.9rem, 2vw, 1.6rem);
		margin: 0 0 0 auto;
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
	.nav-links li[aria-current='page'] a,
	.nav-links a:hover {
		color: var(--color-heading);
	}
	.nav-links li[aria-current='page'] a::after,
	.nav-links a:hover::after {
		transform: scaleX(1);
	}
	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	.header-actions a {
		display: inline-flex;
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
		nav {
			flex-wrap: wrap;
			gap: 0;
			padding-top: var(--space-3);
		}
		.brand {
			order: 1;
		}
		.header-actions {
			order: 2;
			margin-left: auto;
		}
		.nav-links {
			order: 3;
			width: 100%;
			overflow-x: auto;
			justify-content: flex-start;
			margin: 0;
		}
		.nav-links a {
			padding: 0.75rem 0 1rem;
		}
	}
	@media (max-width: 520px) {
		.header-actions a:nth-child(-n + 2) {
			display: none;
		}
		.brand {
			font-size: 1rem;
		}
	}
</style>
