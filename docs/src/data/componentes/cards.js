/**
 * Rejilla de tarjetas
 * Llegó desde el laboratorio. Edítalo con libertad: añade ejemplos, afina la tabla de API
 * y completa las notas de accesibilidad.
 */
export default {
  slug: 'cards',
  title: 'Rejilla de tarjetas',
  summary: 'Rejilla que acomoda tarjetas solas y les da un punto de fuga compartido.',
  examples: [
    {
      title: 'Rejilla de productos',
      note: 'Las columnas se acomodan solas: no hay que elegir cuántas. Con tarjetas card-3d dentro, todas giran hacia el mismo punto.',
      code: `<section class="cards" style="--cards-min: 14rem">
  <article class="card card-3d stack" style="--stack-gap: var(--space-2)">
    <img src="https://placehold.co/400x240" alt="">
    <h3 class="heading" data-size="lg">Laptop</h3>
    <p class="text" data-size="sm" data-muted>Potencia para crear.</p>
    <p class="text" data-size="2xl" data-weight="bold" data-numeric>$2.800.000</p>
  </article>
  <article class="card card-3d stack" style="--stack-gap: var(--space-2)">
    <img src="https://placehold.co/400x240" alt="">
    <h3 class="heading" data-size="lg">Audífonos</h3>
    <p class="text" data-size="sm" data-muted>Sonido sin distracciones.</p>
    <p class="text" data-size="2xl" data-weight="bold" data-numeric>$2.499.000</p>
  </article>
  <article class="card card-3d stack" style="--stack-gap: var(--space-2)">
    <img src="https://placehold.co/400x240" alt="">
    <h3 class="heading" data-size="lg">Cámara</h3>
    <p class="text" data-size="sm" data-muted>Captura cada detalle.</p>
    <p class="text" data-size="2xl" data-weight="bold" data-numeric>$12.999.000</p>
  </article>
</section>`,
    },
  ],
  api: [
    ['.cards', 'Contenedor en rejilla. Las imágenes de dentro se recortan a 16/9.'],
    ['--cards-min', 'Ancho mínimo de cada tarjeta antes de pasar a otra fila. Por defecto: 16rem.'],
    ['--cards-gap', 'Separación entre tarjetas. Por defecto: var(--space-6).'],
    ['--cards-perspective', 'Distancia del punto de fuga compartido. Por defecto: 900px.'],
    ['--card-3d-perspective', 'Lo fija en none para que la tarjeta no ponga la suya: el contrato entre los dos.'],
  ],
  a11y: [
    'La rejilla no añade semántica: si es una sección de la página, usa <section> con su propio encabezado.',
    'Las columnas salen de minmax(min(100%, …)): a 320 px queda una sola, sin scroll horizontal.',
    'El orden visual coincide con el del marcado, así que el recorrido con teclado no se desordena.',
  ],
};
