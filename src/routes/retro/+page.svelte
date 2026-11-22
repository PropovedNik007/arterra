<script>
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>Artur Sogomonyan — 2024 Portfolio</title>
	<meta
		name="description"
		content="The preserved original deployment of Artur Sogomonyan's portfolio."
	/>
	<!-- An outdated 2024 snapshot: keep it out of search results so its old facts don't compete with the current site. -->
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- The archive renders without site chrome; this is the one way back out of it. -->
<a class="exit" href="{base}/"><span aria-hidden="true">←</span> Back to current site</a>

<iframe title="Original 2024 Artur Sogomonyan portfolio" src={`${base}/retro-archive/index.html`}
></iframe>

<style>
	.exit {
		position: fixed;
		bottom: var(--space-4);
		left: var(--space-4);
		z-index: 10;
		display: inline-flex;
		gap: var(--space-2);
		align-items: center;
		padding: var(--space-2) var(--space-4);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-full);
		background: var(--color-bg-elevated);
		box-shadow: var(--shadow-card);
		color: var(--color-heading);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: 600;
		text-decoration: none;
	}
	.exit:hover {
		border-color: var(--accent);
	}
	iframe {
		display: block;
		width: 100%;
		height: 100vh;
		border: 0;
		background: #263238;
	}
</style>
