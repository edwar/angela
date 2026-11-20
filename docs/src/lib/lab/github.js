/**
 * Abre un pull request con el componente, usando el token de quien aporta: el PR queda
 * a su nombre, sin servidor de por medio.
 *
 * Pasos: mira si el componente ya existe → bifurca el repositorio (si hace falta) →
 * crea una rama → escribe los archivos → abre el pull request.
 *
 * El token se queda en este navegador y solo viaja a api.github.com. Necesita permiso
 * para repositorios públicos: un token clásico con «public_repo», o uno de acceso fino
 * con «Contents: write» y «Pull requests: write».
 */

export const REPO = { owner: 'edwar', name: 'angela', branch: 'main' };
export const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=public_repo&description=angela%20laboratorio';

const API = 'https://api.github.com';
const COMPONENTS_DIR = 'packages/angela/src/components';
const JS_DIR = 'packages/angela/src/js';
const ENTRY = 'packages/angela/src/angela.css';
const JS_ENTRY = 'packages/angela/src/js/index.js';
const DOCS_DIR = 'docs/src/data/componentes';

import { findEntryFunction, registerJsModule } from './js-entry.js';

export class GitHubError extends Error {}

/** Base64 que aguanta acentos y emojis (btoa solo entiende latin-1). */
function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

const fromBase64 = (base64) => new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));

async function call(path, { token, method = 'GET', body, signal, allow404 = false } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
    credentials: 'omit',
  }).catch(() => {
    throw new GitHubError('No se pudo conectar con GitHub.');
  });

  if (response.status === 404 && allow404) return null;
  if (response.status === 401) throw new GitHubError('El token de GitHub no es válido o caducó.');
  if (response.status === 403) {
    throw new GitHubError('GitHub rechazó la petición: al token le falta permiso, o se agotó el límite de llamadas.');
  }
  if (!response.ok) {
    const detalle = await response.json().catch(() => null);
    throw new GitHubError(`GitHub respondió ${response.status}. ${detalle?.message ?? ''}`.trim());
  }
  return response.status === 204 ? null : response.json();
}

/**
 * Comprueba que el token sirve de verdad: que GitHub lo acepta y que trae los permisos
 * que hacen falta para abrir el pull request. No crea nada ni gasta cuota apreciable.
 *
 * Los tokens clásicos anuncian sus permisos en la cabecera x-oauth-scopes. Los de acceso
 * fino no la mandan, así que de esos solo se puede confirmar que son válidos: lo decimos
 * en vez de dar por buenos unos permisos que no hemos visto.
 *
 * @returns {Promise<{ ok: boolean, login?: string, level: 'ok' | 'warn' | 'error', text: string }>}
 */
