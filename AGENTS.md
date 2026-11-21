# AGENTS.md — angela

Librería de componentes sobre HTML nativo: CSS con capas + JS opcional mínimo. Sin framework.
La guía visual es `DESIGN.md`: toda UI la sigue.

## Estructura

```
packages/angela/          La librería (paquete npm "@angela-ui/angela")
  src/palette.js          Receta del color (fuente de verdad) + matemática de contraste
  src/tokens/palette.css  GENERADO desde palette.js — no editar a mano
  src/tokens/scale.css    Tipografía, espacio, radios, sombras, movimiento
  src/base.css            Estilos de documento sin clases (:where, especificidad 0)
  src/components/*.css    Un archivo por componente, en @layer angela.components
  src/utilities.css       .visually-hidden, .skip-link, .stack, .cluster…
  src/tailwind.css        Puente opcional con Tailwind v4
  src/js/                 Mejoras opcionales (sin dependencias, seguras en SSR)
  src/jsx.d.ts            Tipos de JSX para React (commandfor, command, switch, <angela-tabs>)
  src/css.d.ts            Tipos de los imports de CSS (import '@angela-ui/angela/css')
  scripts/                build, build-palette, check-contrast
packages/angela-react/    Componentes de React 19 sobre angela (paquete npm "@angela-ui/react")
packages/angela-icons/    Iconos (paquete npm "@angela-ui/icons")
  iconos/<nombre>.json    La fuente de cada icono: formas limpias sobre 24×24 + categoría, etiquetas, autor, licencia
  src/reglas.js           La guía de los iconos en código: la usan el build, el editor y la revisión
  src/mano-alzada.js      El estilo: convierte las formas en trazos a mano alzada (silueta rellena)
  scripts/build.mjs       Genera dist/: un módulo por icono, «todos», sprite, metadatos y tipos
  src/*.tsx               Un archivo por grupo; 'use client' solo donde hay hooks o refs
docs/                     Sitio de documentación (Astro)
  src/data/componentes/   Una página por componente (<slug>.js): ejemplos, API y accesibilidad. components.js solo las ordena
  src/lib/codigo-frameworks.js  Pasa el HTML de cada ejemplo a Astro, React, Next.js, Vue y Angular (pestañas de los ejemplos)
  src/lib/playground/           «Pruébalo»: props de cada componente (definiciones.js) → controles, vista previa y código
  src/lib/componentes/          Componentes reutilizables por framework (TS o JS) desde un árbol neutro (ir.js, emisores.js)
  src/bloques/                  Bloques (/bloques): pantallas enteras en HTML, solo con angela; los frameworks salen del conversor
  src/demos/<id>/               Demos de «Interacciones» (/interacciones): su HTML, CSS y JS son lo que se ejecuta y lo que se muestra
  src/lib/taller/               Taller de temas (/temas): presets, CSS exportado, enlace y contraste con palette.js
  src/lib/compatibilidad.js     Compatibilidad de cada componente: qué usa (tabla CARACTERISTICAS), desde qué versión (web-features) y cuántos usuarios (caniuse)
  src/styles/docs.css     Estilo «plano» del sitio (tema data-angela-theme="plano")
  src/data/imagenes.js    Índice de las imágenes de ejemplo (public/img): autor, origen y licencia
```

## Comandos

- `pnpm dev` — documentación en local.
- `pnpm test` — Vitest de `angela` (paleta, tema, pestañas, formularios), de `@angela-ui/react` y del laboratorio (`docs/src/lib/lab`).
- `pnpm typecheck` — genera los tipos de `@angela-ui/angela/js` (desde el JSDoc) y comprueba `@angela-ui/react`.
- `pnpm check:contrast` — verifica WCAG AA en todos los tonos. Con valores: `pnpm --filter @angela-ui/angela check:contrast --brand 20 0.19`.
- `pnpm build` — genera paleta, `dist/angela.css`, tipos, `@angela-ui/react` y el sitio. Solo antes de push.

## Reglas

