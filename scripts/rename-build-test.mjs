import { readdir, rename, stat } from 'node:fs/promises';
import { join, parse } from 'node:path';

async function renameRecursive(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async entry => {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await renameRecursive(fullPath);
        return;
      }
      if (entry.isFile() && fullPath.endsWith('.js')) {
        const { dir: baseDir, name } = parse(fullPath);
        const target = join(baseDir, `${name}.cjs`);
        await rename(fullPath, target);
      }
    })
  );
}

const targetDir = join(process.cwd(), 'build-test');

try {
  const stats = await stat(targetDir);
  if (!stats.isDirectory()) {
    process.exit(0);
  }
  await renameRecursive(targetDir);
} catch (error) {
  if (error && error.code === 'ENOENT') {
    process.exit(0);
  }
  throw error;
}
