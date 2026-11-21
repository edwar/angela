/**
 * El código de un ejemplo en cada framework, a partir de su HTML.
 *
 * El marcado es el mismo en todos (elementos nativos con class y data-*); lo que cambia es el
 * archivo que lo envuelve y lo que cada sintaxis obliga a escribir distinto:
 * - React / Next.js: JSX (className, htmlFor, style como objeto, defaultValue…).
 * - Astro: las llaves del texto son expresiones; se escapan.
 * - Angular: «@» abre un bloque (@if…) y las llaves son ICU; se escapan. Si un ejemplo usa un
 *   elemento con guion (un custom element ajeno; angela no define ninguno), CUSTOM_ELEMENTS_SCHEMA.
 * - Vue: la plantilla es HTML tal cual.
 */

const VACIOS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const TEXTO_CRUDO = new Set(['script', 'style', 'textarea']);

/**
 * @typedef {{ tipo: 'texto', valor: string }
 *   | { tipo: 'comentario', valor: string }
 *   | { tipo: 'elemento', nombre: string, atributos: [string, string | null][], hijos: Nodo[], cerrado: boolean }} Nodo
 */

/**
 * Árbol mínimo del HTML de un ejemplo. Conserva el texto tal cual (espacios y saltos de línea),
 * así al escribirlo de nuevo se mantiene el formato original.
 * @param {string} html
 * @returns {Nodo[]}
 */
