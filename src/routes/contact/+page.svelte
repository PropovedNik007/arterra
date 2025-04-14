<script>
	import { Breadcrumb, BreadcrumbItem, Card, Button, Input, Textarea } from 'flowbite-svelte';
	import { ArrowRightOutline, EnvelopeOutline, PhoneOutline } from 'flowbite-svelte-icons';
	import { base } from '$app/paths';

	let name = '';
	let email = '';
	let message = '';
	let subject = '';

	function handleSubmit() {
		// Create mailto link with form data
		const mailtoLink = `mailto:arthur.sogomonyan@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0A${message}`)}`;
		
		// Open default email client in a new window
		window.open(mailtoLink, '_blank');
		
		// Reset form
		name = '';
		email = '';
		subject = '';
		message = '';
	}
</script>

<svelte:head>
	<title>Contact - Artur Sogomonyan</title>
	<meta name="description" content="Contact Artur Sogomonyan" />
</svelte:head>


<div class="content">
	<Breadcrumb color="primary" aria-label="Default breadcrumb example">
		<BreadcrumbItem color="primary" href="{base}/" home>Home</BreadcrumbItem>
		<BreadcrumbItem href="{base}/projects">Projects</BreadcrumbItem>
		<!-- <BreadcrumbItem>Flowbite Svelte</BreadcrumbItem> -->
	</Breadcrumb>
</div>

<div class="contact-page">

	<h1>Get in Touch</h1>
	
	<div class="contact-container">
		<div class="contact-info">
			<Card>
				<h2>Contact Information</h2>
				<p>Feel free to reach out to me through any of the following channels:</p>
				
				<div class="contact-methods">
					<div class="contact-method">
						<EnvelopeOutline class="w-6 h-6 text-primary-600" />
						<a href="mailto:arthur.sogomonyan@gmail.com">arthur.sogomonyan@gmail.com</a>
					</div>
					
					<div class="contact-method">
						<PhoneOutline class="w-6 h-6 text-primary-600" />
						<a href="https://wa.me/4367764114581">+43 677 641 145 81</a>
					</div>
					
					<div class="contact-method">
						<div class="icon-placeholder linkedin-icon"></div>
						<a href="https://linkedin.com/in/artur-sogomonyan" target="_blank">LinkedIn Profile</a>
					</div>
					
					<div class="contact-method">
						<div class="icon-placeholder github-icon"></div>
						<a href="https://github.com/PropovedNik007" target="_blank">GitHub Profile</a>
					</div>
				</div>
				
				<div class="download-cv">
					<Button class="bg-primary-600" on:click={() => {
						const link = document.createElement('a');
						link.href = 'https://github.com/PropovedNik007/cv/raw/main/Artur_Sogomonyan_cv_long.pdf';
						link.download = 'Artur_Sogomonyan_CV.pdf';
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
					}}>
						Download CV <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
					</Button>
				</div>
			</Card>
		</div>
		
		<div class="contact-form">
			<Card>
				<h2>Send Me a Message</h2>
				<p>Have a question or want to work together? Fill out the form below:</p>
				
				<form on:submit|preventDefault={handleSubmit}>
					<div class="form-group">
						<label for="name">Name</label>
						<Input id="name" type="text" placeholder="Your name" bind:value={name} required />
					</div>
					
					<div class="form-group">
						<label for="email">Email</label>
						<Input id="email" type="email" placeholder="Your email" bind:value={email} required />
					</div>
					
					<div class="form-group">
						<label for="subject">Subject</label>
						<Input id="subject" type="text" placeholder="Subject" bind:value={subject} required />
					</div>
					
					<div class="form-group">
						<label for="message">Message</label>
						<Textarea id="message" placeholder="Your message" bind:value={message} rows="5" required />
					</div>
					
					<Button type="submit" class="bg-primary-600">
						Send Message <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
					</Button>
				</form>
			</Card>
		</div>
	</div>
</div>

<style>

    .content {
		padding: 20px;
		margin-top: 5vh;
	}
	.contact-page {
		max-width: 1200px;
		margin: 0 auto;

	}
	
	h1 {
		color: var(--color-text-or);
		font-size: 2.5rem;
		font-weight: bold;
		margin-bottom: 2rem;
	}
	
	h2 {
		color: var(--color-text-or);
		font-size: 1.8rem;
		font-weight: bold;
		margin-bottom: 1rem;
	}
	
	.contact-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}
	
	.contact-info, .contact-form {
		width: 100%;
	}
	
	.contact-methods {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin: 1.5rem 0;
	}
	
	.contact-method {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.contact-method a {
		color: var(--color-text);
		text-decoration: none;
		transition: color 0.3s ease;
	}
	
	.contact-method a:hover {
		color: var(--color-text-or);
	}
	
	.download-cv {
		margin-top: 2rem;
	}
	
	.form-group {
		margin-bottom: 1.5rem;
	}
	
	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}
	
	.icon-placeholder {
		width: 1.5rem;
		height: 1.5rem;
		background-color: var(--color-primary-600);
		border-radius: 50%;
	}
	
	/* Responsive design */
	@media (max-width: 768px) {
		.contact-container {
			grid-template-columns: 1fr;
		}
	}
</style> 