/**
 * Punto de entrada de la capa JS de angela. Todo es opcional: el CSS funciona sin JS.
 *
 *   import { angela } from '@angela-ui/angela/js';
 *   angela();            // activa todo en el documento
 */
import { loadPolyfills } from './polyfills.js';
import { enhanceForms } from './forms.js';
import { enhanceTabs } from './tabs.js';
import { enhanceDialogs, enhancePopovers } from './overlays.js';
import { initThemeToggle } from './theme.js';
import { enhanceSpotlight } from './spotlight.js';
import { enhanceCalendar } from './calendario.js';

export * from './theme.js';
export { enhanceForms } from './forms.js';
export { enhanceTabs, selectTab } from './tabs.js';
export { enhanceDialogs, enhancePopovers } from './overlays.js';
export { loadPolyfills } from './polyfills.js';
export { enhanceSpotlight } from './spotlight.js';
export { enhanceCalendar } from './calendario.js';

/**
 * Activa todas las mejoras. Seguro de llamar en SSR (no hace nada fuera del navegador).
 * @param {{ root?: Document|HTMLElement, polyfills?: boolean }} options
 * @returns {() => void} función para desconectar los listeners
 */
export function angela({ root = globalThis.document, polyfills = true } = {}) {
  // Seguro en el servidor: sin DOM no hay nada que mejorar.
  if (typeof window === 'undefined' || !root) return () => {};
  if (polyfills) loadPolyfills();
  const cleanups = [
    enhanceForms(root),
    enhanceTabs(root),
    enhanceDialogs(root),
    enhancePopovers(root),
    initThemeToggle(root),
    enhanceSpotlight(root),
    enhanceCalendar(root),
  ];
  return () => cleanups.forEach((fn) => fn());
}
