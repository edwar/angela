/**
 * Genera la página de documentación de un componente aportado.
 *
 * Antes, el pull request traía el CSS pero nadie escribía la entrada del catálogo, así que
 * el componente quedaba en la librería sin aparecer en la web. Ahora el propio laboratorio
 * escribe `docs/src/data/componentes/<id>.js`, que el catálogo carga solo.
 *
 * Lo que se puede leer del código se lee (clases, parámetros, variantes); lo que no, se
 * pregunta en el diálogo o se deja escrito como pendiente, nunca inventado.
 */

/** Quita comentarios para no confundir los ejemplos con código real. */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, ' ');

/** Clases públicas que define el CSS, en el orden en que aparecen. */
export function readClasses(css) {
  const found = new Set();
  // (?<![\w-]) deja fuera el nombre de la capa en «@layer angela.components {».
  for (const [, name] of stripComments(css).matchAll(/(?<![\w-])\.([a-z][\w-]*)(?=[^{};]*\{)/g)) found.add(name);
  return [...found];
}

/** Propiedades personalizadas pensadas para quien usa el componente (las `--_privadas` no). */
export function readParameters(css) {
  const found = new Map();
  for (const [, name, value] of stripComments(css).matchAll(/(--[a-z][\w-]*)\s*:\s*([^;}]+)/g)) {
    if (name.startsWith('--_') || found.has(name)) continue;
    found.set(name, value.trim());
  }
  return [...found];
}

/** Variantes: los valores de data-* que el CSS distingue. */
export function readVariants(css) {
  const found = new Map();
  for (const [, attr, value] of stripComments(css).matchAll(/\[data-([\w-]+)(?:\s*=\s*["']([^"']*)["'])?\]/g)) {
    const key = `data-${attr}`;
    if (!found.has(key)) found.set(key, new Set());
    if (value) found.get(key).add(value);
  }
  return [...found].map(([attr, values]) => [attr, [...values]]);
}

/**
 * Tabla de API a partir del código, con la misma forma que el resto del catálogo:
 * pares [nombre, explicación].
 */
export function buildApi(css, html) {
  const api = [];
  for (const name of readClasses(css)) api.push([`.${name}`, 'Clase del componente.']);
  for (const [attr, values] of readVariants(css)) {
    api.push([attr, values.length ? values.join(' · ') : 'Atributo sin valor (presente o ausente).']);
  }
  for (const [name, value] of readParameters(css)) {
    api.push([name, `Parámetro. Por defecto: ${value}.`]);
  }
  if (/\bdata-slot\b/.test(html)) {
    api.push(['data-slot', 'Marca el elemento que recibe el contenido de dentro.']);
  }
  return api;
}

/** Deja el texto listo para ir dentro de una cadena de JavaScript. */
const literal = (value) => JSON.stringify(value);

/**
 * Archivo de datos del componente, listo para `docs/src/data/componentes/<id>.js`.
 *
 * @param {{
 *   id: string, title: string, summary: string,
 *   files: { html: string, css: string, js: string },
 *   a11y?: string[], relatedTo?: string[],
 * }} input
 */
export function buildDocsEntry({ id, title, summary, files, a11y = [], relatedTo = [] }) {
  const api = buildApi(files.css, files.html);
  const notas = a11y.length
    ? a11y
    : ['Pendiente de documentar: repasa el componente con teclado y lector de pantalla y anota aquí lo que haya que saber.'];

  const relacion = relatedTo.length
    ? `Se usa junto con ${relatedTo.map((otro) => `«${otro}»`).join(' y ')}.`
    : '';

  return `/**
 * ${title}
 * Generado desde el laboratorio al proponer el componente. Edítalo con libertad:
 * añade ejemplos, afina la tabla de API y completa las notas de accesibilidad.
 */
export default {
  slug: ${literal(id)},
  title: ${literal(title)},
  summary: ${literal(summary)},
  examples: [
    {
      title: 'Ejemplo',${relacion ? `\n      note: ${literal(relacion)},` : ''}
      code: ${literal(files.html.trim())},
    },
  ],
  api: [
${api.map(([name, desc]) => `    [${literal(name)}, ${literal(desc)}],`).join('\n')}
  ],
  a11y: [
${notas.map((nota) => `    ${literal(nota)},`).join('\n')}
  ],
};
`;
}
