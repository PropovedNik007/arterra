import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		},
		rules: {
			// Internal links go through `sitePath()` / `staticPath()` (#lib/paths.js),
			// which wrap SvelteKit's `resolve()` / `asset()` so the static GitHub
			// Pages build works under /arterra.
			'svelte/no-navigation-without-resolve': 'off',
			// HTML comes only from the build-time Markdown pipeline and JSON-LD is
			// serialized from a local object, never from browser input.
			'svelte/no-at-html-tags': 'off',
			// Graph layout Maps are rebuilt as derived values and are not mutated as
			// reactive state.
			'svelte/prefer-svelte-reactivity': 'off'
		}
	},
	{
		// The retro archive is the immutable, already-built gh-pages artifact.
		ignores: ['build/', '.svelte-kit/', 'dist/', 'static/retro-archive/']
	}
];
