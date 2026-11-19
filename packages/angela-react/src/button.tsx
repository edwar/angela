'use client';

import type { ComponentProps } from 'react';
import { buttonProps, type ButtonStyleProps } from './button-props.js';
import { autofocusRef, mergeRefs } from './utils.js';

export type ButtonProps = ComponentProps<'button'> & ButtonStyleProps;

/** `<button>` nativo. `type="button"` por defecto: dentro de un formulario, pon `type="submit"` en el que envía. */
export function Button({ variant, tone, size, iconOnly, block, className, type = 'button', autoFocus, ref, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      autoFocus={autoFocus}
      ref={mergeRefs(ref, autofocusRef(autoFocus))}
      {...buttonProps({ variant, tone, size, iconOnly, block, className })}
      {...props}
    />
  );
}
