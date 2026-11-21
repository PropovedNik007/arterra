<script>
	import { base } from '$app/paths';
	import Breadcrumb from './Breadcrumb.svelte';

	let { item, parentLabel, parentHref, extraMeta = [] } = $props();
</script>

<article class="shell page" data-section={item.section}>
	<Breadcrumb items={[{ label: parentLabel, href: parentHref }, { label: item.title }]} />
	<header class="article-header">
		<p class="eyebrow">{parentLabel}</p>
		<h1>{item.title}</h1>
		<p class="lede">{item.excerpt}</p>
		<div class="article-meta">
			{#if item.date}<time datetime={item.date}>{item.date}</time>{/if}
			{#each extraMeta as value (value)}<span>{value}</span>{/each}
		</div>
	</header>

	{#if item.cover}
		<img class="hero-image" src={`${base}/${item.cover}`} alt="" />
	{/if}

	<div class="article-grid">
		<div class="prose">{@html item.html}</div>
		<aside>
			<p class="aside-label">Filed under</p>
			<ul>
				{#each item.tags as tag (tag)}<li>{tag}</li>{/each}
			</ul>
			<a class="button" href={`${base}${parentHref}`}>Back to {parentLabel}</a>
		</aside>
	</div>
</article>

<style>
	.article-header {
		max-width: 55rem;
		padding: clamp(2rem, 5vw, 4rem) 0;
	}
	h1 {
		margin-bottom: var(--space-5);
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
		grid-template-columns: minmax(0, var(--reading-width)) 14rem;
		gap: clamp(3rem, 8vw, 8rem);
		align-items: start;
	}
	.prose {
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
		text-decoration: underline;
		text-underline-offset: 0.2em;
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
		top: 8rem;
		padding-left: var(--space-5);
		border-left: 1px solid var(--color-border);
	}
	.aside-label {
		margin-top: 0;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	aside ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0 0 var(--space-6);
		padding: 0;
		list-style: none;
	}
	aside li {
		color: var(--color-text);
		font-size: var(--text-sm);
	}
	@media (max-width: 780px) {
		.article-grid {
			grid-template-columns: 1fr;
		}
		aside {
			position: static;
			padding: var(--space-5) 0 0;
			border-top: 1px solid var(--color-border);
			border-left: 0;
		}
	}
</style>
