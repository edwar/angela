// @vitest-environment happy-dom
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Button,
  buttonProps,
  Callout,
  ConfirmDialog,
  Dialog,
  DialogClose,
  Field,
  Input,
  Popover,
  PopoverItem,
  Switch,
  Tabs,
  ThemeScript,
  Heading,
  Text,
  Prose,
} from './index.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
async function render(ui: ReactNode) {
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(() => root!.render(ui));
  return container;
}
const html = (ui: ReactNode) => {
  const div = document.createElement('div');
  div.innerHTML = renderToString(ui);
  return div;
};

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.innerHTML = '';
});

describe('Button', () => {
  it('es type="button" por defecto y traduce las props a atributos de angela', () => {
    const b = html(<Button variant="soft" tone="danger" size="sm" iconOnly aria-label="Borrar" />).querySelector('button')!;
    expect(b.className).toBe('button');
    expect(b.type).toBe('button');
    expect(b.dataset.variant).toBe('soft');
    expect(b.dataset.tone).toBe('danger');
    expect(b.dataset.size).toBe('sm');
    expect(b.hasAttribute('data-icon-only')).toBe(true);
  });

  it('buttonProps sirve para otros componentes (p. ej. Link)', () => {
    expect(buttonProps({ variant: 'outline', block: true, className: 'x' })).toMatchObject({
      className: 'button x',
      'data-variant': 'outline',
      'data-block': '',
    });
  });

  it('escribe el atributo autofocus también en el cliente (React solo llama a focus())', async () => {
    const c = await render(<Button autoFocus>Cancelar</Button>);
    expect(c.querySelector('button')!.hasAttribute('autofocus')).toBe(true);
  });
});

describe('Field', () => {
  it('enlaza etiqueta, ayuda y error, y empieza con aria-invalid="false"', () => {
    const d = html(
      <Field label="Correo" hint="El del trabajo." error="Escribe un correo válido." required id="email">
        <Input type="email" />
      </Field>,
    );
    const input = d.querySelector('input')!;
    expect(d.querySelector('label')!.htmlFor).toBe('email');
    expect(d.querySelector('label')!.textContent).toBe('Correo *');
    expect(input.id).toBe('email');
    expect(input.required).toBe(true);
    expect(input.className).toBe('input');
    expect(input.getAttribute('aria-describedby')).toBe('email-hint');
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(input.dataset.error).toBe('email-error');
    expect(d.querySelector('.error')!.id).toBe('email-error');
  });

  it('con invalid (error del servidor) marca el campo y enlaza el mensaje', () => {
    const input = html(
      <Field label="Usuario" error="Ese usuario ya existe." invalid id="u">
        <Input defaultValue="ana" />
      </Field>,
    ).querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('u-error');
  });

  it('si el control trae su propio id, avisa y mantiene la etiqueta enlazada', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const d = html(
      <Field label="Correo" id="bien">
        <Input id="mal" />
      </Field>,
    );
    expect(d.querySelector('input')!.id).toBe('bien');
    expect(d.querySelector('label')!.htmlFor).toBe('bien');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('id="mal"'));
    warn.mockRestore();
  });

  it('genera ids que coinciden entre servidor y cliente', async () => {
    const c = await render(
      <Field label="Nombre">
        <Input />
      </Field>,
    );
    expect(c.querySelector('label')!.htmlFor).toBe(c.querySelector('input')!.id);
    expect(c.querySelector('input')!.id).not.toBe('');
  });
});

