/**
 * Editor de iconos: se dibujan formas limpias sobre la cuadrícula de 24 y se ven, en vivo,
 * convertidas en un icono a mano alzada (el mismo código que publica @angela-ui/icons).
 *
 * Todo lo que se hace con el puntero tiene su camino con el teclado: atajos en el lienzo y
 * campos numéricos en el panel de la forma seleccionada.
 */
import { CATEGORIAS, ZONA, revisarIcono } from '@angela-ui/icons/reglas';
import { RAIZ, dibujar, formaLimpia, piezasSvg } from '@angela-ui/icons/mano-alzada';
import { githubToken } from '../lab/storage.js';

const BORRADOR = 'angela-iconos:borrador';
const AUTOR = 'angela-iconos:autor';
const NOMBRES = { linea: 'Línea', rect: 'Rectángulo', circulo: 'Círculo', elipse: 'Elipse', trazo: 'Trazo libre' };

/* ---------- Trazo libre ---------- */

/** Distancia mínima entre puntos capturados y suavizado de la entrada (0 = nada, 1 = todo). */
const LAPIZ = { separacion: 0.12, estabilizador: 0.45, tolerancia: 0.06 };

/** Douglas-Peucker sobre x, y: conserva la presión de los puntos que quedan. */
function simplificarTrazo(puntos, tolerancia) {
  if (puntos.length < 3) return puntos;
  const [a, b] = [puntos[0], puntos.at(-1)];
  const largo = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-9;
  let peor = 0;
  let indice = 0;
  for (let i = 1; i < puntos.length - 1; i++) {
    const p = puntos[i];
    const dist = Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / largo;
    // La presión también cuenta: un cambio de presión en una recta no se puede perder.
    const presion = p.length > 2 ? Math.abs(p[2] - (a[2] + ((b[2] - a[2]) * i) / (puntos.length - 1))) * 2 : 0;
    if (Math.max(dist, presion) > peor) [peor, indice] = [Math.max(dist, presion), i];
  }
  if (peor <= tolerancia) return [a, b];
  return [...simplificarTrazo(puntos.slice(0, indice + 1), tolerancia).slice(0, -1), ...simplificarTrazo(puntos.slice(indice), tolerancia)];
}

const leer = (clave, defecto) => {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? defecto;
  } catch {
    return defecto;
  }
};
const escribir = (clave, valor) => {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento (modo privado): el editor funciona igual, solo no guarda el borrador.
  }
};

const r2 = (n) => Math.round(n * 100) / 100;
const clonar = (v) => structuredClone(v);

/** ¿Se puede dibujar ya esta forma? (Las mal construidas se quedan fuera del resultado.) */
function dibujable(f) {
  return revisarIcono({ formas: [f] }).every((h) => h.regla !== 'formas');
}

/** Formas de ejemplo al añadir con el teclado: en el centro de la zona segura. */
function formaNueva(tipo, detalle) {
  const base = {
    linea: { tipo: 'linea', puntos: [[7, 12], [17, 12]] },
    rect: { tipo: 'rect', x: 7, y: 7, ancho: 10, alto: 10 },
    circulo: { tipo: 'circulo', cx: 12, cy: 12, r: 5 },
    elipse: { tipo: 'elipse', cx: 12, cy: 12, rx: 6, ry: 4 },
  }[tipo];
  return detalle ? { ...base, detalle: true } : base;
}

