<script>
	import { base } from '$app/paths';
	import GithubIcon from '$lib/icons/GithubIcon.svelte';
	import LinkedinIcon from '$lib/icons/LinkedinIcon.svelte';
	import EnvelopeIcon from '$lib/icons/EnvelopeIcon.svelte';
	import TelegramIcon from '$lib/icons/TelegramIcon.svelte';

	const year = new Date().getFullYear();
</script>

<footer class="site-footer">
	<p>&copy; {year} Artur Sogomonyan</p>
	<ul>
		<li>
			<a href="mailto:arthur.sogomonyan@gmail.com"><EnvelopeIcon class="icon" /> Email</a>
		</li>
		<li>
			<a href="https://t.me/arterrai" target="_blank" rel="noreferrer"><TelegramIcon class="icon" /> Telegram</a>
		</li>
		<li>
			<a href="https://linkedin.com/in/artur-sogomonyan" target="_blank" rel="noreferrer">
				<LinkedinIcon class="icon" /> LinkedIn
			</a>
		</li>
		<li>
			<a href="https://github.com/PropovedNik007" target="_blank" rel="noreferrer"><GithubIcon class="icon" /> GitHub</a>
		</li>
		<li><a href="{base}/contact">Contact</a></li>
	</ul>
</footer>

<style>
	.site-footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-6) var(--space-5);
		border-top: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li a {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-text-muted);
		text-decoration: none;
	}
	li a:hover,
	li a:focus-visible {
		color: var(--color-heading);
	}
	:global(.icon) {
		width: 1rem;
		height: 1rem;
	}
</style>
