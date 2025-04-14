<script>
	import { Breadcrumb, BreadcrumbItem, Card, Button } from 'flowbite-svelte';
	import { ArrowRightOutline, InstagramSolid, CodeOutline, LinkOutline } from 'flowbite-svelte-icons';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	let mounted = false;
	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>About - Artur Sogomonyan</title>
	<meta name="description" content="About Artur Sogomonyan - Software Developer and 3D Printing Enthusiast" />
</svelte:head>

<div class="content">
	<Breadcrumb color="primary" aria-label="Default breadcrumb example">
		<BreadcrumbItem color="primary" href="{base}/" home>Home</BreadcrumbItem>
		<BreadcrumbItem href="{base}/about">About</BreadcrumbItem>
	</Breadcrumb>

	<div class="about-container">
		<div class="hero-section" class:fade-in={mounted}>
			<div class="hero-content">
				<h1>About Me</h1>
				<p class="subtitle">Software Developer & Creative Maker</p>
				<div class="hero-decoration"></div>
			</div>
		</div>

		<div class="profile-section" class:slide-up={mounted}>
			<Card class="profile-card" size="xl">
				<div class="profile-content">
					<div class="profile-text">
						<h2>Hi, I'm Artur 👋</h2>
						<p>
							I'm a data scientist and deep learning engineer with a passion for creating intelligent systems. 
							My expertise spans machine learning, computer vision, and natural language processing. 
							When I'm not building AI models, you'll find me exploring various hobbies that combine technology and creativity.
						</p>
						<div class="profile-stats">
							<div class="stat">
								<span class="stat-number">5+</span>
								<span class="stat-label">Years in AI</span>
							</div>
							<div class="stat">
								<span class="stat-number">8+</span>
								<span class="stat-label">Years in IT</span>
							</div>
							<div class="stat">
								<span class="stat-number">20+</span>
								<span class="stat-label">Projects</span>
							</div>
						</div>
					</div>
					<div class="profile-image">
						<div class="image-container">
							<img src="/images/profile.png" alt="Artur Sogomonyan" />
							<div class="image-decoration"></div>
						</div>
					</div>
				</div>
			</Card>
		</div>

		<div class="interests-section" class:slide-up={mounted}>
			<h2>My Interests</h2>
			<div class="interests-grid">
				<Card class="interest-card">
					<div class="interest-icon">🏔️</div>
					<h3>Hiking</h3>
					<p>Exploring nature trails and challenging myself with new hiking adventures.</p>
				</Card>
				<Card class="interest-card">
					<div class="interest-icon">🏓</div>
					<h3>Table Tennis</h3>
					<p>Enjoying fast-paced matches and improving my skills in this dynamic sport.</p>
				</Card>
				<Card class="interest-card">
					<div class="interest-icon">🖨️</div>
					<h3>3D Printing</h3>
					<p>Creating and bringing digital designs to life through additive manufacturing.</p>
				</Card>
			</div>
		</div>

		<div class="social-section" class:slide-up={mounted}>
			<h2>Connect With Me</h2>
			<div class="social-links">
				<a href="https://www.instagram.com/arterra.miniature" target="_blank" class="social-link">
					<Card class="social-card">
						<InstagramSolid class="w-6 h-6" />
						<span>@arterra.miniature</span>
					</Card>
				</a>
				<a href="https://github.com/PropovedNik007" target="_blank" class="social-link">
					<Card class="social-card">
						<CodeOutline class="w-6 h-6" />
						<span>GitHub</span>
					</Card>
				</a>
				<a href="https://linkedin.com/in/artur-sogomonyan" target="_blank" class="social-link">
					<Card class="social-card">
						<LinkOutline class="w-6 h-6" />
						<span>LinkedIn</span>
					</Card>
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	.content {
		padding: 20px;
		margin-top: 5vh;
	}

	.about-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.hero-section {
		text-align: center;
		margin-bottom: 4rem;
		opacity: 0;
		transform: translateY(20px);
		transition: opacity 0.8s ease-out, transform 0.8s ease-out;
		position: relative;
	}

	.hero-content {
		position: relative;
		z-index: 1;
	}

	.hero-decoration {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 300px;
		height: 300px;
		background: radial-gradient(circle, var(--color-primary-100) 0%, transparent 70%);
		opacity: 0.3;
		border-radius: 50%;
		z-index: 0;
	}

	.hero-section.fade-in {
		opacity: 1;
		transform: translateY(0);
	}

	h1 {
		color: var(--color-text-or);
		font-size: 4rem;
		font-weight: bold;
		margin-bottom: 1rem;
		background: linear-gradient(45deg, var(--color-text-or), var(--color-primary-600));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: gradient 8s ease infinite;
	}

	@keyframes gradient {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}

	.subtitle {
		font-size: 1.8rem;
		color: var(--color-text);
		opacity: 0.8;
	}

	.profile-section, .interests-section, .social-section {
		margin-bottom: 4rem;
		opacity: 0;
		transform: translateY(20px);
		transition: opacity 0.8s ease-out, transform 0.8s ease-out;
	}

	.slide-up {
		opacity: 1;
		transform: translateY(0);
	}

	.profile-card {
		background: linear-gradient(135deg, var(--color-surface-50) 0%, var(--color-surface-100) 100%);
		border: none;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

	}

	.profile-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		align-items: center;
	}

	.profile-text {
		font-size: 1.1rem;
		line-height: 1.8;
	}

	.profile-stats {
		display: flex;
		gap: 2rem;
		margin-top: 2rem;
	}

	.stat {
		text-align: center;
	}

	.stat-number {
		display: block;
		font-size: 2rem;
		font-weight: bold;
		color: var(--color-primary-600);
	}

	.stat-label {
		font-size: 0.9rem;
		color: var(--color-text);
		opacity: 0.8;
	}

	.image-container {
		position: relative;
		width: 100%;
		padding-top: 100%;
	}

	.profile-image img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 0.5rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		transition: transform 0.3s ease;
	}

	.image-decoration {
		position: absolute;
		top: -20px;
		right: -20px;
		width: 100px;
		height: 100px;
		background: var(--color-primary-100);
		border-radius: 20px;
		opacity: 0.3;
		z-index: -1;
	}

	.profile-image:hover img {
		transform: scale(1.02);
	}

	.interests-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-top: 2rem;
	}

	.interest-card {
		background: linear-gradient(135deg, var(--color-surface-50) 0%, var(--color-surface-100) 100%);
		border: none;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		padding: 2rem;
		text-align: center;
	}

	.interest-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.interest-card:hover {
		transform: translateY(-10px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
	}

	.social-links {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-top: 2rem;
	}

	.social-link {
		text-decoration: none;
		color: inherit;
	}

	.social-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: linear-gradient(135deg, var(--color-surface-50) 0%, var(--color-surface-100) 100%);
		border: none;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}

	.social-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
	}

	h2 {
		color: var(--color-text-or);
		font-size: 2.5rem;
		margin-bottom: 2rem;
		text-align: center;
	}

	h3 {
		color: var(--color-text-or);
		font-size: 1.8rem;
		margin-bottom: 1rem;
	}

	@media (max-width: 768px) {
		.profile-content {
			grid-template-columns: 1fr;
			text-align: center;
		}

		.profile-image {
			display: flex;
			justify-content: center;
		}

		.image-container {
			width: 80%;
			margin: 0 auto;
		}

		.profile-stats {
			justify-content: center;
		}

		h1 {
			font-size: 3rem;
		}

		.subtitle {
			font-size: 1.5rem;
		}
	}
</style>