- **Nativo primero.** Antes de escribir JS, comprueba si HTML/CSS lo resuelven (`<dialog>`, `popover`, `command`/`commandfor`, `<details name>`, `:user-invalid`, `focusgroup`, anchor positioning).
- Todo el CSS va en capas `angela.*`. Valores por defecto en `:where()` para que `data-*` y el CSS del usuario ganen.
- Variantes con atributos (`data-variant`, `data-tone`, `data-size`), no clases BEM.
- Solo tokens; nada de valores de color sueltos. Nombres de tokens que no choquen con Tailwind (`--fs-*`, `--lh-*`, `--fw-*`, `--elevation-*`, `--font-body`).
- Para cambiar colores, edita `src/palette.js`, ejecuta `build:palette` y `check:contrast`.
- Propiedades lógicas, `:focus-visible`, `forced-colors`, `prefers-reduced-motion`.
- JS: un módulo por función en `src/js/`, exporta funciones que devuelven un `cleanup`, guarda `typeof window` y lleva test. Se registra en `src/js/index.js` (import, reexport y llamada en `angela()`): si no, no se ejecuta en ninguna web. El PR del laboratorio lo hace solo. Los tipos se generan del JSDoc: documenta parámetros y retornos.
- JS para frameworks: escucha en el documento (delegación) o con `MutationObserver`, nunca solo sobre lo que existe al llamar. Los frameworks montan nodos después.
- `@angela-ui/react`: envoltorios finos que generan el mismo marcado que la documentación, sin estado propio salvo el imprescindible.
  - Un módulo sin `'use client'` no importa uno con `'use client'` (lo comprueba `boundaries.test.ts`).
  - Nada de `cloneElement`: un elemento que llega desde un Server Component puede ser una referencia diferida. Los disparadores son objetos de props.
  - El estado que gestiona el DOM nativo (`<angela-tabs>`, `<dialog>`) se pinta solo al principio; los cambios van por la API del elemento.
  - `autoFocus` necesita el atributo real (`autofocusRef`): React lo omite en el cliente.
- El sitio de documentación tiene su propio tema, «plano» (`data-angela-theme="plano"` en `<html>`, definido en `docs/src/styles/docs.css`). La librería sigue con sus valores por defecto: los ejemplos de componentes y el playground de la guía llevan `data-angela-theme="angela"` para mostrarla tal como la recibe quien la instala. Si cambias las entradas del tema, verifica: `pnpm --filter @angela-ui/angela check:contrast --brand 78 0.11 --neutral 262 0.06 --info 215 0.12 --warning 50 0.14 --danger 18 0.18`.
- Imágenes en ejemplos y pruebas: las de `/img/…` (página «Imágenes»), no servicios externos como placehold.co. Solo se añaden fotos CC0 o equivalente, con su entrada en `docs/src/data/imagenes.js` (autor, origen, licencia y texto alternativo que describa lo que se ve): se redistribuyen desde la web.
- Iconos de `@angela-ui/icons`: se diseñan en el editor (`/iconos/editor`) dentro de la zona segura 2–22 de 24×24, con trazo libre (tipo `trazo`, puntos `[x, y, presión]` del lápiz de una tableta) o formas limpias (línea, rectángulo, círculo, elipse) para lo geométrico. La fuente es el JSON y el SVG lo genera `mano-alzada.js`: grosor 0.75→1.25 con puntas finas; la presión real se normaliza por icono y, sin lápiz, se usa la curva de la guía (semilla = nombre). El estilo es global: no se retoca a mano un SVG generado. El build no publica un icono que incumpla `reglas.js`. Nombre en inglés y kebab-case; etiquetas en español e inglés. Cada icono, su propio PR. Sin iconos copiados de otras librerías.
- Los iconos de la interfaz del sitio (`icon()` de `docs/src/data/icons.js`) son de Lucide, con su licencia en `docs/src/data/LICENSE-LUCIDE`; no forman parte de `@angela-ui/icons`.
- «Pruébalo» sale de `docs/src/lib/playground/definiciones.js`: cada componente declara sus controles (props con los nombres de `@angela-ui/react`, slots y eventos) y su marcado como árbol neutro (`docs/src/lib/componentes/ir.js`). De ahí salen la vista previa (`render.js`) y el componente reutilizable de cada framework en TypeScript o JavaScript, con su ejemplo de uso (`emisores.js`). `emisores.test.js` renderiza React, Vue y JS sin framework y los compara con la vista previa en todas las combinaciones de props; Angular y Astro pasan por sus compiladores. Un componente sin definición no tiene «Pruébalo».
- La sección «Compatibilidad» de cada componente se calcula al construir el sitio. Si un componente usa una característica nueva que no está en `CARACTERISTICAS` (`docs/src/lib/compatibilidad.js`), añádela con su id de web-features y su papel: `base` (sin ella no funciona), `mejora` (sin ella se ve lo nativo; con su nota) o `polyfill` (lo completa `angela()`).
- Los ejemplos se escriben solo en HTML: el código de Astro, React, Next.js, Vue y Angular de cada pestaña lo genera `codigo-frameworks.js` (su test compila el JSX de todos los ejemplos). Si un ejemplo nuevo usa un atributo o elemento que React no tipa, decláralo en `packages/angela/src/jsx.d.ts`.
- Cada componente se documenta en `docs/src/data/componentes/<slug>.js` (ejemplos + API + accesibilidad) y, si encaja, tiene su envoltorio en `@angela-ui/react`. El laboratorio crea la página de un componente nuevo y pone al día la de uno existente: los ejemplos por título (`<!-- Título -->` en la pestaña HTML), la API con lo que el CSS añade o quita (lo nuevo queda «Pendiente de describir») y las notas del diálogo. Cuando cambies un componente a mano, cambia también su página.
- Antes de terminar: `pnpm test`, `pnpm check:contrast` y revisión con teclado y lector de pantalla.

