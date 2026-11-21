/**
 * El framework elegido se recuerda en todo el sitio: al cambiar de pestaña en un ejemplo (o en
 * «Empezar»), cambian todas las pestañas con data-framework de la página y la elección se guarda
 * para las siguientes páginas.
 *
 * Las pestañas que se cambian por arrastre van con { silent: true }: no emiten tabchange y no
 * hay bucle. Para que la página no salte, la pestaña pulsada se queda donde estaba aunque cambie
 * la altura de los ejemplos de arriba.
 */

const CLAVE = 'angela-docs:framework';

const leer = () => {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
};

const guardar = (id) => {
  try {
    localStorage.setItem(CLAVE, id);
  } catch {
    // Sin almacenamiento (modo privado, iframe): se elige igual, solo no se recuerda.
  }
};

/** Elige `id` en todas las pestañas que lo tienen, menos en `salvo`. */
function elegir(id, salvo = null) {
  for (const tabs of document.querySelectorAll('angela-tabs')) {
    if (tabs === salvo || typeof tabs.select !== 'function') continue;
    const boton = tabs.querySelector(`:scope > .tablist > button[data-framework~="${CSS.escape(id)}"]`);
    if (!boton) continue;
    if (boton.getAttribute('aria-selected') !== 'true') tabs.select(boton, { silent: true });
    centrar(boton);
  }
}

/**
 * En pantallas estrechas la fila de pestañas se desplaza: la elegida se trae a la vista
 * moviendo solo la fila (scrollIntoView movería también la página).
 */
function centrar(boton) {
  const fila = boton.parentElement;
  if (!fila || fila.scrollWidth <= fila.clientWidth) return;
  const f = fila.getBoundingClientRect();
  const b = boton.getBoundingClientRect();
  fila.scrollLeft += b.left - f.left - (f.width - b.width) / 2;
}

export function recordarFramework() {
  if (typeof window === 'undefined') return () => {};

  const inicial = leer();
  if (inicial) customElements.whenDefined('angela-tabs').then(() => elegir(inicial));

  const onTabchange = (event) => {
    const tab = event.detail?.tab;
    const id = tab?.dataset.framework?.split(' ')[0];
    if (!id) return;
    guardar(id);
    const antes = tab.getBoundingClientRect().top;
    elegir(id, event.target);
    const despues = tab.getBoundingClientRect().top;
    if (Math.abs(despues - antes) > 1) window.scrollBy({ top: despues - antes, behavior: 'instant' });
  };
  document.addEventListener('tabchange', onTabchange);
  return () => document.removeEventListener('tabchange', onTabchange);
}
