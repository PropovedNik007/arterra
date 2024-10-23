<script>
	import { onMount, afterUpdate, onDestroy } from 'svelte';
	import space from '$lib/images/space.jpg';

	import LandingCanvas from '../components/LandingCanvas.svelte';

	import { Tabs, TabItem } from 'flowbite-svelte';
	import { Breadcrumb, BreadcrumbItem, Card, Button, Toggle, Badge } from 'flowbite-svelte';
	import { ArrowRightOutline } from 'flowbite-svelte-icons';

	import { base } from '$app/paths';

	import Projects from '../components/projects/Projects.svelte';
	import Skills from '../components/skills/Skills.svelte';
	import SkillsRadar from '../components/skills/SkillsRadar.svelte';
	import Education from '../components/education/Education.svelte';
	import Cv from '../components/Cv.svelte';

	function scrollDown() {
		window.scrollTo({
			top: window.innerHeight * 0.8,
			behavior: 'smooth'
		});
	}
</script>

<svelte:head>
	<title>Artur Sogomonyan</title>
	<meta name="description" content="Artur Sogomonyan's CV" />
</svelte:head>

<section class="landing">
	<LandingCanvas />
	<div class="name-header">
		<h1>Artur <br /> Sogomonyan</h1>
	</div>
	<div class="description">
		<p>Data Scientist</p>
		<p>Machine Learning Engineer</p>
		<p>Computer Vision</p>
		<p>Deep Learning</p>
		<p>Full-stack development</p>
		<p>Website is under development</p>
		<!-- <p class="orange">Let's build the future together!</p> -->
		<!-- <div class="contact">
				<a href="mailto:arthur.sogomonyan@gmail.com" target="_blank">Email</a> |
				<a href="https://linkedin.com/in/artur-sogomonyan" target="_blank">LinkedIn</a> |
				<a href="https://github.com/PropovedNik007" target="_blank">GitHub</a>
			</div> -->

		<!-- <button>Download CV</button> -->
		<a
			href="https://wa.me/4367764114581?text=Dear Artur%20I'm%20interested%20to%20work%20with%20you"
			target="_blank"
		>
			<button
				class="blueShadow relative overflow-hidden px-6 py-3 group rounded-full bg-white text-slate-950"
			>
				<h5 class="relative z-9">Get in touch</h5>
			</button>
		</a>
	</div>
	<!-- <div class="contact">
			<a href="mailto:arthur.sogomonyan@gmail.com" target="_blank">Email</a> |
			<a href="https://linkedin.com/in/artur-sogomonyan" target="_blank">LinkedIn</a> |
			<a href="https://github.com/PropovedNik007" target="_blank">GitHub</a>
		</div> -->
</section>

<Tabs class="menu">
	<!-- <a href="#"> -->
	<TabItem class="menu-tab" open title="Projects" on:click={scrollDown}>
		<Projects />
	</TabItem>
	<!-- </a> -->
	<TabItem class="menu-tab" title="Education" on:click={scrollDown}>
		<Education />
	</TabItem>
	<TabItem class="menu-tab" title="Work Expirience" on:click={scrollDown}>
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
		<!-- </p> -->
	</TabItem>
	<TabItem class="menu-tab" title="Skills" on:click={scrollDown}>
		<!-- 2 cols, on mobile to be one col -->
		<div class="skills-container">
			<Skills />
			<div class="radar">
				<SkillsRadar />
			</div>
		</div>
	</TabItem>
</Tabs>

<div class="content">
	<section class="expirience">
		<h2>Education</h2>
		<Education />
	</section>
	
	<Cv />

</div>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		/* align-items: center; */
		flex: 0.6;
	}
	p {
		line-height: 2rem;
		text-align: justify;
	}

	h1 {
		width: 100%;
		color: var(--color-text-or);
		font-size: 1.8rem;
		font-weight: bold;
	}
	h2 {
		color: var(--color-text-or);
		font-size: 1.8rem;
		font-weight: bold;
	}
	.name-header > h1 {
		color: var(--color-text-or);
		text-align: left;
		font-size: 6rem;
		position: relative;
		z-index: 0;
	}

	.description > p {
		/* text-align: left; */
		/* text-align: center; */
		font-size: 1.5rem;
		width: 100%;
		margin-bottom: 1rem;
	}

	.landing {
		position: relative;
		width: 100%;
		height: 100vh;
		overflow: hidden;
		z-index: 1;
		display: flex;
		flex-direction: row;
		align-items: baseline;
		justify-content: center;
		background-image: url('$lib/images/space.jpg');
		background-size: cover;
		background-attachment: fixed;
		background-blend-mode: darken;
		margin-top: -5vh;
		padding: 0 5vw 0 5vw;
	}
	.name-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 60vw;
		height: 90vh;
		margin: 0;
		position: relative;
		overflow: hidden;
	}

	.name-header h1:hover {
		color: white;
		font-size: 6.5rem;
		transition: 1s;
		/* box-shadow: 0px 14px 55px #4075a6; */
	}

	.description {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 40vw;
		height: 90vh;
		margin: 0;
		position: relative;
	}

	.description p:hover {
		color: white;
		font-size: 1.6rem;
		transition: 0.7s;
	}

	.description a button:hover {
		scale: 1.2;
		transition: 0.5s;
		color: var(--color-text-or);
	}

	b {
		color: var(--color-text-or);
	}

	.blueShadow {
		box-shadow: 0px 14px 55px #4075a6;
	}

	.blueShadow:hover {
		box-shadow: 0px 14px 55px #7dc0ff;
	}

	.expirience {
		display: flex;
		flex-direction: column;
	}

	.content {
		padding: 20px;
		margin-top: 5vh;
		display: flex;
		flex-direction: column;
	}

	.skills-container {
		display: grid;
		grid-template-columns: 1fr 40vw;
	}

	.radar {
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 40vw;
		width: 40vw;
	}

	/* media mobile */
	@media (max-width: 768px) {
		.landing {
			flex-direction: column;
			padding-top: 5vh;
			background-position: center;
			padding-bottom: 10vh;
		}
		.name-header {
			padding-top: 5vh;
			width: 100vw;
			height: 50vh;
		}
		.name-header > h1 {
			font-size: 3rem;
		}

		.name-header > h1:hover {
			font-size: 3.3rem;
		}

		.description {
			width: 100vw;
			height: 50vh;
		}

		.description > p {
			font-size: 1rem;
		}

		.description p:hover {
			font-size: 1.1rem;
		}

		.skills-container {
			display: grid;
			grid-template-columns: 1fr;
		}

		.radar {
			height: 100vw;
			width: 100vw;
		}
	}
</style>
