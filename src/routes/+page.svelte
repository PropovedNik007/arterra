<script>
	import space from '$lib/images/space.jpg';

	import LandingCanvas from '../components/LandingCanvas.svelte';

	import Projects from '../components/projects/Projects.svelte';
	import Skills from '../components/skills/Skills.svelte';
	import SkillsRadar from '../components/skills/SkillsRadar.svelte';
	import Education from '../components/education/Education.svelte';
	import Cv from '../components/Cv.svelte';

	const tabs = ['Projects', 'Education', 'Work Expirience', 'Skills'];
	let activeTab = $state('Projects');

	/** @param {string} tab */
	function selectTab(tab) {
		activeTab = tab;
		window.scrollTo({
			top: window.innerHeight * 0.8,
			behavior: 'smooth'
		});
	}
</script>

<svelte:head>
	<title>Artur Sogomonyan — Software &amp; ML Engineer</title>
	<meta
		name="description"
		content="Artur Sogomonyan is a software and machine-learning engineer in Vienna, building ML systems, computer-vision pipelines, and full-stack products. Explore projects, an interactive knowledge graph, and more."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Artur Sogomonyan — Software &amp; ML Engineer" />
	<meta
		property="og:description"
		content="Software &amp; ML engineer in Vienna. Machine learning, computer vision, and full-stack development."
	/>
</svelte:head>

<section class="landing">
	<LandingCanvas />
	<div class="hero-inner">
		<div class="name-header">
			<p class="eyebrow">Software &amp; ML Engineer · Vienna</p>
			<h1>Artur <br /> Sogomonyan</h1>
		</div>
		<div class="description">
			<p class="lead">
				I build machine-learning systems, computer-vision pipelines, and full-stack products —
				and keep a public knowledge graph of the work along the way.
			</p>
			<ul class="focus-list">
				<li>Machine Learning</li>
				<li>Computer Vision</li>
				<li>Deep Learning</li>
				<li>Full-stack Development</li>
			</ul>

			<div class="button-container">
				<a
					class="btn btn-primary"
					href="https://wa.me/4367764114581?text=Dear Artur%20I'm%20interested%20to%20work%20with%20you"
					target="_blank"
					rel="noreferrer"
				>
					Get in touch
				</a>

				<button
					class="btn btn-ghost"
					on:click={() => {
						const link = document.createElement('a');
						link.href =
							'https://github.com/PropovedNik007/cv/raw/main/Artur_Sogomonyan_cv_long.pdf';
						link.download = 'Artur_Sogomonyan_CV.pdf';
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
					}}
				>
					Download CV
				</button>
			</div>
		</div>
	</div>
</section>

