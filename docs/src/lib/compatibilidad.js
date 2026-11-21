/**
 * Compatibilidad de un componente con los navegadores, calculada al construir el sitio.
 *
 * - Qué usa: se detecta en su CSS y en el HTML de sus ejemplos (tabla CARACTERISTICAS), más lo
 *   que usa toda la librería (tokens, paleta y estilos base).
 * - Desde qué versión: web-features (los datos de Baseline).
 * - Cuántos usuarios: el uso mundial de cada versión según caniuse (browserslist).
 *
 * angela usa lo más nuevo como mejora progresiva, así que se separa:
 * - base: sin esto el componente no funciona; marca la versión mínima.
 * - mejora: si falta, se ve el comportamiento nativo o sin animación (no rompe nada).
 * - polyfill: lo completa el JS de angela (angela()) donde falta.
 */
import { features } from 'web-features';
import browserslist from 'browserslist';

/** Los navegadores de Baseline, con su nombre en caniuse. */
export const NAVEGADORES = [
  { id: 'chrome', caniuse: 'chrome', nombre: 'Chrome' },
  { id: 'chrome_android', caniuse: 'and_chr', nombre: 'Chrome Android' },
  { id: 'edge', caniuse: 'edge', nombre: 'Edge' },
  { id: 'firefox', caniuse: 'firefox', nombre: 'Firefox' },
  { id: 'firefox_android', caniuse: 'and_ff', nombre: 'Firefox Android' },
  { id: 'safari', caniuse: 'safari', nombre: 'Safari' },
  { id: 'safari_ios', caniuse: 'ios_saf', nombre: 'Safari iOS' },
];

/**
 * @typedef {'base' | 'mejora' | 'polyfill'} Papel
 * @typedef {{ id: string, nombre: string, papel: Papel, css?: RegExp, html?: RegExp, nota?: string }} Caracteristica
 */

