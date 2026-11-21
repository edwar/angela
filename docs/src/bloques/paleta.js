/**
 * Paleta de comandos: un diálogo con un buscador que filtra la lista mientras escribes.
 * Patrón combobox de WAI-ARIA: el foco se queda en el buscador y aria-activedescendant dice
 * cuál es la opción activa. ↑ ↓ para moverse, Enter para elegir, Esc para cerrar (lo hace el
 * <dialog>), y Ctrl K o ⌘ K para abrirla desde cualquier sitio.
 *
 * @param {HTMLDialogElement} dialogo  el <dialog> con [data-paleta]
 * @param {{ alElegir?: (comando: string) => void }} [opciones]
 * @returns {() => void} quita el atajo de teclado
 */
export function paletaDeComandos(dialogo, { alElegir } = {}) {
  const entrada = dialogo.querySelector('[role="combobox"]');
  const opciones = [...dialogo.querySelectorAll('[role="option"]')];
  const vacio = dialogo.querySelector('[data-vacio]');
  const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const visibles = () => opciones.filter((o) => !o.hidden);
  let activa = 0;

  const marcar = (i) => {
    const lista = visibles();
    activa = lista.length ? (i + lista.length) % lista.length : -1;
    for (const o of opciones) o.setAttribute('aria-selected', 'false');
    const o = lista[activa];
    if (!o) return entrada.removeAttribute('aria-activedescendant');
    o.setAttribute('aria-selected', 'true');
    entrada.setAttribute('aria-activedescendant', o.id);
    o.scrollIntoView({ block: 'nearest' });
  };

  const filtrar = () => {
    const texto = normalizar(entrada.value);
    for (const o of opciones) o.hidden = Boolean(texto) && !normalizar(o.dataset.comando ?? o.textContent).includes(texto);
    vacio.hidden = visibles().length > 0;
    marcar(0);
  };

  const elegir = (o) => {
    if (!o) return;
    dialogo.close();
    alElegir?.(o.dataset.comando ?? o.textContent.trim());
  };

  entrada.addEventListener('input', filtrar);
  entrada.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      marcar(activa + (e.key === 'ArrowDown' ? 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      elegir(visibles()[activa]);
    }
  });
  dialogo.addEventListener('click', (e) => elegir(e.target.closest('[role="option"]')));
  dialogo.addEventListener('pointermove', (e) => {
    const o = e.target.closest('[role="option"]');
    if (o) marcar(visibles().indexOf(o));
  });
  // Al cerrar, vuelve a empezar: buscador vacío y toda la lista.
  dialogo.addEventListener('close', () => {
    entrada.value = '';
    filtrar();
  });

  const atajo = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dialogo.open) dialogo.close();
      else dialogo.showModal();
    }
  };
  document.addEventListener('keydown', atajo);
  filtrar();
  return () => document.removeEventListener('keydown', atajo);
}
