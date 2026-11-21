// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { features } from 'web-features';
import { DEMOS } from '../data/interacciones.js';
import { expandir } from './expandir/expandir.js';
import { avisar } from './avisos/avisos.js';

describe('demos de Interacciones', () => {
  it('cada característica que citan existe en web-features', () => {
    expect(DEMOS.flatMap((d) => d.usa).filter((id) => !features[id]?.status)).toEqual([]);
  });

  it('expandir abre una tarjeta y cierra la anterior (sin View Transitions, al instante)', () => {
    document.body.innerHTML = DEMOS.find((d) => d.id === 'expandir').html;
    const lista = document.querySelector('[data-expandir]');
    expandir(lista);
    const [a, b] = lista.querySelectorAll('[aria-expanded]');
    a.click();
    expect([a.getAttribute('aria-expanded'), b.getAttribute('aria-expanded')]).toEqual(['true', 'false']);
    b.click();
    expect([a.getAttribute('aria-expanded'), b.getAttribute('aria-expanded')]).toEqual(['false', 'true']);
    b.click();
    expect(b.getAttribute('aria-expanded')).toBe('false');
  });

  it('avisar añade el aviso, lo anuncia y lo quita al cerrarlo', () => {
    vi.useFakeTimers();
    // happy-dom no tiene la API Popover: basta con que existan los métodos.
    HTMLElement.prototype.showPopover ??= function () {};
    HTMLElement.prototype.hidePopover ??= function () {};
    document.body.innerHTML = '';
    const cerrar = avisar('Cambios guardados.', { tono: 'success' });
    const aviso = document.querySelector('.avisos .aviso');
    expect(aviso.dataset.tone).toBe('success');
    expect(aviso.textContent).toContain('Cambios guardados.');
    vi.advanceTimersByTime(150);
    expect(document.querySelector('.avisos + [role="status"]').textContent).toBe('Cambios guardados.');
    cerrar();
    vi.advanceTimersByTime(450);
    expect(document.querySelector('.aviso')).toBeNull();
    vi.useRealTimers();
  });
});
