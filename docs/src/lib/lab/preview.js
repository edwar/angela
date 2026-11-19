/**
 * Vista previa aislada del laboratorio.
 *
 * El código del editor (o el que propone la IA) se trata siempre como NO confiable.
 * Se ejecuta en un <iframe sandbox="allow-scripts allow-forms"> SIN allow-same-origin:
 * el documento tiene un origen opaco, así que no puede leer el localStorage de la
 * página (donde vive la clave de la IA), ni sus cookies, ni su DOM.
 * Además lleva una CSP que bloquea la red (fetch, scripts y estilos externos, envío de
 * formularios). Solo se permiten imágenes por https, sin referer: el documento no guarda
 * nada sensible (ni clave ni cookies), así que una imagen no tiene qué sacar.
 */

// Fuentes de angela, tal cual están en el paquete (una sola fuente de verdad).
const cssSources = import.meta.glob('../../../../packages/angela/src/**/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const jsSources = import.meta.glob(['../../../../packages/angela/src/js/*.js', '!**/*.test.js'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Normaliza las claves del glob a rutas relativas a src/ (p. ej. "components/button.css"). */
function bySrcPath(sources) {
  return Object.fromEntries(
    Object.entries(sources).map(([key, value]) => [key.replace(/^.*\/packages\/angela\/src\//, ''), value]),
  );
}

export const angelaCss = bySrcPath(cssSources);
export const angelaJs = Object.fromEntries(
  Object.entries(bySrcPath(jsSources)).map(([key, value]) => [key.replace(/^js\//, ''), value]),
);

/** Qué archivo de CSS y qué módulo de JS define cada componente documentado. */
export const componentSources = {
  boton: { css: 'components/button.css' },
  campos: { css: 'components/field.css', js: 'forms.js' },
  seleccion: { css: 'components/choice.css' },
  dialogo: { css: 'components/dialog.css', js: 'overlays.js' },
  popover: { css: 'components/popover.css', js: 'overlays.js' },
  pestanas: { css: 'components/tabs.css', js: 'tabs.js' },
  desplegable: { css: 'components/disclosure.css' },
  avisos: { css: 'components/feedback.css' },
  tarjeta: { css: 'components/layout.css' },
  tabla: { css: 'components/layout.css' },
  tipografia: { css: 'components/typography.css' },
};

/**
 * Vocabulario de angela para el autocompletado del editor: clases públicas y tokens.
 * Se extrae del propio CSS, así nunca se desincroniza. Los privados (`--_x`) quedan fuera.
 * @returns {{ classes: string[], tokens: string[] }}
 */
export function angelaVocabulary(sources = angelaCss) {
  const classes = new Set();
  const tokens = new Set();
  for (const css of Object.values(sources)) {
    const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, name] of code.matchAll(/\.([a-z][\w-]*)(?=[^{};]*\{)/g)) classes.add(name);
    for (const [, name] of code.matchAll(/(--[a-z][\w-]*)\s*:/g)) tokens.add(name);
  }
  return { classes: [...classes].sort(), tokens: [...tokens].sort() };
}

const IMPORT_LINE =/^@import\s+["']\.\/([^"']+)["'];\s*$/gm;

/**
 * Une el CSS de angela igual que scripts/build.mjs, opcionalmente sin un archivo
 * (el que se está editando, para que lo sustituya la versión del editor).
 * @param {{ exclude?: string, sources?: Record<string, string> }} [options]
 */
export function bundleAngelaCss({ exclude, sources = angelaCss } = {}) {
  const inline = (file, seen = new Set()) => {
    if (seen.has(file)) throw new Error(`Import circular: ${file}`);
    const css = sources[file];
    if (css == null) throw new Error(`No existe ${file}`);
    const base = file.includes('/') ? file.slice(0, file.lastIndexOf('/') + 1) : '';
    return css.replace(IMPORT_LINE, (_, path) => {
      const target = base + path.replace(/^\.\//, '');
      return target === exclude ? `/* ${target}: lo sustituye el editor */` : inline(target, new Set([...seen, file]));
    });
  };
  return inline('angela.css');
}

/** CSP del documento de la vista previa: sin red, sin marcos, sin plugins. */
export const PREVIEW_CSP = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  "script-src 'unsafe-inline' blob:",
  // Imágenes externas (placeholders, CDNs) sí: son parte normal de un componente.
  'img-src https: data: blob:',
  'font-src data:',
  'media-src data: blob:',
  "connect-src 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "object-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join('; ');

/** Evita que un texto cierre antes de tiempo la etiqueta que lo contiene. */
const escapeClosingTag = (text, tag) => text.replace(new RegExp(`</(${tag})`, 'gi'), '<\\/$1');

/** JSON seguro para incrustar dentro de <script>. */
const scriptJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

/**
 * Script clásico que va primero: captura console.* y errores y los manda a la página
 * por un MessagePort que la página le entrega al cargar. Solo el padre puede entregarlo.
 */
const consoleBridge = `
(() => {
  const queue = [];
  let port = null;
  const MAX = 2000;
  const show = (v) => {
    if (typeof v === 'string') return v;
    if (v instanceof Error) return v.name + ': ' + v.message;
    try { return JSON.stringify(v); } catch { return String(v); }
  };
  const send = (level, args) => {
    const entry = { level, text: args.map(show).join(' ').slice(0, MAX) };
    if (port) port.postMessage(entry); else if (queue.length < 200) queue.push(entry);
  };
  for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
    const original = console[level];
    console[level] = (...args) => { send(level, args); original.apply(console, args); };
  }
  addEventListener('error', (e) => send('error', [e.message || 'Error']));
  addEventListener('unhandledrejection', (e) => send('error', ['Promesa rechazada:', e.reason]));
  addEventListener('securitypolicyviolation', (e) =>
    send('warn', ['Bloqueado por seguridad: ' + e.effectiveDirective + (e.blockedURI ? ' (' + e.blockedURI + ')' : '')]));
  addEventListener('message', (e) => {
    if (port || e.source !== parent || !e.ports[0]) return;
    port = e.ports[0];
    queue.splice(0).forEach((entry) => port.postMessage(entry));
  });
})();`;

/**
 * Carga los módulos de angela desde blobs (dentro del iframe, sin red) y luego el JS del editor.
 * Si el editor tiene el código de un módulo de angela (p. ej. tabs.js), lo sustituye.
 */
function moduleLoader({ modules, userJs, userModule, dependencyJs = [] }) {
  return `
const files = ${scriptJson(modules)};
const dependencyJs = ${scriptJson(dependencyJs)};
const userJs = ${scriptJson(userJs)};
const userModule = ${scriptJson(userModule ?? null)};
if (userModule) files[userModule] = userJs;
const urls = {};
const load = (name) => {
  if (urls[name]) return urls[name];
  if (!(name in files)) throw new Error('Módulo no encontrado: ' + name);
  const source = files[name].replace(/(\\bfrom\\s*|\\bimport\\s*\\(?\\s*)(["'])\\.\\/([\\w-]+\\.js)\\2/g,
    (_, prefix, quote, dep) => prefix + quote + load(dep) + quote);
  return (urls[name] = URL.createObjectURL(new Blob([source], { type: 'text/javascript' })));
};
try {
  const { angela } = await import(load('index.js'));
  angela({ polyfills: false });
} catch (error) {
  console.error('No se pudo cargar angela/js:', error);
}
// JS de los componentes propios que se usan, antes que el del editor.
for (const [index, { name, js }] of dependencyJs.entries()) {
  try {
    files['__uso' + index + '.js'] = js;
    await import(load('__uso' + index + '.js'));
  } catch (error) {
    console.error('Error en el componente «' + name + '»:', error);
  }
}
if (!userModule && userJs.trim()) {
  try {
    files['__editor.js'] = userJs;
    await import(load('__editor.js'));
  } catch (error) {
    console.error(error);
  }
}`;
}

/**
 * Construye el documento completo de la vista previa.
 * @param {{
 *   html: string, css: string, js: string,
 *   baseCss: string,
 *   scheme?: 'light' | 'dark',
 *   jsModule?: string | null,
 *   modules?: Record<string, string>,
 *   dependencies?: { name: string, css: string, js: string }[],
 * }} input
 */
export function buildPreviewDocument({
  html,
  css,
  js,
  baseCss,
  scheme = 'light',
  jsModule = null,
  modules = angelaJs,
  dependencies = [],
}) {
  const dependencyCss = dependencies.map((d) => `/* Componente: ${d.name.replace(/\*\//g, '')} */\n${d.css}`).join('\n\n');
  const dependencyJs = dependencies.filter((d) => d.js.trim()).map(({ name, js: code }) => ({ name, js: code }));
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="color-scheme" content="${scheme === 'dark' ? 'dark' : 'light'}">
<script>${consoleBridge}</script>
<style>${escapeClosingTag(baseCss, 'style')}
@layer laboratorio {
  body { margin: 0; padding: 1.5rem; }
  body > * + * { margin-block-start: 2rem; }
}</style>
<style>${escapeClosingTag(dependencyCss, 'style')}</style>
<style>${escapeClosingTag(css, 'style')}</style>
<!-- En el <head> y no tras el HTML del editor: un atributo o comentario sin cerrar no puede
     tragárselo. Los módulos se ejecutan al terminar de analizar el documento. -->
<script type="module">${escapeClosingTag(moduleLoader({ modules, userJs: js, userModule: jsModule, dependencyJs }), 'script')}</script>
</head>
<body>
${html}
</body>
</html>`;
}

/**
 * Señala usos que merecen revisión antes de aceptar código ajeno (por ejemplo, el de la IA).
 * No sustituye al aislamiento: es una ayuda para leer la propuesta.
 * @param {string} code
 * @returns {string[]}
 */
export function riskyPatterns(code) {
  const checks = [
    [/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon/, 'Hace peticiones de red.'],
    [/localStorage|sessionStorage|indexedDB|document\.cookie/, 'Lee o escribe almacenamiento del navegador.'],
    [/\beval\s*\(|new\s+Function\s*\(|setTimeout\s*\(\s*["'`]/, 'Ejecuta texto como código.'],
    [/<script[^>]+src=|import\s*\(\s*["'`]https?:|\bimport\s+[^;]*from\s*["'`]https?:/, 'Carga scripts externos.'],
    [/window\.(top|parent|opener)|\bparent\.|postMessage/, 'Intenta hablar con otras ventanas.'],
    [/<[a-z][^>]*\son[a-z]+\s*=/i, 'Tiene manejadores de eventos en línea (onclick, onerror…).'],
    [/https?:\/\/(?!www\.w3\.org)/, 'Contiene direcciones externas (además de imágenes).'],
  ];
  // Las imágenes por https están permitidas: no cuentan como dirección sospechosa.
  const withoutImages = code.replace(/<img\b[^>]*>/gi, '').replace(/<source\b[^>]*>/gi, '');
  return checks
    .filter(([pattern], index) => pattern.test(index === checks.length - 1 ? withoutImages : code))
    .map(([, message]) => message);
}