<div class="menu" role="tablist" aria-label="CV sections">
	{#each tabs as tab (tab)}
		<button
			type="button"
			role="tab"
			class="menu-tab"
			class:active={activeTab === tab}
			aria-selected={activeTab === tab}
			on:click={() => selectTab(tab)}
		>
			{tab}
		</button>
	{/each}
</div>

<div class="tab-panel" class:wide={activeTab === 'Projects'}>
	{#if activeTab === 'Projects'}
		<Projects />
	{:else if activeTab === 'Education'}
		<Education />
	{:else if activeTab === 'Work Expirience'}
		<div class="work-experience">
			<p>
				<b>Data Scientist, Project Rail4Future</b> <br /> Technische Universität Wien, Feb 2024 - Jul
				2024
			</p>
			<ul>
				<li>
					Analyzed rail irregularities, optimized LSTM models, and collaborated with Siemens and
					ÖBB.
				</li>
				<li>Performed significance tests and improved model robustness and performance.</li>
			</ul>
			<p><b>CTO, Data Scientist</b> <br /> susteam, Jan 2023 - present</p>
			<ul>
				<li>
					Developed architecture and Full Stack ESG system with OCR, Data Analysis, and Machine
					Learning.
				</li>
				<li>
					Implemented RAG for LLMs using technologies like FastAPI, AWS, React.js, Bert, and LLama3.
				</li>
			</ul>
			<p><b>Machine Learning Analyst</b> <br /> GLOSAV, Feb 2021 - Jul 2021</p>
			<ul>
				<li>
					Engineered algorithms for object detection and tracking in railway routes, contributing to
					a train autopilot system.
				</li>
			</ul>
			<p>
				<b>Project Manager, 3D-Modeller, Software Engineer</b> <br /> Arterra Miniature, Feb 2020 - Mar
				2021
			</p>
			<ul>
				<li>
					Handled 3D visualization, prototyping, and project management from inception to delivery.
				</li>
			</ul>
		</div>
	{:else if activeTab === 'Skills'}
		<div class="skills-container">
			<Skills />
			<div class="radar">
				<SkillsRadar />
			</div>
		</div>
	{/if}
</div>

<div class="content">
	<Cv />
</div>

<style>
	.landing {
		position: relative;
		width: 100%;
		min-height: 100vh;
		/* pull up under the transparent sticky header so the hero reads full-bleed */
		margin-top: -4.5rem;
		overflow: hidden;
		background-image: url('$lib/images/space.jpg');
		background-size: cover;
		background-position: center;
	}
	/* warm scrim so text is readable and the cold photo reads warmer */
	.landing::before {
		content: '';
		position: absolute;
		inset: 0;
		background:
			radial-gradient(
				120% 90% at 15% 20%,
				color-mix(in srgb, var(--accent) 24%, transparent) 0%,
				transparent 55%
			),
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--color-bg-sunken) 55%, transparent) 0%,
				color-mix(in srgb, var(--color-bg-sunken) 78%, transparent) 100%
			);
		z-index: 0;
	}

	.hero-inner {
		position: relative;
		z-index: 2;
		max-width: 78rem;
		margin: 0 auto;
		min-height: 100vh;
		padding: 8rem 2rem 5rem;
		display: grid;
		grid-template-columns: 1.1fr 0.9fr;
		gap: 3rem;
		align-items: center;
	}

	/* staggered entrance */
	.name-header,
	.description > * {
		animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	.eyebrow {
		animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	.name-header {
		animation-delay: 0.05s;
	}
	.lead {
		animation-delay: 0.18s;
	}
	.focus-list {
		animation-delay: 0.28s;
	}
	.button-container {
		animation-delay: 0.38s;
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.eyebrow {
		font-family: var(--font-body);
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent-coral-soft);
		margin: 0 0 1rem;
	}

	.name-header h1 {
		margin: 0;
		font-size: clamp(3rem, 8vw, 6rem);
		font-weight: 500;
		line-height: 0.98;
		letter-spacing: -0.03em;
		color: #faf9f5;
	}

	.description {
		max-width: 30rem;
	}
	.lead {
		font-size: 1.28rem;
		line-height: 1.6;
		color: #ece9e2;
		margin: 0 0 1.75rem;
	}
	.focus-list {
		list-style: none;
		margin: 0 0 2.25rem;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.6rem;
	}
	.focus-list li {
		font-size: 0.9rem;
		font-weight: 500;
		color: #f2efe9;
		padding: 0.4rem 0.9rem;
		border: 1px solid rgba(250, 249, 245, 0.28);
		border-radius: var(--radius-full);
		backdrop-filter: blur(4px);
	}

	.button-container {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-body);
		font-size: 0.95rem;
		font-weight: 600;
		padding: 0.8rem 1.5rem;
		border-radius: var(--radius-full);
		cursor: pointer;
		border: 1px solid transparent;
		transition:
			transform 0.2s ease,
			background 0.2s ease,
			border-color 0.2s ease;
		text-decoration: none;
	}
	.btn:hover {
		text-decoration: none;
		transform: translateY(-2px);
	}
	.btn-primary {
		background: var(--accent);
		/* dark ink on the light coral — white fails WCAG AA on #d97757 */
		color: #1f1e1d;
	}
	.btn-primary:hover {
		background: var(--accent-coral-soft);
	}
	.btn-ghost {
		background: rgba(250, 249, 245, 0.06);
		border-color: rgba(250, 249, 245, 0.35);
		color: #faf9f5;
	}
	.btn-ghost:hover {
		border-color: #faf9f5;
		background: rgba(250, 249, 245, 0.12);
	}

	.tab-panel {
		max-width: 72rem;
		margin: 0 auto;
		padding: 0 2rem;
	}
	/* Projects fills the full page width, like the old version */
	.tab-panel.wide {
		max-width: none;
		padding: 0 clamp(1.5rem, 5vw, 5rem);
	}

	.work-experience p {
		margin-bottom: 0.25rem;
	}
	.work-experience b {
		color: var(--color-heading);
	}
	.work-experience ul {
		margin: 0 0 1.5rem;
		padding-left: 1.1rem;
		color: var(--color-text);
	}
	.work-experience li {
		margin-bottom: 0.35rem;
		line-height: 1.6;
	}

	.content {
		max-width: 72rem;
		margin: 3rem auto 0;
		padding: 0 2rem;
		display: flex;
		flex-direction: column;
	}

	.skills-container {
		display: grid;
		grid-template-columns: 1fr minmax(280px, 36vw);
		gap: 2rem;
		align-items: start;
	}
	.radar {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	@media (max-width: 820px) {
		.landing {
			margin-top: 0;
		}
		.hero-inner {
			grid-template-columns: 1fr;
			gap: 2rem;
			padding: 6rem 1.5rem 4rem;
			min-height: auto;
		}
		.skills-container {
			grid-template-columns: 1fr;
		}
	}
</style>
