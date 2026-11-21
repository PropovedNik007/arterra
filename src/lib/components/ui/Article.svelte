<script>
	import { base } from '$app/paths';
	import Breadcrumb from './Breadcrumb.svelte';
	import GraphView from '$lib/graph/GraphView.svelte';
	import { FIELD_TAGS } from '$lib/graph/taxonomy.js';
	import { formatNoteDate, showsDate, tagLabel } from '$lib/design/sections.js';

	/**
	 * @typedef {object} ArticleContext
	 * @property {{ id: string, label: string, href: string }[]} fields
	 * @property {{ id: string, label: string, subtitle?: string, external?: string }[]} orgs
	 * @property {{ id: string, label: string, href: string | null, subtitle?: string, cover?: string, shared: string[] }[]} related
	 * @property {import('$lib/graph/build.js').GraphData | null} focusGraph
	 */

	/**
	 * @type {{
	 *   item: import('$lib/content/types.js').ContentItem,
	 *   parentLabel: string,
	 *   parentHref: string,
	 *   trail?: { label: string, href?: string }[],
	 *   extraMeta?: string[],
	 *   context?: ArticleContext
	 * }}
	 */
	let {
		item,
		parentLabel,
		parentHref,
		trail = undefined,
		extraMeta = [],
		context = { fields: [], orgs: [], related: [], focusGraph: null }
	} = $props();

	let isProject = $derived(item.section === 'projects');
	let crumbs = $derived([
		...(trail ?? [{ label: parentLabel, href: parentHref }]),
		{ label: item.title }
	]);
	// A project's `created` date is the note date, not the project period: never show it.
	let dated = $derived(showsDate(item.section) && Boolean(item.date));
	let tools = $derived(item.tags.filter((tag) => !FIELD_TAGS.has(String(tag).toLowerCase())));
	let liveHost = $derived.by(() => {
		if (!item.externalLink) return '';
		try {
			return new URL(item.externalLink).hostname.replace(/^www\./, '');
		} catch {
			return '';
		}
	});
	let noun = $derived(isProject ? 'project' : 'note');
</script>

