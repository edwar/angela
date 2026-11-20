'use client';

import { createContext, useContext, useId, type ComponentProps } from 'react';
import { Button, type ButtonProps } from './button.js';
import { cx, type Tone } from './utils.js';

const PopoverContext = createContext<string | null>(null);

export interface PopoverProps extends ComponentProps<'div'> {
  /**
   * Props del botón que lo abre y al que se ancla (`children` es su texto). Es un objeto, no un
   * elemento, para poder pasarlo desde un Server Component.
   */
  trigger: Omit<ButtonProps, 'commandfor' | 'command'>;
  /** Más relleno, para contenido de texto. */
  padding?: 'lg';
}

/**
 * Panel anclado a su botón (API Popover + anchor positioning). Se cierra con Esc o clic fuera.
 * No es un menú ARIA: se recorre con Tab.
 *
 *   <Popover trigger={{ children: 'Acciones', variant: 'outline', tone: 'neutral' }}>
 *     <PopoverItem onClick={renombrar}>Renombrar</PopoverItem>
 *   </Popover>
 */
export function Popover({ trigger, padding, id, className, children, ...props }: PopoverProps) {
  const autoId = useId();
  const popoverId = id ?? autoId;
  return (
    <>
      <Button {...trigger} commandfor={popoverId} command="toggle-popover" />
      {/* Justo después de su botón, para que el orden de lectura sea natural. */}
      <div id={popoverId} className={cx('popover', className)} popover="auto" data-padding={padding} {...props}>
        <PopoverContext value={popoverId}>{children}</PopoverContext>
      </div>
    </>
  );
}

export interface PopoverItemProps extends ComponentProps<'button'> {
  tone?: Tone;
  /** Cerrar el panel al pulsarlo (por defecto sí). */
  closes?: boolean;
}

/** Acción dentro de un `<Popover>`. Al cerrar, @angela-ui/angela/js devuelve el foco al botón que lo abrió. */
export function PopoverItem({ tone, closes = true, className, type = 'button', ...props }: PopoverItemProps) {
  const popoverId = useContext(PopoverContext);
  return (
    <button
      type={type}
      className={cx('popover-item', className)}
      data-tone={tone}
      commandfor={closes && popoverId ? popoverId : undefined}
      command={closes && popoverId ? 'hide-popover' : undefined}
      {...props}
    />
  );
}
