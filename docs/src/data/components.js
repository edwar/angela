/**
 * Catálogo de componentes: una página por archivo en ./componentes/<slug>.js (ejemplos, API y
 * accesibilidad). Cada ejemplo es HTML real: se renderiza en vivo y se muestra su código. Los
 * ids deben ser únicos dentro de la página del componente.
 *
 * El laboratorio escribe estos archivos al proponer: crea la página de un componente nuevo y
 * pone al día la de uno que ya existe, así que nadie tiene que tocar este índice.
 */

/** Orden de los componentes del núcleo en el menú; los aportados van después, por título. */
const ORDEN = ['boton', 'campos', 'casilla', 'radio', 'interruptor', 'dialogo', 'popover', 'pestanas', 'desplegable', 'avisos', 'tarjeta', 'tabla', 'tipografia'];

const posicion = (slug) => {
  const i = ORDEN.indexOf(slug);
  return i === -1 ? ORDEN.length : i;
};

export const components = Object.values(import.meta.glob('./componentes/*.js', { eager: true, import: 'default' }))
  .filter((entry) => entry?.slug && entry?.title)
  .sort((a, b) => posicion(a.slug) - posicion(b.slug) || a.title.localeCompare(b.title, 'es'));
