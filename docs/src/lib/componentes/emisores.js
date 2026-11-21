/**
 * Escribe un componente (ir.js) en cada framework, en TypeScript o JavaScript, y su ejemplo de uso.
 *
 * Cada emisor devuelve { componente: { archivo, lenguaje, codigo }, uso: { archivo, lenguaje, codigo } }.
 * El componente lo pinta igual en todos: lo comprueban los tests renderizando React, Vue y JS.
 */
import { htmlAJsx } from '../codigo-frameworks.js';
import { camel, kebab, rasgos } from './ir.js';

/* ---------- Ayudantes comunes ---------- */

const VACIOS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const cadena = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
/** Un valor de JS escrito a mano: 'texto', 3, true, ['a', 'b']. */
export const literal = (v) => (Array.isArray(v) ? `[${v.map(literal).join(', ')}]` : typeof v === 'string' ? cadena(v) : String(v));
const sangrar = (texto, n) =>
  texto
    .split('\n')
    .map((l) => (l.trim() ? ' '.repeat(n) + l : l))
    .join('\n');
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function tipoTs(p) {
  if (p.tipo === 'opciones') return p.valores.filter(Boolean).map(cadena).join(' | ');
  if (p.tipo === 'booleano') return 'boolean';
  if (p.tipo === 'numero') return 'number';
  if (p.tipo === 'lista') return 'string[]';
  return 'string';
}
/** Para JSDoc, igual que en TypeScript. */
const tipoJsDoc = tipoTs;

/** ¿Es un nodo que va en línea con su padre (texto)? */
const enLinea = (n) => ['lit', 'texto', 'slot', 'item', 'unir'].includes(n.tipo);

/**
 * Expresiones de JS para atributos (React, Astro, Vue y JS sin framework).
 * acc(nombre) da cómo se lee una prop; idBase, cómo se lee el id de la instancia.
 */
