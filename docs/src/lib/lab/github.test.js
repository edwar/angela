import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { proposeComponent } from './github.js';

const indexJs = readFileSync(new URL('../../../../packages/angela/src/js/index.js', import.meta.url), 'utf8');
const b64 = (text) => Buffer.from(text, 'utf8').toString('base64');
const unb64 = (text) => Buffer.from(text, 'base64').toString('utf8');

/** GitHub de mentira: guarda las llamadas y responde lo mínimo para que el flujo avance. */
function fakeGitHub({ failPull = false, existing = {} } = {}) {
  const calls = [];
  globalThis.fetch = vi.fn(async (url, init = {}) => {
    const path = url.replace('https://api.github.com', '');
    const method = init.method ?? 'GET';
    calls.push({ method, path, body: init.body ? JSON.parse(init.body) : null });
    const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });
    if (method === 'GET' && path.includes('/contents/packages/angela/src/angela.css')) {
      return reply({ content: b64('@import "./utilities.css";\n') });
    }
    if (method === 'GET' && path.includes('/contents/packages/angela/src/js/index.js')) return reply({ content: b64(indexJs) });
    const existente = Object.keys(existing).find((file) => method === 'GET' && path.includes(`/contents/${file}`));
    if (existente) return reply({ sha: 'x', content: b64(existing[existente]) });
    if (method === 'GET' && path.includes('/contents/')) return new Response('{}', { status: 404 });
    if (path === '/user') return reply({ login: 'edwar' });
    if (path.includes('/git/ref/heads/')) return reply({ object: { sha: 'abc' } });
    if (path.endsWith('/pulls')) {
      return failPull ? reply({ message: 'Validation Failed' }, 422) : reply({ html_url: 'https://github.com/edwar/angela/pull/99' }, 201);
    }
    return reply({}, 201);
  });
  return calls;
}

const input = (js, extra = {}) => ({
  token: 't',
  id: 'galeria',
  name: 'Galería',
  summary: 'Una galería.',
  parts: [{ id: 'galeria', css: '.galeria{}' }],
  docs: { slug: 'galeria', content: 'export default {}' },
  files: { html: '<div class="galeria"></div>', css: '.galeria{}', js },
  ...extra,
});

const writes = (calls) => calls.filter((c) => c.method === 'PUT');
const written = (calls, file) => writes(calls).find((c) => c.path.endsWith(file));
const prBody = (calls) => calls.find((c) => c.path.endsWith('/pulls')).body;

afterEach(() => vi.restoreAllMocks());

