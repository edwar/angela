/**
 * Descripción neutra de un componente: un árbol de elementos cuyos atributos, textos y ramas
 * dependen de sus props. De ella salen el componente de cada framework (emisores/*.js) y el HTML
 * de la vista previa (render.js), así nunca se desincronizan.
 *
 * Nodos:
 *   el(etiqueta, atributos, hijos)       elemento
 *   lit('texto')                          texto fijo
 *   texto('prop')                         el valor de una prop de texto
 *   slot('children' | 'footer'…)          contenido que pone quien lo usa
 *   si('prop' | ['a', '!b'], hijos)       solo si la prop (o todas) tiene valor; «!b», si no lo tiene
 *   segun('prop', { valor: hijos }, otro) una rama por valor
 *   cada('lista', hijos)                  repite hijos por cada elemento (item())
 *   item()                                el elemento actual dentro de cada()
 *   unir('lista', ' ✧ ', ' ✧')            los elementos unidos en un texto
 *   crudo('<svg…>')                       marcado fijo (iconos)
 *
 * Atributos (valor):
 *   'texto'                                fijo ('' = atributo sin valor)
 *   prop('tone', 'brand')                  el valor de la prop; si es el segundo, no se escribe
 *   bandera('block')                       data-x="" si la prop es true
 *   booleano('disabled')                   atributo booleano nativo
 *   segunProp('dismissible', 'any', 'closerequest')   sin el tercero, no se escribe si es false
 *   siIgual('kind', 'radio', 'radio', 'checkbox')     según el valor de una prop
 *   id('-title')                           un id único por instancia (+ sufijo)
 *   idSi('error', '-error')                ese id, solo si la prop tiene valor
 *   ids([['hint', '-hint'], [['invalid', 'error'], '-error']])   varios ids separados por espacio
 *   estilo([['--marquee-duration', prop('duracion', 20), 's']])  variables CSS
 *   evento('confirm')                      (en la clave «@click») avisa a quien lo usa
 */

export const el = (etiqueta, atributos = {}, hijos = []) => ({ tipo: 'el', etiqueta, atributos, hijos });
export const lit = (valor) => ({ tipo: 'lit', valor });
export const texto = (prop) => ({ tipo: 'texto', prop });
export const slot = (nombre = 'children') => ({ tipo: 'slot', nombre });
export const si = (cond, hijos) => ({ tipo: 'si', cond: [cond].flat(), hijos });
export const segun = (prop, casos, otro = []) => ({ tipo: 'segun', prop, casos, otro });
export const cada = (lista, hijos) => ({ tipo: 'cada', lista, hijos });
export const item = () => ({ tipo: 'item' });
export const unir = (lista, separador, final = '') => ({ tipo: 'unir', lista, separador, final });
export const crudo = (html) => ({ tipo: 'crudo', html });

export const prop = (nombre, omitir) => ({ tipo: 'prop', nombre, omitir });
export const bandera = (nombre) => ({ tipo: 'bandera', nombre });
export const booleano = (nombre) => ({ tipo: 'booleano', nombre });
export const segunProp = (nombre, siVerdadero, siFalso) => ({ tipo: 'segunProp', nombre, siVerdadero, siFalso });
/** Un valor si la prop es igual a `valor` y otro (o nada) si no: type = kind === 'radio' ? 'radio' : 'checkbox'. */
export const siIgual = (nombre, valor, siVerdadero, siFalso) => ({ tipo: 'siIgual', nombre, valor, siVerdadero, siFalso });
export const id = (sufijo = '') => ({ tipo: 'id', sufijo });
export const idSi = (cond, sufijo) => ({ tipo: 'idSi', cond: [cond].flat(), sufijo });
export const ids = (lista) => ({ tipo: 'ids', lista: lista.map(([cond, sufijo]) => ({ cond: [cond].flat(), sufijo })) });
export const estilo = (lista) => ({ tipo: 'estilo', lista: lista.map(([variable, valor, unidad = '']) => ({ variable, valor, unidad })) });
export const evento = (nombre) => ({ tipo: 'evento', nombre });

/** Recorre el árbol (para saber si usa ids, eventos, listas…). */
export function recorrer(nodos, visitar) {
  for (const n of [nodos].flat()) {
    visitar(n);
    if (n.tipo === 'el') {
      for (const v of Object.values(n.atributos)) visitar(v);
      recorrer(n.hijos, visitar);
    }
    if (n.tipo === 'si' || n.tipo === 'cada') recorrer(n.hijos, visitar);
    if (n.tipo === 'segun') {
      for (const h of Object.values(n.casos)) recorrer(h, visitar);
      recorrer(n.otro, visitar);
    }
  }
}

/** Qué necesita un componente: ids, eventos, slots con nombre… */
export function rasgos(componente) {
  const r = { ids: false, eventos: new Set(), slots: new Set(), listas: new Set(), estilos: false, autofocus: false };
  recorrer(componente.raiz, (n) => {
    if (typeof n !== 'object' || n === null) return;
    if (['id', 'idSi', 'ids'].includes(n.tipo)) r.ids = true;
    if (n.tipo === 'evento') r.eventos.add(n.nombre);
    if (n.tipo === 'slot') r.slots.add(n.nombre);
    if (n.tipo === 'cada' || n.tipo === 'unir') r.listas.add(n.lista);
    if (n.tipo === 'estilo') r.estilos = true;
    if (n.tipo === 'el' && 'autofocus' in n.atributos) r.autofocus = true;
  });
  return r;
}

/** «Button» → «button»; «ConfirmDialog» → «confirm-dialog». */
export const kebab = (pascal) => pascal.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
/** «Button» → «button» (función de JS sin framework). */
export const camel = (pascal) => pascal[0].toLowerCase() + pascal.slice(1);
