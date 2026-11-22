<script>
	import { sitePath, staticPath } from '#lib/paths.js';
	import Breadcrumb from '#lib/components/ui/Breadcrumb.svelte';
	import PageIntro from '#lib/components/ui/PageIntro.svelte';
	import { cv, cvProjectPath } from '#lib/content/cv.js';

	const msc = cv.education[0];
</script>

<svelte:head
	><title>About — {cv.name}</title><meta
		name="description"
		content="About {cv.name}, {cv.headline} in {cv.location}: experience, education, toolkit, and languages."
	/></svelte:head
>

<div class="shell page">
	<Breadcrumb items={[{ label: 'About' }]} />
	<PageIntro
		eyebrow="{cv.headline} · {cv.location}"
		title="About"
		description="I work where models meet products: shaping the data, testing the method, building the service, and making the result understandable to the person using it."
	>
		<a class="button primary" href={cv.pdf.href} target="_blank" rel="noopener noreferrer"
			>{cv.pdf.label} ({cv.pdf.note}) <span aria-hidden="true">↗</span></a
		>
		<a class="button" href={sitePath('/projects')}>See projects</a>
		<a class="button" href={sitePath('/contact')}>Get in touch</a>
	</PageIntro>

	<section class="profile-grid">
		<div class="portrait"><img src={staticPath('images/profile.png')} alt={cv.name} /></div>
		<div class="manifesto">
			<p class="eyebrow">How I work</p>
			<h2>Technical depth without losing the shape of the problem.</h2>
			<p>
				I am most useful on ambiguous work: incomplete data, a model that needs a real product
				around it, or a prototype that has to become dependable.
			</p>
			<p>
				My background spans applied machine learning, computer vision, 3D geometry and toolpath
				software for multi-axis manufacturing, full-stack development, and hands-on making. That mix
				makes me comfortable moving between research questions, system boundaries, and user-facing
				details.
			</p>
			<dl class="facts">
				<div>
					<dt>{cv.location}</dt>
					<dd>Based in Austria</dd>
				</div>
				<div>
					<dt>MSc</dt>
					<dd>Data Science · {msc.schoolShort} · {msc.period}</dd>
				</div>
				<div>
					<dt>{cv.languages.length}</dt>
					<dd>Languages spoken</dd>
				</div>
			</dl>
		</div>
	</section>

	<section class="resume-section" aria-labelledby="about-experience">
		<div class="section-label">
			<p class="eyebrow">Experience</p>
			<h2 id="about-experience">A practical route through software and AI.</h2>
		</div>
		<ol class="timeline">
			{#each cv.experience as entry (entry.id)}
				<li class:current={entry.current}>
					<div class="when">
						{#if entry.current}<span class="badge">Current</span>{:else}<span class="period"
								>{entry.period}</span
							>{/if}
					</div>
					<div>
						<h3>{entry.role ?? entry.org}</h3>
						{#if entry.role}<p class="place">{entry.org}</p>{/if}
						<p>{entry.summary}</p>
						{#if entry.project}
							<a class="entry-link" href={sitePath(cvProjectPath(entry.project))}
								>View project <span aria-hidden="true">→</span></a
							>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	</section>

	<section class="resume-section skills-section" aria-labelledby="about-toolkit">
		<div class="section-label">
			<p class="eyebrow">Toolkit</p>
			<h2 id="about-toolkit">Built around problems, not buzzwords.</h2>
			<a class="entry-link" href={sitePath('/insights#skills')}
				>See the skills profile chart <span aria-hidden="true">→</span></a
			>
		</div>
		<div class="skill-groups">
			{#each Object.entries(cv.skills) as [group, values] (group)}
				<div>
					<h3>{group}</h3>
					<ul>
						{#each values as value (value)}<li>{value}</li>{/each}
					</ul>
				</div>
			{/each}
			<div>
				<h3>Languages</h3>
				<ul class="languages">
					{#each cv.languages as language (language.name)}
						<li>{language.name} <span>{language.level}</span></li>
					{/each}
				</ul>
			</div>
		</div>
	</section>

	<section class="education" aria-labelledby="about-education">
		<p class="eyebrow">Education &amp; recognition</p>
		<h2 id="about-education" class="visually-hidden">Education and recognition</h2>
		<div class="education-grid">
			{#each cv.education as entry (entry.id)}
				<div>
					<strong>{entry.degree}</strong><span>{entry.school} · {entry.period}</span>
					{#if entry.note}<p>{entry.note}</p>{/if}
					{#if entry.project}
						<a class="entry-link" href={sitePath(cvProjectPath(entry.project))}
							>View the thesis project <span aria-hidden="true">→</span></a
						>
					{/if}
				</div>
			{/each}
		</div>

		<h3 class="subhead">Awards &amp; publication</h3>
		<div class="education-grid recognition">
			{#each cv.awards as award (award.id)}
				<div>
					<strong>{award.title}</strong><span>{award.period}</span>
					<p>{award.detail}</p>
					{#if award.project}
						<a class="entry-link" href={sitePath(cvProjectPath(award.project))}
							>View project <span aria-hidden="true">→</span></a
						>
					{/if}
				</div>
			{/each}
			{#each cv.publications as publication (publication.id)}
				<div>
					<strong>Publication · {publication.venueShort}</strong><span
						>{publication.venue} · pp. {publication.pages}</span
					>
					<p><cite>{publication.title}</cite></p>
					<p class="credit">{publication.credit}</p>
					<a class="entry-link" href={publication.url} target="_blank" rel="noopener noreferrer"
						>DOI {publication.doi} <span aria-hidden="true">↗</span><span class="visually-hidden">
							(opens in a new tab)</span
						></a
					>
				</div>
			{/each}
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
		margin-bottom: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-4);
		margin-top: var(--space-7);
		padding-top: var(--space-5);
		border-top: 1px solid var(--color-border);
	}
	.facts dt,
	.facts dd {
		display: block;
		margin: 0;
	}
	.facts dt {
		color: var(--color-heading);
		font-size: var(--text-lg);
	}
	.facts dd {
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
		margin: 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid var(--color-border);
	}
	.timeline li {
		display: grid;
		grid-template-columns: 8.5rem 1fr;
		gap: var(--space-5);
		padding: var(--space-5) 0;
		border-bottom: 1px solid var(--color-border);
	}
	.period {
		color: var(--accent);
		font: 700 var(--text-xs) var(--font-body);
		letter-spacing: 0.08em;
	}
	.when {
		padding-top: 0.3rem;
	}
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.15rem 0.55rem;
		border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
		border-radius: var(--radius-full);
		color: var(--accent);
		font: 700 var(--text-xs) var(--font-body);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.badge::before {
		content: '';
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
	}
	.timeline li.current h3 {
		color: var(--color-heading);
	}
	.entry-link {
		display: inline-block;
		margin-top: var(--space-3);
		font-size: var(--text-sm);
		font-weight: 650;
		overflow-wrap: anywhere;
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
	.skill-groups .languages span {
		margin-left: 0.3rem;
		color: var(--accent);
		font-size: var(--text-xs);
		font-weight: 700;
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
	.education-grid div > span {
		display: block;
	}
	.education-grid strong {
		color: var(--color-heading);
	}
	.education-grid div > span {
		margin-top: var(--space-2);
		color: var(--color-text-muted);
	}
	.education-grid p {
		margin: var(--space-3) 0 0;
		color: var(--color-text);
		font-size: var(--text-sm);
	}
	.education-grid cite {
		font-style: normal;
	}
	.education-grid .credit {
		color: var(--color-text-muted);
	}
	.subhead {
		margin: var(--space-7) 0 var(--space-4);
		color: var(--color-text-muted);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
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