function expresion(v, { acc, idBase = 'id', nulo = 'undefined', concatenar = false }) {
  const idCon = (suf) => (!suf ? idBase : concatenar ? `${idBase} + ${cadena(suf)}` : `\`\${${idBase}}${suf}\``);
  const cond = (lista) => lista.map((n) => (n.startsWith('!') ? `!${acc(n.slice(1))}` : acc(n))).join(' && ');
  switch (v.tipo) {
    case 'prop':
      // Un texto vacío es «sin valor»: no se escribe el atributo (name="" no sirve de nada).
      return v.omitir === undefined ? `${acc(v.nombre)} || ${nulo}` : `${acc(v.nombre)} === ${literal(v.omitir)} ? ${nulo} : ${acc(v.nombre)}`;
    case 'bandera':
      return `${acc(v.nombre)} ? '' : ${nulo}`;
    case 'booleano':
      return acc(v.nombre);
    case 'segunProp':
      return `${acc(v.nombre)} ? ${cadena(v.siVerdadero)} : ${v.siFalso === undefined ? nulo : cadena(v.siFalso)}`;
    case 'siIgual':
      return `${acc(v.nombre)} === ${literal(v.valor)} ? ${cadena(v.siVerdadero)} : ${v.siFalso === undefined ? nulo : cadena(v.siFalso)}`;
    case 'id':
      return idCon(v.sufijo);
    case 'idSi':
      return `${cond(v.cond)} ? ${idCon(v.sufijo)} : ${nulo}`;
    case 'ids':
      return `[${v.lista.map((x) => `${cond(x.cond)} ? ${idCon(x.sufijo)} : ''`).join(', ')}].filter(Boolean).join(' ') || ${nulo}`;
    case 'estilo':
      return `[${v.lista
        .map(({ variable, valor, unidad }) => {
          const x = acc(valor.nombre);
          const texto = concatenar ? `${cadena(`${variable}: `)} + ${x}${unidad ? ` + ${cadena(unidad)}` : ''}` : `\`${variable}: \${${x}}${unidad}\``;
          return valor.omitir === undefined ? texto : `${x} !== ${literal(valor.omitir)} && ${texto}`;
        })
        .join(', ')}].filter(Boolean).join('; ') || ${nulo}`;
    default:
      return nulo;
  }
}

/** Las props que se desestructuran con su valor por defecto. */
const conDefecto = (props) =>
  props.map((p) => (p.defecto === undefined ? p.nombre : `${p.nombre} = ${literal(p.defecto)}`)).join(', ');

/* ---------- React ---------- */

const JSX = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', autocomplete: 'autoComplete' };
const BOOLEANOS_REACT = new Set(['disabled', 'required', 'open', 'hidden', 'checked', 'multiple', 'readOnly']);

function emitirReact(c, ts, next = false) {
  const r = rasgos(c);
  const acc = (n) => n;
  const atributos = (n) =>
    Object.entries(n.atributos)
      .map(([k, v]) => {
        if (k.startsWith('@')) return ` onClick={on${v.nombre[0].toUpperCase()}${v.nombre.slice(1)}}`;
        // React no escribe autofocus en el cliente: el diálogo lo necesita en el DOM para llevar el foco.
        if (k === 'autofocus') return ` ref={(el) => el?.setAttribute('autofocus', '')}`;
        const nombre = JSX[k] ?? k;
        if (typeof v === 'string') {
          if (nombre === 'tabIndex' && /^-?\d+$/.test(v)) return ` tabIndex={${v}}`;
          return ` ${nombre}="${v}"`;
        }
        if (v.tipo === 'estilo') {
          // En React, style es un objeto; una variable con valor undefined no se escribe.
          const pares = v.lista.map(({ variable, valor, unidad }) => {
            const x = unidad ? `\`\${${valor.nombre}}${unidad}\`` : valor.nombre;
            return `${cadena(variable)}: ${valor.omitir === undefined ? x : `${valor.nombre} === ${literal(valor.omitir)} ? undefined : ${x}`}`;
          });
          return ` style={estilo({ ${pares.join(', ')} })}`;
        }
        // Sin onChange, un checked de React es un campo controlado que no cambia: defaultChecked.
        if (v.tipo === 'booleano' && nombre === 'checked') return ` defaultChecked={${v.nombre}}`;
        if (v.tipo === 'booleano' && BOOLEANOS_REACT.has(nombre)) return ` ${nombre}={${v.nombre}}`;
        if (v.tipo === 'booleano') return ` ${nombre}={${v.nombre} ? '' : undefined}`;
        return ` ${nombre}={${expresion(v, { acc })}}`;
      })
      .join('');
  const evento = (e) => `on${e[0].toUpperCase()}${e.slice(1)}`;

  const nodos = (lista, nivel) => {
    const out = [];
    for (const n of lista) {
      const pre = ' '.repeat(nivel);
      switch (n.tipo) {
        case 'lit':
          out.push(pre + (/[{}<>]/.test(n.valor) ? `{${cadena(n.valor)}}` : n.valor.trim() ? n.valor : `{${cadena(n.valor)}}`));
          break;
        case 'texto':
          out.push(`${pre}{${n.prop}}`);
          break;
        case 'item':
          out.push(`${pre}{item}`);
          break;
        case 'slot':
          out.push(`${pre}{${n.nombre}}`);
          break;
        case 'unir':
          out.push(`${pre}{\`\${${n.lista}.join(${cadena(n.separador)})}${n.final}\`}`);
          break;
        case 'crudo':
          out.push(pre + htmlAJsx(n.html));
          break;
        case 'si':
          out.push(`${pre}{${n.cond.join(' && ')} && (`, ...fragmento(n.hijos, nivel + 2), `${pre})}`);
          break;
        case 'segun': {
          // Cadena de ternarios: tone === 'success' ? (…) : tone === 'warning' ? (…) : (…)
          out.push(`${pre}{`);
          for (const [valor, hijos] of Object.entries(n.casos)) {
            out.push(`${pre}  ${n.prop} === ${cadena(valor)} ? (`, ...fragmento(hijos, nivel + 4), `${pre}  ) :`);
          }
          out.push(`${pre}  (`, ...fragmento(n.otro, nivel + 4), `${pre}  )`, `${pre}}`);
          break;
        }
        case 'cada':
          // En una línea: los espacios entre el texto y el separador son parte del contenido.
          out.push(`${pre}{${n.lista}.map((item) => (`, `${pre}  <Fragment key={item}>${nodos(n.hijos, 0).join('')}</Fragment>`, `${pre}))}`);
          break;
        case 'el': {
          const abre = `<${n.etiqueta}${atributos(n)}`;
          if (VACIOS.has(n.etiqueta) || !n.hijos.length) out.push(`${pre}${abre} />`);
          else if (n.hijos.every(enLinea)) out.push(`${pre}${abre}>${nodos(n.hijos, 0).join('')}</${n.etiqueta}>`);
          else out.push(`${pre}${abre}>`, ...nodos(n.hijos, nivel + 2), `${pre}</${n.etiqueta}>`);
          break;
        }
      }
    }
    return out;
  };
  const fragmento = (hijos, nivel) =>
    hijos.length === 1 && hijos[0].tipo === 'el' ? nodos(hijos, nivel) : [`${' '.repeat(nivel)}<>`, ...nodos(hijos, nivel + 2), `${' '.repeat(nivel)}</>`];

  const imports = [];
  const reactImports = [r.ids && 'useId', r.listas.size && 'Fragment'].filter(Boolean);
  const tipos = [r.slots.size && 'ReactNode', r.estilos && 'CSSProperties'].filter(Boolean);
  if (reactImports.length || (ts && tipos.length)) {
    const partes = [...reactImports, ...(ts ? tipos.map((t) => `type ${t}`) : [])];
    imports.push(`import { ${partes.join(', ')} } from 'react';`);
  }

  const parametros = [...c.props, ...[...r.slots].map((s) => ({ nombre: s })), ...[...r.eventos].map((e) => ({ nombre: evento(e) }))];
  const documento = [
    ...c.props.map((p) => [p.nombre, tipoTs(p), p.descripcion]),
    ...[...r.slots].map((s) => [s, 'ReactNode', c.slots?.[s]]),
    ...[...r.eventos].map((e) => [evento(e), '() => void', c.eventos?.[e]]),
  ];
  const cuerpo = nodos(c.raiz, 4);
  const raices = c.raiz.length > 1 ? ['    <>', ...nodos(c.raiz, 6), '    </>'] : cuerpo;
  const firma = ts
    ? `export function ${c.nombre}({ ${conDefecto(parametros)} }: ${c.nombre}Props) {`
    : `/** @param {${c.nombre}Props} props */\nexport function ${c.nombre}({ ${conDefecto(parametros)} }) {`;
  const tiposProps = ts
    ? [`export interface ${c.nombre}Props {`, ...documento.flatMap(([n, t, d]) => [...(d ? [`  /** ${d} */`] : []), `  ${n}?: ${t};`]), '}']
    : ['/**', ` * @typedef {object} ${c.nombre}Props`, ...documento.map(([n, t, d]) => ` * @property {${t.replace(/ReactNode/, "import('react').ReactNode")}} [${n}]${d ? ` ${d}` : ''}`), ' */'];

  const ayudanteEstilo = r.estilos
    ? [
        '',
        '/** Solo las variables con valor; si no hay ninguna, sin atributo style. */',
        ts
          ? 'function estilo(variables: Record<string, string | undefined>): CSSProperties | undefined {'
          : '/** @param {Record<string, string | undefined>} variables */\nfunction estilo(variables) {',
        '  const definidas = Object.entries(variables).filter(([, v]) => v !== undefined);',
        `  return definidas.length ? ${ts ? '(Object.fromEntries(definidas) as CSSProperties)' : 'Object.fromEntries(definidas)'} : undefined;`,
        '}',
      ]
    : [];
  const codigo = [
    // En Next.js, useId y los eventos piden un Client Component (se sigue pintando en el servidor).
    ...(next && (r.ids || r.eventos.size) ? ["'use client';", ''] : []),
    ...(imports.length ? [...imports, ''] : []),
    ...tiposProps,
    '',
    firma,
    ...(r.ids ? ['  const id = useId();'] : []),
    '  return (',
    ...(c.raiz.length > 1 ? raices : cuerpo),
    '  );',
    '}',
    ...ayudanteEstilo,
  ].join('\n');
  return codigo;
}

