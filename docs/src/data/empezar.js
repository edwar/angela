/**
 * «Empezar» por framework: qué va en cada archivo según el proyecto.
 *
 * El script del <head> sale de la propia librería (themeInlineScript), así que nunca se
 * desincroniza. Los nombres de los paquetes están en una sola constante: si cambian, se
 * cambian aquí y en ningún sitio más. («angela» a secas, en npm, es otro paquete.)
 */
import { themeInlineScript } from '@angela-ui/angela/js/theme';
import { VERSION, VERSION_MENOR } from './version.js';

/** Nombre del paquete de estilos y JS. */
export const PKG = '@angela-ui/angela';
/** Nombre del paquete de React. */
export const PKG_REACT = '@angela-ui/react';
/** El paquete en jsDelivr, con la versión mayor.menor que documenta el sitio. */
const CDN = `https://cdn.jsdelivr.net/npm/${PKG}@${VERSION_MENOR}`;

const color = `:root {
  --angela-brand-h: 160;   /* tono de marca, 0–360 */
  --angela-brand-c: 0.15;  /* croma, 0–0.2 */
}`;

const tailwind = (extra = '') => `@import "tailwindcss";
@import "${PKG}/css";
@import "${PKG}/tailwind.css";${extra}`;

/** El <head> de un index.html: el esquema y el script que aplica el tema guardado antes de pintar. */
const headHtml = `<meta name="color-scheme" content="light dark">
<script>${themeInlineScript}</script>`;

/**
 * @typedef {{ titulo: string, texto?: string, archivo: string, lenguaje: string, codigo: string,
 *   tailwind?: { archivo: string, codigo: string, texto: string } }} Paso
 * @typedef {{ id: string, ejemplos: string, nombre: string, resumen: string, pasos: Paso[] }} Framework
 * `ejemplos`: la pestaña de los ejemplos de componentes que se elige con este framework.
 */

