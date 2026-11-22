/**
 * El «Pruébalo» en el navegador: lee los controles, pinta la vista previa en su marco (un iframe
 * con angela, /pruebalo-marco) y pone al día el componente y el uso de cada framework, en
 * TypeScript o JavaScript (elección que se recuerda).
 *
 * La configuración (props, color, ancho, dirección, movimiento y esquema) va en el enlace:
 * #pruebalo:variant=outline&tone=danger… Al abrirlo, el «Pruébalo» empieza así.
 *
 * El color que se edita es el del tono elegido (prop tone) o, si el componente no tiene, el de
 * marca: lo que se mueve es lo que se ve. Cada rol guarda su color al cambiar de tono.
 */
import { roles } from '@angela-ui/angela/palette';
import { DEFINICIONES, htmlDe, valoresPorDefecto } from './definiciones.js';
import { codigoPlayground, codigoTema, variablesTema } from './codigo.js';
import { MAX_CROMA, NOMBRES_ROL } from '../taller/temas.js';

const CLAVE_LENGUAJE = 'angela-docs:lenguaje';
const PREFIJO = '#pruebalo:';
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
    /* ---------- Color del tono elegido ---------- */

    let colores = structuredClone(roles);
    let rolMostrado = null;
    const conTono = def.controles.some((c) => c.nombre === 'tone');
    const rolDe = (valores) => (conTono && roles[valores.tone] ? valores.tone : 'brand');
    const campoH = form.elements.namedItem('color-h');
    const campoC = form.elements.namedItem('color-c');

    /** Al cambiar de tono, los controles muestran el color de ese rol; si no, guardan lo que se mueve. */
    const sincronizarColor = (rol) => {
      if (rol !== rolMostrado) {
        rolMostrado = rol;
        campoH.value = String(colores[rol].h);
        campoC.value = String(colores[rol].c);
        campoC.max = String(MAX_CROMA[rol] ?? 0.2);
        // El neutro sigue el tono de marca: aquí solo cambia su croma.
        campoH.disabled = rol === 'neutral';
        raiz.querySelector('[data-rol-nombre]').textContent = NOMBRES_ROL[rol];
      } else {
        if (rol !== 'neutral') colores[rol].h = Number(campoH.value);
        colores[rol].c = Number(campoC.value);
      }
      const { h, c } = colores[rol];
      const muestra = raiz.querySelector('[data-muestra]');
      if (muestra) muestra.style.background = `oklch(0.6 ${rol === 'neutral' ? c * 3 : c} ${rol === 'neutral' ? colores.brand.h : h})`;
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
      const cambiados = Object.entries(colores).filter(([rol, { h, c }]) => h !== roles[rol].h || c !== roles[rol].c);
      if (cambiados.length) p.set('color', cambiados.map(([rol, { h, c }]) => `${rol}:${h},${c}`).join(';'));
      return `${location.origin}${location.pathname}${PREFIJO}${p}`;
    };

    const desdeEnlace = () => {
      if (!location.hash.startsWith(PREFIJO)) return false;
      const p = new URLSearchParams(location.hash.slice(PREFIJO.length));
      for (const [k, v] of p) {
        if (k === 'color' || k === 'marca') {
          // color=info:200,0.1;brand:20,0.15 (marca=h,c es el formato de antes: solo la marca).
          for (const parte of v.split(';')) {
            const [rol, hc] = k === 'marca' ? ['brand', parte] : parte.split(':');
            const [h, c] = String(hc ?? '').split(',').map(Number);
            if (roles[rol] && Number.isFinite(h) && Number.isFinite(c)) colores[rol] = { h, c };
          }
          rolMostrado = null;
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

      sincronizarColor(rolDe(valores));
      const css = codigoTema(colores);
      tema.hidden = !css;
      if (css) tema.querySelector('code').textContent = css;

      const vista = leerVista();
      ajustarAncho(vista.ancho);
      // Solo si se mueve el color: si no, el marco usa el tema guardado del taller (o el de angela).
      marco.contentWindow?.pruebalo?.pintar({ html, dir: vista.dir, esquema: vista.esquema, movimiento: vista.movimiento, variables: css ? variablesTema(colores) : null, centrar: def.centrar });

      for (const salida of form.querySelectorAll('output[data-salida]')) {
        salida.textContent = String(new FormData(form).get(salida.dataset.salida) ?? '');
      }
      // El tono del neutro está desactivado (no va en FormData): sus salidas, desde el color guardado.
      const actual = colores[rolMostrado];
      form.querySelector('output[data-salida="color-h"]').textContent = String(rolMostrado === 'neutral' ? colores.brand.h : actual.h);
      form.querySelector('output[data-salida="color-c"]').textContent = String(actual.c);
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
    form.addEventListener('reset', () => {
      colores = structuredClone(roles);
      rolMostrado = null;
      setTimeout(pintar);
    });
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
