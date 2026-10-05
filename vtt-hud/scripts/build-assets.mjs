import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const assetRoot = path.join(root, 'assets');
const supported = new Set(['.avif', '.jpg', '.jpeg', '.png', '.svg', '.webp']);
const categories = [
  { directory: 'icons', layer: 10, size: { width: 32, height: 32 } },
  { directory: 'portraits', layer: 2, size: { width: 256, height: 256 } },
  { directory: 'textures', layer: 0, size: { width: 640, height: 360 } },
  { directory: 'art', layer: 9, size: { width: 640, height: 360 } },
];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  }));
  return files.flat();
}

const assets = [];
for (const category of categories) {
  const directory = path.join(assetRoot, category.directory);
  for (const file of await listFiles(directory)) {
    if (!supported.has(path.extname(file).toLowerCase())) continue;
    const relativePath = path.relative(root, file).split(path.sep).join('/');
    const id = relativePath.slice('assets/'.length).replace(/\.[^.]+$/, '').replaceAll('/', ':');
    assets.push({
      id,
      layer: category.layer,
      files: { '1x': relativePath },
      anchor: { x: 0.5, y: 0.5 },
      size: category.size,
    });
  }
}

assets.sort((left, right) => left.id.localeCompare(right.id));
if (!assets.length) throw new Error(`Keine Assets unter ${assetRoot} gefunden.`);
await writeFile(path.join(assetRoot, 'manifest.json'), `${JSON.stringify({ version: 1, assets }, null, 2)}\n`);
console.log(`Manifest erstellt: ${assets.length} Assets aus den vorhandenen Auflösungen.`);