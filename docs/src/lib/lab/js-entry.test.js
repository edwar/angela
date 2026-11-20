import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { findEntryFunction, registerJsModule } from './js-entry.js';
import { reviewComponent } from './review.js';

const indexJs = readFileSync(new URL('../../../../packages/angela/src/js/index.js', import.meta.url), 'utf8');

describe('findEntryFunction', () => {
  it('prefiere la exportada que empieza por enhance, init o define', () => {
    const js = `export function ayuda() {}\nexport function enhanceGaleria(root = globalThis.document) { return () => {}; }`;
    expect(findEntryFunction(js)).toBe('enhanceGaleria');
  });

  it('acepta funciones flecha exportadas', () => {
    expect(findEntryFunction(`export const initMenu = (root = globalThis.document) => () => {};`)).toBe('initMenu');
  });

  it('si ninguna sigue la convención, usa la primera exportada', () => {
    expect(findEntryFunction(`export function activar(root) {}\nexport function otra() {}`)).toBe('activar');
  });

  it('null si no exporta nada, si solo exporta async o si está comentado', () => {
    expect(findEntryFunction(`document.querySelector('.x').addEventListener('click', () => {});`)).toBeNull();
    expect(findEntryFunction(`export async function enhanceX() {}`)).toBeNull();
    expect(findEntryFunction(`// export function enhanceX(root) {}`)).toBeNull();
  });
});

describe('registerJsModule sobre el index.js real', () => {
  it('importa, reexporta y llama al módulo dentro de angela()', () => {
    const result = registerJsModule(indexJs, 'galeria.js', 'enhanceGaleria');
    expect(result.status).toBe('added');
    expect(result.code).toContain(`import { enhanceGaleria } from './galeria.js';`);
    expect(result.code).toContain(`export { enhanceGaleria } from './galeria.js';`);
    expect(result.code).toMatch(/const cleanups = \[[^\]]*enhanceGaleria\(root\),\n\s*\];/);
    // Lo demás queda igual.
    expect(result.code.replace(/^.*galeria.*\n/gm, '').replace(/^.*enhanceGaleria\(root\),\n/m, '')).toBe(indexJs);
  });

  it('no lo duplica si el módulo ya está registrado', () => {
    expect(registerJsModule(indexJs, 'spotlight.js', 'enhanceSpotlight').status).toBe('present');
  });

  it('si index.js no tiene la forma esperada, no lo toca', () => {
    expect(registerJsModule('export const x = 1;\n', 'a.js', 'enhanceA').status).toBe('unknown');
  });
});

describe('revisión: regla de activación', () => {
  const files = { html: '<p>Hola</p>', css: '' };
  const activacion = (js) => reviewComponent({ ...files, js }).find((h) => h.id === 'activacion');

  it('avisa si el JS no exporta una función de activación', () => {
    expect(activacion(`document.querySelector('.x');`)?.level).toBe('error');
  });

  it('no avisa con una función exportada ni con el JS vacío o solo comentarios', () => {
    expect(activacion(`export function enhanceX(root = globalThis.document) { return () => {}; }`)).toBeUndefined();
    expect(activacion('')).toBeUndefined();
    expect(activacion('// nada todavía\n')).toBeUndefined();
  });
});
