# Guía de diseño de angela

Fuente de verdad del sistema visual. La versión web es la Guía de diseño (`docs/src/pages/guia.astro`); para probar una paleta, el Taller de temas (`/temas`).

## Principios

1. **La plataforma primero.** Si existe un elemento o API nativa (`<dialog>`, `popover`, `<details>`, validación de formularios, `focusgroup`), se usa. El CSS lo viste; el JS solo completa lo que falta.
2. **Accesibilidad no negociable.** WCAG 2.2 AA es el mínimo.
3. **El color comunica, no decora.** Solo indica intención o estado, y nunca va solo: siempre con texto, ícono o forma.
4. **Menos es más.** Una acción primaria por vista. Radios moderados. Sombras solo para lo que flota. Nada de cajas dentro de cajas.
5. **Móvil primero.** Sin scroll horizontal en la página. Objetivos táctiles de 44 px en pantallas táctiles.

## Color

La paleta se calcula en OKLCH a partir de **tono (`h`, 0–360) y croma (`c`, 0–0.2)** por rol. Cada token tiene una luminosidad fija en claro y otra en oscuro, así el contraste no depende del tono.

| Entrada | Defecto | Para qué |
| --- | --- | --- |
| `--angela-brand-h` / `-c` | 262 / 0.17 | Marca: acción primaria, enlaces, foco |
| `--angela-neutral-c` | 0.012 | Tinte de grises (el tono sigue al de marca) |
| `--angela-success-h` / `-c` | 150 / 0.14 | Éxito |
| `--angela-warning-h` / `-c` | 65 / 0.14 | Aviso |
| `--angela-danger-h` / `-c` | 25 / 0.18 | Peligro, errores, eliminar |
| `--angela-info-h` / `-c` | 235 / 0.12 | Información |

**Superficies y texto:** `--color-canvas`, `--color-surface`, `--color-surface-sunken`, `--color-surface-hover`, `--color-text`, `--color-text-muted`, `--color-border` (decorativo), `--color-border-strong` (controles, ≥ 3:1), `--color-focus`.

**Por rol** (`brand`, `neutral`, `success`, `warning`, `danger`, `info`): `solid`, `solid-hover`, `on-solid`, `subtle`, `subtle-hover`, `border`, `text`. Ej.: `--color-danger-text`.

Reglas:

- `solid` + `on-solid` = acción principal (una por vista). `subtle` + `text` = fondos teñidos.
- Los componentes leen `--tone-*`; `data-tone="…"` elige el rol.
- Nunca colores sueltos (`#hex`, `text-green-600`): siempre tokens.
- Contraste garantizado para cualquier tono y croma ≤ 0.2: texto ≥ 4.5:1, bordes de controles, foco e indicadores ≥ 3:1. `pnpm check:contrast` lo verifica.
- La receta vive en `packages/angela/src/palette.js`. `palette.css` se **genera** (`pnpm --filter @angela-ui/angela build:palette`): no se edita a mano.
- Tematizar una zona: `data-angela-theme` en el contenedor y redefinir allí las `--angela-*`. Fijar esquema en una zona: `data-scheme="dark|light"`.

## Modo claro/oscuro

- `<meta name="color-scheme" content="light dark">` + `color-scheme: light dark` en `:root`. Los colores usan `light-dark()`.
- El selector de tema (opcional) cambia el `<meta>` y guarda en `localStorage` la clave `color-scheme`. Dos estados: sistema ↔ su opuesto. Volver a coincidir con el sistema borra la preferencia.
- Script en línea en el `<head>` para evitar el destello (exportado como `themeInlineScript`).

## Tipografía

- `--font-body` (sistema) y `--font-code` (monoespaciada del sistema).
- Tamaños: `--fs-xs` 12 · `--fs-sm` 14 · `--fs-md` 16 · `--fs-lg` 18 · `--fs-xl` 20 · `--fs-2xl` 24 · `--fs-3xl` 28–36 fluido · `--fs-4xl` 34–48 fluido.
- Interlineado: `--lh-tight` 1.2 (títulos), `--lh-snug` 1.35 (controles), `--lh-normal` 1.55 (lectura). Medida `--measure` 68ch.
- Pesos: `--fw-regular` 400, `--fw-medium` 550, `--fw-bold` 680.
- Controles con fuente ≥ 16 px (evita el zoom de iOS).

## Espaciado, forma y elevación

- Espacio en múltiplos de 4 px: `--space-1` (4) … `--space-16` (64). Etiqueta–control siempre más cerca que grupo–grupo.
- Radios: `--radius-lg` (8 px) contenedores; `--radius-md` (6 px) controles; `--radius-sm` (4 px) etiquetas. `--radius-full` solo avatares, puntos de estado e interruptores.
- Controles: `--control-h-sm/md/lg` = 32/40/48 px (36/44/52 en táctil).
- Sombras `--elevation-1/2/3` solo para lo que flota, siempre con borde (las sombras desaparecen en alto contraste).

## Movimiento

- `--duration-fast` 120 ms (estados), `--duration-normal` 200 ms (entrar/salir), `--ease-standard`.
- Solo opacidad, desplazamientos pequeños y tamaño. Desplazamientos y escalas dentro de `prefers-reduced-motion: no-preference`.
- Nunca retrasar el foco ni la interacción por teclado.

## Accesibilidad (checklist por componente)

- [ ] Elemento nativo correcto (o patrón WAI-ARIA completo si no existe).
- [ ] Nombre accesible que incluye el texto visible. Botones solo-ícono con `aria-label`.
- [ ] `:focus-visible` con anillo de 2 px y contraste ≥ 3:1.
- [ ] Operable con teclado. Sin `tabindex` positivo.
- [ ] Estado nunca solo con color.
- [ ] Objetivo ≥ 24 px (usamos 40/44 px).
- [ ] `forced-colors`, `prefers-reduced-motion`, `prefers-contrast: more`.
- [ ] Propiedades lógicas (RTL).
- [ ] Sin scroll horizontal a 320 px de ancho; zoom al 200 %.
- [ ] Eliminar siempre pide confirmación en un diálogo, con el foco en Cancelar.

## Convenciones de UI

- Formularios en modal (patrón CTA): botón arriba a la derecha → `<dialog class="dialog">` con cabecera (título + cerrar), cuerpo con scroll y pie (Cancelar `data-variant="ghost"` + acción primaria).
- Acciones de tabla siempre visibles (nada de aparecer al pasar el ratón).
- Tabla dentro de tarjeta: `.card[data-flush]`.
