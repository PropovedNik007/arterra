<script>
	// @ts-nocheck -- item shape is normalized by the build-time content loader
	import { base } from '$app/paths';
	import {
		itemPath,
		DISCIPLINE_META,
		SECTION_META,
		formatNoteDate,
		showsDate,
		tagLabel
	} from '$lib/design/sections.js';
	import {
		FIELDS,
		DOMAINS,
		FIELD_TAGS,
		displayFields,
		fieldsFor,
		leadDomain
	} from '$lib/graph/taxonomy.js';

	/**
	 * One card, one link: the title link's ::after stretches over the whole card,
	 * so the card is fully clickable without repeating the same destination.
	 */
	let { item, featured = false, headingLevel = 2 } = $props();

	let href = $derived(`${base}${itemPath(item)}`);
	let discipline = $derived(
		item.section === 'sport' && item.discipline ? DISCIPLINE_META[item.discipline] : null
	);
	// Curated order first, so a card leads with the note's defining fields.
	let fieldIds = $derived(displayFields(item.slug, item.fields ?? fieldsFor(item)));
	let fields = $derived(
		fieldIds
			.map((id) => FIELDS.find((field) => field.id === id))
			.filter(Boolean)
			.slice(0, 3)
	);
	let tools = $derived(
		item.tags.filter((tag) => !FIELD_TAGS.has(String(tag).toLowerCase())).slice(0, 3)
	);
	let kicker = $derived.by(() => {
		if (discipline) return `${discipline.icon} ${discipline.label}`;
		if (item.section === 'projects') {
			const domain = DOMAINS.find((candidate) => candidate.id === leadDomain(fieldIds));
			return domain?.label ?? SECTION_META.projects.label;
		}
		return SECTION_META[item.section]?.label ?? item.section;
	});
	let dated = $derived(showsDate(item.section) && Boolean(item.date));
	// A featured card without a cover becomes a text-led card instead of an empty panel.
	let lead = $derived(featured && !item.cover);
	let cta = $derived(item.section === 'projects' ? 'Read case study' : 'Read note');
</script>

