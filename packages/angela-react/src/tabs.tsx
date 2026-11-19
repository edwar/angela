'use client';

import { defineTabs } from 'angela/js/tabs';
import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { cx } from './utils.js';

export interface TabItem {
  /** Identificador estable (sin espacios). */
  value: string;
  label: ReactNode;
  content: ReactNode;
}

type AngelaTabsElement = HTMLElement & {
  select?: (tab: HTMLButtonElement, options?: { focus?: boolean; silent?: boolean }) => void;
};

export interface TabsProps extends Omit<ComponentProps<'angela-tabs'>, 'children'> {
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
 * Pestañas sobre `<angela-tabs>`: flechas, Inicio/Fin, selección que sigue al foco y paneles
 * buscables con Ctrl+F. El estado inicial se renderiza en el servidor; después lo gestiona el
 * elemento nativo, así React y el DOM no se pisan.
 */
export function Tabs({ items, label, defaultValue, value, onValueChange, className, ref, ...props }: TabsProps) {
  const baseId = useId();
  const tabId = (v: string) => `${baseId}-tab-${v}`;
  // El marcado se fija con el valor inicial: los cambios posteriores los aplica el elemento.
  const [initial] = useState(() => value ?? defaultValue ?? items[0]?.value);
  const elementRef = useRef<AngelaTabsElement | null>(null);

  useEffect(() => {
    defineTabs();
  }, []);

  useEffect(() => {
    if (value === undefined) return;
    const tab = document.getElementById(tabId(value));
    if (tab instanceof HTMLButtonElement && tab.getAttribute('aria-selected') !== 'true') {
      elementRef.current?.select?.(tab, { silent: true });
    }
    // tabId solo depende de baseId, que es estable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <angela-tabs
      ref={(node: AngelaTabsElement | null) => {
        elementRef.current = node;
        if (typeof ref === 'function') return ref(node);
        if (ref) ref.current = node;
      }}
      className={cx('tabs', className)}
      ontabchange={(event) => {
        const item = items.find((i) => tabId(i.value) === event.detail.tab.id);
        if (item) onValueChange?.(item.value);
      }}
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
          // React escribe hidden="" (no "until-found"); el elemento lo cambia al conectarse.
          hidden={item.value !== initial}
          tabIndex={item.value === initial ? 0 : undefined}
        >
          {item.content}
        </div>
      ))}
    </angela-tabs>
  );
}
