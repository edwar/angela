/**
 * Diálogo
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "dialogo",
  title: "Diálogo",
  summary: "Modales con <dialog> nativo y comandos declarativos, sin trampas de foco a mano.",
  examples: [
    {
      title: "Formulario en modal",
      note: "Patrón CTA: botón de acción → modal con cabecera (título y cerrar), cuerpo con scroll y pie (Cancelar ghost + acción primaria). Se abre sin JS con command=\"show-modal\".",
      code: `<button class="button" type="button" commandfor="d-cliente" command="show-modal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Nuevo cliente</button>

<dialog class="dialog" id="d-cliente" aria-labelledby="d-cliente-titulo" closedby="any">
  <header class="dialog-header">
    <h2 id="d-cliente-titulo">Nuevo cliente</h2>
    <button class="button" type="button" data-variant="ghost" data-tone="neutral" data-icon-only
      commandfor="d-cliente" command="close" aria-label="Cerrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
  </header>
  <div class="dialog-body">
    <form id="d-cliente-form" class="stack" method="dialog">
      <div class="field">
        <label for="d-nombre">Nombre</label>
        <input class="input" id="d-nombre" name="nombre" required autocomplete="name" autofocus data-error="d-nombre-error">
        <p class="error" id="d-nombre-error">Escribe el nombre del cliente.</p>
      </div>
      <div class="field">
        <label for="d-email">Correo</label>
        <input class="input" id="d-email" name="email" type="email" autocomplete="email" data-error="d-email-error">
        <p class="error" id="d-email-error">Escribe un correo válido.</p>
      </div>
    </form>
  </div>
  <footer class="dialog-footer">
    <button class="button" type="button" data-variant="ghost" data-tone="neutral" commandfor="d-cliente" command="close">Cancelar</button>
    <button class="button" type="submit" form="d-cliente-form" value="guardar">Guardar cliente</button>
  </footer>
</dialog>`,
    },
    {
      title: "Confirmar una eliminación",
      note: "Toda eliminación pide confirmación. El foco inicial va a la opción segura (Cancelar). El diálogo devuelve el botón pulsado en dialog.returnValue.",
      code: `<button class="button" type="button" data-variant="outline" data-tone="danger" commandfor="d-borrar" command="show-modal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Eliminar proyecto</button>

<dialog class="dialog" id="d-borrar" data-size="sm" aria-labelledby="d-borrar-titulo" aria-describedby="d-borrar-desc">
  <div class="dialog-body stack" style="--stack-gap: var(--space-2)">
    <h2 id="d-borrar-titulo" style="font-size: var(--fs-lg); margin: 0">¿Eliminar el proyecto?</h2>
    <p id="d-borrar-desc" class="muted">Se borrarán sus 12 tareas. Esta acción no se puede deshacer.</p>
  </div>
  <form class="dialog-footer" method="dialog">
    <button class="button" value="cancelar" data-variant="ghost" data-tone="neutral" autofocus>Cancelar</button>
    <button class="button" value="eliminar" data-tone="danger">Eliminar</button>
  </form>
</dialog>`,
    },
  ],
  api: [
    [".dialog", "En <dialog>. data-size=\"sm|lg\" (32rem por defecto)."],
    [".dialog-header / -body / -footer", "Cabecera, cuerpo con scroll y pie de acciones."],
    [".dialog-form", "Un <form> que envuelve cabecera, cuerpo y pie, para que el botón de enviar del pie quede dentro del formulario."],
    ["command=\"show-modal\"", "En el botón que abre, junto con commandfor=\"id-del-diálogo\"."],
    ["command=\"close\"", "Cierra el diálogo. Fuera de un <form>, o con type=\"button\"."],
    ["closedby=\"any\"", "Permite cerrar con clic fuera (@angela-ui/angela/js lo completa en Safari)."],
  ],
  a11y: [
    "El navegador vuelve inerte la página, contiene el foco, cierra con Esc y devuelve el foco al botón que lo abrió. No añadas role=\"dialog\", aria-modal ni trampas de foco.",
    "Nombra el diálogo con aria-labelledby apuntando a su título.",
    "Pon autofocus en el primer campo, o en la opción segura si la acción es destructiva.",
    "El fondo no se desplaza mientras el modal está abierto (overscroll-behavior, sin overflow:hidden en <body>).",
    "Animación corta; con movimiento reducido solo se desvanece.",
  ],
};
