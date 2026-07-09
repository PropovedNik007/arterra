<script>
	import { onMount } from 'svelte';
	import SunIcon from '$lib/icons/SunIcon.svelte';
	import MoonIcon from '$lib/icons/MoonIcon.svelte';

	let theme = $state('dark');

	onMount(() => {
		theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
	});

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('arterra-theme', theme);
	}
</script>

<button
	type="button"
	class="theme-toggle"
	onclick={toggle}
	aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
>
	{#if theme === 'dark'}
		<SunIcon class="icon" />
	{:else}
		<MoonIcon class="icon" />
	{/if}
</button>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		color: var(--color-text);
		cursor: pointer;
		border-radius: var(--radius-sm);
	}
	.theme-toggle:hover,
	.theme-toggle:focus-visible {
		color: var(--color-heading);
	}
	.theme-toggle :global(.icon) {
		width: 1.1rem;
		height: 1.1rem;
	}
</style>
