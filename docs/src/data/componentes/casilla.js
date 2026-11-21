/**
 * Casilla
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "casilla",
  title: "Casilla",
  summary: "Casillas de verificación nativas para opciones independientes, teñidas con el color de marca.",
  examples: [
    {
      title: "Casillas",
      note: "Para opciones independientes: se puede marcar cualquier combinación. Agrupa las relacionadas con <fieldset> y <legend>.",
      code: `<fieldset class="fieldset">
  <legend>Notificaciones</legend>
  <div class="choice">
    <input type="checkbox" id="c-email" name="notif" value="email" checked>
    <label for="c-email">Por correo</label>
  </div>
  <div class="choice">
    <input type="checkbox" id="c-sms" name="notif" value="sms">
    <label for="c-sms">Por SMS</label>
  </div>
  <div class="choice">
    <input type="checkbox" id="c-push" name="notif" value="push" disabled>
    <label for="c-push">Notificaciones push (próximamente)</label>
  </div>
</fieldset>`,
    },
    {
      title: "Con ayuda",
      note: "El texto de ayuda va bajo la etiqueta y se enlaza con aria-describedby.",
      code: `<div class="choice">
  <input type="checkbox" id="c-terminos" name="terminos" required aria-describedby="c-terminos-hint">
  <div>
    <label for="c-terminos">Acepto los términos</label>
    <p class="hint" id="c-terminos-hint">Puedes leerlos antes de crear la cuenta.</p>
  </div>
</div>`,
    },
  ],
  api: [
    [".choice", "Fila con el control y su etiqueta (o un bloque etiqueta + ayuda)."],
    [".fieldset", "Agrupa opciones relacionadas con su <legend>."],
    ["indeterminate", "Estado mixto (p. ej. «seleccionar todo» con solo algunas marcadas): se pone por JS, input.indeterminate = true."],
  ],
  a11y: [
    "Control 100 % nativo: Espacio marca y desmarca, y el lector de pantalla anuncia «marcada», «sin marcar» o «mixta».",
    "La etiqueta va después del control y también es área de clic.",
    "Un grupo de casillas va en <fieldset> con <legend>: el lector lee la pregunta antes de cada opción.",
    "El color de marca se aplica con accent-color; en alto contraste se ven los colores del sistema.",
  ],
};
