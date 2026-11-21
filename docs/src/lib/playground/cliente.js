/**
 * El «Pruébalo» en el navegador: lee los controles, pinta la vista previa en su marco (un iframe
 * con angela, /pruebalo-marco) y pone al día el componente y el uso de cada framework, en
 * TypeScript o JavaScript (elección que se recuerda).
 *
 * La configuración (props, color, ancho, dirección, movimiento y esquema) va en el enlace:
 * #pruebalo:variant=outline&tone=danger… Al abrirlo, el «Pruébalo» empieza así.
 */
import { DEFINICIONES, htmlDe, valoresPorDefecto } from './definiciones.js';
import { codigoPlayground, codigoTema } from './codigo.js';

const CLAVE_LENGUAJE = 'angela-docs:lenguaje';
const PREFIJO = '#pruebalo:';
const MARCA = { h: 262, c: 0.17 };
const VISTA = { ancho: '', dir: 'ltr', movimiento: 'normal', esquema: '' };

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
    const marco = raiz.querySelector('.pruebalo-marco');
    const tema = raiz.querySelector('.pruebalo-tema');
    const estado = raiz.querySelector('[data-pg-estado]');
    const radiosLenguaje = [...raiz.querySelectorAll('input[name="pg-lenguaje"]')];
    const iniciales = valoresPorDefecto(def);
    let lenguaje = leerLenguaje();
    for (const r of radiosLenguaje) r.checked = r.value === lenguaje;

    /* ---------- Controles ↔ valores ---------- */

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
    const leerVista = () => {
      const datos = new FormData(form);
      return Object.fromEntries(Object.keys(VISTA).map((k) => [k, String(datos.get(k) ?? VISTA[k])]));
    };
    const marcaElegida = () => {
      const datos = new FormData(form);
      return { h: Number(datos.get('marca-h')), c: Number(datos.get('marca-c')) };
    };

    /** Pone un valor en su control (para abrir un enlace). */
    const poner = (nombre, valor) => {
      const campo = form.elements.namedItem(nombre);
      if (!campo) return;
      const c = def.controles.find((x) => x.nombre === nombre);
      if (campo instanceof RadioNodeList) {
        for (const r of campo) r.checked = r.value === valor;
      } else if (campo.type === 'checkbox') campo.checked = valor === '1';
      else campo.value = c?.tipo === 'lista' ? valor.split('|').join(` ${c.separador} `) : valor;
    };

    /* ---------- Enlace ---------- */

    const aEnlace = () => {
      const p = new URLSearchParams();
      const valores = leer();
      for (const c of def.controles) {
        const v = valores[c.nombre];
        if (JSON.stringify(v) === JSON.stringify(iniciales[c.nombre])) continue;
        p.set(c.nombre, c.tipo === 'booleano' ? (v ? '1' : '0') : Array.isArray(v) ? v.join('|') : String(v));
      }
      const vista = leerVista();
      for (const [k, v] of Object.entries(vista)) if (v !== VISTA[k]) p.set(k, v);
      const marca = marcaElegida();
      if (marca.h !== MARCA.h || marca.c !== MARCA.c) p.set('marca', `${marca.h},${marca.c}`);
      return `${location.origin}${location.pathname}${PREFIJO}${p}`;
    };

    const desdeEnlace = () => {
      if (!location.hash.startsWith(PREFIJO)) return false;
      const p = new URLSearchParams(location.hash.slice(PREFIJO.length));
      for (const [k, v] of p) {
        if (k === 'marca') {
          const [h, c] = v.split(',');
          poner('marca-h', h);
          poner('marca-c', c);
        } else poner(k, v);
      }
      return true;
    };

    /* ---------- Pintar ---------- */

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
      if (html !== anterior) {
        anterior = html;
        pintarCodigo(valores);
      }

      const marca = marcaElegida();
      const css = codigoTema(marca);
      tema.hidden = !css;
      if (css) tema.querySelector('code').textContent = css;

      const vista = leerVista();
      ajustarAncho(vista.ancho);
      // Solo si se mueve el color: si no, el marco usa el tema guardado del taller (o el de angela).
      marco.contentWindow?.pruebalo?.pintar({ html, dir: vista.dir, esquema: vista.esquema, movimiento: vista.movimiento, marca: css ? marca : null, centrar: def.centrar });

      for (const salida of form.querySelectorAll('output[data-salida]')) {
        salida.textContent = String(new FormData(form).get(salida.dataset.salida) ?? '');
      }
    };

    /* ---------- El marco ---------- */

    /**
     * Móvil o tablet: el marco mide ese ancho por dentro (las media queries lo ven) y, si no cabe en
     * la columna, se dibuja a escala con zoom, como un simulador de dispositivos.
     */
    const caja = raiz.querySelector('.pruebalo-marco-caja');
    const escala = raiz.querySelector('[data-pg-escala]');
    const NOMBRES = { 375: 'Móvil', 768: 'Tablet' };
    let anchoActual = '';
    const ajustarAncho = (ancho = anchoActual) => {
      anchoActual = ancho;
      if (!ancho) {
        marco.style.inlineSize = '';
        marco.style.zoom = '';
        escala.hidden = true;
        return;
      }
      const disponible = caja.clientWidth;
      // + 2: el borde discontinuo que marca los lados del «dispositivo».
      const factor = Math.min(1, disponible / (Number(ancho) + 2));
      marco.style.inlineSize = `${ancho}px`;
      marco.style.zoom = factor < 1 ? String(factor) : '';
      escala.hidden = false;
      escala.textContent = `${NOMBRES[ancho] ?? 'Ancho'} · ${ancho} px${factor < 1 ? ` · al ${Math.round(factor * 100)} %` : ''}`;
    };
    new ResizeObserver(() => ajustarAncho()).observe(caja);

    const altoMinimo = Number(marco.dataset.altoMinimo) || 0;
    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin || e.source !== marco.contentWindow) return;
      if (e.data?.pruebalo === 'listo') pintar();
      // El iframe crece con el contenido (y deja sitio a los diálogos, que necesitan altura).
      if (e.data?.pruebalo === 'alto') marco.style.blockSize = `${Math.max(e.data.alto, altoMinimo, 160)}px`;
    });
    // Si el marco ya había cargado antes de este script.
    if (marco.contentWindow?.pruebalo) pintar();

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

    raiz.querySelector('[data-pg-enlace]')?.addEventListener('click', async () => {
      const enlace = aEnlace();
      history.replaceState(null, '', enlace);
      try {
        await navigator.clipboard.writeText(enlace);
        estado.textContent = 'Enlace copiado: quien lo abra verá esta misma configuración.';
      } catch {
        estado.textContent = `No se pudo copiar. El enlace está en la barra de direcciones.`;
      }
    });

    if (desdeEnlace()) {
      raiz.scrollIntoView();
      anterior = '';
    }
    // El código del servidor es TypeScript con los valores iniciales: se pone al día si hace falta.
    if (lenguaje !== 'ts' || location.hash.startsWith(PREFIJO)) pintarCodigo(leer());
    pintar();
  }
}
