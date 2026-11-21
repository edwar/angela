/**
 * Calendario
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "calendario",
  title: "Calendario",
  summary: "Calendario de fecha única o de rango sobre <input type=\"date\">, en línea o como selector en un popover nativo. Sin JS se usan los inputs nativos; con JS, cuadrícula accesible con teclado, idioma y primer día de la semana desde lang, min/max y evento calendarchange.",
  examples: [
    {
      title: "Selector de fecha",
      code: `<div class="field">
  <label id="cita-etiqueta" for="cita-boton">Fecha de la cita</label>
  <button class="button calendar-trigger" id="cita-boton" type="button" data-variant="outline" data-tone="neutral" commandfor="cita-panel" command="toggle-popover" aria-labelledby="cita-etiqueta cita-valor">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    <span class="calendar-value" id="cita-valor">Elige una fecha</span>
  </button>
  <div class="popover" id="cita-panel" popover>
    <div class="calendar" data-mode="single">
      <div class="calendar-fallback field">
        <label for="cita">Fecha de la cita</label>
        <input class="input" id="cita" type="date" name="cita" min="2026-11-01" max="2027-03-31">
      </div>
    </div>
  </div>
</div>`,
    },
    {
      title: "Selector de rango",
      code: `<div class="field">
  <label id="viaje-etiqueta" for="viaje-boton">Fechas del viaje</label>
  <button class="button calendar-trigger" id="viaje-boton" type="button" data-variant="outline" data-tone="neutral" commandfor="viaje-panel" command="toggle-popover" aria-labelledby="viaje-etiqueta viaje-valor">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    <span class="calendar-value" id="viaje-valor">Elige las fechas</span>
  </button>
  <div class="popover" id="viaje-panel" popover>
    <div class="calendar" data-mode="range">
      <div class="calendar-fallback">
        <div class="field">
          <label for="viaje-inicio">Ida</label>
          <input class="input" id="viaje-inicio" type="date" name="inicio" value="2026-11-23">
        </div>
        <div class="field">
          <label for="viaje-fin">Vuelta</label>
          <input class="input" id="viaje-fin" type="date" name="fin" value="2026-11-27">
        </div>
      </div>
    </div>
  </div>
</div>`,
    },
    {
      title: "Siempre visible (sin popover)",
      code: `<div class="calendar" data-mode="single">
  <div class="calendar-fallback field">
    <label for="entrega">Fecha de entrega</label>
    <input class="input" id="entrega" type="date" name="entrega">
  </div>
</div>`,
    },
  ],
  api: [
    [".calendar", "Clase del componente."],
    [".calendar-fallback", "Clase del componente."],
    [".calendar-header", "Clase del componente."],
    [".calendar-title", "Clase del componente."],
    [".calendar-grid", "Clase del componente."],
    [".calendar-day", "Clase del componente."],
    [".popover", "Clase del componente."],
    [".calendar-trigger", "Clase del componente."],
    [".calendar-value", "Clase del componente."],
    [".calendar-status", "Clase del componente."],
    ["data-size", "sm"],
    ["data-date", "Atributo sin valor (presente o ausente)."],
    ["data-in-range", "Atributo sin valor (presente o ausente)."],
    ["data-preview", "Atributo sin valor (presente o ausente)."],
    ["data-range-start", "Atributo sin valor (presente o ausente)."],
    ["data-range-end", "Atributo sin valor (presente o ausente)."],
    ["data-placeholder", "Atributo sin valor (presente o ausente)."],
    ["--tone-solid", "Parámetro. Por defecto: var(--color-brand-solid)."],
    ["--tone-solid-hover", "Parámetro. Por defecto: var(--color-brand-solid-hover)."],
    ["--tone-on-solid", "Parámetro. Por defecto: var(--color-brand-on-solid)."],
    ["--tone-subtle", "Parámetro. Por defecto: var(--color-brand-subtle)."],
    ["--tone-subtle-hover", "Parámetro. Por defecto: var(--color-brand-subtle-hover)."],
    ["--tone-border", "Parámetro. Por defecto: var(--color-brand-border)."],
    ["--tone-text", "Parámetro. Por defecto: var(--color-brand-text)."],
  ],
  a11y: [
    "Cuadrícula con el patrón WAI-ARIA (role=\"grid\"): flechas mueven el día, Inicio y Fin la semana, RePág y AvPág el mes (con Mayús, el año), Intro o Espacio eligen. Respeta RTL.",
    "Cada día se anuncia con la fecha completa («sábado, 21 de noviembre de 2026»); hoy lleva aria-current=\"date\" y se marca con borde y negrita, no solo con color.",
    "En rango, la cuadrícula es aria-multiselectable y todos los días del tramo llevan aria-selected; una región aria-live anuncia lo elegido o pide la fecha de fin.",
    "Los días fuera de min/max llevan aria-disabled y se ven tachados; los botones de mes anterior y siguiente se desactivan en los límites.",
    "En el selector, el botón lleva aria-labelledby con la etiqueta y el valor («Fecha de la cita, 25 nov 2026»); al abrir, el foco va al día elegido y, al elegir, el panel se cierra y el foco vuelve al botón.",
    "Sin JS se ven los <input type=\"date\"> nativos con su <label>: el formulario sigue funcionando.",
  ],
};
