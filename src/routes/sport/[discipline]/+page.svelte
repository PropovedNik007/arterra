<script>
	// @ts-nocheck -- discipline is validated in the matching server load
	import { sitePath } from '#lib/paths.js';
	import Breadcrumb from '#lib/components/ui/Breadcrumb.svelte';
	import PageIntro from '#lib/components/ui/PageIntro.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import ContentCard from '#lib/components/cards/ContentCard.svelte';
	import MountainsBackdrop from '#lib/components/ui/MountainsBackdrop.svelte';
	import { DISCIPLINE_META } from '#lib/design/sections.js';
	let { data } = $props();
	let meta = $derived(DISCIPLINE_META[data.discipline]);
	let others = $derived(Object.entries(DISCIPLINE_META).filter(([key]) => key !== data.discipline));
</script>

<svelte:head
	><title>{meta.label} — Sport — Artur Sogomonyan</title><meta
		name="description"
		content={`${meta.label} notes by Artur Sogomonyan.`}
	/></svelte:head
>

<div class="shell page" data-section="sport">
	<div class="intro" class:hiking={data.discipline === 'hiking'}>
		{#if data.discipline === 'hiking'}<MountainsBackdrop />{/if}
		<Breadcrumb items={[{ label: 'Sport', href: '/sport' }, { label: meta.label }]} />
		<PageIntro
			eyebrow={`${meta.icon} Sport discipline`}
			title={meta.label}
			description={data.items.length
				? `${meta.description} Published notes, newest first.`
				: `${meta.description} This page stays empty until there is a real ${meta.label.toLowerCase()} note worth publishing.`}
		/>
	</div>
	{#if data.discipline === 'boxing'}
		<a class="club" href="https://unity-fight.club/feed" target="_blank" rel="noopener noreferrer"
			><span>Training home</span><strong>Unity Fight Club</strong><small
				>Vienna · Visit club <span aria-hidden="true">↗</span></small
			></a
		>
	{/if}
	{#if data.items.length}
		<section aria-labelledby="notes-heading">
			<div class="section-head">
				<h2 id="notes-heading">Notes</h2>
				<p>
					{data.items.length}
					{data.items.length === 1 ? 'published note' : 'published notes'}
				</p>
			</div>
			<div class="grid">
				{#each data.items as item (item.slug)}<ContentCard {item} headingLevel={3} />{/each}
			</div>
		</section>
	{:else}
		<EmptyState icon={meta.icon} title={`No ${meta.label.toLowerCase()} notes yet.`}>
			<p>The other sport notes are a click away.</p>
			<a class="button" href={sitePath('/sport')}>Back to Sport</a>
		</EmptyState>
	{/if}

	<nav class="others" aria-label="Other sport disciplines">
		<p>Other disciplines</p>
		<ul>
			{#each others as [key, other] (key)}
				<li>
					<a class="chip-toggle" href={sitePath(other.path)}
						><span aria-hidden="true">{other.icon}</span> {other.label}</a
					>
				</li>
			{/each}
		</ul>
	</nav>
</div>

<style>
	/* Hiking: Ararat (Sis and Masis) and Aragats stand behind the intro, their plain resting
	   on the khachkar rule below it. */
	.intro.hiking {
		/* PageIntro's khachkar rule is 2.5rem tall: the plain stands on it. */
		--mountains-offset: 2.5rem;
		position: relative;
		isolation: isolate;
	}
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
	.club > span {
		/* Lightened so the label keeps AA contrast on the accent-tinted card. */
		color: color-mix(in srgb, var(--accent) 72%, var(--color-heading));
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: var(--tracking-label);
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
	.others {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3) var(--space-5);
		margin-top: var(--space-8);
		padding-top: var(--space-5);
		border-top: 1px solid var(--color-border);
	}
	.others p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
	}
	.others ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
