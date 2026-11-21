/**
 * El HTML de un componente para unas props: es lo que pinta cualquiera de sus versiones
 * (React, Vue, Angular, Astro o JS) con esas mismas props. Lo usa la vista previa.
 */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const VACIOS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/** ¿Tienen valor todas las props de la condición? */
const tiene = (v) => Boolean(v) && !(Array.isArray(v) && !v.length);
/** ¿Se cumplen todas? «!hint» es «hint sin valor». */
const cumple = (cond, props) => cond.every((n) => (n.startsWith('!') ? !tiene(props[n.slice(1)]) : tiene(props[n])));

/** El valor de un atributo, o undefined si no se escribe. */
function valorAtributo(v, props, base, indice) {
  if (typeof v === 'string') return v;
  switch (v.tipo) {
    case 'prop': {
      const x = props[v.nombre];
      return x === undefined || x === null || x === '' || x === v.omitir ? undefined : String(x);
    }
    case 'bandera':
      return props[v.nombre] ? '' : undefined;
    case 'booleano':
      return props[v.nombre] ? true : undefined;
    case 'segunProp':
      return props[v.nombre] ? v.siVerdadero : v.siFalso;
    case 'siIgual':
      return props[v.nombre] === v.valor ? v.siVerdadero : v.siFalso;
    case 'id':
      return base + v.sufijo;
    case 'idItem':
      return `${base}${v.sufijo}-${indice ?? 0}`;
    case 'idSi':
      return cumple(v.cond, props) ? base + v.sufijo : undefined;
    case 'ids':
      return v.lista.filter((x) => cumple(x.cond, props)).map((x) => base + x.sufijo).join(' ') || undefined;
    case 'estilo':
      return (
        v.lista
          .map(({ variable, valor, unidad }) => {
            const x = valorAtributo(valor, props, base);
            return x === undefined ? null : `${variable}: ${x}${unidad}`;
          })
          .filter(Boolean)
          .join('; ') || undefined
      );
    default:
      return undefined;
  }
}

/**
 * @param {{ raiz: object[] }} componente
 * @param {Record<string, unknown>} props
 * @param {Record<string, string>} slots  el HTML de cada slot
 * @param {string} base  el id de esta instancia
 */
export function renderHtml(componente, props, slots = {}, base = 'ej') {
  const pintar = (nodos, actual, indice) =>
    nodos
      .map((n) => {
        switch (n.tipo) {
          case 'lit':
            return esc(n.valor);
          case 'texto':
            return esc(props[n.prop] ?? '');
          case 'slot':
            return slots[n.nombre] ?? '';
          case 'si':
            return cumple(n.cond, props) ? pintar(n.hijos, actual, indice) : '';
          case 'segun':
            return pintar(n.casos[props[n.prop]] ?? n.otro, actual, indice);
          case 'cada':
            return (props[n.lista] ?? []).map((x, i) => pintar(n.hijos, x, i)).join('');
          case 'item':
            return esc(actual ?? '');
          case 'unir':
            return esc((props[n.lista] ?? []).join(n.separador) + n.final);
          case 'crudo':
            return n.html;
          case 'el': {
            const atributos = Object.entries(n.atributos)
              .filter(([k]) => !k.startsWith('@'))
              .map(([k, v]) => [k, valorAtributo(v, props, base, indice)])
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`))
              .join('');
            if (VACIOS.has(n.etiqueta)) return `<${n.etiqueta}${atributos}>`;
            return `<${n.etiqueta}${atributos}>${pintar(n.hijos, actual, indice)}</${n.etiqueta}>`;
          }
          default:
            return '';
        }
      })
      .join('');
  return pintar(componente.raiz);
}
