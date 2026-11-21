// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { enhanceCalendar, showCalendarMonth } from './calendario.js';

const unica = `
  <div class="calendar" data-mode="single" id="unica">
    <div class="calendar-fallback field">
      <label for="cita">Fecha de la cita</label>
      <input class="input" id="cita" type="date" name="cita" min="2026-11-01" max="2027-03-31" value="2026-11-18">
    </div>
  </div>`;

const rango = `
  <div class="calendar" data-mode="range" id="rango">
    <div class="calendar-fallback">
      <input type="date" id="ida" value="2026-11-23">
      <input type="date" id="vuelta" value="2026-11-27">
    </div>
  </div>`;

const selector = `
  <button class="button calendar-trigger" type="button" commandfor="panel" command="toggle-popover">
    <span class="calendar-value" id="valor">Elige una fecha</span>
  </button>
  <div class="popover" id="panel" popover>
    <div class="calendar" data-mode="single">
      <div class="calendar-fallback"><input type="date" id="fecha"></div>
    </div>
  </div>`;

const $ = (sel) => document.querySelector(sel);
const dia = (cal, iso) => cal.querySelector(`td[data-date="${iso}"]`);
const tecla = (el, key, opciones = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opciones }));
const tick = () => new Promise((r) => setTimeout(r));

let limpiar;
beforeEach(() => {
  document.documentElement.lang = 'es';
});
afterEach(() => {
  limpiar?.();
  limpiar = null;
  document.body.innerHTML = '';
});

const montar = (html) => {
  document.body.innerHTML = html;
  limpiar = enhanceCalendar(document);
};