/* ---------- Vue ---------- */

function emitirVue(c, ts) {
  const r = rasgos(c);
  const acc = (n) => n;
  const atributos = (n) =>
    Object.entries(n.atributos)
      .map(([k, v]) => {
        if (k.startsWith('@')) return ` @click="emit(${cadena(v.nombre)})"`;
        if (typeof v === 'string') return v === '' ? ` ${k}` : ` ${k}="${v}"`;
        if (v.tipo === 'booleano') return ` :${k}="${v.nombre}"`;
        return ` :${k}="${expresion(v, { acc }).replace(/"/g, "'")}"`;
      })
      .join('');
  const conDirectiva = (html, directiva) => html.replace(/^<([a-z][\w-]*)/, `<$1 ${directiva}`);
  const nodos = (lista, nivel, directiva = '') => {
    const out = [];
    lista.forEach((n, i) => {
      const pre = ' '.repeat(nivel);
      const d = i === 0 && directiva ? ` ${directiva}` : '';
      switch (n.tipo) {
        case 'lit':
          out.push(pre + escHtml(n.valor));
          break;
        case 'texto':
          out.push(`${pre}{{ ${n.prop} }}`);
          break;
        case 'item':
          out.push(`${pre}{{ item }}`);
          break;
        case 'slot':
          out.push(n.nombre === 'children' ? `${pre}<slot />` : `${pre}<slot name="${n.nombre}" />`);
          break;
        case 'unir':
          out.push(`${pre}{{ ${n.lista}.join(${cadena(n.separador)}) }}${escHtml(n.final)}`);
          break;
        case 'crudo':
          out.push(pre + (d ? conDirectiva(n.html, d.trim()) : n.html));
          break;
        case 'si':
          out.push(...grupo(n.hijos, nivel, `v-if="${n.cond.join(' && ')}"`));
          break;
        case 'segun': {
          const ramas = Object.entries(n.casos);
          ramas.forEach(([valor, hijos], j) => out.push(...grupo(hijos, nivel, `${j ? 'v-else-if' : 'v-if'}="${n.prop} === ${cadena(valor)}"`)));
          out.push(...grupo(n.otro, nivel, 'v-else'));
          break;
        }
        case 'cada':
          // En una línea: Vue quita los espacios que quedan solos entre saltos de línea.
          out.push(`${pre}<template v-for="item in ${n.lista}" :key="item">${nodos(n.hijos, 0).join('')}</template>`);
          break;
        case 'el': {
          const abre = `<${n.etiqueta}${d}${atributos(n)}`;
          if (VACIOS.has(n.etiqueta)) out.push(`${pre}${abre} />`);
          else if (!n.hijos.length) out.push(`${pre}${abre}></${n.etiqueta}>`);
          else if (n.hijos.every(enLinea)) out.push(`${pre}${abre}>${nodos(n.hijos, 0).join('')}</${n.etiqueta}>`);
          else out.push(`${pre}${abre}>`, ...nodos(n.hijos, nivel + 2), `${pre}</${n.etiqueta}>`);
          break;
        }
      }
    });
    return out;
  };
  /** Un v-if sobre un solo elemento va en él; si no, en un <template>. */
  const grupo = (hijos, nivel, directiva) =>
    hijos.length === 1 && ['el', 'crudo'].includes(hijos[0].tipo)
      ? nodos(hijos, nivel, directiva)
      : [`${' '.repeat(nivel)}<template ${directiva}>`, ...nodos(hijos, nivel + 2), `${' '.repeat(nivel)}</template>`];

  const defectos = c.props.filter((p) => p.defecto !== undefined);
  const script = ts
    ? [
        '<script setup lang="ts">',
        ...(r.ids ? ["import { useId } from 'vue';", ''] : []),
        `withDefaults(`,
        `  defineProps<{`,
        ...c.props.flatMap((p) => [...(p.descripcion ? [`    /** ${p.descripcion} */`] : []), `    ${p.nombre}?: ${tipoTs(p)};`]),
        '  }>(),',
        `  { ${defectos.map((p) => `${p.nombre}: ${p.tipo === 'lista' ? `() => ${literal(p.defecto)}` : literal(p.defecto)}`).join(', ')} },`,
        ');',
        ...(r.eventos.size ? [`const emit = defineEmits<{ ${[...r.eventos].map((e) => `${e}: []`).join('; ')} }>();`] : []),
        ...(r.ids ? ['const id = useId();'] : []),
        '</script>',
      ]
    : [
        '<script setup>',
        ...(r.ids ? ["import { useId } from 'vue';", ''] : []),
        'defineProps({',
        ...c.props.map((p) => {
          const tipo = { opciones: 'String', texto: 'String', booleano: 'Boolean', numero: 'Number', lista: 'Array' }[p.tipo];
          const defecto = p.defecto === undefined ? '' : `, default: ${p.tipo === 'lista' ? `() => ${literal(p.defecto)}` : literal(p.defecto)}`;
          return `  ${p.nombre}: { type: ${tipo}${defecto} },${p.descripcion ? ` // ${p.descripcion}` : ''}`;
        }),
        '});',
        ...(r.eventos.size ? [`const emit = defineEmits([${[...r.eventos].map(cadena).join(', ')}]);`] : []),
        ...(r.ids ? ['const id = useId();'] : []),
        '</script>',
      ];
  return [...script, '', '<template>', ...nodos(c.raiz, 2), '</template>'].join('\n');
}

