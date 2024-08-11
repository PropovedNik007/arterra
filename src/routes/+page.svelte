<script>
	import { onMount, afterUpdate, onDestroy } from 'svelte';
	import space from '$lib/images/space.jpg';

	import LandingCanvas from '../components/LandingCanvas.svelte';

	import { Tabs, TabItem } from 'flowbite-svelte';
	import { Breadcrumb, BreadcrumbItem, Card, Button, Toggle, Badge } from 'flowbite-svelte';
	import { ArrowRightOutline } from 'flowbite-svelte-icons';

	import { base } from '$app/paths';

	import rail4future from '$lib/images/rail4future.jpg';
	import susteam from '$lib/images/susteam.png';

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
			<h1>Artur <br> Sogomonyan</h1>
		</div>
		<div class="description">
			<p>Data Scientist </p>
			<p> Machine Learning Engineer</p>
			<p>Computer Vision</p>
			<p>Experienced in Deep Learning</p>
			<p>Full-stack development</p>
			<!-- <p class="orange">Let's build the future together!</p> -->
			<!-- <div class="contact">
				<a href="mailto:arthur.sogomonyan@gmail.com" target="_blank">Email</a> |
				<a href="https://linkedin.com/in/artur-sogomonyan" target="_blank">LinkedIn</a> |
				<a href="https://github.com/PropovedNik007" target="_blank">GitHub</a>
			</div> -->
		
		<!-- <button>Download CV</button> -->
		<a href="https://wa.me/4367764114581?text=Dear Artur%20I'm%20interested%20to%20work%20with%20you" target="_blank">
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

<Tabs class='menu'>
	<!-- <a href="#"> -->
	<TabItem class='menu-tab' open title="Projects" on:click={scrollDown}>
		<section class="projects">
			<Card img={rail4future} class="project">
				<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Rail4Future Data Science Project 2024</h5>
				<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
					Analyzing rail irregularities for industrial partners Siemens and ÖBB.
				</p>
				<p>
					<Badge border rounded color="yellow">LSTM</Badge>
					<Badge border rounded color="red">Tensorflow</Badge>
					<Badge border rounded color="green">Data Science</Badge>
				</p>
				<br>
		
				<Button class="bg-primary-600" href="https://www.rail4future.com/en/" target="_blank">
				Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
				</Button>
			</Card>
			<Card img={susteam} class="project">
				<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">susteam</h5>
				<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">Full-stack development of ESG platform. Generation of the Reports for hospitality industry.</p>
				
				<p>
					<Badge border rounded color="yellow">React.js</Badge>
					<Badge border rounded color="blue">FastAPI</Badge>
					<Badge border rounded color="red">Bert, LLama3</Badge>
				</p>
				<br>
				<Button class="bg-primary-600" href="https://susteam.at/" target="_blank">
				Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
				</Button>
			</Card>
			<Card img={rail4future} class="project">
				<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Noteworthy technology acquisitions 2021</h5>
				<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.</p>
				<Button class="bg-primary-600">
				Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
				</Button>
			</Card>
			<Card img={rail4future} class="project">
				<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Noteworthy technology fffffffffffffffffffffacquisitions 2021</h5>
				<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">Here are the biggest enffffffffffffffffffffffffffffffffgfgfg gfgfgfgf g fgf fg gf gfg gffffffffffffffffterprise technology acquisitions of 2021 so far, in reverse chronological order.</p>
				<Button class="bg-primary-600">
				Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
				</Button>
			</Card>
		</section>
	</TabItem>
	<!-- </a> -->
	<TabItem class='menu-tab' title="Education" on:click={scrollDown}>
		<section class="expirience">
			<div class="education">
				<p><b>Data Science — Master of Science</b> <br> Technische Universität Wien, Austria, 2022 - now</p>
				<p><b>Information Technologies and Telecommunications — Bachelor of Science</b> <br> Bauman Moscow State Technical University, 2014 - 2020</p>
				<p><b>Deep Learning — Deep Learning School</b> <br> Moscow Institute of Physics and Technology, 2020 - 2021</p>
				<p><b>Machine Learning — School of Data Analysis</b> <br> Higher School of Economics University and Yandex, 2020</p>
			</div>
		</section>
	</TabItem>
	<TabItem class='menu-tab' title="Work Expirience" on:click={scrollDown}>
		<div class="work-experience">
			<p><b>Data Scientist, Project Rail4Future</b> <br> Technische Universität Wien, Feb 2024 - Jul 2024</p>
			<ul>
				<li>Analyzed rail irregularities, optimized LSTM models, and collaborated with Siemens and ÖBB.</li>
				<li>Performed significance tests and improved model robustness and performance.</li>
			</ul>
			<p><b>CTO, Data Scientist</b> <br> susteam, Jan 2023 - present</p>
			<ul>
				<li>Developed architecture and Full Stack ESG system with OCR, Data Analysis, and Machine Learning.</li>
				<li>Implemented RAG for LLMs using technologies like FastAPI, AWS, React.js, Bert, and LLama3.</li>
			</ul>
			<p><b>Machine Learning Analyst</b> <br> GLOSAV, Feb 2021 - Jul 2021</p>
			<ul>
				<li>Engineered algorithms for object detection and tracking in railway routes, contributing to a train autopilot system.</li>
			</ul>
			<p><b>Project Manager, 3D-Modeller, Software Engineer</b> <br> Arterra Miniature, Feb 2020 - Mar 2021</p>
			<ul>
				<li>Handled 3D visualization, prototyping, and project management from inception to delivery.</li>
			</ul>
		</div>
	  <!-- </p> -->
	</TabItem>
	<TabItem class='menu-tab' title="Skills" on:click={scrollDown}>
		<section>
			<div class="skills">
				<p><b>Software Development:</b> Docker, Python, C++, R, Django, Flask, FastAPI, JavaScript, React, Svelte</p>
				<p><b>Machine Learning:</b> scikit-learn, Pandas, NumPy, Tensorflow, PyTorch, OpenCV, YOLO, NLTK, SpaCy, Bert, LLama3, GPT</p>
				<p><b>Databases and Cloud:</b> Git, PostgreSQL, MongoDB, Redis, RabbitMQ, nginx, Gunicorn, Spark, AWS EC2, S3</p>
				<p><b>Languages:</b> English (C1), German (A2), Russian (C2), Armenian (B2)</p>
			</div>
		</section>
	</TabItem>
