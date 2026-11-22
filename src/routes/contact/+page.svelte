<script>
	import Breadcrumb from '#lib/components/ui/Breadcrumb.svelte';
	import PageIntro from '#lib/components/ui/PageIntro.svelte';
	import EnvelopeIcon from '#lib/icons/EnvelopeIcon.svelte';
	import TelegramIcon from '#lib/icons/TelegramIcon.svelte';
	import MediumIcon from '#lib/icons/MediumIcon.svelte';
	import LinkedinIcon from '#lib/icons/LinkedinIcon.svelte';
	import GithubIcon from '#lib/icons/GithubIcon.svelte';
	import { cv } from '#lib/content/cv.js';

	const contacts = [
		{
			label: 'Email',
			value: 'arthur.sogomonyan@gmail.com',
			href: 'mailto:arthur.sogomonyan@gmail.com',
			icon: EnvelopeIcon
		},
		{ label: 'Telegram', value: '@arterrai', href: 'https://t.me/arterrai', icon: TelegramIcon },
		{
			label: 'LinkedIn',
			value: 'artur-sogomonyan',
			href: 'https://linkedin.com/in/artur-sogomonyan',
			icon: LinkedinIcon
		},
		{
			label: 'GitHub',
			value: 'PropovedNik007',
			href: 'https://github.com/PropovedNik007',
			icon: GithubIcon
		},
		{
			label: 'Medium',
			value: '@artur.sogomonyan',
			href: 'https://medium.com/@artur.sogomonyan',
			icon: MediumIcon
		}
	];
</script>

<svelte:head
	><title>Contact — Artur Sogomonyan</title><meta
		name="description"
		content="Contact Artur Sogomonyan about applied AI, machine learning, and product engineering work."
	/></svelte:head
>

<div class="shell page">
	<Breadcrumb items={[{ label: 'Contact' }]} />
	<PageIntro
		eyebrow="Open channel"
		title="Let’s make the problem concrete."
		description="If you are working on an applied-AI product, a computer-vision pipeline, or a system that needs both model and interface thinking, send me the context."
	/>
	<div class="contact-layout">
		<section class="message-card">
			<p class="eyebrow">A useful first message</p>
			<h2>Three details are enough.</h2>
			<ol>
				<li>
					<span>01</span>
					<div>
						<strong>The outcome</strong>
						<p>What should work when we are done?</p>
					</div>
				</li>
				<li>
					<span>02</span>
					<div>
						<strong>The current constraint</strong>
						<p>Data, model quality, delivery, time, or something else?</p>
					</div>
				</li>
				<li>
					<span>03</span>
					<div>
						<strong>The next decision</strong>
						<p>What do you need to decide after our conversation?</p>
					</div>
				</li>
			</ol>
			<div class="message-actions">
				<a
					class="button primary"
					href="mailto:arthur.sogomonyan@gmail.com?subject=Project%20conversation">Write an email</a
				>
				<a class="button" href={cv.pdf.href} target="_blank" rel="noopener noreferrer"
					>{cv.pdf.label} ({cv.pdf.note}) <span aria-hidden="true">↗</span></a
				>
			</div>
		</section>
		<section class="channels" aria-label="Contact channels">
			{#each contacts as contact (contact.label)}
				<a
					href={contact.href}
					target={contact.href.startsWith('http') ? '_blank' : undefined}
					rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
				>
					<contact.icon class="contact-icon" />
					<div><span>{contact.label}</span><strong>{contact.value}</strong></div>
					<b aria-hidden="true">↗</b>
				</a>
			{/each}
		</section>
	</div>
</div>

<style>
	.contact-layout {
		display: grid;
		grid-template-columns: 1.1fr 0.9fr;
		gap: var(--space-6);
	}
	.message-card,
	.channels {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		background: var(--color-bg-raised);
	}
	.message-card {
		padding: clamp(2rem, 5vw, 4rem);
	}
	.message-card h2 {
		max-width: 12ch;
	}
	ol {
		margin: var(--space-7) 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid var(--color-border);
	}
	.message-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}
	li {
		display: grid;
		grid-template-columns: 2rem 1fr;
		gap: var(--space-4);
		padding: var(--space-5) 0;
		border-bottom: 1px solid var(--color-border);
	}
	li > span {
		color: var(--accent);
		font-size: var(--text-xs);
		font-weight: 700;
	}
	li strong {
		color: var(--color-heading);
	}
	li p {
		margin: 0.25rem 0 0;
		color: var(--color-text-muted);
	}
	.channels {
		overflow: hidden;
	}
	.channels a {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: var(--space-4);
		min-height: 7.5rem;
		padding: var(--space-5);
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text);
		transition: background 180ms ease;
	}
	.channels a:last-child {
		border-bottom: 0;
	}
	.channels a:hover {
		background: var(--color-bg-elevated);
		text-decoration: none;
	}
	.channels :global(.contact-icon) {
		width: 1.4rem;
		height: 1.4rem;
		color: var(--accent);
	}
	.channels span,
	.channels strong {
		display: block;
	}
	.channels span {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.09em;
		text-transform: uppercase;
	}
	.channels strong {
		margin-top: 0.25rem;
		color: var(--color-heading);
		overflow-wrap: anywhere;
	}
	.channels b {
		color: var(--accent);
	}
	@media (max-width: 800px) {
		.contact-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
