'use client';

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Button, type ButtonProps } from './button.js';
import { XIcon } from './icons.js';
import { cx, mergeRefs, type Tone } from './utils.js';

/**
 * Props del botón que abre el diálogo (`children` es su texto). Es un objeto, no un elemento:
 * así se puede pasar desde un Server Component. Para un botón propio, usa `id` en el diálogo y
 * `commandfor="ese-id" command="show-modal"` en tu botón.
 */
export type DialogTrigger = Omit<ButtonProps, 'commandfor' | 'command'>;

const DialogContext = createContext<string | null>(null);

/** id del `<Dialog>` que contiene al componente (para tus propios botones con `commandfor`). */
export function useDialogId() {
  return useContext(DialogContext);
}

/** Sincroniza `open` con el diálogo nativo y avisa de los cambios (Esc, clic fuera, comandos). */
function useOpenState(
  ref: { current: HTMLDialogElement | null },
  open: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
) {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || open === undefined) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open, ref]);

  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Cerrar: el evento close existe en todos los navegadores. Abrir: toggle (donde exista en <dialog>).
    const onClose = () => onOpenChangeRef.current?.(false);
    const onToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === 'open') onOpenChangeRef.current?.(true);
    };
    dialog.addEventListener('close', onClose);
    dialog.addEventListener('toggle', onToggle);
    return () => {
      dialog.removeEventListener('close', onClose);
      dialog.removeEventListener('toggle', onToggle);
    };
  }, [ref]);
}

export interface DialogProps extends Omit<ComponentProps<'dialog'>, 'title' | 'open'> {
  /** Título visible; también nombra el diálogo (aria-labelledby). */
  title: ReactNode;
  /** Botón que lo abre, con `commandfor` y `command="show-modal"`: sin JS ni estado. */
  trigger?: DialogTrigger;
  /** Acciones del pie (Cancelar con `<DialogClose>` + acción primaria). */
  footer?: ReactNode;
  /** sm (24rem) · md (32rem, defecto) · lg (48rem) */
  size?: 'sm' | 'md' | 'lg';
  /** Modo controlado. Sin él, el diálogo se abre con `trigger`. */
  open?: boolean;
  /** Se llama al abrir y al cerrar por cualquier vía (botón, Esc, clic fuera). */
  onOpenChange?: (open: boolean) => void;
  /** Cerrar con clic fuera. Por defecto sí; desactívalo en formularios largos. */
  dismissible?: boolean;
  /** Nombre del botón de cerrar de la cabecera. */
  closeLabel?: string;
  /**
   * Envuelve cabecera, cuerpo y pie en un `<form>` (los botones `type="submit"` del pie lo envían).
   * Con `method: 'dialog'` el diálogo se cierra al enviar.
   */
  form?: ComponentProps<'form'>;
  /**
   * Con `form.action` (p. ej. una Server Action): cerrar el diálogo cuando la acción termina sin
   * lanzar un error. No lo uses con `useActionState` si muestras errores del servidor en el diálogo.
   */
  closeOnSubmit?: boolean;
}

/**
 * Modal sobre `<dialog>` nativo: página inerte, foco contenido, Esc y retorno del foco al botón.
 *
 *   <Dialog title="Nuevo cliente" trigger={{ children: 'Nuevo cliente' }}
 *     footer={<><DialogClose>Cancelar</DialogClose><Button type="submit">Guardar</Button></>}
 *     form={{ action: crearCliente }} closeOnSubmit>
 *     <Field label="Nombre" required><Input name="nombre" autoFocus /></Field>
 *   </Dialog>
 */
