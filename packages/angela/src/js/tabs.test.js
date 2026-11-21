// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { enhanceTabs, selectTab } from './tabs.js';

const markup = `
  <div class="tabs">
    <div class="tablist" focusgroup="tablist nomemory" aria-label="Demo">
      <button type="button" id="a" aria-selected="true">A</button>
      <button type="button" id="b" aria-selected="false">B</button>
      <button type="button" id="c" aria-selected="false">C</button>
    </div>
    <div role="tabpanel" aria-labelledby="a">Panel A</div>
    <div role="tabpanel" aria-labelledby="b" hidden="until-found">Panel B</div>
    <div role="tabpanel" aria-labelledby="c" hidden="until-found"><a href="#">enlace</a></div>
  </div>`;

const $ = (sel) => document.querySelector(sel);
const key = (el, k) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
const tick = () => new Promise((r) => setTimeout(r));

describe('pestañas (sin focusgroup nativo)', () => {
  let cleanup;
  beforeEach(() => {
    document.body.innerHTML = markup;
    cleanup = enhanceTabs(document);
  });
  afterEach(() => cleanup());

  it('añade los roles ARIA y el tabindex itinerante', () => {
    expect($('.tablist').getAttribute('role')).toBe('tablist');
    expect($('#a').getAttribute('role')).toBe('tab');
    expect($('#a').tabIndex).toBe(0);
    expect($('#b').tabIndex).toBe(-1);
  });

  it('el panel visible sin contenido enfocable entra en el orden de tabulación', () => {
    const [pa, pb] = document.querySelectorAll('[role="tabpanel"]');
    expect(pa.hidden).toBe(false);
    expect(pa.getAttribute('tabindex')).toBe('0');
    expect(pb.hidden).toBeTruthy();
  });

  it('las flechas, Inicio y Fin mueven el foco y la selección', () => {
    $('#a').focus();
    key($('#a'), 'ArrowRight');
    expect(document.activeElement).toBe($('#b'));
    expect($('#b').getAttribute('aria-selected')).toBe('true');
    expect($('#a').getAttribute('aria-selected')).toBe('false');

    key($('#b'), 'End');
    expect(document.activeElement).toBe($('#c'));

    key($('#c'), 'ArrowRight');
    expect(document.activeElement).toBe($('#a'));

    key($('#a'), 'ArrowLeft');
    expect(document.activeElement).toBe($('#c'));
  });

  it('un panel con contenido enfocable no recibe tabindex', () => {
    $('#c').click();
    const pc = document.querySelectorAll('[role="tabpanel"]')[2];
    expect(pc.hidden).toBe(false);
    expect(pc.hasAttribute('tabindex')).toBe(false);
  });

  it('emite tabchange en el .tabs al cambiar de pestaña', () => {
    let detail;
    $('.tabs').addEventListener('tabchange', (e) => (detail = e.detail));
    $('#b').click();
    expect(detail.tab).toBe($('#b'));
    expect(detail.panel.textContent).toBe('Panel B');
  });

  it('selectTab con silent cambia sin emitir tabchange', () => {
    let emitido = false;
    $('.tabs').addEventListener('tabchange', () => (emitido = true));
    selectTab($('#c'), { silent: true });
    expect($('#c').getAttribute('aria-selected')).toBe('true');
    expect(document.querySelectorAll('[role="tabpanel"]')[2].hidden).toBe(false);
    expect(emitido).toBe(false);
  });

  it('prepara las pestañas que se montan después (frameworks)', async () => {
    const extra = document.createElement('div');
    extra.innerHTML = markup.replaceAll('id="', 'id="x').replaceAll('aria-labelledby="', 'aria-labelledby="x');
    document.body.append(extra);
    await tick();
    expect($('#xa').getAttribute('role')).toBe('tab');
    $('#xb').click();
    expect($('#xb').getAttribute('aria-selected')).toBe('true');
    // Las primeras no cambian.
    expect($('#a').getAttribute('aria-selected')).toBe('true');
  });

  it('no desplaza al preparar (movería el punto de partida del Tab al panel)', async () => {
    const calls = [];
    HTMLButtonElement.prototype.scrollIntoView = function () {
      calls.push(this.id);
    };
    try {
      document.body.innerHTML = markup;
      await tick();
      expect($('#a').getAttribute('role')).toBe('tab'); // ya preparadas
      expect(calls).toEqual([]);
      $('#b').click();
      expect(calls).toEqual(['b']);
    } finally {
      delete HTMLButtonElement.prototype.scrollIntoView;
    }
  });
});

describe('activación', () => {
  it('varias llamadas comparten los listeners y cada limpieza cuenta una vez', () => {
    document.body.innerHTML = markup;
    const una = enhanceTabs(document);
    const otra = enhanceTabs(document);
    let cambios = 0;
    $('.tabs').addEventListener('tabchange', () => cambios++);
    $('#b').click();
    expect(cambios).toBe(1); // un solo listener aunque se activara dos veces

    una();
    una(); // repetir la misma limpieza no suelta la otra
    $('#c').click();
    expect(cambios).toBe(2);

    otra();
    $('#a').click();
    expect(cambios).toBe(2); // ya no escucha nadie
  });

  it('es segura sin DOM', () => {
    expect(enhanceTabs(null)()).toBeUndefined();
  });
});
