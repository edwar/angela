/**
 * Botón
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "boton",
  title: "Botón",
  summary: "Acciones con <button> y navegación con <a>, con variantes, tonos y tamaños.",
  examples: [
    {
      title: "Variantes",
      note: "Una sola acción primaria (solid) por vista. Las demás, soft, outline o ghost.",
      code: `<div class="cluster">
  <button class="button" type="button">Guardar</button>
  <button class="button" type="button" data-variant="soft">Vista previa</button>
  <button class="button" type="button" data-variant="outline">Exportar</button>
  <button class="button" type="button" data-variant="ghost">Cancelar</button>
</div>`,
    },
    {
      title: "Tonos",
      note: "El color solo comunica intención o estado. data-tone cambia todos los colores del componente a la vez.",
      code: `<div class="stack" style="--stack-gap: var(--space-3)">
  <div class="cluster">
    <button class="button" type="button" data-tone="brand">Marca</button>
    <button class="button" type="button" data-tone="neutral">Neutral</button>
    <button class="button" type="button" data-tone="success">Éxito</button>
    <button class="button" type="button" data-tone="warning">Aviso</button>
    <button class="button" type="button" data-tone="danger">Peligro</button>
    <button class="button" type="button" data-tone="info">Info</button>
  </div>
  <div class="cluster">
    <button class="button" type="button" data-variant="soft" data-tone="brand">Marca</button>
    <button class="button" type="button" data-variant="soft" data-tone="neutral">Neutral</button>
    <button class="button" type="button" data-variant="soft" data-tone="success">Éxito</button>
    <button class="button" type="button" data-variant="soft" data-tone="warning">Aviso</button>
    <button class="button" type="button" data-variant="soft" data-tone="danger">Peligro</button>
    <button class="button" type="button" data-variant="soft" data-tone="info">Info</button>
  </div>
</div>`,
    },
    {
      title: "Tamaños",
      code: `<div class="cluster">
  <button class="button" type="button" data-size="sm">Pequeño</button>
  <button class="button" type="button">Mediano</button>
  <button class="button" type="button" data-size="lg">Grande</button>
</div>`,
    },
    {
      title: "Con ícono y solo ícono",
      note: "El ícono es decorativo (aria-hidden). Un botón solo-ícono necesita aria-label con un nombre que diga qué hace.",
      code: `<div class="cluster">
  <button class="button" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Nuevo cliente</button>
  <button class="button" type="button" data-variant="outline" data-tone="neutral"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg> Descargar</button>
  <button class="button" type="button" data-variant="ghost" data-tone="neutral" data-icon-only aria-label="Editar perfil"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/></svg></button>
  <button class="button" type="button" data-variant="ghost" data-tone="danger" data-icon-only aria-label="Eliminar perfil"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
</div>`,
    },
    {
      title: "Estados",
      note: "disabled saca el botón del orden de tabulación. aria-disabled=\"true\" lo mantiene enfocable (útil para explicar por qué no está disponible), pero tú debes bloquear la acción en JS. aria-pressed crea un botón conmutador.",
      code: `<div class="cluster">
  <button class="button" type="button" disabled>Deshabilitado</button>
  <button class="button" type="button" aria-disabled="true" aria-describedby="pago-motivo">Pagar</button>
  <span id="pago-motivo" class="muted">Completa la dirección para pagar.</span>
  <button class="button" type="button" data-variant="outline" data-tone="neutral" aria-pressed="true">Negrita</button>
</div>`,
    },
    {
      title: "Enlace con aspecto de botón",
      note: "Si lleva a otra página, es un enlace: conserva abrir en pestaña nueva, copiar URL y funciona sin JS.",
      code: "<a class=\"button\" data-variant=\"outline\" href=\"#\">Ver documentación</a>",
    },
  ],
  api: [
    ["data-variant", "solid (defecto) · soft · outline · ghost"],
    ["data-tone", "brand (defecto) · neutral · success · warning · danger · info"],
    ["data-size", "sm · md (defecto) · lg"],
    ["data-icon-only", "Botón cuadrado solo con ícono. Requiere aria-label."],
    ["data-block", "Ocupa todo el ancho disponible."],
    ["aria-pressed", "true/false para botones conmutadores."],
  ],
  a11y: [
    "Usa <button type=\"button\"> para acciones y <a href> para navegar. Nunca <div onclick>.",
    "Dentro de un formulario, el botón que envía es type=\"submit\" y los demás type=\"button\".",
    "Altura mínima de 40 px (44 px en pantallas táctiles): supera el objetivo de 24 px de WCAG 2.5.8.",
    "Foco visible con anillo de 2 px y contraste ≥ 3:1. En modo de alto contraste el borde transparente se vuelve visible.",
    "Texto sobre el color sólido con contraste ≥ 4.5:1 para cualquier tono de la paleta.",
  ],
};
