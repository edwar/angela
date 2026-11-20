import { describe, expect, it } from 'vitest';
import { findEntryFunction } from '../../src/lib/lab/js-entry.js';
import { MANUAL_CHECKS, reviewComponent } from '../../src/lib/lab/review.js';
import { CSS_ENTRY, JS_ENTRY, renderComment, reviewUnit, touchedComponents, verdict } from './revision.js';

const SOURCES = {
  campos: { css: 'components/field.css', js: 'forms.js' },
  tarjeta: { css: 'components/layout.css' },
  tabla: { css: 'components/layout.css' },
};

const CSS_OK = `@layer angela.components {
  :where(.galeria) { --galeria-gap: var(--space-4); }
  .galeria { gap: var(--galeria-gap); }
}`;
const JS_OK = `export function enhanceGaleria(root = document) {
  if (typeof window === 'undefined') return () => {};
  const on = () => {};
  root.addEventListener('click', on);
  return () => root.removeEventListener('click', on);
}`;
const DOC = (extra = {}) => ({
  slug: 'galeria',
  title: 'Galería',
  examples: [{ title: 'a', code: '<div class="galeria"></div>' }],
  api: [['.galeria', 'x']],
  a11y: ['y'],
  ...extra,
});

/** Repositorio de mentira: un mapa de rutas por lado. */
function repo({ base = {}, head = {} }) {
  return (side, path) => ({ base, head })[side][path] ?? null;
}
const ctx = (files, docs) => ({ read: repo(files), docs, reviewComponent, findEntryFunction });
const CSS = 'packages/angela/src/components/galeria.css';
const JS = 'packages/angela/src/js/galeria.js';
const ENTRY_OK = '@import "./components/galeria.css";';
const INDEX_OK = `import { enhanceGaleria } from './galeria.js';`;

describe('touchedComponents', () => {
  it('agrupa CSS, JS y documentación de un componente aportado', () => {
    const units = touchedComponents([CSS, JS, 'docs/src/data/componentes/galeria.js', 'README.md'], SOURCES);
    expect(units).toEqual([{ slugs: ['galeria'], css: 'galeria', js: 'galeria' }]);
  });

  it('los del núcleo se encuentran por el mapa, también los que comparten CSS', () => {
    expect(touchedComponents(['packages/angela/src/js/forms.js'], SOURCES)).toEqual([
      { slugs: ['campos'], css: 'field', js: 'forms' },
    ]);
    expect(touchedComponents(['packages/angela/src/components/layout.css'], SOURCES)).toEqual([
      { slugs: ['tarjeta', 'tabla'], css: 'layout', js: null },
    ]);
  });

  it('ignora tests, index.js y lo que no es de componentes', () => {
    const paths = ['packages/angela/src/js/index.js', 'packages/angela/src/js/galeria.test.js', 'docs/src/pages/index.astro'];
    expect(touchedComponents(paths, SOURCES)).toEqual([]);
  });
});

