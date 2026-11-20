/**
 * Tipos de JSX para usar angela en React (19+) con TypeScript.
 *
 * Activa los atributos HTML nuevos que angela usa y que @types/react aún no declara,
 * y el elemento <angela-tabs>. Añádelo una vez en tu proyecto:
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

  interface AngelaTabsAttributes extends HTMLAttributes<HTMLElement> {
    /** Se emite al cambiar de pestaña. En React 19 el nombre va en minúsculas: `ontabchange`. */
    ontabchange?: ((event: AngelaTabChangeEvent) => void) | undefined;
  }

  namespace JSX {
    interface IntrinsicElements {
      'angela-tabs': DetailedHTMLProps<AngelaTabsAttributes, HTMLElement>;
    }
  }
}

declare global {
  // Burbujea: también se puede escuchar en document o window.
  interface GlobalEventHandlersEventMap {
    tabchange: AngelaTabChangeEvent;
  }
}
