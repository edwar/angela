/**
 * Pone un botón «Copiar» en cada bloque de código de la documentación (pre > code).
 *
 * El botón sale de <template id="copiar-codigo"> (Layout.astro) y se coloca en una envoltura
 * .codigo junto al <pre>, no dentro: así no se desplaza con el scroll horizontal del código.
 * Copia `data-copiar` del <pre> si lo tiene (el código completo, sin abreviar) o su texto.
 * Los <pre> de las vistas previas de componentes son parte del ejemplo: no llevan botón.
 */

const BLOQUES = 'pre:has(> code):not(.example-preview pre)';
const DURACION_AVISO = 2000;

/**
 * @param {ParentNode} [root]
 * @returns {() => void} quita los botones y deja los <pre> como estaban
 */
export function botonesDeCopiar(root = document) {
  const plantilla = /** @type {HTMLTemplateElement | null} */ (document.getElementById('copiar-codigo'));
  const estado = document.getElementById('copiar-estado');
  if (!plantilla) return () => {};

  const envolturas = [];
  for (const pre of root.querySelectorAll(BLOQUES)) {
    if (pre.parentElement?.classList.contains('codigo')) continue;
    const envoltura = document.createElement('div');
    envoltura.className = 'codigo';
    pre.replaceWith(envoltura);
    const boton = /** @type {HTMLButtonElement} */ (plantilla.content.firstElementChild.cloneNode(true));
    const nombre = pre.getAttribute('aria-label');
    boton.setAttribute('aria-label', nombre ? `Copiar «${nombre}»` : 'Copiar el código');
    envoltura.append(pre, boton);
    envolturas.push(envoltura);

    let temporizador;
    boton.addEventListener('click', async () => {
      const texto = pre.dataset.copiar ?? pre.textContent ?? '';
      clearTimeout(temporizador);
      try {
        await navigator.clipboard.writeText(texto);
        boton.dataset.copiado = '';
        if (estado) estado.textContent = 'Código copiado.';
        temporizador = setTimeout(() => {
          delete boton.dataset.copiado;
          if (estado) estado.textContent = '';
        }, DURACION_AVISO);
      } catch {
        // Sin portapapeles (p. ej. fuera de https): el código queda seleccionado para copiarlo a mano.
        const seleccion = getSelection();
        seleccion?.selectAllChildren(pre.querySelector('code') ?? pre);
        if (estado) estado.textContent = 'No se pudo copiar: el código queda seleccionado, cópialo con Ctrl+C o ⌘C.';
      }
    });
  }

  return () => {
    for (const envoltura of envolturas) {
      const pre = envoltura.querySelector('pre');
      if (pre) envoltura.replaceWith(pre);
    }
  };
}
