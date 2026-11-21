/**
 * El «Pruébalo» en el navegador: lee los controles, pinta la vista previa y pone al día el
 * componente y el uso de cada framework, en TypeScript o JavaScript (elección que se recuerda).
 */
import { DEFINICIONES, htmlDe } from './definiciones.js';
import { codigoPlayground, codigoTema } from './codigo.js';

const CLAVE_LENGUAJE = 'angela-docs:lenguaje';
const leerLenguaje = () => {
  try {
    return localStorage.getItem(CLAVE_LENGUAJE) === 'js' ? 'js' : 'ts';
  } catch {
    return 'ts';
  }
};
const guardarLenguaje = (l) => {
  try {
    localStorage.setItem(CLAVE_LENGUAJE, l);
  } catch {
    // Sin almacenamiento: se elige igual, solo no se recuerda.
  }
};

export function iniciarPlaygrounds(root = document) {
  for (const raiz of root.querySelectorAll('[data-playground]')) {
    const def = DEFINICIONES.find((d) => d.slug === raiz.dataset.playground);
    if (!def) continue;
    const form = raiz.querySelector('form');
    const vista = raiz.querySelector('.pruebalo-vista');
    const lienzo = raiz.querySelector('.pruebalo-lienzo');
    const tema = raiz.querySelector('.pruebalo-tema');
    const radiosLenguaje = [...raiz.querySelectorAll('input[name="pg-lenguaje"]')];
    let lenguaje = leerLenguaje();
    for (const r of radiosLenguaje) r.checked = r.value === lenguaje;

    const leer = () => {
      const datos = new FormData(form);
      return Object.fromEntries(
        def.controles.map((c) => {
          if (c.tipo === 'booleano') return [c.nombre, form.elements.namedItem(c.nombre).checked];
          if (c.tipo === 'numero') return [c.nombre, Number(datos.get(c.nombre))];
          if (c.tipo === 'lista') {
            const partes = String(datos.get(c.nombre) ?? '')
              .split(c.separador)
              .map((x) => x.trim())
              .filter(Boolean);
            return [c.nombre, partes];
          }
          return [c.nombre, String(datos.get(c.nombre) ?? '')];
        }),
      );
    };

    const pintarCodigo = (valores) => {
      for (const fw of codigoPlayground(def, valores, lenguaje)) {
        for (const parte of ['componente', 'uso']) {
          const pre = raiz.querySelector(`pre[data-pg="${fw.id}-${parte}"]`);
          if (!pre) continue;
          const { codigo, copiar, archivo, lenguaje: lang } = fw[parte];
          pre.querySelector('code').textContent = codigo;
          if (copiar !== codigo) pre.dataset.copiar = copiar;
          else delete pre.dataset.copiar;
          raiz.querySelector(`[data-archivo="${fw.id}-${parte}"]`).textContent = archivo;
          raiz.querySelector(`[data-lenguaje="${fw.id}-${parte}"]`).textContent = lang;
        }
      }
      for (const nota of raiz.querySelectorAll('[data-solo-js]')) nota.hidden = lenguaje !== 'js';
    };

    let anterior = '';
    const pintar = () => {
      const valores = leer();
      const html = htmlDe(def, valores);
      // Solo se repinta si cambia: así un diálogo abierto no se cierra al mover el color.
      if (html !== anterior) {
        lienzo.innerHTML = html;
        anterior = html;
        pintarCodigo(valores);
      }

      const datos = new FormData(form);
      const h = Number(datos.get('marca-h'));
      const c = Number(datos.get('marca-c'));
      const css = codigoTema({ h, c });
      // Solo si se mueve el color: si no, la vista usa el tema guardado del taller (o el de angela).
      for (const [k, v] of [
        ['--angela-brand-h', h],
        ['--angela-brand-c', c],
      ]) {
        if (css) vista.style.setProperty(k, String(v));
        else vista.style.removeProperty(k);
      }
      tema.hidden = !css;
      if (css) tema.querySelector('code').textContent = css;

      const esquema = String(datos.get('esquema') ?? '');
      if (esquema) vista.dataset.scheme = esquema;
      else delete vista.dataset.scheme;

      for (const salida of form.querySelectorAll('output[data-salida]')) {
        salida.textContent = String(datos.get(salida.dataset.salida) ?? '');
      }
    };

    form.addEventListener('input', pintar);
    form.addEventListener('change', pintar);
    // El reset del formulario cambia los valores después del evento.
    form.addEventListener('reset', () => setTimeout(pintar));
    form.addEventListener('submit', (e) => e.preventDefault());
    for (const r of radiosLenguaje) {
      r.addEventListener('change', () => {
        lenguaje = r.value;
        guardarLenguaje(lenguaje);
        pintarCodigo(leer());
      });
    }
    // Si se recordaba JavaScript, el código del servidor (TypeScript) se cambia al cargar.
    if (lenguaje !== 'ts') pintarCodigo(leer());
  }
}