export async function verifyToken(token, { signal } = {}) {
  let response;
  try {
    response = await fetch(`${API}/user`, {
      headers: {
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        authorization: `Bearer ${token}`,
      },
      signal,
      credentials: 'omit',
    });
  } catch {
    return { ok: false, level: 'error', text: 'No se pudo conectar con GitHub para comprobar el token.' };
  }

  if (response.status === 401) {
    return { ok: false, level: 'error', text: 'GitHub no reconoce este token: está mal copiado, caducado o revocado.' };
  }
  if (!response.ok) {
    return { ok: false, level: 'error', text: `GitHub respondió ${response.status} al comprobar el token.` };
  }

  const user = await response.json().catch(() => null);
  const login = user?.login;
  if (!login) return { ok: false, level: 'error', text: 'GitHub aceptó el token pero no devolvió la cuenta.' };

  const scopes = (response.headers.get('x-oauth-scopes') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (scopes.length === 0) {
    // Token de acceso fino: sus permisos no viajan en la cabecera.
    return {
      ok: true,
      login,
      level: 'ok',
      text: `Token válido, conectado como ${login}. Es de acceso fino: asegúrate de que incluye «Contents» y «Pull requests» con permiso de escritura.`,
    };
  }

  const puedeEscribir = scopes.includes('repo') || scopes.includes('public_repo');
  if (!puedeEscribir) {
    return {
      ok: false,
      login,
      level: 'warn',
      text: `Token válido (${login}), pero le falta el permiso para escribir en repositorios públicos. Tiene: ${scopes.join(', ')}. Crea uno con «public_repo».`,
    };
  }

  return { ok: true, login, level: 'ok', text: `Token válido, conectado como ${login}, con permiso para abrir el pull request.` };
}

const cssPath = (id) => `${COMPONENTS_DIR}/${id}.css`;
const jsPath = (file) => `${JS_DIR}/${file}`;
const docsPath = (id) => `${DOCS_DIR}/${id}.js`;

/**
 * ¿El JavaScript tiene algo más que comentarios? La pestaña arranca con un comentario de
 * ayuda, y sin esta comprobación se subía al repositorio un módulo vacío.
 */
const hasCode = (js) =>
  js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .trim().length > 0;

/**
 * ¿Este componente ya está en el repositorio? No necesita token: el repo es público.
 * @returns {Promise<{ existe: boolean, sha: string | null, css: string | null }>}
 */
export async function lookUpComponent(id, { token, signal } = {}) {
  const file = await call(`/repos/${REPO.owner}/${REPO.name}/contents/${cssPath(id)}?ref=${REPO.branch}`, {
    token,
    signal,
    allow404: true,
  });
  if (!file?.content) return { existe: false, sha: null, css: null };
  return { existe: true, sha: file.sha, css: fromBase64(file.content.replace(/\n/g, '')) };
}

/** Añade el @import del componente nuevo justo antes del de utilities, si falta. */
function withImport(entryCss, id) {
  const linea = `@import "./components/${id}.css";`;
  if (entryCss.includes(linea)) return null;
  const marca = '@import "./utilities.css";';
  if (!entryCss.includes(marca)) return `${entryCss.trimEnd()}\n${linea}\n`;
  return entryCss.replace(marca, `${linea}\n${marca}`);
}

/** Cómo quedó el JS en @angela-ui/angela/js, para contarlo en el pull request. */
function jsLines(js) {
  if (!js) return { intro: '', todo: '' };
  const ruta = `\`${jsPath(js.file)}\``;
  const llamada = `\`${js.fn}(root)\` en \`angela()\``;
  switch (js.registro) {
    case 'added':
      return {
        intro: `Incluye el módulo ${ruta}, registrado en \`${JS_ENTRY}\`: ${llamada}.`,
        todo: `- [ ] Test del módulo JS.`,
      };
    case 'present':
      return { intro: `Modifica el módulo ${ruta} (ya estaba registrado en \`${JS_ENTRY}\`).`, todo: `- [ ] Test del módulo JS.` };
    case 'unknown':
      return {
        intro: `Incluye el módulo ${ruta}.`,
        todo: `- [ ] Registrar ${llamada} en \`${JS_ENTRY}\` (el laboratorio no reconoció su forma) y test del módulo.`,
      };
    default:
      return {
        intro: `Incluye el módulo ${ruta}, **sin registrar**: no exporta una función de activación, así que \`angela()\` no lo ejecuta.`,
        todo: `- [ ] Convertirlo en \`export function enhance…(root = globalThis.document)\` que devuelva su limpieza, registrarlo en \`${JS_ENTRY}\` y añadir su test.`,
      };
  }
}

function prBody({ partes, id, nuevo, resumen, html, hallazgos, documentado, js }) {
  const modulo = jsLines(js);
  const avisos = hallazgos.filter((h) => h.level === 'warn');
  const conjunto = partes.length > 1;
  return [
    resumen.trim(),
    '',
    `## ${nuevo ? (conjunto ? 'Componentes nuevos' : 'Componente nuevo') : 'Cambio sobre componentes existentes'}`,
    '',
    conjunto
      ? `Son ${partes.length} componentes que se usan juntos:\n\n${partes
          .map((p) => `- \`${cssPath(p.id)}\`${p.existe ? ' (ya existía: se modifica)' : ' (nuevo)'}`)
          .join('\n')}`
      : nuevo
        ? `Añade \`${cssPath(id)}\` y su \`@import\` en \`${ENTRY}\`.`
        : `Modifica \`${cssPath(id)}\`.`,
    conjunto ? `\nEl marcado de ejemplo de abajo los usa juntos: así se espera que se usen.` : '',
    modulo.intro,
    '',
    '## Marcado de ejemplo',
    '',
    '```html',
    html.trim(),
    '```',
    '',
    '## Revisión automática del laboratorio',
    '',
    hallazgos.length === 0
      ? '- Sin avisos: cumple las reglas que se pueden comprobar con código.'
      : avisos.map((h) => `- Pendiente de revisar: ${h.text}`).join('\n'),
    '',
    '## Falta por hacer al integrarlo',
    '',
    documentado
      ? `- [x] Página de documentación en \`${docsPath(id)}\`: repásala y añade los ejemplos que falten.`
      : `- [ ] Entrada en \`docs/src/data/components.js\` (ejemplos, API y accesibilidad).`,
    modulo.todo,
    `- [ ] Si encaja, envoltorio en \`packages/angela-react\`.`,
    `- [ ] Repaso con teclado y lector de pantalla.`,
    '',
    '---',
    '',
    'Propuesto desde el laboratorio de angela.',
  ]
    .filter((line) => line !== '')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * Abre el pull request. Informa del avance por `onStep` para que la interfaz lo cuente.
 * @param {{
 *   token: string, id: string, name: string, summary: string,
 *   parts: { id: string, css: string }[],
 *   docsEntry?: string | null,
 *   jsFile?: string | null,
 *   files: { html: string, css: string, js: string },
 *   findings?: { level: string, text: string }[],
 *   onStep?: (text: string) => void, signal?: AbortSignal,
 * }} input
 * @returns {Promise<{ url: string, nuevo: boolean, partes: number }>}
 */
