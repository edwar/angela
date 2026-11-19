import type { Ref, RefCallback } from 'react';

export type Tone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type Size = 'sm' | 'md' | 'lg';

/** Une clases ignorando las vacías. */
export function cx(...parts: Array<string | false | null | undefined>): string | undefined {
  return parts.filter(Boolean).join(' ') || undefined;
}

/** Atributo booleano de datos: presente (`""`) o ausente. */
export function flag(value: boolean | undefined): '' | undefined {
  return value ? '' : undefined;
}

/** Combina varias refs (objeto o función) en una sola ref de callback. */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (node) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === 'function') return ref(node);
      if (ref) ref.current = node;
      return undefined;
    });
    return () => {
      cleanups.forEach((cleanup, i) => {
        const ref = refs[i];
        if (typeof cleanup === 'function') cleanup();
        else if (typeof ref === 'function') ref(null);
        else if (ref) ref.current = null;
      });
    };
  };
}

/**
 * React no escribe el atributo `autofocus` en el cliente: llama a `.focus()` al montar, y eso
 * no sirve dentro de un <dialog> cerrado. Esta ref pone el atributo real para que el diálogo
 * enfoque ese control al abrirse.
 */
export function autofocusRef(autoFocus: boolean | undefined): RefCallback<HTMLElement> | undefined {
  if (!autoFocus) return undefined;
  return (node) => {
    node?.setAttribute('autofocus', '');
  };
}
