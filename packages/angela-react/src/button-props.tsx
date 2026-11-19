import type { ComponentProps } from 'react';
import { cx, flag, type Size, type Tone } from './utils.js';

export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost';

export interface ButtonStyleProps {
  /** solid (defecto, una por vista) · soft · outline · ghost */
  variant?: ButtonVariant;
  tone?: Tone;
  size?: Size;
  /** Botón cuadrado solo con ícono. Requiere `aria-label`. */
  iconOnly?: boolean;
  /** Ocupa todo el ancho disponible. */
  block?: boolean;
  className?: string;
}

/**
 * Clases y atributos de un botón de angela, para aplicarlos a otro componente
 * (por ejemplo `<Link {...buttonProps({ variant: 'outline' })} href="/">` de Next).
 */
export function buttonProps({ variant, tone, size, iconOnly, block, className }: ButtonStyleProps = {}) {
  return {
    className: cx('button', className),
    'data-variant': variant,
    'data-tone': tone,
    'data-size': size,
    'data-icon-only': flag(iconOnly),
    'data-block': flag(block),
  };
}

export type ButtonLinkProps = ComponentProps<'a'> & ButtonStyleProps;

/** Enlace con aspecto de botón: para navegar, nunca para acciones. */
export function ButtonLink({ variant, tone, size, iconOnly, block, className, ...props }: ButtonLinkProps) {
  return <a {...buttonProps({ variant, tone, size, iconOnly, block, className })} {...props} />;
}
