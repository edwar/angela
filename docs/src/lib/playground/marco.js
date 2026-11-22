/**
 * El marco de la vista previa del «Pruébalo» (/pruebalo-marco): una página que solo carga angela.
 * La página del componente la usa como iframe del mismo origen y la pinta con window.pruebalo.pintar:
 * - el ancho lo pone el iframe, así que las media queries ven un móvil o una tablet de verdad;
 * - dir en <html> (RTL); data-scheme (claro/oscuro) y los colores que se cambien, en la zona;
 * - «reducir movimiento» se simula cambiando las media queries prefers-reduced-motion del CSSOM.
 * Avisa de su alto a la página para que el iframe crezca con el contenido.
 */

/** Recorre todas las reglas @media, también dentro de @layer, @supports y CSS anidado. */
function cadaMedia(reglas, fn) {
  for (const r of reglas) {
    if (r instanceof CSSMediaRule) fn(r);
    if (r.cssRules) cadaMedia(r.cssRules, fn);
  }
}

const originales = new Map();

function simularMovimientoReducido(reducido) {
  for (const hoja of document.styleSheets) {
    let reglas;
    try {
      reglas = hoja.cssRules;
    } catch {
      continue;
    }
    cadaMedia(reglas, (regla) => {
      if (!originales.has(regla)) {
        if (!/prefers-reduced-motion/.test(regla.media.mediaText)) return;
        originales.set(regla, regla.media.mediaText);
      }
      const original = originales.get(regla);
      regla.media.mediaText = reducido
        ? original
            .replace(/\(\s*prefers-reduced-motion:\s*no-preference\s*\)/g, '(min-width: 999999px)')
            .replace(/\(\s*prefers-reduced-motion:\s*reduce\s*\)/g, '(min-width: 0px)')
        : original;
    });
  }
}

export function marco() {
  const lienzo = document.getElementById('lienzo');
  const contenido = document.getElementById('contenido');
  let html = null;
  let reducido = false;
  /** Las variables de color puestas en la zona, para quitarlas cuando ya no cambien. */
  let puestas = [];

  window.pruebalo = {
    /**
     * @param {{ html: string, dir?: 'ltr' | 'rtl', esquema?: '' | 'light' | 'dark', movimiento?: 'normal' | 'reducido',
     *   variables?: [string, number][] | null, centrar?: boolean }} opciones
     *   variables: las --angela-* que cambian; sin ellas, la zona usa el tema guardado del taller (o el de angela).
     */
    pintar({ html: nuevo, dir = 'ltr', esquema = '', movimiento = 'normal', variables = null, centrar = false }) {
      // Solo si cambia: un diálogo abierto no se cierra al mover el color o el esquema.
      if (nuevo !== html) {
        contenido.innerHTML = nuevo;
        html = nuevo;
      }
      document.documentElement.dir = dir;
      // En la zona, no en <html>: ahí :root { color-scheme } de angela ganaría a [data-scheme].
      if (esquema) lienzo.dataset.scheme = esquema;
      else delete lienzo.dataset.scheme;
      for (const k of puestas) lienzo.style.removeProperty(k);
      puestas = (variables ?? []).map(([k, v]) => {
        lienzo.style.setProperty(k, String(v));
        return k;
      });
      if (centrar) lienzo.dataset.centrar = '';
      else delete lienzo.dataset.centrar;
      if ((movimiento === 'reducido') !== reducido) {
        reducido = movimiento === 'reducido';
        simularMovimientoReducido(reducido);
      }
    },
  };

  // El alto del contenido (no del marco, que ocupa toda la ventana): la página ajusta el iframe.
  const avisarAlto = () => {
    const estilo = getComputedStyle(lienzo);
    const alto = contenido.getBoundingClientRect().height + parseFloat(estilo.paddingBlockStart) + parseFloat(estilo.paddingBlockEnd);
    parent.postMessage({ pruebalo: 'alto', alto: Math.ceil(alto) }, location.origin);
  };
  new ResizeObserver(avisarAlto).observe(contenido);
  parent.postMessage({ pruebalo: 'listo' }, location.origin);
}
