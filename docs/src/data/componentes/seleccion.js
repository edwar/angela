/**
 * Selección
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "seleccion",
  title: "Selección",
  summary: "Casillas, radios e interruptores nativos, teñidos con el color de marca.",
  examples: [
    {
      title: "Casillas",
      note: "Para opciones independientes. Agrupa con <fieldset> y <legend>.",
      code: `<fieldset class="fieldset">
  <legend>Notificaciones</legend>
  <div class="choice">
    <input type="checkbox" id="s-email" name="notif" value="email" checked>
    <label for="s-email">Por correo</label>
  </div>
  <div class="choice">
    <input type="checkbox" id="s-sms" name="notif" value="sms">
    <label for="s-sms">Por SMS</label>
  </div>
  <div class="choice">
    <input type="checkbox" id="s-push" name="notif" value="push" disabled>
    <label for="s-push">Notificaciones push (próximamente)</label>
  </div>
</fieldset>`,
    },
    {
      title: "Radios",
      note: "De 2 a 5 opciones excluyentes: radios visibles. Con 6 o más, mejor un select.",
      code: `<fieldset class="fieldset">
  <legend>Plan</legend>
  <div class="choice">
    <input type="radio" id="s-mensual" name="plan" value="mensual" checked>
    <label for="s-mensual">Mensual</label>
  </div>
  <div class="choice">
    <input type="radio" id="s-anual" name="plan" value="anual" aria-describedby="s-anual-hint">
    <div>
      <label for="s-anual">Anual</label>
      <p class="hint" id="s-anual-hint">Ahorras dos meses.</p>
    </div>
  </div>
</fieldset>`,
    },
    {
      title: "Interruptor",
      note: "Un checkbox con role=\"switch\": se anuncia como \"activado/desactivado\". El atributo switch lo hace nativo en Safari.",
      code: `<div class="choice">
  <input type="checkbox" role="switch" switch id="s-oscuro" name="modo-oscuro">
  <label for="s-oscuro">Recibir resumen semanal</label>
</div>`,
    },
  ],
  api: [
    [".choice", "Fila con el control y su etiqueta (o un bloque etiqueta + ayuda)."],
    ["role=\"switch\" / switch", "Convierte un checkbox en interruptor."],
    [".fieldset", "Agrupa opciones relacionadas con su <legend>."],
  ],
  a11y: [
    "Controles 100 % nativos: teclado, lectores de pantalla y estado indeterminado gratis.",
    "La etiqueta va después del control y también es área de clic.",
    "El color de marca se aplica con accent-color; el interruptor cumple contraste 3:1 en ambos estados.",
    "En modo de alto contraste el interruptor usa colores del sistema.",
  ],
};
