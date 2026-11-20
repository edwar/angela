/**
 * Modo claro/oscuro. La fuente de verdad es <meta name="color-scheme">:
 *   "light dark" → sigue al sistema (por defecto)   "light" / "dark" → fijado por la persona.
 * El CSS de angela convierte ese meta en la propiedad color-scheme, y light-dark() hace el resto.
 * Sin JS la página sigue al sistema y nada se rompe.
 */

export const STORAGE_KEY = 'color-scheme';

/**
 * Script en línea para el <head>, justo después del <meta name="color-scheme">.
 * Aplica la preferencia guardada antes de pintar (evita el destello del tema equivocado).
 * NO lo cargues con type="module" ni defer.
 */
export const themeInlineScript = `try{document.querySelector('meta[name="color-scheme"]').content=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})??"light dark"}catch(e){}`;

/** @returns {'light'|'dark'|null} */
export function getStoredScheme() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

/** @returns {'light'|'dark'} */
export function getSystemScheme() {
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Esquema que se ve ahora mismo. */
export function getRenderedScheme() {
  return getStoredScheme() ?? getSystemScheme();
}

function applyScheme(stored) {
  let meta = document.querySelector('meta[name="color-scheme"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'color-scheme';
    document.head.append(meta);
  }
  meta.content = stored ?? 'light dark';
  document.dispatchEvent(new CustomEvent('angela:schemechange', { detail: { scheme: getRenderedScheme() } }));
}

/**
 * Fija el esquema. 'system' borra la preferencia y vuelve a seguir al sistema.
 * @param {'light'|'dark'|'system'} scheme
 */
export function setScheme(scheme) {
  const stored = scheme === 'system' ? null : scheme;
  try {
    if (stored) localStorage.setItem(STORAGE_KEY, stored);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin almacenamiento (datos del sitio bloqueados): se aplica igual, solo que no persiste.
  }
  applyScheme(stored);
}

/**
 * Decide el siguiente estado de un selector de dos estados.
 * Objetivo = el opuesto de lo que se ve. Si coincide con el sistema, se vuelve a "sistema"
 * (no se guarda), para no fijar sin querer el esquema frente a futuros cambios del sistema.
 * @param {'light'|'dark'} rendered
 * @param {'light'|'dark'} system
 * @returns {'light'|'dark'|'system'}
 */
export function nextScheme(rendered, system) {
  const target = rendered === 'dark' ? 'light' : 'dark';
  return target === system ? 'system' : target;
}

/** Alterna entre el esquema del sistema y su opuesto. */
export function toggleScheme() {
  setScheme(nextScheme(getRenderedScheme(), getSystemScheme()));
}

/**
 * Conecta los botones [data-theme-toggle] y sincroniza entre pestañas.
 * @param {Document|HTMLElement} [root]
 * @returns {() => void} función para desconectar
 */
export function initThemeToggle(root = globalThis.document) {
  // Seguro en el servidor: sin DOM no hay nada que mejorar.
  if (typeof window === 'undefined' || !root) return () => {};
  const onClick = (event) => {
    if (event.target.closest?.('[data-theme-toggle]')) toggleScheme();
  };
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) applyScheme(getStoredScheme());
  };
  root.addEventListener('click', onClick);
  window.addEventListener('storage', onStorage);
  return () => {
    root.removeEventListener('click', onClick);
    window.removeEventListener('storage', onStorage);
  };
}
