/**
 * Rejilla
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: 'rejilla',
  title: 'Rejilla',
  summary: 'Rejilla de tarjetas que acomoda las columnas sola y, con Tarjetas 3D, les da un punto de fuga compartido.',
  examples: [
    {
      title: 'Tarjetas en rejilla',
      note: 'Las columnas se acomodan solas según el ancho: no hay que elegir cuántas. Estrecha la ventana para verlo.',
      code: `<section class="cards">
  <article class="card stack" style="--stack-gap: var(--space-1)">
    <h3 class="heading" data-size="md">Ventas</h3>
    <p class="text" data-size="2xl" data-weight="bold" data-numeric>12.480 €</p>
  </article>
  <article class="card stack" style="--stack-gap: var(--space-1)">
    <h3 class="heading" data-size="md">Pedidos</h3>
    <p class="text" data-size="2xl" data-weight="bold" data-numeric>318</p>
  </article>
  <article class="card stack" style="--stack-gap: var(--space-1)">
    <h3 class="heading" data-size="md">Clientes nuevos</h3>
    <p class="text" data-size="2xl" data-weight="bold" data-numeric>42</p>
  </article>
</section>`,
    },
    {
      title: 'Columnas más estrechas',
      note: '--cards-min es el ancho mínimo de cada tarjeta antes de pasar a otra fila; --cards-gap, la separación.',
      code: `<section class="cards" style="--cards-min: 9rem; --cards-gap: var(--space-3)">
  <article class="card"><p class="text" data-weight="bold">Lunes</p></article>
  <article class="card"><p class="text" data-weight="bold">Martes</p></article>
  <article class="card"><p class="text" data-weight="bold">Miércoles</p></article>
  <article class="card"><p class="text" data-weight="bold">Jueves</p></article>
  <article class="card"><p class="text" data-weight="bold">Viernes</p></article>
</section>`,
    },
    {
      title: 'Con Tarjetas 3D',
      note: 'La rejilla pone el punto de fuga y las tarjetas dejan de poner el suyo: todas giran hacia el mismo sitio, como una sola escena. Míralo completo en el bloque «Catálogo de productos».',
      code: `<section class="cards" style="--cards-min: 12rem">
  <article class="card card-3d"><p class="heading" data-size="md">Una</p></article>
  <article class="card card-3d"><p class="heading" data-size="md">Dos</p></article>
  <article class="card card-3d"><p class="heading" data-size="md">Tres</p></article>
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