</Tabs>

<div class="content">
	<section class="expirience">
		<h1>Education</h1>
		<div class="education">
			<p><b>Data Science — Master of Science</b> <br> Technische Universität Wien, 2022 - now</p>
			<p><b>Information Technologies and Telecommunications — Bachelor of Science</b> <br> Bauman Moscow State Technical University, 2014 - 2020</p>
			<p><b>Deep Learning — Deep Learning School</b> <br> Moscow Institute of Physics and Technology, 2020 - 2021</p>
			<p><b>Machine Learning — School of Data Analysis</b> <br> Higher School of Economics University and Yandex, 2020</p>
		</div>
	</section>
	
	<section class="expirience">
		<h1>Work Experience</h1>
		<div class="work-experience">
			<p><b>Data Scientist, Project Rail4Future</b> <br> Technische Universität Wien, Feb 2024 - Jul 2024</p>
			<ul>
				<li>Analyzed rail irregularities, optimized LSTM models, and collaborated with Siemens and ÖBB.</li>
				<li>Performed significance tests and improved model robustness and performance.</li>
			</ul>
			<p><b>CTO, Data Scientist</b> <br> susteam, Jan 2023 - present</p>
			<ul>
				<li>Developed architecture and Full Stack ESG system with OCR, Data Analysis, and Machine Learning.</li>
				<li>Implemented RAG for LLMs using technologies like FastAPI, AWS, React.js, Bert, and LLama3.</li>
			</ul>
			<p><b>Machine Learning Analyst</b> <br> GLOSAV, Feb 2021 - Jul 2021</p>
			<ul>
				<li>Engineered algorithms for object detection and tracking in railway routes, contributing to a train autopilot system.</li>
			</ul>
			<p><b>Project Manager, 3D-Modeller, Software Engineer</b> <br> Arterra Miniature, Feb 2020 - Mar 2021</p>
			<ul>
				<li>Handled 3D visualization, prototyping, and project management from inception to delivery.</li>
			</ul>
		</div>
	</section>
	
	<section class="expirience">
		<h1>Projects and Awards</h1>
		<div class="projects-awards">
			<p><b>Tourism Technology Hackathon — 2nd Place Winner</b> <br> Nov 2023</p>
			<ul>
				<li>Developed a data pipeline and knowledge graph for tourism data, visualized as an interactive map with a chatbot interface.</li>
			</ul>
			<p><b>Coding Austria — Lip Reading App at Hackathon</b> <br> Jul 2023</p>
			<ul>
				<li>Utilized AV-HuBERT for lip reading, enabling communication in noisy environments for the Austrian Red Cross.</li>
			</ul>
		</div>
	</section>
	
	<section class="expirience">
		<h1>Skills</h1>
		<div class="skills">
			<p><b>Software Development:</b> Docker, Python, C++, R, Django, Flask, FastAPI, JavaScript, React, Svelte</p>
			<p><b>Machine Learning:</b> scikit-learn, Pandas, NumPy, Tensorflow, PyTorch, OpenCV, YOLO, NLTK, SpaCy, Bert, LLama3, GPT</p>
			<p><b>Databases and Cloud:</b> Git, PostgreSQL, MongoDB, Redis, RabbitMQ, nginx, Gunicorn, Spark, AWS EC2, S3</p>
			<p><b>Languages:</b> English (C1), German (A2), Russian (C2), Armenian (B2)</p>
		</div>
	</section>
</div>

<style>
section {
	display: flex;
	flex-direction: column;
	justify-content: center;
	/* align-items: center; */
	flex: 0.6;
}
p{
	line-height: 2rem;
	text-align: justify;
}

h1 {
	width: 100%;
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
	background-image: url("$lib/images/space.jpg");
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
	width: fit-content;
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

b{
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

.expirience > div {
	padding-left: 3vh;
}

.expirience h1 {
	color: var(--color-text-or);
	font-size: 2rem;
	font-weight: bold;
	text-align: left;
}

.projects {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		grid-gap: 20px;
		padding-top: 3vh;
		/* justify-content: center; */
		/* align-items: center; */
		/* height: 100vh; */
	}

.content {
	padding: 20px;
	margin-top: 5vh;
	display: flex;
	flex-direction: column;
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
	.description {
		width: 100vw;
		height: 50vh;
	}
	.name-header > h1 {
		font-size: 3rem;
	}
	.description > p {
		font-size: 1rem;
	}
}

</style>
