import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { proposeComponent } from './github.js';

const indexJs = readFileSync(new URL('../../../../packages/angela/src/js/index.js', import.meta.url), 'utf8');
const b64 = (text) => Buffer.from(text, 'utf8').toString('base64');
const unb64 = (text) => Buffer.from(text, 'base64').toString('utf8');

/** GitHub de mentira: guarda las llamadas y responde lo mínimo para que el flujo avance. */
function fakeGitHub({ failPull = false } = {}) {
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
  docsEntry: 'export default {}',
  files: { html: '<div class="galeria"></div>', css: '.galeria{}', js },
  ...extra,
});

const writes = (calls) => calls.filter((c) => c.method === 'PUT');
const written = (calls, file) => writes(calls).find((c) => c.path.endsWith(file));
const prBody = (calls) => calls.find((c) => c.path.endsWith('/pulls')).body;

afterEach(() => vi.restoreAllMocks());

describe('proposeComponent', () => {
  it('sube el JS y lo registra en @angela-ui/angela/js', async () => {
    const calls = fakeGitHub();
    await proposeComponent(input(`export function enhanceGaleria(root = globalThis.document) { return () => {}; }`));

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
      input(`export function enhanceForms(root = globalThis.document) { return () => {}; }`, { id: 'field', jsFile: 'forms.js' }),
    );

    expect(written(calls, '/js/forms.js')).toBeTruthy();
    expect(written(calls, '/js/field.js')).toBeUndefined();
    expect(written(calls, '/js/index.js')).toBeUndefined();
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
