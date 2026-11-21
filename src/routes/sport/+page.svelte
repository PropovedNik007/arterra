<script>
	// @ts-nocheck -- keys come directly from the typed discipline metadata map
	import { base } from '$app/paths';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import PageIntro from '$lib/components/ui/PageIntro.svelte';
	import { DISCIPLINE_META } from '$lib/design/sections.js';
	let { data } = $props();

	const descriptions = {
		hiking: 'Routes, conditions, elevation, and the small decisions that shape a day outside.',
		boxing: 'Training notes, sparring lessons, and drills worth repeating.',
		diving: 'Sites, depth, conditions, and observations below the surface.',
		'table-tennis': 'Practice notes, matches, equipment, and tactical patterns.'
	};
</script>

<svelte:head
	><title>Sport — Artur Sogomonyan</title><meta
		name="description"
		content="Hiking, boxing, diving, and table-tennis notes by Artur Sogomonyan."
	/></svelte:head
>

<div class="shell page" data-section="sport">
	<Breadcrumb items={[{ label: 'Sport' }]} />
	<PageIntro
		eyebrow="Field notes"
		title="Sport"
		description="Four disciplines, one reason to keep notes: pay attention, remember the lesson, and arrive better prepared next time."
	/>
	<div class="discipline-grid">
		{#each Object.entries(DISCIPLINE_META) as [key, meta] (key)}
			{@const count = data.items.filter((item) => item.discipline === key).length}
			<a href={`${base}${meta.path}`}>
				<span class="icon" aria-hidden="true">{meta.icon}</span>
				<div>
					<p class="count">
						{count
							? `${count} published ${count === 1 ? 'note' : 'notes'}`
							: 'Nothing published yet'}
					</p>
					<h2>{meta.label}</h2>
					<p>{descriptions[key]}</p>
				</div>
				<b aria-hidden="true">→</b>
			</a>
		{/each}
	</div>
</div>

<style>
	.discipline-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-4);
	}
	.discipline-grid a {
		position: relative;
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: var(--space-5);
		align-items: start;
		min-height: 14rem;
		padding: var(--space-6);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg-raised);
		color: var(--color-text);
		transition: 180ms ease;
	}
	.discipline-grid a:hover {
		transform: translateY(-4px);
		border-color: var(--accent);
		text-decoration: none;
	}
	.icon {
		font-size: 2rem;
	}
	.count {
		margin: 0 0 var(--space-5);
		color: var(--accent);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	h2 {
		margin-bottom: var(--space-3);
	}
	.discipline-grid div > p:last-child {
		margin: 0;
		color: var(--color-text-muted);
	}
	b {
		color: var(--accent);
	}
	@media (max-width: 700px) {
		.discipline-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