describe('reviewUnit', () => {
  const nuevo = (head, doc = DOC()) =>
    reviewUnit({ slugs: ['galeria'], css: 'galeria', js: head[JS] ? 'galeria' : null }, ctx({ head }, { base: {}, head: { galeria: doc } }));

  it('un componente nuevo completo no tiene errores', () => {
    const r = nuevo({ [CSS]: CSS_OK, [JS]: JS_OK, [CSS_ENTRY]: ENTRY_OK, [JS_ENTRY]: INDEX_OK, [JS.replace('.js', '.test.js')]: 'test' });
    expect(r.nuevo).toBe(true);
    expect(r.findings.filter((f) => f.level === 'error')).toEqual([]);
  });

  it('el caso del spotlight: sin @import, sin accesibilidad, JS sin registrar y sin test', () => {
    const r = nuevo({ [CSS]: CSS_OK, [JS]: JS_OK }, DOC({ a11y: [] }));
    expect(r.findings.filter((f) => f.level === 'error').map((f) => f.id)).toEqual(['import', 'documentacion', 'registro', 'test-js']);
  });

  it('sin documentación es un error', () => {
    const r = reviewUnit({ slugs: ['galeria'], css: 'galeria', js: null }, ctx({ head: { [CSS]: CSS_OK, [CSS_ENTRY]: ENTRY_OK } }, { base: {}, head: {} }));
    expect(r.findings.map((f) => f.id)).toContain('documentacion');
  });

  it('en una edición solo cuenta lo que introduce el PR; lo de main va aparte', () => {
    const conColor = CSS_OK.replace('gap: var(--galeria-gap);', 'gap: var(--galeria-gap); color: #f00;');
    const files = {
      base: { [CSS]: conColor },
      head: { [CSS]: `${conColor}\n.galeria img { margin-left: 4px; }`, [CSS_ENTRY]: ENTRY_OK },
    };
    const r = reviewUnit({ slugs: ['galeria'], css: 'galeria', js: null }, ctx(files, { base: { galeria: DOC() }, head: { galeria: DOC() } }));
    expect(r.nuevo).toBe(false);
    expect(r.findings.map((f) => f.id)).toEqual(['logicas', 'medidas']);
    expect(r.previos.map((f) => f.id)).toEqual(['colores']);
  });

  it('si el componente tiene JS, se revisa aunque el PR solo toque el CSS', () => {
    const files = { base: { [CSS]: CSS_OK, [JS]: JS_OK }, head: { [CSS]: `${CSS_OK}\n`, [JS]: JS_OK, [CSS_ENTRY]: ENTRY_OK } };
    const r = reviewUnit({ slugs: ['galeria'], css: 'galeria', js: null }, ctx(files, { base: { galeria: DOC() }, head: { galeria: DOC() } }));
    expect(r.findings.map((f) => f.id)).toEqual(['registro', 'test-js']);
  });

  it('borrar un componente es un aviso, no un error', () => {
    const r = reviewUnit({ slugs: ['galeria'], css: 'galeria', js: null }, ctx({ base: { [CSS]: CSS_OK } }, { base: {}, head: {} }));
    expect(r.eliminado).toBe(true);
    expect(r.findings).toEqual([expect.objectContaining({ level: 'warn', id: 'elimina' })]);
  });
});

describe('veredicto y comentario', () => {
  const ok = [{ name: 'Tests', ok: true }];
  const limpio = { title: 'Galería', slugs: ['galeria'], nuevo: false, eliminado: false, findings: [], previos: [] };
  const render = (checks, components) =>
    renderComment({ checks, components, manualChecks: MANUAL_CHECKS, productionUrl: 'https://prod.example', sha: 'abcdef123' });

  it('sin errores: pide la revisión visual con enlaces a la preview y a producción', () => {
    expect(verdict(ok, [limpio]).ok).toBe(true);
    const md = render(ok, [limpio]);
    expect(md).toContain('falta tu revisión visual');
    expect(md).toContain('[ver]({{preview}}/componentes/galeria)');
    expect(md).toContain('[ver](https://prod.example/componentes/galeria)');
    expect(md).toContain(`- [ ] ${MANUAL_CHECKS[0]}`);
  });

  it('un paso del CI que falla o un error en un componente bloquean', () => {
    expect(verdict([{ name: 'Tests', ok: false }], [limpio]).ok).toBe(false);
    const conError = { ...limpio, findings: [{ level: 'error', id: 'x', text: 'mal' }] };
    expect(verdict(ok, [conError])).toMatchObject({ ok: false, errores: 1 });
    expect(render(ok, [conError])).toContain('Cambios necesarios');
  });

  it('los avisos no bloquean', () => {
    expect(verdict(ok, [{ ...limpio, findings: [{ level: 'warn', id: 'x', text: 'ojo' }] }]).ok).toBe(true);
  });

  it('un componente nuevo no tiene enlace a producción', () => {
    expect(render(ok, [{ ...limpio, nuevo: true }])).toContain('| Galería | [ver]({{preview}}/componentes/galeria) | — |');
  });

  it('sin componentes, no pide revisión visual', () => {
    expect(render(ok, [])).toContain('Pasa las comprobaciones');
  });
});
