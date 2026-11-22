/**
 * El código del «Pruébalo»: el componente reutilizable de cada framework (con sus props, en
 * TypeScript o JavaScript) y un ejemplo de uso con los valores elegidos en los controles.
 */
import { roles } from '@angela-ui/angela/palette';
import { emitir } from '../componentes/emisores.js';
import { componenteDe, propsDe } from './definiciones.js';

/** Los SVG se abrevian al mostrarlos (se copian completos). */
export const abreviar = (codigo) => codigo.replace(/<svg[\s\S]*?<\/svg>/g, '<svg aria-hidden="true">…</svg>');

const parte = ({ archivo, lenguaje, codigo }) => ({ archivo, lenguaje, codigo: abreviar(codigo), copiar: codigo });

/**
 * @param {import('./definiciones.js').Definicion} def
 * @param {Record<string, unknown>} valores  los del playground
 * @param {'ts' | 'js'} lenguaje
 */
export function codigoPlayground(def, valores, lenguaje = 'ts') {
  return emitir(componenteDe(def), propsDe(def, valores), def.slots(valores), lenguaje).map((fw) => ({
    id: fw.id,
    nombre: fw.nombre,
    componente: parte(fw.componente),
    uso: parte(fw.uso),
  }));
}

/**
 * Las variables del tema que cambian respecto a angela: [['--angela-info-h', 200], …]. El neutro
 * solo tiene croma propio (su tono sigue al de marca).
 * @param {Record<string, { h: number, c: number }>} colores
 * @param {Record<string, { h: number, c: number }>} [defecto]
 * @returns {[string, number][]}
 */
export function variablesTema(colores, defecto = roles) {
  const vars = [];
  for (const [rol, { h, c }] of Object.entries(colores)) {
    const d = defecto[rol];
    if (!d) continue;
    if (rol !== 'neutral' && Number(h) !== d.h) vars.push([`--angela-${rol}-h`, Number(h)]);
    if (Number(c) !== d.c) vars.push([`--angela-${rol}-c`, Number(c)]);
  }
  return vars;
}

/** El CSS del tema con los colores que cambian; null si son los de angela. */
export function codigoTema(colores, defecto = roles) {
  const vars = variablesTema(colores, defecto);
  return vars.length ? `:root {\n${vars.map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}` : null;
}
