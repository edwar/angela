/**
 * Revisión automática de un componente del laboratorio contra las reglas de angela
 * (AGENTS.md y DESIGN.md). Es una ayuda para quien quiere aportar, no un juez: avisa
 * de lo que casi siempre está mal, pero el repaso con teclado y lector de pantalla
 * sigue siendo obligatorio.
 *
 * Cada regla devuelve null si está bien, o un texto explicando qué falta.
 *  - level 'error': incumple una regla del proyecto; corrígelo antes de proponerlo.
 *  - level 'warn':  probablemente sobra o falta algo; revísalo y decide.
 */

import { findEntryFunction } from './js-entry.js';

/** Quita comentarios y cadenas para no dar falsos positivos con el texto de ejemplo. */
const stripCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/"[^"]*"|'[^']*'/g, '""');
const stripHtml = (html) => html.replace(/<!--[\s\S]*?-->/g, ' ');
const stripJs = (js) => js.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');

/** Declaraciones del CSS como pares [propiedad, valor], ya sin comentarios. */
function declarations(css) {
  return [...stripCss(css).matchAll(/([-a-z]+)\s*:\s*([^;{}]+)/gi)].map(([, prop, value]) => [
    prop.toLowerCase(),
    value.trim(),
  ]);
}

const CSS_RULES = [
  {
    id: 'capa',
    level: 'error',
    check(css) {
      if (!css.trim()) return null;
      return /@layer\s+angela\.(components|utilities)\b/.test(css)
        ? null
        : 'Envuelve el CSS en @layer angela.components, para que el CSS de quien lo use siempre gane.';
    },
  },
  {
    id: 'colores',
    level: 'error',
    check(css) {
      const sueltos = declarations(css)
        .filter(([prop, value]) => /color|background|border|shadow|outline|fill|stroke/.test(prop))
        .filter(([, value]) => /#[0-9a-f]{3,8}\b|\b(rgb|rgba|hsl|hsla|oklch|lab|color-mix)\s*\(/i.test(value))
        .filter(([, value]) => !/^\s*(currentColor|transparent|inherit|none|initial)\s*$/i.test(value));
      return sueltos.length
        ? `Usa tokens en vez de colores sueltos (${sueltos[0][0]}: ${sueltos[0][1].slice(0, 40)}). El color debe salir de var(--color-…) o var(--tone-…).`
        : null;
    },
  },
  {
    id: 'defectos',
    level: 'warn',
    check(css) {
      if (!css.trim()) return null;
      return /:where\s*\(/.test(css)
        ? null
        : 'Declara los valores por defecto dentro de :where() (especificidad 0), para que data-* y el CSS de quien lo use puedan sobrescribirlos.';
    },
  },
  {
    id: 'logicas',
    level: 'warn',
    check(css) {
      const fisicas = declarations(css)
        .map(([prop]) => prop)
        .filter((prop) =>
          /^(margin|padding)-(left|right)$|^(border-(left|right))|^(left|right)$|^(width|height|min-width|max-width|min-height|max-height)$/.test(
            prop,
          ),
        );
      return fisicas.length
        ? `Usa propiedades lógicas para que funcione en árabe o hebreo: ${fisicas[0]} → su equivalente inline/block (p. ej. inline-size, padding-inline-start).`
        : null;
    },
  },
  {
    id: 'importante',
    level: 'error',
    check: (css) => (/!important/.test(stripCss(css)) ? 'Quita !important: las capas de angela ya resuelven la cascada.' : null),
  },
  {
    id: 'medidas',
    level: 'warn',
    check(css) {
      const duros = declarations(css)
        .filter(([prop]) => /^(gap|padding|margin|border-radius|row-gap|column-gap)/.test(prop))
        .filter(([, value]) => /\b\d+(\.\d+)?(px|rem)\b/.test(value) && !/var\(/.test(value))
        .filter(([, value]) => !/^\s*0/.test(value));
      return duros.length
        ? `Usa los tokens de espacio y radio en vez de medidas sueltas (${duros[0][0]}: ${duros[0][1].slice(0, 30)} → var(--space-…) o var(--radius-…)).`
        : null;
    },
  },
  {
    id: 'movimiento',
    level: 'error',
    check(css) {
      const limpio = stripCss(css);
      const mueve = /transform\s*:\s*[^;]*\b(translate|rotate|scale|perspective)/i.test(limpio) || /@keyframes/.test(limpio);
      if (!mueve) return null;
      return /prefers-reduced-motion/.test(limpio)
        ? null
        : 'Hay desplazamientos o animaciones: enciérralos en @media (prefers-reduced-motion: no-preference).';
    },
  },
  {
    id: 'foco',
    level: 'warn',
    check(css, { html }) {
      const interactivo = /<(button|a|input|select|textarea|summary)\b/i.test(stripHtml(html));
      if (!interactivo || !css.trim()) return null;
      const pinta = /outline|border-color|box-shadow|background/.test(stripCss(css));
      if (!pinta) return null;
      return /:focus-visible/.test(stripCss(css))
        ? null
        : 'Si cambias los estilos de algo que se puede enfocar, define también :focus-visible con un anillo de 2 px.';
    },
  },
  {
    id: 'contraste-forzado',
    level: 'warn',
    check(css) {
      const limpio = stripCss(css);
      if (!/box-shadow/.test(limpio) || /forced-colors/.test(limpio)) return null;
      return 'Usas sombras para destacar: en modo de colores forzados desaparecen. Añade un borde, o un bloque @media (forced-colors: active).';
    },
  },
];

const HTML_RULES = [
  {
    id: 'icono-solo',
    level: 'error',
    check(html) {
      const botones = [...stripHtml(html).matchAll(/<(button|a)\b[^>]*>/gi)];
      const malo = botones.find((m) => /data-icon-only/.test(m[0]) && !/aria-label|aria-labelledby/.test(m[0]));
      return malo ? 'Un botón de solo ícono necesita aria-label que diga qué hace.' : null;
    },
  },
  {
    id: 'alt',
    level: 'error',
    check(html) {
      const sinAlt = [...stripHtml(html).matchAll(/<img\b[^>]*>/gi)].find((m) => !/\salt\s*=/.test(m[0]));
      return sinAlt ? 'Toda <img> necesita alt (vacío, alt="", si es decorativa).' : null;
    },
  },
  {
    id: 'tipo-boton',
    level: 'warn',
    check(html) {
      const sinTipo = [...stripHtml(html).matchAll(/<button\b[^>]*>/gi)].find((m) => !/\stype\s*=/.test(m[0]));
      return sinTipo ? 'Pon type="button" en los botones que no envían un formulario (si no, envían).' : null;
    },
  },
  {
    id: 'eventos-en-linea',
    level: 'error',
    check: (html) =>
      /<[a-z][^>]*\son[a-z]+\s*=/i.test(stripHtml(html))
        ? 'Quita los manejadores en línea (onclick, onerror…): el comportamiento va en la pestaña de JavaScript.'
        : null,
  },
  {
    id: 'tabindex',
    level: 'error',
    check: (html) =>
      /tabindex\s*=\s*["']?[1-9]/.test(stripHtml(html)) ? 'Nada de tabindex positivo: rompe el orden de tabulación de la página.' : null,
  },
  {
    id: 'estilo-en-linea',
    level: 'warn',
    check(html) {
      const estilos = [...stripHtml(html).matchAll(/style\s*=\s*["']([^"']*)["']/gi)];
      const malo = estilos.find(([, value]) => !/^\s*--/.test(value.trim()));
      return malo
        ? `En style= solo deberían ir variables (--algo: …). Lleva «${malo[1].slice(0, 30)}» al CSS del componente.`
        : null;
    },
  },
  {
    id: 'hueco',
    level: 'warn',
    check(html) {
      const marcas = (stripHtml(html).match(/\bdata-slot\b/g) ?? []).length;
      return marcas > 1 ? 'Hay varios data-slot: solo se usa el primero. Deja uno por componente.' : null;
    },
  },
];

const JS_RULES = [
  {
    id: 'activacion',
    level: 'error',
    check(js) {
      if (!stripJs(js).trim()) return null;
      return findEntryFunction(js)
        ? null
        : 'Exporta una función de activación (export function enhanceNombre(root = globalThis.document) { …; return limpieza; }): es la que angela() llama en la web. Sin ella, el módulo se sube pero no se ejecuta nunca.';
    },
  },
  {
    id: 'ssr',
    level: 'warn',
    check(js) {
      const limpio = stripJs(js);
      if (!limpio.trim()) return null;
      // root = document como valor por defecto se evalúa antes que cualquier guarda: en el servidor lanza.
      if (/[({,]\s*[\w$]+\s*=\s*document\s*[,)}]/.test(limpio)) {
        return 'No uses document como valor por defecto (root = document): se evalúa antes que la guarda y en el servidor lanza ReferenceError. Usa root = globalThis.document y comprueba !root en la guarda.';
      }
      const usaDom = /\b(document|window|navigator)\b/.test(limpio);
      if (!usaDom) return null;
      return /typeof window|typeof document/.test(limpio)
        ? null
        : 'Protege el acceso al DOM con una guarda (if (typeof window === "undefined") return;): el JS de angela debe ser seguro en el servidor.';
    },
  },
  {
    id: 'limpieza',
    level: 'warn',
    check(js) {
      const limpio = stripJs(js);
      if (!/addEventListener|setInterval|MutationObserver/.test(limpio)) return null;
      return /return\s*\(?\s*\)?\s*=>|removeEventListener|disconnect\(/.test(limpio)
        ? null
        : 'Escuchas eventos: exporta una función que devuelva su limpieza (removeEventListener, disconnect…), como el resto de angela.';
    },
  },
  {
    id: 'delegacion',
    level: 'error',
    check(js) {
      const limpio = stripJs(js);
      // Un MutationObserver o un custom element ya alcanzan a lo que se monte después.
      if (/MutationObserver|customElements\.define|extends\s+HTMLElement/.test(limpio)) return null;
      if (!/querySelector(All)?\s*\(|getElementBy|getElementsBy/.test(limpio)) return null;
      // Escuchar en la raíz es delegar; en cualquier otra cosa, es escuchar elemento a elemento.
      const raices = new Set(['root', 'document', 'window', 'globalThis', 'self', 'this']);
      const objetivos = [...limpio.matchAll(/([\w$.]+?)\s*\.addEventListener\s*\(/g)].map((m) => m[1]);
      const sueltos = objetivos.filter((o) => !raices.has(o) && !/^(document|window)\./.test(o));
      return sueltos.length
        ? `Escuchas sobre elementos que buscaste al arrancar (${[...new Set(sueltos)].join(', ')}.addEventListener): solo alcanza a los que ya existen, y los frameworks montan nodos después. Escucha en la raíz y encuentra el elemento con event.target.closest('.componente'), o usa un MutationObserver.`
        : null;
    },
  },
];

/**
 * Revisa un componente.
 * @param {{ html: string, css: string, js: string }} files
 * @returns {{ level: 'error' | 'warn', id: string, text: string }[]}
 */
export function reviewComponent({ html, css, js }) {
  const hallazgos = [];
  for (const rule of CSS_RULES) {
    const text = rule.check(css, { html, js });
    if (text) hallazgos.push({ level: rule.level, id: rule.id, text });
  }
  for (const rule of HTML_RULES) {
    const text = rule.check(html, { css, js });
    if (text) hallazgos.push({ level: rule.level, id: rule.id, text });
  }
  for (const rule of JS_RULES) {
    const text = rule.check(js, { html, css });
    if (text) hallazgos.push({ level: rule.level, id: rule.id, text });
  }
  // Primero lo que hay que corregir.
  return hallazgos.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1));
}

/** Lo que no se puede comprobar con código y hay que mirar a mano antes de proponer. */
export const MANUAL_CHECKS = [
  'Recórrelo entero con el teclado: todo se alcanza con Tab y se ve dónde está el foco.',
  'Pruébalo con un lector de pantalla (VoiceOver con Cmd+F5): cada control dice qué es y qué hace.',
  'Míralo en claro y en oscuro, y con el zoom al 200 %.',
  'Compruébalo a 320 px de ancho: sin scroll horizontal.',
  'El estado nunca se entiende solo por el color: hay texto, ícono o forma.',
];
