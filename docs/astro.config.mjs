import { defineConfig } from 'astro/config';

export default defineConfig({
  trailingSlash: 'ignore',
  // «Selección» se dividió en Casilla, Radio e Interruptor: los enlaces viejos siguen funcionando.
  redirects: {
    '/componentes/seleccion': '/componentes/casilla',
    // «Avisos, etiquetas y progreso» se dividió en Aviso, Etiqueta y Progreso.
    '/componentes/avisos': '/componentes/aviso',
    // La rejilla (.cards) es una primitiva de maquetación, como .stack y .cluster: está en la guía.
    // El ejemplo de productos es el bloque «Catálogo de productos».
    '/componentes/cards': '/guia#maquetacion',
    '/componentes/rejilla': '/guia#maquetacion',
    // Nombres en español (el CSS y las clases no cambian).
    '/componentes/campos': '/componentes/campo-de-texto',
    '/componentes/carousel': '/componentes/carrusel',
    '/componentes/select-personalizable': '/componentes/selector',
    '/componentes/spotlight': '/componentes/foco-de-luz',
    '/componentes/card-3d': '/componentes/tarjeta-3d',
    '/componentes/flip-card': '/componentes/tarjeta-giratoria',
  },
});
