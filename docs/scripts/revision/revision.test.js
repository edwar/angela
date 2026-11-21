import { describe, expect, it } from 'vitest';
import { findEntryFunction } from '../../src/lib/lab/js-entry.js';
import { MANUAL_CHECKS, reviewComponent } from '../../src/lib/lab/review.js';
import { apiTokens, rowToken } from '../../src/lib/lab/docs-entry.js';
import { CSS_ENTRY, JS_ENTRY, renderComment, reviewUnit, touchedComponents, verdict } from './revision.js';

const SOURCES = {
  campos: { css: 'components/field.css', js: 'forms.js' },
  tarjeta: { css: 'components/layout.css' },
  tabla: { css: 'components/layout.css' },
  desplegable: { css: 'components/disclosure.css' },
};

const CSS_OK = `@layer angela.components {
  :where(.galeria) { --galeria-gap: var(--space-4); }
  .galeria { gap: var(--galeria-gap); }
}`;
const JS_OK = `export function enhanceGaleria(root = globalThis.document) {
  if (typeof window === 'undefined') return () => {};
  const on = () => {};
  root.addEventListener('click', on);
  return () => root.removeEventListener('click', on);
}`;
// La marca del entorno va partida: Vitest la busca en el texto de este archivo.
const TEST_OK = `// @vitest-${'environment'} happy-dom\n` + "import { it, expect } from 'vitest';\nimport { enhanceGaleria } from './galeria.js';\nit('activa', () => expect(typeof enhanceGaleria(document)).toBe('function'));\n";
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

  it('una página aportada con el nombre del CSS de uno del núcleo es una segunda página suya', () => {
    expect(touchedComponents(['packages/angela/src/components/disclosure.css', 'docs/src/data/componentes/disclosure.js'], SOURCES)).toEqual([
      { slugs: ['desplegable'], css: 'disclosure', js: null, duplica: ['disclosure'] },
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
    const r = nuevo({ [CSS]: CSS_OK, [JS]: JS_OK, [CSS_ENTRY]: ENTRY_OK, [JS_ENTRY]: INDEX_OK, [JS.replace('.js', '.test.js')]: TEST_OK });
    expect(r.nuevo).toBe(true);
    expect(r.findings.filter((f) => f.level === 'error')).toEqual([]);
  });

  it('sin archivo de test, avisa solo test-js (no también la regla «test» del laboratorio)', () => {
    const r = nuevo({ [CSS]: CSS_OK, [JS]: JS_OK, [CSS_ENTRY]: ENTRY_OK, [JS_ENTRY]: INDEX_OK });
    const ids = r.findings.map((f) => f.id);
    expect(ids).toContain('test-js');
    expect(ids).not.toContain('test');
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

  it('borrar una página sin CSS propio (al dividirla) solo avisa de los enlaces', () => {
    const r = reviewUnit({ slugs: ['seleccion'], css: 'seleccion', js: null }, ctx({}, { base: { seleccion: DOC({ slug: 'seleccion', title: 'Selección' }) }, head: {} }));
    expect(r.eliminado).toBe(true);
    expect(r.findings).toEqual([expect.objectContaining({ level: 'warn', id: 'elimina' })]);
    expect(r.findings[0].text).toContain('docs/src/data/componentes/seleccion.js');
    expect(r.findings[0].text).toContain('redirección');
  });

  it('un CSS con varias páginas titula cada una con la suya', () => {
    const casilla = DOC({ slug: 'casilla', title: 'Casilla' });
    const radio = DOC({ slug: 'radio', title: 'Radio' });
    const r = reviewUnit({ slugs: ['casilla', 'radio'], css: 'galeria', js: null }, ctx({ base: { [CSS]: CSS_OK }, head: { [CSS]: CSS_OK } }, { base: { casilla, radio }, head: { casilla, radio } }));
    expect(r.titulos).toEqual({ casilla: 'Casilla', radio: 'Radio' });
    const md = renderComment({ checks: [{ name: 'Tests', ok: true }], components: [r], manualChecks: MANUAL_CHECKS, productionUrl: 'https://prod.example', sha: 'abcdef123' });
    expect(md).toContain('| Radio | [ver]({{preview}}/componentes/radio)');
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

describe('JS de un componente', () => {
  const head = (js, extra = {}) => ({
    [CSS]: CSS_OK,
    [JS]: js,
    [CSS_ENTRY]: ENTRY_OK,
    [JS_ENTRY]: INDEX_OK,
    ...extra,
  });
  const docs = { base: {}, head: { galeria: DOC() } };
  const unidad = { slugs: ['galeria'], css: 'galeria', js: 'galeria' };

  it('un JS sin efecto da un solo error, quitarlo; no pide test ni registro', () => {
    const vacio = `export function enhanceGaleria(root = globalThis.document) {\n  if (typeof window === 'undefined' || !root) return () => {};\n  return () => {};\n}`;
    const ids = reviewUnit(unidad, ctx({ head: head(vacio) }, docs)).findings.map((f) => f.id);
    expect(ids).toEqual(['sin-efecto']);
  });

  it('avisa si la función de activación no lleva el nombre del componente', () => {
    const otro = JS_OK.replace('enhanceGaleria', 'enhanceNota');
    const r = reviewUnit(unidad, ctx({ head: head(otro, { [JS_ENTRY]: "import { enhanceNota } from './galeria.js';", 'packages/angela/src/js/galeria.test.js': 'x' }) }, docs));
    expect(r.findings.find((f) => f.id === 'nombre-js')).toMatchObject({ level: 'warn' });
    const bien = reviewUnit(unidad, ctx({ head: head(JS_OK, { 'packages/angela/src/js/galeria.test.js': 'x' }) }, docs));
    expect(bien.findings.find((f) => f.id === 'nombre-js')).toBeUndefined();
  });
});

describe('página duplicada', () => {
  const unit = { slugs: ['desplegable'], css: 'disclosure', js: null, duplica: ['disclosure'] };
  const CSS_D = 'packages/angela/src/components/disclosure.css';
  const docs = { base: { desplegable: DOC({ slug: 'desplegable', title: 'Desplegable' }) }, head: { desplegable: DOC({ slug: 'desplegable', title: 'Desplegable' }) } };

  it('es un error si el PR la crea', () => {
    const files = { base: { [CSS_D]: CSS_OK }, head: { [CSS_D]: CSS_OK, 'docs/src/data/componentes/disclosure.js': 'export default {}' } };
    const r = reviewUnit(unit, ctx(files, docs));
    expect(r.findings.find((h) => h.id === 'pagina-duplicada')?.level).toBe('error');
  });

  it('no dice nada si el PR la borra', () => {
    const files = { base: { [CSS_D]: CSS_OK, 'docs/src/data/componentes/disclosure.js': 'export default {}' }, head: { [CSS_D]: CSS_OK } };
    const r = reviewUnit(unit, ctx(files, docs));
    expect(r.findings.some((h) => h.id === 'pagina-duplicada')).toBe(false);
  });
});

describe('api-sin-documentar', () => {
  const unit = { slugs: ['galeria'], css: 'galeria', js: null };
  const CSS_NUEVO = CSS_OK.replace('.galeria { gap', '.galeria[data-pie] { --galeria-pie: 1; }\n  .galeria { gap');
  const files = { base: { [CSS]: CSS_OK, 'packages/angela/src/angela.css': ENTRY_OK }, head: { [CSS]: CSS_NUEVO, 'packages/angela/src/angela.css': ENTRY_OK } };
  const conDeps = (docs) => ({ ...ctx(files, docs), apiTokens, rowToken });

  it('avisa de lo que el CSS añade y la API no explica', () => {
    const docs = { base: { galeria: DOC() }, head: { galeria: DOC() } };
    const aviso = reviewUnit(unit, conDeps(docs)).findings.find((h) => h.id === 'api-sin-documentar');
    expect(aviso?.level).toBe('warn');
    expect(aviso.text).toContain('`data-pie`');
    expect(aviso.text).toContain('`--galeria-pie`');
    expect(aviso.text).not.toContain('--galeria-gap');
  });

  it('no dice nada si la API ya lo explica', () => {
    const doc = DOC({ api: [['.galeria', 'x'], ['data-pie', 'y'], ['--galeria-pie', 'z']] });
    const r = reviewUnit(unit, conDeps({ base: { galeria: DOC() }, head: { galeria: doc } }));
    expect(r.findings.some((h) => h.id === 'api-sin-documentar')).toBe(false);
  });
});
