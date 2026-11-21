/**
 * Cinta
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "cinta",
  title: "Cinta",
  summary: "Cinta de texto en movimiento continuo, solo con CSS, con un interruptor para pausarla. Con «reducir movimiento» muestra el texto completo y quieto. El tono se elige con data-tone, y la velocidad y la separación con --marquee-duration y --marquee-gap.",
  examples: [
    {
      title: "Ejemplo",
      code: `<div class="marquee">
  <div class="marquee-track">
    <span>Tomate <span aria-hidden="true">✧</span> Cebolla <span aria-hidden="true">✧</span> Ajo <span aria-hidden="true">✧</span> Huevo <span aria-hidden="true">✧</span></span>
    <span aria-hidden="true">Tomate ✧ Cebolla ✧ Ajo ✧ Huevo ✧</span>
  </div>
  <div class="choice marquee-pause">
    <input type="checkbox" role="switch" switch id="cinta-pausa">
    <label for="cinta-pausa">Pausar</label>
  </div>
</div>`,
    },
  ],
  api: [
    [".marquee", "Clase del componente."],
    [".marquee-track", "Clase del componente."],
    [".marquee-pause", "Clase del componente."],
    ["--tone-solid", "Parámetro. Por defecto: var(--color-brand-solid)."],
    ["--tone-on-solid", "Parámetro. Por defecto: var(--color-brand-on-solid)."],
    ["--marquee-gap", "Parámetro."],
    ["--marquee-duration", "Parámetro."],
  ],
  a11y: [
    "Incluye siempre el interruptor «Pausar» (.choice con role=\"switch\"): el movimiento dura más de 5 s y se tiene que poder detener (WCAG 2.2.2). También se detiene al pasar el ratón.",
    "El lector de pantalla anuncia el control como «Pausar, interruptor»: activado significa que la cinta está detenida. Usa un id distinto en cada cinta de la página.",
    "Con prefers-reduced-motion no se mueve: el texto se muestra completo en varias líneas y el interruptor se oculta.",
    "La segunda copia del texto lleva aria-hidden=\"true\": el lector de pantalla la lee una sola vez.",
    "Los separadores decorativos (✧) van con aria-hidden=\"true\".",
    "Texto y fondo usan --tone-on-solid y --tone-solid, con el contraste garantizado por la paleta. Dentro de la cinta, el interruptor invierte sus colores y su estado se distingue por la posición del círculo, no solo por el color.",
  ],
};
