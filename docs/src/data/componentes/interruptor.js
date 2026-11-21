/**
 * Interruptor
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "interruptor",
  title: "Interruptor",
  summary: "Un checkbox nativo con aspecto de interruptor, para activar o desactivar algo al momento.",
  examples: [
    {
      title: "Interruptor",
      note: "Un checkbox con role=\"switch\": se anuncia como «activado/desactivado». El atributo switch lo hace nativo en Safari.",
      code: `<div class="choice">
  <input type="checkbox" role="switch" switch id="i-resumen" name="resumen">
  <label for="i-resumen">Recibir el resumen semanal</label>
</div>`,
    },
    {
      title: "Lista de ajustes",
      note: "Cada interruptor se aplica solo, sin botón de guardar.",
      code: `<fieldset class="fieldset">
  <legend>Privacidad</legend>
  <div class="choice">
    <input type="checkbox" role="switch" switch id="i-perfil" name="perfil" checked>
    <label for="i-perfil">Perfil público</label>
  </div>
  <div class="choice">
    <input type="checkbox" role="switch" switch id="i-actividad" name="actividad" aria-describedby="i-actividad-hint">
    <div>
      <label for="i-actividad">Mostrar mi actividad</label>
      <p class="hint" id="i-actividad-hint">Tus contactos ven cuándo te conectaste.</p>
    </div>
  </div>
  <div class="choice">
    <input type="checkbox" role="switch" switch id="i-beta" name="beta" disabled>
    <label for="i-beta">Funciones en pruebas (próximamente)</label>
  </div>
</fieldset>`,
    },
  ],
  api: [
    ["role=\"switch\" / switch", "Convierte un checkbox en interruptor. role da el anuncio «activado/desactivado»; switch, el control nativo de Safari."],
    [".choice", "Fila con el control y su etiqueta (o un bloque etiqueta + ayuda)."],
  ],
  a11y: [
    "Para cambios que se aplican al momento. En un formulario que se envía con un botón, usa una casilla.",
    "Espacio lo activa y desactiva; el lector anuncia «interruptor, activado» o «desactivado».",
    "La etiqueta dice qué se activa, no el estado («Perfil público», no «Activado»): el estado lo da el control.",
    "El estado no depende solo del color: la bola cambia de lado. Contraste 3:1 en ambos estados y colores del sistema en alto contraste.",
  ],
};
