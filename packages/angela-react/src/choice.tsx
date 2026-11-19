'use client';

import { useId, type ComponentProps, type ReactNode } from 'react';
import { autofocusRef, cx, mergeRefs } from './utils.js';

export interface ChoiceProps extends Omit<ComponentProps<'input'>, 'type'> {
  /** Etiqueta visible, después del control. */
  label: ReactNode;
  /** Ayuda bajo la etiqueta, enlazada con aria-describedby. */
  hint?: ReactNode;
}

function Choice({
  kind,
  label,
  hint,
  id,
  className,
  style,
  ref,
  ...input
}: ChoiceProps & { kind: 'checkbox' | 'radio' | 'switch' }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const describedBy = [hintId, input['aria-describedby']].filter(Boolean).join(' ') || undefined;
  const control = (
    <input
      ref={mergeRefs(ref, autofocusRef(input.autoFocus))}
      {...input}
      id={inputId}
      type={kind === 'radio' ? 'radio' : 'checkbox'}
      // role="switch" se anuncia como activado/desactivado; el atributo switch lo hace nativo en Safari.
      role={kind === 'switch' ? 'switch' : input.role}
      switch={kind === 'switch' ? '' : undefined}
      aria-describedby={describedBy}
    />
  );
  return (
    <div className={cx('choice', className)} style={style}>
      {control}
      {hint ? (
        <div>
          <label htmlFor={inputId}>{label}</label>
          <p className="hint" id={hintId}>
            {hint}
          </p>
        </div>
      ) : (
        <label htmlFor={inputId}>{label}</label>
      )}
    </div>
  );
}

/** Casilla para opciones independientes. Agrupa varias en un `<Fieldset>`. */
export const Checkbox = (props: ChoiceProps) => <Choice kind="checkbox" {...props} />;

/** Radio para 2–5 opciones excluyentes (con más, mejor un `<Select>`). Mismo `name` en el grupo. */
export const Radio = (props: ChoiceProps) => <Choice kind="radio" {...props} />;

/** Interruptor: un checkbox que se anuncia como activado/desactivado. */
export const Switch = (props: ChoiceProps) => <Choice kind="switch" {...props} />;

export interface FieldsetProps extends ComponentProps<'fieldset'> {
  legend: ReactNode;
}

/** Agrupa controles relacionados con su leyenda. */
export function Fieldset({ legend, className, children, ...props }: FieldsetProps) {
  return (
    <fieldset className={cx('fieldset', className)} {...props}>
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );
}
