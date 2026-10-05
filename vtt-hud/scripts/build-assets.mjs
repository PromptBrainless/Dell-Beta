import { execFileSync } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const repo = path.resolve(root, '..');
const sourceRoot = path.join(root, '.sources', 'public', 'kampf', 'v2');
const widths = [640, 1280, 1792];
const tags = ['1x', '2x', '3x'];

async function ensureSources() {
  try {
    await readdir(sourceRoot);
    return;
  } catch { /* extract */ }
  const zips = ['abacktools-grok-workspace-part3-of5.zip', 'abacktools-grok-workspace-part4-of5.zip'];
  for (const zip of zips) {
    execFileSync('unzip', ['-o', '-q', path.join(repo, zip), '-d', path.join(root, '.sources'), 'public/kampf/v2/*'], { stdio: 'inherit' });
  }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  }));
  return files.flat();
}

function vignette(width, height) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><radialGradient id="v" cx="50%" cy="46%" r="72%"><stop offset="58%" stop-color="#fff"/><stop offset="100%" stop-color="#000"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`);
}

async function emitRaster(input, outBase, { maxWidths = widths, vignetteOn = false } = {}) {
  const meta = await sharp(input).metadata();
  const files = {};
  for (let i = 0; i < maxWidths.length; i++) {
    const target = Math.min(maxWidths[i], meta.width || maxWidths[i]);
    let pipeline = sharp(input).rotate().resize({ width: target, withoutEnlargement: true });
    if (vignetteOn) {
      const h = Math.round(target * ((meta.height || 9) / (meta.width || 16)));
      pipeline = pipeline.composite([{ input: vignette(target, h), blend: 'multiply' }]);
    }
    const tag = tags[i];
    const avif = `${outBase}@${tag}.avif`;
    const webp = `${outBase}@${tag}.webp`;
    await pipeline.clone().avif({ quality: 46, effort: 2 }).toFile(avif);
    await pipeline.clone().webp({ quality: 72 }).toFile(webp);
    files[tag] = { avif: path.relative(root, avif).split(path.sep).join('/'), webp: path.relative(root, webp).split(path.sep).join('/') };
    if (i === 0) {
      const jpg = `${outBase}.jpg`;
      await pipeline.clone().jpeg({ quality: 76 }).toFile(jpg);
      files.jpg = path.relative(root, jpg).split(path.sep).join('/');
    } else if (i === 1) {
      const jpg = `${outBase}@${tag}.jpg`;
      await pipeline.clone().jpeg({ quality: 74 }).toFile(jpg);
      files.jpg2 = path.relative(root, jpg).split(path.sep).join('/');
    }
  }
  return files;
}

const CROPS = {
  brecher: { x: 0.42, y: 0.12, s: 0.16 },
  laeuferin: { x: 0.43, y: 0.08, s: 0.15 },
  archivar: { x: 0.40, y: 0.04, s: 0.18 },
  waechter: { x: 0.41, y: 0.02, s: 0.16 },
  jaeger: { x: 0.40, y: 0.10, s: 0.16 },
};

async function portrait(id, source) {
  const dir = path.join(root, 'assets', 'portraits');
  const squareDir = path.join(dir, 'square');
  await mkdir(squareDir, { recursive: true });
  const meta = await sharp(source).metadata();
  const crop = CROPS[id];
  const side = Math.round(meta.width * crop.s);
  const left = Math.max(0, Math.min(Math.round(meta.width * crop.x), meta.width - side));
  const top = Math.max(0, Math.min(Math.round(meta.height * crop.y), meta.height - side));
  const raw = await sharp(source).extract({ left, top, width: side, height: side }).resize(768, 768).png().toBuffer();
  for (const size of [256, 512, 768]) {
    const circle = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`);
    const feather = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><radialGradient id="f" cx="50%" cy="42%" r="52%"><stop offset="72%" stop-color="#fff"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#f)"/></svg>`);
    const round = sharp(raw).resize(size, size).ensureAlpha().composite([{ input: circle, blend: 'dest-in' }]);
    await round.clone().png().toFile(path.join(dir, `${id}@${size}.png`));
    await round.clone().webp({ quality: 78 }).toFile(path.join(dir, `${id}@${size}.webp`));
    await round.clone().avif({ quality: 50, effort: 2 }).toFile(path.join(dir, `${id}@${size}.avif`));
    await sharp(raw).resize(size, size).ensureAlpha().composite([{ input: feather, blend: 'dest-in' }]).png().toFile(path.join(squareDir, `${id}@${size}.png`));
  }
  await sharp(path.join(dir, `${id}@512.png`)).toFile(path.join(dir, `${id}.png`));
}