describe('fecha única', () => {
  it('oculta los inputs nativos y pinta el mes del valor, siempre con 6 semanas', () => {
    montar(unica);
    const cal = $('#unica');
    expect(cal.querySelector('.calendar-fallback').hidden).toBe(true);
    expect(cal.hasAttribute('data-calendar-ready')).toBe(true);
    expect(cal.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(cal.querySelector('.calendar-title').textContent).toMatch(/noviembre/);
    expect(dia(cal, '2026-11-18').getAttribute('aria-selected')).toBe('true');
    expect(dia(cal, '2026-11-18').tabIndex).toBe(0);
  });

  it('empieza la semana en lunes en español', () => {
    montar(unica);
    expect($('#unica th .visually-hidden').textContent).toBe('lunes');
  });

  it('elegir escribe el input, emite input/change/calendarchange y lo anuncia', () => {
    montar(unica);
    const cal = $('#unica');
    const eventos = [];
    $('#cita').addEventListener('change', () => eventos.push('change'));
    cal.addEventListener('calendarchange', (e) => eventos.push(e.detail));
    dia(cal, '2026-11-25').click();
    expect($('#cita').value).toBe('2026-11-25');
    expect(eventos).toEqual(['change', { value: '2026-11-25' }]);
    expect(dia(cal, '2026-11-25').getAttribute('aria-selected')).toBe('true');
    expect(dia(cal, '2026-11-18').getAttribute('aria-selected')).toBe('false');
    expect(cal.querySelector('.calendar-status').textContent).toMatch(/25 de noviembre de 2026/);
  });

  it('respeta min: el día queda deshabilitado, no se elige y el foco no lo cruza', () => {
    montar(unica.replace('min="2026-11-01"', 'min="2026-11-10"'));
    const cal = $('#unica');
    expect(dia(cal, '2026-11-09').getAttribute('aria-disabled')).toBe('true');
    dia(cal, '2026-11-09').click();
    expect($('#cita').value).toBe('2026-11-18');
    showCalendarMonth(cal, '2026-11-10');
    dia(cal, '2026-11-10').focus();
    tecla(dia(cal, '2026-11-10'), 'ArrowLeft');
    expect(document.activeElement.dataset.date).toBe('2026-11-10');
  });

  it('teclado: flechas, RePág (mes), Fin (fin de semana) e Intro', () => {
    montar(unica);
    const cal = $('#unica');
    dia(cal, '2026-11-18').focus();
    tecla(document.activeElement, 'ArrowDown');
    expect(document.activeElement.dataset.date).toBe('2026-11-25');
    tecla(document.activeElement, 'PageDown');
    expect(document.activeElement.dataset.date).toBe('2026-12-25');
    expect(cal.querySelector('.calendar-title').textContent).toMatch(/diciembre/);
    tecla(document.activeElement, 'End');
    expect(document.activeElement.dataset.date).toBe('2026-12-27'); // domingo
    tecla(document.activeElement, 'Enter');
    expect($('#cita').value).toBe('2026-12-27');
  });

  it('el botón de mes anterior se desactiva en el límite de min', () => {
    montar(unica);
    const [anterior] = $('#unica').querySelectorAll('[data-calendar-nav]');
    expect(anterior.disabled).toBe(true);
    expect(anterior.getAttribute('aria-label')).toBe('Mes anterior');
  });
});

describe('rango', () => {
  it('marca inicio, fin y el tramo', () => {
    montar(rango);
    const cal = $('#rango');
    expect(cal.querySelector('table').getAttribute('aria-multiselectable')).toBe('true');
    expect(dia(cal, '2026-11-23').hasAttribute('data-range-start')).toBe(true);
    expect(dia(cal, '2026-11-27').hasAttribute('data-range-end')).toBe(true);
    expect(dia(cal, '2026-11-25').hasAttribute('data-in-range')).toBe(true);
    expect(dia(cal, '2026-11-25').getAttribute('aria-selected')).toBe('true');
  });

  it('un clic empieza un rango nuevo, la vista previa sigue al puntero y un fin anterior se ordena', () => {
    montar(rango);
    const cal = $('#rango');
    let detalle;
    cal.addEventListener('calendarchange', (e) => (detalle = e.detail));

    dia(cal, '2026-11-10').click();
    expect([$('#ida').value, $('#vuelta').value]).toEqual(['2026-11-10', '']);
    expect(cal.querySelector('.calendar-status').textContent).toMatch(/Elige la fecha de fin/);

    dia(cal, '2026-11-14').dispatchEvent(new Event('pointerover', { bubbles: true }));
    expect(dia(cal, '2026-11-12').hasAttribute('data-preview')).toBe(true);

    dia(cal, '2026-11-05').click();
    expect([$('#ida').value, $('#vuelta').value]).toEqual(['2026-11-05', '2026-11-10']);
    expect(detalle).toEqual({ start: '2026-11-05', end: '2026-11-10' });
    expect(dia(cal, '2026-11-12').hasAttribute('data-preview')).toBe(false);
  });
});

describe('selector de fecha (en un popover)', () => {
  it('el botón muestra el texto inicial y después la fecha elegida', () => {
    montar(selector);
    expect($('#valor').textContent).toBe('Elige una fecha');
    expect($('.calendar-trigger').hasAttribute('data-placeholder')).toBe(true);
    dia($('#panel .calendar'), '2026-11-25').click();
    expect($('#valor').textContent).toMatch(/25.*nov.*2026/);
    expect($('.calendar-trigger').hasAttribute('data-placeholder')).toBe(false);
  });
});

describe('frameworks y limpieza', () => {
  it('monta los calendarios que llegan después y refleja cambios externos del input', async () => {
    montar('');
    const cal = document.createElement('div');
    cal.className = 'calendar';
    document.body.append(cal);
    await tick();
    expect(cal.hasAttribute('data-calendar-ready')).toBe(false); // sin inputs todavía
    cal.innerHTML = '<input type="date" value="2027-01-15">';
    await tick();
    expect(cal.querySelector('.calendar-title').textContent).toMatch(/enero/);
    const input = cal.querySelector('input');
    input.value = '2027-01-20';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(dia(cal, '2027-01-20').getAttribute('aria-selected')).toBe('true');
  });

  it('cambiar data-mode repinta', async () => {
    montar(unica);
    $('#unica').dataset.mode = 'range';
    await tick();
    expect($('#unica table').getAttribute('aria-multiselectable')).toBe('true');
  });

  it('la limpieza quita el calendario y devuelve los inputs nativos', () => {
    montar(unica);
    limpiar();
    limpiar = null;
    expect($('#unica .calendar-grid')).toBeNull();
    expect($('#unica .calendar-fallback').hidden).toBe(false);
    expect($('#unica').hasAttribute('data-calendar-ready')).toBe(false);
  });

  it('es seguro sin DOM', () => {
    expect(enhanceCalendar(null)()).toBeUndefined();
  });
});
