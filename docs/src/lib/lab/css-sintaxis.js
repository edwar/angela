/**
 * Comprobación de sintaxis del CSS de un componente, sin dependencias (corre en el
 * laboratorio y en el CI). No es un parser completo: busca los errores que hacen fallar
 * el minificador del build (lightningcss) y con él el deploy, y explica cómo arreglarlos.
 *
 * Devuelve null si no encuentra nada, o el primer error con su línea.
 */

/** Características de @media que existen, con sus valores cuando son una lista cerrada. */
const MEDIA_FEATURES = {
  'prefers-reduced-motion': ['no-preference', 'reduce'],
  'prefers-color-scheme': ['light', 'dark'],
  'prefers-contrast': ['no-preference', 'more', 'less', 'custom'],
  'prefers-reduced-transparency': ['no-preference', 'reduce'],
  'prefers-reduced-data': ['no-preference', 'reduce'],
  'forced-colors': ['none', 'active'],
  'inverted-colors': ['none', 'inverted'],
  hover: ['none', 'hover'],
  'any-hover': ['none', 'hover'],
  pointer: ['none', 'coarse', 'fine'],
  'any-pointer': ['none', 'coarse', 'fine'],
  orientation: ['portrait', 'landscape'],
  scripting: ['none', 'initial-only', 'enabled'],
  update: ['none', 'slow', 'fast'],
  'color-gamut': ['srgb', 'p3', 'rec2020'],
  'dynamic-range': ['standard', 'high'],
  'video-dynamic-range': ['standard', 'high'],
  'display-mode': ['browser', 'fullscreen', 'minimal-ui', 'picture-in-picture', 'standalone', 'window-controls-overlay'],
  grid: null,
  color: null,
  'color-index': null,
  monochrome: null,
  resolution: null,
  width: null,
  height: null,
  'aspect-ratio': null,
  'device-width': null,
  'device-height': null,
  'device-aspect-ratio': null,
};

/** Reglas @ cuyo bloque lleva declaraciones (no reglas). */
const AT_DECLARACIONES = new Set(['font-face', 'property', 'page', 'counter-style', 'font-palette-values', 'view-transition', 'position-try', 'theme']);

/** Quita comentarios y cadenas conservando los saltos de línea, para dar bien la línea del error. */
function limpiar(css) {
  const blanco = (texto) => texto.replace(/[^\n]/g, ' ');
  return css
    .replace(/\/\*[\s\S]*?\*\//g, blanco)
    .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, (m) => `"${blanco(m.slice(2))}"`);
}

/** Distancia de edición, para sugerir el nombre que seguramente se quiso escribir. */
function distancia(a, b) {
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const arriba = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = arriba;
    }
  }
  return fila[b.length];
}

function parecido(nombre, opciones) {
  const [mejor] = opciones.map((o) => [o, distancia(nombre, o)]).sort((x, y) => x[1] - y[1]);
  return mejor && mejor[1] <= Math.max(3, Math.floor(mejor[0].length / 2)) ? mejor[0] : null;
}

