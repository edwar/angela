/**
 * Radio
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "radio",
  title: "Radio",
  summary: "Botones de opción nativos para elegir una sola opción de un grupo.",
  examples: [
    {
      title: "Radios",
      note: "De 2 a 5 opciones excluyentes: radios visibles. Con 6 o más, mejor un select.",
      code: `<fieldset class="fieldset">
  <legend>Plan</legend>
  <div class="choice">
    <input type="radio" id="r-mensual" name="plan" value="mensual" checked>
    <label for="r-mensual">Mensual</label>
  </div>
  <div class="choice">
    <input type="radio" id="r-anual" name="plan" value="anual" aria-describedby="r-anual-hint">
    <div>
      <label for="r-anual">Anual</label>
      <p class="hint" id="r-anual-hint">Ahorras dos meses.</p>
    </div>
  </div>
  <div class="choice">
    <input type="radio" id="r-empresa" name="plan" value="empresa" disabled>
    <label for="r-empresa">Empresa (próximamente)</label>
  </div>
</fieldset>`,
    },
  ],
  api: [
    [".choice", "Fila con el control y su etiqueta (o un bloque etiqueta + ayuda)."],
    [".fieldset", "Agrupa el grupo de radios con su <legend>: es obligatorio, es la pregunta."],
    ["name", "El mismo en todos los radios del grupo: es lo que los hace excluyentes."],
  ],
  a11y: [
    "Siempre en grupo, dentro de <fieldset> con <legend>: el lector anuncia la pregunta y «1 de 3».",
    "Teclado nativo: Tab entra al grupo (en la opción elegida) y las flechas cambian la selección; solo un radio del grupo está en el orden de Tab.",
    "Marca una opción por defecto cuando haya una razonable; si no elegir es válido, añade una opción «Ninguno».",
    "La etiqueta va después del control y también es área de clic. El color de marca se aplica con accent-color.",
  ],
};
