/**
 * Spotlight: el punto de luz sigue al puntero.
 *
 * El CSS dibuja la luz en (--spotlight-x, --spotlight-y), centrada por defecto; esto solo
 * pasa la posición del puntero. Escucha en la raíz (delegación), así funciona también con
 * los .spotlight que un framework monte después.
 *
 * Marcado: <div class="spotlight">…contenido… <div class="spotlight-overlay"></div></div>
 */

/**
 * Activa el seguimiento del puntero en todos los .spotlight de la raíz, presentes y futuros.
 * @param {Document|HTMLElement} [root=document]
 * @returns {() => void} función para desconectar el listener
 */
export function enhanceSpotlight(root = globalThis.document) {
  // Seguro en el servidor: sin DOM no hay nada que mejorar.
  if (typeof window === 'undefined' || !root) return () => {};

  /** @param {PointerEvent} event */
  const onMove = (event) => {
    const target = /** @type {Element | null} */ (event.target);
    const spotlight = target?.closest?.('.spotlight');
    if (!(spotlight instanceof HTMLElement) || !root.contains(spotlight)) return;
    const rect = spotlight.getBoundingClientRect();
    spotlight.style.setProperty('--spotlight-x', `${event.clientX - rect.left}px`);
    spotlight.style.setProperty('--spotlight-y', `${event.clientY - rect.top}px`);
  };

  root.addEventListener('pointermove', /** @type {EventListener} */ (onMove), { passive: true });
  return () => root.removeEventListener('pointermove', /** @type {EventListener} */ (onMove));
}
