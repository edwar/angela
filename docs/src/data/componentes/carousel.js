/**
 * Carousel
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "carousel",
  title: "Carousel",
  summary: "Fila de elementos que se desplaza en horizontal con scroll nativo y ajuste a cada elemento (scroll-snap), sin JS. En el móvil se asoma el siguiente para indicar que hay más; el ancho de cada elemento y la separación se cambian con --carousel-item y --carousel-gap.",
  examples: [
    {
      title: "Ejemplo",
      code: `<div class="carousel" role="region" aria-label="Productos destacados" tabindex="0">
  <article class="card">Producto 1</article>
  <article class="card">Producto 2</article>
  <article class="card">Producto 3</article>
  <article class="card">Producto 4</article>
</div>`,
    },
  ],
  api: [
    [".carousel", "Clase del componente."],
    ["--carousel-gap", "Parámetro."],
    ["--carousel-item", "Parámetro."],
  ],
  a11y: [
    "Pon role=\"region\" y un aria-label que describa el contenido (p. ej. «Productos destacados»): el lector de pantalla anuncia la zona por su nombre.",
    "Lleva tabindex=\"0\" para que se pueda enfocar y desplazar con las flechas del teclado; Safari no enfoca por sí solo las zonas con scroll.",
    "El foco se muestra con un anillo de 2 px del color de foco.",
    "Los elementos siguen en el orden del HTML: con Tab se recorren los enlaces y botones de cada tarjeta y el carrusel se desplaza hasta ellos.",
    "El desplazamiento suave solo se activa si la persona no ha pedido reducir el movimiento (prefers-reduced-motion).",
    "No pasa solo: no hay reproducción automática que haya que poder pausar (WCAG 2.2.2).",
  ],
};
