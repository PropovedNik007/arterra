<script>
	import { page } from '$app/state';
	import { sitePath } from '#lib/paths.js';
	import Breadcrumb from '#lib/components/ui/Breadcrumb.svelte';
	import RobotArm from '#lib/components/armenian/RobotArm.svelte';
	import InitialsMark from '#lib/components/armenian/InitialsMark.svelte';

	let status = $derived(page.status);
	let notFound = $derived(status === 404);
	let title = $derived(notFound ? 'Page not found' : 'Something went wrong');

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/insights', label: 'Insights' }
	];
</script>

<svelte:head>
	<title>{title} — Artur Sogomonyan</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="shell page">
	<Breadcrumb items={[{ label: notFound ? 'Not found' : 'Error' }]} />
	<div class="error-page">
		<div class="copy">
			<p class="eyebrow">Error {status}</p>
			<h1>{title}.</h1>
			<p class="lede">
				{#if notFound}
					Nothing is printed at this address. The link may be out of date, or the page has moved.
				{:else}
					This page could not be loaded. Try again in a moment, or continue from one of these pages.
				{/if}
			</p>
			<nav class="links" aria-label="Where to go next">
				<ul>
					{#each links as link, index (link.href)}
						<li>
							<a class="button" class:primary={index === 0} href={sitePath(link.href)}
								>{link.label}</a
							>
						</li>
					{/each}
				</ul>
			</nav>
		</div>

		<!-- The arm follows the pointer itself: no second nozzle from the cursor effect. -->
		<figure class="scene" data-no-nozzle>
			<RobotArm />
			<figcaption>
				<InitialsMark />
				<span>Arevakhach, the Armenian eternity sign, as a robot arm would print it.</span>
			</figcaption>
		</figure>
	</div>
</div>

<style>
	.error-page {
		display: grid;
		grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
		/* The intro starts where it does on every page, under the breadcrumb. */
		align-items: start;
		gap: clamp(var(--space-6), 5vw, var(--space-9));
	}
	h1 {
		margin-bottom: var(--space-5);
	}
	.lede {
		margin: 0;
	}
	.links ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin: var(--space-6) 0 0;
		padding: 0;
		list-style: none;
	}
	.scene {
		margin: 0;
		min-width: 0;
	}
	figcaption {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		margin-top: var(--space-4);
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		line-height: 1.5;
		--mark-height: 2.75rem;
		--mark-stroke: 1.1;
	}
	@media (max-width: 860px) {
		.error-page {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	@media (max-width: 520px) {
		figcaption {
			--mark-height: 2.25rem;
		}
	}
</style>
