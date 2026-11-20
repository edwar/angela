/**
 * Pequeñas mejoras para <dialog> y [popover] nativos.
 */

/**
 * closedby="any" (cerrar al hacer clic fuera) aún no existe en Safari.
 * Sin él, el modal sigue cerrándose con Esc y el gesto atrás; esto solo añade el clic fuera.
 * @param {Document|HTMLElement} [root]
 * @returns {() => void} función para desconectar
 */
export function enhanceDialogs(root = globalThis.document) {
  // Seguro en el servidor: sin DOM no hay nada que mejorar.
  if (typeof window === 'undefined' || !root) return () => {};
  if (typeof HTMLDialogElement === 'undefined' || 'closedBy' in HTMLDialogElement.prototype) return () => {};

  // Se compara la posición del puntero y no event.target: el propio <dialog> también es el
  // target de los clics en su padding.
  const outside = (e, dialog) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  let pressedOutside = false;
  const onDown = (e) => {
    const dialog = e.target.closest?.('dialog[closedby="any"]');
    pressedOutside = !!dialog && outside(e, dialog);
  };
  const onUp = (e) => {
    const dialog = e.target.closest?.('dialog[closedby="any"]');
    // Pulsar y soltar fuera: así un arrastre para seleccionar texto no cierra el diálogo.
    if (dialog?.open && pressedOutside && outside(e, dialog)) dialog.close();
    pressedOutside = false;
  };
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointerup', onUp);
  return () => {
    root.removeEventListener('pointerdown', onDown);
    root.removeEventListener('pointerup', onUp);
  };
}

/**
 * Al cerrar un popover desde un botón que está dentro de él, el foco se perdería
 * (el botón desaparece). Lo devolvemos al botón que lo abrió.
 * @param {Document|HTMLElement} [root]
 * @returns {() => void} función para desconectar
 */
export function enhancePopovers(root = globalThis.document) {
  // Seguro en el servidor: sin DOM no hay nada que mejorar.
  if (typeof window === 'undefined' || !root) return () => {};
  const invokers = new WeakMap();
  const onBeforeToggle = (e) => {
    const popover = e.target;
    if (!(popover instanceof HTMLElement) || !popover.hasAttribute('popover')) return;
    if (e.newState === 'open') {
      invokers.set(popover, e.source ?? document.activeElement);
    } else if (popover.contains(document.activeElement)) {
      const invoker = invokers.get(popover);
      // Después de ocultarse; si el foco quedó en <body>, se devuelve al invocador.
      queueMicrotask(() => {
        if (invoker?.isConnected && (document.activeElement === document.body || !document.activeElement)) {
          invoker.focus({ focusVisible: false });
        }
      });
    }
  };
  root.addEventListener('beforetoggle', onBeforeToggle, true);
  return () => root.removeEventListener('beforetoggle', onBeforeToggle, true);
}
