<script>
	import { sitePath } from '#lib/paths.js';
	import Breadcrumb from '#lib/components/ui/Breadcrumb.svelte';
	import PageIntro from '#lib/components/ui/PageIntro.svelte';
	import GraphView from '#lib/graph/GraphView.svelte';
	import { formatNoteDate } from '#lib/design/sections.js';
	let { data } = $props();
</script>

<svelte:head
	><title>Sport — Artur Sogomonyan</title><meta
		name="description"
		content="Hiking, boxing, diving, and table-tennis notes by Artur Sogomonyan."
	/></svelte:head
>

<div class="shell page" data-section="sport">
	<Breadcrumb items={[{ label: 'Sport' }]} />
	<PageIntro
		eyebrow="Field notes"
		title="Sport"
		description="Four disciplines, one reason to keep notes: pay attention, remember the lesson, and arrive better prepared next time."
	/>

	<section aria-labelledby="disciplines-heading">
		<div class="section-head">
			<h2 id="disciplines-heading">Disciplines</h2>
			<p>
				{data.total
					? `${data.total} published ${data.total === 1 ? 'note' : 'notes'} so far`
					: 'No notes published yet'}
			</p>
		</div>
		<ul class="discipline-grid">
			{#each data.disciplines as discipline (discipline.id)}
				<li>
					<a class:empty={!discipline.count} href={sitePath(discipline.path)}>
						<span class="icon" aria-hidden="true">{discipline.icon}</span>
						<div class="text">
							<p class="count">
								{discipline.count
									? `${discipline.count} published ${discipline.count === 1 ? 'note' : 'notes'}`
									: 'Nothing published yet'}
							</p>
							<h3>{discipline.label}</h3>
							<p class="description">{discipline.description}</p>
							{#if discipline.latest}
								<p class="latest">
									<span>Latest</span>
									<strong>{discipline.latest.title}</strong>
									<time datetime={discipline.latest.date}
										>{formatNoteDate(discipline.latest.date)}</time
									>
								</p>
							{/if}
						</div>
						<b class="arrow" aria-hidden="true">→</b>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	{#if data.graphData.nodes.length > 1}
		<section class="map">
			<GraphView graphData={data.graphData} compact title="How the sport notes connect" />
		</section>
	{/if}
</div>

<style>
	.discipline-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.discipline-grid li {
		display: flex;
	}
	.discipline-grid a {
		display: grid;
		flex: 1;
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: var(--space-5);
		align-items: start;
		min-height: 14rem;
		padding: var(--space-6);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg-raised);
		color: var(--color-text);
		transition:
			transform 180ms ease,
			border-color 180ms ease;
	}
	.discipline-grid a.empty {
		border-style: dashed;
		background: transparent;
	}
	.discipline-grid a:hover {
		transform: translateY(-4px);
		border-color: var(--accent);
		text-decoration: none;
	}
	.icon {
		font-size: 2rem;
		line-height: 1;
	}
	.count {
		margin: 0 0 var(--space-4);
		color: var(--accent);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.empty .count {
		color: var(--color-text-muted);
	}
	h3 {
		margin-bottom: var(--space-3);
		font-size: clamp(1.6rem, 3vw, 2.2rem);
	}
	.description {
		margin: 0;
		color: var(--color-text-muted);
	}
	.latest {
		display: grid;
		gap: 0.1rem;
		margin: var(--space-5) 0 0;
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
		font-size: var(--text-sm);
		line-height: 1.4;
	}
	.latest span {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.latest strong {
		color: var(--color-heading);
		font-weight: 600;
	}
	.latest time {
		color: var(--color-text-muted);
	}
	.arrow {
		color: var(--accent);
		transition: transform 180ms ease;
	}
	.discipline-grid a:hover .arrow {
		transform: translateX(4px);
	}
	.map {
		margin-top: var(--space-9);
	}
	@media (max-width: 700px) {
		.discipline-grid {
			grid-template-columns: 1fr;
		}
		.discipline-grid a {
			min-height: 0;
			gap: var(--space-4);
			padding: var(--space-5);
		}
	}
</style>
