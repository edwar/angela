import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/*
 * Un módulo sin 'use client' (que puede ejecutarse como Server Component) no debe importar
 * directamente uno con 'use client'. Con Next 16 + Turbopack en producción, ese doble camino
 * hacia el mismo módulo de cliente (directo y por el índice) deja componentes en undefined al
 * prerenderizar. La frontera de cliente solo se cruza desde index.ts.
 */
const dir = new URL('.', import.meta.url);
const files = readdirSync(dir).filter((f) => /\.tsx?$/.test(f) && !f.includes('.test.') && f !== 'index.ts');
const source = (f: string) => readFileSync(new URL(f, dir), 'utf8');
const isClient = (f: string) => /^\s*['"]use client['"]/.test(source(f));
const localImports = (f: string) =>
  [...source(f).matchAll(/^import\s+(?!type\b)[^;]*?from\s+'\.\/([\w-]+)\.js'/gm)].map((m) => m[1]);

describe('fronteras de Server Components', () => {
  for (const file of files.filter((f) => !isClient(f))) {
    it(`${file} no importa módulos de cliente`, () => {
      const clientDeps = localImports(file).filter((name) => {
        const dep = files.find((f) => f.replace(/\.tsx?$/, '') === name);
        return dep && isClient(dep);
      });
      expect(clientDeps).toEqual([]);
    });
  }
});

/*
 * Un elemento que llega como prop desde un Server Component puede ser una referencia diferida
 * (lazy), no un elemento: cloneElement lo convierte en un elemento sin tipo y el prerender falla
 * con "Element type is invalid". Por eso los disparadores son objetos de props, no elementos.
 */
describe('sin cloneElement', () => {
  for (const file of files) {
    it(`${file} no usa cloneElement`, () => {
      expect(source(file)).not.toMatch(/\bcloneElement\b/);
    });
  }
});
