import { defineConfig } from 'astro/config';

export default defineConfig({
  trailingSlash: 'ignore',
  // «Selección» se dividió en Casilla, Radio e Interruptor: los enlaces viejos siguen funcionando.
  redirects: {
    '/componentes/seleccion': '/componentes/casilla',
    // «Avisos, etiquetas y progreso» se dividió en Aviso, Etiqueta y Progreso.
    '/componentes/avisos': '/componentes/aviso',
    // «Rejilla de tarjetas» (cards) pasa a «Rejilla»; el ejemplo de productos, al bloque «Catálogo».
    '/componentes/cards': '/componentes/rejilla',
    // Nombres en español (el CSS y las clases no cambian).
    '/componentes/campos': '/componentes/campo-de-texto',
    '/componentes/carousel': '/componentes/carrusel',
    '/componentes/select-personalizable': '/componentes/selector',
    '/componentes/spotlight': '/componentes/foco-de-luz',
    '/componentes/card-3d': '/componentes/tarjeta-3d',
    '/componentes/flip-card': '/componentes/tarjeta-giratoria',
  },
});