## Soporte de navegadores

**Baseline “ampliamente disponible”.** Lo más nuevo se usa como mejora progresiva cuyo fallback es el control o comportamiento nativo (sin polyfills pesados):
invokers y popover → polyfill condicional (`loadPolyfills`); anchor positioning → hoja inferior (`@supports`); focusgroup → teclado en `<angela-tabs>`; `closedby` → `enhanceDialogs`; `accent-color`, `field-sizing`, `interpolate-size`, animaciones de salida → sin fallback (se ve el nativo / transición instantánea).

## Revisión de PR

`.github/workflows/revision.yml` revisa cada PR a `main`: tests, tipos, contraste, build y, por cada componente que crea o edita, las reglas del laboratorio (`docs/src/lib/lab/review.js`) más las de este archivo que se comprueban con código (`@import` en `angela.css`, documentación con ejemplos/API/accesibilidad, JS registrado en `index.js` y con test). Solo cuenta lo que introduce el PR. Errores → el check falla; si no, queda la revisión visual en la preview. `revision-comentario.yml` publica el resultado en un comentario. Ninguno aprueba, mezcla ni despliega. La lógica está en `docs/scripts/revision/` (con tests); para probarla en local: `node docs/scripts/revision/cli.mjs --base main`.

Una regla nueva que se pueda comprobar con código va en `review.js` (la ven el laboratorio y el CI) o, si es del PR en conjunto, en `docs/scripts/revision/revision.js`.

## Publicar en npm

Los paquetes son `@angela-ui/angela` y `@angela-ui/react` (organización `angela-ui`, con 2FA obligatorio). Se publican desde GitHub Actions con Trusted Publishing (`.github/workflows/publicar.yml`): sin tokens y con procedencia verificada.

1. Sube la versión en **los dos** `package.json` (la misma), por PR. Si cambia la mayor o la menor, cambia también la de los ejemplos de CDN del README de `angela` (`@0.2`); el sitio la lee del `package.json`. Corrección: `0.1.1 → 0.1.2`; algo nuevo: `0.2.0`; prueba: `0.2.0-beta.1` (sale con la etiqueta `next`).
2. Al mezclar, crea un release en GitHub con la etiqueta `v` + versión (`v0.1.2`).
3. El workflow comprueba que la etiqueta coincide con las versiones, pasa tests, contraste y build, y publica primero `@angela-ui/angela` y luego `@angela-ui/react`. Si una versión ya existe, la salta: relanzarlo es seguro.

Se empaqueta con pnpm (convierte `workspace:^` en la versión real) y se publica con npm (OIDC). El entorno `npm` de GitHub solo admite etiquetas `v*`. La configuración de cada paquete en npm debe coincidir con el workflow: `npm trust list @angela-ui/angela`.

## Git

Ramas `feat/…`, `fix/…`, `chore/…` → PR. Commits en español con Conventional Commits. No commitear ni hacer push sin permiso.
