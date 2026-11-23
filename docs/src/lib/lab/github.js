/**
 * Abre un pull request con el componente, usando el token de quien aporta: el PR queda
 * a su nombre, sin servidor de por medio.
 *
 * Pasos: mira si el componente ya existe → bifurca el repositorio (si hace falta) →
 * crea una rama → escribe los archivos → abre el pull request. Si se trajo el código de un
 * pull request abierto (fetchPullRequest), escribe en su rama y no abre otro.
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

import { findEntryFunction, jsSinEfecto, registerJsModule } from './js-entry.js';
import { parseDocsEntry } from './docs-entry.js';

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
const testPath = (file) => jsPath(file).replace(/\.js$/, '.test.js');

/**
 * El test del laboratorio importa de './componente.js': en el repositorio, el módulo tiene su
 * nombre real (p. ej. './galeria.js').
 * @param {string} test
 * @param {string} file  Nombre del módulo en src/js (p. ej. "galeria.js").
 */
export function testForRepo(test, file) {
  return `${test.replace(/(from\s*|import\s*\(\s*)(['"])\.\/componente\.js\2/g, `$1$2./${file}$2`).trimEnd()}\n`;
}
const docsPath = (id) => `${DOCS_DIR}/${id}.js`;

/**
 * ¿El JavaScript tiene algo más que comentarios? La pestaña arranca con un comentario de
 * ayuda, y sin esta comprobación se subía al repositorio un módulo vacío.
 */
const hasCode = (js) =>
  (js ?? '')
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

/** Lo inverso de testForRepo: el test del repositorio, como se escribe en el laboratorio. */
export function testFromRepo(test, file) {
  const nombre = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return test.replace(new RegExp(`(from\\s*|import\\s*\\(\\s*)(['"])\\./${nombre}\\2`, 'g'), '$1$2./componente.js$2');
}

/**
 * ¿Puede esta cuenta escribir en la rama del pull request? Quien lo abrió, siempre; quien
 * tiene el repositorio, si la rama está en él o si el autor deja que quien mantiene el
 * proyecto modifique su bifurcación (maintainer_can_modify). El resto, no.
 * @param {string} login
 * @param {{ head: { owner: string }, mantenedorPuede?: boolean }} pr
 */
export function canUpdatePullRequest(login, pr) {
  const igual = (a, b) => a?.toLowerCase() === b?.toLowerCase();
  if (igual(login, pr.head.owner)) return true;
  return igual(login, REPO.owner) && (igual(pr.head.owner, REPO.owner) || Boolean(pr.mantenedorPuede));
}

/** Cuenta del token, para saber antes de proponer si se actualiza el PR o se abre otro. */
export async function currentLogin(token, { signal } = {}) {
  if (!token) return null;
  const me = await call('/user', { token, signal });
  return me?.login ?? null;
}

