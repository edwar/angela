/**
 * Calendario de fecha única o de rango sobre <div class="calendar"> (ver calendar.css).
 *
 * Nativo primero: el contenedor lleva uno (fecha única) o dos (rango) <input type="date">.
 * Sin JS se usan esos inputs tal cual. Con JS se ocultan, siguen enviando su valor en el
 * formulario y el calendario los rellena (con sus eventos input y change).
 *
 * - data-mode="single|range". min y max se leen del primer input.
 * - Patrón de cuadrícula de WAI-ARIA: flechas, Inicio/Fin (semana), RePág/AvPág (mes),
 *   Mayús+RePág/AvPág (año), Intro o Espacio para elegir. Respeta RTL.
 * - Idioma y primer día de la semana salen del lang más cercano (Intl).
 * - Emite "calendarchange" con { value } (única) o { start, end } (rango).
 * - Dentro de un .popover nativo, es un selector de fecha: el botón que lo abre (commandfor o
 *   popovertarget) muestra la fecha en su .calendar-value, el panel se cierra al elegir y al
 *   abrirse lleva el foco al día elegido.
 * - Escucha en la raíz (delegación) y monta con un MutationObserver los calendarios que
 *   aparezcan después: sirve igual con HTML del servidor que con un framework.
 */

const SELECTOR = '.calendar';
const FLECHA = (d) =>
  `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

/* ---------- Fechas ---------- */

const aIso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Fechas a mediodía: así sumar días nunca cae en otro día por un cambio de horario. */
function deIso(texto) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto ?? '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null;
}

const sumarDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);

function sumarMeses(d, n) {
  const ultimo = new Date(d.getFullYear(), d.getMonth() + n + 1, 0, 12).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), ultimo), 12);
}

/** 0 = domingo … 6 = sábado. Si el navegador no lo sabe, lunes. */
function primerDiaSemana(lang) {
  try {
    const locale = new Intl.Locale(lang);
    const info = locale.getWeekInfo?.() ?? locale.weekInfo;
    if (info?.firstDay) return info.firstDay % 7;
  } catch {
    // Idioma no válido: se usa el lunes.
  }
  return 1;
}

/* ---------- Lectura del calendario ---------- */

/** Estado que no está en el DOM: mes visible, día con el foco y vista previa del rango. */
const estados = new WeakMap();
let contador = 0;

const inputsDe = (cal) => [...cal.querySelectorAll('input[type="date"]')];
const modoDe = (cal) => (cal.dataset.mode === 'range' ? 'range' : 'single');
const idiomaDe = (cal) => cal.closest('[lang]')?.getAttribute('lang') || navigator.language || 'es';

function leer(cal) {
  const [primero, segundo] = inputsDe(cal);
  const rango = modoDe(cal) === 'range';
  return {
    inicio: deIso(primero?.value),
    fin: rango ? deIso(segundo?.value) : null,
    min: deIso(primero?.min),
    max: deIso(primero?.max),
  };
}

function limitar(cal, d) {
  const { min, max } = leer(cal);
  const fecha = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  if (min && fecha < min) return min;
  if (max && fecha > max) return max;
  return fecha;
}

function fuera(cal, d) {
  const { min, max } = leer(cal);
  return (min && d < min) || (max && d > max);
}

/* ---------- Selector de fecha (calendario dentro de un popover) ---------- */

const panelDe = (cal) => cal.closest('[popover]');

function disparadorDe(cal) {
  const panel = panelDe(cal);
  if (!panel?.id) return null;
  const id = CSS.escape(panel.id);
  return cal.ownerDocument.querySelector(`[commandfor="${id}"], [popovertarget="${id}"]`);
}

/** Escribe la fecha elegida en el botón que abre el panel (o deja su texto original). */
function rotular(cal) {
  const boton = disparadorDe(cal);
  if (!boton) return;
  const valor = boton.querySelector('.calendar-value') ?? boton;
  valor.dataset.placeholder ??= valor.textContent.trim();
  const { inicio, fin } = leer(cal);
  const fmt = new Intl.DateTimeFormat(idiomaDe(cal), { day: 'numeric', month: 'short', year: 'numeric' });
  let texto = '';
  if (modoDe(cal) === 'single' && inicio) texto = fmt.format(inicio);
  else if (inicio && fin) texto = fmt.formatRange?.(inicio, fin) ?? `${fmt.format(inicio)} – ${fmt.format(fin)}`;
  else if (inicio) texto = `${fmt.format(inicio)} – …`;
  valor.textContent = texto || valor.dataset.placeholder;
  boton.toggleAttribute('data-placeholder', !texto);
}

function cerrarPanel(cal) {
  const panel = panelDe(cal);
  if (panel?.matches(':popover-open')) panel.hidePopover();
}

/* ---------- Montar y pintar ---------- */

function montar(cal) {
  if (estados.has(cal) || !inputsDe(cal).length) return;
  const id = `calendario-${++contador}`;

  const respaldo = cal.querySelector(':scope > .calendar-fallback');
  if (respaldo) respaldo.hidden = true;

  const cabecera = document.createElement('div');
  cabecera.className = 'calendar-header';
  cabecera.innerHTML = `
    <button type="button" class="button" data-variant="ghost" data-tone="neutral" data-size="sm" data-icon-only data-calendar-nav="-1">${FLECHA('m15 18-6-6 6-6')}</button>
    <div class="calendar-title" id="${id}-titulo" aria-live="polite"></div>
    <button type="button" class="button" data-variant="ghost" data-tone="neutral" data-size="sm" data-icon-only data-calendar-nav="1">${FLECHA('m9 18 6-6-6-6')}</button>`;

  const tabla = document.createElement('table');
  tabla.className = 'calendar-grid';
  tabla.setAttribute('role', 'grid');
  tabla.setAttribute('aria-labelledby', `${id}-titulo`);

  const estado = document.createElement('p');
  estado.className = 'calendar-status';
  estado.setAttribute('aria-live', 'polite');

  cal.append(cabecera, tabla, estado);
  cal.dataset.calendarReady = '';
  estados.set(cal, { mes: null, foco: limitar(cal, leer(cal).inicio ?? new Date()), preview: null });
  pintar(cal);
}

/** Quita lo que añadió montar() y vuelve a mostrar los inputs nativos. */
function desmontar(cal) {
  if (!estados.has(cal)) return;
  cal.querySelectorAll(':scope > :is(.calendar-header, .calendar-grid, .calendar-status)').forEach((el) => el.remove());
  const respaldo = cal.querySelector(':scope > .calendar-fallback');
  if (respaldo) respaldo.hidden = false;
  delete cal.dataset.calendarReady;
  estados.delete(cal);
}

/** Dibuja el mes del día con el foco: siempre 6 semanas, para que el alto no salte. */
function pintar(cal) {
  const est = estados.get(cal);
  const tabla = cal.querySelector(':scope > .calendar-grid');
  if (!est || !tabla) return;
  const lang = idiomaDe(cal);
  const es = lang.startsWith('es');
  const primero = primerDiaSemana(lang);
  const { min, max } = leer(cal);
  est.mes = new Date(est.foco.getFullYear(), est.foco.getMonth(), 1, 12);

  const fmtTitulo = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' });
  const fmtCorto = new Intl.DateTimeFormat(lang, { weekday: 'narrow' });
  const fmtLargo = new Intl.DateTimeFormat(lang, { weekday: 'long' });
  const fmtDia = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  cal.querySelector('.calendar-title').textContent = fmtTitulo.format(est.mes);
  const [anterior, siguiente] = cal.querySelectorAll('[data-calendar-nav]');
  anterior.setAttribute('aria-label', es ? 'Mes anterior' : 'Previous month');
  siguiente.setAttribute('aria-label', es ? 'Mes siguiente' : 'Next month');
  anterior.disabled = !!min && sumarDias(est.mes, -1) < min;
  siguiente.disabled = !!max && sumarMeses(est.mes, 1) > max;

  // Un domingo conocido (1 de enero de 2023) para nombrar los días de la semana.
  const cabecera = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2023, 0, 1 + ((primero + i) % 7), 12);
    return `<th scope="col"><span aria-hidden="true">${fmtCorto.format(d)}</span><span class="visually-hidden">${fmtLargo.format(d)}</span></th>`;
  }).join('');

  const hueco = (est.mes.getDay() - primero + 7) % 7;
  const hoy = aIso(new Date());
  const foco = aIso(est.foco);
  const filas = [];
  for (let semana = 0; semana < 6; semana++) {
    const celdas = [];
    for (let dia = 0; dia < 7; dia++) {
      const d = sumarDias(est.mes, semana * 7 + dia - hueco);
      if (d.getMonth() !== est.mes.getMonth()) {
        celdas.push('<td></td>');
        continue;
      }
      const iso = aIso(d);
      const atributos = [
        `data-date="${iso}"`,
        `aria-label="${fmtDia.format(d)}"`,
        iso === foco ? 'tabindex="0"' : 'tabindex="-1"',
        iso === hoy ? 'aria-current="date"' : '',
        fuera(cal, d) ? 'aria-disabled="true"' : '',
      ];
      celdas.push(`<td role="gridcell" ${atributos.join(' ')}><span class="calendar-day">${d.getDate()}</span></td>`);
    }
    filas.push(`<tr>${celdas.join('')}</tr>`);
  }

  if (modoDe(cal) === 'range') tabla.setAttribute('aria-multiselectable', 'true');
  else tabla.removeAttribute('aria-multiselectable');
  tabla.innerHTML = `<thead><tr>${cabecera}</tr></thead><tbody>${filas.join('')}</tbody>`;
  marcar(cal);
}

/** Pone los estados de selección sin volver a dibujar (rápido al mover el puntero). */
function marcar(cal) {
  const est = estados.get(cal);
  if (!est) return;
  const rango = modoDe(cal) === 'range';
  const { inicio } = leer(cal);
  let { fin } = leer(cal);
  const eligiendoFin = rango && !!inicio && !fin;
  if (eligiendoFin && est.preview) fin = est.preview;
  const [a, b] = inicio && fin && fin < inicio ? [fin, inicio] : [inicio, fin];

  for (const celda of cal.querySelectorAll('td[data-date]')) {
    const iso = celda.dataset.date;
    const d = deIso(iso);
    const esInicio = !!a && iso === aIso(a);
    const esFin = !!b && iso === aIso(b);
    const dentro = !!a && !!b && d >= a && d <= b;
    const elegida = rango ? esInicio || esFin || (dentro && !eligiendoFin) : esInicio;

    celda.setAttribute('aria-selected', String(elegida));
    celda.toggleAttribute('data-range-start', rango && esInicio);
    celda.toggleAttribute('data-range-end', rango && esFin);
    celda.toggleAttribute('data-in-range', rango && dentro && a < b);
    celda.toggleAttribute('data-preview', eligiendoFin && dentro);
  }
  anunciar(cal);
}

function anunciar(cal) {
  rotular(cal);
  const estado = cal.querySelector(':scope > .calendar-status');
  if (!estado) return;
  const lang = idiomaDe(cal);
  const es = lang.startsWith('es');
  const fmt = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' });
  const { inicio, fin } = leer(cal);
  if (modoDe(cal) === 'single') {
    estado.textContent = inicio ? fmt.format(inicio) : es ? 'Elige una fecha.' : 'Choose a date.';
  } else if (inicio && fin) {
    estado.textContent = fmt.formatRange?.(inicio, fin) ?? `${fmt.format(inicio)} – ${fmt.format(fin)}`;
  } else if (inicio) {
    estado.textContent = es ? `Desde el ${fmt.format(inicio)}. Elige la fecha de fin.` : `From ${fmt.format(inicio)}. Choose the end date.`;
  } else {
    estado.textContent = es ? 'Elige la fecha de inicio.' : 'Choose the start date.';
  }
}

/* ---------- Acciones ---------- */

function escribir(input, valor) {
  if (!input || input.value === valor) return;
  input.value = valor;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function elegir(cal, d) {
  if (fuera(cal, d)) return;
  const est = estados.get(cal);
  const [primero, segundo] = inputsDe(cal);
  const { inicio, fin } = leer(cal);
  const iso = aIso(d);
  if (modoDe(cal) === 'single') {
    escribir(primero, iso);
  } else if (!inicio || fin) {
    // Empieza un rango nuevo.
    escribir(primero, iso);
    escribir(segundo, '');
  } else if (d < inicio) {
    escribir(segundo, aIso(inicio));
    escribir(primero, iso);
  } else {
    escribir(segundo, iso);
  }
  est.preview = null;
  est.foco = d;
  marcar(cal);
  const detalle =
    modoDe(cal) === 'single'
      ? { value: primero?.value ?? '' }
      : { start: primero?.value ?? '', end: segundo?.value ?? '' };
  cal.dispatchEvent(new CustomEvent('calendarchange', { bubbles: true, detail: detalle }));
  // En un selector de fecha, el panel se cierra al completar la elección (el foco vuelve al botón).
  if (modoDe(cal) === 'single' || detalle.end) cerrarPanel(cal);
}

function mover(cal, d, { enfocar = true } = {}) {
  const est = estados.get(cal);
  const destino = limitar(cal, d);
  const cambiaMes = destino.getMonth() !== est.mes.getMonth() || destino.getFullYear() !== est.mes.getFullYear();
  est.foco = destino;
  if (cambiaMes) pintar(cal);
  const iso = aIso(destino);
  for (const celda of cal.querySelectorAll('td[data-date]')) celda.tabIndex = celda.dataset.date === iso ? 0 : -1;
  if (enfocar) cal.querySelector(`td[data-date="${iso}"]`)?.focus();
}

/** Vista previa del rango mientras se elige el fin (puntero o teclado). */
function previsualizar(cal, fecha) {
  const est = estados.get(cal);
  const { inicio, fin } = leer(cal);
  if (!est || modoDe(cal) !== 'range' || !inicio || fin) return;
  const nueva = fecha && !fuera(cal, fecha) ? fecha : null;
  if ((nueva && aIso(nueva)) === (est.preview && aIso(est.preview))) return;
  est.preview = nueva;
  marcar(cal);
}

/**
 * Muestra un mes en un calendario (por ejemplo, el de una fecha elegida desde fuera).
 * @param {HTMLElement} cal Elemento .calendar ya montado.
 * @param {string | Date} fecha "AAAA-MM-DD" o Date.
 * @returns {void}
 */
export function showCalendarMonth(cal, fecha) {
  const d = typeof fecha === 'string' ? deIso(fecha) : fecha;
  const est = estados.get(cal);
  if (!d || !est) return;
  est.foco = limitar(cal, d);
  pintar(cal);
}

/* ---------- Activación ---------- */

/**
 * Activa los calendarios (.calendar con <input type="date">) de la raíz, también los que
 * se añadan después.
 * @param {Document | HTMLElement} [root] Dónde buscar y escuchar.
 * @returns {() => void} Limpieza: deja de escuchar y vuelve a los inputs nativos.
 */
export function enhanceCalendar(root = globalThis.document) {
  if (typeof window === 'undefined' || !root) return () => {};

  const calendarioDe = (nodo) => {
    const cal = nodo?.closest?.(SELECTOR);
    return cal && estados.has(cal) ? cal : null;
  };

  const montarTodos = () => root.querySelectorAll(`${SELECTOR}:not([data-calendar-ready])`).forEach(montar);

  const onClick = (e) => {
    const cal = calendarioDe(e.target);
    if (!cal) return;
    const nav = e.target.closest('[data-calendar-nav]');
    if (nav) {
      const est = estados.get(cal);
      mover(cal, sumarMeses(est.foco, Number(nav.dataset.calendarNav)), { enfocar: false });
      return;
    }
    const celda = e.target.closest('td[data-date]');
    if (celda) elegir(cal, deIso(celda.dataset.date));
  };

  const onKeydown = (e) => {
    const cal = calendarioDe(e.target);
    const celda = cal && e.target.closest('td[data-date]');
    if (!celda) return;
    const d = deIso(celda.dataset.date);
    const lado = getComputedStyle(cal).direction === 'rtl' ? -1 : 1;
    const inicioSemana = (d.getDay() - primerDiaSemana(idiomaDe(cal)) + 7) % 7;
    const destino = {
      ArrowRight: () => sumarDias(d, lado),
      ArrowLeft: () => sumarDias(d, -lado),
      ArrowDown: () => sumarDias(d, 7),
      ArrowUp: () => sumarDias(d, -7),
      Home: () => sumarDias(d, -inicioSemana),
      End: () => sumarDias(d, 6 - inicioSemana),
      PageUp: () => sumarMeses(d, e.shiftKey ? -12 : -1),
      PageDown: () => sumarMeses(d, e.shiftKey ? 12 : 1),
    }[e.key];

    if (destino) {
      e.preventDefault();
      mover(cal, destino());
      previsualizar(cal, estados.get(cal).foco);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      elegir(cal, d);
    }
  };

  const onPointerover = (e) => {
    const cal = calendarioDe(e.target);
    const celda = cal && e.target.closest('td[data-date]');
    if (celda) previsualizar(cal, deIso(celda.dataset.date));
  };

  // pointerleave no burbujea: se usa pointerout y se mira adónde va el puntero.
  const onPointerout = (e) => {
    const cal = calendarioDe(e.target);
    if (cal && !cal.contains(e.relatedTarget)) previsualizar(cal, null);
  };

  // Si otro código cambia los inputs (un framework, un reset), el calendario lo refleja.
  const onChange = (e) => {
    const cal = calendarioDe(e.target);
    if (cal && e.target.matches('input[type="date"]')) marcar(cal);
  };
  const onReset = (e) => {
    setTimeout(() => e.target.querySelectorAll?.(`${SELECTOR}[data-calendar-ready]`).forEach(marcar));
  };

  // Al abrir el panel: el mes de la fecha elegida y el foco en ella. toggle no burbujea: captura.
  const onToggle = (e) => {
    if (e.newState !== 'open' || !e.target.matches?.('[popover]')) return;
    const cal = e.target.querySelector(`${SELECTOR}[data-calendar-ready]`);
    if (!cal) return;
    const est = estados.get(cal);
    est.foco = limitar(cal, leer(cal).inicio ?? new Date());
    est.preview = null;
    pintar(cal);
    cal.querySelector('td[data-date][tabindex="0"]')?.focus();
  };

  const observer = new MutationObserver((cambios) => {
    for (const cambio of cambios) {
      if (cambio.type === 'attributes' && estados.has(cambio.target)) pintar(cambio.target);
    }
    montarTodos();
  });

  montarTodos();
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-mode'] });
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown);
  root.addEventListener('pointerover', onPointerover);
  root.addEventListener('pointerout', onPointerout);
  root.addEventListener('change', onChange);
  root.addEventListener('reset', onReset);
  root.addEventListener('toggle', onToggle, true);

  return () => {
    observer.disconnect();
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeydown);
    root.removeEventListener('pointerover', onPointerover);
    root.removeEventListener('pointerout', onPointerout);
    root.removeEventListener('change', onChange);
    root.removeEventListener('reset', onReset);
    root.removeEventListener('toggle', onToggle, true);
    root.querySelectorAll(`${SELECTOR}[data-calendar-ready]`).forEach(desmontar);
  };
}
