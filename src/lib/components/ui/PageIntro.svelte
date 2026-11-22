<script>
	import ToolpathOrnament from './ToolpathOrnament.svelte';

	/**
	 * @type {{
	 *   eyebrow: string,
	 *   title: string,
	 *   description?: string,
	 *   ornament?: 'interlace' | 'star' | null,
	 *   children?: import('svelte').Snippet
	 * }}
	 */
	let {
		eyebrow,
		title,
		description = undefined,
		ornament = 'interlace',
		children = undefined
	} = $props();
</script>

<header class="page-intro" class:ruled={ornament === 'interlace'}>
	{#if ornament === 'star'}
		<div class="star-slot">
			<ToolpathOrnament preset="star" />
		</div>
	{/if}
	<p class="eyebrow">{eyebrow}</p>
	<h1>{title}</h1>
	{#if description}<p class="lede">{description}</p>{/if}
	{#if children}<div class="actions">{@render children()}</div>{/if}
</header>
{#if ornament === 'interlace'}
	<!-- A khachkar border across the shell: the divider between intro and page. -->
	<div class="intro-rule">
		<ToolpathOrnament preset="intro-band" tone="muted" fit="slice" opacity={0.4} />
	</div>
{/if}

<style>
	/* Every intro ends the same distance above the page content. With the
	   khachkar rule (interlace), the rule sits centred in that gap; star and
	   plain intros have no rule and keep the same total gap. */
	.page-intro {
		position: relative;
		isolation: isolate;
		max-width: 55rem;
		margin-bottom: calc(2 * var(--rule-space) + 2.5rem);
	}
	.page-intro.ruled {
		margin-bottom: var(--rule-space);
	}
	.page-intro,
	.intro-rule {
		--rule-space: clamp(var(--space-6), 3.5vw, 2.75rem);
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
	.intro-rule {
		position: relative;
		isolation: isolate;
		height: 2.5rem;
		margin-bottom: var(--rule-space);
		pointer-events: none;
	}
	.intro-rule :global(.toolpath-ornament) {
		--ornament-z: 0;
	}
	/* Star: beside the intro where the shell has room, otherwise faint in the
	   top-right corner, clear of the lede. */
	.star-slot {
		position: absolute;
		top: 0;
		right: 0;
		width: min(20rem, 48%);
		aspect-ratio: 1;
		pointer-events: none;
	}
	@media (max-width: 600px) {
		.star-slot {
			top: -1.25rem;
			width: 9rem;
		}
	}
	@media (min-width: 1240px) {
		.star-slot {
			top: 50%;
			right: auto;
			left: calc(100% + 1rem);
			width: min(20rem, calc(100vw - 55rem - 5rem));
			translate: 0 -50%;
			/* Clear of the text here, so it can be a little stronger. */
			--ornament-opacity: 0.18;
		}
	}
</style>