/* ---------- Angular ---------- */

/** En las plantillas de Angular, «@» abre un bloque y las llaves son ICU: se escriben como entidad. */
const escAngular = (s) => escHtml(s).replace(/@/g, '&#64;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');

function emitirAngular(c) {
  const r = rasgos(c);
  const acc = (n) => `${n}()`;
  const calculados = [];
  const atributos = (n) =>
    Object.entries(n.atributos)
      .map(([k, v]) => {
        if (k.startsWith('@')) return ` (click)="${v.nombre}.emit()"`;
        if (typeof v === 'string') return v === '' ? ` ${k}` : ` ${k}="${escAngular(v)}"`;
        if (v.tipo === 'booleano' && ['disabled', 'required', 'open'].includes(k)) return ` [${k}]="${acc(v.nombre)}"`;
        if (v.tipo === 'ids' || v.tipo === 'estilo') {
          // Las plantillas no pueden llamar a funciones globales (filter(Boolean)): va en un computed.
          const nombre = v.tipo === 'ids' ? 'describedBy' : 'estilo';
          calculados.push(`  protected readonly ${nombre} = computed(() => ${expresion(v, { acc, idBase: 'this.id', nulo: 'null', concatenar: true }).replace(/(\w+)\(\)/g, 'this.$1()')});`);
          return ` [attr.${k}]="${nombre}()"`;
        }
        const e = expresion(v, { acc, idBase: 'id', nulo: 'null', concatenar: true });
        return ` [attr.${k}]="${e.replace(/"/g, "'")}"`;
      })
      .join('');
  const nodos = (lista, nivel) => {
    const out = [];
    for (const n of lista) {
      const pre = ' '.repeat(nivel);
      switch (n.tipo) {
        case 'lit':
          out.push(pre + escAngular(n.valor));
          break;
        case 'texto':
          out.push(`${pre}{{ ${acc(n.prop)} }}`);
          break;
        case 'item':
          out.push(`${pre}{{ item }}`);
          break;
        case 'slot':
          out.push(n.nombre === 'children' ? `${pre}<ng-content />` : `${pre}<ng-content select="[${n.nombre}]" />`);
          break;
        case 'unir':
          out.push(`${pre}{{ ${acc(n.lista)}.join(${cadena(n.separador)}) }}${escAngular(n.final)}`);
          break;
        case 'crudo':
          out.push(pre + n.html);
          break;
        case 'si':
          out.push(`${pre}@if (${n.cond.map((x) => (x.startsWith('!') ? `!${acc(x.slice(1))}` : acc(x))).join(' && ')}) {`, ...nodos(n.hijos, nivel + 2), `${pre}}`);
          break;
        case 'segun':
          out.push(`${pre}@switch (${acc(n.prop)}) {`);
          for (const [valor, hijos] of Object.entries(n.casos)) out.push(`${pre}  @case (${cadena(valor)}) {`, ...nodos(hijos, nivel + 4), `${pre}  }`);
          out.push(`${pre}  @default {`, ...nodos(n.otro, nivel + 4), `${pre}  }`, `${pre}}`);
          break;
        case 'cada':
          // En una línea: Angular quita los espacios que quedan solos entre saltos de línea.
          // El espacio tras «{» evita «{{{», que Angular leería como interpolación.
          out.push(`${pre}@for (item of ${acc(n.lista)}; track item) { ${nodos(n.hijos, 0).join('')} }`);
          break;
        case 'el': {
          const abre = `<${n.etiqueta}${atributos(n)}`;
          if (VACIOS.has(n.etiqueta)) out.push(`${pre}${abre} />`);
          else if (!n.hijos.length) out.push(`${pre}${abre}></${n.etiqueta}>`);
          else if (n.hijos.every(enLinea)) out.push(`${pre}${abre}>${nodos(n.hijos, 0).join('')}</${n.etiqueta}>`);
          else out.push(`${pre}${abre}>`, ...nodos(n.hijos, nivel + 2), `${pre}</${n.etiqueta}>`);
          break;
        }
      }
    }
    return out;
  };
  const plantilla = nodos(c.raiz, 4).join('\n').replace(/`/g, '\\`');
  const entradas = c.props.map((p) => {
    const doc = p.descripcion ? `  /** ${p.descripcion} */\n` : '';
    if (p.tipo === 'booleano') return `${doc}  readonly ${p.nombre} = input(${literal(p.defecto ?? false)}, { transform: booleanAttribute });`;
    if (p.tipo === 'numero') return `${doc}  readonly ${p.nombre} = input(${literal(p.defecto ?? 0)}, { transform: numberAttribute });`;
    if (p.tipo === 'opciones' && !p.defecto) return `${doc}  readonly ${p.nombre} = input<${tipoTs(p)} | undefined>(undefined);`;
    return `${doc}  readonly ${p.nombre} = input<${tipoTs(p)}>(${p.defecto === undefined ? "''" : literal(p.defecto)});`;
  });
  const usa = ['Component', 'input', r.eventos.size && 'output', calculados.length && 'computed', c.props.some((p) => p.tipo === 'booleano') && 'booleanAttribute', c.props.some((p) => p.tipo === 'numero') && 'numberAttribute'].filter(Boolean);
  return [
    `import { ${usa.join(', ')} } from '@angular/core';`,
    '',
    ...(r.ids ? ['let siguiente = 0;', ''] : []),
    '@Component({',
    `  selector: 'ang-${kebab(c.nombre)}',`,
    "  // El elemento del componente no ocupa caja: el marcado de dentro es el que cuenta.",
    "  host: { style: 'display: contents' },",
    '  template: `',
    plantilla,
    '  `,',
    '})',
    `export class ${c.nombre} {`,
    ...entradas,
    ...[...r.eventos].map((e) => `  readonly ${e} = output<void>();`),
    ...(r.ids ? [`  protected readonly id = \`ang-${kebab(c.nombre)}-\${++siguiente}\`;`] : []),
    ...calculados,
    '}',
  ].join('\n');
}

/* ---------- Astro ---------- */

function emitirAstro(c, ts) {
  const r = rasgos(c);
  const acc = (n) => n;
  const atributos = (n) =>
    Object.entries(n.atributos)
      .filter(([k]) => !k.startsWith('@'))
      .map(([k, v]) => {
        if (typeof v === 'string') return v === '' ? ` ${k}` : ` ${k}="${v}"`;
        if (v.tipo === 'booleano') return ` ${k}={${v.nombre}}`;
        return ` ${k}={${expresion(v, { acc })}}`;
      })
      .join('');
  const nodos = (lista, nivel) => {
    const out = [];
    for (const n of lista) {
      const pre = ' '.repeat(nivel);
      switch (n.tipo) {
        case 'lit':
          out.push(pre + escHtml(n.valor).replace(/[{}]/g, (x) => `{'${x}'}`));
          break;
        case 'texto':
          out.push(`${pre}{${n.prop}}`);
          break;
        case 'item':
          out.push(`${pre}{item}`);
          break;
        case 'slot':
          out.push(n.nombre === 'children' ? `${pre}<slot />` : `${pre}<slot name="${n.nombre}" />`);
          break;
        case 'unir':
          out.push(`${pre}{${n.lista}.join(${cadena(n.separador)})}${escHtml(n.final)}`);
          break;
        case 'crudo':
          out.push(pre + n.html);
          break;
        case 'si':
          out.push(`${pre}{${n.cond.join(' && ')} && (`, ...grupo(n.hijos, nivel + 2), `${pre})}`);
          break;
        case 'segun': {
          out.push(`${pre}{`);
          for (const [valor, hijos] of Object.entries(n.casos)) out.push(`${pre}  ${n.prop} === ${cadena(valor)} ? (`, ...grupo(hijos, nivel + 4), `${pre}  ) :`);
          out.push(`${pre}  (`, ...grupo(n.otro, nivel + 4), `${pre}  )`, `${pre}}`);
          break;
        }
        case 'cada':
          out.push(`${pre}{${n.lista}.map((item) => (`, `${pre}  <Fragment>${nodos(n.hijos, 0).join('')}</Fragment>`, `${pre}))}`);
          break;
        case 'el': {
          const abre = `<${n.etiqueta}${atributos(n)}`;
          if (VACIOS.has(n.etiqueta)) out.push(`${pre}${abre} />`);
          else if (!n.hijos.length) out.push(`${pre}${abre}></${n.etiqueta}>`);
          else if (n.hijos.every(enLinea)) out.push(`${pre}${abre}>${nodos(n.hijos, 0).join('')}</${n.etiqueta}>`);
          else out.push(`${pre}${abre}>`, ...nodos(n.hijos, nivel + 2), `${pre}</${n.etiqueta}>`);
          break;
        }
      }
    }
    return out;
  };
  const grupo = (hijos, nivel) =>
    hijos.length === 1 && ['el', 'crudo'].includes(hijos[0].tipo) ? nodos(hijos, nivel) : [`${' '.repeat(nivel)}<>`, ...nodos(hijos, nivel + 2), `${' '.repeat(nivel)}</>`];

  const frontmatter = [
    '---',
    ...(ts
      ? [
          'interface Props {',
          ...c.props.flatMap((p) => [...(p.descripcion ? [`  /** ${p.descripcion} */`] : []), `  ${p.nombre}?: ${tipoTs(p)};`]),
          '}',
          '',
        ]
      : []),
    `const { ${conDefecto(c.props)} } = Astro.props;`,
    ...(r.ids ? [`// Un id por instancia, para enlazar etiqueta, ayuda y error.`, `const id = \`${kebab(c.nombre)}-\${Math.random().toString(36).slice(2, 8)}\`;`] : []),
    ...(r.eventos.size ? [`// Astro pinta HTML: la acción del botón la pones tú con un <script> o un formulario.`] : []),
    '---',
  ];
  return [...frontmatter, '', ...nodos(c.raiz, 0)].join('\n');
}

/* ---------- JavaScript sin framework ---------- */

function emitirVanilla(c, ts) {
  const r = rasgos(c);
  const acc = (n) => n;
  const funcion = camel(c.nombre);
  const atributos = (n) =>
    Object.entries(n.atributos)
      .map(([k, v]) => {
        if (k.startsWith('@')) return ` data-evento="${v.nombre}"`;
        if (typeof v === 'string') return v === '' ? ` ${k}` : ` ${k}="${escHtml(v).replace(/"/g, '&quot;')}"`;
        if (v.tipo === 'booleano') return `\${atributo('${k}', ${v.nombre})}`;
        return `\${atributo('${k}', ${expresion(v, { acc })})}`;
      })
      .join('');
  const plantilla = (lista) =>
    lista
      .map((n) => {
        switch (n.tipo) {
          case 'lit':
            return escHtml(n.valor).replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
          case 'texto':
            return `\${esc(${n.prop} ?? '')}`;
          case 'item':
            return '${esc(item)}';
          case 'slot':
            return `<template data-hueco="${n.nombre}"></template>`;
          case 'unir':
            return `\${esc(${n.lista}.join(${cadena(n.separador)}))}${escHtml(n.final)}`;
          case 'crudo':
            return n.html;
          case 'si':
            return `\${${n.cond.join(' && ')} ? \`${plantilla(n.hijos)}\` : ''}`;
          case 'segun':
            return `\${${Object.entries(n.casos)
              .map(([valor, hijos]) => `${n.prop} === ${cadena(valor)} ? \`${plantilla(hijos)}\` : `)
              .join('')}\`${plantilla(n.otro)}\`}`;
          case 'cada':
            return `\${${n.lista}.map((item) => \`${plantilla(n.hijos)}\`).join('')}`;
          case 'el':
            return VACIOS.has(n.etiqueta) ? `<${n.etiqueta}${atributos(n)}>` : `<${n.etiqueta}${atributos(n)}>${plantilla(n.hijos)}</${n.etiqueta}>`;
          default:
            return '';
        }
      })
      .join('');

  const slots = [...r.slots];
  const eventos = [...r.eventos].map((e) => `on${e[0].toUpperCase()}${e.slice(1)}`);
  const opciones = [...c.props, ...slots.map((s) => ({ nombre: s })), ...eventos.map((e) => ({ nombre: e }))];
  const tipos = ts
    ? [
        `export interface ${c.nombre}Opciones {`,
        ...c.props.flatMap((p) => [...(p.descripcion ? [`  /** ${p.descripcion} */`] : []), `  ${p.nombre}?: ${tipoTs(p)};`]),
        ...slots.map((s) => `  ${s}?: string | Node;`),
        ...eventos.map((e) => `  ${e}?: () => void;`),
        '}',
        '',
      ]
    : [
        '/**',
        ` * @typedef {object} ${c.nombre}Opciones`,
        ...c.props.map((p) => ` * @property {${tipoJsDoc(p)}} [${p.nombre}]${p.descripcion ? ` ${p.descripcion}` : ''}`),
        ...slots.map((s) => ` * @property {string | Node} [${s}]`),
        ...eventos.map((e) => ` * @property {() => void} [${e}]`),
        ' */',
        '',
      ];
  const t = (tipo) => (ts ? `: ${tipo}` : '');
  const cuerpo = [
    ...(r.ids ? ['let siguiente = 0;', ''] : []),
    ...tipos,
    `/** Crea el marcado de ${c.nombre}. Devuelve un fragmento para añadirlo donde quieras. */`,
    ...(ts ? [] : [`/** @param {${c.nombre}Opciones} [opciones] */`]),
    `export function ${funcion}({ ${conDefecto(opciones)} }${t(`${c.nombre}Opciones`)} = {})${t('DocumentFragment')} {`,
    ...(r.ids ? [`  const id = \`${kebab(c.nombre)}-\${++siguiente}\`;`] : []),
    "  const plantilla = document.createElement('template');",
    `  plantilla.innerHTML = \`${plantilla(c.raiz)}\`;`,
    ...slots.map((s) => `  rellenar(plantilla.content, '${s}', ${s});`),
    ...[...r.eventos].map(
      (e, i) =>
        `  plantilla.content.querySelector('[data-evento="${e}"]')?.addEventListener('click', () => ${eventos[i]}?.());`,
    ),
    ...(r.eventos.size ? ["  plantilla.content.querySelectorAll('[data-evento]').forEach((el) => el.removeAttribute('data-evento'));"] : []),
    '  return plantilla.content;',
    '}',
    '',
    '/* Ayudantes */',
    '',
    `const esc = (s${t('unknown')}) =>`,
    `  String(s).replace(/[&<>"]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[x]${ts ? '!' : ''});`,
    '',
    '/** Un atributo, o nada si el valor es undefined, null o false. */',
    `function atributo(nombre${t('string')}, valor${t('string | boolean | null | undefined')})${t('string')} {`,
    "  if (valor === undefined || valor === null || valor === false) return '';",
    '  return valor === true ? ` ${nombre}` : ` ${nombre}="${esc(valor)}"`;',
    '}',
    ...(slots.length
      ? [
          '',
          '/** Pone el contenido (texto o nodos) en su hueco. */',
          `function rellenar(raiz${t('ParentNode')}, nombre${t('string')}, contenido${t('string | Node | undefined')}) {`,
          '  raiz.querySelector(`template[data-hueco="${nombre}"]`)?.replaceWith(contenido ?? \'\');',
          '}',
        ]
      : []),
  ];
  return cuerpo.join('\n');
}

