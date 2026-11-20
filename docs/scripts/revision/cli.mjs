#!/usr/bin/env node
/**
 * Revisión automática de un PR de componentes. La ejecuta .github/workflows/revision.yml.
 *
 *   node docs/scripts/revision/cli.mjs --base origin/main --out revision
 *
 * Escribe <out>/comentario.md (el comentario del PR) y <out>/resultado.json, y sale con
 * código 1 si el PR incumple alguna regla o falla algún paso del CI.
 *
 * Los pasos del CI llegan por variables de entorno: CHECK_TEST, CHECK_TYPECHECK,
 * CHECK_CONTRAST y CHECK_BUILD con el `outcome` de cada paso (success | failure | skipped),
 * y HEAD_SHA con el commit del PR.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { runnerImport } from 'vite';
import { renderComment, reviewUnit, touchedComponents, verdict } from './revision.js';

const PRODUCTION_URL = 'https://angela.cognilab.dev';

const { values } = parseArgs({
  options: {
    base: { type: 'string', default: 'origin/main' },
    out: { type: 'string', default: 'revision' },
  },
});

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = resolve(docsRoot, '..');
const git = (...args) =>
  execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });

// Lo que cambia respecto al punto en que la rama salió de main.
const mergeBase = git('merge-base', values.base, 'HEAD').trim();
// Contra la copia de trabajo (en el CI es el commit del PR; en local incluye lo que aún no se ha commiteado).
const changed = [
  ...git('diff', '--name-only', '--no-renames', mergeBase).split('\n'),
  ...git('ls-files', '--others', '--exclude-standard').split('\n'),
].filter(Boolean);

/** @param {'base' | 'head'} side */
function read(side, path) {
  if (side === 'head') {
    const file = join(repoRoot, path);
    return existsSync(file) ? readFileSync(file, 'utf8') : null;
  }
  try {
    return git('show', `${mergeBase}:${path}`);
  } catch {
    return null;
  }
}

// El catálogo y la revisión del laboratorio usan import.meta.glob: se cargan con Vite.
const load = async (path) =>
  (await runnerImport(join(docsRoot, path), { root: docsRoot, configFile: false, logLevel: 'silent' })).module;
const { components } = await load('src/data/components.js');
const { componentSources } = await load('src/lib/lab/preview.js');
const { reviewComponent, MANUAL_CHECKS } = await load('src/lib/lab/review.js');
const { findEntryFunction } = await load('src/lib/lab/js-entry.js');
const { apiTokens, rowToken } = await load('src/lib/lab/docs-entry.js');

const units = touchedComponents(changed, componentSources);

// Documentación de cada lado: cada página es su archivo en docs/src/data/componentes/. Si en
// main aún no existe (un componente nuevo, o el PR que pasó el núcleo a un archivo por
// componente), los del núcleo toman la actual.
const docsHead = Object.fromEntries(components.map((c) => [c.slug, c]));
const docsBase = {};
for (const slug of units.flatMap((u) => u.slugs)) {
  const source = read('base', `docs/src/data/componentes/${slug}.js`);
  if (source) {
    docsBase[slug] = (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).default;
  } else if (componentSources[slug]) {
    docsBase[slug] = docsHead[slug];
  }
}

const reviewed = units.map((unit) =>
  reviewUnit(unit, { read, docs: { base: docsBase, head: docsHead }, reviewComponent, findEntryFunction, apiTokens, rowToken }),
);

const outcome = (name) => process.env[name] ?? 'success';
const checks = [
  { name: 'Tests (`pnpm test`)', env: 'CHECK_TEST' },
  { name: 'Tipos (`pnpm typecheck`)', env: 'CHECK_TYPECHECK' },
  { name: 'Contraste WCAG AA (`pnpm check:contrast`)', env: 'CHECK_CONTRAST' },
  { name: 'Build (`pnpm build`)', env: 'CHECK_BUILD' },
].map(({ name, env }) => ({ name, ok: outcome(env) === 'success' }));

const comment = renderComment({
  checks,
  components: reviewed,
  manualChecks: MANUAL_CHECKS,
  productionUrl: PRODUCTION_URL,
  // En el CI, HEAD es el commit de mezcla que crea GitHub: se muestra el del PR.
  sha: process.env.HEAD_SHA || git('rev-parse', 'HEAD').trim(),
});
const result = verdict(checks, reviewed);

const outDir = resolve(process.cwd(), values.out);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'comentario.md'), `${comment}\n`);
writeFileSync(join(outDir, 'resultado.json'), `${JSON.stringify({ ...result, componentes: reviewed }, null, 2)}\n`);

console.log(comment);
process.exit(result.ok ? 0 : 1);