describe('Switch', () => {
  it('es un checkbox con role="switch" y el atributo switch', () => {
    const input = html(<Switch label="Resumen semanal" hint="Los lunes." />).querySelector('input')!;
    expect(input.type).toBe('checkbox');
    expect(input.getAttribute('role')).toBe('switch');
    expect(input.hasAttribute('switch')).toBe(true);
    expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-hint`);
  });
});

describe('Dialog', () => {
  it('conecta el botón, el título y el cierre sin estado', () => {
    const d = html(
      <Dialog title="Nuevo cliente" trigger={{ children: 'Nuevo' }} footer={<DialogClose>Cancelar</DialogClose>} id="d">
        <p>Cuerpo</p>
      </Dialog>,
    );
    const [trigger, close, cancel] = d.querySelectorAll('button');
    const dialog = d.querySelector('dialog')!;
    expect(trigger.getAttribute('commandfor')).toBe('d');
    expect(trigger.getAttribute('command')).toBe('show-modal');
    expect(dialog.getAttribute('aria-labelledby')).toBe('d-title');
    expect(d.querySelector('#d-title')!.textContent).toBe('Nuevo cliente');
    expect(dialog.getAttribute('closedby')).toBe('any');
    expect(close.getAttribute('aria-label')).toBe('Cerrar');
    expect(close.getAttribute('command')).toBe('close');
    expect(cancel.getAttribute('commandfor')).toBe('d');
    expect(cancel.dataset.variant).toBe('ghost');
  });

  it('con form, el pie queda dentro del formulario', () => {
    const d = html(
      <Dialog title="T" form={{ method: 'dialog' }} footer={<Button type="submit">Guardar</Button>}>
        x
      </Dialog>,
    );
    expect(d.querySelector('dialog > form.dialog-form > footer button[type="submit"]')).not.toBeNull();
  });

  it('closeOnSubmit cierra el diálogo cuando la acción termina', async () => {
    const action = vi.fn(async () => {});
    const c = await render(
      <Dialog title="T" form={{ action }} closeOnSubmit footer={<Button type="submit">Guardar</Button>}>
        <input name="nombre" defaultValue="Ana" />
      </Dialog>,
    );
    const dialog = c.querySelector('dialog')!;
    dialog.showModal();
    await act(async () => c.querySelector<HTMLButtonElement>('footer button')!.click());
    expect(action).toHaveBeenCalledTimes(1);
    expect((action.mock.calls[0] as unknown as [FormData])[0].get('nombre')).toBe('Ana');
    expect(dialog.open).toBe(false);
  });

  it('ConfirmDialog llama a onConfirm solo si se confirma y limpia returnValue', async () => {
    const onConfirm = vi.fn();
    const c = await render(<ConfirmDialog title="¿Eliminar?" confirmLabel="Eliminar" onConfirm={onConfirm} />);
    const dialog = c.querySelector('dialog')!;
    expect(c.querySelector('button[value="cancel"]')!.hasAttribute('autofocus')).toBe(true);

    dialog.returnValue = 'cancel';
    dialog.dispatchEvent(new Event('close'));
    expect(onConfirm).not.toHaveBeenCalled();

    dialog.returnValue = 'confirm';
    dialog.dispatchEvent(new Event('close'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(dialog.returnValue).toBe('');
  });
});

describe('Popover', () => {
  it('ancla el panel a su botón y los items lo cierran', () => {
    const d = html(
      <Popover trigger={{ children: 'Acciones', variant: 'outline' }} id="p">
        <PopoverItem tone="danger">Eliminar</PopoverItem>
      </Popover>,
    );
    expect(d.querySelector('button')!.getAttribute('commandfor')).toBe('p');
    expect(d.querySelector('button')!.getAttribute('command')).toBe('toggle-popover');
    expect(d.querySelector('button')!.dataset.variant).toBe('outline');
    expect(d.querySelector('button')!.textContent).toBe('Acciones');
    expect(d.querySelector('#p')!.getAttribute('popover')).toBe('auto');
    const item = d.querySelector('.popover-item')!;
    expect(item.getAttribute('command')).toBe('hide-popover');
    expect(item.getAttribute('data-tone')).toBe('danger');
  });
});

describe('Tabs', () => {
  const items = [
    { value: 'resumen', label: 'Resumen', content: 'A' },
    { value: 'envio', label: 'Envío', content: 'B' },
  ];

  it('renderiza el estado inicial en el servidor', () => {
    const d = html(<Tabs label="Pedido" items={items} defaultValue="envio" />);
    const tabs = d.querySelectorAll('[role="tab"]');
    const panels = d.querySelectorAll<HTMLElement>('[role="tabpanel"]');
    expect(d.querySelector('[role="tablist"]')!.getAttribute('aria-label')).toBe('Pedido');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(panels[0].hidden).toBe(true);
    expect(panels[1].hidden).toBe(false);
    expect(panels[1].getAttribute('aria-labelledby')).toBe(tabs[1].id);
  });

  it('avisa del cambio con el value de la pestaña', async () => {
    const onValueChange = vi.fn();
    const c = await render(<Tabs label="Pedido" items={items} onValueChange={onValueChange} />);
    await act(async () => c.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click());
    expect(onValueChange).toHaveBeenCalledWith('envio');
    expect(c.querySelectorAll('[role="tab"]')[1].getAttribute('aria-selected')).toBe('true');
  });

  it('en modo controlado sigue a value', async () => {
    const c = await render(<Tabs label="Pedido" items={items} value="resumen" />);
    await act(() => root!.render(<Tabs label="Pedido" items={items} value="envio" />));
    expect(c.querySelectorAll('[role="tab"]')[1].getAttribute('aria-selected')).toBe('true');
    expect(c.querySelectorAll<HTMLElement>('[role="tabpanel"]')[0].hidden).toBeTruthy();
  });
});

describe('Callout y ThemeScript', () => {
  it('el aviso siempre lleva ícono además del color', () => {
    const d = html(<Callout tone="success" title="Pago recibido">Te enviamos el recibo.</Callout>);
    expect(d.querySelector('.callout svg[aria-hidden="true"]')).not.toBeNull();
    expect(d.querySelector('.callout-title')!.textContent).toBe('Pago recibido');
  });

  it('el script del tema va después del meta que modifica', () => {
    const out = renderToString(<ThemeScript />);
    expect(out.indexOf('name="color-scheme"')).toBeLessThan(out.indexOf('<script'));
    expect(out).toContain('localStorage');
  });
});

describe('Tipografía', () => {
  it('Heading separa el nivel (as) del tamaño (size)', () => {
    const d = html(<Heading as="h3" size="lg">Laptop</Heading>);
    const h = d.querySelector('h3')!;
    expect(h.className).toBe('heading');
    expect(h.dataset.size).toBe('lg');
  });

  it('Text traduce las opciones a atributos y omite las que no se usan', () => {
    const d = html(
      <Text size="2xl" weight="bold" numeric muted lines={2}>
        $18.999
      </Text>,
    );
    const p = d.querySelector('p.text')!;
    expect(p.getAttribute('data-size')).toBe('2xl');
    expect(p.getAttribute('data-weight')).toBe('bold');
    expect(p.hasAttribute('data-numeric')).toBe(true);
    expect(p.hasAttribute('data-muted')).toBe(true);
    expect(p.getAttribute('data-lines')).toBe('2');
    expect(p.hasAttribute('data-truncate')).toBe(false);
    expect(p.hasAttribute('data-tone')).toBe(false);
  });

  it('Text y Prose aceptan otro elemento con as', () => {
    const d = html(
      <Prose as="article">
        <Text as="span" tone="success">
          Pagado
        </Text>
      </Prose>,
    );
    expect(d.querySelector('article.prose > span.text[data-tone="success"]')).not.toBeNull();
  });
});
