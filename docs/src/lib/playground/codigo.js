/**
 * El código del «Pruébalo»: el componente reutilizable de cada framework (con sus props, en
 * TypeScript o JavaScript) y un ejemplo de uso con los valores elegidos en los controles.
 */
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

/** El CSS del tema si cambia el color de marca; null si son los valores por defecto. */
export function codigoTema({ h, c }, defecto = { h: 262, c: 0.17 }) {
  if (Number(h) === defecto.h && Number(c) === defecto.c) return null;
  return `:root {\n  --angela-brand-h: ${Number(h)};\n  --angela-brand-c: ${Number(c)};\n}`;
}
