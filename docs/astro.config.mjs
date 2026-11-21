import { defineConfig } from 'astro/config';

export default defineConfig({
  trailingSlash: 'ignore',
  // «Selección» se dividió en Casilla, Radio e Interruptor: los enlaces viejos siguen funcionando.
  redirects: {
    '/componentes/seleccion': '/componentes/casilla',
    // «Avisos, etiquetas y progreso» se dividió en Aviso, Etiqueta y Progreso.
    '/componentes/avisos': '/componentes/aviso',
  },
});
