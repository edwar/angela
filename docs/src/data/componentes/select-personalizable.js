/**
 * Select personalizable
 * Generado desde el laboratorio al proponer el componente. Edítalo con libertad:
 * añade ejemplos, afina la tabla de API y completa las notas de accesibilidad.
 */
export default {
  slug: "select-personalizable",
  title: "Select personalizable",
  summary: "La lista del select nativo toma el estilo de angela con appearance: base-select, sin JS. Se añade la variante de opciones con descripción. Donde no hay soporte, en táctil o en alto contraste se queda el select nativo.",
  examples: [
    {
      title: 'Ejemplo',
      code: "<div class=\"stack\">\n  <div class=\"field\">\n    <label for=\"s-pais\">País</label>\n    <select class=\"input\" id=\"s-pais\" name=\"pais\" autocomplete=\"country\">\n      <option value=\"\">Elige un país</option>\n      <option>Argentina</option>\n      <option>Colombia</option>\n      <option>España</option>\n      <option>México</option>\n    </select>\n  </div>\n\n  <!-- Variante: opciones con descripción. El botón hace que, cerrado, se vea solo el nombre. -->\n  <div class=\"field\">\n    <label for=\"s-plan\">Plan</label>\n    <select class=\"input\" id=\"s-plan\" name=\"plan\">\n      <button type=\"button\"><selectedcontent></selectedcontent></button>\n      <option value=\"basico\">Básico<span class=\"option-sep\"> — </span><span class=\"option-hint\">Gratis, 1 persona</span></option>\n      <option value=\"pro\" selected>Pro<span class=\"option-sep\"> — </span><span class=\"option-hint\">12 €/mes, hasta 5 personas</span></option>\n      <option value=\"equipo\">Equipo<span class=\"option-sep\"> — </span><span class=\"option-hint\">40 €/mes, personas ilimitadas</span></option>\n    </select>\n  </div>\n</div>",
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
