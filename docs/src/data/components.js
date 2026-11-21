/**
 * Catálogo de componentes: una página por archivo en ./componentes/<slug>.js (ejemplos, API y
 * accesibilidad). Cada ejemplo es HTML real: se renderiza en vivo y se muestra su código. Los
 * ids deben ser únicos dentro de la página del componente.
 *
 * El laboratorio escribe estos archivos al proponer: crea la página de un componente nuevo y
 * pone al día la de uno que ya existe, así que nadie tiene que tocar este índice.
 */

export const components = Object.values(import.meta.glob('./componentes/*.js', { eager: true, import: 'default' }))
  .filter((entry) => entry?.slug && entry?.title)
  // Un solo orden, alfabético en español: los que llegan del laboratorio entran solos en su sitio.
  .sort((a, b) => a.title.localeCompare(b.title, 'es'));