describe('proposeComponent', () => {
  it('componente nuevo: escribe su página de documentación', async () => {
    const calls = fakeGitHub();
    await proposeComponent(input(''));
    expect(written(calls, 'docs/src/data/componentes/galeria.js')).toBeTruthy();
    expect(prBody(calls).body).toContain('- [x] Página de documentación');
  });

  it('cambio sin página fusionada: no genera otra (duplicaría la que hay) y lo deja como tarea', async () => {
    const calls = fakeGitHub({ existing: { 'packages/angela/src/components/galeria.css': '.galeria{color:red}\n' } });
    await proposeComponent(input(''));
    expect(writes(calls).some((c) => c.path.includes('docs/src/data/'))).toBe(false);
    expect(prBody(calls).body).toContain('- [ ] Pon al día la página que ya existe');
  });

  it('con el CSS igual pero otra documentación, abre un PR solo de documentación', async () => {
    const calls = fakeGitHub({
      existing: {
        'packages/angela/src/components/galeria.css': '.galeria{}\n',
        'docs/src/data/componentes/galerias.js': 'export default { viejo: true }',
      },
    });
    await proposeComponent(input('', { docs: { slug: 'galerias', content: 'export default {}', actualiza: true } }));
    expect(writes(calls).map((c) => c.path.split('/contents/')[1])).toEqual(['docs/src/data/componentes/galerias.js']);
    const pr = prBody(calls);
    expect(pr.title).toBe('docs(galeria): pone al día la documentación de «Galería»');
    expect(pr.body).toContain('cambia solo la documentación');
  });

  it('con el CSS y la documentación iguales, no hay nada que proponer', async () => {
    fakeGitHub({
      existing: {
        'packages/angela/src/components/galeria.css': '.galeria{}\n',
        'docs/src/data/componentes/galerias.js': 'export default {}',
      },
    });
    await expect(proposeComponent(input('', { docs: { slug: 'galerias', content: 'export default {}', actualiza: true } }))).rejects.toThrow(
      'no hay nada que proponer',
    );
  });

  it('la misma página con otro formato no cuenta como cambio', async () => {
    fakeGitHub({
      existing: {
        'packages/angela/src/components/galeria.css': '.galeria{}\n',
        'docs/src/data/componentes/galerias.js': '/** viejo */\nexport default { "title": "Galería", slug: "galerias" };\n',
      },
    });
    const docs = { slug: 'galerias', content: 'export default {}', actualiza: true, entry: { slug: 'galerias', title: 'Galería' } };
    await expect(proposeComponent(input('', { docs }))).rejects.toThrow('no hay nada que proponer');
  });

  it('cambio con la página fusionada: la pone al día y cuenta qué cambió', async () => {
    const calls = fakeGitHub({ existing: { 'packages/angela/src/components/galeria.css': '.galeria{color:red}\n' } });
    const resumen = { ejemplos: { nuevos: ['Con pie'], cambiados: [], quitados: ['Viejo'] }, api: { nuevos: ['--galeria-gap'], quitados: [] } };
    await proposeComponent(input('', { docs: { slug: 'galerias', content: 'export default {}', actualiza: true, resumen } }));
    const pagina = written(calls, 'docs/src/data/componentes/galerias.js');
    expect(pagina.body.message).toBe('docs(galeria): pone al día su página');
    const body = prBody(calls).body;
    expect(body).toContain('## Documentación');
    expect(body).toContain('Ejemplos nuevos: «Con pie»');
    expect(body).toContain('Ejemplos quitados (comprueba que sobran): «Viejo»');
    expect(body).toContain('API: filas nuevas: «--galeria-gap»');
    expect(body).toContain('- [x] Página de documentación puesta al día');
  });

  it('no sube un JS sin efecto (una plantilla que quedó en la pestaña)', async () => {
    const vacio = `export function enhanceNota(root = globalThis.document) {\n  if (typeof window === 'undefined' || !root) return () => {};\n  return () => {};\n}`;
    const calls = fakeGitHub();
    await proposeComponent(input(vacio));
    expect(writes(calls).some((c) => c.path.includes('/src/js/'))).toBe(false);
  });

  it('sube el JS y lo registra en @angela-ui/angela/js', async () => {
    const calls = fakeGitHub();
    await proposeComponent(input(`export function enhanceGaleria(root = globalThis.document) { const f = () => {}; root.addEventListener('click', f); return () => root.removeEventListener('click', f); }`));

    expect(written(calls, '/js/galeria.js')).toBeTruthy();
    const index = written(calls, '/js/index.js');
    expect(index.body.message).toBe('chore(galeria): activa el módulo en angela()');
    expect(unb64(index.body.content)).toContain(`import { enhanceGaleria } from './galeria.js';`);
    expect(unb64(index.body.content)).toContain('enhanceGaleria(root),');
    expect(prBody(calls).body).toContain('registrado en `packages/angela/src/js/index.js`');
  });

  it('sin función exportada, sube el JS sin registrarlo y lo deja anotado en el PR', async () => {
    const calls = fakeGitHub();
    await proposeComponent(input(`document.querySelector('.galeria');`));

    expect(written(calls, '/js/galeria.js')).toBeTruthy();
    expect(written(calls, '/js/index.js')).toBeUndefined();
    expect(prBody(calls).body).toContain('**sin registrar**');
  });

  it('al partir de un componente de angela, escribe en su módulo (forms.js) y no lo registra dos veces', async () => {
    const calls = fakeGitHub();
    await proposeComponent(
      input(`export function enhanceForms(root = globalThis.document) { const f = () => {}; root.addEventListener('input', f); return () => root.removeEventListener('input', f); }`, { id: 'field', jsFile: 'forms.js' }),
    );

    expect(written(calls, '/js/forms.js')).toBeTruthy();
    expect(written(calls, '/js/field.js')).toBeUndefined();
    expect(written(calls, '/js/index.js')).toBeUndefined();
  });

  it('sube el test con el nombre real del módulo y lo cuenta en el PR', async () => {
    const calls = fakeGitHub();
    const js = `export function enhanceGaleria(root = globalThis.document) { const f = () => {}; root.addEventListener('click', f); return () => root.removeEventListener('click', f); }`;
    const test = "import { it, expect } from 'vitest';\nimport { enhanceGaleria } from './componente.js';\nit('a', () => expect(1).toBe(1));";
    await proposeComponent(input(js, { files: { html: '<div class="galeria"></div>', css: '.galeria{}', js, test } }));

    const subido = written(calls, '/js/galeria.test.js');
    expect(subido.body.message).toBe('test(galeria): pruebas del módulo');
    expect(unb64(subido.body.content)).toContain("from './galeria.js'");
    expect(unb64(subido.body.content)).not.toContain('componente.js');
    expect(prBody(calls).body).toContain('Con su test, `packages/angela/src/js/galeria.test.js`');
    expect(prBody(calls).body).not.toContain('- [ ] Test del módulo JS.');
  });

  it('sin test (la plantilla comentada), no sube nada y lo deja como tarea', async () => {
    const calls = fakeGitHub();
    const js = `export function enhanceGaleria(root = globalThis.document) { const f = () => {}; root.addEventListener('click', f); return () => root.removeEventListener('click', f); }`;
    await proposeComponent(input(js, { files: { html: '', css: '.galeria{}', js, test: '// import { it } from "vitest";' } }));
    expect(written(calls, '/js/galeria.test.js')).toBeUndefined();
    expect(prBody(calls).body).toContain('- [ ] Test del módulo JS.');
  });

  it('con el CSS y el JS iguales pero un test nuevo, abre un PR solo del test', async () => {
    const js = `export function enhanceGaleria(root = globalThis.document) { const f = () => {}; root.addEventListener('click', f); return () => root.removeEventListener('click', f); }`;
    const calls = fakeGitHub({
      existing: {
        'packages/angela/src/components/galeria.css': '.galeria{}\n',
        'packages/angela/src/js/galeria.js': `${js}\n`,
      },
    });
    const test = "import { it } from 'vitest';\nimport { enhanceGaleria } from './componente.js';\nit('a', () => {});";
    await proposeComponent(input(js, { docs: null, files: { html: '', css: '.galeria{}', js, test } }));
    expect(writes(calls).map((c) => c.path.split('/contents/')[1])).toEqual(['packages/angela/src/js/galeria.test.js']);
    const pr = prBody(calls);
    expect(pr.title).toBe('test(galeria): pruebas de «Galería»');
    expect(pr.body).toContain('cambia su test');
  });

  it('sin JS, no toca @angela-ui/angela/js', async () => {
    const calls = fakeGitHub();
    await proposeComponent(input('// nada\n'));
    expect(writes(calls).some((c) => c.path.includes('/src/js/'))).toBe(false);
  });

  it('abre el PR con título y descripción; si GitHub lo rechaza, da el enlace para abrirlo a mano', async () => {
    let calls = fakeGitHub();
    const result = await proposeComponent(input(''));
    expect(result).toEqual({ url: 'https://github.com/edwar/angela/pull/99', nuevo: true, partes: 1 });
    expect(prBody(calls).title).toBe('feat(galeria): añade el componente Galería');
    expect(prBody(calls).body).toContain('Una galería.');

    calls = fakeGitHub({ failPull: true });
    const error = await proposeComponent(input('')).catch((e) => e);
    expect(error.message).toMatch(/Los archivos ya están en la rama feat\/galeria-/);
    expect(new URL(error.cause.compareUrl).searchParams.get('title')).toBe('feat(galeria): añade el componente Galería');
  });
});
