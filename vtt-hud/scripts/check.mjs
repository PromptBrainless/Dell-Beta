import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const screenshotDir = path.join(root, 'screenshots');
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
];
const errors = [];

async function availablePort() {
  return new Promise((resolve, reject) => {
    const listener = createServer();
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', () => {
      const { port } = listener.address();
      listener.close(() => resolve(port));
    });
  });
}

const port = await availablePort();
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
  cwd: root,
  stdio: 'ignore',
});
let browser;

try {
  await mkdir(screenshotDir, { recursive: true });
  browser = await chromium.launch({ headless: true });

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    page.on('console', message => {
      if (message.type() === 'error') errors.push(`${viewport.name}: console: ${message.text()}`);
    });
    page.on('pageerror', error => errors.push(`${viewport.name}: page: ${error.message}`));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`${viewport.name}: HTTP ${response.status()} ${response.url()}`);
    });

    let response;
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        response = await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
        break;
      } catch (error) {
        if (attempt === 29) throw error;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    if (!response?.ok()) errors.push(`${viewport.name}: Seite lieferte ${response?.status() ?? 'keine Antwort'}`);
    await page.waitForTimeout(300);

    const missingLayers = await page.evaluate(() =>
      Array.from({ length: 11 }, (_, index) => `l${index}`).filter(id => !document.getElementById(id)));
    if (missingLayers.length) errors.push(`${viewport.name}: fehlende Layer ${missingLayers.join(', ')}`);

    const brokenImages = await page.locator('img').evaluateAll(images =>
      images.filter(image => image.complete && image.naturalWidth === 0).map(image => image.src));
    if (brokenImages.length) errors.push(`${viewport.name}: defekte Bilder ${brokenImages.join(', ')}`);

    await page.screenshot({ path: path.join(screenshotDir, `${viewport.name}.png`), fullPage: true });
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`HUD geprüft: ${viewports.map(({ name }) => name).join(', ')}; Screenshots: ${screenshotDir}`);
}