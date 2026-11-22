<script>
	import { sitePath } from '#lib/paths.js';
	import LandingCanvas from '../components/LandingCanvas.svelte';
	import ToolpathOrnament from '#lib/components/ui/ToolpathOrnament.svelte';
	import heroToolpath from '#lib/design/ornaments/hero.json';
	import ContentCard from '#lib/components/cards/ContentCard.svelte';
	import GraphView from '#lib/graph/GraphView.svelte';
	import SkillsRadar from '#lib/components/charts/SkillsRadar.svelte';
	import { cv, cvProjectPath } from '#lib/content/cv.js';

	let { data } = $props();

	const tabs = ['Projects', 'Education', 'Work Experience', 'Skills'];
	let activeTab = $state('Projects');
	/** @type {HTMLDivElement | undefined} */
	let tabAnchor;
	/** @type {HTMLButtonElement[]} */
	const tabButtons = $state([]);

	/**
	 * @param {number} count
	 * @param {string} noun
	 */
	function countOf(count, noun) {
		return `${count} ${noun}${count === 1 ? '' : 's'}`;
	}

	/**
	 * Channel counts: an honest empty state instead of "0 notes".
	 * @param {number} count
	 * @param {string} noun
	 */
	function plural(count, noun) {
		return count === 0 ? `No ${noun}s yet` : countOf(count, noun);
	}

	/** @param {string[]} words */
	function listOf(words) {
		if (words.length <= 1) return words.join('');
		return `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
	}

	let graphCounts = $derived.by(() => {
		/** @type {Record<string, number>} */
		const byKind = {};
		for (const node of data.graphData.nodes) byKind[node.kind] = (byKind[node.kind] ?? 0) + 1;
		return byKind;
	});

	let channels = $derived([
		{
			path: '/projects',
			number: '01',
			title: 'Projects',
			count: plural(data.counts.projects, 'project'),
			text: 'Applied AI, computer vision, 3D toolpaths, RAG, and full-stack systems.'
		},
		{
			path: '/diy',
			number: '02',
			title: 'DIY',
			count: plural(data.counts.diy, 'note'),
			text: 'Miniatures, 3D printing, and hands-on builds.'
		},
		{
			path: '/sport',
			number: '03',
			title: 'Sport',
			count: plural(data.counts.sport, 'note'),
			text: data.sportDisciplines.length
				? `Notes on ${listOf(data.sportDisciplines.map((label) => label.toLowerCase()))} so far.`
				: 'Hiking, boxing, diving, and table tennis.'
		},
		{
			path: '/insights',
			number: '04',
			title: 'Insights',
			count: `${plural(graphCounts.field ?? 0, 'field')} · ${plural(graphCounts.org ?? 0, 'organisation')}`,
			text: 'The knowledge graph, project flow, skills profile, and GitHub activity.'
		}
	]);

	function prefersReducedMotion() {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	/** @param {string} tab */
	function selectTab(tab) {
		activeTab = tab;
		requestAnimationFrame(() =>
			tabAnchor?.scrollIntoView({
				behavior: prefersReducedMotion() ? 'auto' : 'smooth',
				block: 'start'
			})
		);
	}

	/**
	 * WAI-ARIA tabs with automatic activation: arrows wrap, Home/End jump to the ends.
	 * @param {KeyboardEvent} event
	 * @param {number} index
	 */
	function onTabKeydown(event, index) {
		/** @type {number | undefined} */
		let next;
		if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
		else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = tabs.length - 1;
		if (next === undefined) return;
		event.preventDefault();
		activeTab = tabs[next];
		tabButtons[next]?.focus();
	}

	/** @param {string} tab */
	function tabId(tab) {
		return `home-tab-${tab.toLowerCase().replaceAll(' ', '-')}`;
	}

	/** @param {string} tab */
	function panelId(tab) {
		return `${tabId(tab)}-panel`;
	}
</script>

<svelte:head>
	<title>{cv.name} — {cv.headline}</title>
	<meta
		name="description"
		content="{cv.headline} in {cv.location} building applied machine-learning systems, computer-vision pipelines, 3D geometry and toolpath software for multi-axis manufacturing, and full-stack products."
	/>
</svelte:head>

<div class="tab-flow">
	<section class="landing" data-no-nozzle>
		<LandingCanvas />
		<div class="hero-ornament">
			<ToolpathOrnament preset="hero" toolpath={heroToolpath} animate />
		</div>
		<div class="shell hero-inner">
			<div class="name-header">
				<p class="eyebrow">{cv.headline} · {cv.location}</p>
				<h1>Artur<br />Sogomonyan</h1>
			</div>
			<div class="description">
				{#each cv.focus as item (item)}<p>{item}</p>{/each}
				<div class="hero-actions">
					<a class="button light" href={sitePath('/projects')}>Explore projects</a>
					<a class="button glass" href={sitePath('/contact')}>Get in touch</a>
					<a class="button glass" href={cv.pdf.href} target="_blank" rel="noopener noreferrer"
						>{cv.pdf.label} ({cv.pdf.note}) <span aria-hidden="true">↗</span></a
					>
				</div>
			</div>
		</div>
	</section>

	<div class="tab-anchor" bind:this={tabAnchor} aria-hidden="true"></div>
	<div class="tab-menu" role="tablist" aria-label="Portfolio sections">
		{#each tabs as tab, index (tab)}
			<button
				bind:this={tabButtons[index]}
				id={tabId(tab)}
				type="button"
				role="tab"
				class:active={activeTab === tab}
				aria-selected={activeTab === tab}
				aria-controls={panelId(tab)}
				tabindex={activeTab === tab ? 0 : -1}
				onclick={() => selectTab(tab)}
				onkeydown={(event) => onTabKeydown(event, index)}
			>
				{tab}
			</button>
		{/each}
	</div>

	<!-- Every panel is server-rendered and the inactive ones are hidden, so each
	     tab's content (including the Skills radar and its table) is in the
	     prerendered HTML; the tabs only switch which one is shown. -->
	{#each tabs as tab (tab)}
		<div
			id={panelId(tab)}
			class="shell page tab-section"
			role="tabpanel"
			tabindex="0"
			aria-labelledby={tabId(tab)}
			hidden={activeTab !== tab}
		>
			<div class="tab-content">
				<div class="section-heading">
					<div>
						<p class="eyebrow">Portfolio / {tab}</p>
						<h2>{tab === 'Projects' ? 'Selected projects' : tab}</h2>
					</div>
					{#if tab === 'Projects'}
						<a href={sitePath('/projects')}>All {data.counts.projects} projects →</a>
					{:else}
						<a href={sitePath('/about')}>Full profile →</a>
					{/if}
				</div>

				{#if tab === 'Projects'}
					<div class="project-grid">
						{#each data.projects as item (item.slug)}<ContentCard {item} headingLevel={3} />{/each}
					</div>
				{:else if tab === 'Education'}
					<div class="timeline-grid">
						{#each cv.education as entry (entry.id)}
							<article>
								<span class="cv-period">{entry.period}</span>
								<h3>{entry.degree}</h3>
								<b>{entry.school}</b>
								{#if entry.note}<p>{entry.note}</p>{/if}
								{#if entry.project}
									<a class="entry-link" href={sitePath(cvProjectPath(entry.project))}
										>View the thesis project →</a
									>
								{/if}
							</article>
						{/each}
					</div>
				{:else if tab === 'Work Experience'}
					<div class="timeline-grid">
						{#each cv.experience as entry (entry.id)}
							<article class:current={entry.current}>
								{#if entry.current}
									<span class="badge">Current</span>
								{:else}
									<span class="cv-period">{entry.period}</span>
								{/if}
								<h3>{entry.role ?? entry.org}</h3>
								{#if entry.role}<b>{entry.org}</b>{/if}
								<p>{entry.summary}</p>
								{#if entry.project}
									<a class="entry-link" href={sitePath(cvProjectPath(entry.project))}
										>View project →</a
									>
								{/if}
							</article>
						{/each}
					</div>
				{:else}
					<div class="skills-layout">
						<div class="skills-lists">
							<div class="skill-grid">
								{#each Object.entries(cv.skills) as [group, values] (group)}
									<article>
										<h3>{group}</h3>
										<ul>
											{#each values as value (value)}<li class="tag-chip md">{value}</li>{/each}
										</ul>
									</article>
								{/each}
							</div>
							<div class="languages">
								<h3>Languages</h3>
								<ul>
									{#each cv.languages as language (language.name)}
										<li>{language.name} <span class="cv-level">{language.level}</span></li>
									{/each}
								</ul>
							</div>
						</div>
						<SkillsRadar radar={cv.radar} />
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>

<div class="map-teaser">
	<div class="shell page">
		<GraphView
			graphData={data.graphData}
			compact
			eyebrow="Knowledge map"
			title="How the work connects."
		/>
		<p class="map-caption">
			Projects, DIY, and sport notes, linked to the fields of work they belong to and the
			organisations behind them:
			{countOf(graphCounts.item ?? 0, 'note')}, {countOf(graphCounts.field ?? 0, 'field')} across
			{countOf(graphCounts.domain ?? 0, 'domain')}, and {countOf(
				graphCounts.org ?? 0,
				'organisation'
			)}.
		</p>
	</div>
</div>

<section class="channels">
	<div class="shell page">
		<div class="section-heading">
			<div>
				<p class="eyebrow">Explore</p>
				<h2>Work, making, and movement.</h2>
			</div>
		</div>
		<div class="channel-grid">
			{#each channels as channel (channel.path)}
				<a href={sitePath(channel.path)}>
					<span class="index-num">{channel.number}</span>
					<h3>{channel.title}</h3>
					<p>{channel.text}</p>
					<strong class="count">{channel.count}</strong>
					<b aria-hidden="true">↗</b>
				</a>
			{/each}
		</div>
	</div>
</section>

<style>
	.tab-flow {
		--tab-height: 5rem;
		position: relative;
	}
	.landing {
		/* The hero's own cool palette over the space photo (fixed, like the
		   image): name, role list and eyebrow. */
		--hero-fg: #d4e0e6;
		--hero-muted: #9fb0b9;
		--hero-accent: #9cd9f9;
		/* The name's type size and the hero's vertical padding, shared with the
		   eternity sign so it can centre on the name. */
		--name-size: clamp(4rem, 8vw, 7rem);
		--hero-pad-top: clamp(6rem, 12vh, 8rem);
		--hero-pad-bottom: clamp(2.5rem, 7vh, 5rem);
		/* The sign's box: as tall as the hero, at most 60% of its width. */
		--sign-size: min(1.02 * (100dvh - var(--tab-height)), 60vw);
		/* Centred on the name: the shell's left edge plus half the width of
		   "Sogomonyan" (5.72em), and the middle of the padded grid row. */
		--disc-x: calc((100% - min(100% - 2rem, var(--content-width))) / 2 + 2.86 * var(--name-size));
		--disc-y: calc((var(--hero-pad-top) + 100% - var(--hero-pad-bottom)) / 2);
		--disc-r: calc(0.5 * var(--sign-size));
		position: relative;
		min-height: calc(100vh - var(--tab-height));
		min-height: calc(100dvh - var(--tab-height));
		margin-top: calc(-1 * var(--header-h));
		overflow: hidden;
		background:
			linear-gradient(90deg, rgba(2, 8, 13, 0.32), rgba(2, 8, 13, 0.2)),
			url('../lib/images/space.jpg') center / cover;
	}
	.landing::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 0;
		background: linear-gradient(180deg, rgba(2, 7, 11, 0.08), rgba(2, 7, 11, 0.5));
		pointer-events: none;
	}
	/* Arevakhach drawn as a printed layer, behind the hero text and above the
	   photo and its scrim, framing the name beside the nebula rather than
	   dissolving into it. */
	.hero-ornament {
		position: absolute;
		top: var(--disc-y);
		left: var(--disc-x);
		z-index: 1;
		width: var(--sign-size);
		height: var(--sign-size);
		translate: -50% -50%;
		pointer-events: none;
	}
	.hero-ornament :global(.toolpath-ornament) {
		--ornament-z: 0;
		/* The month's ink, lighter and stronger than elsewhere, since only the
		   eyebrow and the name sit on it. Over the brightest photo pixel there,
		   a full stroke in the lightest month ink (May) still leaves the eyebrow
		   at 4.9:1 and the name at 5.6:1 (1440×900); the role list and buttons sit outside
		   the sign. */
		--ornament-shade: 80%;
		--ornament-opacity: 0.4;
	}
	/* One line texture per area: the network canvas fades to a hint inside
	   the sign's disc and keeps full strength in the sky around it. */
	.landing :global(#demo-canvas) {
		-webkit-mask-image: radial-gradient(
			circle at var(--disc-x) var(--disc-y),
			rgb(0 0 0 / 0.3) 0 calc(var(--disc-r) * 0.85),
			#000 calc(var(--disc-r) * 1.05)
		);
		mask-image: radial-gradient(
			circle at var(--disc-x) var(--disc-y),
			rgb(0 0 0 / 0.3) 0 calc(var(--disc-r) * 0.85),
			#000 calc(var(--disc-r) * 1.05)
		);
	}
	.hero-inner {
		position: relative;
		z-index: 2;
		display: grid;
		min-height: calc(100vh - var(--tab-height));
		min-height: calc(100dvh - var(--tab-height));
		grid-template-columns: 1.15fr 0.85fr;
		align-items: center;
		gap: clamp(2rem, 7vw, 7rem);
		padding: var(--hero-pad-top) 0 var(--hero-pad-bottom);
	}
	.name-header,
	.description > * {
		animation: rise 650ms var(--ease-out) both;
	}
	.description > *:nth-child(2) {
		animation-delay: 60ms;
	}
	.description > *:nth-child(3) {
		animation-delay: 110ms;
	}
	.description > *:nth-child(4) {
		animation-delay: 160ms;
	}
	.description > *:nth-child(5) {
		animation-delay: 210ms;
	}
	.hero-actions {
		animation-delay: 280ms;
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
	}
	/* Only the hero eyebrow takes the hero's blue; section eyebrows below
	   keep the global coral .eyebrow. */
	.name-header .eyebrow {
		color: var(--hero-accent);
	}
	h1 {
		margin: 0;
		color: var(--hero-fg);
		font-family: var(--font-body);
		font-size: var(--name-size);
		font-weight: 700;
		letter-spacing: -0.06em;
		line-height: 0.88;
	}
	.description {
		display: grid;
		justify-items: center;
		gap: 0.65rem;
		color: var(--hero-muted);
	}
	.description p {
		margin: 0;
		font-size: clamp(1rem, 1.5vw, 1.22rem);
		transition:
			color var(--duration-base) ease,
			transform var(--duration-base) ease;
	}
	.description p:hover {
		color: white;
		transform: scale(1.045);
	}
	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
		margin-top: var(--space-5);
	}
	.button.light {
		border-color: white;
		background: white;
		color: #101820;
	}
	.button.glass {
		border-color: color-mix(in srgb, var(--hero-fg) 35%, transparent);
		background: rgb(4 11 16 / 0.35);
		color: var(--hero-fg);
	}
	.tab-menu {
		position: sticky;
		top: var(--header-h);
		z-index: 40;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		height: var(--tab-height);
		background: color-mix(in srgb, var(--color-bg-sunken) 92%, transparent);
		box-shadow: 0 1rem 2.8rem rgb(0 0 0 / 0.24);
		backdrop-filter: blur(18px) saturate(140%);
	}
	.tab-anchor {
		height: 0;
		scroll-margin-top: var(--header-h);
	}
	.tab-menu button {
		min-width: 0;
		height: var(--tab-height);
		padding: 0.5rem;
		border: 0;
		border-top: 1px solid var(--color-border);
		border-right: 1px solid var(--color-border);
		background: transparent;
		color: var(--color-text-muted);
		font-size: clamp(0.85rem, 1.4vw, 1.05rem);
		cursor: pointer;
		transition:
			color var(--duration-base) ease,
			background var(--duration-base) ease,
			box-shadow var(--duration-base) ease;
	}
	.tab-menu button:last-child {
		border-right: 0;
	}
	.tab-menu button:hover {
		color: var(--color-heading);
		background: var(--color-bg-raised);
	}
	.tab-menu button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -4px;
	}
	.tab-menu button.active {
		color: var(--color-heading);
		background: var(--color-bg-elevated);
		box-shadow: inset 0 -2px var(--accent);
	}
	.tab-section[hidden] {
		display: none;
	}
	.tab-section {
		min-height: calc(100vh - 9.5rem);
		min-height: calc(100dvh - 9.5rem);
	}
	.tab-content {
		animation: reveal-tab 360ms var(--ease-out) both;
	}
	@keyframes reveal-tab {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}
	.section-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: var(--space-6);
		margin-bottom: var(--space-7);
	}
	.section-heading h2 {
		max-width: 17ch;
		margin: 0;
	}
	.project-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-5);
	}
	.timeline-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-4);
	}
	.timeline-grid article,
	.skill-grid article {
		padding: var(--space-6);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg-raised);
	}
	.timeline-grid h3,
	.skill-grid h3 {
		margin: var(--space-4) 0 var(--space-2);
		color: var(--color-heading);
	}
	.timeline-grid b {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.timeline-grid article {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
	.timeline-grid article.current {
		border-color: color-mix(in srgb, var(--accent) 45%, var(--color-border));
	}
	.timeline-grid p {
		margin-bottom: 0;
		color: var(--color-text);
	}
	.entry-link {
		margin-top: auto;
		padding-top: var(--space-4);
		font-size: var(--text-sm);
		font-weight: 700;
	}
	.skills-layout {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
		align-items: start;
		gap: var(--space-5);
	}
	.skills-lists {
		min-width: 0;
	}
	.skill-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-4);
	}
	.skill-grid ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: var(--space-5) 0 0;
		padding: 0;
		list-style: none;
	}
	.languages {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-4) var(--space-6);
		margin-top: var(--space-5);
		padding: var(--space-5) var(--space-6);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.languages h3 {
		margin: 0;
		font-size: var(--text-lg);
	}
	.languages ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-5);
		margin: 0;
		padding: 0;
		list-style: none;
		color: var(--color-text);
	}
	.map-teaser {
		border-top: 1px solid var(--color-border);
	}
	.map-caption {
		max-width: 46rem;
		margin: var(--space-5) 0 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.channels {
		border-block: 1px solid var(--color-border);
		background: var(--color-bg-sunken);
	}
	.channel-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	.channel-grid a {
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 13rem;
		padding: var(--space-5);
		border-right: 1px solid var(--color-border);
		color: var(--color-text);
	}
	.channel-grid a:last-child {
		border-right: 0;
	}
	.channel-grid a:hover {
		background: var(--color-bg-raised);
		text-decoration: none;
	}
	.channel-grid h3 {
		margin: var(--space-6) 0 var(--space-3);
		color: var(--color-heading);
	}
	.channel-grid p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.channel-grid .count {
		margin-top: auto;
		padding-top: var(--space-5);
		padding-right: var(--space-5);
		color: var(--color-heading);
		font: 400 var(--text-xs) var(--font-mono);
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
	}
	.channel-grid b {
		position: absolute;
		right: var(--space-5);
		bottom: var(--space-5);
		color: var(--accent);
	}
	@media (max-width: 1040px) {
		.skills-layout {
			grid-template-columns: minmax(0, 1fr);
		}
		.skill-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
	@media (max-width: 900px) {
		/* Single column: the sign rises from the bottom edge below the
		   buttons, half of it showing, instead of sitting behind the text. It
		   may pass under the role list here, so it keeps the darker ink that
		   leaves that text above 4.5:1. */
		.landing {
			--sign-size: 100vw;
			--disc-x: 50%;
			--disc-y: calc(100% - 1rem);
		}
		.hero-ornament :global(.toolpath-ornament) {
			--ornament-shade: 70%;
			--ornament-opacity: 0.3;
		}
		.hero-inner {
			grid-template-columns: 1fr;
			align-content: center;
			gap: var(--space-4);
			padding: 6.5rem 0 2.25rem;
		}
		.description {
			justify-items: start;
		}
		.hero-actions {
			justify-content: flex-start;
		}
		.project-grid,
		.skill-grid {
			grid-template-columns: 1fr 1fr;
		}
		.channel-grid {
			grid-template-columns: 1fr 1fr;
		}
		.channel-grid a:nth-child(2) {
			border-right: 0;
		}
		.channel-grid a:nth-child(-n + 2) {
			border-bottom: 1px solid var(--color-border);
		}
	}
	@media (max-width: 620px) {
		.tab-flow {
			--tab-height: 4.3rem;
		}
		.hero-inner {
			padding: 7rem 0 2.5rem;
		}
		h1 {
			font-size: clamp(3.2rem, 16vw, 5rem);
		}
		.description {
			gap: 0.4rem;
		}
		.tab-menu {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
		.tab-menu button {
			font-size: var(--text-xs);
			line-height: 1.2;
		}
		.project-grid,
		.timeline-grid,
		.skill-grid,
		.channel-grid {
			grid-template-columns: 1fr;
		}
		.channel-grid a {
			min-height: 10rem;
			border-right: 0;
			border-bottom: 1px solid var(--color-border);
		}
		.channel-grid a:last-child {
			border-bottom: 0;
		}
		.section-heading {
			align-items: start;
			flex-direction: column;
		}
	}
</style>
