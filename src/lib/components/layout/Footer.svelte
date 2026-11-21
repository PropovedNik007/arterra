<script>
	import { base } from '$app/paths';
	const year = new Date().getFullYear();
</script>

<footer class="site-footer">
	<div class="shell footer-inner">
		<div>
			<p class="footer-name">Artur Sogomonyan</p>
			<p>Software &amp; machine-learning engineer in Vienna.</p>
		</div>
		<nav aria-label="Footer navigation">
			<a href="{base}/projects">Projects</a>
			<a href="{base}/about">About</a>
			<a href="{base}/contact">Contact</a>
			<a href="{base}/retro">Retro</a>
		</nav>
		<p class="copyright">© {year} · Built from a public knowledge graph.</p>
	</div>
</footer>

<style>
	.site-footer {
		border-top: 1px solid var(--color-border);
		background: var(--color-bg-sunken);
	}
	.footer-inner {
		display: grid;
		grid-template-columns: 1.2fr auto 1fr;
		align-items: center;
		gap: var(--space-7);
		padding-block: var(--space-7);
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
	nav {
		display: flex;
		gap: var(--space-5);
	}
	nav a {
		color: var(--color-text-muted);
	}
	.copyright {
		text-align: right;
	}
	@media (max-width: 820px) {
		.footer-inner {
			grid-template-columns: 1fr;
			gap: var(--space-4);
		}
		.copyright {
			text-align: left;
		}
	}
</style>
