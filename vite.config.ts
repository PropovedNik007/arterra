import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

const dev = process.argv.includes('dev');
const base = (dev ? '' : (process.env.BASE_PATH ?? '/arterra')) as '' | `/${string}`;

export default defineConfig({
	plugins: [
		sveltekit({
			preprocess: vitePreprocess(),
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: '404.html'
			}),
			paths: {
				base
			},
			prerender: {
				handleHttpError: ({ status, path, referrer }) => {
					if (status === 404) {
						console.warn(`Path not found: ${path}, referrer: ${referrer}`);
						return {
							ignore: true // Ignore 404s during prerendering
						};
					}
				}
			}
		})
	],
	test: {
		include: ['src/**/*.test.{js,ts}']
	}
});
