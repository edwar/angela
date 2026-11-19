// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { enhanceForms } from './forms.js';

const tick = () => new Promise((r) => setTimeout(r));

describe('enhanceForms', () => {
  let cleanup;
  afterEach(() => {
    cleanup?.();
    document.body.innerHTML = '';
  });

  it('pone aria-invalid="false" a los campos que ya existen', () => {
    document.body.innerHTML = '<form><input required id="a"></form><input id="suelto">';
    cleanup = enhanceForms();
    expect(document.getElementById('a').getAttribute('aria-invalid')).toBe('false');
    // Fuera de un formulario no hay validación que sincronizar.
    expect(document.getElementById('suelto').hasAttribute('aria-invalid')).toBe(false);
  });

  it('también a los campos que se montan después (modales, rutas, renderizado condicional)', async () => {
    cleanup = enhanceForms();
    const form = document.createElement('form');
    form.innerHTML = '<input required id="b"><select id="c"><option>1</option></select>';
    document.body.append(form);
    await tick();
    expect(document.getElementById('b').getAttribute('aria-invalid')).toBe('false');
    expect(document.getElementById('c').getAttribute('aria-invalid')).toBe('false');

    // Un campo añadido suelto a un formulario existente.
    const textarea = document.createElement('textarea');
    form.append(textarea);
    await tick();
    expect(textarea.getAttribute('aria-invalid')).toBe('false');
  });

  it('respeta un aria-invalid="true" puesto por el servidor', async () => {
    cleanup = enhanceForms();
    document.body.innerHTML = '<form><input id="d" aria-invalid="true"></form>';
    await tick();
    expect(document.getElementById('d').getAttribute('aria-invalid')).toBe('true');
  });

  it('deja de observar tras el cleanup', async () => {
    enhanceForms()();
    document.body.innerHTML = '<form><input id="e"></form>';
    await tick();
    expect(document.getElementById('e').hasAttribute('aria-invalid')).toBe(false);
  });
});
