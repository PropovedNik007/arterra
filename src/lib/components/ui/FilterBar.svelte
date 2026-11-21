<script>
	import { tagLabel } from '$lib/design/sections.js';
	/**
	 * Primary filter by field of work (grouped by domain), free-text search, and
	 * a collapsed secondary filter by tool. State is owned by the caller through
	 * bindable props; `onchange` fires after every user-driven change.
	 * @type {{
	 *   fieldGroups?: { id: string, label: string, fields: { id: string, label: string, description: string, count: number }[] }[],
	 *   tools?: { tag: string, count: number }[],
	 *   field?: string | null,
	 *   tag?: string | null,
	 *   query?: string,
	 *   toolsOpen?: boolean,
	 *   label?: string,
	 *   itemNoun?: [string, string],
	 *   searchPlaceholder?: string,
	 *   onchange?: () => void
	 * }}
	 */
	let {
		fieldGroups = [],
		tools = [],
		field = $bindable(null),
		tag = $bindable(null),
		query = $bindable(''),
		toolsOpen = $bindable(false),
		label = 'Filter',
		itemNoun = ['project', 'projects'],
		searchPlaceholder = 'Search by name, tool or topic',
		onchange = () => {}
	} = $props();

	const uid = $props.id();
	const searchId = `filter-${uid}`;

	/** @param {number} count */
	const noun = (count) => (count === 1 ? itemNoun[0] : itemNoun[1]);

	/** @param {string} id */
	function toggleField(id) {
		field = field === id ? null : id;
		onchange();
	}

	/** @param {string} value */
	function toggleTag(value) {
		tag = tag?.toLowerCase() === value.toLowerCase() ? null : value;
		onchange();
	}
</script>

<section class="filter-bar" aria-label={label}>
	<div class="search">
		<label for={searchId}>Search</label>
		<div class="search-input">
			<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"
				><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg
			>
			<input
				id={searchId}
				type="search"
				autocomplete="off"
				spellcheck="false"
				placeholder={searchPlaceholder}
				bind:value={query}
				oninput={onchange}
			/>
		</div>
	</div>

	<div class="fields" role="group" aria-labelledby={`${searchId}-fields`}>
		<p class="label" id={`${searchId}-fields`}>Field of work</p>
		<div class="groups">
			{#each fieldGroups as group (group.id)}
				<div class="group" role="group" aria-labelledby={`${searchId}-${group.id}`}>
					<p class="domain" id={`${searchId}-${group.id}`}>{group.label}</p>
					<ul>
						{#each group.fields as option (option.id)}
							<li>
								<button
									type="button"
									class="chip"
									aria-pressed={field === option.id}
									title={option.description}
									onclick={() => toggleField(option.id)}
								>
									{option.label}<span class="count"
										><span class="visually-hidden">, </span>{option.count}<span
											class="visually-hidden"
										>
											{noun(option.count)}</span
										></span
									>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>

	{#if tools.length}
		<details class="tools" bind:open={toolsOpen}>
			<summary>
				<span>Filter by tool</span>
				<span class="summary-meta">
					{#if tag}<span class="active-tag">{tagLabel(tag)}</span>{:else}{tools.length} tools &amp; topics{/if}
				</span>
			</summary>
			<ul>
				{#each tools as option (option.tag)}
					<li>
						<button
							type="button"
							class="chip small"
							aria-pressed={tag?.toLowerCase() === option.tag.toLowerCase()}
							onclick={() => toggleTag(option.tag)}
						>
							{tagLabel(option.tag)}{#if option.count > 1}<span class="count"
									><span class="visually-hidden">, </span>{option.count}<span
										class="visually-hidden"
									>
										{noun(option.count)}</span
									></span
								>{/if}
						</button>
					</li>
				{/each}
			</ul>
		</details>
	{/if}
</section>

<style>
	.filter-bar {
		display: grid;
		gap: var(--space-5);
		margin-bottom: var(--space-6);
		padding: var(--space-5);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-bg-raised) 75%, transparent);
	}
	.search label,
	.label {
		display: block;
		margin: 0 0 var(--space-2);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.search-input {
		position: relative;
		max-width: 32rem;
	}
	.search-input svg {
		position: absolute;
		top: 50%;
		left: 0.95rem;
		width: 1rem;
		height: 1rem;
		fill: none;
		stroke: var(--color-text-muted);
		stroke-width: 1.8;
		stroke-linecap: round;
		transform: translateY(-50%);
		pointer-events: none;
	}
	input {
		width: 100%;
		min-height: 2.75rem;
		padding: 0.6rem 1rem 0.6rem 2.6rem;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-full);
		background: var(--color-bg-sunken);
		color: var(--color-heading);
		font-size: var(--text-base);
	}
	input::placeholder {
		color: var(--color-text-muted);
	}
	input:focus-visible {
		outline-offset: 2px;
		border-color: var(--accent);
	}
	.groups {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4) var(--space-7);
	}
	.group {
		flex: 0 1 auto;
		min-width: 0;
	}
	.domain {
		margin: 0 0 var(--space-2);
		color: var(--accent);
		font-size: var(--text-xs);
		font-weight: 650;
	}
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 2.25rem;
		padding: 0.4rem 0.8rem;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--color-text);
		cursor: pointer;
		font-size: var(--text-sm);
		line-height: 1.2;
		transition:
			border-color 160ms ease,
			background 160ms ease,
			color 160ms ease;
	}
	.chip.small {
		min-height: 2rem;
		padding: 0.3rem 0.7rem;
		font-size: var(--text-xs);
	}
	.chip:hover {
		border-color: var(--accent);
		color: var(--color-heading);
	}
	.chip[aria-pressed='true'] {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		color: var(--color-heading);
	}
	.chip[aria-pressed='true']::before {
		content: '✓';
		color: var(--accent);
		font-weight: 700;
	}
	.count {
		min-width: 1.3rem;
		padding: 0.05rem 0.35rem;
		border-radius: var(--radius-full);
		background: var(--color-bg-elevated);
		color: var(--color-text-muted);
		font-size: 0.7rem;
		font-variant-numeric: tabular-nums;
		text-align: center;
	}
	.tools {
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-4);
	}
	summary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-3);
		width: fit-content;
		max-width: 100%;
		color: var(--color-heading);
		cursor: pointer;
		font-size: var(--text-sm);
		font-weight: 650;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary::before {
		content: '+';
		display: inline-grid;
		place-items: center;
		width: 1.4rem;
		height: 1.4rem;
		border: 1px solid var(--color-border-strong);
		border-radius: 50%;
		color: var(--accent);
		font-weight: 700;
		line-height: 1;
	}
	.tools[open] summary::before {
		content: '−';
	}
	summary:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 4px;
		border-radius: var(--radius-sm);
	}
	.summary-meta {
		color: var(--color-text-muted);
		font-weight: 400;
	}
	.active-tag {
		padding: 0.1rem 0.5rem;
		border-radius: var(--radius-full);
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		color: var(--color-heading);
	}
	.tools ul {
		margin-top: var(--space-4);
	}
	@media (max-width: 520px) {
		.filter-bar {
			padding: var(--space-4);
		}
	}
</style>
