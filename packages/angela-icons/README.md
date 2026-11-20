# @angela-ui/icons

Iconos de [angela](https://angela.cognilab.dev/iconos) **a mano alzada**: cada uno se dibuja con formas limpias sobre una cuadrícula de 24×24 y el estilo los convierte en trazos de presión variable (finos al empezar y al terminar, más gruesos en medio). Son siluetas rellenas en `currentColor`. Todos siguen la misma guía, que el paquete comprueba al generarse.

```sh
pnpm add @angela-ui/icons
```

```js
// Uno a uno: el empaquetador solo incluye los que usas.
import { iconoHouse } from '@angela-ui/icons';

// Por nombre, en tiempo de ejecución.
import { icono } from '@angela-ui/icons/todos';
icono('house');                        // decorativo (aria-hidden)
icono('house', { titulo: 'Inicio' });  // role="img" con su nombre
icono('house', { tamano: null });      // sin width/height: lo pone el CSS
```

También: `@angela-ui/icons/sprite.svg` (`<use href="sprite.svg#icono-…">`), `@angela-ui/icons/svg/<nombre>.svg`, `@angela-ui/icons/iconos.json` (categoría, etiquetas, autor y licencia), `@angela-ui/icons/fuente/<nombre>.json` (las formas de cada icono), `@angela-ui/icons/reglas` (la guía en código) y `@angela-ui/icons/mano-alzada` (el estilo, para generar el SVG de unas formas).

## Aportar un icono

Diséñalo en el editor: https://angela.cognilab.dev/iconos/editor. Comprueba la guía mientras dibujas y abre el pull request desde allí; cada icono va en el suyo. La fuente es `iconos/<nombre>.json`; el SVG lo genera el build.

## Licencia

MIT.
