/**
 * «Ver la documentación con este tema»: el tema del taller se guarda en este navegador y se aplica
 * a las vistas previas de todas las páginas (las zonas data-angela-theme="angela"), no al sitio.
 *
 * Lo pinta un script en línea del <head> (Layout.astro) antes de que se vea la página, sin
 * destello, y marca <html data-tema-usuario> para que las leyendas de las vistas previas lo digan
 * (EtiquetaVista.astro). Aquí se guarda, se quita y se atienden «Editar» y «Quitar».
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
  delete document.documentElement.dataset.temaUsuario;
}

function aplicar(css) {
  let estilo = document.getElementById('tema-usuario');
  if (!estilo) {
    estilo = document.createElement('style');
    estilo.id = 'tema-usuario';
    document.head.append(estilo);
  }
  estilo.textContent = css;
  document.documentElement.dataset.temaUsuario = '';
}

/**
 * Las leyendas de las vistas previas: «Editar» lleva al tema guardado en el taller y «Quitar» lo
 * borra. Escucha en el documento (las leyendas pueden llegar después) y también los cambios desde
 * otra pestaña (evento storage), para que la página siempre diga la verdad.
 * @param {string} [base]
 * @returns {() => void} Limpieza.
 */
export function temaEnLasVistas(base = '') {
  if (typeof window === 'undefined') return () => {};
  const sincronizar = () => {
    const guardado = leerTemaGuardado();
    if (guardado?.css) aplicar(guardado.css);
    else {
      document.getElementById('tema-usuario')?.remove();
      delete document.documentElement.dataset.temaUsuario;
    }
    for (const enlace of document.querySelectorAll('[data-tema-editar]')) {
      enlace.href = guardado?.hash ? `${base}/temas#${guardado.hash}` : `${base}/temas`;
    }
  };
  const onClick = (event) => {
    if (!event.target.closest?.('[data-tema-quitar]')) return;
    quitarTema();
    document.dispatchEvent(new CustomEvent('angela-docs:tema'));
  };
  const onStorage = (event) => {
    if (event.key === CLAVE_TEMA || event.key === null) sincronizar();
  };
  document.addEventListener('click', onClick);
  document.addEventListener('angela-docs:tema', sincronizar);
  addEventListener('storage', onStorage);
  sincronizar();
  return () => {
    document.removeEventListener('click', onClick);
    document.removeEventListener('angela-docs:tema', sincronizar);
    removeEventListener('storage', onStorage);
  };
}
