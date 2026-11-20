/**
 * Catálogo de @angela-ui/icons para la documentación: lee la fuente de cada icono
 * (packages/angela-icons/iconos/*.json) y la dibuja a mano alzada con el mismo código que
 * el paquete. Así el sitio no necesita compilar el paquete antes.
 */
import { dibujar, piezasSvg, RAIZ } from '@angela-ui/icons/mano-alzada';

const fuentes = import.meta.glob('../../../packages/angela-icons/iconos/*.json', { import: 'default', eager: true });

/** @typedef {{ nombre: string, exportacion: string, categoria: string, etiquetas: string[], autor: string, licencia: string, formas: object[], interior: string }} IconoCatalogo */

const pascal = (nombre) => nombre.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');

/** @type {IconoCatalogo[]} */
export const catalogo = Object.entries(fuentes)
  .map(([ruta, icono]) => {
    const nombre = ruta.split('/').pop().replace(/\.json$/, '');
    return { nombre, exportacion: `icono${pascal(nombre)}`, ...icono, interior: piezasSvg(dibujar(icono.formas, { semilla: nombre })) };
  })
  .sort((a, b) => a.nombre.localeCompare(b.nombre));

/** SVG de un icono del catálogo: decorativo y, si se da, con tamaño. */
export const svgIcono = (interior, tamano) => `<svg ${RAIZ}${tamano ? ` width="${tamano}" height="${tamano}"` : ''} aria-hidden="true">${interior}</svg>`;
