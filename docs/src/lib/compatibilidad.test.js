import { describe, expect, it } from 'vitest';
import { features } from 'web-features';
import { CARACTERISTICAS, NAVEGADORES, compatibilidad, detectar } from './compatibilidad.js';

const NUCLEO = `@layer angela.tokens { :root { --c: light-dark(oklch(0.5 0.1 262), oklch(0.9 0.1 262)); } }
@layer angela.base { :where(a) { & :focus-visible { color: var(--c); } } }`;

describe('detectar', () => {
  it('encuentra lo que usa el CSS y el HTML, sin contar los comentarios', () => {
    const ids = (css, html) => detectar({ css, html }).map((c) => c.id);
    expect(ids('.x:has(> input) { inline-size: 1rem }')).toEqual(expect.arrayContaining(['has', 'logical-properties']));
    expect(ids('/* :has(no) */ .x { color: red }')).not.toContain('has');
    expect(ids('', '<details name="faq"><summary>a</summary></details>')).toEqual(expect.arrayContaining(['details', 'details-name']));
    expect(ids('select { appearance: base-select }')).toContain('customizable-select');
  });

  it('cada característica de la tabla existe en web-features', () => {
    const sinDatos = CARACTERISTICAS.filter((c) => !features[c.id]?.status).map((c) => c.id);
    expect(sinDatos).toEqual([]);
  });
});

describe('compatibilidad', () => {
  const r = compatibilidad({
    css: '.s { &::picker(select) { appearance: base-select } }',
    html: '<button commandfor="d" command="show-modal">a</button><dialog id="d"></dialog>',
    nucleo: NUCLEO,
  });

  it('la versión mínima la marca la característica base más nueva (light-dark en el núcleo)', () => {
    const chrome = r.base.navegadores.find((n) => n.id === 'chrome');
    expect(chrome.desde).toBe(features['light-dark'].status.support.chrome);
    expect(r.base.navegadores).toHaveLength(NAVEGADORES.length);
  });

  it('las mejoras y los polyfills no suben la versión mínima; cada mejora da su propio porcentaje', () => {
    expect(r.mejoras.map((m) => m.id)).toContain('customizable-select');
    expect(r.polyfills.map((p) => p.id)).toContain('invoker-commands');
    const select = r.mejoras.find((m) => m.id === 'customizable-select');
    expect(select.global).toBeLessThan(r.base.global);
    expect(select.nota).toMatch(/nativo/);
  });

  it('los porcentajes están entre 0 y 100, y el global no pasa del uso que recogen los datos', () => {
    for (const n of r.base.navegadores) expect(n.porcentaje).toBeGreaterThanOrEqual(0), expect(n.porcentaje).toBeLessThanOrEqual(100);
    expect(r.base.global).toBeGreaterThan(50);
    expect(r.base.global).toBeLessThanOrEqual(r.identificado);
    expect(r.identificado).toBeLessThanOrEqual(r.total);
  });

  it('lo del núcleo no se repite como propio del componente', () => {
    expect(r.nucleo.map((c) => c.id)).toEqual(expect.arrayContaining(['cascade-layers', 'light-dark', 'oklab', 'nesting']));
    expect(r.propias.map((c) => c.id)).not.toContain('light-dark');
    expect(r.propias.map((c) => c.id)).toContain('dialog');
  });
});
