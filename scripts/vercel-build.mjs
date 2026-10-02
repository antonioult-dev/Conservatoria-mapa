import { spawnSync } from 'node:child_process';
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDirectory = path.join(projectRoot, 'public');
const distributionDirectory = path.join(projectRoot, 'dist');
const outputDirectory = path.resolve(projectRoot, process.argv[2] || 'public');

if (outputDirectory === distributionDirectory || outputDirectory.startsWith(`${distributionDirectory}${path.sep}`)) {
  throw new Error('O destino dos arquivos estáticos não pode ficar dentro de dist/.');
}

// Vite outputs only index.html and assets/ into public during the Vercel build.
await rm(path.join(publicDirectory, 'index.html'), { force: true });
await rm(path.join(publicDirectory, 'assets'), { recursive: true, force: true });

const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const build = spawnSync(process.execPath, [viteCli, 'build', '--configLoader', 'native'], {
  cwd: projectRoot,
  stdio: 'inherit',
});

if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

await mkdir(outputDirectory, { recursive: true });
await cp(distributionDirectory, outputDirectory, { recursive: true, force: true });
console.log(`Frontend Vite copiado para ${path.relative(projectRoot, outputDirectory) || '.'}/ para distribuição estática.`);
