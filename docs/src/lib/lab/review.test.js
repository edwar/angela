import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { reviewComponent } from './review.js';

const delegacion = (js) => reviewComponent({ html: '', css: '', js }).find((h) => h.id === 'delegacion');
const modulo = (name) => readFileSync(new URL(`../../../../packages/angela/src/js/${name}`, import.meta.url), 'utf8');

describe('regla de delegación', () => {
  it('marca como error escuchar sobre elementos buscados al arrancar, aunque se guarden en una variable', () => {
    // La propuesta que hizo la IA para el spotlight.
    const js = `export function enhanceSpotlight(root = globalThis.document) {
  if (typeof window === "undefined") return () => {};
  const spotlights = root.querySelectorAll('.spotlight');
  const listeners = [];
  spotlights.forEach((spotlight) => {
    const handler = () => {};
    spotlight.addEventListener('pointermove', handler);
    listeners.push({ spotlight, handler });
  });
  return () => listeners.forEach(({ spotlight, handler }) => spotlight.removeEventListener('pointermove', handler));
}`;
    expect(delegacion(js)).toMatchObject({ level: 'error' });
    expect(delegacion(js).text).toContain('spotlight.addEventListener');
  });

  it('también el patrón clásico y el de un solo elemento', () => {
    expect(delegacion(`document.querySelectorAll('.x').forEach((el) => el.addEventListener('click', f));`)).toBeTruthy();
    expect(delegacion(`const s = document.querySelector('.s');\ns.addEventListener('pointermove', f);`)).toBeTruthy();
  });

  it('no marca la delegación en root, document o window', () => {
    const js = `export function enhanceX(root = globalThis.document) {
  const meta = document.querySelector('meta');
  const on = (event) => event.target.closest('.x');
  root.addEventListener('click', on);
  window.addEventListener('storage', on);
  return () => root.removeEventListener('click', on);
}`;
    expect(delegacion(js)).toBeUndefined();
  });

  it('acepta un MutationObserver o un custom element', () => {
    expect(delegacion(`const el = document.querySelector('.x');\nel.addEventListener('click', f);\nnew MutationObserver(f);`)).toBeUndefined();
    expect(delegacion(`class T extends HTMLElement { connectedCallback() { this.querySelector('b').addEventListener('click', f); } }`)).toBeUndefined();
  });

  it('ningún módulo de angela incumple la regla', () => {
    for (const name of ['forms.js', 'overlays.js', 'tabs.js', 'theme.js', 'spotlight.js']) {
      expect(delegacion(modulo(name)), name).toBeUndefined();
    }
  });
});

describe('regla ssr: valor por defecto evaluado antes de la guarda', () => {
  const ssr = (js) => reviewComponent({ html: '', css: '', js }).find((h) => h.id === 'ssr');

  it('avisa de root = document aunque haya guarda (la guarda llega tarde)', () => {
    const js = `export function enhanceX(root = document) {\n  if (typeof window === 'undefined') return () => {};\n  return () => {};\n}`;
    expect(ssr(js)?.text).toContain('root = globalThis.document');
  });

  it('también dentro de un objeto de opciones', () => {
    expect(ssr(`export function angela({ root = document, polyfills = true } = {}) { if (typeof window === 'undefined') return; }`)).toBeTruthy();
  });

  it('no avisa con root = globalThis.document y guarda', () => {
    const js = `export function enhanceX(root = globalThis.document) {\n  if (typeof window === 'undefined' || !root) return () => {};\n  return () => {};\n}`;
    expect(ssr(js)).toBeUndefined();
  });

  it('ningún módulo de angela usa el patrón', () => {
    for (const name of ['index.js', 'forms.js', 'overlays.js', 'tabs.js', 'theme.js', 'spotlight.js']) {
      expect(ssr(modulo(name))?.text ?? '', name).not.toContain('valor por defecto');
    }
  });
});

