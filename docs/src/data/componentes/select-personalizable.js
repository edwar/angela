/**
 * Select personalizable
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "select-personalizable",
  title: "Select personalizable",
  summary: "La lista del select nativo toma el estilo de angela con appearance: base-select, sin JS. Se añade la variante de opciones con descripción. Donde no hay soporte, en táctil o en alto contraste se queda el select nativo.",
  examples: [
    {
      title: "Ejemplo",
      code: `<div class="stack">
  <div class="field">
    <label for="s-pais">País</label>
    <select class="input" id="s-pais" name="pais" autocomplete="country">
      <option value="">Elige un país</option>
      <option>Argentina</option>
      <option>Colombia</option>
      <option>España</option>
      <option>México</option>
    </select>
  </div>

  <!-- Variante: opciones con descripción. El botón hace que, cerrado, se vea solo el nombre. -->
  <div class="field">
    <label for="s-plan">Plan</label>
    <select class="input" id="s-plan" name="plan">
      <button type="button"><selectedcontent></selectedcontent></button>
      <option value="basico">Básico<span class="option-sep"> — </span><span class="option-hint">Gratis, 1 persona</span></option>
      <option value="pro" selected>Pro<span class="option-sep"> — </span><span class="option-hint">12 €/mes, hasta 5 personas</span></option>
      <option value="equipo">Equipo<span class="option-sep"> — </span><span class="option-hint">40 €/mes, personas ilimitadas</span></option>
    </select>
  </div>
</div>`,
    },
  ],
  api: [
    [".option-hint", "Clase del componente."],
    [".option-sep", "Clase del componente."],
  ],
  a11y: [
    "Sigue siendo el <select> nativo: el teclado (incluido escribir para saltar a una opción), Escape, el valor anunciado y el envío del formulario los pone el navegador.",
    "Cada select necesita su <label for> visible; la primera opción vacía no sustituye a la etiqueta.",
    "En pantallas táctiles se conserva el selector del sistema, más cómodo que una lista web.",
    "La opción elegida se marca con ✓ y negrita, no solo con color.",
    "Opciones con descripción: escribe el texto para que se entienda en una línea («Pro — 12 €/mes»); es lo que anuncia el lector y lo que se ve sin soporte.",
    "Para que el botón muestre solo el nombre, pon <button><selectedcontent></selectedcontent></button> como primer hijo del select.",
    "En alto contraste (forced-colors) se usa el select del sistema.",
  ],
};
