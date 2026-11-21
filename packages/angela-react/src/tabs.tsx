'use client';

import { enhanceTabs, selectTab } from '@angela-ui/angela/js/tabs';
import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { cx } from './utils.js';

export interface TabItem {
  /** Identificador estable (sin espacios). */
  value: string;
  label: ReactNode;
  content: ReactNode;
}

export interface TabsProps extends Omit<ComponentProps<'div'>, 'children'> {
  items: TabItem[];
  /** Nombre de la fila de pestañas (aria-label). */
  label: string;
  /** Pestaña inicial (modo no controlado). Por defecto, la primera. */
  defaultValue?: string;
  /** Modo controlado. */
  value?: string;
  onValueChange?: (value: string) => void;
}

/**
 * Pestañas sobre `<div class="tabs">`: flechas, Inicio/Fin, selección que sigue al foco y paneles
 * buscables con Ctrl+F. El estado inicial se renderiza en el servidor; después lo gestiona
 * `enhanceTabs` en el DOM, así React y el DOM no se pisan.
 */
export function Tabs({ items, label, defaultValue, value, onValueChange, className, ref, ...props }: TabsProps) {
  const baseId = useId();
  const tabId = (v: string) => `${baseId}-tab-${v}`;
  // El marcado se fija con el valor inicial: los cambios posteriores los aplica enhanceTabs.
  const [initial] = useState(() => value ?? defaultValue ?? items[0]?.value);
  const elementRef = useRef<HTMLDivElement | null>(null);
  // El último callback, sin volver a suscribir el listener en cada render.
  const onChangeRef = useRef(onValueChange);
  onChangeRef.current = onValueChange;
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Comparte los listeners con angela() si ya está activo: no se duplican.
  useEffect(() => enhanceTabs(document), []);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) return;
    // React no conecta eventos propios en elementos nativos: se escucha a mano.
    const onTabchange = (event: Event) => {
      if (event.target !== node) return;
      const { tab } = (event as CustomEvent<{ tab: HTMLButtonElement }>).detail;
      const item = itemsRef.current.find((i) => tabId(i.value) === tab.id);
      if (item) onChangeRef.current?.(item.value);
    };
    node.addEventListener('tabchange', onTabchange);
    return () => node.removeEventListener('tabchange', onTabchange);
    // tabId solo depende de baseId, que es estable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value === undefined) return;
    const tab = document.getElementById(tabId(value));
    if (tab instanceof HTMLButtonElement && tab.getAttribute('aria-selected') !== 'true') {
      selectTab(tab, { silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div
      ref={(node: HTMLDivElement | null) => {
        elementRef.current = node;
        if (typeof ref === 'function') return ref(node);
        if (ref) ref.current = node;
      }}
      className={cx('tabs', className)}
      {...props}
    >
      <div className="tablist" role="tablist" focusgroup="tablist nomemory" aria-label={label}>
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={tabId(item.value)}
            aria-selected={item.value === initial}
            focusgroupstart={item.value === initial ? '' : undefined}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.value}
          role="tabpanel"
          aria-labelledby={tabId(item.value)}
          // React escribe hidden="" (no "until-found"); enhanceTabs lo cambia al preparar.
          hidden={item.value !== initial}
          tabIndex={item.value === initial ? 0 : undefined}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
