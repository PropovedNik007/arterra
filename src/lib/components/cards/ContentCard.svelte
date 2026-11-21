<script>
	// @ts-nocheck -- item shape is normalized by the build-time content loader
	import { base } from '$app/paths';
	import { itemPath, DISCIPLINE_META } from '$lib/design/sections.js';

	let { item, featured = false } = $props();
	let href = $derived(`${base}${itemPath(item)}`);
	let meta = $derived(
		item.section === 'sport' && item.discipline ? DISCIPLINE_META[item.discipline] : null
	);
</script>

<article class:featured class="card" data-section={item.section}>
	<a class="cover" {href} aria-label={`Read ${item.title}`}>
		{#if item.cover}
			<img src={`${base}/${item.cover}`} alt="" loading="lazy" decoding="async" />
		{:else}
			<div class="cover-fallback" aria-hidden="true">
				<span>{meta?.icon ?? (item.section === 'diy' ? '✦' : '↗')}</span>
			</div>
		{/if}
	</a>
	<div class="body">
		<div class="meta">
			<span>{meta ? `${meta.icon} ${meta.label}` : item.section}</span>
			{#if item.date}<time datetime={item.date}>{item.date.slice(0, 4)}</time>{/if}
		</div>
		<h2><a {href}>{item.title}</a></h2>
		<p>{item.excerpt}</p>
		{#if item.tags.length}
			<ul class="tags" aria-label="Technologies and topics">
				{#each item.tags.slice(0, 5) as tag (tag)}<li>{tag}</li>{/each}
			</ul>
		{/if}
		<a class="read" {href}>View case study <span aria-hidden="true">→</span></a>
	</div>
</article>

<style>
	.card {
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
	.card:hover {
		transform: translateY(-5px);
		border-color: color-mix(in srgb, var(--accent) 55%, var(--color-border));
	}
	.cover {
		display: block;
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
		padding: var(--space-5);
	}
	.meta {
		display: flex;
		justify-content: space-between;
		gap: var(--space-3);
		color: var(--accent);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	h2 {
		margin: var(--space-4) 0 var(--space-3);
		font-size: clamp(1.35rem, 2.4vw, 1.8rem);
	}
	h2 a {
		color: var(--color-heading);
	}
	h2 a:hover {
		text-decoration: none;
	}
	p {
		margin: 0;
		color: var(--color-text);
		font-size: 0.96rem;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: var(--space-5) 0 0;
		padding: 0;
		list-style: none;
	}
	.tags li {
		padding: 0.3rem 0.62rem;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-full);
		color: var(--color-text-muted);
		font-size: 0.72rem;
	}
	.read {
		align-self: flex-start;
		margin-top: auto;
		padding-top: var(--space-6);
		color: var(--accent);
		font-size: var(--text-sm);
		font-weight: 700;
	}
	.featured {
		grid-column: span 2;
	}
	.featured .cover {
		aspect-ratio: 2 / 1;
	}
	@media (max-width: 600px) {
		.featured {
			grid-column: auto;
		}
	}
</style>
