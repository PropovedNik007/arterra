<script>
	import { base } from '$app/paths';
	import LandingCanvas from '../components/LandingCanvas.svelte';
	import ContentCard from '$lib/components/cards/ContentCard.svelte';

	let { data } = $props();
	let activeTab = $state('Projects');
	/** @type {HTMLDivElement | undefined} */
	let tabAnchor;

	const tabs = ['Projects', 'Education', 'Work Experience', 'Skills'];
	const focus = [
		'Data Scientist',
		'Machine Learning Engineer',
		'Computer Vision',
		'Deep Learning',
		'Full-stack Development'
	];
	const education = [
		{
			degree: 'Master of Science · Data Science',
			school: 'Technische Universität Wien',
			period: '2022–2025'
		},
		{
			degree: 'Bachelor of Science · Information Technologies and Telecommunications',
			school: 'Bauman Moscow State Technical University',
			period: '2014–2020'
		},
		{
			degree: 'Deep Learning School',
			school: 'Moscow Institute of Physics and Technology',
			period: '2020–2021'
		},
		{
			degree: 'School of Data Analysis',
			school: 'Higher School of Economics University and Yandex',
			period: '2020'
		}
	];
	const experience = [
		{
			role: 'Data Scientist · Rail4Future',
			place: 'Technische Universität Wien',
			period: '2024',
			text: 'Rail-irregularity analysis and LSTM modelling with Siemens and ÖBB.'
		},
		{
			role: 'CTO · Data Scientist',
			place: 'susteam',
			period: '2023–present',
			text: 'Architecture and full-stack development for an ESG reporting platform.'
		},
		{
			role: 'Machine Learning Analyst',
			place: 'GLOSAV',
			period: '2021',
			text: 'Real-time railway-route and obstacle detection using computer vision.'
		},
		{
			role: 'Project Manager · Software Engineer',
			place: 'Arterra Miniature',
			period: '2020–2021',
			text: '3D visualisation, prototyping, software, and delivery management.'
		}
	];
	const skillGroups = [
		{
			title: 'Software development',
			items: ['Python', 'C++', 'JavaScript', 'Svelte', 'React', 'FastAPI', 'Docker']
		},
		{
			title: 'Machine learning',
			items: ['PyTorch', 'TensorFlow', 'OpenCV', 'scikit-learn', 'NLP', 'RAG', 'LLMs']
		},
		{
			title: 'Data & infrastructure',
			items: ['PostgreSQL', 'MongoDB', 'Redis', 'AWS', 'Linux', 'nginx', 'Git']
		}
	];
	const channels = [
		{
			path: '/projects',
			number: '01',
			title: 'Projects',
			text: 'Applied AI, computer vision, RAG, and full-stack systems.'
		},
		{
			path: '/diy',
			number: '02',
			title: 'DIY',
			text: 'Miniatures, 3D printing, and hands-on experiments.'
		},
		{
			path: '/sport',
			number: '03',
			title: 'Sport',
			text: 'Hiking, boxing, diving, and table-tennis notes.'
		},
		{
			path: '/graph',
			number: '04',
			title: 'Graph',
			text: 'Explore how projects and technologies connect.'
		}
	];

	/** @param {string} tab */
	function selectTab(tab) {
		activeTab = tab;
		requestAnimationFrame(() => tabAnchor?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
	}

	/** @param {string} tab */
	function tabId(tab) {
		return `home-tab-${tab.toLowerCase().replaceAll(' ', '-')}`;
	}
</script>

<svelte:head>
	<title>Artur Sogomonyan — Software &amp; ML Engineer</title>
	<meta
		name="description"
		content="Software and machine-learning engineer in Vienna building applied AI systems, computer-vision pipelines, and full-stack products."
	/>
</svelte:head>

<div class="tab-flow">
	<section class="landing">
		<LandingCanvas />
		<div class="shell hero-inner">
			<div class="name-header">
				<p class="eyebrow">Software &amp; ML Engineer · Vienna</p>
				<h1>Artur<br />Sogomonyan</h1>
			</div>
			<div class="description">
				{#each focus as item (item)}<p>{item}</p>{/each}
				<div class="hero-actions">
					<a class="button light" href="{base}/projects">Explore projects</a>
					<a class="button glass" href="{base}/contact">Get in touch</a>
				</div>
			</div>
		</div>
	</section>

	<div class="tab-anchor" bind:this={tabAnchor} aria-hidden="true"></div>
	<div class="tab-menu" role="tablist" aria-label="Portfolio sections">
		{#each tabs as tab (tab)}
			<button
				id={tabId(tab)}
				type="button"
				role="tab"
				class:active={activeTab === tab}
				aria-selected={activeTab === tab}
				aria-controls="home-tab-panel"
				onclick={() => selectTab(tab)}
			>
				{tab}
			</button>
		{/each}
	</div>

	<div
		id="home-tab-panel"
		class="shell page tab-section"
		role="tabpanel"
		aria-labelledby={tabId(activeTab)}
	>
		{#key activeTab}
			<div class="tab-content">
				<div class="section-heading">
					<div>
						<p class="eyebrow">Portfolio / {activeTab}</p>
						<h2>{activeTab}</h2>
					</div>
					{#if activeTab === 'Projects'}<a href="{base}/projects">All projects →</a>{/if}
				</div>

				{#if activeTab === 'Projects'}
					<div class="project-grid">
						{#each data.projects as item (item.slug)}<ContentCard {item} />{/each}
					</div>
				{:else if activeTab === 'Education'}
					<div class="timeline-grid">
						{#each education as item (item.degree)}
							<article>
								<time>{item.period}</time>
								<h3>{item.degree}</h3>
								<p>{item.school}</p>
							</article>
						{/each}
					</div>
				{:else if activeTab === 'Work Experience'}
					<div class="timeline-grid">
						{#each experience as item (item.role)}
							<article>
								<time>{item.period}</time>
								<h3>{item.role}</h3>
								<b>{item.place}</b>
								<p>{item.text}</p>
							</article>
						{/each}
					</div>
				{:else}
					<div class="skill-grid">
						{#each skillGroups as group (group.title)}
							<article>
								<h3>{group.title}</h3>
								<ul>
									{#each group.items as item (item)}<li>{item}</li>{/each}
								</ul>
							</article>
						{/each}
					</div>
				{/if}
			</div>
		{/key}
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
				<a href={`${base}${channel.path}`}>
					<span>{channel.number}</span>
					<h3>{channel.title}</h3>
					<p>{channel.text}</p>
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
		position: relative;
		min-height: calc(100vh - var(--tab-height));
		min-height: calc(100dvh - var(--tab-height));
		margin-top: -4.5rem;
		overflow: hidden;
		background:
			linear-gradient(90deg, rgba(2, 8, 13, 0.32), rgba(2, 8, 13, 0.2)),
			url('$lib/images/space.jpg') center / cover;
	}
	.landing::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 0;
		background: linear-gradient(180deg, rgba(2, 7, 11, 0.08), rgba(2, 7, 11, 0.5));
		pointer-events: none;
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
		padding: clamp(6rem, 12vh, 8rem) 0 clamp(2.5rem, 7vh, 5rem);
	}
	.name-header,
	.description > * {
		animation: rise 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
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
	.eyebrow {
		color: #9cd9f9;
		font-size: 0.76rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}
	h1 {
		margin: 0;
		color: #d4e0e6;
		font-family: var(--font-body);
		font-size: clamp(4rem, 8vw, 7rem);
		font-weight: 700;
		letter-spacing: -0.06em;
		line-height: 0.88;
	}
	.description {
		display: grid;
		justify-items: center;
		gap: 0.65rem;
		color: #9fb0b9;
	}
	.description p {
		margin: 0;
		font-size: clamp(1rem, 1.5vw, 1.22rem);
		transition:
			color 220ms ease,
			transform 220ms ease;
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
	.hero-actions .button {
		border-radius: 999px;
	}
	.button.light {
		border-color: white;
		background: white;
		color: #101820;
	}
	.button.glass {
		border-color: rgba(210, 235, 247, 0.35);
		background: rgba(4, 11, 16, 0.35);
		color: #dce8ee;
	}
	.tab-menu {
		position: sticky;
		top: 4.5rem;
		z-index: 40;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		height: var(--tab-height);
		background: rgba(8, 13, 16, 0.92);
		box-shadow: 0 1rem 2.8rem rgba(0, 0, 0, 0.24);
		backdrop-filter: blur(18px) saturate(140%);
	}
	.tab-anchor {
		height: 0;
		scroll-margin-top: 4.5rem;
	}
	.tab-menu button {
		min-width: 0;
		height: var(--tab-height);
		padding: 0.5rem;
		border: 0;
		border-top: 1px solid rgba(156, 217, 249, 0.12);
		border-right: 1px solid rgba(156, 217, 249, 0.08);
		background: transparent;
		color: #80949f;
		font-size: clamp(0.85rem, 1.4vw, 1.05rem);
		cursor: pointer;
		transition:
			color 220ms ease,
			background 220ms ease,
			box-shadow 220ms ease;
	}
	.tab-menu button:last-child {
		border-right: 0;
	}
	.tab-menu button:hover,
	.tab-menu button:focus-visible {
		color: white;
		outline: 1px solid rgba(156, 217, 249, 0.78);
		outline-offset: -4px;
		background: rgba(47, 72, 84, 0.26);
	}
	.tab-menu button.active {
		color: white;
		background: rgba(58, 78, 88, 0.62);
		box-shadow: inset 0 -2px #9cd9f9;
	}
	.tab-section {
		min-height: calc(100vh - 9.5rem);
		min-height: calc(100dvh - 9.5rem);
	}
	.tab-content {
		animation: reveal-tab 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
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
	.timeline-grid time {
		color: var(--accent);
		font: 600 var(--text-xs) var(--font-mono);
		letter-spacing: 0.08em;
		text-transform: uppercase;
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
	.timeline-grid p {
		margin-bottom: 0;
		color: var(--color-text);
	}
	.skill-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
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
	.skill-grid li {
		padding: 0.35rem 0.65rem;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-full);
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
	.channel-grid span {
		color: var(--accent);
		font: 600 var(--text-xs) var(--font-mono);
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
	.channel-grid b {
		position: absolute;
		right: var(--space-5);
		bottom: var(--space-5);
		color: var(--accent);
	}
	@media (max-width: 900px) {
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
			font-size: 0.72rem;
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