/** «58», «#58» o el enlace del pull request → 58. */
export function pullNumber(text) {
  const m = /^\s*(?:https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/|#)?(\d+)\/?(?:[#?/].*)?\s*$/i.exec(text ?? '');
  return m ? Number(m[1]) : null;
}

/**
 * Trae el código de un pull request del repositorio para seguir con él en el laboratorio:
 * el CSS de sus componentes, el HTML de los ejemplos de su página, su JS y su test. No hace
 * falta token (el repo es público), pero con él hay más margen de llamadas.
 *
 * @param {string} ref  Número del pull request o su enlace.
 * @returns {Promise<{
 *   number: number, url: string, title: string, abierto: boolean, estado: 'abierto' | 'cerrado' | 'mezclado',
 *   autor: string, mantenedorPuede: boolean,
 *   head: { owner: string, name: string, branch: string } | null,
 *   id: string, jsFile: string | null,
 *   files: { html: string, css: string, js: string, test: string },
 *   docs: ReturnType<typeof parseDocsEntry>, avisos: string[],
 * }>}
 */
export async function fetchPullRequest(ref, { token, signal } = {}) {
  const number = pullNumber(String(ref));
  if (!number) throw new GitHubError('Escribe el número del pull request (por ejemplo 58) o pega su enlace.');
  const opts = { token, signal };
  const repo = `/repos/${REPO.owner}/${REPO.name}`;

  const pr = await call(`${repo}/pulls/${number}`, { ...opts, allow404: true });
  if (!pr) throw new GitHubError(`No existe el pull request #${number} en ${REPO.owner}/${REPO.name}.`);
  const cambiados = (await call(`${repo}/pulls/${number}/files?per_page=100`, opts)).filter((f) => f.status !== 'removed');
  const nombres = cambiados.map((f) => f.filename);

  // Se lee del commit del PR: existe en el repositorio aunque venga de una bifurcación.
  const leer = async (path) => {
    const file = await call(`${repo}/contents/${path}?ref=${pr.head.sha}`, { ...opts, allow404: true });
    return file?.content != null ? fromBase64(file.content.replace(/\n/g, '')) : null;
  };
  const enCarpeta = (dir, filtro = () => true) =>
    nombres.filter((n) => n.startsWith(`${dir}/`) && !n.slice(dir.length + 1).includes('/') && filtro(n));

  const cssFiles = enCarpeta(COMPONENTS_DIR, (n) => n.endsWith('.css'));
  if (!cssFiles.length) {
    throw new GitHubError(`El pull request #${number} no cambia el CSS de ningún componente: el laboratorio no tiene nada que traer.`);
  }
  const avisos = [];
  const ids = cssFiles.map((n) => n.split('/').pop().replace(/\.css$/, ''));
  const id = ids[0];
  // Varias piezas: cada una con su marcador, como las escribe el laboratorio (splitComponents).
  const piezas = await Promise.all(cssFiles.map(leer));
  const css =
    ids.length === 1
      ? piezas[0]
      : piezas.map((pieza, i) => (/@componente\s/.test(pieza) ? pieza : `/* @componente ${ids[i]} */\n${pieza}`)).join('\n\n');

  // La página: la que cambia el PR o, si no la toca, la que tiene el componente en su rama.
  const docsFile = enCarpeta(DOCS_DIR, (n) => n.endsWith('.js'))[0] ?? docsPath(id);
  const docsSource = await leer(docsFile);
  const docs = docsSource ? parseDocsEntry(docsSource) : null;
  if (!docs) {
    avisos.push(
      docsSource
        ? 'Su página de documentación no tiene el formato que entiende el laboratorio: falta el HTML, escríbelo en su pestaña.'
        : 'No tiene página de documentación: falta el HTML, escríbelo en su pestaña.',
    );
  }
  const html = docs ? docs.examples.map((ex) => `<!-- ${ex.title} -->\n${ex.code}`).join('\n\n') : '';

  const jsFiles = enCarpeta(JS_DIR, (n) => n.endsWith('.js') && !n.endsWith('.test.js') && !n.endsWith('/index.js'));
  const jsFile = jsFiles[0]?.split('/').pop() ?? `${id}.js`;
  const js = await leer(jsPath(jsFile));
  const test = js != null ? await leer(testPath(jsFile)) : null;

  const estado = pr.merged_at ? 'mezclado' : pr.state === 'open' ? 'abierto' : 'cerrado';
  return {
    number,
    url: pr.html_url,
    title: pr.title,
    abierto: estado === 'abierto',
    estado,
    autor: pr.user?.login ?? pr.head.repo?.owner.login ?? '',
    mantenedorPuede: Boolean(pr.maintainer_can_modify),
    head: pr.head.repo ? { owner: pr.head.repo.owner.login, name: pr.head.repo.name, branch: pr.head.ref } : null,
    id,
    jsFile: js != null ? jsFile : null,
    files: { html, css, js: js ?? '', test: test != null ? testFromRepo(test, jsFile) : '' },
    docs,
    avisos,
  };
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
  const conTest = js.test ? ` Con su test, \`${testPath(js.file)}\`.` : '';
  const todoTest = js.test ? '' : `- [ ] Test del módulo JS.`;
  switch (js.registro) {
    case 'added':
      return {
        intro: `Incluye el módulo ${ruta}, registrado en \`${JS_ENTRY}\`: ${llamada}.${conTest}`,
        todo: todoTest,
      };
    case 'present':
      return { intro: `Modifica el módulo ${ruta} (ya estaba registrado en \`${JS_ENTRY}\`).${conTest}`, todo: todoTest };
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

/** «cambia el JavaScript», «cambian el JavaScript, su test y la documentación»… */
function queCambia({ js, test, docs }) {
  const partes = [js && 'el JavaScript', test && 'su test', docs && 'la documentación'].filter(Boolean);
  if (partes.length === 0) return 'no cambia nada';
  if (docs && partes.length === 1) return 'cambia solo la documentación';
  const lista = partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`;
  return `${partes.length === 1 ? 'cambia' : 'cambian'} ${lista}`;
}

/** Lo que cambió en la página de documentación, para quien revisa. */
function cambiosDocs(resumen) {
  if (!resumen) return '';
  const lista = (titulo, items) => (items?.length ? `- ${titulo}: ${items.map((i) => `«${i}»`).join(', ')}` : null);
  const lineas = [
    lista('Ejemplos nuevos', resumen.ejemplos?.nuevos),
    lista('Ejemplos con cambios', resumen.ejemplos?.cambiados),
    lista('Ejemplos quitados (comprueba que sobran)', resumen.ejemplos?.quitados),
    lista('API: filas nuevas', resumen.api?.nuevos),
    lista('API: filas quitadas (el CSS ya no las tiene)', resumen.api?.quitados),
  ].filter(Boolean);
  return ['## Documentación', '', lineas.length ? lineas.join('\n') : '- Sin cambios en ejemplos ni API.', ''].join('\n');
}

function prBody({ partes, id, nuevo, sinCss = false, resumen, html, hallazgos, documentado, docs, js, continua = null }) {
  const modulo = jsLines(js);
  const avisos = hallazgos.filter((h) => h.level === 'warn');
  const conjunto = partes.length > 1;
  return [
    // Quien mantiene angela ve de qué PR sale este y puede cerrar el anterior.
    ...(continua ? [`Continúa #${continua.number} de @${continua.autor}: parte de su código con correcciones encima.`, ''] : []),
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
        : sinCss
          ? `El CSS no cambia (\`${cssPath(id)}\`): ${queCambia(sinCss)}.`
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
    documentado && docs.actualiza ? cambiosDocs(docs.resumen) : '',
    '## Falta por hacer al integrarlo',
    '',
    !documentado
      ? `- [ ] ${nuevo ? 'Página de documentación' : 'Pon al día la página que ya existe'} en \`${DOCS_DIR}/\` (ejemplos, API y accesibilidad).`
      : docs.actualiza
        ? `- [x] Página de documentación puesta al día en \`${docsPath(docs.slug)}\`: describe lo que quedó «Pendiente de describir».`
        : `- [x] Página de documentación en \`${docsPath(docs.slug)}\`: repásala y añade los ejemplos que falten.`,
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

/** JSON con las claves ordenadas: dos objetos con los mismos datos dan el mismo texto. */
const estable = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1))) : v,
  );

