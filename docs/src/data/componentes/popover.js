/**
 * Popover
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "popover",
  title: "Popover",
  summary: "Paneles anclados a su botón con la API Popover y CSS Anchor Positioning.",
  examples: [
    {
      title: "Grupo de acciones",
      note: "Se cierra con Esc o al hacer clic fuera. No es un menú ARIA: se recorre con Tab, sin flechas. Si el navegador no soporta anclaje, aparece como hoja inferior.",
      code: `<button class="button" type="button" data-variant="outline" data-tone="neutral" commandfor="p-acciones" command="toggle-popover">Acciones <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
<div class="popover" id="p-acciones" popover>
  <button class="popover-item" type="button" commandfor="p-acciones" command="hide-popover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/></svg> Renombrar</button>
  <button class="popover-item" type="button" commandfor="p-acciones" command="hide-popover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> Duplicar <span class="popover-hint" aria-hidden="true">Ctrl D</span></button>
  <hr>
  <button class="popover-item" type="button" data-tone="danger" commandfor="p-acciones" command="hide-popover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Eliminar</button>
</div>`,
    },
    {
      title: "Panel informativo",
      code: `<button class="button" type="button" data-variant="ghost" commandfor="p-info" command="toggle-popover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> ¿Qué es esto?</button>
<div class="popover prose" id="p-info" popover data-padding="lg">
  <p style="margin: 0">El saldo disponible descuenta los pagos que aún están en proceso.</p>
</div>`,
    },
  ],
  api: [
    [".popover", "En un elemento con el atributo popover."],
    ["data-padding=\"lg\"", "Más relleno para contenido de texto."],
    [".popover-item", "Botón o enlace de acción dentro del panel. Admite data-tone."],
    ["command=\"toggle-popover\"", "En el botón que lo abre, con commandfor=\"id\"."],
  ],
  a11y: [
    "El botón expone automáticamente su estado expandido; no añadas aria-haspopup (prometería un menú ARIA).",
    "Coloca el panel justo después de su botón en el DOM, para que el orden de lectura sea natural.",
    "Al cerrar desde un botón interno, @angela-ui/angela/js devuelve el foco al botón que lo abrió.",
    "Para un menú con flechas (role=\"menu\") hace falta más comportamiento: está en la hoja de ruta.",
  ],
};