/** @type {Caracteristica[]} */
export const CARACTERISTICAS = [
  // Lo que usa toda la librería (tokens, paleta, capas).
  { id: 'cascade-layers', nombre: 'Capas de cascada (@layer)', papel: 'base', css: /@layer\b/ },
  { id: 'nesting', nombre: 'CSS anidado', papel: 'base', css: /&[\s:.[>+~]|&\s*\{/ },
  { id: 'custom-properties', nombre: 'Variables CSS', papel: 'base', css: /var\(--/ },
  { id: 'oklab', nombre: 'Colores oklch()', papel: 'base', css: /oklch\(/ },
  { id: 'light-dark', nombre: 'light-dark()', papel: 'base', css: /light-dark\(/ },
  { id: 'where', nombre: ':where() e :is()', papel: 'base', css: /:(where|is)\(/ },
  { id: 'color-mix', nombre: 'color-mix()', papel: 'base', css: /color-mix\(/ },
  { id: 'min-max-clamp', nombre: 'min(), max() y clamp()', papel: 'base', css: /\b(min|max|clamp)\(/ },
  { id: 'media-query-range-syntax', nombre: 'Media queries con rangos', papel: 'base', css: /@media[^{]*[<>]=?/ },

  // Selectores y diseño.
  { id: 'has', nombre: ':has()', papel: 'base', css: /:has\(/ },
  { id: 'user-pseudos', nombre: ':user-invalid', papel: 'base', css: /:user-(in)?valid/ },
  { id: 'focus-visible', nombre: ':focus-visible', papel: 'base', css: /:focus-visible/ },
  { id: 'dir-pseudo', nombre: ':dir()', papel: 'base', css: /:dir\(/ },
  { id: 'logical-properties', nombre: 'Propiedades lógicas', papel: 'base', css: /\b(inline|block)-size\b|-(inline|block)(-start|-end)?\s*:|\binset-(inline|block)/ },
  { id: 'flexbox-gap', nombre: 'gap en flexbox', papel: 'base', css: /\bgap\s*:/ },
  { id: 'grid', nombre: 'Grid', papel: 'base', css: /display:\s*(inline-)?grid/ },
  { id: 'subgrid', nombre: 'Subgrid', papel: 'base', css: /\bsubgrid\b/ },
  { id: 'container-queries', nombre: 'Container queries', papel: 'base', css: /@container|container-type/ },
  { id: 'aspect-ratio', nombre: 'aspect-ratio', papel: 'base', css: /aspect-ratio\s*:/ },
  { id: 'masks', nombre: 'Máscaras (mask)', papel: 'base', css: /\bmask(-image)?\s*:/ },
  { id: 'individual-transforms', nombre: 'translate, rotate y scale', papel: 'base', css: /(^|[\s;{])(translate|rotate|scale)\s*:/m },
  { id: 'transforms3d', nombre: 'Transformaciones 3D', papel: 'base', css: /perspective|preserve-3d|backface-visibility|rotate[XY]\(/ },
  { id: 'appearance', nombre: 'appearance', papel: 'base', css: /\bappearance\s*:/ },
  { id: 'sticky-positioning', nombre: 'position: sticky', papel: 'base', css: /position:\s*sticky/ },
  { id: 'viewport-unit-variants', nombre: 'Unidades dvh/svh', papel: 'base', css: /\d(dvh|svh|lvh|dvw|svw)\b/ },
  { id: 'conic-gradients', nombre: 'Degradados cónicos', papel: 'base', css: /conic-gradient\(/ },

  // HTML nativo.
  { id: 'dialog', nombre: '<dialog>', papel: 'base', html: /<dialog\b/ },
  { id: 'details', nombre: '<details>', papel: 'base', html: /<details\b/ },
  { id: 'autonomous-custom-elements', nombre: 'Elementos personalizados', papel: 'base', html: /<angela-[a-z-]+/ },
  { id: 'inert', nombre: 'inert', papel: 'base', html: /\sinert[\s>=]/ },
  { id: 'meter', nombre: '<meter>', papel: 'base', html: /<meter\b/ },
  { id: 'progress', nombre: '<progress>', papel: 'base', html: /<progress\b/ },

  // Lo que completa el JS de angela.
  { id: 'popover', nombre: 'popover', papel: 'polyfill', html: /\spopover[\s>=]/, nota: 'angela() carga un polyfill donde falta.' },
  { id: 'invoker-commands', nombre: 'commandfor y command', papel: 'polyfill', html: /\scommandfor=/, nota: 'angela() carga un polyfill donde falta.' },
  { id: 'dialog-closedby', nombre: 'closedby en <dialog>', papel: 'polyfill', html: /\sclosedby=/, nota: 'angela() cierra el diálogo al pulsar fuera.' },
  { id: 'focusgroup', nombre: 'focusgroup', papel: 'polyfill', html: /\sfocusgroup=/, nota: 'Sin él, <angela-tabs> pone las flechas del teclado.' },

  // Mejoras progresivas: si faltan, se ve lo nativo o sin animación.
  { id: 'customizable-select', nombre: 'Select personalizable (base-select)', papel: 'mejora', css: /base-select|::picker\(/, nota: 'Sin él, el select nativo.' },
  { id: 'anchor-positioning', nombre: 'Anchor positioning', papel: 'mejora', css: /anchor-name|position-anchor|position-area/, nota: 'Sin él, una hoja inferior.' },
  { id: 'details-name', nombre: 'Acordeón exclusivo (<details name>)', papel: 'mejora', html: /<details[^>]*\sname=/, nota: 'Sin él, se pueden abrir varios a la vez.' },
  { id: 'hidden-until-found', nombre: 'hidden="until-found"', papel: 'mejora', html: /hidden="until-found"/, nota: 'Sin él, el contenido oculto no aparece al buscar con Ctrl+F.' },
  { id: 'details-content', nombre: '::details-content', papel: 'mejora', css: /::details-content/, nota: 'Sin él, se abre sin animación.' },
  { id: 'interpolate-size', nombre: 'interpolate-size', papel: 'mejora', css: /interpolate-size/, nota: 'Sin él, se abre sin animación.' },
  { id: 'starting-style', nombre: '@starting-style', papel: 'mejora', css: /@starting-style/, nota: 'Sin él, aparece sin animación.' },
  { id: 'transition-behavior', nombre: 'transition-behavior', papel: 'mejora', css: /transition-behavior|allow-discrete/, nota: 'Sin él, desaparece sin animación.' },
  { id: 'registered-custom-properties', nombre: '@property', papel: 'mejora', css: /@property\b/, nota: 'Sin él, sin la transición de esa variable.' },
  { id: 'scroll-driven-animations', nombre: 'Animaciones con el scroll', papel: 'mejora', css: /animation-timeline/, nota: 'Sin ellas, sin ese efecto.' },
  { id: 'scroll-snap', nombre: 'Scroll snap', papel: 'mejora', css: /scroll-snap/, nota: 'Sin él, el scroll no se ajusta a cada elemento.' },
  { id: 'overscroll-behavior', nombre: 'overscroll-behavior', papel: 'mejora', css: /overscroll-behavior/, nota: 'Sin él, el gesto puede mover la página.' },
  { id: 'field-sizing', nombre: 'field-sizing', papel: 'mejora', css: /field-sizing/, nota: 'Sin él, el campo no crece solo (se redimensiona a mano).' },
  { id: 'accent-color', nombre: 'accent-color', papel: 'mejora', css: /accent-color/, nota: 'Sin él, el color nativo del control.' },
  { id: 'lh', nombre: 'Unidad lh', papel: 'mejora', css: /\d+(\.\d+)?lh\b/, nota: 'Sin ella, el alto por defecto.' },
  { id: 'open-pseudo', nombre: ':open', papel: 'mejora', css: /:open\b/, nota: 'Sin él, sin el estilo de abierto.' },
  { id: 'text-wrap-balance', nombre: 'text-wrap: balance', papel: 'mejora', css: /text-wrap:\s*balance/, nota: 'Sin él, el corte de línea normal.' },
  { id: 'text-wrap-pretty', nombre: 'text-wrap: pretty', papel: 'mejora', css: /text-wrap:\s*pretty/, nota: 'Sin él, el corte de línea normal.' },
  { id: 'backdrop-filter', nombre: 'backdrop-filter', papel: 'mejora', css: /backdrop-filter/, nota: 'Sin él, sin el desenfoque del fondo.' },
  { id: 'scrollbar-width', nombre: 'scrollbar-width', papel: 'mejora', css: /scrollbar-width/, nota: 'Sin él, la barra de scroll nativa.' },
  { id: 'scrollbar-gutter', nombre: 'scrollbar-gutter', papel: 'mejora', css: /scrollbar-gutter/, nota: 'Sin él, el contenido puede moverse al aparecer la barra.' },
  { id: 'view-transitions', nombre: 'View Transitions', papel: 'mejora', css: /view-transition/, nota: 'Sin ellas, el cambio es instantáneo.' },
  { id: 'content-visibility', nombre: 'content-visibility', papel: 'mejora', css: /content-visibility/, nota: 'Sin él, se pinta todo de una vez.' },
];

const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Las características que usa un CSS + HTML, sin repetir. */
export function detectar({ css = '', html = '' }) {
  const codigo = sinComentarios(css);
  return CARACTERISTICAS.filter((c) => (c.css && c.css.test(codigo)) || (c.html && c.html.test(html)));
}

/* ---------- Versiones y uso ---------- */

/** «≤79» → [79]; «15.4» → [15, 4]; «15.2-15.3» (caniuse) → [15, 2]. */
const version = (v) =>
  String(v)
    .replace(/^[^\d]*/, '')
    .split('-')[0]
    .split('.')
    .map(Number);

const comparar = (a, b) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d) return d;
  }
  return 0;
};

/** Uso mundial (%) de cada versión: { chrome: [[version, uso], …], … }. */
function usoPorNavegador() {
  const uso = {};
  for (const [clave, porcentaje] of Object.entries(browserslist.usage.global)) {
    const [nav, ver] = clave.split(' ');
    if (!/^\d/.test(ver ?? '')) continue; // «safari TP» no es una versión publicada
    (uso[nav] ??= []).push([version(ver), porcentaje]);
  }
  return uso;
}

let cacheUso;
const uso = () => (cacheUso ??= usoPorNavegador());

/** Uso total del mundo que recogen los datos (lo que falta hasta 100 no está identificado). */
export const usoTotal = () => Object.values(browserslist.usage.global).reduce((a, b) => a + b, 0);

/**
 * La versión mínima de cada navegador para un conjunto de características: la mayor de las
 * mínimas. null si alguna no la soporta ese navegador.
 * @param {Caracteristica[]} lista
 */
function desde(lista) {
  return Object.fromEntries(
    NAVEGADORES.map((n) => {
      let minima = [0];
      for (const c of lista) {
        const v = features[c.id]?.status?.support?.[n.id];
        if (!v) return [n.id, null];
        if (comparar(version(v), minima) > 0) minima = version(v);
      }
      return [n.id, minima];
    }),
  );
}

/** Uso mundial de las versiones ≥ `minima` de un navegador, y el total de ese navegador. */
function cobertura(nav, minima) {
  const versiones = uso()[nav] ?? [];
  const total = versiones.reduce((s, [, p]) => s + p, 0);
  const soportado = minima ? versiones.filter(([v]) => comparar(v, minima) >= 0).reduce((s, [, p]) => s + p, 0) : 0;
  return { total, soportado };
}

/**
 * @param {Caracteristica[]} lista
 * @returns {{ navegadores: { id: string, nombre: string, desde: string | null, porcentaje: number }[], global: number }}
 */
function resumen(lista) {
  const minimas = desde(lista);
  let global = 0;
  const navegadores = NAVEGADORES.map((n) => {
    const { total, soportado } = cobertura(n.caniuse, minimas[n.id]);
    global += soportado;
    return {
      id: n.id,
      nombre: n.nombre,
      desde: minimas[n.id] ? minimas[n.id].join('.') : null,
      porcentaje: total ? (soportado / total) * 100 : 0,
    };
  });
  return { navegadores, global };
}

/**
 * La compatibilidad de un componente.
 * @param {{ css?: string, html?: string, nucleo?: string }} fuentes
 *   nucleo: el CSS que usa toda la librería (tokens, paleta, estilos base)
 */
export function compatibilidad({ css = '', html = '', nucleo = '' }) {
  const conDatos = (lista) => lista.filter((c) => features[c.id]?.status);
  const delNucleo = conDatos(detectar({ css: nucleo })).filter((c) => c.papel === 'base');
  const idsNucleo = new Set(delNucleo.map((c) => c.id));
  const propias = conDatos(detectar({ css, html })).filter((c) => !idsNucleo.has(c.id));
  const base = [...delNucleo, ...propias.filter((c) => c.papel === 'base')];

  const detalle = (c) => ({
    id: c.id,
    nombre: c.nombre,
    nota: c.nota ?? null,
    baseline: features[c.id].status.baseline,
    desde: Object.fromEntries(NAVEGADORES.map((n) => [n.id, features[c.id].status.support?.[n.id] ?? null])),
  });

  return {
    /** Funciona (base de la librería + base del componente): versión mínima y usuarios por navegador. */
    base: resumen(base),
    nucleo: delNucleo.map(detalle),
    propias: propias.filter((c) => c.papel === 'base').map(detalle),
    /** Cada mejora por separado: qué parte de los usuarios la ve (además de la base). */
    mejoras: propias
      .filter((c) => c.papel === 'mejora')
      .map((c) => ({ ...detalle(c), global: resumen([...base, c]).global })),
    polyfills: propias.filter((c) => c.papel === 'polyfill').map(detalle),
    /** Uso mundial que suman los siete navegadores de Baseline, y el que recogen los datos. */
    identificado: NAVEGADORES.reduce((s, n) => s + cobertura(n.caniuse, [0]).total, 0),
    total: usoTotal(),
  };
}

/**
 * El soporte de una sola característica: su estado de Baseline y qué parte del uso mundial la ve.
 * @param {string} id  id de web-features
 */
export function soporteDe(id) {
  const c = CARACTERISTICAS.find((x) => x.id === id) ?? { id, nombre: features[id]?.name ?? id, papel: 'mejora' };
  const r = resumen([c]);
  return { id, nombre: c.nombre, nota: c.nota ?? null, baseline: features[id]?.status?.baseline ?? false, global: r.global, navegadores: r.navegadores };
}