/* ---------- Ejemplos de uso con unas props ---------- */

/**
 * La etiqueta del componente en un ejemplo de uso. Si no cabe en 80 columnas, una prop por línea
 * (como lo deja Prettier); el contenido, dentro y sangrado.
 */
function etiquetaUso(nombre, atributos, dentro, { autocierre = true } = {}) {
  const enLinea = `<${nombre}${atributos.join('')}`;
  const largo = enLinea.length > 80;
  const abre = largo ? `<${nombre}\n${atributos.map((a) => sangrar(a.trim(), 2)).join('\n')}\n` : enLinea;
  if (!dentro) {
    if (autocierre) return largo ? `${abre}/>` : `${abre} />`;
    return `${abre}></${nombre}>`;
  }
  if (!largo && !dentro.includes('\n') && enLinea.length + dentro.length <= 70) return `${enLinea}>${dentro}</${nombre}>`;
  return `${abre}>\n${sangrar(dentro, 2)}\n</${nombre}>`;
}

/** Las props que difieren de su valor por defecto. */
const elegidas = (c, props) => c.props.filter((p) => props[p.nombre] !== undefined && JSON.stringify(props[p.nombre]) !== JSON.stringify(p.defecto));

function usoReact(c, props, slots, next) {
  const r = rasgos(c);
  const attrs = elegidas(c, props).map((p) => {
    const v = props[p.nombre];
    if (p.tipo === 'booleano') return v ? ` ${p.nombre}` : ` ${p.nombre}={false}`;
    if (typeof v === 'string' && !/["{}\\]/.test(v)) return ` ${p.nombre}="${v}"`;
    return ` ${p.nombre}={${literal(v)}}`;
  });
  const eventos = [...r.eventos].map((e) => ` on${e[0].toUpperCase()}${e.slice(1)}={() => {/* … */}}`);
  // Un texto suelto va tal cual (escapando llaves); el marcado, convertido a JSX.
  const aJsx = (html) => (/</.test(html) ? htmlAJsx(html) : html.replace(/[{}]/g, (x) => `{'${x}'}`).replace(/&amp;/g, '&').replace(/&quot;/g, '"'));
  // Como hijos no hace falta fragmento: <Carousel><article/><article/></Carousel>.
  const sinFragmento = (jsx) => (/^<>\n[\s\S]*\n<\/>$/.test(jsx) ? jsx.slice(3, -4).replace(/^ {2}/gm, '') : jsx);
  const hijos = slots.children ? sinFragmento(aJsx(slots.children)) : '';
  const nombrados = [...r.slots].filter((s) => s !== 'children' && slots[s]).map((s) => ` ${s}={${aJsx(slots[s])}}`);
  const jsx = etiquetaUso(c.nombre, [...attrs, ...nombrados, ...eventos], hijos);
  return [
    ...(next && r.eventos.size ? ["'use client';", ''] : []),
    `import { ${c.nombre} } from '@/components/${c.nombre}';`,
    '',
    `export default function ${next ? 'Page' : 'App'}() {`,
    jsx.includes('\n') ? `  return (\n${sangrar(jsx, 4)}\n  );` : `  return ${jsx};`,
    '}',
  ].join('\n');
}

function usoVue(c, props, slots, ts) {
  const r = rasgos(c);
  const attrs = elegidas(c, props).map((p) => {
    const v = props[p.nombre];
    if (p.tipo === 'booleano') return v ? ` ${p.nombre}` : ` :${p.nombre}="false"`;
    if (typeof v === 'string') return ` ${p.nombre}="${escHtml(v).replace(/"/g, '&quot;')}"`;
    return ` :${p.nombre}="${literal(v).replace(/"/g, "'")}"`;
  });
  const manejador = (e) => `on${e[0].toUpperCase()}${e.slice(1)}`;
  const eventos = [...r.eventos].map((e) => ` @${e}="${manejador(e)}"`);
  const nombrados = [...r.slots].filter((s) => s !== 'children' && slots[s]).map((s) => `<template #${s}>\n${sangrar(slots[s], 2)}\n</template>`);
  const dentro = [slots.children, ...nombrados].filter(Boolean).join('\n');
  const tpl = etiquetaUso(c.nombre, [...attrs, ...eventos], dentro);
  return [
    `<script setup${ts ? ' lang="ts"' : ''}>`,
    `import ${c.nombre} from './components/${c.nombre}.vue';`,
    ...[...r.eventos].map((e) => `\nfunction ${manejador(e)}() {\n  // …\n}`),
    '</script>',
    '',
    '<template>',
    sangrar(tpl, 2),
    '</template>',
  ].join('\n');
}

function usoAngular(c, props, slots) {
  const r = rasgos(c);
  const etiqueta = `ang-${kebab(c.nombre)}`;
  const attrs = elegidas(c, props).map((p) => {
    const v = props[p.nombre];
    if (p.tipo === 'booleano') return v ? ` ${p.nombre}` : ` [${p.nombre}]="false"`;
    if (p.tipo === 'lista') return ` [${p.nombre}]="${literal(v).replace(/"/g, '&quot;')}"`;
    return ` ${p.nombre}="${escAngular(String(v)).replace(/"/g, '&quot;')}"`;
  });
  const manejador = (e) => `on${e[0].toUpperCase()}${e.slice(1)}`;
  const eventos = [...r.eventos].map((e) => ` (${e})="${manejador(e)}()"`);
  const nombrados = [...r.slots]
    .filter((s) => s !== 'children' && slots[s])
    .map((s) => `<div ${s} style="display: contents">\n${sangrar(slots[s].replace(/@/g, '&#64;'), 2)}\n</div>`);
  const dentro = [slots.children?.replace(/@/g, '&#64;'), ...nombrados].filter(Boolean).join('\n');
  const tpl = etiquetaUso(etiqueta, [...attrs, ...eventos], dentro, { autocierre: false });
  return [
    "import { Component } from '@angular/core';",
    `import { ${c.nombre} } from './${kebab(c.nombre)}';`,
    '',
    '@Component({',
    "  selector: 'app-root',",
    `  imports: [${c.nombre}],`,
    '  template: `',
    sangrar(tpl.replace(/`/g, '\\`'), 4),
    '  `,',
    '})',
    r.eventos.size ? `export class App {\n${[...r.eventos].map((e) => `  ${manejador(e)}() {\n    // …\n  }`).join('\n\n')}\n}` : 'export class App {}',
  ].join('\n');
}

function usoAstro(c, props, slots) {
  const attrs = elegidas(c, props).map((p) => {
    const v = props[p.nombre];
    if (p.tipo === 'booleano') return v ? ` ${p.nombre}` : ` ${p.nombre}={false}`;
    if (typeof v === 'string' && !/["{}]/.test(v)) return ` ${p.nombre}="${v}"`;
    return ` ${p.nombre}={${literal(v)}}`;
  });
  const r = rasgos(c);
  const nombrados = [...r.slots].filter((s) => s !== 'children' && slots[s]).map((s) => `<Fragment slot="${s}">\n${sangrar(slots[s], 2)}\n</Fragment>`);
  const dentro = [slots.children, ...nombrados].filter(Boolean).join('\n');
  const tpl = etiquetaUso(c.nombre, attrs, dentro);
  return ['---', `import ${c.nombre} from '../components/${c.nombre}.astro';`, '---', '', tpl].join('\n');
}

function usoVanilla(c, props, slots, ts) {
  const r = rasgos(c);
  const funcion = camel(c.nombre);
  const pares = [
    ...elegidas(c, props).map((p) => `${p.nombre}: ${literal(props[p.nombre])}`),
    ...[...r.slots].filter((s) => slots[s]).map((s) => {
      // Texto suelto va como texto; si es marcado, se pasa un nodo.
      const plano = !/</.test(slots[s]);
      return plano ? `${s}: ${literal(slots[s].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'))}` : `${s}: html(${literal(slots[s].replace(/\n\s*/g, ''))})`;
    }),
    ...[...r.eventos].map((e) => `on${e[0].toUpperCase()}${e.slice(1)}: () => {/* … */}`),
  ];
  const usaHtml = pares.some((p) => p.includes('html('));
  const llamada = pares.length ? (pares.join(', ').length > 60 ? `${funcion}({\n${pares.map((p) => `  ${p},`).join('\n')}\n})` : `${funcion}({ ${pares.join(', ')} })`) : `${funcion}()`;
  return [
    `import { ${funcion} } from './components/${kebab(c.nombre)}${ts ? '' : '.js'}';`,
    '',
    ...(usaHtml
      ? [
          '/** Marcado de confianza (escrito por ti) a nodos. */',
          `const html = (s${ts ? ': string' : ''}) => document.createRange().createContextualFragment(s);`,
          '',
        ]
      : []),
    `document.querySelector('#app')${ts ? '!' : '?'}.append(${sangrar(llamada, 0).replace(/\n/g, '\n')});`,
  ].join('\n');
}

/* ---------- Todo junto ---------- */

export const LENGUAJES = ['ts', 'js'];

/**
 * El componente y su uso en cada framework.
 * @param {object} c  componente (ir.js) con nombre, props, slots y raiz
 * @param {Record<string, unknown>} props  los valores elegidos
 * @param {Record<string, string>} slots  el HTML de cada slot en el ejemplo
 * @param {'ts' | 'js'} lenguaje
 */
export function emitir(c, props, slots, lenguaje = 'ts') {
  const ts = lenguaje === 'ts';
  const ext = (a, b) => (ts ? a : b);
  const k = kebab(c.nombre);
  return [
    {
      id: 'html',
      nombre: 'JS',
      componente: { archivo: `src/components/${k}.${ext('ts', 'js')}`, lenguaje: ext('ts', 'js'), codigo: emitirVanilla(c, ts) },
      uso: { archivo: `src/main.${ext('ts', 'js')}`, lenguaje: ext('ts', 'js'), codigo: usoVanilla(c, props, slots, ts) },
    },
    {
      id: 'astro',
      nombre: 'Astro',
      componente: { archivo: `src/components/${c.nombre}.astro`, lenguaje: 'astro', codigo: emitirAstro(c, ts) },
      uso: { archivo: 'src/pages/index.astro', lenguaje: 'astro', codigo: usoAstro(c, props, slots) },
    },
    {
      id: 'react',
      nombre: 'React',
      componente: { archivo: `src/components/${c.nombre}.${ext('tsx', 'jsx')}`, lenguaje: ext('tsx', 'jsx'), codigo: emitirReact(c, ts) },
      uso: { archivo: `src/App.${ext('tsx', 'jsx')}`, lenguaje: ext('tsx', 'jsx'), codigo: usoReact(c, props, slots, false) },
    },
    {
      id: 'next',
      nombre: 'Next.js',
      componente: { archivo: `components/${c.nombre}.${ext('tsx', 'jsx')}`, lenguaje: ext('tsx', 'jsx'), codigo: emitirReact(c, ts, true) },
      uso: { archivo: `app/page.${ext('tsx', 'jsx')}`, lenguaje: ext('tsx', 'jsx'), codigo: usoReact(c, props, slots, true) },
    },
    {
      id: 'vue',
      nombre: 'Vue',
      componente: { archivo: `src/components/${c.nombre}.vue`, lenguaje: 'vue', codigo: emitirVue(c, ts) },
      uso: { archivo: 'src/App.vue', lenguaje: 'vue', codigo: usoVue(c, props, slots, ts) },
    },
    {
      id: 'angular',
      nombre: 'Angular',
      // Angular es siempre TypeScript.
      componente: { archivo: `src/app/${k}.ts`, lenguaje: 'ts', codigo: emitirAngular(c) },
      uso: { archivo: 'src/app/app.ts', lenguaje: 'ts', codigo: usoAngular(c, props, slots) },
    },
  ];
}
