/**
 * Aviso
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "aviso",
  title: "Aviso",
  summary: "Mensajes destacados con ícono y título, teñidos con el tono de su estado.",
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
      title: "Sin título",
      note: "Para un mensaje corto basta el texto; el ícono sigue diciendo de qué tipo es.",
      code: `<div class="callout">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
  <div><p>Los cambios se guardan solos.</p></div>
</div>`,
    },
  ],
  api: [
    [".callout", "Aviso con ícono y contenido. data-tone=\"info|success|warning|danger|brand|neutral\" (info por defecto)."],
    [".callout-title", "Título del aviso."],
  ],
  a11y: [
    "Un aviso que aparece tras una acción debe insertarse en una región role=\"status\" (o role=\"alert\" si es crítico) que ya exista en la página.",
    "El ícono es decorativo (aria-hidden): el tipo de aviso lo dicen el título o el texto, no solo el color.",
    "No uses regiones vivas para estados intermedios como «Cargando…»: usa <progress>.",
  ],
};
