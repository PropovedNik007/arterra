<script>
	import Header from '../components/Header.svelte';
	import '../app.css';
	import { Footer, FooterCopyright, FooterLinkGroup, FooterLink } from 'flowbite-svelte';
</script>

<div class="app">
	<Header />

	<main>
		<slot />
	</main>

	<Footer>
		<div class="bottom-0 sm:flex sm:items-center sm:justify-between">
		<FooterCopyright href="/" by="Artur Sogomonyan" year={2024} />
		<FooterLinkGroup ulClass="flex flex-wrap items-center mt-3 text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
			<FooterLink href="mailto:arthur.sogomonyan@gmail.com">Email</FooterLink>
			<FooterLink href="https://linkedin.com/in/artur-sogomonyan">LinkedIn</FooterLink>
			<FooterLink href="https://github.com/PropovedNik007">GitHub</FooterLink>
			<FooterLink href="/">Contact</FooterLink>
		</FooterLinkGroup>
		</div>
	</Footer>

	<!-- <Footer class="absolute bottom-0 start-0 z-20 w-full p-4 bg-white border-t border-gray-200 shadow md:flex md:items-center md:justify-between md:p-6 dark:bg-gray-800 dark:border-gray-600">
		<FooterCopyright href="/" by="Flowbite™" year={2022} />
		<FooterLinkGroup ulClass="flex flex-wrap items-center mt-3 text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
		  <FooterLink href="/">About</FooterLink>
		  <FooterLink href="/">Privacy Policy</FooterLink>
		  <FooterLink href="/">Licensing</FooterLink>
		  <FooterLink href="/">Contact</FooterLink>
		</FooterLinkGroup>
	  </Footer> -->
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		/* min-height: 100vh; */

		min-height: 100vh;
		margin: 0;
		justify-content: space-between;
		/* display: grid;
		grid-template-rows: auto 1fr auto; */
	}

	/* main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	} */
</style>