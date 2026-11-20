import { describe, expect, it } from 'vitest';
import { buildPreviewDocument, sourcesFor } from './preview.js';

const build = (js, extra = {}) => buildPreviewDocument({ html: '<p>Hola</p>', css: '', js, baseCss: '', ...extra });

describe('buildPreviewDocument', () => {
  it('llama a la función de activación del editor, como angela() en la web', () => {
    expect(build(`export function enhanceGaleria(root = document) {}`)).toContain('const userEntry = "enhanceGaleria";');
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
