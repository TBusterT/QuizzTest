import { mkdir, readdir, readFile, lstat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entries = [
  '.env.example',
  '.gitignore',
  '.nvmrc',
  '.prettierignore',
  '.prettierrc.json',
  'compose.yaml',
  'package.json',
  'package-lock.json',
  'README.md',
  'README.uk.md',
  'scripts',
  'backend/.env.example',
  'backend/eslint.config.mjs',
  'backend/nest-cli.json',
  'backend/package.json',
  'backend/prisma.config.ts',
  'backend/tsconfig.json',
  'backend/tsconfig.build.json',
  'backend/src',
  'backend/prisma',
  'backend/test',
  'frontend/.env.example',
  'frontend/eslint.config.mjs',
  'frontend/package.json',
  'frontend/tsconfig.json',
  'frontend/src',
];
const excludedDirectories = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'coverage',
  'generated',
  '.verification',
  'release',
]);
const files = {};

async function collect(relativePath) {
  const filename = path.basename(relativePath);
  if (filename.startsWith('.env') && filename !== '.env.example') return;
  if (/\.(log|tsbuildinfo|zip)$/.test(filename)) return;

  const absolutePath = path.join(root, relativePath);
  const info = await lstat(absolutePath);
  if (info.isSymbolicLink()) {
    throw new Error(`Refusing to package a symbolic link: ${relativePath}`);
  }
  if (info.isDirectory()) {
    if (excludedDirectories.has(filename)) return;
    for (const child of (await readdir(absolutePath)).sort()) {
      await collect(path.join(relativePath, child));
    }
  } else if (info.isFile()) {
    files[`quiz-builder/${relativePath.split(path.sep).join('/')}`] =
      new Uint8Array(await readFile(absolutePath));
  }
}

for (const entry of entries) await collect(entry);

const outputDirectory = path.join(root, 'release');
await mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, 'quiz-builder-source.zip');
const archive = zipSync(files, { level: 9 });
await writeFile(outputPath, archive);
console.log(
  `Packaged ${Object.keys(files).length} source files (${archive.byteLength} bytes): ${outputPath}`,
);
