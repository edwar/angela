// @vitest-environment happy-dom
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { defineTabs } from './tabs.js';

const markup = `
  <angela-tabs class="tabs">
    <div class="tablist" focusgroup="tablist nomemory" aria-label="Demo">
      <button type="button" id="a" aria-selected="true">A</button>
      <button type="button" id="b" aria-selected="false">B</button>
      <button type="button" id="c" aria-selected="false">C</button>
    </div>
    <div role="tabpanel" aria-labelledby="a">Panel A</div>
    <div role="tabpanel" aria-labelledby="b" hidden="until-found">Panel B</div>
    <div role="tabpanel" aria-labelledby="c" hidden="until-found"><a href="#">enlace</a></div>
  </angela-tabs>`;

const $ = (sel) => document.querySelector(sel);
const key = (el, k) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('<angela-tabs> (sin focusgroup nativo)', () => {
  beforeAll(() => defineTabs());
  beforeEach(() => {
    document.body.innerHTML = markup;
  });

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

  it('emite tabchange al cambiar de pestaña', () => {
    let detail;
    $('angela-tabs').addEventListener('tabchange', (e) => (detail = e.detail));
    $('#b').click();
    expect(detail.tab).toBe($('#b'));
    expect(detail.panel.textContent).toBe('Panel B');
  });

  it('no desplaza al inicializar (movería el punto de partida del Tab al panel)', async () => {
    // Propiedad propia en el prototipo más concreto: intercepta la llamada esté donde esté el original.
    const calls = [];
    HTMLButtonElement.prototype.scrollIntoView = function () {
      calls.push(this.id);
    };
    try {
      document.body.innerHTML = markup;
      await new Promise((r) => setTimeout(r)); // el elemento se inicializa cuando llegan sus hijos
      expect($('#a').getAttribute('role')).toBe('tab'); // ya inicializado
      expect(calls).toEqual([]);
      $('#b').click();
      expect(calls).toEqual(['b']);
    } finally {
      delete HTMLButtonElement.prototype.scrollIntoView;
    }
  });
});