/**
 * ¿La página de main tiene ya estos datos? Se comparan los datos, no el texto: un archivo con
 * otro formato (comillas, comentario de cabecera) pero el mismo contenido no es un cambio.
 * El archivo es el mismo que ya ejecuta el sitio, así que importarlo no añade confianza.
 */
async function mismaPagina(fuente, docs) {
  if (fuente == null) return false;
  if (fuente === docs.content) return true;
  if (!docs.entry) return false;
  try {
    const actual = (await import(/* @vite-ignore */ `data:text/javascript;charset=utf-8,${encodeURIComponent(fuente)}`)).default;
    return estable(actual) === estable(docs.entry);
  } catch {
    return false;
  }
}

/**
 * Abre el pull request. Informa del avance por `onStep` para que la interfaz lo cuente.
 * @param {{
 *   token: string, id: string, name: string, summary: string,
 *   parts: { id: string, css: string }[],
 *   docs?: { slug: string, content: string, actualiza?: boolean, resumen?: object, entry?: object } | null,
 *   jsFile?: string | null,
 *   files: { html: string, css: string, js: string },
 *   findings?: { level: string, text: string }[],
 *   pr?: { number: number, url: string, autor: string, mantenedorPuede: boolean, head: { owner: string, name: string, branch: string } } | null,
 *   onStep?: (text: string) => void, signal?: AbortSignal,
 * }} input
 *   pr: el pull request abierto del que se trajo el código. Si se puede escribir en su rama
 *   (canUpdatePullRequest) se actualiza; si no, se abre uno nuevo que dice de cuál parte.
 * @returns {Promise<{ url: string, nuevo: boolean, partes: number, actualizado: boolean, continua: number | null }>}
 */
