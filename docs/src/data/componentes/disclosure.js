/**
 * Desplegable y acordeón
 * Generado desde el laboratorio al proponer el componente. Edítalo con libertad:
 * añade ejemplos, afina la tabla de API y completa las notas de accesibilidad.
 */
export default {
  slug: "disclosure",
  title: "Desplegable y acordeón",
  summary: "El acordeón pasa a ser un bloque con borde y filas táctiles de 48 px, como pide la guía de estilos. Los <details> directos de .accordion ya no necesitan clase, y el caret se puede cambiar de icono (--disclosure-icon) y de sitio (data-marker=\"end\").",
  examples: [
    {
      title: 'Ejemplo',
      code: "<!-- Desplegable -->\n<details class=\"disclosure\">\n  <summary>¿Puedo cambiar de plan más adelante?</summary>\n  <p>Sí. El cambio se aplica en tu siguiente factura y se prorratea el importe.</p>\n</details>\n\n<!-- Acordeón: los <details> directos no necesitan clase -->\n<section class=\"accordion\" aria-labelledby=\"acc-titulo\">\n  <h2 id=\"acc-titulo\">Preguntas frecuentes</h2>\n  <details open name=\"faq\">\n    <summary>¿Cómo cambio la paleta?</summary>\n    <p>Cambia <code>--angela-brand-h</code> y <code>--angela-brand-c</code> en <code>:root</code>. Todo lo demás se recalcula.</p>\n  </details>\n  <details name=\"faq\">\n    <summary>¿Necesito JavaScript?</summary>\n    <p>No para los estilos. <code>@angela-ui/angela/js</code> solo añade mejoras: validación accesible, pestañas y tema.</p>\n  </details>\n  <details name=\"faq\">\n    <summary>¿Funciona con Tailwind?</summary>\n    <p>Sí. Importa <code>@angela-ui/angela/tailwind.css</code> para usar los tokens como utilidades.</p>\n  </details>\n</section>\n\n<!-- Caret a la derecha -->\n<section class=\"accordion\" data-marker=\"end\" aria-labelledby=\"acc-titulo\">\n  <details>\n    <summary>¿Funciona con Tailwind?</summary>\n    <p>Sí. Importa <code>@angela-ui/angela/tailwind.css</code> para usar los tokens como utilidades.</p>\n  </details>\n</section>\n\n<!-- Icono propio: un + que se convierte en × al abrir -->\n<section class=\"accordion\" data-marker=\"end\" style=\"--disclosure-icon: url('/iconos/plus.svg'); --disclosure-rotate-open: 45deg\" aria-labelledby=\"acc-titulo\">\n  <details>\n    <summary>¿Funciona con Tailwind?</summary>\n    <p>Sí. Importa <code>@angela-ui/angela/tailwind.css</code> para usar los tokens como utilidades.</p>\n  </details>\n</section>",
    },
  ],
  api: [
    [".disclosure", "Clase del componente."],
    [".accordion", "Clase del componente."],
    ["data-marker", "end"],
    ["--disclosure-pad", "Parámetro. Por defecto: 0px."],
    ["--disclosure-marker", "Parámetro. Por defecto: calc(1em + var(--space-2))."],
    ["--disclosure-icon", "Parámetro. Por defecto: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M5.2 7.2a1 1 0 0 1 1.4 0L10 10.6l3.4-3.4a1 1 0 1 1 1.4 1.4l-4.1 4.1a1 1 0 0 1-1.4 0L5.2 8.6a1 1 0 0 1 0-1.4Z'/%3E%3C/svg%3E\")."],
    ["--disclosure-rotate", "Parámetro. Por defecto: -90deg."],
    ["--disclosure-rotate-open", "Parámetro. Por defecto: 0deg."],
    ["--disclosure-dir", "Parámetro. Por defecto: 1."],
  ],
  a11y: [
    "No pongas encabezados dentro de <summary>: JAWS y TalkBack lo anuncian como botón y descartan el encabezado.",
    "Da nombre al acordeón con un encabezado y aria-labelledby (o aria-label si no hay título visible); no lo conviertas en región por defecto.",
    "Sin flechas ni tabindex itinerante: cada pregunta es una parada de Tab y se abre con Enter o Espacio.",
    "El estado abierto no depende solo del color: el caret gira y el lector anuncia expandido o contraído.",
    "El foco usa un anillo de 2 px hacia dentro para que el borde del bloque no lo tape.",
    "El contenido cerrado se puede buscar con Ctrl+F y se abre al encontrarlo.",
    "Evita name (exclusivo) salvo que el diseño lo exija: impide comparar respuestas y mueve el contenido fuera de la vista de quien usa lupa.",
    "Con data-marker=\"end\" en un acordeón ancho, el caret queda lejos de su pregunta: limita el ancho o déjalo junto al texto.",
    "El icono propio tiene que ser un SVG de un solo color: se pinta como máscara y así se ve en alto contraste (forced-colors).",
  ],
};
