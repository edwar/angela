# angela

Componentes accesibles sobre **HTML nativo**, con modo claro/oscuro automático y una paleta que se adapta cambiando dos números.

- **Nativo:** `<button>`, `<dialog>`, `popover`, `<details>`, formularios con validación nativa. Sin wrappers ni Shadow DOM.
- **Accesible:** contraste WCAG AA verificado para cualquier tono, foco visible, teclado, alto contraste y movimiento reducido. Auditado con axe (0 violaciones en claro y oscuro).
- **Claro/oscuro:** `light-dark()` + `color-scheme`, con selector opcional y sin destellos.
- **Paleta adaptable:** OKLCH derivado de tono y croma por rol.
- **Para cualquier proyecto:** Astro, Next, Vue o HTML plano. Todo en `@layer`, así tu CSS siempre gana. Puente opcional con Tailwind v4.

## Uso rápido

```css
@import "angela/css";
```

```html
<meta name="color-scheme" content="light dark">
<button class="button" type="button">Guardar</button>
```

```css
:root {
  --angela-brand-h: 160;  /* tono */
  --angela-brand-c: 0.15; /* croma, 0–0.2 */
}
```

```js
import { angela } from 'angela/js'; // opcional
angela();
```

Más detalles en [`packages/angela/README.md`](packages/angela/README.md) (incluye cómo usarla en Astro, Vue, Angular y Svelte), la guía en [`DESIGN.md`](DESIGN.md) y la documentación interactiva con `pnpm dev`.

## React y Next.js

[`angela-react`](packages/angela-react/README.md): componentes de React 19 sobre los mismos elementos nativos, tipados y compatibles con Server Components.

```tsx
import { Dialog, Field, Input, Button, DialogClose } from 'angela-react';

<Dialog title="Nuevo cliente" trigger={{ children: 'Nuevo cliente' }} form={{ action: crearCliente }} closeOnSubmit
  footer={<><DialogClose>Cancelar</DialogClose><Button type="submit">Guardar</Button></>}>
  <Field label="Nombre" required><Input name="nombre" autoFocus /></Field>
</Dialog>
```

## Desarrollo

```sh
pnpm install
pnpm dev             # documentación en http://localhost:4321
pnpm test            # tests de angela y angela-react
pnpm typecheck       # tipos de angela/js y de angela-react
pnpm check:contrast  # contraste WCAG en todos los tonos
pnpm build           # librería + documentación
```
