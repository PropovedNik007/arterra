<script>
	import { afterNavigate, goto } from '$app/navigation';
	import Breadcrumb from '#lib/components/ui/Breadcrumb.svelte';
	import PageIntro from '#lib/components/ui/PageIntro.svelte';
	import FilterBar from '#lib/components/ui/FilterBar.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import ContentCard from '#lib/components/cards/ContentCard.svelte';
	import GraphView from '#lib/graph/GraphView.svelte';
	import { FIELDS, TAG_FIELDS } from '#lib/graph/taxonomy.js';
	import { tagLabel } from '#lib/design/sections.js';

	let { data } = $props();

	/** @type {string | null} */
	let field = $state(null);
	/** @type {string | null} */
	let tag = $state(null);
	let query = $state('');
	let toolsOpen = $state(false);
	let ready = false;

	let knownFields = $derived(
		new Set(data.fieldGroups.flatMap((group) => group.fields.map((option) => option.id)))
	);
	let total = $derived(data.items.length);
	let featured = $derived(data.items.filter((item) => item.featured));
	let rest = $derived(data.items.filter((item) => !item.featured));
	// The wide card needs an image to carry it; give it to the first featured
	// project that has a cover so a cover-less lead doesn't leave an empty panel.
	let wideSlug = $derived(featured.find((item) => item.cover)?.slug);

	/** @param {string | null} id */
	const fieldLabel = (id) => FIELDS.find((option) => option.id === id)?.label ?? id;

	let needle = $derived(query.trim().toLowerCase());
	let filtering = $derived(Boolean(field || tag || needle));
	let results = $derived(
		data.items.filter((item) => {
			if (field && !item.fields.includes(field)) return false;
			if (tag && !item.tags.some((value) => value.toLowerCase() === tag?.toLowerCase())) {
				return false;
			}
			if (!needle) return true;
			const haystack = [
				item.title,
				item.excerpt,
				...item.tags,
				...item.fields.map((id) => fieldLabel(id))
			]
				.join(' ')
				.toLowerCase();
			return haystack.includes(needle);
		})
	);
	let activeSummary = $derived(
		[
			field && `field “${fieldLabel(field)}”`,
			tag && `tool “${tagLabel(tag)}”`,
			needle && `search “${query.trim()}”`
		]
			.filter(Boolean)
			.join(', ')
	);

	/**
	 * Apply ?field=, ?tag= and ?q= from the current URL. Read from
	 * window.location (not $page.url) so prerendering never touches the query.
	 * Runs after the first mount and after same-route navigations, e.g. a click
	 * on a field node in the mini graph below.
	 */
	function applyLocation() {
		const params = new URLSearchParams(window.location.search);
		const fieldParam = params.get('field');
		const tagParam = params.get('tag')?.trim();
		field = fieldParam && knownFields.has(fieldParam) ? fieldParam : null;
		tag = null;
		if (tagParam) {
			const lower = tagParam.toLowerCase();
			const tool = data.tools.find((option) => option.tag.toLowerCase() === lower);
			const mapped = TAG_FIELDS[lower] ?? [];
			if (tool) {
				tag = tool.tag;
				toolsOpen = true;
			} else if (!field && mapped.length === 1 && knownFields.has(mapped[0])) {
				// A tag that names a field of work (e.g. "RAG") selects that field.
				field = mapped[0];
			} else if (
				data.items.some((item) => item.tags.some((value) => value.toLowerCase() === lower))
			) {
				tag = tagParam;
				toolsOpen = true;
			}
		}
		query = params.get('q') ?? '';
		ready = true;
	}

	// Shallow navigations are syncUrl() mirroring the filters; re-applying them
	// would trim the search input while typing.
	afterNavigate((navigation) => {
		if (!navigation.shallow) applyLocation();
	});

	/** Mirror the filter state in the URL without adding history entries. */
	function syncUrl() {
		if (!ready) return;
		const url = new URL(window.location.href);
		for (const [key, value] of [
			['field', field],
			['tag', tag],
			['q', query.trim()]
		]) {
			if (value) url.searchParams.set(/** @type {string} */ (key), value);
			else url.searchParams.delete(/** @type {string} */ (key));
		}
		if (url.href === window.location.href) return;
		goto(url, { shallow: true, replace: true }).catch(() => {
			// Router not ready yet (very early input); the filter still applies.
		});
	}

	function reset() {
		field = null;
		tag = null;
		query = '';
		syncUrl();
	}
</script>

<svelte:head>
	<title>Projects — Artur Sogomonyan</title>
	<meta
		name="description"
		content="Applied AI, machine learning, computer vision, 3D toolpath, RAG, and full-stack engineering projects by Artur Sogomonyan."
	/>
</svelte:head>

<div class="shell page" data-section="projects">
	<Breadcrumb items={[{ label: 'Projects' }]} />
	<PageIntro
		eyebrow="Selected systems"
		title="Projects"
		description="Case studies across applied AI, computer vision, 3D geometry and toolpaths for multi-axis manufacturing, document intelligence, data products, and the interfaces that make them useful."
	/>

	<FilterBar
		label="Filter projects"
		fieldGroups={data.fieldGroups}
		tools={data.tools}
		bind:field
		bind:tag
		bind:query
		bind:toolsOpen
		onchange={syncUrl}
	/>

	<div class="status">
		<p aria-live="polite" aria-atomic="true">
			{#if filtering}
				<strong>{results.length}</strong> of {total}
				{total === 1 ? 'project' : 'projects'} match {activeSummary}
			{:else}
				<strong>{total}</strong> projects · {featured.length} featured
			{/if}
		</p>
		{#if filtering}
			<button type="button" class="chip-toggle" onclick={reset}>Clear filters</button>
		{/if}
	</div>

	{#if filtering}
		<section aria-labelledby="results-heading">
			<h2 id="results-heading" class="visually-hidden">Matching projects</h2>
			{#if results.length}
				<div class="grid">
					{#each results as item (item.slug)}<ContentCard {item} headingLevel={3} />{/each}
				</div>
			{:else}
				<EmptyState icon="∅" title="No projects match" headingLevel={3}>
					<p>
						Nothing in this portfolio matches {activeSummary}. Try a broader search or another field
						of work.
					</p>
					<button type="button" class="button primary" onclick={reset}>Reset filters</button>
				</EmptyState>
			{/if}
		</section>
	{:else}
		{#if featured.length}
			<section class="group" aria-labelledby="featured-heading">
				<div class="section-head">
					<h2 id="featured-heading">Featured</h2>
					<p>Start here: the most complete case studies.</p>
				</div>
				<div class="grid">
					{#each featured as item (item.slug)}
						<ContentCard {item} featured={item.slug === wideSlug} headingLevel={3} />
					{/each}
				</div>
			</section>
		{/if}
		{#if rest.length}
			<section class="group" aria-labelledby="more-heading">
				<div class="section-head">
					<h2 id="more-heading">More projects</h2>
					<p>Hackathon entries, university and client work, and earlier builds.</p>
				</div>
				<div class="grid">
					{#each rest as item (item.slug)}<ContentCard {item} headingLevel={3} />{/each}
				</div>
			</section>
		{/if}
	{/if}

	<section class="map">
		<GraphView graphData={data.graphData} compact title="How the projects connect" />
	</section>
</div>

<style>
	.status {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-6);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.status p {
		margin: 0;
	}
	.status strong {
		color: var(--color-heading);
	}
	.group + .group {
		margin-top: var(--space-8);
	}
	.map {
		margin-top: var(--space-9);
	}
</style>
