/**
 * Tabla
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "tabla",
  title: "Tabla",
  summary: "Tablas nativas legibles, con scroll horizontal propio en móvil.",
  examples: [
    {
      title: "Tabla con acciones",
      note: "El contenedor con scroll es una región enfocable con nombre, así se puede desplazar con el teclado. Las acciones de fila siempre están visibles y cada una tiene un nombre único.",
      code: `<div class="table-wrap" role="region" aria-labelledby="tb-cap" tabindex="0">
  <table class="table">
    <caption id="tb-cap">Pedidos recientes</caption>
    <thead>
      <tr>
        <th scope="col">Pedido</th>
        <th scope="col">Cliente</th>
        <th scope="col">Estado</th>
        <th scope="col" data-numeric>Total</th>
        <th scope="col"><span class="visually-hidden">Acciones</span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">#1024</th>
        <td>Ana Torres</td>
        <td><span class="badge" data-tone="success" data-dot>Pagado</span></td>
        <td data-numeric>128,40 €</td>
        <td class="table-actions">
          <button class="button" type="button" data-variant="ghost" data-tone="neutral" data-size="sm" data-icon-only aria-label="Editar pedido #1024"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/></svg></button>
          <button class="button" type="button" data-variant="ghost" data-tone="danger" data-size="sm" data-icon-only aria-label="Eliminar pedido #1024" commandfor="tb-borrar" command="show-modal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
        </td>
      </tr>
      <tr>
        <th scope="row">#1023</th>
        <td>Luis Pérez</td>
        <td><span class="badge" data-tone="warning" data-dot>Pendiente</span></td>
        <td data-numeric>59,00 €</td>
        <td class="table-actions">
          <button class="button" type="button" data-variant="ghost" data-tone="neutral" data-size="sm" data-icon-only aria-label="Editar pedido #1023"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/></svg></button>
          <button class="button" type="button" data-variant="ghost" data-tone="danger" data-size="sm" data-icon-only aria-label="Eliminar pedido #1023" commandfor="tb-borrar" command="show-modal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<dialog class="dialog" id="tb-borrar" data-size="sm" aria-labelledby="tb-borrar-titulo">
  <div class="dialog-body"><h2 id="tb-borrar-titulo" style="font-size: var(--fs-lg); margin: 0">¿Eliminar el pedido?</h2></div>
  <form class="dialog-footer" method="dialog">
    <button class="button" value="cancelar" data-variant="ghost" data-tone="neutral" autofocus>Cancelar</button>
    <button class="button" value="eliminar" data-tone="danger">Eliminar</button>
  </form>
</dialog>`,
    },
  ],
  api: [
    [".table-wrap", "Contenedor con scroll horizontal. Dale role=\"region\", nombre y tabindex=\"0\"."],
    [".table", "Tabla nativa con <caption>, <thead> y <th scope>."],
    ["data-numeric", "En th/td: alinea al final con cifras tabulares."],
    [".table-actions", "Celda de acciones, ajustada a su contenido."],
  ],
  a11y: [
    "Usa <caption> como título de la tabla y scope=\"col\" / scope=\"row\" en los encabezados.",
    "Nunca uses tablas para maquetar.",
    "La página nunca se desplaza en horizontal: solo el contenedor de la tabla.",
    "Las acciones de fila están siempre visibles (nada de aparecer al pasar el ratón) y piden confirmación al eliminar.",
  ],
};
