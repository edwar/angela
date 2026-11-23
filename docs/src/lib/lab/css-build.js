/**
 * El CSS del laboratorio pasa por el mismo parser que el build del sitio: lightningcss, en
 * WASM y en la misma versión que usa Vite al minificar. Si aquí falla, el build fallaría.
 *
 * El WASM (~2 MB comprimido) se descarga solo la primera vez que se revisa un CSS. Si no se
 * puede cargar (sin conexión, navegador antiguo), devuelve null: la regla «sintaxis» sigue
 * con su revisión propia (css-sintaxis.js).
 */

/** @type {Promise<typeof import('lightningcss-wasm') | null> | undefined} */
let cargando;
/** Últimos resultados: la revisión se repite con el mismo CSS al cambiar el HTML o el JS. */
const cache = new Map();

function cargar() {
  cargando ??= import('lightningcss-wasm')
    .then(async (lightningcss) => {
      await lightningcss.default();
      return lightningcss;
    })
    .catch(() => null);
  return cargando;
}

/**
 * @param {string} css
 * @returns {Promise<string | null>} el error que daría el build, con su línea, o null.
 */
export async function cssBuildError(css) {
  if (!css.trim()) return null;
  if (cache.has(css)) return cache.get(css);
  const lightningcss = await cargar();
  if (!lightningcss) return null;

  let error = null;
  try {
    lightningcss.transform({
      filename: 'componente.css',
      code: new TextEncoder().encode(css),
      minify: true,
      errorRecovery: false,
    });
  } catch (fallo) {
    const linea = fallo?.loc?.line;
    error = `${linea ? `Línea ${linea}: ` : ''}el build no puede leerlo (lightningcss: ${fallo?.message ?? fallo}).`;
  }
  if (cache.size > 50) cache.clear();
  cache.set(css, error);
  return error;
}
