/**
 * flip-card
 * Generado desde el laboratorio al proponer el componente. Edítalo con libertad:
 * añade ejemplos, afina la tabla de API y completa las notas de accesibilidad.
 */
export default {
  slug: "flip-card",
  title: "flip-card",
  summary: "Tarjeta con dos caras que da la vuelta al pasar el ratón o al recibir el foco, para mostrar información extra en el reverso. El eje se elige con data-flip=\"vertical\" (horizontal por defecto) y la duración con --flip-duration.",
  examples: [
    {
      title: 'Ejemplo',
      code: "<div class=\"flip-container\">\n  <div class=\"flip-card\" data-flip=\"horizontal\" style=\"--flip-duration: 1.8s\">\n    <div class=\"flip-card-inner\">\n      <div class=\"flip-card-face flip-card-front\">Frente</div>\n      <div class=\"flip-card-face flip-card-back\">Reverso</div>\n    </div>\n  </div>\n  \n  <div class=\"flip-card\" data-flip=\"vertical\" style=\"--flip-duration: 1.8s\">\n    <div class=\"flip-card-inner\">\n      <div class=\"flip-card-face flip-card-front\">Frente</div>\n      <div class=\"flip-card-face flip-card-back\">Reverso</div>\n    </div>\n  </div>\n</div>",
    },
  ],
  api: [
    [".flip-card", "Clase del componente."],
    [".flip-container", "Clase del componente."],
    [".flip-card-inner", "Clase del componente."],
    [".flip-card-face", "Clase del componente."],
    [".flip-card-front", "Clase del componente."],
    [".flip-card-back", "Clase del componente."],
    ["data-flip", "vertical"],
    ["--flip-perspective", "Parámetro. Por defecto: 1000px."],
    ["--flip-duration", "Parámetro. Por defecto: 600ms."],
    ["--flip-giro", "Parámetro. Por defecto: rotateY(180deg)."],
  ],
  a11y: [
    "El reverso debe tener al menos un elemento enfocable (botón o enlace): así la tarjeta también gira con el teclado (:focus-within).",
    "En pantallas táctiles no hay hover: si el reverso tiene información importante, añade un botón «Dar la vuelta» o repítela en el frente.",
    "Las dos caras están siempre en el DOM: el lector de pantalla lee el frente y el reverso, en ese orden.",
    "Con prefers-reduced-motion la tarjeta cambia de cara sin animación.",
  ],
};
