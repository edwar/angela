import { defineConfig } from 'astro/config';

export default defineConfig({
  trailingSlash: 'ignore',
  // «Selección» se dividió en Casilla, Radio e Interruptor: los enlaces viejos siguen funcionando.
  redirects: {
    '/componentes/seleccion': '/componentes/casilla',
  },
});
