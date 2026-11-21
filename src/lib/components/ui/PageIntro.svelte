<script>
	let { eyebrow, title, description, children = undefined } = $props();
</script>

<header class="page-intro">
	<p class="eyebrow">{eyebrow}</p>
	<h1>{title}</h1>
	{#if description}<p class="lede">{description}</p>{/if}
	{#if children}<div class="actions">{@render children()}</div>{/if}
</header>

<style>
	.page-intro {
		max-width: 55rem;
		margin-bottom: clamp(3rem, 7vw, 5.5rem);
	}
	h1 {
		margin-bottom: var(--space-5);
	}
	.lede {
		margin: 0;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin-top: var(--space-6);
	}
</style>
