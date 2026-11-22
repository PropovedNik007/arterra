import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { heroToolpath, renderSprite } from '../src/lib/design/ornaments/sprite.js';
import { SPRITE_FILE } from '../src/lib/design/ornaments/presets.js';
import { initials } from '../src/lib/design/ornaments/letters.js';

// Precompute the toolpath ornaments so pages neither run the geometry in the
// browser nor inline the same paths on every page.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const spritePath = join(root, 'static', SPRITE_FILE);
const heroPath = join(root, 'src/lib/design/ornaments/hero.json');
// The header initials (ԱՍ): traced with a distance field and marching
// squares, ~10 ms of main-thread work that every page would otherwise repeat.
const initialsPath = join(root, 'src/lib/design/ornaments/initials.json');

const sprite = renderSprite();
mkdirSync(dirname(spritePath), { recursive: true });
writeFileSync(spritePath, sprite);
writeFileSync(heroPath, `${JSON.stringify(heroToolpath())}\n`);
writeFileSync(initialsPath, `${JSON.stringify(initials())}\n`);
console.log(
	`[build-ornaments] wrote ${(sprite.length / 1024).toFixed(1)} KB sprite to ${spritePath}, the hero toolpath to ${heroPath} and the initials to ${initialsPath}`
);