export function Dialog({
  title,
  trigger,
  footer,
  size,
  open,
  onOpenChange,
  dismissible = true,
  closeLabel = 'Cerrar',
  form,
  closeOnSubmit,
  id,
  className,
  children,
  ref,
  ...props
}: DialogProps) {
  const autoId = useId();
  const dialogId = id ?? autoId;
  const titleId = `${dialogId}-title`;
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  useOpenState(dialogRef, open, onOpenChange);

  const action = form?.action;
  const formProps =
    closeOnSubmit && typeof action === 'function'
      ? {
          ...form,
          action: async (data: FormData) => {
            await action(data);
            dialogRef.current?.close();
          },
        }
      : form;

  const content = (
    <>
      <header className="dialog-header">
        <h2 id={titleId}>{title}</h2>
        <Button variant="ghost" tone="neutral" iconOnly commandfor={dialogId} command="close" aria-label={closeLabel}>
          <XIcon />
        </Button>
      </header>
      <div className="dialog-body">{children}</div>
      {footer && <footer className="dialog-footer">{footer}</footer>}
    </>
  );

  return (
    <DialogContext value={dialogId}>
      {trigger && <Button {...trigger} commandfor={dialogId} command="show-modal" />}
      <dialog
        ref={mergeRefs(ref, dialogRef)}
        id={dialogId}
        className={cx('dialog', className)}
        data-size={size === 'md' ? undefined : size}
        aria-labelledby={titleId}
        closedby={dismissible ? 'any' : 'closerequest'}
        {...props}
      >
        {formProps ? (
          <form {...formProps} className={cx('dialog-form', formProps.className)}>
            {content}
          </form>
        ) : (
          content
        )}
      </dialog>
    </DialogContext>
  );
}

/** Botón que cierra el `<Dialog>` que lo contiene. Por defecto ghost/neutral (para “Cancelar”). */
export function DialogClose({ variant = 'ghost', tone = 'neutral', ...props }: ButtonProps) {
  const dialogId = useDialogId();
  return <Button variant={variant} tone={tone} commandfor={dialogId ?? undefined} command="close" {...props} />;
}

export interface ConfirmDialogProps extends Omit<ComponentProps<'dialog'>, 'title' | 'open'> {
  title: ReactNode;
  /** Consecuencias de la acción (p. ej. “No se puede deshacer”). */
  description?: ReactNode;
  trigger?: DialogTrigger;
  /** Texto del botón que confirma, p. ej. “Eliminar”. */
  confirmLabel: ReactNode;
  cancelLabel?: ReactNode;
  /** danger por defecto. */
  tone?: Tone;
  /** Se llama solo si la persona confirma. */
  onConfirm: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Confirmación de una acción destructiva. El foco empieza en Cancelar (la opción segura).
 *
 *   <ConfirmDialog title="¿Eliminar el proyecto?" description="Se borrarán sus 12 tareas."
 *     confirmLabel="Eliminar" onConfirm={eliminar}
 *     trigger={{ children: 'Eliminar proyecto', variant: 'outline', tone: 'danger' }} />
 */
export function ConfirmDialog({
  title,
  description,
  trigger,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  open,
  onOpenChange,
  id,
  className,
  onClose,
  ref,
  ...props
}: ConfirmDialogProps) {
  const autoId = useId();
  const dialogId = id ?? autoId;
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  useOpenState(dialogRef, open, onOpenChange);

  return (
    <>
      {trigger && <Button {...trigger} commandfor={dialogId} command="show-modal" />}
      <dialog
        ref={mergeRefs(ref, dialogRef)}
        id={dialogId}
        className={cx('dialog', className)}
        data-size="sm"
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={description ? `${dialogId}-desc` : undefined}
        onClose={(event) => {
          const dialog = event.currentTarget;
          const confirmed = dialog.returnValue === 'confirm';
          // returnValue se conserva entre aperturas: si no se limpia, un Esc posterior “confirmaría”.
          dialog.returnValue = '';
          if (confirmed) onConfirm();
          onClose?.(event);
        }}
        {...props}
      >
        <div className="dialog-body stack" style={{ '--stack-gap': 'var(--space-2)' } as CSSProperties}>
          <h2 id={`${dialogId}-title`} style={{ fontSize: 'var(--fs-lg)', margin: 0 }}>
            {title}
          </h2>
          {description && (
            <p id={`${dialogId}-desc`} className="muted">
              {description}
            </p>
          )}
        </div>
        <form className="dialog-footer" method="dialog">
          <Button type="submit" value="cancel" variant="ghost" tone="neutral" autoFocus>
            {cancelLabel}
          </Button>
          <Button type="submit" value="confirm" tone={tone}>
            {confirmLabel}
          </Button>
        </form>
      </dialog>
    </>
  );
}
