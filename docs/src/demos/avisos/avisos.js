/**
 * Avisos emergentes («toasts») sobre la plataforma:
 * - popover="manual" los pone en la capa superior, por encima de todo, sin z-index.
 * - @starting-style anima la entrada y data-saliendo la salida, solo con CSS.
 * - Una región role="status" los anuncia al lector de pantalla.
 * - Se quedan mientras el ratón o el foco están encima (WCAG 2.2.1) y se cierran con su botón.
 */

const ICONOS = {
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  success: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  warning: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  danger: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
};
const svg = (cuerpo) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${cuerpo}</svg>`;

let bandeja;
let anunciador;

function preparar() {
  if (bandeja?.isConnected) return;
  bandeja = document.createElement('ol');
  bandeja.className = 'avisos';
  bandeja.popover = 'manual';
  bandeja.setAttribute('aria-label', 'Avisos');
  anunciador = document.createElement('p');
  anunciador.className = 'visually-hidden';
  anunciador.setAttribute('role', 'status');
  document.body.append(bandeja, anunciador);
}

/**
 * Muestra un aviso.
 * @param {string} texto
 * @param {{ tono?: 'info' | 'success' | 'warning' | 'danger', duracion?: number }} [opciones]
 * @returns {() => void} función para cerrarlo antes de tiempo
 */
export function avisar(texto, { tono = 'info', duracion = 5000 } = {}) {
  if (typeof document === 'undefined') return () => {};
  preparar();

  const aviso = document.createElement('li');
  aviso.className = 'aviso callout';
  aviso.dataset.tone = tono;
  aviso.innerHTML = `${svg(ICONOS[tono] ?? ICONOS.info)}<p></p><button class="button" type="button" data-variant="ghost" data-tone="neutral" data-size="sm" data-icon-only aria-label="Cerrar aviso">${svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>')}</button>`;
  aviso.querySelector('p').textContent = texto;
  bandeja.append(aviso);
  if (!bandeja.matches(':popover-open')) bandeja.showPopover();

  // Se vacía y se rellena para que el lector lo anuncie aunque el texto se repita.
  anunciador.textContent = '';
  setTimeout(() => (anunciador.textContent = texto), 100);

  let temporizador;
  const cerrar = () => {
    if ('saliendo' in aviso.dataset) return;
    clearTimeout(temporizador);
    aviso.dataset.saliendo = '';
    const quitar = () => {
      aviso.remove();
      if (!bandeja.children.length && bandeja.matches(':popover-open')) bandeja.hidePopover();
    };
    aviso.addEventListener('transitionend', quitar, { once: true });
    // Sin transición (movimiento reducido o sin soporte), se quita igual.
    setTimeout(quitar, 400);
  };
  const programar = () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(cerrar, duracion);
  };
  // Mientras se lee (ratón o foco encima), no se va.
  aviso.addEventListener('pointerenter', () => clearTimeout(temporizador));
  aviso.addEventListener('pointerleave', programar);
  aviso.addEventListener('focusin', () => clearTimeout(temporizador));
  aviso.addEventListener('focusout', programar);
  aviso.querySelector('button').addEventListener('click', cerrar);
  programar();
  return cerrar;
}
