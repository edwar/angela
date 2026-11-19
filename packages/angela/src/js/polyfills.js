/**
 * Carga polyfills SOLO si el navegador no tiene la característica nativa.
 * - Invoker Commands (command / commandfor): Baseline desde dic. 2025.
 * - Popover API: Baseline desde ene. 2025.
 *
 * Sin bundler, usa en su lugar las versiones de CDN (ver README).
 */
export async function loadPolyfills() {
  if (typeof window === 'undefined') return;
  const tasks = [];
  if (!Object.hasOwn(HTMLElement.prototype, 'popover')) {
    tasks.push(import('@oddbird/popover-polyfill'));
  }
  if (!('commandForElement' in HTMLButtonElement.prototype)) {
    tasks.push(import('invokers-polyfill'));
  }
  await Promise.allSettled(tasks);
}
