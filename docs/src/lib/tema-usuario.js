/**
 * «Ver la documentación con este tema»: el tema del taller se guarda en este navegador y se aplica
 * a las vistas previas de todas las páginas (las zonas data-angela-theme="angela"), no al sitio.
 *
 * Lo pinta un script en línea del <head> (Layout.astro) antes de que se vea la página, sin
 * destello. Aquí se guarda, se quita y se muestra el aviso.
 */

export const CLAVE_TEMA = 'angela-docs:tema';

/**
 * html [data-angela-theme="angela"] gana a la regla del sitio que fija los valores de angela.
 * Las vistas del taller quedan fuera: muestran el tema que se está editando.
 */
export const SELECTOR_TEMA = 'html [data-angela-theme="angela"]:not(.taller-vista)';

export function leerTemaGuardado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_TEMA) ?? 'null');
  } catch {
    return null;
  }
}

/** Guarda y aplica en esta página. `css` es la regla completa; `hash`, el enlace al taller. */
export function guardarTema({ css, hash }) {
  try {
    localStorage.setItem(CLAVE_TEMA, JSON.stringify({ css, hash }));
  } catch {
    return false;
  }
  aplicar(css);
  return true;
}

export function quitarTema() {
  try {
    localStorage.removeItem(CLAVE_TEMA);
  } catch {
    // Sin almacenamiento no había nada guardado.
  }
  document.getElementById('tema-usuario')?.remove();
}

function aplicar(css) {
  let estilo = document.getElementById('tema-usuario');
  if (!estilo) {
    estilo = document.createElement('style');
    estilo.id = 'tema-usuario';
    document.head.append(estilo);
  }
  estilo.textContent = css;
}

/** El aviso «Ves los ejemplos con tu tema» con su botón para quitarlo. */
export function avisoTemaUsuario(base = '') {
  const aviso = document.querySelector('[data-tema-aviso]');
  if (!aviso) return;
  const mostrar = () => {
    const guardado = leerTemaGuardado();
    aviso.hidden = !guardado;
    const enlace = aviso.querySelector('a');
    if (guardado && enlace) enlace.href = `${base}/temas#${guardado.hash}`;
  };
  aviso.querySelector('button')?.addEventListener('click', () => {
    quitarTema();
    mostrar();
    document.dispatchEvent(new CustomEvent('angela-docs:tema'));
  });
  document.addEventListener('angela-docs:tema', mostrar);
  mostrar();
}
