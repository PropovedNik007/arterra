<script>
	import { base } from '$app/paths';
	import GithubIcon from '$lib/icons/GithubIcon.svelte';
	import LinkedinIcon from '$lib/icons/LinkedinIcon.svelte';
	import EnvelopeIcon from '$lib/icons/EnvelopeIcon.svelte';
	import TelegramIcon from '$lib/icons/TelegramIcon.svelte';
	import { cv } from '$lib/content/cv.js';

	const year = new Date().getFullYear();

	const work = [
		{ href: '/projects', label: 'Projects' },
		{ href: '/diy', label: 'DIY' },
		{ href: '/sport', label: 'Sport' },
		{ href: '/graph', label: 'Knowledge graph' },
		{ href: '/insights', label: 'Insights' }
	];
	const site = [
		{ href: '/about', label: 'About' },
		{ href: '/contact', label: 'Contact' },
		{ href: '/retro', label: 'Retro archive' }
	];
	const social = [
		{ href: 'mailto:arthur.sogomonyan@gmail.com', label: 'Email', icon: EnvelopeIcon },
		{ href: 'https://t.me/arterrai', label: 'Telegram', icon: TelegramIcon },
		{ href: 'https://linkedin.com/in/artur-sogomonyan', label: 'LinkedIn', icon: LinkedinIcon },
		{ href: 'https://github.com/PropovedNik007', label: 'GitHub', icon: GithubIcon }
	];
</script>

<footer class="site-footer">
	<div class="shell footer-inner">
		<div class="identity">
			<p class="footer-name">Artur Sogomonyan</p>
			<p>{cv.headline} in {cv.location.split(',')[0]}.</p>
			<ul class="social" aria-label="Elsewhere">
				{#each social as link (link.href)}
					{@const Icon = link.icon}
					<li>
						<a
							href={link.href}
							aria-label={link.label}
							title={link.label}
							target={link.href.startsWith('http') ? '_blank' : undefined}
							rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
							><Icon class="icon" /></a
						>
					</li>
				{/each}
			</ul>
		</div>
		<nav aria-label="Footer">
			<div>
				<p class="nav-label">Work</p>
				<ul>
					{#each work as link (link.href)}<li>
							<a href={`${base}${link.href}`}>{link.label}</a>
						</li>{/each}
				</ul>
			</div>
			<div>
				<p class="nav-label">Site</p>
				<ul>
					{#each site as link (link.href)}<li>
							<a href={`${base}${link.href}`}>{link.label}</a>
						</li>{/each}
				</ul>
			</div>
		</nav>
		<p class="copyright">
			© {year} · Built from a public <a href="{base}/graph">knowledge graph</a>.
		</p>
	</div>
</footer>

<style>
	.site-footer {
		border-top: 1px solid var(--color-border);
		background: var(--color-bg-sunken);
	}
	.footer-inner {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) auto;
		gap: var(--space-6) var(--space-8);
		padding-block: var(--space-7) var(--space-6);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	p {
		margin: 0.2rem 0;
	}
	.footer-name {
		color: var(--color-heading);
		font-family: var(--font-display);
		font-size: var(--text-lg);
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.social {
		display: flex;
		gap: var(--space-1);
		margin: var(--space-4) 0 0 calc(-1 * 0.5rem);
	}
	.social a {
		display: inline-flex;
		padding: 0.5rem;
		border-radius: var(--radius-full);
		color: var(--color-text-muted);
	}
	.social a:hover {
		color: var(--accent);
	}
	.social :global(.icon) {
		width: 1.05rem;
		height: 1.05rem;
	}
	nav {
		display: flex;
		gap: var(--space-8);
	}
	.nav-label {
		margin-bottom: var(--space-3);
		color: var(--color-text);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	nav ul {
		display: grid;
		gap: var(--space-2);
	}
	nav a {
		color: var(--color-text-muted);
	}
	nav a:hover {
		color: var(--color-heading);
	}
	.copyright {
		grid-column: 1 / -1;
		padding-top: var(--space-5);
		border-top: 1px solid var(--color-border);
	}
	.copyright a {
		color: var(--color-text);
	}
	@media (max-width: 720px) {
		.footer-inner {
			grid-template-columns: minmax(0, 1fr);
		}
		nav {
			gap: var(--space-7);
		}
	}
</style>
