<script>
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>Artur Sogomonyan — 2024 Portfolio</title>
	<meta
		name="description"
		content="The preserved original deployment of Artur Sogomonyan's portfolio."
	/>
</svelte:head>

<iframe title="Original 2024 Artur Sogomonyan portfolio" src={`${base}/retro-archive/index.html`}
></iframe>

<style>
	iframe {
		display: block;
		width: 100%;
		height: 100vh;
		border: 0;
		background: #263238;
	}
</style>
