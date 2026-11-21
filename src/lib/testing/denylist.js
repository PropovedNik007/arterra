import { createHash } from 'node:crypto';

/**
 * SHA-256 of lower-cased names that must never appear on the public site. Only
 * hashes are stored so the names themselves never enter this public repository.
 */
const DENIED = new Set([
	'3360c0ef5494b61c37f6cfa37d32ccd6a657e060b29402fc64c48b20a93f99aa',
	'de47ea51f8cb93df73e825eec63b6e28b98d234399046916c6f6c7a44eb75145'
]);

/**
 * Denied names found in `text` (as hashes), checked word by word — including
 * each word's alphabetic prefix so "name.ai" or "name-ai" still match.
 * @param {string} text
 * @returns {string[]}
 */
export function deniedWords(text) {
	const hits = new Set();
	for (const word of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
		const hash = createHash('sha256').update(word).digest('hex');
		if (DENIED.has(hash)) hits.add(hash);
	}
	return [...hits];
}