export function iniciarEditor() {
  const $ = (id) => document.getElementById(id);
  const el = {
    lienzo: $('ed-lienzo'),
    resultado: $('ed-resultado'),
    formas: $('ed-formas'),
    borrador: $('ed-borrador'),
    tiradores: $('ed-tiradores'),
    ayuda: $('ed-ayuda'),
    coordenadas: $('ed-coordenadas'),
    detalle: $('ed-detalle'),
    iman: $('ed-iman'),
    verFormas: $('ed-ver-formas'),
    verReferencias: $('ed-ver-referencias'),
    deshacer: $('ed-deshacer'),
    rehacer: $('ed-rehacer'),
    lista: $('ed-lista'),
    listaVacia: $('ed-lista-vacia'),
    sinSeleccion: $('ed-sin-seleccion'),
    campos: $('ed-campos'),
    guiaCuenta: $('ed-guia-cuenta'),
    guiaLista: $('ed-guia-lista'),
    nombre: $('ed-nombre'),
    categoria: $('ed-categoria'),
    etiquetas: $('ed-etiquetas'),
    autor: $('ed-autor'),
    abrir: $('ed-abrir'),
    copiar: $('ed-copiar'),
    descargar: $('ed-descargar'),
    nuevo: $('ed-nuevo'),
    nuevoDialogo: $('ed-nuevo-dialogo'),
    nuevoDesc: $('ed-nuevo-desc'),
    estado: $('ed-estado'),
    proponerAbrir: $('ed-proponer-abrir'),
    proponer: $('ed-proponer'),
    proponerForm: $('ed-proponer-form'),
    proponerResumen: $('ed-proponer-resumen'),
    proponerDescripcion: $('ed-proponer-descripcion'),
    proponerToken: $('ed-proponer-token'),
    proponerPaso: $('ed-proponer-paso'),
    proponerEnviar: $('ed-proponer-enviar'),
    proponerError: $('ed-proponer-error'),
    proponerErrorTexto: $('ed-proponer-error-texto'),
    proponerErrorEnlaceP: $('ed-proponer-error-enlace-p'),
    proponerErrorEnlace: $('ed-proponer-error-enlace'),
    hecho: $('ed-hecho'),
    hechoEnlace: $('ed-hecho-enlace'),
  };
  const herramientas = [...document.querySelectorAll('[data-herramienta]')];
  const repositorio = JSON.parse($('ed-repositorio').textContent);

  const estado = {
    formas: [],
    seleccion: null,
    herramienta: 'seleccionar',
    detalle: false,
    iman: 0.5,
    dibujando: null,
    arrastre: null,
    historia: [],
    futuro: [],
    peticion: null,
  };
  const avisar = (texto) => (el.estado.textContent = texto);

  /* ---------- Historial ---------- */

  /** Guarda el estado actual antes de cambiarlo: deshacer vuelve aquí. */
  function guardarHistoria() {
    estado.historia.push(clonar(estado.formas));
    if (estado.historia.length > 200) estado.historia.shift();
    estado.futuro = [];
  }

  function deshacer() {
    if (!estado.historia.length) return;
    estado.futuro.push(clonar(estado.formas));
    estado.formas = estado.historia.pop();
    estado.seleccion = null;
    pintar();
    avisar('Deshecho.');
  }

  function rehacer() {
    if (!estado.futuro.length) return;
    estado.historia.push(clonar(estado.formas));
    estado.formas = estado.futuro.pop();
    estado.seleccion = null;
    pintar();
    avisar('Rehecho.');
  }

  /* ---------- Coordenadas ---------- */

  /** Punto del puntero en la cuadrícula de 24, sin imán y dentro de la zona segura (trazo libre). */
  function puntoLibre(evento) {
    const m = el.lienzo.getScreenCTM().inverse();
    const p = new DOMPoint(evento.clientX, evento.clientY).matrixTransform(m);
    const dentro = (v) => Math.min(ZONA.max, Math.max(ZONA.min, v));
    return [dentro(p.x), dentro(p.y)];
  }

  /** Punto del puntero en la cuadrícula de 24, con imán. */
  function punto(evento) {
    const m = el.lienzo.getScreenCTM().inverse();
    const p = new DOMPoint(evento.clientX, evento.clientY).matrixTransform(m);
    const iman = (v) => r2(Math.min(24, Math.max(0, Math.round(v / estado.iman) * estado.iman)));
    return [iman(p.x), iman(p.y)];
  }

  /* ---------- Datos del icono ---------- */

  const nombre = () => el.nombre.value.trim();
  const etiquetas = () => el.etiquetas.value.split(',').map((e) => e.trim()).filter(Boolean);
  const icono = () => ({
    version: 1,
    categoria: el.categoria.value,
    etiquetas: etiquetas(),
    autor: el.autor.value.trim() || 'anónimo',
    licencia: 'MIT',
    formas: clonar(estado.formas),
  });
  const interior = () => piezasSvg(dibujar(estado.formas.filter(dibujable), { semilla: nombre() || 'icono' }));
  const svgCompleto = (tamano) => `<svg ${RAIZ}${tamano ? ` width="${tamano}" height="${tamano}"` : ''} aria-hidden="true">${interior()}</svg>`;

  function guardarBorrador() {
    escribir(BORRADOR, { formas: estado.formas, nombre: el.nombre.value, categoria: el.categoria.value, etiquetas: el.etiquetas.value });
  }

  /* ---------- Pintar ---------- */

  function pintar() {
    // El resultado a mano alzada, en el lienzo y en las muestras.
    const dibujo = interior();
    el.resultado.innerHTML = dibujo;
    for (const muestra of document.querySelectorAll('.ed-muestra')) {
      const t = muestra.dataset.tamano;
      muestra.innerHTML = `<svg ${RAIZ}${t === '1em' ? ' width="1em" height="1em"' : ` width="${t}" height="${t}"`} aria-hidden="true">${dibujo}</svg>`;
    }

    // Las formas limpias, con una zona de toque más ancha que el trazo para poder elegirlas.
    el.formas.innerHTML = estado.formas
      .map((f, i) => {
        const clases = `ed-forma${i === estado.seleccion ? ' esta-seleccionada' : ''}${f.detalle ? ' es-detalle' : ''}`;
        return dibujable(f) ? formaLimpia(f, `class="${clases}" data-i="${i}"`) + formaLimpia(f, `class="ed-toque" data-i="${i}"`) : '';
      })
      .join('');
    el.formas.style.display = el.verFormas.checked ? '' : 'none';
    el.lienzo.querySelector('.ed-referencias').style.display = el.verReferencias.checked ? '' : 'none';

    pintarTiradores();
    pintarBorrador();
    pintarLista();
    pintarCampos();
    pintarGuia();
    el.deshacer.disabled = !estado.historia.length;
    el.rehacer.disabled = !estado.futuro.length;
    guardarBorrador();
  }

  /** Puntos que se pueden arrastrar de la forma seleccionada. */
  function tiradores(f) {
    if (!f) return [];
    if (f.tipo === 'linea') return f.puntos.map((p, k) => ({ id: `p${k}`, x: p[0], y: p[1] }));
    if (f.tipo === 'rect') {
      return [
        { id: 'nw', x: f.x, y: f.y },
        { id: 'ne', x: f.x + f.ancho, y: f.y },
        { id: 'se', x: f.x + f.ancho, y: f.y + f.alto },
        { id: 'sw', x: f.x, y: f.y + f.alto },
      ];
    }
    if (f.tipo === 'circulo') return [{ id: 'r', x: f.cx + f.r, y: f.cy }];
    if (f.tipo === 'elipse') return [{ id: 'rx', x: f.cx + f.rx, y: f.cy }, { id: 'ry', x: f.cx, y: f.cy + f.ry }];
    return [];
  }

  function pintarTiradores() {
    const f = estado.formas[estado.seleccion];
    el.tiradores.innerHTML = tiradores(f)
      .map((t) => `<circle class="ed-tirador" data-tirador="${t.id}" cx="${t.x}" cy="${t.y}" r="0.45"/>`)
      .join('');
  }

  function pintarBorrador() {
    const d = estado.dibujando;
    if (!d) {
      el.borrador.innerHTML = '';
      return;
    }
    if (d.tipo === 'trazo') {
      // Mientras dibujas ya ves el grosor que le da la presión.
      const f = d.puntos.length > 1 ? { tipo: 'trazo', puntos: d.puntos, ...(estado.detalle && { detalle: true }) } : null;
      el.borrador.innerHTML = f ? `<g class="ed-tinta">${piezasSvg(dibujar([f], { semilla: nombre() || 'icono' }))}</g>` : '';
      return;
    }
    const f = formaEnCurso();
    el.borrador.innerHTML = f ? formaLimpia(f) : '';
    if (d.tipo === 'linea') {
      el.borrador.innerHTML += d.puntos.map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="${k === 0 ? 0.4 : 0.25}"${k === 0 ? ' class="ed-primer-punto"' : ''}/>`).join('');
    }
  }

  /** La forma que se está dibujando, con el cursor como último punto. */
  function formaEnCurso(d = estado.dibujando) {
    if (!d) return null;
    const detalle = estado.detalle ? { detalle: true } : {};
    if (d.tipo === 'trazo') {
      const puntos = simplificarTrazo(d.puntos, LAPIZ.tolerancia).map((p) => p.map(r2));
      const xs = puntos.map((p) => p[0]);
      const ys = puntos.map((p) => p[1]);
      if (puntos.length < 2 || Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) < 0.5) return null;
      return { tipo: 'trazo', puntos, ...detalle };
    }
    if (d.tipo === 'linea') return { tipo: 'linea', puntos: [...d.puntos, d.cursor ?? d.puntos.at(-1)], ...detalle };
    const [x1, y1] = d.inicio;
    const [x2, y2] = d.fin;
    if (d.tipo === 'rect') return { tipo: 'rect', x: Math.min(x1, x2), y: Math.min(y1, y2), ancho: r2(Math.abs(x2 - x1)), alto: r2(Math.abs(y2 - y1)), ...detalle };
    if (d.tipo === 'circulo') return { tipo: 'circulo', cx: x1, cy: y1, r: r2(Math.hypot(x2 - x1, y2 - y1)), ...detalle };
    if (d.tipo === 'elipse') return { tipo: 'elipse', cx: r2((x1 + x2) / 2), cy: r2((y1 + y2) / 2), rx: r2(Math.abs(x2 - x1) / 2), ry: r2(Math.abs(y2 - y1) / 2), ...detalle };
    return null;
  }

  const describir = (f) => {
    if (f.tipo === 'trazo') return `${NOMBRES.trazo}${f.puntos.some((p) => p.length > 2) ? ' con presión' : ''}, ${f.puntos.length} puntos`;
    if (f.tipo === 'linea') return `${NOMBRES.linea}${f.cerrada ? ' cerrada' : ''}, ${f.puntos.length} puntos`;
    if (f.tipo === 'rect') return `${NOMBRES.rect} ${f.ancho}×${f.alto}${f.radio ? `, radio ${f.radio}` : ''}`;
    if (f.tipo === 'circulo') return `${NOMBRES.circulo} de radio ${f.r}`;
    return `${NOMBRES.elipse} ${f.rx * 2}×${f.ry * 2}`;
  };

  function pintarLista() {
    el.listaVacia.hidden = estado.formas.length > 0;
    el.lista.replaceChildren(
      ...estado.formas.map((f, i) => {
        const li = document.createElement('li');
        li.className = 'ed-lista-item';
        const elegir = document.createElement('button');
        elegir.type = 'button';
        elegir.className = 'button';
        elegir.dataset.variant = i === estado.seleccion ? 'soft' : 'ghost';
        elegir.dataset.tone = 'neutral';
        elegir.dataset.size = 'sm';
        elegir.setAttribute('aria-pressed', String(i === estado.seleccion));
        elegir.textContent = `${i + 1}. ${describir(f)}${f.detalle ? ' · detalle' : ''}`;
        elegir.addEventListener('click', () => seleccionar(i));
        const quitar = document.createElement('button');
        quitar.type = 'button';
        quitar.className = 'button';
        quitar.dataset.variant = 'ghost';
        quitar.dataset.tone = 'danger';
        quitar.dataset.size = 'sm';
        quitar.textContent = 'Quitar';
        quitar.setAttribute('aria-label', `Quitar la forma ${i + 1} (se puede deshacer)`);
        quitar.addEventListener('click', () => eliminar(i));
        li.append(elegir, quitar);
        return li;
      }),
    );
  }

  /* ---------- Panel de la forma seleccionada ---------- */

  function campoNumero(etiqueta, valor, alCambiar) {
    const id = `ed-c-${Math.random().toString(36).slice(2, 8)}`;
    const div = document.createElement('div');
    div.className = 'field ed-campo';
    div.innerHTML = `<label for="${id}"></label><input class="input" id="${id}" type="number" step="${estado.iman}" min="0" max="24" inputmode="decimal">`;
    div.querySelector('label').textContent = etiqueta;
    const input = div.querySelector('input');
    input.value = String(valor);
    input.addEventListener('change', () => {
      const n = Number.parseFloat(input.value);
      if (!Number.isFinite(n)) return;
      guardarHistoria();
      alCambiar(r2(n));
      pintar();
    });
    return div;
  }

  function casilla(etiqueta, marcada, alCambiar) {
    const label = document.createElement('label');
    label.className = 'ed-casilla';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(marcada);
    input.addEventListener('change', () => {
      guardarHistoria();
      alCambiar(input.checked);
      pintar();
    });
    label.append(input, ` ${etiqueta}`);
    return label;
  }

  function pintarCampos() {
    const f = estado.formas[estado.seleccion];
    el.sinSeleccion.hidden = Boolean(f);
    el.campos.hidden = !f;
    if (!f) {
      el.campos.replaceChildren();
      return;
    }
    // Si el foco está en un campo del panel, no se reconstruye: se perdería mientras escribes.
    if (el.campos.contains(document.activeElement) && el.campos.dataset.forma === String(estado.seleccion)) return;
    el.campos.dataset.forma = String(estado.seleccion);
    const titulo = document.createElement('p');
    titulo.className = 'ed-campos-titulo';
    titulo.textContent = `Forma ${estado.seleccion + 1}: ${NOMBRES[f.tipo]}`;
    const fila = document.createElement('div');
    fila.className = 'ed-campos-fila';
    const extra = [];

    if (f.tipo === 'trazo') {
      const nota = document.createElement('p');
      nota.className = 'muted';
      nota.textContent = f.puntos.some((p) => p.length > 2)
        ? 'Dibujado a mano, con la presión del lápiz. Muévelo arrastrándolo o con las flechas; para cambiar su forma, vuelve a dibujarlo.'
        : 'Dibujado a mano, sin presión (ratón o dedo): el grosor sigue la curva de la guía. Muévelo arrastrándolo o con las flechas.';
      extra.push(nota);
    } else if (f.tipo === 'linea') {
      f.puntos.forEach((p, k) => {
        fila.append(campoNumero(`Punto ${k + 1} · x`, p[0], (n) => (f.puntos[k][0] = n)), campoNumero(`Punto ${k + 1} · y`, p[1], (n) => (f.puntos[k][1] = n)));
      });
      const anadir = document.createElement('button');
      anadir.type = 'button';
      anadir.className = 'button';
      anadir.dataset.variant = 'outline';
      anadir.dataset.tone = 'neutral';
      anadir.dataset.size = 'sm';
      anadir.textContent = 'Añadir un punto';
      anadir.addEventListener('click', () => {
        guardarHistoria();
        // El punto nuevo sigue la dirección del último tramo, a media distancia, sin salir de la zona.
        const [a, b] = [f.puntos.at(-2), f.puntos.at(-1)];
        const dentro = (v) => r2(Math.min(22, Math.max(2, v)));
        f.puntos.push([dentro(b[0] + (b[0] - a[0]) / 2), dentro(b[1] + (b[1] - a[1]) / 2)]);
        pintar();
      });
      const quitarPunto = document.createElement('button');
      quitarPunto.type = 'button';
      quitarPunto.className = 'button';
      quitarPunto.dataset.variant = 'ghost';
      quitarPunto.dataset.tone = 'neutral';
      quitarPunto.dataset.size = 'sm';
      quitarPunto.textContent = 'Quitar el último punto';
      quitarPunto.disabled = f.puntos.length <= 2;
      quitarPunto.addEventListener('click', () => {
        guardarHistoria();
        f.puntos.pop();
        pintar();
      });
      const botones = document.createElement('div');
      botones.className = 'cluster';
      botones.append(anadir, quitarPunto);
      extra.push(botones, casilla('Cerrada (vuelve al primer punto)', f.cerrada, (v) => (v ? (f.cerrada = true) : delete f.cerrada)));
    } else {
      const campos = { rect: ['x', 'y', 'ancho', 'alto', 'radio'], circulo: ['cx', 'cy', 'r'], elipse: ['cx', 'cy', 'rx', 'ry'] }[f.tipo];
      for (const k of campos) fila.append(campoNumero(k, f[k] ?? 0, (n) => (f[k] = n)));
    }
    extra.push(casilla('Trazo de detalle (más fino)', f.detalle, (v) => (v ? (f.detalle = true) : delete f.detalle)));
    el.campos.replaceChildren(titulo, fila, ...extra);
  }

  /* ---------- Guía ---------- */

  function pintarGuia() {
    const hallazgos = revisarIcono({ formas: estado.formas, categoria: el.categoria.value, etiquetas: etiquetas() }, { nombre: nombre() || undefined });
    if (!nombre()) hallazgos.push({ nivel: 'aviso', regla: 'nombre', texto: 'Ponle nombre: en inglés, minúsculas y guiones (shopping-cart).' });
    const errores = hallazgos.filter((h) => h.nivel === 'error').length;
    el.guiaCuenta.textContent = hallazgos.length ? String(hallazgos.length) : 'Cumple';
    el.guiaCuenta.dataset.tone = errores ? 'danger' : hallazgos.length ? 'warning' : 'success';
    el.guiaLista.replaceChildren(
      ...(hallazgos.length ? hallazgos : [{ nivel: 'bien', texto: 'Cumple la guía.' }]).map((h) => {
        const li = document.createElement('li');
        li.className = 'callout';
        li.dataset.tone = { error: 'danger', aviso: 'warning', bien: 'success' }[h.nivel];
        const div = document.createElement('div');
        const titulo = document.createElement('p');
        titulo.className = 'callout-title';
        titulo.textContent = { error: 'Hay que corregirlo', aviso: 'Revísalo', bien: 'Todo en orden' }[h.nivel];
        const texto = document.createElement('p');
        texto.textContent = h.texto;
        div.append(titulo, texto);
        if (h.forma !== undefined) {
          const ver = document.createElement('button');
          ver.type = 'button';
          ver.className = 'button';
          ver.dataset.variant = 'outline';
          ver.dataset.tone = 'neutral';
          ver.dataset.size = 'sm';
          ver.textContent = `Elegir la forma ${h.forma + 1}`;
          ver.addEventListener('click', () => seleccionar(h.forma));
          div.append(ver);
        }
        li.append(div);
        return li;
      }),
    );
    el.proponerAbrir.dataset.errores = String(errores);
  }

  /* ---------- Acciones sobre formas ---------- */

  function seleccionar(i) {
    estado.seleccion = i;
    pintar();
    if (i !== null) avisar(`Elegida la forma ${i + 1}: ${describir(estado.formas[i])}.`);
  }

  function anadir(f) {
    guardarHistoria();
    estado.formas.push(f);
    estado.seleccion = estado.formas.length - 1;
    pintar();
    avisar(`Añadida la forma ${estado.formas.length}: ${describir(f)}.`);
  }

  /** Quitar una forma se puede deshacer (Ctrl+Z o el botón): no pide confirmación. */
  function eliminar(i = estado.seleccion) {
    if (i === null || i === undefined) return;
    guardarHistoria();
    const [f] = estado.formas.splice(i, 1);
    estado.seleccion = null;
    pintar();
    avisar(`Quitada la forma ${i + 1} (${describir(f)}). Deshacer la recupera.`);
  }

  function duplicar() {
    const f = estado.formas[estado.seleccion];
    if (!f) return;
    anadir(mover(clonar(f), 1, 1));
  }

  /** Desplaza una forma (devuelve la misma forma, cambiada). */
  function mover(f, dx, dy) {
    if (f.tipo === 'linea' || f.tipo === 'trazo') f.puntos = f.puntos.map(([x, y, ...resto]) => [r2(x + dx), r2(y + dy), ...resto]);
    else if (f.tipo === 'rect') Object.assign(f, { x: r2(f.x + dx), y: r2(f.y + dy) });
    else Object.assign(f, { cx: r2(f.cx + dx), cy: r2(f.cy + dy) });
    return f;
  }

  /** Lleva un tirador a un punto. */
  function moverTirador(f, id, [x, y]) {
    if (f.tipo === 'linea') f.puntos[Number(id.slice(1))] = [x, y];
    else if (f.tipo === 'rect') {
      const izq = id.includes('w') ? x : f.x;
      const der = id.includes('e') ? x : f.x + f.ancho;
      const arr = id.includes('n') ? y : f.y;
      const aba = id.includes('s') ? y : f.y + f.alto;
      Object.assign(f, { x: Math.min(izq, der), y: Math.min(arr, aba), ancho: r2(Math.abs(der - izq)), alto: r2(Math.abs(aba - arr)) });
    } else if (f.tipo === 'circulo') f.r = r2(Math.max(estado.iman, Math.hypot(x - f.cx, y - f.cy)));
    else if (id === 'rx') f.rx = r2(Math.max(estado.iman, Math.abs(x - f.cx)));
    else f.ry = r2(Math.max(estado.iman, Math.abs(y - f.cy)));
  }

  /* ---------- Herramientas ---------- */

  function elegirHerramienta(id, { foco = false } = {}) {
    terminarLinea({ cancelar: true });
    estado.herramienta = id;
    for (const b of herramientas) {
      const activa = b.dataset.herramienta === id;
      b.setAttribute('aria-checked', String(activa));
      b.dataset.variant = activa ? 'soft' : 'ghost';
      b.tabIndex = activa ? 0 : -1;
      if (activa) {
        el.ayuda.textContent = b.dataset.ayuda;
        if (foco) b.focus();
      }
    }
    el.lienzo.dataset.herramienta = id;
  }

  function terminarLinea({ cancelar = false } = {}) {
    const d = estado.dibujando;
    if (!d || d.tipo !== 'linea') return;
    estado.dibujando = null;
    if (!cancelar && d.puntos.length >= 2) {
      anadir({ tipo: 'linea', puntos: d.puntos, ...(d.cerrada && { cerrada: true }), ...(estado.detalle && { detalle: true }) });
    } else pintar();
  }

  /* ---------- Puntero ---------- */

  el.lienzo.addEventListener('pointerdown', (evento) => {
    if (evento.button !== 0) return;
    el.lienzo.focus();
    const p = punto(evento);
    const tirador = evento.target.closest('[data-tirador]');
    const forma = evento.target.closest('[data-i]');

    if (tirador && estado.seleccion !== null) {
      guardarHistoria();
      estado.arrastre = { modo: 'tirador', id: tirador.dataset.tirador };
      el.lienzo.setPointerCapture(evento.pointerId);
      return;
    }

    if (estado.herramienta === 'seleccionar') {
      if (forma) {
        const i = Number(forma.dataset.i);
        seleccionar(i);
        guardarHistoria();
        estado.arrastre = { modo: 'mover', origen: p, copia: clonar(estado.formas[i]), movido: false };
        el.lienzo.setPointerCapture(evento.pointerId);
      } else seleccionar(null);
      return;
    }

    if (estado.herramienta === 'trazo') {
      // Solo el lápiz de una tableta da presión real; el ratón y el dedo, no.
      const conPresion = evento.pointerType === 'pen';
      const [x, y] = puntoLibre(evento);
      estado.dibujando = { tipo: 'trazo', conPresion, puntos: [conPresion ? [x, y, evento.pressure] : [x, y]], suave: [x, y, evento.pressure] };
      el.lienzo.setPointerCapture(evento.pointerId);
      pintarBorrador();
      return;
    }

    if (estado.herramienta === 'linea') {
      const d = estado.dibujando;
      if (!d) {
        estado.dibujando = { tipo: 'linea', puntos: [p], cursor: p };
      } else {
        const [x0, y0] = d.puntos[0];
        // Pulsar el primer punto cierra la figura.
        if (d.puntos.length >= 3 && Math.hypot(p[0] - x0, p[1] - y0) < 0.6) {
          d.cerrada = true;
          terminarLinea();
          return;
        }
        // Pulsar otra vez en el último punto termina la línea (también en pantallas táctiles,
        // donde el doble toque no es fiable).
        const ultimo = d.puntos.at(-1);
        if (p[0] === ultimo[0] && p[1] === ultimo[1]) {
          if (d.puntos.length >= 2) terminarLinea();
          return;
        }
        d.puntos.push(p);
      }
      pintarBorrador();
      return;
    }

    estado.dibujando = { tipo: estado.herramienta, inicio: p, fin: p };
    el.lienzo.setPointerCapture(evento.pointerId);
  });

  el.lienzo.addEventListener('pointermove', (evento) => {
    const p = punto(evento);
    el.coordenadas.textContent = `x ${p[0]} · y ${p[1]}${evento.pointerType === 'pen' ? ` · presión ${evento.pressure.toFixed(2)}` : ''}`;
    const a = estado.arrastre;
    if (estado.dibujando?.tipo === 'trazo') {
      const d = estado.dibujando;
      // Los eventos agrupados traen todos los puntos del lápiz entre dos fotogramas.
      for (const e of evento.getCoalescedEvents?.() ?? [evento]) {
        const [x, y] = puntoLibre(e);
        const k = 1 - LAPIZ.estabilizador;
        // Estabilizador: el punto sigue al lápiz con un poco de retraso y se lleva el temblor.
        d.suave = [d.suave[0] + (x - d.suave[0]) * k, d.suave[1] + (y - d.suave[1]) * k, d.suave[2] + (e.pressure - d.suave[2]) * k];
        const ultimo = d.puntos.at(-1);
        if (Math.hypot(d.suave[0] - ultimo[0], d.suave[1] - ultimo[1]) < LAPIZ.separacion) continue;
        d.puntos.push(d.conPresion ? [...d.suave] : [d.suave[0], d.suave[1]]);
      }
      pintarBorrador();
      return;
    }
    if (a?.modo === 'tirador') {
      moverTirador(estado.formas[estado.seleccion], a.id, p);
      pintar();
    } else if (a?.modo === 'mover') {
      const f = mover(clonar(a.copia), r2(p[0] - a.origen[0]), r2(p[1] - a.origen[1]));
      a.movido = a.movido || p[0] !== a.origen[0] || p[1] !== a.origen[1];
      estado.formas[estado.seleccion] = f;
      pintar();
    } else if (estado.dibujando?.tipo === 'linea') {
      estado.dibujando.cursor = p;
      pintarBorrador();
    } else if (estado.dibujando) {
      estado.dibujando.fin = p;
      pintarBorrador();
    }
  });

  el.lienzo.addEventListener('pointerup', (evento) => {
    const a = estado.arrastre;
    if (a) {
      // Un clic sin mover no deja un paso vacío en el historial.
      if (a.modo === 'mover' && !a.movido) estado.historia.pop();
      estado.arrastre = null;
      pintar();
      return;
    }
    const d = estado.dibujando;
    if (d?.tipo === 'trazo') {
      estado.dibujando = null;
      // El estabilizador va por detrás del lápiz: el trazo acaba donde se levantó, no antes.
      const [x, y] = puntoLibre(evento);
      d.puntos.push(d.conPresion ? [x, y, d.suave[2]] : [x, y]);
      const f = formaEnCurso(d);
      if (f) anadir(f);
      else {
        pintar();
        avisar('Trazo demasiado corto: no se ha añadido.');
      }
      return;
    }
    if (d && d.tipo !== 'linea') {
      const f = formaEnCurso();
      estado.dibujando = null;
      if (f && dibujable(f)) anadir(f);
      else pintar();
    }
  });

  el.lienzo.addEventListener('dblclick', () => {
    if (estado.dibujando?.tipo === 'linea') {
      // El doble clic ha añadido el mismo punto dos veces: se queda uno.
      const pts = estado.dibujando.puntos;
      if (pts.length > 2 && pts.at(-1)[0] === pts.at(-2)[0] && pts.at(-1)[1] === pts.at(-2)[1]) pts.pop();
      terminarLinea();
    }
  });

  el.lienzo.addEventListener('pointerleave', () => (el.coordenadas.textContent = 'x — · y —'));

  /* ---------- Teclado ---------- */

  const escribiendo = (t) => t.closest?.('input, textarea, select, [contenteditable]');

  document.addEventListener('keydown', (evento) => {
    if (escribiendo(evento.target) || evento.target.closest('dialog')) return;
    const mod = evento.metaKey || evento.ctrlKey;
    const k = evento.key;

    if (mod && k.toLowerCase() === 'z') {
      evento.preventDefault();
      if (evento.shiftKey) rehacer();
      else deshacer();
      return;
    }
    if (mod && k.toLowerCase() === 'y') {
      evento.preventDefault();
      rehacer();
      return;
    }
    if (mod && k.toLowerCase() === 'd') {
      evento.preventDefault();
      duplicar();
      return;
    }
    if (mod || evento.altKey) return;

    const atajos = { p: 'trazo', v: 'seleccionar', l: 'linea', r: 'rect', c: 'circulo', e: 'elipse' };
    if (atajos[k.toLowerCase()]) {
      elegirHerramienta(atajos[k.toLowerCase()]);
      return;
    }
    if (k.toLowerCase() === 'd') {
      el.detalle.click();
      return;
    }
    // Lo demás solo con el foco en el lienzo: así no se roban las flechas al resto de la página.
    if (document.activeElement !== el.lienzo) return;
    if (k === 'Enter') {
      evento.preventDefault();
      terminarLinea();
    } else if (k === 'Escape') {
      if (estado.dibujando) {
        estado.dibujando = null;
        pintar();
        avisar('Dibujo cancelado.');
      } else seleccionar(null);
    } else if ((k === 'Delete' || k === 'Backspace') && estado.seleccion !== null) {
      evento.preventDefault();
      eliminar();
    } else if (k.startsWith('Arrow') && estado.seleccion !== null) {
      evento.preventDefault();
      const paso = evento.shiftKey ? 1 : estado.iman;
      const [dx, dy] = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[k];
      guardarHistoria();
      mover(estado.formas[estado.seleccion], dx, dy);
      pintar();
    }
  });

  // Grupo de herramientas: flechas entre opciones, como un grupo de radio.
  for (const b of herramientas) {
    b.addEventListener('click', () => elegirHerramienta(b.dataset.herramienta));
    b.addEventListener('keydown', (evento) => {
      const i = herramientas.indexOf(b);
      const siguiente = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[evento.key];
      if (!siguiente) return;
      evento.preventDefault();
      evento.stopPropagation();
      elegirHerramienta(herramientas[(i + siguiente + herramientas.length) % herramientas.length].dataset.herramienta, { foco: true });
    });
  }

  el.detalle.addEventListener('click', () => {
    estado.detalle = !estado.detalle;
    el.detalle.setAttribute('aria-pressed', String(estado.detalle));
    el.detalle.dataset.variant = estado.detalle ? 'soft' : 'ghost';
    avisar(estado.detalle ? 'Las formas nuevas se dibujan con trazo de detalle.' : 'Las formas nuevas se dibujan con trazo de contorno.');
  });

  el.iman.addEventListener('change', () => {
    estado.iman = Number(el.iman.value);
    pintar();
  });
  el.verFormas.addEventListener('change', pintar);
  el.verReferencias.addEventListener('change', pintar);
  el.deshacer.addEventListener('click', deshacer);
  el.rehacer.addEventListener('click', rehacer);
  for (const b of document.querySelectorAll('[data-anadir]')) b.addEventListener('click', () => anadir(formaNueva(b.dataset.anadir, estado.detalle)));

  /* ---------- Datos, abrir, copiar, descargar ---------- */

  for (const campo of [el.nombre, el.categoria, el.etiquetas]) campo.addEventListener('input', pintar);
  el.autor.addEventListener('input', () => escribir(AUTOR, el.autor.value));

  function cargar(datos) {
    estado.formas = clonar(datos.formas ?? []);
    el.nombre.value = datos.nombre ?? '';
    el.categoria.value = CATEGORIAS.includes(datos.categoria) ? datos.categoria : '';
    el.etiquetas.value = Array.isArray(datos.etiquetas) ? datos.etiquetas.join(', ') : (datos.etiquetas ?? '');
    estado.seleccion = null;
    estado.historia = [];
    estado.futuro = [];
    pintar();
  }

  el.abrir.addEventListener('change', () => {
    const i = repositorio.find((x) => x.nombre === el.abrir.value);
    if (!i) return;
    if (estado.formas.length) guardarHistoria();
    const historia = estado.historia;
    cargar(i);
    estado.historia = historia;
    pintar();
    avisar(`Abierto «${i.nombre}» del repositorio. Deshacer vuelve a lo que tenías.`);
  });

  el.copiar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(svgCompleto(24));
      avisar('SVG copiado.');
    } catch {
      avisar('No se pudo copiar.');
    }
  });

  el.descargar.addEventListener('click', () => {
    const blob = new Blob([`${JSON.stringify(icono(), null, 2)}\n`], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${nombre() || 'icono'}.json` });
    a.click();
    URL.revokeObjectURL(a.href);
    avisar(`Descargado ${a.download}.`);
  });

  el.nuevo.addEventListener('click', () => {
    el.nuevoDesc.textContent = estado.formas.length
      ? `Se borran las ${estado.formas.length} formas del lienzo${nombre() ? ` y los datos de «${nombre()}»` : ''}.`
      : 'El lienzo ya está vacío.';
    el.nuevoDialogo.returnValue = '';
    el.nuevoDialogo.showModal();
  });
  el.nuevoDialogo.addEventListener('close', () => {
    if (el.nuevoDialogo.returnValue !== 'borrar') return;
    cargar({});
    avisar('Lienzo vacío: empiezas de cero.');
  });

  /* ---------- Proponer ---------- */

  el.proponerAbrir.addEventListener('click', () => {
    const errores = Number(el.proponerAbrir.dataset.errores);
    el.proponerError.hidden = true;
    el.proponerPaso.textContent = '';
    el.proponerResumen.textContent = errores
      ? `Antes de proponerlo, corrige ${errores === 1 ? 'el error' : `los ${errores} errores`} de la guía (paso 3).`
      : `Se propondrá packages/angela-icons/iconos/${nombre()}.json: ${estado.formas.length} formas, categoría ${el.categoria.value}.`;
    el.proponerToken.textContent = githubToken.get()
      ? 'Se abrirá a tu nombre con el token de GitHub de los Ajustes del laboratorio.'
      : 'Necesitas un token de GitHub: añádelo en los Ajustes del laboratorio.';
    el.proponerEnviar.disabled = errores > 0 || !nombre() || !githubToken.get();
    el.proponer.showModal();
  });

  el.proponerForm.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!el.proponerDescripcion.value.trim()) {
      el.proponerDescripcion.reportValidity();
      return;
    }
    const { proposeIcon } = await import('../lab/github.js');
    el.proponerEnviar.disabled = true;
    el.proponerError.hidden = true;
    estado.peticion = new AbortController();
    try {
      const avisos = revisarIcono(icono(), { nombre: nombre() }).filter((h) => h.nivel === 'aviso').map((h) => h.texto);
      const { url } = await proposeIcon({
        token: githubToken.get(),
        nombre: nombre(),
        icono: icono(),
        svg: svgCompleto(),
        descripcion: el.proponerDescripcion.value,
        avisos,
        onStep: (t) => (el.proponerPaso.textContent = t),
        signal: estado.peticion.signal,
      });
      el.proponer.close();
      el.hechoEnlace.href = url;
      el.hecho.hidden = false;
      el.hecho.focus();
    } catch (error) {
      if (error?.name === 'AbortError') return;
      el.proponerPaso.textContent = '';
      el.proponerErrorTexto.textContent = error?.message || 'Algo falló por el camino.';
      const compare = error?.cause?.compareUrl;
      el.proponerErrorEnlaceP.hidden = !compare;
      if (compare) el.proponerErrorEnlace.href = compare;
      el.proponerError.hidden = false;
      el.proponerError.focus();
    } finally {
      estado.peticion = null;
      el.proponerEnviar.disabled = false;
    }
  });

  /* ---------- Arranque ---------- */

  el.autor.value = leer(AUTOR, '');
  const pedido = new URLSearchParams(location.search).get('icono');
  const delRepositorio = repositorio.find((x) => x.nombre === pedido);
  if (delRepositorio) {
    cargar(delRepositorio);
    el.abrir.value = delRepositorio.nombre;
    avisar(`Abierto «${delRepositorio.nombre}» del repositorio.`);
  } else cargar(leer(BORRADOR, {}));
  elegirHerramienta('trazo');
}
