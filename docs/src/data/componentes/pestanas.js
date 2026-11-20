/**
 * Pestañas
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "pestanas",
  title: "Pestañas",
  summary: "Pestañas accesibles con focusgroup nativo y un elemento personalizado mínimo.",
  examples: [
    {
      title: "Pestañas",
      note: "Usa las flechas para moverte (la selección sigue al foco), Inicio y Fin. Si no caben, la fila se desplaza con un desvanecido en los bordes. El contenido oculto se encuentra con Ctrl+F donde hay soporte.",
      code: `<angela-tabs class="tabs">
  <div class="tablist" role="tablist" focusgroup="tablist nomemory" aria-label="Detalles del pedido">
    <button type="button" role="tab" id="t-resumen" aria-selected="true" focusgroupstart>Resumen</button>
    <button type="button" role="tab" id="t-envio" aria-selected="false">Envío</button>
    <button type="button" role="tab" id="t-pagos" aria-selected="false">Pagos</button>
    <button type="button" role="tab" id="t-historial" aria-selected="false">Historial</button>
  </div>
  <div role="tabpanel" aria-labelledby="t-resumen" tabindex="0">
    <p>Pedido #1024 · 3 productos · Total 128,40 €.</p>
  </div>
  <div role="tabpanel" aria-labelledby="t-envio" hidden="until-found">
    <p>Envío estándar a Calle Mayor 12, Madrid. Llega el jueves.</p>
  </div>
  <div role="tabpanel" aria-labelledby="t-pagos" hidden="until-found">
    <p>Pagado con tarjeta terminada en 4242 el 18/11/2026.</p>
  </div>
  <div role="tabpanel" aria-labelledby="t-historial" hidden="until-found">
    <p>Creado el 17/11 · Pagado el 18/11 · Enviado el 18/11.</p>
  </div>
</angela-tabs>`,
    },
  ],
  api: [
    ["<angela-tabs>", "Contenedor. Emite el evento tabchange con { tab, panel }."],
    [".tablist[focusgroup=\"tablist nomemory\"]", "Fila de pestañas, con role=\"tablist\". Necesita aria-label o aria-labelledby."],
    ["role=\"tab\"", "En cada <button>. focusgroup ya infiere estos roles; escribirlos hace que validadores como axe los vean."],
    ["aria-selected", "En cada <button>: true en la seleccionada (renderízalo en el HTML inicial)."],
    ["role=\"tabpanel\"", "Paneles, con aria-labelledby apuntando a su pestaña y hidden=\"until-found\" si no están activos."],
  ],
  a11y: [
    "No uses pestañas para navegar entre páginas: para eso es un <nav> con enlaces.",
    "La pestaña seleccionada se indica con color y subrayado (no solo color), y el subrayado sobrevive al alto contraste.",
    "Una sola parada de Tab para toda la fila; las flechas mueven entre pestañas.",
    "Renderiza el estado inicial en el HTML para que no se vean todos los paneles antes de que cargue el JS.",
  ],
};
