import { themeInlineScript } from '@angela-ui/angela/js/theme';
import type { ComponentProps } from 'react';
import { buttonProps, type ButtonStyleProps } from './button-props.js';
import { MoonIcon, SunIcon } from './icons.js';

/**
 * `<meta name="color-scheme">` + script que aplica el tema guardado antes de pintar (sin destello).
 * Ponlo en el `<head>` del layout raíz, renderizado en el servidor.
 *
 * En una SPA sin SSR (Vite), el script no se ejecuta desde React: copia `themeInlineScript`
 * en el `index.html`.
 */
export function ThemeScript() {
  return (
    <>
      {/* El script cambia content antes de hidratar: es intencionado. */}
      <meta name="color-scheme" content="light dark" suppressHydrationWarning />
      <script dangerouslySetInnerHTML={{ __html: themeInlineScript }} />
    </>
  );
}

export interface ThemeToggleProps extends Omit<ComponentProps<'button'>, 'children'>, Omit<ButtonStyleProps, 'iconOnly'> {
  /** Nombre cuando se ve el tema claro. */
  toDarkLabel?: string;
  /** Nombre cuando se ve el tema oscuro. */
  toLightLabel?: string;
}

/**
 * Botón de tema (sistema ↔ su opuesto). Lo activa `<Angela />`. Sin JS no hace nada,
 * y la página sigue al sistema.
 */
export function ThemeToggle({
  toDarkLabel = 'Cambiar a tema oscuro',
  toLightLabel = 'Cambiar a tema claro',
  variant = 'ghost',
  tone = 'neutral',
  size,
  block,
  className,
  ...props
}: ThemeToggleProps) {
  // <button> directo (no <Button>): un módulo de servidor no debe importar uno de cliente.
  return (
    <button type="button" {...buttonProps({ variant, tone, size, block, className, iconOnly: true })} data-theme-toggle="" {...props}>
      <span data-when="light">
        <MoonIcon />
        <span className="visually-hidden">{toDarkLabel}</span>
      </span>
      <span data-when="dark">
        <SunIcon />
        <span className="visually-hidden">{toLightLabel}</span>
      </span>
    </button>
  );
}
