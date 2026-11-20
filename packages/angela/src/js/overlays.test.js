// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { enhanceDialogs, enhancePopovers } from './overlays.js';

describe('enhanceDialogs: clic fuera para cerrar donde falta closedby="any"', () => {
  let cleanup;
  let dialog;
  let closedByOriginal;

  /** El diálogo ocupa de (100, 100) a (300, 200). */
  const press = (type, x, y) =>
    dialog.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y }));
  const click = (from, to) => {
    press('pointerdown', ...from);
    press('pointerup', ...to);
  };

  beforeEach(() => {
    // Simula un navegador sin closedby (Safari): la mejora solo se activa entonces.
    closedByOriginal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'closedBy');
    if (closedByOriginal) delete HTMLDialogElement.prototype.closedBy;

    document.body.innerHTML = '<dialog closedby="any" open><p>Contenido</p></dialog>';
    dialog = document.querySelector('dialog');
    dialog.getBoundingClientRect = () => ({ left: 100, top: 100, right: 300, bottom: 200, width: 200, height: 100 });
    cleanup = enhanceDialogs();
  });

  afterEach(() => {
    cleanup();
    if (closedByOriginal) Object.defineProperty(HTMLDialogElement.prototype, 'closedBy', closedByOriginal);
  });

  it('pulsar y soltar fuera lo cierra', () => {
    click([20, 20], [20, 20]);
    expect(dialog.open).toBe(false);
  });

  it('un clic dentro no lo cierra', () => {
    click([150, 150], [150, 150]);
    expect(dialog.open).toBe(true);
  });

  it('arrastrar desde dentro hasta fuera (seleccionar texto) no lo cierra', () => {
    click([150, 150], [20, 20]);
    expect(dialog.open).toBe(true);
  });

  it('sin closedby="any" no hace nada', () => {
    dialog.removeAttribute('closedby');
    click([20, 20], [20, 20]);
    expect(dialog.open).toBe(true);
  });

  it('el cleanup deja de escuchar', () => {
    cleanup();
    click([20, 20], [20, 20]);
    expect(dialog.open).toBe(true);
  });

  it('si el navegador ya soporta closedby, no añade nada', () => {
    cleanup();
    Object.defineProperty(HTMLDialogElement.prototype, 'closedBy', { configurable: true, get: () => 'any' });
    cleanup = enhanceDialogs();
    click([20, 20], [20, 20]);
    expect(dialog.open).toBe(true);
    delete HTMLDialogElement.prototype.closedBy;
  });
});

describe('enhancePopovers: el foco vuelve al botón que lo abrió', () => {
  let cleanup;
  let invoker;
  let popover;
  let closeButton;

  const toggle = (newState, source) => {
    const event = new Event('beforetoggle');
    Object.assign(event, { newState, source });
    popover.dispatchEvent(event);
  };
  const microtask = () => new Promise((resolve) => queueMicrotask(resolve));

  beforeEach(() => {
    document.body.innerHTML = `
      <button type="button" id="abre">Opciones</button>
      <div popover id="menu"><button type="button" id="cierra">Cerrar</button></div>
      <button type="button" id="otro">Otro</button>`;
    invoker = document.getElementById('abre');
    popover = document.getElementById('menu');
    closeButton = document.getElementById('cierra');
    cleanup = enhancePopovers();
  });

  afterEach(() => cleanup());

  it('al cerrarlo desde dentro, el foco vuelve al invocador', async () => {
    toggle('open', invoker);
    closeButton.focus();
    toggle('closed');
    // El navegador oculta el popover y el foco cae en <body>.
    closeButton.blur();
    await microtask();
    expect(document.activeElement).toBe(invoker);
  });

  it('sin source, recuerda el elemento enfocado al abrir', async () => {
    invoker.focus();
    toggle('open');
    closeButton.focus();
    toggle('closed');
    closeButton.blur();
    await microtask();
    expect(document.activeElement).toBe(invoker);
  });

  it('no roba el foco si la persona ya lo movió a otro sitio', async () => {
    toggle('open', invoker);
    closeButton.focus();
    toggle('closed');
    document.getElementById('otro').focus();
    await microtask();
    expect(document.activeElement.id).toBe('otro');
  });

  it('si el foco no estaba dentro del popover, no hace nada', async () => {
    toggle('open', invoker);
    document.getElementById('otro').focus();
    toggle('closed');
    await microtask();
    expect(document.activeElement.id).toBe('otro');
  });

  it('el cleanup deja de escuchar', async () => {
    cleanup();
    toggle('open', invoker);
    closeButton.focus();
    toggle('closed');
    closeButton.blur();
    await microtask();
    expect(document.activeElement).not.toBe(invoker);
  });
});
