<script>
	import { base } from '$app/paths';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import PageIntro from '$lib/components/ui/PageIntro.svelte';

	const experience = [
		{
			period: '2024',
			role: 'Data Scientist · Rail4Future',
			place: 'TU Wien',
			text: 'Analyzed railway irregularities, strengthened LSTM experiments, and worked with Siemens and ÖBB collaborators.'
		},
		{
			period: '2023–2025',
			role: 'CTO & Data Scientist',
			place: 'susteam',
			text: 'Architected an ESG reporting product across OCR, retrieval, applied NLP, APIs, and product delivery.'
		},
		{
			period: '2021',
			role: 'Machine Learning Analyst',
			place: 'GLOSAV',
			text: 'Built real-time computer-vision methods for railway route and obstacle detection.'
		},
		{
			period: '2020–2021',
			role: 'Engineer & Project Manager',
			place: 'Arterra Miniature',
			text: 'Combined 3D modelling, prototyping, software, and end-to-end project delivery.'
		},
		{
			period: '2017–2020',
			role: 'Full-stack & Frontend Engineering',
			place: 'Product teams and freelance',
			text: 'Built and extended web products, commerce systems, and educational interfaces.'
		}
	];

	const skills = {
		'Applied ML': ['PyTorch', 'TensorFlow', 'scikit-learn', 'OpenCV', 'YOLO', 'NLP', 'RAG'],
		'Product engineering': ['Python', 'FastAPI', 'Svelte', 'React', 'JavaScript', 'Docker'],
		'Data & infrastructure': ['PostgreSQL', 'MongoDB', 'Redis', 'AWS', 'Linux', 'CI/CD']
	};
</script>

<svelte:head
	><title>About — Artur Sogomonyan</title><meta
		name="description"
		content="About Artur Sogomonyan, a software and machine-learning engineer in Vienna."
	/></svelte:head
>

