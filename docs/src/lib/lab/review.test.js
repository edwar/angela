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

describe('regla de sintaxis del CSS', () => {
  const sintaxis = (css) => reviewComponent({ html: '', css, js: '' }).find((h) => h.id === 'sintaxis');

  it('bloquea el CSS que rompió el build de imagen-revelada (dos @media unidos por una coma)', () => {
    const css = `@layer angela.components {
  @media (preference-reduce-motion: reduce),
  @media (prefers-reduced-motion: no-preference) {
    .reveal-image: {
      clip-path: none;
    }
  }
}`;
    expect(sintaxis(css)).toMatchObject({ level: 'error', bloquea: true });
    expect(sintaxis(css).text).toContain('Línea 2');
  });

  it('explica las condiciones de @media mal escritas, los selectores con «:» de más y las llaves', () => {
    expect(sintaxis('@media (preference-reduce-motion: reduce) { .a { color: red; } }').text).toContain('prefers-reduced-motion');
    expect(sintaxis('@media (prefers-reduced-motion: reduc) { .a { color: red; } }').text).toContain('no-preference, reduce');
    expect(sintaxis('.a: { color: red; }').text).toContain('termina en «:»');
    expect(sintaxis('.a { color: red;').text).toContain('llave');
    expect(sintaxis('.a { color: red; } }').text).toContain('Sobra');
    expect(sintaxis('.a { color red; }').text).toContain('propiedad: valor');
  });

  it('no marca el CSS de angela ni del sitio', async () => {
    const { globSync } = await import('node:fs');
    const raiz = new URL('../../../../', import.meta.url);
    const archivos = globSync(['packages/angela/src/**/*.css', 'docs/src/**/*.css'], { cwd: raiz });
    expect(archivos.length).toBeGreaterThan(20);
    for (const archivo of archivos) {
      expect(sintaxis(readFileSync(new URL(archivo, raiz), 'utf8')), archivo).toBeUndefined();
    }
  });
});

describe('regla de movimiento al revés', () => {
  const regla = (css) => reviewComponent({ html: '', css, js: '' }).find((h) => h.id === 'movimiento-al-reves');

  it('marca quitar la animación dentro de no-preference (el CSS que quedó en imagen-revelada)', () => {
    const css = `@layer angela.components {
  @supports (animation-timeline: view()) {
    .reveal-image { animation: reveal-image linear both; animation-timeline: view(); }
  }
  @keyframes reveal-image { to { clip-path: inset(0); } }
  @media (prefers-reduced-motion: reduce) {
    .reveal-image { clip-path: none; animation: none; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .reveal-image { clip-path: none; animation: none; }
  }
}`;
    expect(regla(css)).toMatchObject({ level: 'error' });
    expect(regla(css).text).toContain('animation: none');
    expect(regla('@media (prefers-reduced-motion: no-preference) { @supports (x: y) { .a { transition: none; } } }')).toBeTruthy();
  });

  it('no marca quitarla con reduce ni animar dentro de no-preference', () => {
    expect(regla('@media (prefers-reduced-motion: reduce) { .a { animation: none; transition: none; } }')).toBeUndefined();
    expect(regla('@media (prefers-reduced-motion: no-preference) { .a { animation: x 1s; } } .b { animation: none; }')).toBeUndefined();
  });
});