/** @type {Framework[]} */
export const frameworks = [
  {
    id: 'astro',
    ejemplos: 'astro',
    nombre: 'Astro',
    resumen: 'Todo va en el layout: el CSS, el tema y el JS, una sola vez para todas las páginas.',
    pasos: [
      { titulo: 'Instala', archivo: 'Terminal', lenguaje: 'sh', codigo: `pnpm add ${PKG}` },
      {
        titulo: 'Estilos, tema y JS en el layout',
        texto: 'El script del <head> aplica el tema guardado antes de pintar, así no hay destello. El JS es opcional: validación accesible, pestañas, diálogos y tema.',
        archivo: 'src/layouts/Layout.astro',
        lenguaje: 'astro',
        codigo: `---
import '${PKG}/css';
import '../styles/global.css';
import { themeInlineScript } from '${PKG}/js/theme';
---

<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="light dark" />
    <script is:inline set:html={themeInlineScript} />
  </head>
  <body>
    <slot />
    <script>
      import { angela } from '${PKG}/js';
      angela();
    </script>
  </body>
</html>`,
        tailwind: {
          texto: 'Con Tailwind v4, importa angela desde tu CSS global y quita el import del layout.',
          archivo: 'src/styles/global.css',
          codigo: tailwind(),
        },
      },
      {
        titulo: 'Usa HTML con clases',
        archivo: 'src/pages/index.astro',
        lenguaje: 'astro',
        codigo: `---
import Layout from '../layouts/Layout.astro';
---

<Layout>
  <button class="button" type="button">Guardar</button>
</Layout>`,
      },
      { titulo: 'Ponle tu color', archivo: 'src/styles/global.css', lenguaje: 'css', codigo: color },
    ],
  },
  {
    id: 'next',
    ejemplos: 'next',
    nombre: 'Next.js',
    resumen: 'App Router: el layout raíz carga el CSS, el tema y el JS; las páginas usan los componentes de React.',
    pasos: [
      { titulo: 'Instala', archivo: 'Terminal', lenguaje: 'sh', codigo: `pnpm add ${PKG} ${PKG_REACT}` },
      {
        titulo: 'Estilos, tema y JS en el layout raíz',
        texto: '<ThemeScript /> pone el esquema de color y aplica el tema guardado antes de hidratar. <Angela /> activa el JS en el cliente: escucha en el documento, así cubre también lo que se monte al navegar.',
        archivo: 'app/layout.tsx',
        lenguaje: 'tsx',
        codigo: `import '${PKG}/css';
import './globals.css';
import { Angela, ThemeScript } from '${PKG_REACT}';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <ThemeScript />
      </head>
      <body>
        {children}
        <Angela />
      </body>
    </html>
  );
}`,
        tailwind: {
          texto: 'Con Tailwind v4, importa angela desde globals.css y quita el import de angela del layout.',
          archivo: 'app/globals.css',
          codigo: tailwind(),
        },
      },
      {
        titulo: 'Usa los componentes',
        texto: 'Funcionan en Server Components. Los tipos de JSX (commandfor, command…) vienen incluidos con el paquete de React.',
        archivo: 'app/page.tsx',
        lenguaje: 'tsx',
        codigo: `import { Button } from '${PKG_REACT}';

export default function Page() {
  return <Button>Guardar</Button>;
}`,
      },
      { titulo: 'Ponle tu color', archivo: 'app/globals.css', lenguaje: 'css', codigo: color },
    ],
  },
  {
    id: 'react',
    ejemplos: 'react',
    nombre: 'React + Vite',
    resumen: 'Una SPA: el tema va en el index.html (React no lo ejecuta antes de pintar) y el resto en main.tsx.',
    pasos: [
      { titulo: 'Instala', archivo: 'Terminal', lenguaje: 'sh', codigo: `pnpm add ${PKG} ${PKG_REACT}` },
      {
        titulo: 'El tema, en el <head>',
        texto: 'Sin servidor, React no puede poner el script antes de pintar: va directamente en el HTML.',
        archivo: 'index.html',
        lenguaje: 'html',
        codigo: `<head>
  <meta charset="UTF-8" />
  ${headHtml.replace('\n', '\n  ')}
</head>`,
      },
      {
        titulo: 'Estilos y JS al arrancar',
        archivo: 'src/main.tsx',
        lenguaje: 'tsx',
        codigo: `import '${PKG}/css';
import './index.css';
import { angela } from '${PKG}/js';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
angela();`,
        tailwind: {
          texto: 'Con Tailwind v4, importa angela desde index.css y quita el import de angela de main.tsx.',
          archivo: 'src/index.css',
          codigo: tailwind(),
        },
      },
      {
        titulo: 'Usa los componentes',
        archivo: 'src/App.tsx',
        lenguaje: 'tsx',
        codigo: `import { Button } from '${PKG_REACT}';

export default function App() {
  return <Button>Guardar</Button>;
}`,
      },
      { titulo: 'Ponle tu color', archivo: 'src/index.css', lenguaje: 'css', codigo: color },
    ],
  },
  {
    id: 'vue',
    ejemplos: 'vue',
    nombre: 'Vue + Vite',
    resumen: 'El tema va en el index.html; los estilos y el JS, en main.ts. En las plantillas usas HTML con clases.',
    pasos: [
      { titulo: 'Instala', archivo: 'Terminal', lenguaje: 'sh', codigo: `pnpm add ${PKG}` },
      {
        titulo: 'El tema, en el <head>',
        archivo: 'index.html',
        lenguaje: 'html',
        codigo: `<head>
  <meta charset="UTF-8" />
  ${headHtml.replace('\n', '\n  ')}
</head>`,
      },
      {
        titulo: 'Estilos y JS al arrancar',
        archivo: 'src/main.ts',
        lenguaje: 'ts',
        codigo: `import '${PKG}/css';
import './style.css';
import { angela } from '${PKG}/js';
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
angela();`,
        tailwind: {
          texto: 'Con Tailwind v4, importa angela desde style.css y quita el import de angela de main.ts.',
          archivo: 'src/style.css',
          codigo: tailwind(),
        },
      },
      {
        titulo: 'Usa HTML con clases',
        archivo: 'src/App.vue',
        lenguaje: 'vue',
        codigo: `<template>
  <button class="button" type="button">Guardar</button>
</template>`,
      },
      { titulo: 'Ponle tu color', archivo: 'src/style.css', lenguaje: 'css', codigo: color },
    ],
  },
  {
    id: 'angular',
    ejemplos: 'angular',
    nombre: 'Angular',
    resumen: 'Los estilos en angular.json, el tema en el index.html y el JS al arrancar en main.ts. En las plantillas usas HTML con clases.',
    pasos: [
      { titulo: 'Instala', archivo: 'Terminal', lenguaje: 'sh', codigo: `pnpm add ${PKG}` },
      {
        titulo: 'Los estilos, en angular.json',
        texto: 'En projects → tu app → architect → build → options. angela va antes que tus estilos para que los tuyos ganen.',
        archivo: 'angular.json',
        lenguaje: 'json',
        codigo: `"styles": [
  "node_modules/${PKG}/dist/angela.css",
  "src/styles.css"
]`,
      },
      {
        titulo: 'El tema, en el <head>',
        archivo: 'src/index.html',
        lenguaje: 'html',
        codigo: `<head>
  <meta charset="utf-8" />
  ${headHtml.replace('\n', '\n  ')}
</head>`,
      },
      {
        titulo: 'El JS al arrancar',
        texto: 'Una vez, después de arrancar la app. Escucha en el documento, así cubre también lo que Angular monte después (rutas, @if, diálogos).',
        archivo: 'src/main.ts',
        lenguaje: 'ts',
        codigo: `import { bootstrapApplication } from '@angular/platform-browser';
import { angela } from '${PKG}/js';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .then(() => angela())
  .catch((err) => console.error(err));`,
      },
      {
        titulo: 'Usa HTML con clases',
        texto: 'Donde uses <angela-tabs>, añade schemas: [CUSTOM_ELEMENTS_SCHEMA]. Un atributo que cambia se enlaza con [attr.…], p. ej. [attr.commandfor]="id". En el texto de una plantilla, «@» se escribe &#64;.',
        archivo: 'src/app/app.ts',
        lenguaje: 'ts',
        codigo: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`<button class="button" type="button">Guardar</button>\`,
})
export class App {}`,
      },
      { titulo: 'Ponle tu color', archivo: 'src/styles.css', lenguaje: 'css', codigo: color },
    ],
  },
  {
    id: 'html',
    ejemplos: 'html',
    nombre: 'HTML + Vite',
    resumen: 'Sin framework: un index.html, un main.js y tu CSS.',
    pasos: [
      { titulo: 'Instala', archivo: 'Terminal', lenguaje: 'sh', codigo: `pnpm add ${PKG}` },
      {
        titulo: 'La página',
        texto: 'El tema va en el <head>; el JS se carga como módulo al final.',
        archivo: 'index.html',
        lenguaje: 'html',
        codigo: `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    ${headHtml.replace('\n', '\n    ')}
  </head>
  <body>
    <button class="button" type="button">Guardar</button>
    <script type="module" src="/main.js"></script>
  </body>
</html>`,
      },
      {
        titulo: 'Estilos y JS',
        archivo: 'main.js',
        lenguaje: 'js',
        codigo: `import '${PKG}/css';
import './style.css';
import { angela } from '${PKG}/js';

angela();`,
        tailwind: {
          texto: 'Con Tailwind v4, importa angela desde style.css y quita el import de angela de main.js.',
          archivo: 'style.css',
          codigo: tailwind(),
        },
      },
      { titulo: 'Ponle tu color', archivo: 'style.css', lenguaje: 'css', codigo: color },
    ],
  },
  {
    id: 'cdn',
    ejemplos: 'html',
    nombre: 'HTML sin instalar',
    resumen: 'Sin instalar nada ni bundler: el CSS y el JS se cargan desde jsDelivr. Para prototipos y webs estáticas.',
    pasos: [
      {
        titulo: 'La página',
        texto: `El CSS y el tema van en el <head>; el JS es un módulo. /+esm hace que jsDelivr resuelva los polyfills que angela carga solo en navegadores antiguos. @${VERSION_MENOR} recibe las correcciones; para fijar una versión exacta, usa la completa (@${VERSION}).`,
        archivo: 'index.html',
        lenguaje: 'html',
        codigo: `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${headHtml.replace('\n', '\n    ')}
    <link rel="stylesheet" href="${CDN}/dist/angela.min.css" />
    <link rel="stylesheet" href="style.css" />
    <script type="module">
      import { angela } from '${CDN}/src/js/index.js/+esm';
      angela();
    </script>
  </head>
  <body>
    <button class="button" type="button">Guardar</button>
  </body>
</html>`,
      },
      { titulo: 'Ponle tu color', archivo: 'style.css', lenguaje: 'css', codigo: color },
    ],
  },
];