export async function proposeComponent({
  token,
  id,
  name,
  summary,
  parts,
  files,
  docsEntry = null,
  jsFile = null,
  findings = [],
  onStep = () => {},
  signal,
}) {
  const paso = (text) => onStep(text);
  const opts = { token, signal };

  if (!parts.length) throw new GitHubError('No hay ningún componente que proponer.');

  paso(parts.length > 1 ? 'Comprobando los componentes en el repositorio…' : 'Comprobando el componente en el repositorio…');
  for (const part of parts) {
    const actual = await lookUpComponent(part.id, opts);
    part.existe = actual.existe;
    part.igual = actual.existe && actual.css === `${part.css.trimEnd()}\n`;
  }
  const nuevo = parts.every((p) => !p.existe);
  if (parts.every((p) => p.igual)) {
    throw new GitHubError(
      parts.length > 1
        ? 'Los componentes son idénticos a los que ya están en el repositorio: no hay nada que proponer.'
        : `El CSS de «${name}» es idéntico al que ya está en el repositorio: no hay nada que proponer.`,
    );
  }

  paso('Identificando tu cuenta…');
  const me = await call('/user', opts);
  const login = me?.login;
  if (!login) throw new GitHubError('No se pudo leer tu cuenta de GitHub.');

  // Quien tiene el repositorio trabaja directo; el resto, sobre su bifurcación.
  const propio = login.toLowerCase() === REPO.owner.toLowerCase();
  let head = { owner: login, name: REPO.name };
  if (!propio) {
    paso('Preparando tu copia del repositorio…');
    const fork = await call(`/repos/${REPO.owner}/${REPO.name}/forks`, { ...opts, method: 'POST' });
    head = { owner: fork.owner.login, name: fork.name };
    // La bifurcación recién creada tarda un momento en estar lista.
    for (let intento = 0; intento < 10; intento += 1) {
      const listo = await call(`/repos/${head.owner}/${head.name}/branches/${REPO.branch}`, { ...opts, allow404: true });
      if (listo) break;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  paso('Creando la rama…');
  const base = await call(`/repos/${REPO.owner}/${REPO.name}/git/ref/heads/${REPO.branch}`, opts);
  const branch = `${nuevo ? 'feat' : 'fix'}/${id}-${Date.now().toString(36)}`;
  await call(`/repos/${head.owner}/${head.name}/git/refs`, {
    ...opts,
    method: 'POST',
    body: { ref: `refs/heads/${branch}`, sha: base.object.sha },
  });

  /** Escribe un archivo en la rama. Si ya existe en la bifurcación, hace falta su sha. */
  const put = async (path, content, message) => {
    const existente = await call(`/repos/${head.owner}/${head.name}/contents/${path}?ref=${branch}`, {
      ...opts,
      allow404: true,
    });
    await call(`/repos/${head.owner}/${head.name}/contents/${path}`, {
      ...opts,
      method: 'PUT',
      body: { message, content: toBase64(content), branch, ...(existente?.sha ? { sha: existente.sha } : {}) },
    });
  };

  const conjunto = parts.length > 1;
  const titulo = nuevo
    ? `feat(${id}): añade ${conjunto ? `los componentes ${parts.map((p) => p.id).join(' y ')}` : `el componente ${name}`}`
    : `fix(${id}): mejora ${conjunto ? `los componentes ${parts.map((p) => p.id).join(' y ')}` : `el componente ${name}`}`;

  for (const part of parts) {
    if (part.igual) continue;
    paso(`Subiendo ${part.id}.css…`);
    await put(cssPath(part.id), `${part.css.trimEnd()}\n`, `${nuevo ? 'feat' : 'fix'}(${part.id}): CSS del componente`);
  }

  // Los @import se añaden de una vez: así angela.css se escribe una sola vez.
  const sinImportar = parts.filter((p) => !p.existe);
  if (sinImportar.length) {
    paso('Registrando los @import…');
    const entrada = await call(`/repos/${head.owner}/${head.name}/contents/${ENTRY}?ref=${branch}`, opts);
    let css = fromBase64(entrada.content.replace(/\n/g, ''));
    let cambiado = false;
    for (const part of sinImportar) {
      const actualizado = withImport(css, part.id);
      if (actualizado) {
        css = actualizado;
        cambiado = true;
      }
    }
    if (cambiado) await put(ENTRY, css, `chore(${id}): importa ${conjunto ? 'los componentes' : 'el componente'} en angela.css`);
  }

  if (docsEntry) {
    paso('Escribiendo la página de documentación…');
    await put(docsPath(id), docsEntry, `docs(${id}): página del componente`);
  }

  // El JS se sube y se registra en @angela-ui/angela/js: si no, angela() no lo ejecuta nunca.
  let js = null;
  if (hasCode(files.js)) {
    const file = jsFile || `${id}.js`;
    paso('Subiendo el JavaScript…');
    await put(jsPath(file), `${files.js.trimEnd()}\n`, `feat(${id}): módulo JavaScript del componente`);
    const fn = findEntryFunction(files.js);
    js = { file, fn, registro: fn ? null : 'sin-funcion' };
    if (fn) {
      paso('Registrando el JavaScript en @angela-ui/angela/js…');
      const entrada = await call(`/repos/${head.owner}/${head.name}/contents/${JS_ENTRY}?ref=${branch}`, opts);
      const registro = registerJsModule(fromBase64(entrada.content.replace(/\n/g, '')), file, fn);
      js.registro = registro.status;
      if (registro.status === 'added') await put(JS_ENTRY, registro.code, `chore(${id}): activa el módulo en angela()`);
    }
  }

  paso('Abriendo el pull request…');
  const headRef = propio ? branch : `${head.owner}:${branch}`;
  let pr;
  try {
    pr = await call(`/repos/${REPO.owner}/${REPO.name}/pulls`, {
      ...opts,
      method: 'POST',
      body: {
        title: titulo,
        head: headRef,
        base: REPO.branch,
        body: prBody({
          partes: parts,
          id,
          nuevo,
          resumen: summary,
          html: files.html,
          js,
          hallazgos: findings,
          documentado: Boolean(docsEntry),
        }),
        maintainer_can_modify: true,
      },
    });
  } catch (error) {
    // Los archivos ya están en la rama: repetir crearía otra igual. Mejor dar el enlace para abrirlo a mano.
    if (error?.name === 'AbortError') throw error;
    const compare = new URL(`https://github.com/${REPO.owner}/${REPO.name}/compare/${REPO.branch}...${headRef}`);
    compare.searchParams.set('quick_pull', '1');
    compare.searchParams.set('title', titulo);
    compare.searchParams.set('body', summary);
    throw new GitHubError(
      `Los archivos ya están en la rama ${branch}, pero no se pudo abrir el pull request: ${error?.message ?? 'error desconocido'}`,
      { cause: { compareUrl: compare.href } },
    );
  }

  return { url: pr.html_url, nuevo, partes: parts.length };
}
