/**
 * Tipos de JSX para usar angela en React (19+) con TypeScript.
 *
 * Activa los atributos HTML nuevos que angela usa y que @types/react aún no declara,
 * el elemento <selectedcontent> y el evento tabchange. Añádelo una vez en tu proyecto:
 *
 *   // tsconfig.json → "compilerOptions": { "types": ["@angela-ui/angela/jsx"] }
 *   // o en cualquier .d.ts:  /// <reference types="@angela-ui/angela/jsx" />
 *
 * Escribe siempre los atributos en minúsculas (`commandfor`, no `commandFor`): React 19
 * pasa tal cual los atributos que no conoce, pero avisa y descarta el camelCase.
 */
import 'react';

type AngelaTabChangeEvent = CustomEvent<{ tab: HTMLButtonElement; panel: HTMLElement | undefined }>;

declare module 'react' {
  interface ButtonHTMLAttributes<T> {
    /** Invoker Commands: acción sobre el elemento de `commandfor`. Los comandos propios empiezan por `--`. */
    command?:
      | 'show-modal'
      | 'close'
      | 'request-close'
      | 'show-popover'
      | 'hide-popover'
      | 'toggle-popover'
      | `--${string}`
      | undefined;
    /** id del `<dialog>` o `[popover]` que controla el botón. */
    commandfor?: string | undefined;
  }

  interface InputHTMLAttributes<T> {
    /** Interruptor nativo (`<input type="checkbox" switch="">`). Pasa `""`, no `true`. */
    switch?: '' | undefined;
  }

  interface HTMLAttributes<T> {
    /** Navegación con flechas nativa (p. ej. `"tablist nomemory"`). */
    focusgroup?: string | undefined;
    /** Elemento del focusgroup que recibe el foco al entrar. */
    focusgroupstart?: '' | undefined;
  }

  namespace JSX {
    interface IntrinsicElements {
      /** Select personalizable (`appearance: base-select`): copia en el botón la opción elegida. */
      selectedcontent: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

declare global {
  // Lo emite el .tabs al cambiar de pestaña. Burbujea: también se puede escuchar en document o window.
  // React no conecta eventos propios en elementos nativos: escúchalo con addEventListener.
  interface GlobalEventHandlersEventMap {
    tabchange: AngelaTabChangeEvent;
  }
}
