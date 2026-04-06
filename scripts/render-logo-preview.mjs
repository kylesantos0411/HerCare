import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const rootDir = resolve(process.cwd());
const previewBaseName = process.argv[2] ?? 'hercare-logo-clean-v1-preview';
const previewHtmlPath = `/design/logo/${previewBaseName}.html`;
const outputPath = join(rootDir, 'design', 'logo', `${previewBaseName}.png`);
const tempProfileDir = join(rootDir, 'design', 'logo', 'edge-preview-profile');
const edgeCandidates = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function findEdgePath() {
  return edgeCandidates.find((candidate) => existsSync(candidate)) ?? null;
}

function createStaticServer() {
  return createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      const pathname = requestUrl.pathname === '/' ? previewHtmlPath : requestUrl.pathname;
      const filePath = join(rootDir, pathname.replace(/^\/+/, ''));
      const extension = extname(filePath).toLowerCase();
      const fileContents = await import('node:fs/promises').then(({ readFile }) => readFile(filePath));

      response.writeHead(200, {
        'Content-Type': mimeTypes[extension] ?? 'application/octet-stream',
      });
      response.end(fileContents);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain' });
      response.end(error instanceof Error ? error.message : 'Unable to serve preview.');
    }
  });
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

async function main() {
  const edgePath = findEdgePath();

  if (!edgePath) {
    throw new Error('Microsoft Edge was not found on this machine.');
  }

  await rm(outputPath, { force: true });
  await rm(tempProfileDir, { recursive: true, force: true });
  await mkdir(tempProfileDir, { recursive: true });

  const server = createStaticServer();

  await new Promise((resolvePromise) => {
    server.listen(4181, '127.0.0.1', resolvePromise);
  });

  try {
    await runCommand(edgePath, [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--run-all-compositor-stages-before-draw',
      '--no-first-run',
      '--window-size=1600,1000',
      '--virtual-time-budget=2000',
      `--user-data-dir=${tempProfileDir}`,
      `--screenshot=${outputPath}`,
      `http://127.0.0.1:4181/design/logo/${previewBaseName}.html`,
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

  console.log(`Logo preview ready: ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
