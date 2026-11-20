/**
 * flip-card
 * Generado desde el laboratorio al proponer el componente. Edítalo con libertad:
 * añade ejemplos, afina la tabla de API y completa las notas de accesibilidad.
 */
export default {
  slug: "flip-card",
  title: "Tarjeta giratoria",
  summary: "Tarjeta con dos caras que da la vuelta al pasar el ratón o al recibir el foco, para mostrar información extra en el reverso. El eje se elige con data-flip=\"vertical\" (horizontal por defecto) y la duración con --flip-duration.",
  examples: [
    {
      title: 'Ejemplo',
      code: "<div class=\"flip-container\">\n  <div class=\"flip-card\" data-flip=\"horizontal\" style=\"--flip-duration: 1.8s\">\n    <div class=\"flip-card-inner\">\n      <div class=\"flip-card-face flip-card-front\">Frente</div>\n      <div class=\"flip-card-face flip-card-back\">Reverso</div>\n    </div>\n  </div>\n  \n  <div class=\"flip-card\" data-flip=\"vertical\" style=\"--flip-duration: 1.8s\">\n    <div class=\"flip-card-inner\">\n      <div class=\"flip-card-face flip-card-front\">Frente</div>\n      <div class=\"flip-card-face flip-card-back\">Reverso</div>\n    </div>\n  </div>\n</div>",
    },
  ],
  api: [
    [".flip-card", "La tarjeta: marca la perspectiva y gira al pasar el ratón o al recibir el foco algo de dentro."],
    [".flip-container", "Opcional: agrupa varias tarjetas en fila; pasan a la siguiente línea si no caben."],
    [".flip-card-inner", "La pieza que gira: contiene las dos caras."],
    [".flip-card-face", "Cada cara: ocupa toda la tarjeta y oculta su dorso."],
    [".flip-card-front", "Cara visible al principio, sobre la superficie."],
    [".flip-card-back", "Reverso, en el color neutro sólido."],
    ["data-flip=\"vertical\"", "Gira sobre el eje X (como un calendario de mesa). Sin el atributo, gira en horizontal (como una página)."],
    ["--flip-perspective", "Profundidad del giro. Por defecto: 1000px."],
    ["--flip-duration", "Duración del giro. Por defecto: 600ms. Con prefers-reduced-motion no hay animación."],
    ["--flip-giro", "Giro que aplican la tarjeta y el reverso. Por defecto: rotateY(180deg); data-flip lo cambia."],
  ],
  a11y: [
    "El reverso debe tener al menos un elemento enfocable (botón o enlace): así la tarjeta también gira con el teclado (:focus-within).",
    "En pantallas táctiles no hay hover: si el reverso tiene información importante, añade un botón «Dar la vuelta» o repítela en el frente.",
    "Las dos caras están siempre en el DOM: el lector de pantalla lee el frente y el reverso, en ese orden.",
    "Con prefers-reduced-motion la tarjeta cambia de cara sin animación.",
  ],
};
