import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(__dirname, '../public/manifest.json');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const [major, minor, patch] = manifest.version.split('.').map(Number);
manifest.version = `${major}.${minor}.${patch + 1}`;

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`Version bumped to ${manifest.version}`);