<article class:featured class:lead class="card" data-section={item.section}>
	{#if !lead}
		<div class="cover">
			{#if item.cover}
				<img src={`${base}/${item.cover}`} alt="" loading="lazy" decoding="async" />
			{:else}
				<div class="cover-fallback" aria-hidden="true">
					<span>{discipline?.icon ?? (item.section === 'diy' ? '✦' : '↗')}</span>
				</div>
			{/if}
		</div>
	{/if}
	<div class="body">
		<div class="meta">
			<span class="kicker">{kicker}</span>
			{#if item.externalLink && item.externalLive}
				<span class="live"
					>Live<span class="visually-hidden"> site available</span><span aria-hidden="true">↗</span
					></span
				>
			{/if}
			{#if dated}
				<time datetime={item.date}>{formatNoteDate(item.date)}</time>
			{/if}
		</div>
		<svelte:element this={`h${headingLevel}`} class="title">
			<a class="stretched" {href}>{item.title}</a>
		</svelte:element>
		<p class="excerpt">{item.excerpt}</p>
		{#if fields.length || tools.length}
			<ul class="chips" aria-label="Fields and tools">
				{#each fields as field (field.id)}<li class="field">{field.label}</li>{/each}
				{#each tools as tag (tag)}<li>{tagLabel(tag)}</li>{/each}
			</ul>
		{/if}
		<span class="read" aria-hidden="true">{cta} <span>→</span></span>
	</div>
</article>

<style>
	.card {
		position: relative;
		display: flex;
		min-width: 0;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg-raised);
		box-shadow: var(--shadow-card);
		transition:
			transform 220ms ease,
			border-color 220ms ease;
	}
	.card:hover,
	.card:focus-within {
		transform: translateY(-4px);
		border-color: color-mix(in srgb, var(--accent) 55%, var(--color-border));
	}
	.cover {
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-bg-sunken);
	}
	.cover img,
	.cover-fallback {
		width: 100%;
		height: 100%;
	}
	.cover img {
		display: block;
		object-fit: cover;
		filter: saturate(0.75) contrast(1.04);
		transition:
			transform 400ms ease,
			filter 300ms ease;
	}
	.card:hover .cover img {
		transform: scale(1.035);
		filter: saturate(0.95) contrast(1.04);
	}
	.cover-fallback {
		display: grid;
		place-items: center;
		background:
			radial-gradient(
				circle at 25% 15%,
				color-mix(in srgb, var(--accent) 40%, transparent),
				transparent 45%
			),
			linear-gradient(145deg, var(--color-bg-elevated), var(--color-bg-sunken));
	}
	.cover-fallback span {
		color: var(--accent);
		font-family: var(--font-display);
		font-size: 3rem;
	}
	.body {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
		padding: var(--space-5);
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-3);
		color: var(--accent);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.kicker {
		margin-right: auto;
	}
	.live {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.15rem 0.55rem;
		border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
		border-radius: var(--radius-full);
		color: var(--color-heading);
		font-size: 0.68rem;
		letter-spacing: 0.06em;
	}
	time {
		color: var(--color-text-muted);
		letter-spacing: 0.04em;
	}
	.title {
		margin: var(--space-4) 0 var(--space-3);
		font-size: clamp(1.35rem, 2.4vw, 1.8rem);
	}
	.stretched {
		color: var(--color-heading);
	}
	.stretched::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		border-radius: inherit;
	}
	.stretched:hover {
		text-decoration: none;
	}
	@supports selector(:has(*)) {
		.stretched:focus-visible {
			outline: none;
		}
		.card:has(.stretched:focus-visible) {
			outline: 2px solid var(--accent);
			outline-offset: 3px;
		}
	}
	.excerpt {
		display: -webkit-box;
		margin: 0;
		overflow: hidden;
		color: var(--color-text);
		font-size: 0.96rem;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 4;
		line-clamp: 4;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: var(--space-5) 0 0;
		padding: 0;
		list-style: none;
	}
	.chips li {
		padding: 0.28rem 0.6rem;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-full);
		color: var(--color-text-muted);
		font-size: 0.72rem;
	}
	.chips li.field {
		border-color: color-mix(in srgb, var(--accent) 45%, var(--color-border));
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		color: var(--color-heading);
	}
	.read {
		align-self: flex-start;
		margin-top: auto;
		padding-top: var(--space-5);
		color: var(--accent);
		font-size: var(--text-sm);
		font-weight: 700;
	}
	.read span {
		display: inline-block;
		transition: transform 200ms ease;
	}
	.card:hover .read span {
		transform: translateX(4px);
	}
	.featured {
		grid-column: span 2;
	}
	.featured .title {
		font-size: clamp(1.6rem, 3vw, 2.3rem);
	}
	.lead {
		background:
			radial-gradient(
				circle at 100% 0%,
				color-mix(in srgb, var(--accent) 22%, transparent),
				transparent 55%
			),
			var(--color-bg-raised);
	}
	.lead .body {
		padding: clamp(1.5rem, 4vw, 3rem);
	}
	.lead .excerpt {
		max-width: 42rem;
		font-size: 1.05rem;
	}
	@media (min-width: 761px) {
		.featured:not(.lead) {
			display: grid;
			grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
		}
		.featured .cover {
			aspect-ratio: auto;
			min-height: 100%;
			border-right: 1px solid var(--color-border);
			border-bottom: 0;
		}
		.featured .body {
			padding: var(--space-6);
		}
		.featured .excerpt {
			-webkit-line-clamp: 6;
			line-clamp: 6;
		}
	}
	@media (max-width: 600px) {
		.featured {
			grid-column: auto;
		}
	}
</style>
