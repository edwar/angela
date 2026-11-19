// Genera src/tokens/palette.css a partir de src/palette.js (la receta del color).
// Uso: pnpm build:palette
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  roles,
  toneRoles,
  toneRecipe,
  neutralToneRecipe,
  surfaceRecipe,
  focusRecipe,
} from '../src/palette.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'src/tokens/palette.css');

const chroma = (role, f) => {
  if (f === 0) return '0';
  if (f === 1) return `var(--angela-${role}-c)`;
  return `calc(var(--angela-${role}-c) * ${f})`;
};
const oklch = (role, [L, f]) => `oklch(${L} ${chroma(role, f)} var(--angela-${role}-h))`;
const token = (name, role, spec) =>
  `  --color-${name}: light-dark(${oklch(role, spec.light)}, ${oklch(role, spec.dark)});`;

const lines = [];
lines.push('/* ARCHIVO GENERADO por scripts/build-palette.mjs a partir de src/palette.js. No lo edites a mano. */');
lines.push('');
lines.push('@layer angela.tokens {');
lines.push('  /*');
lines.push('   * Entradas del tema: tono (h, 0–360) y croma (c, 0–0.2) de cada rol.');
lines.push('   * Sobrescríbelas en :root (o en un elemento con [data-angela-theme]) para cambiar la paleta.');
lines.push('   */');
lines.push('  :root {');
for (const [role, { h, c }] of Object.entries(roles)) {
  if (role === 'neutral') {
    lines.push('    --angela-neutral-h: var(--angela-brand-h);');
    lines.push(`    --angela-neutral-c: ${c};`);
  } else {
    lines.push(`    --angela-${role}-h: ${h};`);
    lines.push(`    --angela-${role}-c: ${c};`);
  }
}
lines.push('  }');
lines.push('');
lines.push('  /* Tokens semánticos. Se recalculan en cualquier subárbol con [data-angela-theme]. */');
lines.push('  :root,');
lines.push('  [data-angela-theme] {');
lines.push('    /* Superficies y texto */');
for (const [name, spec] of Object.entries(surfaceRecipe)) lines.push('  ' + token(name, 'neutral', spec));
lines.push('  ' + token('focus', 'brand', focusRecipe));
for (const role of toneRoles) {
  const recipe = role === 'neutral' ? neutralToneRecipe : toneRecipe;
  lines.push('');
  lines.push(`    /* Rol: ${role} */`);
  for (const [name, spec] of Object.entries(recipe)) lines.push('  ' + token(`${role}-${name}`, role, spec));
}
lines.push('  }');
lines.push('}');
lines.push('');

await mkdir(dirname(out), { recursive: true });
await writeFile(out, lines.join('\n'));
console.log(`Paleta generada en ${out}`);
