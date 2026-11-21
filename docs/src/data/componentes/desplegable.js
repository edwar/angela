/**
 * Desplegable
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "desplegable",
  title: "Desplegable",
  summary: "Contenido plegable con <details> y <summary>, sin JavaScript. Para agrupar varios en un bloque, usa el acordeón.",
  examples: [
    {
      title: "Desplegable",
      note: "Ligero, sin caja: encaja dentro de una tarjeta o de un texto sin crear cajas dentro de cajas.",
      code: `<details class="disclosure">
  <summary>¿Puedo cambiar de plan más adelante?</summary>
  <p>Sí. El cambio se aplica en tu siguiente factura y se prorratea el importe.</p>
</details>`,
    },
    {
      title: "Caret al final de la fila",
      note: "data-marker=\"end\": abajo cerrado, arriba abierto. En filas anchas el caret queda lejos del texto: mejor en columnas estrechas.",
      code: `<details class="disclosure" data-marker="end">
  <summary>Detalles del envío</summary>
  <p>Envío estándar, de 2 a 4 días laborables.</p>
</details>`,
    },
    {
      title: "Icono propio",
      note: "--disclosure-icon acepta cualquier SVG de un color (se pinta como máscara con el color del texto). Aquí, un + que gira 45° y se convierte en ×. Ponlo en el <details>, en un contenedor o en :root.",
      code: `<details class="disclosure" data-marker="end"
  style="--disclosure-icon: url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2020%2020%27%3E%3Cpath%20d=%27M9%204h2v12H9zM4%209h12v2H4z%27/%3E%3C/svg%3E); --disclosure-rotate-open: 45deg">
  <summary>¿Qué tarjetas aceptáis?</summary>
  <p>Visa, Mastercard y American Express.</p>
</details>`,
    },
  ],
  api: [
    [".disclosure", "En un <details> suelto. El caret gira y el contenido se anima donde hay soporte."],
    ["data-marker=\"end\"", "El caret pasa al final de la fila. También en .accordion, para todas sus filas."],
    ["--disclosure-icon", "Icono del caret: url() de un SVG de un color. Por defecto, un chevron. Sirve también en el acordeón."],
    ["--disclosure-rotate", "Giro del icono cerrado. Por defecto -90deg (0deg con data-marker=\"end\"). En RTL se invierte solo."],
    ["--disclosure-rotate-open", "Giro del icono abierto. Por defecto 0deg (180deg con data-marker=\"end\")."],
  ],
  a11y: [
    "No pongas encabezados dentro de <summary>: JAWS y TalkBack lo anuncian como botón y descartan el encabezado.",
    "Se abre con Enter o Espacio; el lector anuncia expandido o contraído.",
    "El estado abierto no depende solo del color: el caret gira.",
    "El contenido cerrado se puede buscar con Ctrl+F y se abre al encontrarlo.",
    "El icono propio tiene que ser un SVG de un solo color: se pinta como máscara y así se ve en alto contraste (forced-colors).",
  ],
};
