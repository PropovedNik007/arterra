<script>
	import { base } from '$app/paths';
	/** Trail after "Home": [{ label, href? }]; the last item is the current page. */
	let { items = [] } = $props();
</script>

<nav class="breadcrumb" aria-label="Breadcrumb">
	<ol>
		<li><a href="{base}/">Home</a></li>
		{#each items as item, index (index)}
			<li>
				<span class="separator" aria-hidden="true">›</span>
				{#if item.href && index < items.length - 1}
					<a href={`${base}${item.href}`}>{item.label}</a>
				{:else}
					<span class="current" aria-current="page">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	ol {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-2);
		margin: 0 0 var(--space-6);
		padding: 0;
		list-style: none;
		font-size: var(--text-sm);
	}
	li {
		display: flex;
		min-width: 0;
		max-width: 100%;
		gap: var(--space-2);
		color: var(--color-text-muted);
	}
	.separator {
		color: var(--color-border-strong);
	}
	a {
		color: var(--color-text-muted);
	}
	a:hover {
		color: var(--color-heading);
	}
	.current {
		overflow: hidden;
		max-width: 32ch;
		color: var(--color-text);
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