describe('sin-efecto', () => {
  const sinEfecto = (js) => reviewComponent({ html: '', css: '', js }).find((h) => h.id === 'sin-efecto');
  it('marca como error un JS que no hace nada', () => {
    expect(sinEfecto("export function enhanceNota(root = globalThis.document) {\n  if (typeof window === 'undefined' || !root) return () => {};\n  return () => {};\n}")?.level).toBe('error');
  });
  it('no dice nada sin JS o con un JS que trabaja', () => {
    expect(sinEfecto('')).toBeUndefined();
    expect(sinEfecto("export function enhanceX(root = globalThis.document) { if (typeof window === 'undefined') return () => {}; const f = () => {}; root.addEventListener('click', f); return () => root.removeEventListener('click', f); }")).toBeUndefined();
  });
});

describe('elemento-propio', () => {
  const hallazgo = (files) => reviewComponent({ html: '', css: '', js: '', ...files }).find((h) => h.id === 'elemento-propio');
  it('rechaza etiquetas propias en el HTML', () => {
    expect(hallazgo({ html: '<angela-calendar class="calendar"></angela-calendar>' })?.level).toBe('error');
  });
  it('rechaza customElements.define en el JS', () => {
    expect(hallazgo({ js: "export function defineX() { customElements.define('x-y', class extends HTMLElement {}); }" })?.level).toBe('error');
  });
  it('no confunde los nombres con guion de SVG, atributos ni comentarios', () => {
    expect(hallazgo({ html: '<!-- <mi-cosa> --><div class="tabs" data-tone="info" aria-label="a"><svg><font-face></font-face></svg></div>' })).toBeUndefined();
  });
  it('ningún módulo de angela define elementos propios', () => {
    for (const name of ['index.js', 'forms.js', 'overlays.js', 'tabs.js', 'theme.js', 'spotlight.js']) {
      expect(reviewComponent({ html: '', css: '', js: modulo(name) }).find((h) => h.id === 'elemento-propio'), name).toBeUndefined();
    }
  });
});

describe('test', () => {
  const JS = "export function enhanceX(root = globalThis.document) { if (typeof window === 'undefined' || !root) return () => {}; const f = () => {}; root.addEventListener('click', f); return () => root.removeEventListener('click', f); }";
  const hallazgo = (test) => reviewComponent({ html: '', css: '', js: JS, test }).find((h) => h.id === 'test');
  it('un JS con efecto sin test es un error (la revisión del PR fallaría)', () => {
    expect(hallazgo('')?.level).toBe('error');
    // La plantilla comentada no cuenta como test.
    expect(hallazgo('// Test del módulo\n// import …')?.text).toContain('pestaña «Test»');
  });
  it('el test importa de vitest, tiene un it y el módulo', () => {
    expect(hallazgo("it('a', () => {});")?.text).toContain('vitest');
    expect(hallazgo("import { it } from 'vitest';\nit('a', () => {});")?.text).toContain('./componente.js');
    expect(hallazgo("import { it, expect } from 'vitest';\nimport { enhanceX } from './componente.js';\nit('a', () => expect(1).toBe(1));")).toBeUndefined();
  });
  it('si usa el DOM, necesita el entorno happy-dom', () => {
    const base = "import { it, expect } from 'vitest';\nimport { enhanceX } from './componente.js';\nit('a', () => expect(enhanceX(document)).toBeTruthy());";
    expect(hallazgo(base)?.text).toContain('happy-dom');
    // Se escribe partido: Vitest busca esa marca en el texto de este archivo.
    expect(hallazgo(`// @vitest-${'environment'} happy-dom\n${base}`)).toBeUndefined();
  });
  it('sin JS, o con un JS sin efecto, no pide test', () => {
    expect(reviewComponent({ html: '', css: '', js: '', test: '' }).find((h) => h.id === 'test')).toBeUndefined();
    expect(reviewComponent({ html: '', css: '', js: '// nada', test: '' }).find((h) => h.id === 'test')).toBeUndefined();
  });
  it('los módulos de angela pasan con su test', () => {
    for (const name of ['forms.js', 'overlays.js', 'tabs.js', 'theme.js', 'spotlight.js']) {
      const test = readFileSync(new URL(`../../../../packages/angela/src/js/${name.replace('.js', '.test.js')}`, import.meta.url), 'utf8');
      expect(reviewComponent({ html: '', css: '', js: modulo(name), test }).find((h) => h.id === 'test'), name).toBeUndefined();
    }
  });
});
