/**
 * Tarjeta
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "tarjeta",
  title: "Tarjeta",
  summary: "Contenedor de contenido con borde, sin cajas dentro de cajas.",
  examples: [
    {
      title: "Tarjeta",
      code: `<article class="card" style="max-inline-size: 24rem">
  <div class="card-header">
    <h4>Plan Pro</h4>
    <span class="badge" data-tone="success" data-dot>Activo</span>
  </div>
  <p class="muted">Renueva el 1 de diciembre de 2026.</p>
  <a class="button" data-variant="soft" href="#">Gestionar plan</a>
</article>`,
    },
    {
      title: "Tarjeta con tabla",
      note: "data-flush quita el relleno de la tarjeta para que la tabla llegue al borde: una sola caja, no dos.",
      code: `<section class="card" data-flush aria-labelledby="tc-titulo">
  <div class="card-header">
    <h4 id="tc-titulo">Últimos pagos</h4>
    <a class="button" data-variant="ghost" data-size="sm" href="#">Ver todos</a>
  </div>
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th scope="col">Fecha</th><th scope="col" data-numeric>Importe</th></tr></thead>
      <tbody>
        <tr><td>18/11/2026</td><td data-numeric>128,40 €</td></tr>
        <tr><td>02/11/2026</td><td data-numeric>59,00 €</td></tr>
      </tbody>
    </table>
  </div>
</section>`,
    },
  ],
  api: [
    [".card", "Contenedor con borde y radio moderado."],
    ["data-flush", "Sin relleno, para tablas o medios a sangre."],
    ["data-elevated", "Añade sombra (úsala con moderación)."],
    [".card-header", "Título y acciones de la tarjeta."],
  ],
  a11y: [
    "Usa el elemento que corresponda al contenido: <article> si es independiente, <section> con encabezado si es una parte de la página.",
    "Evita hacer toda la tarjeta clicable; pon un enlace o botón claro dentro.",
  ],
};