<div class="shell page">
	<Breadcrumb items={[{ label: 'About' }]} />
	<PageIntro
		eyebrow="Engineer, researcher, maker"
		title="About"
		description="I work where models meet products: shaping the data, testing the method, building the service, and making the result understandable to the person using it."
	>
		<a
			class="button primary"
			href="https://github.com/PropovedNik007/cv/raw/main/Artur_Sogomonyan_cv_long.pdf"
			>Download CV ↗</a
		>
		<a class="button" href="{base}/contact">Get in touch</a>
	</PageIntro>

	<section class="profile-grid">
		<div class="portrait"><img src="{base}/images/profile.png" alt="Artur Sogomonyan" /></div>
		<div class="manifesto">
			<p class="eyebrow">How I work</p>
			<h2>Technical depth without losing the shape of the problem.</h2>
			<p>
				I am most useful on ambiguous work: incomplete data, a model that needs a real product
				around it, or a prototype that has to become dependable.
			</p>
			<p>
				My background spans applied machine learning, computer vision, full-stack development, and
				hands-on making. That mix makes me comfortable moving between research questions, system
				boundaries, and user-facing details.
			</p>
			<div class="facts">
				<div><strong>Vienna</strong><span>Based in Austria</span></div>
				<div><strong>MSc</strong><span>Data Science · TU Wien</span></div>
				<div><strong>4</strong><span>Languages spoken</span></div>
			</div>
		</div>
	</section>

	<section class="resume-section">
		<div class="section-label">
			<p class="eyebrow">Experience</p>
			<h2>A practical route through software and AI.</h2>
		</div>
		<div class="timeline">
			{#each experience as entry (entry.role)}
				<article>
					<time>{entry.period}</time>
					<div>
						<h3>{entry.role}</h3>
						<p class="place">{entry.place}</p>
						<p>{entry.text}</p>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="resume-section skills-section">
		<div class="section-label">
			<p class="eyebrow">Toolkit</p>
			<h2>Built around problems, not buzzwords.</h2>
		</div>
		<div class="skill-groups">
			{#each Object.entries(skills) as [group, values] (group)}
				<div>
					<h3>{group}</h3>
					<ul>
						{#each values as value (value)}<li>{value}</li>{/each}
					</ul>
				</div>
			{/each}
		</div>
	</section>

	<section class="education">
		<p class="eyebrow">Education &amp; recognition</p>
		<div class="education-grid">
			<div><strong>MSc Data Science</strong><span>TU Wien · 2022–2025</span></div>
			<div>
				<strong>BSc Information Technologies</strong><span
					>Bauman Moscow State Technical University · 2014–2020</span
				>
			</div>
			<div>
				<strong>Two 2nd-place finishes</strong><span
					>AIM Hackathon &amp; Tourism Technology Hackathon</span
				>
			</div>
			<div>
				<strong>IEEE publication · 2024</strong><span
					>Surrogate modelling for railway digital twins</span
				>
			</div>
		</div>
	</section>
</div>

<style>
	.profile-grid {
		display: grid;
		grid-template-columns: minmax(16rem, 0.72fr) 1.28fr;
		gap: clamp(3rem, 8vw, 8rem);
		align-items: center;
		margin-bottom: var(--space-9);
	}
	.portrait {
		position: relative;
	}
	.portrait::before {
		content: '';
		position: absolute;
		inset: -1rem 1rem 1rem -1rem;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-xl);
		z-index: -1;
	}
	.portrait img {
		display: block;
		width: 100%;
		aspect-ratio: 4 / 5;
		border-radius: var(--radius-xl);
		object-fit: cover;
		filter: saturate(0.75) contrast(1.05);
	}
	.manifesto h2 {
		max-width: 16ch;
	}
	.manifesto > p:not(.eyebrow) {
		max-width: 42rem;
		color: var(--color-text);
		font-size: 1.08rem;
	}
	.facts {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-4);
		margin-top: var(--space-7);
		padding-top: var(--space-5);
		border-top: 1px solid var(--color-border);
	}
	.facts strong,
	.facts span {
		display: block;
	}
	.facts strong {
		color: var(--color-heading);
		font-size: var(--text-lg);
	}
	.facts span {
		margin-top: 0.2rem;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	.resume-section {
		display: grid;
		grid-template-columns: 0.72fr 1.28fr;
		gap: clamp(3rem, 8vw, 8rem);
		padding-block: var(--space-9);
		border-top: 1px solid var(--color-border);
	}
	.section-label h2 {
		max-width: 11ch;
	}
	.timeline {
		border-top: 1px solid var(--color-border);
	}
	.timeline article {
		display: grid;
		grid-template-columns: 7rem 1fr;
		gap: var(--space-5);
		padding: var(--space-5) 0;
		border-bottom: 1px solid var(--color-border);
	}
	time {
		color: var(--accent);
		font: 700 var(--text-xs) var(--font-body);
		letter-spacing: 0.08em;
	}
	.timeline h3 {
		margin: 0;
	}
	.timeline p {
		margin: 0.4rem 0 0;
		color: var(--color-text-muted);
	}
	.timeline .place {
		color: var(--color-text);
		font-weight: 650;
	}
	.skill-groups {
		display: grid;
		gap: var(--space-5);
	}
	.skill-groups > div {
		padding-bottom: var(--space-5);
		border-bottom: 1px solid var(--color-border);
	}
	.skill-groups h3 {
		margin-bottom: var(--space-4);
	}
	.skill-groups ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.skill-groups li {
		padding: 0.42rem 0.72rem;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-full);
		color: var(--color-text);
		font-size: var(--text-sm);
	}
	.education {
		padding-top: var(--space-9);
		border-top: 1px solid var(--color-border);
	}
	.education-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-4);
	}
	.education-grid div {
		padding: var(--space-5);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg-raised);
	}
	.education-grid strong,
	.education-grid span {
		display: block;
	}
	.education-grid strong {
		color: var(--color-heading);
	}
	.education-grid span {
		margin-top: var(--space-2);
		color: var(--color-text-muted);
	}
	@media (max-width: 760px) {
		.profile-grid,
		.resume-section {
			grid-template-columns: 1fr;
		}
		.portrait {
			max-width: 26rem;
		}
		.facts,
		.education-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
