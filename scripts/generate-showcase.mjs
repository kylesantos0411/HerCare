import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDir = resolve(process.cwd());
const distDir = join(rootDir, 'dist');
const outputDir = join(rootDir, 'showcase-output');
const screenshotDir = join(outputDir, 'screens');
const tempProfileDir = join(outputDir, 'edge-profile');
const posterHtmlPath = join(outputDir, 'hercare-showcase-poster.html');
const posterPdfPath = join(outputDir, 'HerCare-showcase.pdf');
const edgeCandidates = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const screens = [
  { id: 'splash', label: 'Splash' },
  { id: 'welcome', label: 'Welcome' },
  { id: 'home', label: 'Home' },
  { id: 'shift', label: 'Shift Schedule' },
  { id: 'meals', label: 'Meals' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'hydration', label: 'Hydration' },
  { id: 'sleep', label: 'Sleep Log' },
  { id: 'mood', label: 'Mood Check' },
  { id: 'notes', label: 'Notes' },
  { id: 'you', label: 'For You' },
  { id: 'open_when', label: 'Open When' },
];

const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function findEdgePath() {
  return edgeCandidates.find((candidate) => existsSync(candidate)) ?? null;
}

async function runCommand(command, args) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
    });

    child.on('error', rejectPromise);
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${command} exited with code ${code ?? 'unknown'}.`));
    });
  });
}

function createStaticServer() {
  return createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
      let filePath = join(distDir, pathname.replace(/^\/+/, ''));

      if (!existsSync(filePath)) {
        filePath = join(distDir, 'index.html');
      }

      const fileContents = await readFile(filePath);
      const extension = extname(filePath).toLowerCase();

      response.writeHead(200, {
        'Content-Type': mimeTypes[extension] ?? 'application/octet-stream',
      });
      response.end(fileContents);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain' });
      response.end(error instanceof Error ? error.message : 'Unable to serve file.');
    }
  });
}

function buildPosterHtml() {
  const screenshotCards = screens
    .map(
      (screen) => `
        <figure class="poster-card">
          <img src="./screens/${screen.id}.png" alt="${screen.label}" />
          <figcaption>${screen.label}</figcaption>
        </figure>
      `,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>HerCare Showcase Poster</title>
    <style>
      @page {
        size: A3 portrait;
        margin: 14mm;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        background: linear-gradient(180deg, #f7e8ef 0%, #fffafc 100%);
        color: #5a4352;
      }

      .poster-shell {
        min-height: 100vh;
        padding: 12mm 8mm 8mm;
      }

      .poster-header {
        text-align: center;
        margin-bottom: 10mm;
      }

      .poster-title {
        margin: 0;
        font-family: Georgia, serif;
        font-size: 30px;
        letter-spacing: 0.02em;
        color: #b87393;
      }

      .poster-subtitle {
        margin: 10px 0 0;
        font-size: 14px;
        color: #876a79;
      }

      .poster-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10mm 7mm;
      }

      .poster-card {
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .poster-card img {
        display: block;
        width: 100%;
        border-radius: 28px;
        box-shadow: 0 18px 40px rgba(184, 115, 147, 0.16);
        background: #ffffff;
      }

      .poster-card figcaption {
        font-size: 11px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #9a7b8b;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <main class="poster-shell">
      <header class="poster-header">
        <h1 class="poster-title">HerCare</h1>
        <p class="poster-subtitle">Nurse Wellness &amp; Shift Companion App</p>
      </header>

      <section class="poster-grid">
        ${screenshotCards}
      </section>
    </main>
  </body>
</html>`;
}

async function main() {
  if (!existsSync(distDir)) {
    throw new Error('dist/ was not found. Run a production build first.');
  }

  const edgePath = findEdgePath();

  if (!edgePath) {
    throw new Error('Microsoft Edge was not found on this machine.');
  }

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(screenshotDir, { recursive: true });
  await mkdir(tempProfileDir, { recursive: true });

  const server = createStaticServer();

  await new Promise((resolvePromise) => {
    server.listen(4173, '127.0.0.1', resolvePromise);
  });

  try {
    for (const screen of screens) {
      const targetPath = join(screenshotDir, `${screen.id}.png`);
      const captureUrl = `http://127.0.0.1:4173/?showcase=${screen.id}&capture=1`;

      await runCommand(edgePath, [
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        '--run-all-compositor-stages-before-draw',
        '--no-first-run',
        '--window-size=414,896',
        '--virtual-time-budget=4000',
        `--user-data-dir=${tempProfileDir}`,
        `--screenshot=${targetPath}`,
        captureUrl,
      ]);
    }

    await writeFile(posterHtmlPath, buildPosterHtml(), 'utf8');

    await runCommand(edgePath, [
      '--headless',
      '--disable-gpu',
      '--no-first-run',
      `--user-data-dir=${tempProfileDir}`,
      '--print-to-pdf-no-header',
      `--print-to-pdf=${posterPdfPath}`,
      pathToFileURL(posterHtmlPath).href,
    ]);
  } finally {
    await new Promise((resolvePromise, rejectPromise) => {
      server.close((error) => {
        if (error) {
          rejectPromise(error);
          return;
        }

        resolvePromise();
      });
    });
  }

  console.log(`Showcase PDF ready: ${posterPdfPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
