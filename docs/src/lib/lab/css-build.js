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
 * Lo que hace el build con el CSS: el error si no puede leerlo, o el CSS minificado (lo que
 * llega al navegador). Null en los dos si el parser no se pudo cargar.
 * @param {string} css
 * @returns {Promise<{ error: string | null, minificado: string | null }>}
 */
export async function cssBuildResult(css) {
  if (!css.trim()) return { error: null, minificado: null };
  if (cache.has(css)) return cache.get(css);
  const lightningcss = await cargar();
  if (!lightningcss) return { error: null, minificado: null };

  let resultado;
  try {
    const { code } = lightningcss.transform({
      filename: 'componente.css',
      code: new TextEncoder().encode(css),
      minify: true,
      errorRecovery: false,
    });
    resultado = { error: null, minificado: new TextDecoder().decode(code) };
  } catch (fallo) {
    const linea = fallo?.loc?.line;
    resultado = { error: `${linea ? `Línea ${linea}: ` : ''}el build no puede leerlo (lightningcss: ${fallo?.message ?? fallo}).`, minificado: null };
  }
  if (cache.size > 50) cache.clear();
  cache.set(css, resultado);
  return resultado;
}

/**
 * @param {string} css
 * @returns {Promise<string | null>} el error que daría el build, con su línea, o null.
 */
export async function cssBuildError(css) {
  return (await cssBuildResult(css)).error;
}
