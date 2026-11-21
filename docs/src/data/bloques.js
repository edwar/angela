/**
 * Bloques: pantallas enteras hechas solo con componentes y utilidades de angela, para copiar y
 * adaptar. Cada bloque es un HTML en src/bloques/; las pestañas de cada framework salen de él
 * (codigo-frameworks.js). Si necesita algo más (la paleta de comandos), su CSS y JS van aparte.
 */
import login from '../bloques/login.html?raw';
import precios from '../bloques/precios.html?raw';
import ajustes from '../bloques/ajustes.html?raw';
import equipo from '../bloques/equipo.html?raw';
import notificaciones from '../bloques/notificaciones.html?raw';
import paleta from '../bloques/paleta.html?raw';
import paletaCss from '../bloques/paleta.css?raw';
import paletaJs from '../bloques/paleta.js?raw';

/**
 * @typedef {{ id: string, titulo: string, nota: string, html: string,
 *   extra?: { archivo: string, lenguaje: string, codigo: string }[], uso?: string }} Bloque
 */

/** @type {Bloque[]} */
export const BLOQUES = [
  {
    id: 'login',
    titulo: 'Inicio de sesión',
    nota: 'Tarjeta, campos con validación accesible (el error aparece al salir del campo y se anuncia), casilla y botón a todo el ancho.',
    html: login,
  },
  {
    id: 'precios',
    titulo: 'Precios',
    nota: 'Rejilla de planes que se adapta al ancho (.cards). El recomendado lleva sombra, etiqueta y el único botón sólido de la vista.',
    html: precios,
  },
  {
    id: 'ajustes',
    titulo: 'Ajustes en un diálogo',
    nota: 'Formulario en un <dialog> modal: cabecera con cerrar, cuerpo con scroll y pie con Cancelar + acción. method="dialog" lo cierra al guardar.',
    html: ajustes,
  },
  {
    id: 'equipo',
    titulo: 'Tabla con acciones',
    nota: 'Tarjeta a sangre con buscador, estados con punto y texto, y un menú por fila siempre visible. Quitar a alguien pide confirmación con el foco en Cancelar.',
    html: equipo,
  },
  {
    id: 'notificaciones',
    titulo: 'Centro de notificaciones',
    nota: 'Un popover anclado al botón: se abre sin JS y se cierra al pulsar fuera o con Esc. Lo no leído lleva punto y texto, no solo color.',
    html: notificaciones,
  },
  {
    id: 'paleta',
    titulo: 'Paleta de comandos',
    nota: 'Ctrl K (⌘ K en Mac) desde cualquier sitio de esta página. Escribe para filtrar, ↑ ↓ para moverte y Enter para elegir: patrón combobox, el foco se queda en el buscador.',
    html: paleta,
    extra: [
      { archivo: 'paleta.css', lenguaje: 'css', codigo: paletaCss },
      { archivo: 'paleta.js', lenguaje: 'js', codigo: paletaJs },
    ],
    uso: `import { paletaDeComandos } from './paleta.js';

paletaDeComandos(document.querySelector('[data-paleta]'), {
  alElegir: (comando) => console.log('Elegido:', comando),
});

// En React, Vue o Angular, llámalo al montar (useEffect, onMounted, afterNextRender)
// y llama a la función que devuelve al desmontar: quita el atajo de teclado.`,
  },
];
