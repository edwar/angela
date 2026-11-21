/**
 * Abre una tarjeta de la lista con una transición de vista (View Transitions):
 * el navegador fotografía el antes y el después y anima cada elemento con view-transition-name.
 * Sin soporte, o con «reducir movimiento», el cambio es instantáneo: nada se rompe.
 * @param {HTMLElement} lista  el elemento con [data-expandir]
 */
export function expandir(lista) {
  const alternar = (boton) => {
    const abrir = boton.getAttribute('aria-expanded') !== 'true';
    for (const b of lista.querySelectorAll('[aria-expanded]')) b.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-expanded', String(abrir));
  };
  lista.addEventListener('click', (event) => {
    const boton = event.target.closest('[aria-expanded]');
    if (!boton || !lista.contains(boton)) return;
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || quieto) return alternar(boton);
    document.startViewTransition(() => alternar(boton));
  });
}
