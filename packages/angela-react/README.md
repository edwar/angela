# angela-react

Componentes de React 19 sobre [angela](../angela): envoltorios finos de los elementos nativos (`<button>`, `<dialog>`, `popover`, `<details>`…), tipados y compatibles con Server Components.

No reimplementan nada: generan el mismo marcado que la documentación de angela y conectan ids, `aria-*` y comandos por ti.

## Instalación

```sh
pnpm add angela angela-react
```

## Puesta en marcha (Next.js App Router)

```tsx
// app/layout.tsx (Server Component)
import 'angela/css';
import { Angela, ThemeScript, ThemeToggle } from 'angela-react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <ThemeScript /> {/* <meta name="color-scheme"> + script sin destello */}
      </head>
      <body>
        <a className="skip-link" href="#main">Saltar al contenido</a>
        <header>… <ThemeToggle /></header>
        <main id="main">{children}</main>
        <Angela /> {/* validación accesible, pestañas, diálogos, popovers, tema y polyfills */}
      </body>
    </html>
  );
}
```

No uses también `viewport.colorScheme` de Next: `ThemeScript` ya pinta el `<meta name="color-scheme">`.

En una SPA sin SSR (Vite): importa `angela/css` en `main.tsx`, monta `<Angela />` una vez y copia `themeInlineScript` (de `angela/js/theme`) en el `<head>` del `index.html`.

## Componentes

| Componente | Notas |
|---|---|
| `Button` | `variant` (solid · soft · outline · ghost), `tone`, `size`, `iconOnly` (con `aria-label`), `block`. `type="button"` por defecto. |
| `ButtonLink`, `buttonProps()` | Enlace con aspecto de botón. `buttonProps()` sirve para otros componentes: `<Link {...buttonProps({ variant: 'ghost' })} href="/">`. |
| `Field` + `Input` / `Select` / `Textarea` | `label`, `hint`, `error`, `required`, `invalid` (error del servidor), `id`. Enlaza etiqueta, ayuda y error. |
| `Checkbox`, `Radio`, `Switch`, `Fieldset` | `label`, `hint`. `Switch` es un checkbox con `role="switch"`. |
| `Dialog`, `DialogClose` | `title`, `trigger`, `footer`, `size`, `form`, `closeOnSubmit`, `dismissible`, `open` + `onOpenChange`. |
| `ConfirmDialog` | `title`, `description`, `confirmLabel`, `onConfirm`, `tone` (danger). El foco empieza en Cancelar. |
| `Popover`, `PopoverItem` | `trigger`, `padding`. Los items cierran el panel (`closes={false}` para evitarlo). |
| `Tabs` | `items` (`value`, `label`, `content`), `label`, `defaultValue` o `value` + `onValueChange`. |
| `Disclosure`, `Accordion` | `<details>` con `summary`. |
| `Callout`, `Badge`, `Progress`, `Meter` | El aviso siempre lleva ícono además del color. |
| `Card`, `CardHeader`, `TableWrap`, `Table` | `Card`: `as`, `flush`, `elevated`. `TableWrap` con `aria-labelledby` se vuelve una región desplazable con el teclado. |
| `Heading`, `Text`, `Prose` | `Heading` exige `as` (el nivel) y elige el aspecto con `size`. Ambos: `weight`, `tone`, `muted`, `numeric`, `truncate`, `lines`, `align`. |
| `ThemeScript`, `ThemeToggle`, `Angela`, `useAngela` | Tema y capa JS. |

Sin estado (sirven tal cual en Server Components): `ButtonLink`, `buttonProps`, `Disclosure`, `Accordion`, `Callout`, `Badge`, `Progress`, `Meter`, `Card`, `CardHeader`, `TableWrap`, `Table`, `Heading`, `Text`, `Prose`, `ThemeScript`, `ThemeToggle`. El resto son componentes de cliente, y también se pueden usar desde un Server Component.

## Patrones

### Formulario en modal con una Server Action

```tsx
<Dialog
  title="Nuevo cliente"
  trigger={{ children: 'Nuevo cliente' }}
  form={{ action: crearCliente }}
  closeOnSubmit
  footer={<><DialogClose>Cancelar</DialogClose><Button type="submit">Guardar</Button></>}
>
  <Field label="Nombre" error="Escribe el nombre del cliente." required>
    <Input name="nombre" autoComplete="name" autoFocus />
  </Field>
</Dialog>
```

`closeOnSubmit` cierra el diálogo cuando la acción termina sin error. Si usas `useActionState` para mostrar errores del servidor dentro del diálogo, no lo actives y controla `open` tú.

### Confirmar una eliminación

```tsx
<ConfirmDialog
  title="¿Eliminar el proyecto?"
  description="Se borrarán sus 12 tareas. Esta acción no se puede deshacer."
  confirmLabel="Eliminar"
  onConfirm={eliminarProyecto}
  trigger={{ children: 'Eliminar proyecto', variant: 'outline', tone: 'danger' }}
/>
```

### Diálogo controlado

```tsx
const [open, setOpen] = useState(false);
<Button onClick={() => setOpen(true)}>Nuevo</Button>
<Dialog title="Nuevo" open={open} onOpenChange={setOpen}>…</Dialog>
```

`onOpenChange(false)` se llama al cerrar por cualquier vía: botón, Esc o clic fuera.

## Reglas

- **`trigger` es un objeto de props, no un elemento.** Un elemento que llega desde un Server Component puede ser una referencia diferida, y clonarlo rompe el prerender. Para un botón totalmente propio, da un `id` al diálogo y usa `commandfor="ese-id" command="show-modal"` en tu botón.
- **El `id` va en el `Field`**, no en el control (si lo pones en el control, avisa en desarrollo y usa el del `Field`).
- **Pestañas:** el estado inicial se pinta en el servidor y después lo gestiona `<angela-tabs>`. Con `value`, el cambio se aplica sobre el elemento, sin volver a pintar.
- **`autoFocus`** funciona dentro de diálogos: los componentes escriben el atributo real, que React omite en el cliente.

Los tipos de `angela/jsx` (`commandfor`, `command`, `switch`, `focusgroup`, `<angela-tabs>`) se cargan solos al importar `angela-react`.
