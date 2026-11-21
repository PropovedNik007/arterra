<script>
	// @ts-nocheck -- discipline is validated in the matching server load
	import { base } from '$app/paths';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import PageIntro from '$lib/components/ui/PageIntro.svelte';
	import ContentCard from '$lib/components/cards/ContentCard.svelte';
	import { DISCIPLINE_META } from '$lib/design/sections.js';
	let { data } = $props();
	let meta = $derived(DISCIPLINE_META[data.discipline]);
</script>

<svelte:head
	><title>{meta.label} — Sport</title><meta
		name="description"
		content={`${meta.label} notes by Artur Sogomonyan.`}
	/></svelte:head
>

<div class="shell page" data-section="sport">
	<Breadcrumb items={[{ label: 'Sport', href: '/sport' }, { label: meta.label }]} />
	<PageIntro
		eyebrow={`${meta.icon} Sport discipline`}
		title={meta.label}
		description={data.items.length
			? `Published ${meta.label.toLowerCase()} notes, observations, and lessons.`
			: `This section is intentionally empty until there is a real ${meta.label.toLowerCase()} note worth publishing.`}
	/>
	{#if data.discipline === 'boxing'}
		<a class="club" href="https://unity-fight.club/feed" target="_blank" rel="noreferrer"
			><span>Training home</span><strong>Unity Fight Club</strong><small
				>Vienna · Visit club ↗</small
			></a
		>
	{/if}
	{#if data.items.length}
		<div class="grid">
			{#each data.items as item (item.slug)}<ContentCard {item} />{/each}
		</div>
	{:else}
		<div class="empty">
			<span>{meta.icon}</span>
			<h2>No placeholder stories.</h2>
			<p>
				The route is ready; the content will appear when there is a genuine field note to share.
			</p>
			<a href="{base}/sport">Back to Sport</a>
		</div>
	{/if}
</div>

<style>
	.club {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-7);
		padding: var(--space-5) var(--space-6);
		border: 1px solid color-mix(in srgb, var(--accent) 55%, var(--color-border));
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--accent) 8%, var(--color-bg-raised));
		color: var(--color-text);
	}
	.club:hover {
		text-decoration: none;
		border-color: var(--accent);
	}
	.club span {
		color: var(--accent);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.club strong {
		color: var(--color-heading);
		font-family: var(--font-display);
		font-size: var(--text-xl);
	}
	.club small {
		color: var(--color-text-muted);
	}
	.empty {
		padding: clamp(3rem, 8vw, 6rem);
		border: 1px dashed var(--color-border-strong);
		border-radius: var(--radius-xl);
		text-align: center;
	}
	.empty > span {
		font-size: 3rem;
	}
	.empty h2 {
		margin: var(--space-4) 0 var(--space-2);
	}
	.empty p {
		max-width: 34rem;
		margin: 0 auto var(--space-5);
		color: var(--color-text-muted);
	}
</style>
