// Empaqueta src/angela.css en dist/angela.css resolviendo los @import locales.
// Sin dependencias ni transformaciones: el CSS que escribes es el que se publica.
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMPORT = /^@import\s+["'](\.[^"']+)["'];\s*$/gm;

async function inline(file, seen = new Set()) {
  if (seen.has(file)) throw new Error(`Import circular: ${file}`);
  seen.add(file);
  const css = await readFile(file, 'utf8');
  let out = '';
  let last = 0;
  for (const match of css.matchAll(IMPORT)) {
    out += css.slice(last, match.index);
    out += await inline(resolve(dirname(file), match[1]), new Set(seen));
    last = match.index + match[0].length;
  }
  return out + css.slice(last);
}

const banner = `/*! angela — componentes sobre HTML nativo. Generado desde src/angela.css */\n`;
const css = banner + (await inline(resolve(root, 'src/angela.css')));

await mkdir(resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist/angela.css'), css);
await copyFile(resolve(root, 'src/tailwind.css'), resolve(root, 'dist/tailwind.css'));
console.log(`dist/angela.css (${(Buffer.byteLength(css) / 1024).toFixed(1)} KB)`);