export async function proposeComponent({
  token,
  id,
  name,
  summary,
  parts,
  files,
  docs = null,
  jsFile = null,
  findings = [],
  pr = null,
  onStep = () => {},
  signal,
}) {
  const paso = (text) => onStep(text);
  const opts = { token, signal };

  if (!parts.length) throw new GitHubError('No hay ningún componente que proponer.');

  paso('Identificando tu cuenta…');
  const me = await call('/user', opts);
  const login = me?.login;
  if (!login) throw new GitHubError('No se pudo leer tu cuenta de GitHub.');

  // El PR del que se partió se actualiza solo si se puede escribir en su rama; si no, se abre
  // uno nuevo a nombre de quien propone que dice de cuál parte.
  const destino = pr && canUpdatePullRequest(login, pr) ? pr : null;
  const continua = pr && !destino ? pr : null;

  paso(parts.length > 1 ? 'Comprobando los componentes en el repositorio…' : 'Comprobando el componente en el repositorio…');
  for (const part of parts) {
    const actual = await lookUpComponent(part.id, opts);
    part.existe = actual.existe;
    part.igual = actual.existe && actual.css === `${part.css.trimEnd()}\n`;
  }
  const nuevo = parts.every((p) => !p.existe);
  // Con el CSS igual aún puede haber algo que proponer: la página de documentación (otros
  // ejemplos o notas) o el JS. Solo si tampoco cambian no hay nada que hacer.
  const soloDocs = { docs: false, js: false, test: false };
  if (parts.every((p) => p.igual)) {
    const enMain = async (path) => {
      const file = await call(`/repos/${REPO.owner}/${REPO.name}/contents/${path}?ref=${REPO.branch}`, { ...opts, allow404: true });
      return file?.content ? fromBase64(file.content.replace(/\n/g, '')) : null;
    };
    soloDocs.docs = Boolean(docs?.actualiza) && !(await mismaPagina(await enMain(docsPath(docs.slug)), docs));
    const conJs = hasCode(files.js) && !jsSinEfecto(files.js);
    soloDocs.js = conJs && (await enMain(jsPath(jsFile || `${id}.js`))) !== `${files.js.trimEnd()}\n`;
    const archivoJs = jsFile || `${id}.js`;
    soloDocs.test = conJs && hasCode(files.test) && (await enMain(testPath(archivoJs))) !== testForRepo(files.test, archivoJs);
    // Al actualizar un PR se compara con su rama (put), no con main.
    if (!destino && !soloDocs.docs && !soloDocs.js && !soloDocs.test) {
      throw new GitHubError(
        parts.length > 1
          ? 'Los componentes son idénticos a los que ya están en el repositorio, también su documentación: no hay nada que proponer.'
          : `«${name}» es idéntico al que ya está en el repositorio (CSS${conJs ? ', JS' : ''} y documentación): no hay nada que proponer.`,
      );
    }
  }
  const sinCss = parts.every((p) => p.igual);

  // Quien tiene el repositorio trabaja directo; el resto, sobre su bifurcación.
  const propio = login.toLowerCase() === REPO.owner.toLowerCase();
  let head = { owner: login, name: REPO.name };
  if (destino) {
    head = { owner: destino.head.owner, name: destino.head.name };
  } else if (!propio) {
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

  let branch = destino?.head.branch;
  if (!destino) {
    paso('Creando la rama…');
    const base = await call(`/repos/${REPO.owner}/${REPO.name}/git/ref/heads/${REPO.branch}`, opts);
    branch = `${nuevo ? 'feat' : 'fix'}/${id}-${Date.now().toString(36)}`;
    await call(`/repos/${head.owner}/${head.name}/git/refs`, {
      ...opts,
      method: 'POST',
      body: { ref: `refs/heads/${branch}`, sha: base.object.sha },
    });
  }

  /**
   * Escribe un archivo en la rama. Si ya existe en la bifurcación, hace falta su sha; si es
   * idéntico, no se escribe (al actualizar un PR, solo sube lo que cambia).
   */
  let escritos = 0;
  const put = async (path, content, message) => {
    const existente = await call(`/repos/${head.owner}/${head.name}/contents/${path}?ref=${branch}`, {
      ...opts,
      allow404: true,
    });
    if (existente?.content != null && fromBase64(existente.content.replace(/\n/g, '')) === content) return;
    escritos += 1;
    await call(`/repos/${head.owner}/${head.name}/contents/${path}`, {
      ...opts,
      method: 'PUT',
      body: { message, content: toBase64(content), branch, ...(existente?.sha ? { sha: existente.sha } : {}) },
    });
  };

  const conjunto = parts.length > 1;
  const quienes = conjunto ? `los componentes ${parts.map((p) => p.id).join(' y ')}` : `el componente ${name}`;
  const titulo = nuevo
    ? `feat(${id}): añade ${quienes}`
    : sinCss && !soloDocs.js && soloDocs.test && !soloDocs.docs
      ? `test(${id}): pruebas de ${conjunto ? quienes.replace('los componentes ', '') : `«${name}»`}`
      : sinCss && !soloDocs.js
        ? `docs(${id}): pone al día la documentación de ${conjunto ? quienes.replace('los componentes ', '') : `«${name}»`}`
        : `fix(${id}): mejora ${quienes}`;

  for (const part of parts) {
    if (part.igual && !destino) continue;
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

  // Un componente nuevo estrena página. Uno que ya existe solo se toca si el laboratorio la
  // fusionó con la que hay (docs.actualiza): una generada de cero la duplicaría o perdería lo
  // escrito a mano. Si no, queda como tarea en el PR.
  const documentado = Boolean(docs) && (nuevo || Boolean(docs.actualiza));
  // Con el CSS igual y la página igual (solo cambia el JS), la página ya está al día.
  if (documentado && (destino || !(sinCss && !soloDocs.docs))) {
    paso(docs.actualiza ? 'Poniendo al día la página de documentación…' : 'Escribiendo la página de documentación…');
    await put(
      docsPath(docs.slug),
      docs.content,
      docs.actualiza ? `docs(${id}): pone al día su página` : `docs(${id}): página del componente`,
    );
  }

  // El JS se sube y se registra en @angela-ui/angela/js: si no, angela() no lo ejecuta nunca.
  // Un JS sin efecto (una plantilla que quedó en la pestaña) no se sube: solo añadiría peso.
  let js = null;
  const subeJs = hasCode(files.js) && !jsSinEfecto(files.js) && (Boolean(destino) || !(sinCss && !soloDocs.js));
  const subeTest = hasCode(files.js) && !jsSinEfecto(files.js) && hasCode(files.test) && (Boolean(destino) || !(sinCss && !soloDocs.test));
  if (subeJs) {
    const file = jsFile || `${id}.js`;
    paso('Subiendo el JavaScript…');
    await put(jsPath(file), `${files.js.trimEnd()}\n`, `feat(${id}): módulo JavaScript del componente`);
    const fn = findEntryFunction(files.js);
    js = { file, fn, registro: fn ? null : 'sin-funcion', test: hasCode(files.test) };
    if (fn) {
      paso('Registrando el JavaScript en @angela-ui/angela/js…');
      const entrada = await call(`/repos/${head.owner}/${head.name}/contents/${JS_ENTRY}?ref=${branch}`, opts);
      const registro = registerJsModule(fromBase64(entrada.content.replace(/\n/g, '')), file, fn);
      js.registro = registro.status;
      if (registro.status === 'added') await put(JS_ENTRY, registro.code, `chore(${id}): activa el módulo en angela()`);
    }
  }

  // El test de la pestaña «Test»: la revisión del PR exige uno para cada módulo JS.
  if (subeTest) {
    const file = jsFile || `${id}.js`;
    paso('Subiendo el test…');
    await put(testPath(file), testForRepo(files.test, file), `test(${id}): pruebas del módulo`);
  }

  if (destino) {
    if (!escritos) throw new GitHubError(`No hay cambios respecto al pull request #${destino.number}: no hay nada que subir.`);
    return { url: destino.url, nuevo, partes: parts.length, actualizado: true, continua: null };
  }

  paso('Abriendo el pull request…');
  const headRef = propio ? branch : `${head.owner}:${branch}`;
  let abierto;
  try {
    abierto = await call(`/repos/${REPO.owner}/${REPO.name}/pulls`, {
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
          sinCss: sinCss && soloDocs,
          resumen: summary,
          html: files.html,
          js,
          hallazgos: findings,
          documentado,
          docs,
          continua,
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

  return { url: abierto.html_url, nuevo, partes: parts.length, actualizado: false, continua: continua?.number ?? null };
}

/* ---------- Iconos ---------- */

const ICONOS_DIR = 'packages/angela-icons/iconos';

/**
 * Propone un icono: un archivo (su fuente, iconos/<nombre>.json) en su propio pull request.
 * Como con los componentes, quien tiene el repositorio trabaja directo; el resto, en su bifurcación.
 * @param {{
 *   token: string, nombre: string,
 *   icono: { version: number, categoria: string, etiquetas: string[], autor: string, licencia: string, formas: object[] },
 *   svg: string, descripcion?: string, avisos?: string[],
 *   onStep?: (text: string) => void, signal?: AbortSignal,
 * }} input
 * @returns {Promise<{ url: string, nuevo: boolean }>}
 */
export async function proposeIcon({ token, nombre, icono, svg, descripcion = '', avisos = [], onStep = () => {}, signal }) {
  const opts = { token, signal };
  const ruta = `${ICONOS_DIR}/${nombre}.json`;
  const contenido = `${JSON.stringify(icono, null, 2)}\n`;

  onStep('Comprobando el icono en el repositorio…');
  const actual = await call(`/repos/${REPO.owner}/${REPO.name}/contents/${ruta}?ref=${REPO.branch}`, { ...opts, allow404: true });
  const nuevo = !actual;
  if (actual?.content && fromBase64(actual.content.replace(/\n/g, '')) === contenido) {
    throw new GitHubError(`«${nombre}» es idéntico al que ya está en el repositorio: no hay nada que proponer.`);
  }

  onStep('Identificando tu cuenta…');
  const me = await call('/user', opts);
  if (!me?.login) throw new GitHubError('No se pudo leer tu cuenta de GitHub.');
  const propio = me.login.toLowerCase() === REPO.owner.toLowerCase();
  let head = { owner: me.login, name: REPO.name };
  if (!propio) {
    onStep('Preparando tu copia del repositorio…');
    const fork = await call(`/repos/${REPO.owner}/${REPO.name}/forks`, { ...opts, method: 'POST' });
    head = { owner: fork.owner.login, name: fork.name };
    for (let intento = 0; intento < 10; intento += 1) {
      if (await call(`/repos/${head.owner}/${head.name}/branches/${REPO.branch}`, { ...opts, allow404: true })) break;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  onStep('Creando la rama…');
  const base = await call(`/repos/${REPO.owner}/${REPO.name}/git/ref/heads/${REPO.branch}`, opts);
  const branch = `${nuevo ? 'feat' : 'fix'}/icono-${nombre}-${Date.now().toString(36)}`;
  await call(`/repos/${head.owner}/${head.name}/git/refs`, { ...opts, method: 'POST', body: { ref: `refs/heads/${branch}`, sha: base.object.sha } });

  onStep(`Subiendo ${nombre}.json…`);
  const existente = await call(`/repos/${head.owner}/${head.name}/contents/${ruta}?ref=${branch}`, { ...opts, allow404: true });
  await call(`/repos/${head.owner}/${head.name}/contents/${ruta}`, {
    ...opts,
    method: 'PUT',
    body: {
      message: `${nuevo ? 'feat' : 'fix'}(iconos): ${nuevo ? 'añade' : 'mejora'} ${nombre}`,
      content: toBase64(contenido),
      branch,
      ...(existente?.sha ? { sha: existente.sha } : {}),
    },
  });

  onStep('Abriendo el pull request…');
  const titulo = `${nuevo ? 'feat' : 'fix'}(iconos): ${nuevo ? 'añade' : 'mejora'} ${nombre}`;
  const cuerpo = [
    descripcion.trim(),
    '',
    `## ${nuevo ? 'Icono nuevo' : 'Cambio sobre un icono existente'}: \`${nombre}\``,
    '',
    `| Categoría | Etiquetas | Formas | Autor | Licencia |`,
    `| --- | --- | --- | --- | --- |`,
    `| ${icono.categoria} | ${icono.etiquetas.join(', ')} | ${icono.formas.length} | ${icono.autor} | ${icono.licencia} |`,
    '',
    `Fuente: \`${ruta}\`. El SVG lo genera el build con el estilo a mano alzada; se ve en la página «Iconos» de la preview.`,
    '',
    avisos.length ? `## Avisos de la guía\n\n${avisos.map((a) => `- ${a}`).join('\n')}\n` : '',
    '<details><summary>SVG generado</summary>',
    '',
    '```svg',
    svg,
    '```',
    '',
    '</details>',
    '',
    '---',
    '',
    'Propuesto desde el editor de iconos de angela.',
  ]
    .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
    .join('\n');

  const headRef = propio ? branch : `${head.owner}:${branch}`;
  let pr;
  try {
    pr = await call(`/repos/${REPO.owner}/${REPO.name}/pulls`, { ...opts, method: 'POST', body: { title: titulo, head: headRef, base: REPO.branch, body: cuerpo, maintainer_can_modify: true } });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    const compare = new URL(`https://github.com/${REPO.owner}/${REPO.name}/compare/${REPO.branch}...${headRef}`);
    compare.searchParams.set('quick_pull', '1');
    compare.searchParams.set('title', titulo);
    throw new GitHubError(`El icono ya está en la rama ${branch}, pero no se pudo abrir el pull request: ${error?.message ?? 'error desconocido'}`, { cause: { compareUrl: compare.href } });
  }
  return { url: pr.html_url, nuevo };
}
