/**
 * Etiqueta
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "etiqueta",
  title: "Etiqueta",
  summary: "Texto corto de estado o categoría, con tono, variante y punto opcional.",
  examples: [
    {
      title: "Etiquetas",
      note: "Soft por defecto; solid para destacar una (con moderación) y outline para metadatos discretos.",
      code: `<div class="stack" style="--stack-gap: var(--space-3)">
  <div class="cluster">
    <span class="badge">Borrador</span>
    <span class="badge" data-tone="success" data-dot>Activo</span>
    <span class="badge" data-tone="warning" data-dot>Pendiente</span>
    <span class="badge" data-tone="danger" data-dot>Vencido</span>
    <span class="badge" data-tone="info">Nuevo</span>
  </div>
  <div class="cluster">
    <span class="badge" data-variant="solid" data-tone="brand">Pro</span>
    <span class="badge" data-variant="outline" data-tone="neutral">v0.1</span>
  </div>
</div>`,
    },
  ],
  api: [
    [".badge", "Etiqueta. data-tone (neutral por defecto)."],
    ["data-variant=\"solid|soft|outline\"", "Relleno fuerte, suave (por defecto) o solo borde."],
    ["data-dot", "Añade un punto de estado delante del texto."],
  ],
  a11y: [
    "Las etiquetas son texto: el lector las lee tal cual, sin rol especial.",
    "El estado lo dice el texto («Vencido»), no el color ni el punto.",
    "No son botones: si se pueden pulsar o quitar, usa un <button> con su nombre.",
  ],
};
