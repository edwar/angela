// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { enhanceSpotlight } from './spotlight.js';

const markup = `
  <div class="spotlight" id="s">
    <img src="data:," alt="">
    <div class="spotlight-overlay"></div>
  </div>
  <p id="fuera">Fuera</p>`;

/** El rectángulo del .spotlight empieza en (100, 50). */
function placeAt(el, left, top) {
  el.getBoundingClientRect = () => ({ left, top, width: 400, height: 300, right: left + 400, bottom: top + 300, x: left, y: top });
}

const move = (target, clientX, clientY) =>
  target.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX, clientY }));

describe('enhanceSpotlight', () => {
  let cleanup;

  beforeEach(() => {
    document.body.innerHTML = markup;
    placeAt(document.getElementById('s'), 100, 50);
    cleanup = enhanceSpotlight();
  });

  afterEach(() => cleanup());

  it('pasa la posición del puntero, relativa al .spotlight, aunque el evento venga de un hijo', () => {
    const s = document.getElementById('s');
    move(s.querySelector('img'), 180, 120);
    expect(s.style.getPropertyValue('--spotlight-x')).toBe('80px');
    expect(s.style.getPropertyValue('--spotlight-y')).toBe('70px');
  });

  it('funciona con los .spotlight que se montan después (delegación)', () => {
    const nuevo = document.createElement('div');
    nuevo.className = 'spotlight';
    document.body.append(nuevo);
    placeAt(nuevo, 0, 0);
    move(nuevo, 10, 20);
    expect(nuevo.style.getPropertyValue('--spotlight-x')).toBe('10px');
  });

  it('no hace nada fuera de un .spotlight ni con la página sin spotlight', () => {
    move(document.getElementById('fuera'), 5, 5);
    expect(document.getElementById('s').style.getPropertyValue('--spotlight-x')).toBe('');
    document.body.innerHTML = '<p>Sin spotlight</p>';
    expect(() => move(document.body.firstElementChild, 1, 1)).not.toThrow();
  });

  it('el cleanup deja de seguir al puntero', () => {
    cleanup();
    const s = document.getElementById('s');
    move(s, 180, 120);
    expect(s.style.getPropertyValue('--spotlight-x')).toBe('');
  });
});