<article class="shell page" data-section={item.section}>
	<Breadcrumb items={crumbs} />
	<header class="article-header">
		<p class="eyebrow">{parentLabel}</p>
		<h1>{item.title}</h1>
		<p class="lede">{item.excerpt}</p>
		{#if dated || extraMeta.length}
			<div class="article-meta">
				{#if dated}<time datetime={item.date}>{formatNoteDate(item.date)}</time>{/if}
				{#each extraMeta as value (value)}<span>{value}</span>{/each}
			</div>
		{/if}
		{#if item.externalLink}
			<div class="actions">
				<a class="button primary" href={item.externalLink} target="_blank" rel="noopener noreferrer"
					>{item.externalLive ? 'Visit live site' : 'Project website'}
					<span aria-hidden="true">↗</span><span class="visually-hidden">
						(opens in a new tab)</span
					></a
				>
				{#if liveHost}<span class="host">{liveHost}</span>{/if}
			</div>
		{/if}
	</header>

	{#if item.cover}
		<img class="hero-image" src={`${base}/${item.cover}`} alt="" />
	{/if}

	<div class="article-grid">
		<div class="prose">{@html item.html}</div>
		<aside aria-label={`About this ${noun}`}>
			{#if context.fields.length}
				<h2 class="aside-label">Fields</h2>
				<ul class="chips">
					{#each context.fields as field (field.id)}
						<li>
							<a
								class="chip field"
								href={`${base}${field.href}`}
								title={`Projects in ${field.label}`}>{field.label}</a
							>
						</li>
					{/each}
				</ul>
			{/if}
			{#if context.orgs.length}
				<h2 class="aside-label">Organisations</h2>
				<ul class="orgs">
					{#each context.orgs as org (org.id)}
						<li>
							{#if org.external}
								<a href={org.external} target="_blank" rel="noopener noreferrer"
									>{org.label} <span aria-hidden="true">↗</span></a
								>
							{:else}
								<strong>{org.label}</strong>
							{/if}
							{#if org.subtitle}<small>{org.subtitle}</small>{/if}
						</li>
					{/each}
				</ul>
			{/if}
			{#if tools.length}
				<h2 class="aside-label">{isProject ? 'Tools & topics' : 'Filed under'}</h2>
				<ul class="chips">
					{#each tools as tag (tag)}
						<li>
							{#if isProject}
								<a
									class="chip"
									href={`${base}/projects?tag=${encodeURIComponent(tag)}`}
									title={`Projects using ${tagLabel(tag)}`}>{tagLabel(tag)}</a
								>
							{:else}
								<span class="chip">{tagLabel(tag)}</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
			<a class="button back" href={`${base}${parentHref}`}
				><span aria-hidden="true">←</span> Back to {parentLabel}</a
			>
		</aside>
	</div>

	{#if item.gallery?.length}
		<section class="gallery" aria-labelledby="gallery-title">
			<h2 id="gallery-title" class="aside-label">Gallery</h2>
			<div class="gallery-grid">
				{#each item.gallery as image (image.src)}
					<figure>
						<img src={`${base}/${image.src}`} alt={image.alt} loading="lazy" decoding="async" />
						{#if image.caption}<figcaption>{image.caption}</figcaption>{/if}
					</figure>
				{/each}
			</div>
		</section>
	{/if}

	{#if context.related.length}
		<section class="related" aria-labelledby="related-heading">
			<div class="section-head">
				<h2 id="related-heading">Related work</h2>
				<p>Picked by shared fields, organisations, tools, and links.</p>
			</div>
			<ul class="related-list">
				{#each context.related as related (related.id)}
					<li>
						<a href={related.href ? `${base}${related.href}` : undefined}>
							{#if related.cover}
								<img src={`${base}/${related.cover}`} alt="" loading="lazy" decoding="async" />
							{:else}
								<span class="thumb" aria-hidden="true">↗</span>
							{/if}
							<span class="related-text">
								{#if related.subtitle}<small>{related.subtitle}</small>{/if}
								<strong>{related.label}</strong>
								<span class="shared">
									{related.shared.length
										? `Shares ${related.shared.join(' · ')}`
										: 'Directly linked'}
								</span>
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if context.focusGraph}
		<section class="connects">
			<GraphView
				graphData={context.focusGraph}
				focus={item.slug}
				compact
				title="How this connects"
			/>
		</section>
	{/if}
</article>

<style>
	.article-header {
		max-width: 55rem;
		padding: clamp(1rem, 4vw, 3rem) 0 clamp(2rem, 5vw, 4rem);
	}
	h1 {
		margin-bottom: var(--space-5);
		overflow-wrap: break-word;
	}
	.article-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin-top: var(--space-6);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.article-meta > *:not(:last-child)::after {
		content: '·';
		margin-left: var(--space-3);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3) var(--space-4);
		margin-top: var(--space-6);
	}
	.host {
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
	}
	.gallery {
		margin-top: clamp(3rem, 7vw, 6rem);
	}
	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
		gap: var(--space-5);
		margin-top: var(--space-4);
	}
	.gallery figure {
		margin: 0;
	}
	.gallery img {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 10;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg-raised);
		object-fit: cover;
	}
	.gallery figcaption {
		margin-top: var(--space-2);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		line-height: 1.5;
	}
	.hero-image {
		display: block;
		width: 100%;
		max-height: 38rem;
		margin-bottom: clamp(3rem, 7vw, 6rem);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		object-fit: cover;
	}
	.article-grid {
		display: grid;
		grid-template-columns: minmax(0, var(--reading-width)) minmax(14rem, 17rem);
		justify-content: space-between;
		gap: clamp(3rem, 7vw, 7rem);
		align-items: start;
	}
	.prose {
		min-width: 0;
		font-size: 1.06rem;
	}
	.prose :global(h1:first-child) {
		display: none;
	}
	.prose :global(h2) {
		margin: 2.8rem 0 1rem;
		font-size: 2rem;
	}
	.prose :global(h3) {
		margin: 2rem 0 0.8rem;
	}
	.prose :global(p),
	.prose :global(li) {
		line-height: 1.8;
	}
	.prose :global(a) {
		overflow-wrap: anywhere;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
	.prose :global(img) {
		max-width: 100%;
		height: auto;
	}
	.prose :global(pre) {
		overflow-x: auto;
		padding: var(--space-5);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-sunken);
	}
	aside {
		position: sticky;
		top: 6rem;
		padding-left: var(--space-5);
		border-left: 1px solid var(--color-border);
	}
	.aside-label {
		margin: 0 0 var(--space-3);
		color: var(--color-text-muted);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.12em;
		line-height: 1.4;
		text-transform: uppercase;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0 0 var(--space-6);
		padding: 0;
		list-style: none;
	}
	.chip {
		display: inline-block;
		padding: 0.3rem 0.65rem;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-full);
		color: var(--color-text);
		font-size: var(--text-xs);
		line-height: 1.3;
	}
	.chip.field {
		border-color: color-mix(in srgb, var(--accent) 45%, var(--color-border));
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		color: var(--color-heading);
	}
	a.chip:hover {
		border-color: var(--accent);
		color: var(--color-heading);
		text-decoration: none;
	}
	.orgs {
		display: grid;
		gap: var(--space-3);
		margin: 0 0 var(--space-6);
		padding: 0;
		list-style: none;
	}
	.orgs li {
		display: grid;
		gap: 0.1rem;
		font-size: var(--text-sm);
		line-height: 1.4;
	}
	.orgs strong,
	.orgs a {
		color: var(--color-heading);
		font-weight: 600;
	}
	.orgs small {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	.back {
		min-height: 2.5rem;
		padding: 0.5rem 1rem;
		font-size: var(--text-sm);
	}
	.related {
		margin-top: var(--space-9);
	}
	.related-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.related-list li {
		display: flex;
	}
	.related-list a {
		display: grid;
		flex: 1;
		grid-template-columns: 4.5rem minmax(0, 1fr);
		gap: var(--space-4);
		align-items: start;
		padding: var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg-raised);
		color: var(--color-text);
		transition:
			transform 180ms ease,
			border-color 180ms ease;
	}
	.related-list a:hover {
		transform: translateY(-3px);
		border-color: color-mix(in srgb, var(--accent) 55%, var(--color-border));
		text-decoration: none;
	}
	.related-list img,
	.thumb {
		width: 4.5rem;
		aspect-ratio: 1;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		object-fit: cover;
		background: var(--color-bg-sunken);
	}
	.thumb {
		display: grid;
		place-items: center;
		color: var(--accent);
		font-family: var(--font-display);
		font-size: 1.6rem;
	}
	.related-text {
		display: grid;
		gap: 0.2rem;
		min-width: 0;
		line-height: 1.35;
	}
	.related-text small {
		color: var(--accent);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.related-text strong {
		color: var(--color-heading);
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 500;
	}
	.shared {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	.connects {
		margin-top: var(--space-8);
	}
	@media (max-width: 780px) {
		.article-grid {
			grid-template-columns: minmax(0, 1fr);
		}
		aside {
			position: static;
			padding: var(--space-5) 0 0;
			border-top: 1px solid var(--color-border);
			border-left: 0;
		}
	}
</style>
