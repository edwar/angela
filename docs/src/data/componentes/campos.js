/**
 * Campos de texto
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "campos",
  title: "Campos de texto",
  summary: "Input, select y textarea nativos con etiqueta, ayuda y error accesible.",
  examples: [
    {
      title: "Campo con ayuda",
      note: "La etiqueta va siempre visible y antes del control. La ayuda se enlaza con aria-describedby.",
      code: `<div class="field">
  <label for="c-nombre">Nombre completo</label>
  <p class="hint" id="c-nombre-hint">Como aparece en tu documento.</p>
  <input class="input" id="c-nombre" name="nombre" autocomplete="name" aria-describedby="c-nombre-hint">
</div>`,
    },
    {
      title: "Validación accesible",
      note: "El error aparece al salir del campo (no mientras escribes) gracias a :user-invalid. @angela-ui/angela/js sincroniza aria-invalid, enlaza el mensaje y lo anuncia. Prueba a escribir un correo incompleto y salir del campo, o envía el formulario vacío.",
      code: `<form class="stack" action="#" method="post" aria-labelledby="c-form-titulo">
  <h4 id="c-form-titulo">Crear cuenta</h4>
  <div class="field">
    <label for="c-email">Correo <span aria-hidden="true">*</span></label>
    <input class="input" id="c-email" name="email" type="email" required autocomplete="email"
      autocapitalize="none" spellcheck="false" data-error="c-email-error">
    <p class="error" id="c-email-error">Escribe un correo válido, por ejemplo ana@correo.com.</p>
  </div>
  <div class="field">
    <label for="c-pass">Contraseña <span aria-hidden="true">*</span></label>
    <p class="hint" id="c-pass-hint">Mínimo 8 caracteres.</p>
    <input class="input" id="c-pass" name="password" type="password" required minlength="8"
      autocomplete="new-password" aria-describedby="c-pass-hint" data-error="c-pass-error">
    <p class="error" id="c-pass-error">La contraseña necesita al menos 8 caracteres.</p>
  </div>
  <div class="cluster">
    <button class="button" type="submit">Crear cuenta</button>
  </div>
</form>`,
    },
    {
      title: "Error del servidor",
      note: "Si el error viene del servidor, renderiza aria-invalid=\"true\" y enlaza el mensaje en aria-describedby. El script lo respeta.",
      code: `<div class="field">
  <label for="c-usuario">Usuario</label>
  <input class="input" id="c-usuario" name="usuario" value="ana" aria-invalid="true"
    aria-describedby="c-usuario-error" autocapitalize="none" spellcheck="false">
  <p class="error" id="c-usuario-error">Ese usuario ya existe. Prueba con otro.</p>
</div>`,
    },
    {
      title: "Select y textarea",
      note: "El select es nativo: en móvil abre el selector del sistema. El textarea crece con el contenido donde se soporta field-sizing.",
      code: `<div class="stack">
  <div class="field">
    <label for="c-pais">País</label>
    <select class="input" id="c-pais" name="pais" autocomplete="country">
      <option value="">Elige un país</option>
      <option>Argentina</option>
      <option>Colombia</option>
      <option>España</option>
      <option>México</option>
      <option>Perú</option>
      <option>Chile</option>
    </select>
  </div>
  <div class="field">
    <label for="c-mensaje">Mensaje</label>
    <textarea class="input" id="c-mensaje" name="mensaje"></textarea>
  </div>
</div>`,
    },
    {
      title: "Deshabilitado y solo lectura",
      code: `<div class="stack">
  <div class="field">
    <label for="c-dis">Código de cliente</label>
    <input class="input" id="c-dis" value="CL-2048" disabled>
  </div>
  <div class="field">
    <label for="c-ro">Fecha de alta</label>
    <input class="input" id="c-ro" value="18/11/2026" readonly>
  </div>
</div>`,
    },
  ],
  api: [
    [".field", "Contenedor: etiqueta, ayuda, control y error en una columna."],
    [".input", "Para <input>, <select> y <textarea>. data-size=\"sm|lg\"."],
    [".hint", "Texto de ayuda. Enlázalo con aria-describedby."],
    [".error", "Mensaje de error. Se muestra con :user-invalid o aria-invalid=\"true\"."],
    ["data-error", "En el control: id de su mensaje de error (lo usa @angela-ui/angela/js)."],
    [".fieldset", "Para <fieldset> con <legend> como primer hijo."],
  ],
  a11y: [
    "Cada control tiene un <label for> visible. El placeholder nunca sustituye a la etiqueta.",
    "Usa los atributos nativos: required, minlength, pattern, type=\"email\"… y autocomplete para datos personales.",
    "El error no se muestra antes de interactuar y no se anuncia en cada tecla.",
    "El estado de error se comunica con texto e ícono, no solo con color.",
    "Fuente de 16 px mínimo en los controles para evitar el zoom de iOS.",
    "Inputs numéricos: usa inputmode=\"numeric\" con type=\"text\" para códigos, tarjetas o documentos (sin ceros perdidos).",
  ],
};