/** Revisa la condición de un @media. */
function revisarMedia(condicion) {
  for (const [, nombre, , valor] of condicion.matchAll(/\(\s*([a-z-]+)\s*(:\s*([a-z0-9-]+))?/gi)) {
    const base = nombre.toLowerCase().replace(/^(min|max)-/, '');
    if (!(base in MEDIA_FEATURES)) {
      const sugerencia = parecido(base, Object.keys(MEDIA_FEATURES));
      return `«${nombre}» no es una condición de @media${sugerencia ? `: ¿querías «${sugerencia}»?` : '.'}`;
    }
    const valores = MEDIA_FEATURES[base];
    if (valores && valor && !valores.includes(valor.toLowerCase())) {
      return `«${nombre}: ${valor}» no es válido: los valores de ${nombre} son ${valores.join(', ')}.`;
    }
  }
  return null;
}

/**
 * @param {string} css
 * @returns {string | null} el primer error de sintaxis, con su línea, o null.
 */
export function cssSyntaxError(css) {
  const texto = limpiar(css);
  const linea = (i) => texto.slice(0, i).split('\n').length;
  const error = (i, mensaje) => `Línea ${linea(i)}: ${mensaje}`;
  const corto = (s) => (s.length > 50 ? `${s.slice(0, 50)}…` : s).replace(/\s+/g, ' ');

  // 'reglas': dentro hay reglas (hoja, @layer, @media…); 'estilo': declaraciones y reglas
  // anidadas; 'declaraciones': solo declaraciones; 'keyframes': from, to, porcentajes.
  const pila = ['reglas'];
  let buffer = '';
  let inicio = 0;
  let parentesis = 0;

  const revisarSentencia = (sentencia, i) => {
    if (!sentencia) return null;
    const contexto = pila.at(-1);
    if (sentencia.startsWith('@')) {
      if (contexto === 'reglas' && !/^@(import|layer|charset|namespace)\b/i.test(sentencia)) {
        return error(i, `«${corto(sentencia)}» necesita un bloque { … }.`);
      }
      return null;
    }
    if (contexto === 'reglas' || contexto === 'keyframes') {
      return error(i, `«${corto(sentencia)}» está fuera de cualquier regla: falta el selector con su { o sobra un «;».`);
    }
    const declaracion = sentencia.match(/^(--[\w-]+|-?[a-z][a-z-]*)\s*:([\s\S]*)$/i);
    if (!declaracion) return error(i, `«${corto(sentencia)}» no es una declaración: se escribe propiedad: valor;`);
    if (!declaracion[2].trim() && !declaracion[1].startsWith('--')) {
      return error(i, `«${declaracion[1]}» no tiene valor.`);
    }
    return null;
  };

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (c === '(') parentesis++;
    else if (c === ')') {
      parentesis--;
      if (parentesis < 0) return error(i, 'Sobra un paréntesis «)».');
    } else if (c === ';' && parentesis === 0) {
      const fallo = revisarSentencia(buffer.trim(), inicio);
      if (fallo) return fallo;
      buffer = '';
      inicio = i + 1;
      continue;
    } else if (c === '{') {
      if (parentesis > 0) return error(i, 'Hay una «{» dentro de un paréntesis: falta cerrar un «)».');
      const preludio = buffer.trim();
      // Los errores del selector o la condición se señalan donde empiezan, no en la «{».
      const pos = inicio + buffer.length - buffer.trimStart().length;
      const contexto = pila.at(-1);
      if (!preludio) return error(i, 'Hay una «{» sin selector delante.');
      if (contexto === 'declaraciones') return error(pos, `«${corto(preludio)} {»: este bloque solo admite declaraciones.`);

      if (preludio.startsWith('@')) {
        const [, nombre = '', resto = ''] = preludio.match(/^@([-\w]+)([\s\S]*)$/) ?? [];
        if (resto.includes('@')) {
          return error(pos, `«${corto(preludio)}»: la condición de un @${nombre} no puede llevar otro «@». Para unir condiciones escribe una sola: @${nombre} (a), (b) { … }.`);
        }
        if (nombre === 'media') {
          const fallo = revisarMedia(resto);
          if (fallo) return error(pos, fallo);
        }
        if (/^(media|supports|container)$/.test(nombre) && !resto.trim()) {
          return error(pos, `@${nombre} necesita una condición antes de la «{».`);
        }
        pila.push(
          /keyframes$/.test(nombre) ? 'keyframes' : AT_DECLARACIONES.has(nombre) ? 'declaraciones' : contexto === 'reglas' ? 'reglas' : 'estilo',
        );
      } else if (contexto === 'keyframes') {
        if (!/^(from|to|\d+(\.\d+)?%)(\s*,\s*(from|to|\d+(\.\d+)?%))*$/i.test(preludio)) {
          return error(pos, `«${corto(preludio)}» no es un paso de @keyframes: usa from, to o un porcentaje.`);
        }
        pila.push('declaraciones');
      } else {
        // En un bloque de estilo, lo anterior a la «{» puede incluir declaraciones sin «;».
        if (/(^|[^:]):\s*$/.test(preludio)) {
          return error(pos, `El selector «${corto(preludio)}» termina en «:»: sobra (¿querías «${corto(preludio.replace(/\s*:+\s*$/, ''))}»?).`);
        }
        if (preludio.includes('@')) return error(pos, `«${corto(preludio)}» no es un selector válido: sobra el «@».`);
        pila.push('estilo');
      }
      buffer = '';
      inicio = i + 1;
      continue;
    } else if (c === '}') {
      if (parentesis > 0) return error(i, 'Hay una «}» dentro de un paréntesis: falta cerrar un «)».');
      const fallo = revisarSentencia(buffer.trim(), inicio);
      if (fallo) return fallo;
      if (pila.length === 1) return error(i, 'Sobra una llave «}».');
      pila.pop();
      buffer = '';
      inicio = i + 1;
      continue;
    }
    buffer += c;
  }

  if (parentesis > 0) return error(texto.length, 'Falta cerrar un paréntesis «)».');
  if (pila.length > 1) {
    const faltan = pila.length - 1;
    return error(texto.length, `Falta${faltan > 1 ? 'n' : ''} ${faltan} llave${faltan > 1 ? 's' : ''} «}» de cierre.`);
  }
  return revisarSentencia(buffer.trim(), inicio);
}
