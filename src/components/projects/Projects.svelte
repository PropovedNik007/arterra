<script>
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import graphData from '../../lib/graphs/graph.json';

	const nodes = graphData.nodes
		.filter((n) => n.folder === 'Projects' && n.type === 'file')
		.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

	/** @param {any} node */
	function open(node) {
		if (node.link) window.open(node.link, '_blank');
		else goto(`${base}/projects/${node.id}`);
	}
</script>

<div class="projects">
	{#each nodes as node (node.id)}
		<article class="project-card" onclick={() => open(node)} role="button" tabindex="0"
			onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && open(node)}>
			<div class="cover">
				{#if node.img}
					<img src="{base}/{node.img}" alt={node.label} loading="lazy" decoding="async" />
				{/if}
			</div>
			<div class="body">
				<h3>{node.label}</h3>
				<p>{node.description || 'No description available.'}</p>
				{#if node.tags && node.tags.length}
					<div class="tech">
						{#each node.tags.slice(0, 5) as tag}
							<span>{tag}</span>
						{/each}
					</div>
				{/if}
				<span class="more">{node.link ? 'Visit ↗' : 'Read more →'}</span>
			</div>
		</article>
	{/each}
</div>

<style>
	.projects {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.project-card {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg-raised);
		overflow: hidden;
		cursor: pointer;
		text-align: left;
		transition:
			transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
			border-color 0.28s ease,
			box-shadow 0.28s ease,
			filter 0.28s ease,
			opacity 0.28s ease;
	}
	.project-card:hover,
	.project-card:focus-visible {
		transform: translateY(-6px);
		border-color: color-mix(in srgb, var(--accent) 50%, var(--color-border));
		box-shadow: 0 22px 48px -26px rgba(0, 0, 0, 0.6);
		outline: none;
	}
	/* dim every other card while one is hovered (old-version behaviour) */
	.projects:hover .project-card:not(:hover),
	.projects:focus-within .project-card:not(:focus-within):not(:hover) {
		filter: brightness(0.5) saturate(0.85);
		opacity: 0.72;
	}

	.cover {
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background:
			radial-gradient(120% 140% at 12% 0%, color-mix(in srgb, var(--accent) 45%, transparent), transparent 60%),
			linear-gradient(135deg, var(--color-bg-sunken), var(--color-bg-raised));
		border-bottom: 1px solid var(--color-border);
	}
	.cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.project-card:hover .cover img {
		transform: scale(1.06);
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 1.25rem 1.35rem 1.4rem;
		flex: 1;
	}
	.body h3 {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 500;
		color: var(--color-heading);
		margin: 0;
	}
	.body p {
		font-size: 0.98rem;
		line-height: 1.55;
		color: var(--color-text);
		margin: 0;
	}
	.tech {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.15rem;
	}
	.tech span {
		font-size: 0.76rem;
		font-weight: 600;
		padding: 0.28rem 0.65rem;
		border-radius: var(--radius-full);
		color: var(--accent-coral-soft);
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
	}
	.more {
		margin-top: auto;
		padding-top: 0.6rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--accent-coral-soft);
		transition: transform 0.2s ease;
	}
	.project-card:hover .more {
		transform: translateX(3px);
	}
</style>
