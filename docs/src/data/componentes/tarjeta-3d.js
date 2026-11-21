/**
 * Tarjeta 3D
 * Llegó desde el laboratorio. Edítalo con libertad: añade ejemplos, afina la tabla de API
 * y completa las notas de accesibilidad.
 */
export default {
  slug: 'tarjeta-3d',
  title: 'Tarjeta 3D',
  summary: 'Tarjeta que se inclina al pasar el ratón o al llegar con el teclado.',
  examples: [
    {
      title: 'Sola',
      note: 'Fuera de una rejilla pone su propia perspectiva, así que funciona en cualquier sitio. Si tu sistema pide menos movimiento, solo cambia la sombra.',
      code: `<article class="card card-3d stack" style="--stack-gap: var(--space-2); max-inline-size: 18rem">
  <h3 class="heading" data-size="lg">Laptop</h3>
  <p class="text" data-size="sm" data-muted>Potencia para crear.</p>
  <div class="cluster card-3d-actions">
    <button class="button" type="button" data-variant="soft">Comprar</button>
  </div>
</article>`,
    },
    {
      title: 'Dentro de una rejilla',
      note: 'Se usa junto con la rejilla .cards (Guía de diseño → Maquetación): el contenedor pone el punto de fuga y la tarjeta deja de poner el suyo, de modo que todas giran hacia el mismo sitio.',
      code: `<section class="cards" style="--cards-min: 12rem">
  <article class="card card-3d"><p class="heading" data-size="md">Una</p></article>
  <article class="card card-3d"><p class="heading" data-size="md">Dos</p></article>
  <article class="card card-3d"><p class="heading" data-size="md">Tres</p></article>
</section>`,
    },
  ],
  api: [
    ['.card-3d', 'Se combina con .card. Se inclina en :hover y cuando algo de dentro recibe el foco del teclado.'],
    ['.card-3d-actions', 'Empuja las acciones al fondo, para que queden alineadas entre tarjetas.'],
    ['--card-3d-perspective', 'Perspectiva propia. Dentro de .cards vale none, porque la pone el contenedor.'],
    ['--card-3d-x', 'Giro horizontal. Por defecto: 12deg.'],
    ['--card-3d-y', 'Giro vertical. Por defecto: 8deg.'],
    ['--card-3d-z', 'Cuánto se acerca al pasar el ratón. Por defecto: 20px.'],
  ],
  a11y: [
    'La inclinación va dentro de prefers-reduced-motion: no-preference. Con el movimiento reducido solo cambia la sombra, así que el realce se sigue notando.',
    'Responde a :has(:focus-visible), no a :focus-within: se eleva al llegar con el teclado, no al hacer clic.',
    'En modo de colores forzados las sombras desaparecen, por eso el realce pasa a ser un borde.',
    'El transform crea un contexto de posicionamiento: un diálogo o un popover anclado dentro de la tarjeta se colocaría respecto a ella. Sácalos fuera.',
  ],
};
