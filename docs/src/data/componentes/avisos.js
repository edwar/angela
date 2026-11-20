/**
 * Avisos, etiquetas y progreso
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "avisos",
  title: "Avisos, etiquetas y progreso",
  summary: "Mensajes de estado, etiquetas y barras de progreso nativas.",
  examples: [
    {
      title: "Avisos",
      note: "Cada aviso tiene ícono y título además del color, así el estado no depende solo del color.",
      code: `<div class="stack" style="--stack-gap: var(--space-3)">
  <div class="callout" data-tone="info">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    <div><p class="callout-title">Novedad</p><p>Ya puedes exportar tus informes a PDF.</p></div>
  </div>
  <div class="callout" data-tone="success">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
    <div><p class="callout-title">Pago recibido</p><p>Hemos enviado el recibo a tu correo.</p></div>
  </div>
  <div class="callout" data-tone="warning">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
    <div><p class="callout-title">Atención</p><p>Tu plan vence en 3 días.</p></div>
  </div>
  <div class="callout" data-tone="danger">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
    <div><p class="callout-title">No se pudo guardar</p><p>Revisa tu conexión e inténtalo otra vez.</p></div>
  </div>
</div>`,
    },
    {
      title: "Etiquetas",
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
    {
      title: "Progreso y medidor",
      note: "<progress> para tareas en curso; <meter> para una medida dentro de un rango (p. ej. espacio usado).",
      code: `<div class="stack">
  <div class="field">
    <label for="pr-subida">Subiendo factura.pdf</label>
    <progress class="progress" id="pr-subida" max="100" value="64">64 %</progress>
  </div>
  <div class="field">
    <label for="pr-espacio">Espacio usado: 7,2 de 10 GB</label>
    <meter class="meter" id="pr-espacio" min="0" max="10" low="7" high="9" optimum="2" value="7.2">7,2 GB</meter>
  </div>
</div>`,
    },
  ],
  api: [
    [".callout", "Aviso con ícono y contenido. data-tone (info por defecto)."],
    [".callout-title", "Título del aviso."],
    [".badge", "Etiqueta. data-tone, data-variant=\"solid|soft|outline\", data-dot."],
    [".progress / .meter", "Para <progress> y <meter> nativos."],
  ],
  a11y: [
    "Un aviso que aparece tras una acción debe insertarse en una región role=\"status\" (o role=\"alert\" si es crítico) que ya exista en la página.",
    "No uses regiones vivas para estados intermedios como \"Cargando…\": usa <progress>.",
    "Las etiquetas son texto: el lector las lee tal cual, sin rol especial.",
  ],
};
