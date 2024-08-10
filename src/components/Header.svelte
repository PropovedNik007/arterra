<script>
	import { page } from '$app/stores';
	// import logo from '$lib/images/logo.svg';
	import github from '$lib/images/github.svg';
	import { onMount } from 'svelte';
	// import { openModal } from '../store/index';
	// import { createAnimationTriggerAction } from 'svelte-trigger-action';
	import { fade } from 'svelte/transition';
	import { GithubSolid, EnvelopeOutline, LinkedinSolid } from 'flowbite-svelte-icons';

	import { base } from '$app/paths';

	// const { triggerAnimation, animationAction } = createAnimationTriggerAction()

	let scrollHeight = 0;
</script>

<svelte:window bind:scrollY={scrollHeight} />

<nav transition:fade class:nav-scroll={scrollHeight > 100 || $page.url.pathname !== '/'}>
	<ul>
		<li aria-current={$page.url.pathname === '/' ? 'page' : undefined}>
			<a href="{base}/">Home</a>
		</li>
		<li aria-current={$page.url.pathname === '/projects' ? 'page' : undefined}>
			<a href="{base}/projects">Projects</a>
		</li>
		<li aria-current={$page.url.pathname === '/about' ? 'page' : undefined}>
			<a href="{base}/about">About</a>
		</li>
		<li>
			<a href="mailto:arthur.sogomonyan@gmail.com" target="_blank"><EnvelopeOutline/></a>
		</li>
		<li>
			<a href="https://linkedin.com/in/artur-sogomonyan" target="_blank"><LinkedinSolid/></a>
		</li>
		<li>
			<a href="https://github.com/PropovedNik007" target="_blank"><GithubSolid/></a>
		</li>
	</ul>
</nav>

<style>
	@keyframes slideDown {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes fadeIn {
		from {
			transform: translateX(-100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	ul {
		position: relative;
		padding: 0;
		margin: 0;
		height: 5vh;
		display: flex;
		justify-content: center;
		align-items: center;
		list-style: none;
		background: var(--background);
		background-size: contain;
		justify-content: flex-end;
	}

	li {
		position: relative;
		height: 100%;
	}

	li[aria-current='page'] {
		border-bottom: 1px solid white;
	}

	nav {
		/* padding: 1rem; */
		width: 100%;
	}

	nav * {
		font-weight: 600;
		display: flex;
		align-items: center;
		padding: 0 0.5rem;
		color: var(--color-text);
		font-weight: 700;
		font-size: 0.8rem;
		letter-spacing: 0.1em;
		text-decoration: none;
		transition: color 0.2s linear;
		z-index: 1000;
	}

	nav ul {
		display: flex;
		/* justify-content: center; */
		align-items: center;
		padding: 0;
	}

	.nav-scroll {
		position: fixed;
		z-index: 1000;
		background-color: rgba(0, 0, 0, 0.9);
		animation: slideDown 0.5s ease-out forwards;
	}

	.nav-scroll .logo-container {
		animation: left-in-basic 1 0.8s 0s;
		animation: fadeIn 0.5s ease-out forwards;
	}

	a:hover {
		color: white;
	}

/* media mobile */
	@media (max-width: 768px) {
		nav ul li{
			/* justify-content: space-around; */
			padding: 0;
		}

		nav * {
			justify-content: space-around;
			/* padding: 0; */
		}
	}
</style>
