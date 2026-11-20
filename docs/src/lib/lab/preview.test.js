import { describe, expect, it } from 'vitest';
import { buildPreviewDocument, PREVIEW_CSP, previewCsp, sourcesFor } from './preview.js';

const build = (js, extra = {}) => buildPreviewDocument({ html: '<p>Hola</p>', css: '', js, baseCss: '', ...extra });

describe('buildPreviewDocument', () => {
  it('llama a la función de activación del editor, como angela() en la web', () => {
    expect(build(`export function enhanceGaleria(root = globalThis.document) {}`)).toContain('const userEntry = "enhanceGaleria";');
  });

  it('sin función exportada, el JS se ejecuta tal cual', () => {
    expect(build(`console.log(1);`)).toContain('const userEntry = null;');
  });

  it('si el editor sustituye un módulo de angela, lo activa angela() y no se llama dos veces', () => {
    expect(build(`export function enhanceForms() {}`, { jsModule: 'forms.js' })).toContain('const userEntry = null;');
  });
});

describe('sourcesFor', () => {
  it('resuelve los del núcleo por el mapa y los aportados por convención', () => {
    expect(sourcesFor('campos')).toEqual({ css: 'components/field.css', js: 'forms.js' });
    expect(sourcesFor('spotlight')).toEqual({ css: 'components/spotlight.css', js: 'spotlight.js' });
    expect(sourcesFor('cards')).toEqual({ css: 'components/cards.css' });
    expect(sourcesFor('no-existe')).toEqual({});
  });
});

describe('previewCsp', () => {
  it('admite las imágenes del propio sitio, también por http en local', () => {
    expect(previewCsp('http://localhost:4321')).toContain('img-src https: data: blob: http://localhost:4321;');
    expect(previewCsp('https://angela.cognilab.dev')).toContain('img-src https: data: blob: https://angela.cognilab.dev;');
  });

  it('ignora lo que no es un origen limpio: no se puede colar otra directiva', () => {
    expect(previewCsp("http://x.com; script-src *")).toBe(PREVIEW_CSP);
    expect(previewCsp('http://x.com/ruta')).toBe(PREVIEW_CSP);
    expect(previewCsp('no es una url')).toBe(PREVIEW_CSP);
    expect(previewCsp(null)).toBe(PREVIEW_CSP);
  });

  it('el documento de la vista previa la lleva', () => {
    const doc = buildPreviewDocument({ html: '', css: '', js: '', baseCss: '', imageOrigin: 'http://localhost:4321' });
    expect(doc).toContain('http://localhost:4321');
  });
});
