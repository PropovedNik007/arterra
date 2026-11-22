<script>
	import { sitePath } from '#lib/paths.js';
	import GithubIcon from '#lib/icons/GithubIcon.svelte';
	import LinkedinIcon from '#lib/icons/LinkedinIcon.svelte';
	import EnvelopeIcon from '#lib/icons/EnvelopeIcon.svelte';
	import TelegramIcon from '#lib/icons/TelegramIcon.svelte';
	import MediumIcon from '#lib/icons/MediumIcon.svelte';
	import { cv } from '#lib/content/cv.js';
	import ToolpathOrnament from '#lib/components/ui/ToolpathOrnament.svelte';
	import { gcode, setGcode } from '#lib/design/effects/gcodeState.svelte.js';

	const year = new Date().getFullYear();

	const work = [
		{ href: '/insights', label: 'Insights' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/diy', label: 'DIY' },
		{ href: '/sport', label: 'Sport' }
	];
	const site = [
		{ href: '/about', label: 'About' },
		{ href: '/contact', label: 'Contact' },
		{ href: '/faq', label: 'FAQ' },
		{ href: '/retro', label: 'Retro archive' }
	];
	const social = [
		{ href: 'mailto:arthur.sogomonyan@gmail.com', label: 'Email', icon: EnvelopeIcon },
		{ href: 'https://t.me/arterrai', label: 'Telegram', icon: TelegramIcon },
		{ href: 'https://linkedin.com/in/artur-sogomonyan', label: 'LinkedIn', icon: LinkedinIcon },
		{ href: 'https://github.com/PropovedNik007', label: 'GitHub', icon: GithubIcon },
		{ href: 'https://medium.com/@artur.sogomonyan', label: 'Medium', icon: MediumIcon }
	];
</script>

<footer class="site-footer">
	<div class="shell footer-inner">
		<div class="footer-band">
			<ToolpathOrnament preset="footer-band" tone="muted" fit="slice" opacity={0.4} />
		</div>
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
							<a href={sitePath(link.href)}>{link.label}</a>
						</li>{/each}
				</ul>
			</div>
			<div>
				<p class="nav-label">Site</p>
				<ul>
					{#each site as link (link.href)}<li>
							<a href={sitePath(link.href)}>{link.label}</a>
						</li>{/each}
					<li>
						<a href={cv.pdf.href} target="_blank" rel="noopener noreferrer"
							>{cv.pdf.label} ({cv.pdf.note})</a
						>
					</li>
				</ul>
			</div>
		</nav>
		<div class="footer-base">
			<p class="copyright">
				© {year} · Built from a public <a href={sitePath('/insights#graph')}>knowledge graph</a>.
			</p>
			<!-- Rendered only once the effects layer has mounted: no dead button without JS. -->
			{#if gcode.ready}
				<button
					id="gcode-toggle"
					type="button"
					class="gcode-toggle"
					aria-pressed={gcode.on}
					aria-keyshortcuts="Alt+G"
					title="G-code view (Alt+G)"
					onclick={() => setGcode()}>G-code view<kbd aria-hidden="true">Alt G</kbd></button
				>
			{/if}
		</div>
	</div>
</footer>

<style>
	/* No hairline on top: the woven border straddling the edge is the divider. */
	.site-footer {
		background: var(--color-bg-sunken);
	}
	.footer-inner {
		position: relative;
		isolation: isolate;
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) auto;
		gap: var(--space-6) var(--space-8);
		padding-block: var(--space-7) var(--space-6);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.footer-band {
		position: absolute;
		top: -0.75rem;
		right: 0;
		left: 0;
		height: 1.5rem;
		pointer-events: none;
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
		width: var(--icon-sm);
		height: var(--icon-sm);
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
		letter-spacing: var(--tracking-label);
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
	.footer-base {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3) var(--space-5);
		padding-top: var(--space-5);
		border-top: 1px solid var(--color-border);
	}
	.gcode-toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 2.75rem;
		padding: 0.4rem 0.5rem 0.4rem 0.9rem;
		border: 1px dashed var(--color-border-strong);
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--color-text);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		cursor: pointer;
	}
	.gcode-toggle:hover {
		border-color: var(--accent);
		color: var(--color-heading);
	}
	.gcode-toggle[aria-pressed='true'] {
		border-style: solid;
		border-color: var(--accent);
		color: var(--color-heading);
	}
	.gcode-toggle kbd {
		display: inline-grid;
		place-items: center;
		min-width: 1.6rem;
		padding-inline: 0.35rem;
		height: 1.6rem;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		font: inherit;
	}
	/* The shortcut hint only helps where there is likely a keyboard. */
	@media (hover: none) {
		.gcode-toggle kbd {
			display: none;
		}
		.gcode-toggle {
			padding-right: 0.9rem;
		}
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
