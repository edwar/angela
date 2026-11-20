'use client';

import { createContext, useContext, useId, type ComponentProps, type ReactNode } from 'react';
import { autofocusRef, cx, mergeRefs } from './utils.js';

interface FieldContextValue {
  id: string;
  hintId?: string;
  errorId?: string;
  required?: boolean;
  invalid?: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

export interface FieldProps extends Omit<ComponentProps<'div'>, 'id'> {
  /** Etiqueta visible (nunca la sustituyas por un placeholder). */
  label: ReactNode;
  /** Texto de ayuda, enlazado con aria-describedby. */
  hint?: ReactNode;
  /** Mensaje de error. Se muestra al salir del campo si es inválido (`:user-invalid`) o con `invalid`. */
  error?: ReactNode;
  /** Marca el campo como obligatorio (asterisco + `required` en el control). */
  required?: boolean;
  /** Error que viene del servidor: muestra `error` desde el principio. */
  invalid?: boolean;
  /** id del control. Por defecto se genera uno. */
  id?: string;
}

/**
 * Etiqueta + ayuda + control + error, con los ids enlazados.
 *
 *   <Field label="Correo" error="Escribe un correo válido." required>
 *     <Input type="email" name="email" autoComplete="email" />
 *   </Field>
 */
export function Field({ label, hint, error, required, invalid, id, className, children, ...props }: FieldProps) {
  const autoId = useId();
  const controlId = id ?? autoId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  return (
    <div className={cx('field', className)} {...props}>
      <label htmlFor={controlId}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {hint && (
        <p className="hint" id={hintId}>
          {hint}
        </p>
      )}
      <FieldContext value={{ id: controlId, hintId, errorId, required, invalid }}>{children}</FieldContext>
      {error && (
        <p className="error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

type ControlProps = {
  id?: string;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: ComponentProps<'input'>['aria-invalid'];
};

const isDev = () => typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

/** Conecta un control con su Field: id, ayuda, error y estado inválido. */
function useFieldControl<P extends ControlProps>(props: P) {
  const field = useContext(FieldContext);
  if (field && props.id && props.id !== field.id && isDev()) {
    console.warn(
      `[@angela-ui/react] <Field> ya da id al control: pon id="${props.id}" en el <Field>, no en el control (la etiqueta no lo encontraría).`,
    );
  }
  const describedBy = [field?.hintId, props['aria-describedby'], field?.invalid ? field.errorId : undefined]
    .filter(Boolean)
    .join(' ');
  return {
    ...props,
    id: field?.id ?? props.id,
    className: cx('input', props.className),
    required: props.required ?? field?.required,
    'aria-describedby': describedBy || undefined,
    // Empieza en "false": Firefox y Safari anuncian como inválido un campo requerido vacío sin él.
    'aria-invalid': props['aria-invalid'] ?? (field?.invalid ? true : false),
    // @angela-ui/angela/js usa data-error para enlazar y anunciar el mensaje cuando aparece.
    'data-error': field?.errorId,
  };
}

export type InputProps = ComponentProps<'input'>;

export function Input({ ref, ...props }: InputProps) {
  return <input ref={mergeRefs(ref, autofocusRef(props.autoFocus))} {...useFieldControl(props)} />;
}

export type TextareaProps = ComponentProps<'textarea'>;

export function Textarea({ ref, ...props }: TextareaProps) {
  return <textarea ref={mergeRefs(ref, autofocusRef(props.autoFocus))} {...useFieldControl(props)} />;
}

export type SelectProps = ComponentProps<'select'>;

/** `<select>` nativo: en móvil abre el selector del sistema. */
export function Select({ ref, ...props }: SelectProps) {
  return <select ref={mergeRefs(ref, autofocusRef(props.autoFocus))} {...useFieldControl(props)} />;
}
