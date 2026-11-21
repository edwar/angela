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

/** Prefijos de los tokens de angela: leerlos no los convierte en parámetros del componente. */
const TOKENS = /^--(color|space|radius|fs|lh|fw|font|duration|ease|elevation|control|focus|tone|angela|measure)\b/;

/**
 * Propiedades personalizadas pensadas para quien usa el componente (las `--_privadas` no):
 * las que declara y las que solo lee con un valor de reserva, `var(--x, …)`, para que se
 * puedan poner en un contenedor o en :root.
 */
export function readParameters(css) {
  const code = stripComments(css);
  const found = new Map();
  for (const [, name, value] of code.matchAll(/(--[a-z][\w-]*)\s*:\s*([^;}]+)/g)) {
    if (name.startsWith('--_') || found.has(name)) continue;
    found.set(name, value.trim());
  }
  for (const [, name] of code.matchAll(/var\(\s*(--[a-z][\w-]*)\s*,/g)) {
    if (name.startsWith('--_') || TOKENS.test(name) || found.has(name)) continue;
    found.set(name, null);
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
    api.push([name, value == null ? 'Parámetro.' : `Parámetro. Por defecto: ${value}.`]);
  }
  if (/\bdata-slot\b/.test(html)) {
    api.push(['data-slot', 'Marca el elemento que recibe el contenido de dentro.']);
  }
  return api;
}

/* ---------- Escribir el archivo ---------- */

/**
 * Texto como literal de JavaScript: el HTML de varias líneas, con comillas invertidas para
 * que se lea como en el editor; el resto, con comillas dobles.
 */
export function literal(value) {
  const text = String(value);
  if (!text.includes('\n')) return JSON.stringify(text);
  return `\`${text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``;
}

const CABECERA = 'Página de documentación del componente. La genera y la actualiza el laboratorio al\n * proponer cambios; también se puede editar a mano.';

/**
 * Archivo de datos de una página de documentación (`docs/src/data/componentes/<slug>.js`).
 * @param {{ slug: string, title: string, summary: string,
 *   examples: { title: string, note?: string, code: string }[],
 *   api: [string, string][], a11y: string[] }} entry
 */
export function serializeDocsEntry(entry) {
  const ejemplo = (ex) =>
    [
      '    {',
      `      title: ${literal(ex.title)},`,
      ex.note ? `      note: ${literal(ex.note)},` : null,
      `      code: ${literal(ex.code)},`,
      '    },',
    ]
      .filter(Boolean)
      .join('\n');
  return `/**
 * ${entry.title}
 * ${CABECERA}
 */
export default {
  slug: ${literal(entry.slug)},
  title: ${literal(entry.title)},
  summary: ${literal(entry.summary)},
  examples: [
${entry.examples.map(ejemplo).join('\n')}
  ],
  api: [
${entry.api.map(([name, desc]) => `    [${literal(name)}, ${literal(desc)}],`).join('\n')}
  ],
  a11y: [
${entry.a11y.map((nota) => `    ${literal(nota)},`).join('\n')}
  ],
};
`;
}

/**
 * Nombre de un componente como se muestra en la documentación y en el PR: primera letra en
 * mayúscula y el resto en minúscula («carousel» → «Carousel», «Select Personalizable» →
 * «Select personalizable»). Las siglas cortas y lo que lleva números se respetan («Tarjeta 3D»,
 * «Botón CTA»).
 * @param {string} name
 * @returns {string}
 */
export function componentTitle(name) {
  const palabras = name.trim().split(/\s+/).filter(Boolean);
  // Todo en mayúsculas no son siglas: es el nombre escrito en mayúsculas.
  const todoMayusculas = name === name.toLocaleUpperCase('es');
  const sigla = (palabra) => !todoMayusculas && /^.{2,4}$/u.test(palabra) && palabra === palabra.toLocaleUpperCase('es');
  return palabras
    .map((palabra, i) => {
      if (/\d/.test(palabra) || sigla(palabra)) return palabra;
      const minuscula = palabra.toLocaleLowerCase('es');
      return i === 0 ? minuscula.charAt(0).toLocaleUpperCase('es') + minuscula.slice(1) : minuscula;
    })
    .join(' ');
}

/**
 * Archivo de datos de un componente nuevo, listo para `docs/src/data/componentes/<id>.js`.
 *
 * @param {{
 *   id: string, title: string, summary: string,
 *   files: { html: string, css: string, js: string },
 *   a11y?: string[], relatedTo?: string[],
 * }} input
 */
export function buildDocsEntry({ id, title, summary, files, a11y = [], relatedTo = [] }) {
  const notas = a11y.length
    ? a11y
    : ['Pendiente de documentar: repasa el componente con teclado y lector de pantalla y anota aquí lo que haya que saber.'];
  const relacion = relatedTo.length ? `Se usa junto con ${relatedTo.map((otro) => `«${otro}»`).join(' y ')}.` : '';
  const bloques = splitExamples(files.html);
  return serializeDocsEntry({
    slug: id,
    title,
    summary,
    examples: (bloques.length ? bloques : [{ title: 'Ejemplo', code: files.html.trim() }]).map((ex, i) => ({
      ...ex,
      ...(i === 0 && relacion && !ex.note && { note: relacion }),
    })),
    api: buildApi(files.css, files.html),
    a11y: notas,
  });
}

/* ---------- Actualizar la página de un componente que ya existe ---------- */

/**
 * Ejemplos de la pestaña HTML. El laboratorio carga cada ejemplo como «<!-- Título -->» +
 * su código; aquí se deshace el camino. Solo cuentan los comentarios al principio de línea
 * (sin sangría): los de dentro de un ejemplo son parte de su código. «<!-- Título: nota -->»
 * separa el título de una nota. Lo que haya antes del primer comentario es un ejemplo sin título.
 * @returns {{ title: string, note?: string, comment: string, code: string }[]}
 */
export function splitExamples(html) {
  const bloques = [];
  let actual = { title: 'Ejemplo', comment: '', lines: [] };
  const cerrar = () => {
    const code = actual.lines.join('\n').trim();
    if (code) bloques.push({ title: actual.title, ...(actual.note && { note: actual.note }), comment: actual.comment, code });
  };
  for (const linea of (html ?? '').split('\n')) {
    const m = /^<!--\s*(.+?)\s*-->\s*$/.exec(linea);
    if (!m) {
      actual.lines.push(linea);
      continue;
    }
    cerrar();
    const [title, ...resto] = m[1].split(/:\s+/);
    const note = resto.join(': ').trim();
    // La nota empieza en mayúscula, salvo que empiece por código (data-*, --var, <etiqueta>, .clase).
    const codigo = /^[^\s]*[-.<=`:]/.test(note) || /^[.<-]/.test(note);
    const frase = note && (codigo ? note : note[0].toUpperCase() + note.slice(1)) + (/[.!?]$/.test(note) ? '' : '.');
    actual = { title: title.trim(), ...(frase && { note: frase }), comment: m[1], lines: [] };
  }
  cerrar();
  return bloques;
}

