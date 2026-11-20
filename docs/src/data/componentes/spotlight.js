/**
 * Spotlight
 * Generado desde el laboratorio al proponer el componente. Edítalo con libertad:
 * añade ejemplos, afina la tabla de API y completa las notas de accesibilidad.
 */
export default {
  slug: "spotlight",
  title: "Spotlight",
  summary: "Un punto de luz que sigue al puntero y revela el contenido por partes, sin mostrarlo todo de golpe. Funciona con solo CSS para el degradado y un JS mínimo que pasa la posición del puntero.",
  examples: [
    {
      title: 'Ejemplo',
      code: "<div class=\"spotlight\">\n  <img src=\"https://placehold.co/400\" alt=\"Describe aquí lo que muestra la imagen\">\n  <div class=\"spotlight-overlay\"></div>\n</div>",
    },
  ],
  api: [
    [".spotlight", "Clase del componente."],
    [".spotlight-overlay", "Clase del componente."],
    ["--spotlight-radius", "Parámetro. Por defecto: 120px."],
    ["--spotlight-shade", "Parámetro. Por defecto: color-mix(in oklch, var(--color-canvas) 100%, transparent)."],
  ],
  a11y: [
    "El velo es solo visual: el contenido sigue completo en el DOM, así que el lector de pantalla lo lee entero. Si la imagen informa, necesita un alt que la describa.",
    "La luz sigue al puntero; con teclado no se puede mover. Úsalo solo para contenido decorativo o que esté disponible de otra forma.",
    "En pantallas táctiles solo se revela arrastrando el dedo.",
    "El deslizamiento de la luz va dentro de prefers-reduced-motion: no-preference; con el movimiento reducido salta de un punto a otro.",
    "El color del velo sale de --color-canvas, así que se adapta al modo claro y oscuro.",
  ],
};
