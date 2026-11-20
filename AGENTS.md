# AGENTS.md — angela

Librería de componentes sobre HTML nativo: CSS con capas + JS opcional mínimo. Sin framework.
La guía visual es `DESIGN.md`: toda UI la sigue.

## Estructura

```
packages/angela/          La librería (paquete npm "angela")
  src/palette.js          Receta del color (fuente de verdad) + matemática de contraste
  src/tokens/palette.css  GENERADO desde palette.js — no editar a mano
  src/tokens/scale.css    Tipografía, espacio, radios, sombras, movimiento
  src/base.css            Estilos de documento sin clases (:where, especificidad 0)
  src/components/*.css    Un archivo por componente, en @layer angela.components
  src/utilities.css       .visually-hidden, .skip-link, .stack, .cluster…
  src/tailwind.css        Puente opcional con Tailwind v4
  src/js/                 Mejoras opcionales (sin dependencias, seguras en SSR)
  src/jsx.d.ts            Tipos de JSX para React (commandfor, command, switch, <angela-tabs>)
  src/css.d.ts            Tipos de los imports de CSS (import 'angela/css')
  scripts/                build, build-palette, check-contrast
packages/angela-react/    Componentes de React 19 sobre angela (paquete npm "angela-react")
  src/*.tsx               Un archivo por grupo; 'use client' solo donde hay hooks o refs
docs/                     Sitio de documentación (Astro)
  src/data/components.js  Ejemplos, API y notas de accesibilidad de cada componente
```

## Comandos

- `pnpm dev` — documentación en local.
- `pnpm test` — Vitest de `angela` (paleta, tema, pestañas, formularios), de `angela-react` y del laboratorio (`docs/src/lib/lab`).
- `pnpm typecheck` — genera los tipos de `angela/js` (desde el JSDoc) y comprueba `angela-react`.
- `pnpm check:contrast` — verifica WCAG AA en todos los tonos. Con valores: `pnpm --filter angela check:contrast --brand 20 0.19`.
- `pnpm build` — genera paleta, `dist/angela.css`, tipos, `angela-react` y el sitio. Solo antes de push.

## Reglas

- **Nativo primero.** Antes de escribir JS, comprueba si HTML/CSS lo resuelven (`<dialog>`, `popover`, `command`/`commandfor`, `<details name>`, `:user-invalid`, `focusgroup`, anchor positioning).
- Todo el CSS va en capas `angela.*`. Valores por defecto en `:where()` para que `data-*` y el CSS del usuario ganen.
- Variantes con atributos (`data-variant`, `data-tone`, `data-size`), no clases BEM.
- Solo tokens; nada de valores de color sueltos. Nombres de tokens que no choquen con Tailwind (`--fs-*`, `--lh-*`, `--fw-*`, `--elevation-*`, `--font-body`).
- Para cambiar colores, edita `src/palette.js`, ejecuta `build:palette` y `check:contrast`.
- Propiedades lógicas, `:focus-visible`, `forced-colors`, `prefers-reduced-motion`.
- JS: un módulo por función en `src/js/`, exporta funciones que devuelven un `cleanup`, guarda `typeof window` y lleva test. Se registra en `src/js/index.js` (import, reexport y llamada en `angela()`): si no, no se ejecuta en ninguna web. El PR del laboratorio lo hace solo. Los tipos se generan del JSDoc: documenta parámetros y retornos.
- JS para frameworks: escucha en el documento (delegación) o con `MutationObserver`, nunca solo sobre lo que existe al llamar. Los frameworks montan nodos después.
- `angela-react`: envoltorios finos que generan el mismo marcado que la documentación, sin estado propio salvo el imprescindible.
  - Un módulo sin `'use client'` no importa uno con `'use client'` (lo comprueba `boundaries.test.ts`).
  - Nada de `cloneElement`: un elemento que llega desde un Server Component puede ser una referencia diferida. Los disparadores son objetos de props.
  - El estado que gestiona el DOM nativo (`<angela-tabs>`, `<dialog>`) se pinta solo al principio; los cambios van por la API del elemento.
  - `autoFocus` necesita el atributo real (`autofocusRef`): React lo omite en el cliente.
- Cada componente nuevo se documenta en `docs/src/data/components.js` (ejemplos + API + accesibilidad) y, si encaja, tiene su envoltorio en `angela-react`.
- Antes de terminar: `pnpm test`, `pnpm check:contrast` y revisión con teclado y lector de pantalla.

## Soporte de navegadores

**Baseline “ampliamente disponible”.** Lo más nuevo se usa como mejora progresiva cuyo fallback es el control o comportamiento nativo (sin polyfills pesados):
invokers y popover → polyfill condicional (`loadPolyfills`); anchor positioning → hoja inferior (`@supports`); focusgroup → teclado en `<angela-tabs>`; `closedby` → `enhanceDialogs`; `accent-color`, `field-sizing`, `interpolate-size`, animaciones de salida → sin fallback (se ve el nativo / transición instantánea).

## Revisión de PR

`.github/workflows/revision.yml` revisa cada PR a `main`: tests, tipos, contraste, build y, por cada componente que crea o edita, las reglas del laboratorio (`docs/src/lib/lab/review.js`) más las de este archivo que se comprueban con código (`@import` en `angela.css`, documentación con ejemplos/API/accesibilidad, JS registrado en `index.js` y con test). Solo cuenta lo que introduce el PR. Errores → el check falla; si no, queda la revisión visual en la preview. `revision-comentario.yml` publica el resultado en un comentario. Ninguno aprueba, mezcla ni despliega. La lógica está en `docs/scripts/revision/` (con tests); para probarla en local: `node docs/scripts/revision/cli.mjs --base main`.

Una regla nueva que se pueda comprobar con código va en `review.js` (la ven el laboratorio y el CI) o, si es del PR en conjunto, en `docs/scripts/revision/revision.js`.

## Git

Ramas `feat/…`, `fix/…`, `chore/…` → PR. Commits en español con Conventional Commits. No commitear ni hacer push sin permiso.