/** Lo que el CSS ofrece a quien lo usa: clases, atributos data-* y parámetros. */
export function apiTokens(css) {
  return {
    clases: new Set(readClasses(css)),
    atributos: new Map(readVariants(css)),
    parametros: new Map(readParameters(css)),
  };
}

/** A qué parte del CSS se refiere una fila de la API, o null si no sale del CSS (p. ej. name="grupo"). */
export function rowToken(name) {
  const variable = /--[a-z][\w-]*/.exec(name);
  if (variable) return { tipo: 'parametros', nombre: variable[0] };
  const atributo = /data-[\w-]+/.exec(name);
  if (atributo) return { tipo: 'atributos', nombre: atributo[0] };
  const clase = /\.([a-z][\w-]*)/.exec(name);
  if (clase) return { tipo: 'clases', nombre: clase[1] };
  return null;
}

const igualTitulo = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Pone al día la página de un componente con lo que se propone desde el laboratorio, sin
 * perder lo escrito a mano: los ejemplos se cambian por título (y conservan su nota), la API
 * conserva sus descripciones y solo gana o pierde las filas de lo que el CSS añade o quita, y
 * las notas de accesibilidad son las del diálogo (que se abre con las actuales).
 *
 * @param {{ slug: string, title: string, summary: string,
 *   examples: { title: string, note?: string, code: string }[],
 *   api: [string, string][], a11y: string[] }} existing
 * @param {{ html: string, css: string, oldCss: string, a11y?: string[] }} cambios
 */
export function mergeDocsEntry(existing, { html, css, oldCss, a11y = [] }) {
  const resumen = { ejemplos: { nuevos: [], cambiados: [], quitados: [] }, api: { nuevos: [], quitados: [] } };

  // --- Ejemplos ---
  const bloques = splitExamples(html);
  const usados = new Set();
  const examples = bloques.length
    ? bloques.map((b) => {
        const previo = existing.examples.find(
          (ex) => !usados.has(ex) && (igualTitulo(ex.title, b.comment) || igualTitulo(ex.title, b.title)),
        );
        if (!previo) {
          resumen.ejemplos.nuevos.push(b.title);
          return { title: b.title, ...(b.note && { note: b.note }), code: b.code };
        }
        usados.add(previo);
        if (previo.code.trim() !== b.code) resumen.ejemplos.cambiados.push(previo.title);
        return { ...previo, code: b.code };
      })
    : existing.examples;
  if (bloques.length) {
    resumen.ejemplos.quitados = existing.examples.filter((ex) => !usados.has(ex)).map((ex) => ex.title);
  }

  // --- API ---
  const antes = apiTokens(oldCss ?? '');
  const ahora = apiTokens(css ?? '');
  const api = existing.api.filter(([name]) => {
    const token = rowToken(name);
    // Solo se quita lo que salía del CSS anterior y el nuevo ya no tiene.
    const quitar = token && antes[token.tipo].has(token.nombre) && !ahora[token.tipo].has(token.nombre);
    if (quitar) resumen.api.quitados.push(name);
    return !quitar;
  });
  const cubierto = (tipo, nombre) =>
    api.some(([name]) => {
      const t = rowToken(name);
      return t?.tipo === tipo && t.nombre === nombre;
    });
  const nueva = (name, desc) => {
    api.push([name, desc]);
    resumen.api.nuevos.push(name);
  };
  for (const clase of ahora.clases) {
    if (!antes.clases.has(clase) && !cubierto('clases', clase)) nueva(`.${clase}`, 'Pendiente de describir.');
  }
  for (const [atributo, valores] of ahora.atributos) {
    if (antes.atributos.has(atributo) || cubierto('atributos', atributo)) continue;
    nueva(valores.length ? `${atributo}="${valores.join(' | ')}"` : atributo, 'Pendiente de describir.');
  }
  for (const [parametro, valor] of ahora.parametros) {
    if (antes.parametros.has(parametro) || cubierto('parametros', parametro)) continue;
    nueva(parametro, valor == null ? 'Pendiente de describir.' : `Pendiente de describir. Por defecto: ${valor}.`);
  }

  return {
    entry: { ...existing, examples, api, a11y: a11y.length ? a11y : existing.a11y },
    resumen,
  };
}
