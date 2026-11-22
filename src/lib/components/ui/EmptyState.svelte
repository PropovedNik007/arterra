<script>
	/** Honest "nothing here (yet)" panel shared by index and filter results. */
	let { icon = '✦', title, headingLevel = 2, children = undefined } = $props();
</script>

<div class="empty">
	<span class="icon" aria-hidden="true">{icon}</span>
	<svelte:element this={`h${headingLevel}`} class="title">{title}</svelte:element>
	{#if children}<div class="content">{@render children()}</div>{/if}
</div>

<style>
	.empty {
		padding: clamp(2.5rem, 7vw, 5rem) clamp(1.25rem, 4vw, 3rem);
		border: 1px dashed var(--color-border-strong);
		border-radius: var(--radius-lg);
		text-align: center;
	}
	.icon {
		color: var(--accent);
		font-size: 2.5rem;
		line-height: 1;
	}
	.title {
		margin: var(--space-4) 0 var(--space-2);
		font-size: var(--heading-section);
	}
	.content {
		max-width: 34rem;
		margin: 0 auto;
		color: var(--color-text-muted);
	}
	.content :global(p) {
		margin: 0 0 var(--space-5);
	}
	.content :global(.button) {
		margin-top: var(--space-2);
	}
</style>