export function parseHtml(html) {
  const raiz = { hijos: [] };
  const pila = [raiz];
  const actual = () => pila[pila.length - 1];
  const ATRIBUTO = /\s*([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/y;
  let i = 0;
  while (i < html.length) {
    if (html.startsWith('<!--', i)) {
      const fin = html.indexOf('-->', i + 4);
      const cierre = fin === -1 ? html.length : fin;
      actual().hijos.push({ tipo: 'comentario', valor: html.slice(i + 4, cierre) });
      i = cierre + 3;
      continue;
    }
    const cierreEtiqueta = /^<\/([a-zA-Z][\w:-]*)\s*>/.exec(html.slice(i));
    if (cierreEtiqueta) {
      const nombre = cierreEtiqueta[1];
      const indice = pila.findLastIndex((n) => n.nombre === nombre);
      if (indice > 0) pila.length = indice;
      i += cierreEtiqueta[0].length;
      continue;
    }
    const apertura = /^<([a-zA-Z][\w:-]*)/.exec(html.slice(i));
    if (apertura) {
      const nombre = apertura[1];
      const atributos = [];
      // Al fallar, una regex con /y vuelve a lastIndex 0: la posición se lleva aparte.
      let j = i + apertura[0].length;
      for (;;) {
        ATRIBUTO.lastIndex = j;
        const m = ATRIBUTO.exec(html);
        if (!m) break;
        atributos.push([m[1], m[2] ?? m[3] ?? m[4] ?? null]);
        j = ATRIBUTO.lastIndex;
      }
      while (j < html.length && /\s/.test(html[j])) j++;
      const autocierre = html.startsWith('/>', j);
      j += autocierre ? 2 : 1;
      const minuscula = nombre.toLowerCase();
      const nodo = { tipo: 'elemento', nombre, atributos, hijos: [], cerrado: autocierre || VACIOS.has(minuscula) };
      actual().hijos.push(nodo);
      if (!nodo.cerrado && TEXTO_CRUDO.has(minuscula)) {
        const fin = html.toLowerCase().indexOf(`</${minuscula}`, j);
        const hasta = fin === -1 ? html.length : fin;
        if (hasta > j) nodo.hijos.push({ tipo: 'texto', valor: html.slice(j, hasta) });
        j = fin === -1 ? html.length : html.indexOf('>', fin) + 1;
      } else if (!nodo.cerrado) {
        pila.push(nodo);
      }
      i = j;
      continue;
    }
    const siguiente = html.indexOf('<', i + 1);
    const hasta = siguiente === -1 ? html.length : siguiente;
    actual().hijos.push({ tipo: 'texto', valor: html.slice(i, hasta) });
    i = hasta;
  }
  return raiz.hijos;
}

/* ---------- HTML (Astro, Vue y Angular parten de aquí) ---------- */

/**
 * @param {Nodo[]} nodos
 * @param {{ texto?: (t: string) => string, valor?: (v: string) => string }} [escapar]
 */
function escribirHtml(nodos, escapar = {}) {
  const texto = escapar.texto ?? ((t) => t);
  const valor = escapar.valor ?? ((v) => v);
  return nodos
    .map((n) => {
      if (n.tipo === 'texto') return texto(n.valor);
      if (n.tipo === 'comentario') return `<!--${n.valor}-->`;
      const atributos = n.atributos.map(([k, v]) => (v === null ? ` ${k}` : ` ${k}="${valor(v)}"`)).join('');
      if (n.cerrado) return VACIOS.has(n.nombre.toLowerCase()) ? `<${n.nombre}${atributos}>` : `<${n.nombre}${atributos} />`;
      const crudo = TEXTO_CRUDO.has(n.nombre.toLowerCase());
      const dentro = crudo ? n.hijos.map((h) => h.valor).join('') : escribirHtml(n.hijos, escapar);
      return `<${n.nombre}${atributos}>${dentro}</${n.nombre}>`;
    })
    .join('');
}

/* ---------- JSX (React y Next.js) ---------- */

const PROPIEDADES_JSX = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  autocomplete: 'autoComplete',
  autocapitalize: 'autoCapitalize',
  autocorrect: 'autoCorrect',
  autofocus: 'autoFocus',
  spellcheck: 'spellCheck',
  novalidate: 'noValidate',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  enterkeyhint: 'enterKeyHint',
  inputmode: 'inputMode',
  srcset: 'srcSet',
  datetime: 'dateTime',
  contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin',
  accesskey: 'accessKey',
  fetchpriority: 'fetchPriority',
  popovertarget: 'popoverTarget',
  popovertargetaction: 'popoverTargetAction',
  formaction: 'formAction',
  formmethod: 'formMethod',
  formnovalidate: 'formNoValidate',
  'accept-charset': 'acceptCharset',
  'http-equiv': 'httpEquiv',
};

/** Atributos booleanos que React conoce: sin valor, basta el nombre. */
const BOOLEANOS_JSX = new Set([
  'disabled', 'required', 'hidden', 'open', 'multiple', 'readOnly', 'autoFocus', 'noValidate', 'inert',
  'defaultChecked', 'checked', 'selected', 'async', 'defer', 'controls', 'loop', 'muted', 'playsInline',
  'autoPlay', 'reversed', 'formNoValidate', 'allowFullScreen', 'itemScope',
]);

/** Propiedades que los tipos de React piden como número. */
const NUMERICOS_JSX = new Set(['tabIndex', 'minLength', 'maxLength', 'colSpan', 'rowSpan', 'size', 'rows', 'cols', 'span', 'start', 'low', 'high', 'optimum']);

/** stroke-width → strokeWidth; los aria-*, data-* y las variables CSS se quedan igual. */
const camel = (nombre) => nombre.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function nombreJsx(nombre, elemento) {
  const bajo = nombre.toLowerCase();
  if (PROPIEDADES_JSX[bajo]) return PROPIEDADES_JSX[bajo];
  if (/^(aria|data)-/.test(bajo) || elemento.includes('-')) return nombre;
  // En SVG, los atributos con guion van en camelCase (stroke-width → strokeWidth); xlink:href → xlinkHref.
  if (/^[a-z]+(-[a-z]+)+$/.test(bajo)) return camel(bajo);
  if (bajo.includes(':')) return camel(bajo.replace(':', '-'));
  return nombre;
}

const cadena = (v) => `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;

/** style="margin-block: 1rem; --x: 2" → {{ marginBlock: '1rem', '--x': '2' }} */
function estiloJsx(css) {
  const pares = css
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const dos = d.indexOf(':');
      const prop = d.slice(0, dos).trim();
      const val = d.slice(dos + 1).trim();
      const clave = prop.startsWith('--') ? cadena(prop) : camel(prop.replace(/^-(webkit|moz|ms)-/, (_, p) => `${p[0].toUpperCase()}${p.slice(1)}-`));
      return `${clave}: ${cadena(val)}`;
    });
  // Las variables CSS no están en los tipos de React: el proyecto las escribe con «as CSSProperties».
  const conVariables = css.split(';').some((d) => d.trim().startsWith('--'));
  return conVariables ? `{{ ${pares.join(', ')} } as CSSProperties}` : `{{ ${pares.join(', ')} }}`;
}

/** El texto de JSX: las llaves y «>» rompen la sintaxis. */
const textoJsx = (t) => t.replace(/[{}]/g, (c) => `{'${c}'}`).replace(/>/g, '&gt;');

/**
 * Atributos de un elemento en JSX. value/checked de los campos pasan a defaultValue/defaultChecked
 * (sin estado de React, como en HTML), y la <option selected> de un <select> pasa a su defaultValue.
 */
function atributosJsx(n) {
  const elemento = n.nombre.toLowerCase();
  const lista = [];
  for (const [k, v] of n.atributos) {
    let nombre = nombreJsx(k, elemento);
    if (elemento === 'option' && nombre === 'selected') continue;
    if (['input', 'textarea', 'select'].includes(elemento) && nombre === 'value') nombre = 'defaultValue';
    if (elemento === 'input' && nombre === 'checked') nombre = 'defaultChecked';
    // React escribe hidden="until-found" como hidden=""; enhanceTabs lo pone al preparar.
    if (nombre === 'hidden') {
      lista.push(' hidden');
      continue;
    }
    if (nombre === 'style' && v !== null) {
      lista.push(` style=${estiloJsx(v)}`);
      continue;
    }
    if (v === null) {
      // Un booleano que React no conoce (switch, popover, focusgroupstart…) necesita ="" para llegar al DOM.
      lista.push(BOOLEANOS_JSX.has(nombre) ? ` ${nombre}` : ` ${nombre}=""`);
      continue;
    }
    // Los tipos de React piden número en estos: minLength={8}, no minLength="8".
    if (NUMERICOS_JSX.has(nombre) && /^-?\d+(\.\d+)?$/.test(v)) {
      lista.push(` ${nombre}={${v}}`);
      continue;
    }
    lista.push(v.includes('"') ? ` ${nombre}={${cadena(v)}}` : ` ${nombre}="${v}"`);
  }
  if (elemento === 'select') {
    const opciones = [];
    const recorrer = (hijos) =>
      hijos.forEach((h) => {
        if (h.tipo !== 'elemento') return;
        if (h.nombre.toLowerCase() === 'option') opciones.push(h);
        else recorrer(h.hijos);
      });
    recorrer(n.hijos);
    const elegida = opciones.find((o) => o.atributos.some(([k]) => k.toLowerCase() === 'selected'));
    if (elegida && !n.atributos.some(([k]) => k.toLowerCase() === 'value')) {
      const valor = elegida.atributos.find(([k]) => k.toLowerCase() === 'value')?.[1] ?? textoPlano(elegida).trim();
      lista.push(` defaultValue="${valor}"`);
    }
  }
  return lista.join('');
}

const textoPlano = (n) => (n.tipo === 'texto' ? n.valor : n.tipo === 'elemento' ? n.hijos.map(textoPlano).join('') : '');

/**
 * Escribe nodos en JSX. JSX descarta el espacio de los saltos de línea; si un texto con contenido
 * queda junto a un elemento en otra línea, el espacio que HTML pintaría se escribe con {' '}.
 */
function escribirJsx(nodos) {
  return nodos
    .map((n, i) => {
      if (n.tipo === 'comentario') return `{/*${n.valor.replace(/\*\//g, '* /')}*/}`;
      if (n.tipo === 'texto') {
        let t = textoJsx(n.valor);
        if (!n.valor.trim()) return t;
        const antes = nodos[i - 1]?.tipo === 'elemento';
        const despues = nodos[i + 1]?.tipo === 'elemento';
        if (antes && /^\s*\n/.test(n.valor)) t = t.replace(/^(\s*\n)(\s*)/, `{' '}$1$2`);
        if (despues && /\n\s*$/.test(n.valor)) t = t.replace(/(\s*\n\s*)$/, `{' '}$1`);
        return t;
      }
      const atributos = atributosJsx(n);
      const elemento = n.nombre.toLowerCase();
      if (elemento === 'textarea') {
        const contenido = textoPlano(n);
        return `<${n.nombre}${atributos}${contenido ? ` defaultValue=${cadena(contenido)}` : ''} />`;
      }
      if (n.cerrado || !n.hijos.length) return `<${n.nombre}${atributos} />`;
      return `<${n.nombre}${atributos}>${escribirJsx(n.hijos)}</${n.nombre}>`;
    })
    .join('');
}

/** JSX con una sola raíz: si hay varias (o comentarios fuera), van en un fragmento. */
export function htmlAJsx(html) {
  const nodos = parseHtml(html.trim());
  const raices = nodos.filter((n) => n.tipo !== 'texto' || n.valor.trim());
  const jsx = escribirJsx(nodos);
  return raices.length === 1 && raices[0].tipo === 'elemento' ? jsx : `<>\n${sangrar(jsx, 2)}\n</>`;
}

/* ---------- Escapes de Astro y Angular ---------- */

/** Astro: en el texto, { y } abren una expresión. */
export const htmlAAstro = (html) =>
  escribirHtml(parseHtml(html.trim()), { texto: (t) => t.replace(/[{}]/g, (c) => `{'${c}'}`) });

/** Angular: en el texto, «@» abre un bloque y las llaves son ICU; en los atributos, {{ }} interpola. */
export const htmlAAngular = (html) =>
  escribirHtml(parseHtml(html.trim()), {
    texto: (t) => t.replace(/@/g, '&#64;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;'),
    valor: (v) => v.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;'),
  });

/* ---------- Archivos de cada framework ---------- */

const sangrar = (texto, espacios) =>
  texto
    .split('\n')
    .map((l) => (l.trim() ? ' '.repeat(espacios) + l : l))
    .join('\n');

/** «Con ícono y solo ícono» → «ConIconoYSoloIcono»; para el nombre del componente y del archivo. */
export function nombreComponente(titulo) {
  const partes = (titulo ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase());
  const nombre = partes.join('');
  return !nombre ? 'Ejemplo' : /^\d/.test(nombre) ? `Ejemplo${nombre}` : nombre;
}

const kebab = (pascal) => pascal.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** Una plantilla dentro de `…` de TypeScript: escapa la barra, la comilla invertida y ${. */
const plantillaTs = (t) => t.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

/** Frameworks de las pestañas de los ejemplos, en orden. */
export const FRAMEWORKS_EJEMPLO = [
  { id: 'html', nombre: 'HTML' },
  { id: 'astro', nombre: 'Astro' },
  { id: 'react', nombre: 'React' },
  { id: 'next', nombre: 'Next.js' },
  { id: 'vue', nombre: 'Vue' },
  { id: 'angular', nombre: 'Angular' },
];

/**
 * @param {string} html  el marcado del ejemplo
 * @param {string} [titulo]  da nombre al componente y al archivo
 * @returns {{ id: string, nombre: string, archivo: string, lenguaje: string, codigo: string }[]}
 */
export function codigoPorFramework(html, titulo) {
  const Nombre = nombreComponente(titulo);
  const archivo = kebab(Nombre);
  const limpio = html.trim();
  const jsx = htmlAJsx(limpio);
  const angular = htmlAAngular(limpio);
  const personalizados = parseHtml(limpio).some(function tieneGuion(n) {
    return n.tipo === 'elemento' && (n.nombre.includes('-') || n.hijos.some(tieneGuion));
  });
  const retorno = (cuerpo) => `return (\n${sangrar(cuerpo, 4)}\n  );`;
  const importaTipos = jsx.includes(' as CSSProperties}') ? "import type { CSSProperties } from 'react';\n\n" : '';

  return [
    { id: 'html', nombre: 'HTML', archivo: 'index.html', lenguaje: 'html', codigo: limpio },
    { id: 'astro', nombre: 'Astro', archivo: `src/components/${Nombre}.astro`, lenguaje: 'astro', codigo: htmlAAstro(limpio) },
    {
      id: 'react',
      nombre: 'React',
      archivo: `src/components/${Nombre}.tsx`,
      lenguaje: 'tsx',
      codigo: `${importaTipos}export function ${Nombre}() {\n  ${retorno(jsx)}\n}`,
    },
    {
      id: 'next',
      nombre: 'Next.js',
      archivo: `app/components/${archivo}.tsx`,
      lenguaje: 'tsx',
      codigo: `${importaTipos}// Server Component: sin 'use client'. El comportamiento lo pone <Angela /> del layout.\nexport function ${Nombre}() {\n  ${retorno(jsx)}\n}`,
    },
    {
      id: 'vue',
      nombre: 'Vue',
      archivo: `src/components/${Nombre}.vue`,
      lenguaje: 'vue',
      codigo: `<template>\n${sangrar(limpio, 2)}\n</template>`,
    },
    {
      id: 'angular',
      nombre: 'Angular',
      archivo: `src/app/${archivo}.ts`,
      lenguaje: 'ts',
      codigo: [
        `import { ${personalizados ? 'Component, CUSTOM_ELEMENTS_SCHEMA' : 'Component'} } from '@angular/core';`,
        '',
        '@Component({',
        `  selector: 'app-${archivo}',`,
        personalizados ? '  schemas: [CUSTOM_ELEMENTS_SCHEMA],' : null,
        '  template: `',
        sangrar(plantillaTs(angular), 4),
        '  `,',
        '})',
        `export class ${Nombre} {}`,
      ]
        .filter((l) => l !== null)
        .join('\n'),
    },
  ];
}