async function rasterIcons() {
  const dir = path.join(root, 'assets', 'icons');
  const out = path.join(dir, 'raster');
  await mkdir(out, { recursive: true });
  const svgs = (await readdir(dir)).filter(name => name.endsWith('.svg'));
  for (const name of svgs) {
    const stem = name.replace(/\.svg$/, '');
    for (const size of [24, 32, 48]) {
      await sharp(path.join(dir, name), { density: 384 }).resize(size, size).png().toFile(path.join(out, `${stem}-${size}.png`));
    }
  }
}

const manifestAssets = [];
function addAsset(id, layer, files, size) {
  manifestAssets.push({ id, layer, files, anchor: { x: 0.5, y: 0.5 }, size });
}

await ensureSources();
if (process.env.ONLY === 'portraits') {
  for (const id of ['brecher', 'laeuferin', 'archivar', 'waechter', 'jaeger']) {
    await portrait(id, path.join(sourceRoot, id, 'offen.jpg'));
  }
  console.log('Porträts neu geschnitten.');
  process.exit(0);
}
const plates = (await walk(sourceRoot)).filter(file => file.endsWith('.jpg') && !file.includes(`${path.sep}bg${path.sep}`));
for (const file of plates) {
  const rel = path.relative(sourceRoot, file);
  const stem = rel.replace(/\.jpg$/, '');
  const out = path.join(root, 'assets', 'art', stem);
  await mkdir(path.dirname(out), { recursive: true });
  const files = await emitRaster(file, out);
  addAsset('art:' + stem.split(path.sep).join(':'), 9, { '1x': files.jpg, '1x-avif': files['1x'].avif, '1x-webp': files['1x'].webp, '2x': files.jpg2, '2x-avif': files['2x'].avif, '2x-webp': files['2x'].webp, '3x-avif': files['3x'].avif, '3x-webp': files['3x'].webp }, { width: 640, height: 360 });
}

const bgs = (await walk(path.join(sourceRoot, 'bg'))).filter(file => file.endsWith('.jpg'));
for (const file of bgs) {
  const id = path.basename(file, '.jpg');
  const out = path.join(root, 'assets', 'textures', id);
  const files = await emitRaster(file, out, { vignetteOn: true });
  addAsset('textures:' + id, 0, { '1x': files.jpg, '1x-avif': files['1x'].avif, '1x-webp': files['1x'].webp, '2x': files.jpg2, '2x-avif': files['2x'].avif, '2x-webp': files['2x'].webp, '3x-avif': files['3x'].avif, '3x-webp': files['3x'].webp }, { width: 1792, height: 1008 });
}

for (const id of ['brecher', 'laeuferin', 'archivar', 'waechter', 'jaeger']) {
  const source = path.join(sourceRoot, id, 'offen.jpg');
  await portrait(id, source);
  addAsset('portraits:' + id, 2, {
    round: `assets/portraits/${id}.png`,
    '256': `assets/portraits/${id}@256.png`,
    '512': `assets/portraits/${id}@512.png`,
    '768': `assets/portraits/${id}@768.png`,
    square: `assets/portraits/square/${id}@512.png`,
  }, { width: 512, height: 512 });
}

await rasterIcons();
const icons = (await readdir(path.join(root, 'assets', 'icons'))).filter(name => name.endsWith('.svg'));
for (const name of icons) {
  const id = name.replace(/\.svg$/, '');
  addAsset('icons:' + id, 10, { svg: `assets/icons/${name}`, 24: `assets/icons/raster/${id}-24.png`, 32: `assets/icons/raster/${id}-32.png`, 48: `assets/icons/raster/${id}-48.png` }, { width: 32, height: 32 });
}
for (const name of await readdir(path.join(root, 'assets', 'ui'))) {
  if (!name.endsWith('.svg')) continue;
  addAsset('ui:' + name.replace(/\.svg$/, ''), 9, { svg: `assets/ui/${name}` }, { width: 96, height: 96 });
}

manifestAssets.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(path.join(root, 'assets', 'manifest.json'), JSON.stringify({ version: 2, assets: manifestAssets }, null, 2) + '\n');
const probe = await readFile(path.join(root, 'assets', 'portraits', 'brecher.png'));
if (probe.length < 500) throw new Error('Porträt zu klein, Freistellung prüfen.');
console.log(`Assets gebaut: ${manifestAssets.length} Manifest-Einträge.`);
