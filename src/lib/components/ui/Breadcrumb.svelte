<script>
	import { base } from '$app/paths';
	let { items = [] } = $props();
</script>

<nav class="breadcrumb" aria-label="Breadcrumb">
	<ol>
		<li><a href="{base}/">Home</a></li>
		{#each items as item, index (item.label)}
			<li>
				<span aria-hidden="true">/</span>
				{#if item.href && index < items.length - 1}
					<a href={`${base}${item.href}`}>{item.label}</a>
				{:else}
					<span aria-current="page">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	ol {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0 0 var(--space-6);
		padding: 0;
		list-style: none;
		font-size: var(--text-sm);
	}
	li {
		display: flex;
		gap: var(--space-2);
		color: var(--color-text-muted);
	}
	a {
		color: var(--color-text-muted);
	}
	[aria-current='page'] {
		color: var(--color-text);
	}
</style>
