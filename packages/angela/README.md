# angela

Componentes accesibles sobre HTML nativo.

## Instalación

```sh
pnpm add @angela-ui/angela
```

## CSS

```css
@import "@angela-ui/angela/css";          /* dist/angela.css, todo en @layer angela.* */
```

Con Tailwind v4 (los tokens pasan a ser utilidades: `bg-surface`, `text-muted`, `bg-brand-solid`, `shadow-elevation-2`…):

```css
@import "tailwindcss";
@import "@angela-ui/angela/css";
@import "@angela-ui/angela/tailwind.css";
```

Sin instalar nada (CDN), en el `<head>`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@angela-ui/angela@0.3/dist/angela.min.css">
<script type="module">
  import { angela } from 'https://cdn.jsdelivr.net/npm/@angela-ui/angela@0.3/src/js/index.js/+esm';
  angela();
</script>
```

`/+esm` hace que jsDelivr resuelva los polyfills que angela carga solo en navegadores antiguos. `@0.3` recibe las correcciones; para fijar una versión exacta, usa la completa (`@0.3.0`).

## Modo claro/oscuro

En el `<head>`:

```html
<meta name="color-scheme" content="light dark">
<script>try{document.querySelector('meta[name="color-scheme"]').content=localStorage.getItem("color-scheme")??"light dark"}catch(e){}</script>
```

El script es opcional (solo hace falta si usas el selector de tema); también se exporta como `themeInlineScript` desde `@angela-ui/angela/js/theme`.

Selector de tema: un botón con `data-theme-toggle` y dos `<span data-when="light|dark">` (ver la página de inicio de la documentación).

## Paleta

```css
:root {
  --angela-brand-h: 262;   --angela-brand-c: 0.17;
  --angela-neutral-c: 0.012;
  --angela-success-h: 150; --angela-warning-h: 65;
  --angela-danger-h: 25;   --angela-info-h: 235;
}
```

Contraste AA garantizado para cualquier tono y croma ≤ 0.2. Para comprobar unos valores concretos:

```sh
pnpm check:contrast --brand 20 0.19
```

## JavaScript (opcional)

```js
import { angela } from '@angela-ui/angela/js';
const cleanup = angela(); // validación accesible, pestañas, diálogos, popovers, tema y polyfills
```

O por partes: `enhanceForms`, `enhanceTabs` (y `selectTab`), `enhanceDialogs`, `enhancePopovers`, `initThemeToggle`, `setScheme`, `toggleScheme`, `loadPolyfills`. Todo es seguro en SSR.

Todo escucha en el documento, así que también cubre lo que se monta después de cargar (modales, rutas, renderizado condicional). angela no define elementos propios: todo es HTML nativo con `class` y `data-*`.

## Frameworks

El CSS y el marcado son los mismos en todos: elementos nativos con `class` y `data-*`. Cambia cómo se escribe el HTML y dónde se llama a `angela()` (una vez, en el cliente).

| | CSS | JS | Notas |
|---|---|---|---|
| **HTML / Astro** | `@import "@angela-ui/angela/css"` o `<link>` | `<script type="module">import { angela } from '@angela-ui/angela/js'; angela();</script>` | — |
| **React / Next.js** | `import '@angela-ui/angela/css'` en el layout raíz | `<Angela />` de [`@angela-ui/react`](../angela-react) | Usa `@angela-ui/react` (componentes tipados) o el marcado directo con `@angela-ui/angela/jsx`. |
| **Vue** | `import '@angela-ui/angela/css'` en `main.ts` | `onMounted(() => angela())` | — |
| **Angular** | `"styles": ["node_modules/@angela-ui/angela/dist/angela.css"]` en `angular.json` | `afterNextRender(() => angela())` | Atributos dinámicos con `[attr.commandfor]`. |
| **Svelte** | `import '@angela-ui/angela/css'` | `onMount(() => angela())` | — |

Reglas comunes:

- **Pestañas:** renderiza el estado inicial (`aria-selected`, `hidden`) y deja que `enhanceTabs` lo gestione. Para saber cuál está activa, escucha el evento `tabchange` del `.tabs`; para cambiarla desde fuera, `selectTab(boton)`. No la controles con el estado del framework.
- **Diálogos con estado:** ábrelos con `dialog.showModal()` (por referencia), no con el atributo `open`, que los abre sin modal.
- **`autofocus`:** React no escribe el atributo en el cliente (llama a `.focus()` al montar), así que un `<dialog>` cerrado no sabe qué enfocar. `@angela-ui/react` lo corrige; con marcado propio, ponlo con `el.setAttribute('autofocus', '')`.
- **Tema sin destello:** el script de `themeInlineScript` va en el `<head>` del HTML del servidor, justo después del `<meta name="color-scheme">`. Como cambia ese `<meta>` antes de hidratar, en React ponle `suppressHydrationWarning`. En una SPA sin SSR, cópialo en el `index.html`.

## TypeScript

`@angela-ui/angela/js` y `@angela-ui/angela/palette` traen sus tipos, y `import '@angela-ui/angela/css'` también tipa (TypeScript 6+ marca como error los imports de efecto sin declaración).

Para escribir el marcado nativo en JSX sin `as any` (`commandfor`, `command`, `switch`, `focusgroup`, el evento `tabchange`):

```jsonc
// tsconfig.json
{ "compilerOptions": { "types": ["@angela-ui/angela/jsx"] } }
```

En React 19 escribe esos atributos en minúsculas (`commandfor`, no `commandFor`): React pasa tal cual los que no conoce, pero descarta el camelCase con un aviso. `switch` se escribe `switch=""`, no `switch={true}`.

## Componentes

Botón · Campos (input, select, textarea) · Casillas, radios e interruptor · Diálogo (`.dialog-form` para envolver cabecera, cuerpo y pie en un formulario) · Popover · Pestañas · Desplegable/acordeón · Aviso · Etiqueta · Progreso · Tarjeta · Tabla · Tipografía (`.heading`, `.text`, `.prose`).

Ejemplos, API y notas de accesibilidad: documentación (`pnpm dev` en la raíz).
