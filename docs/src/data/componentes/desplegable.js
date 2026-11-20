/**
 * Desplegable y acordeón
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "desplegable",
  title: "Desplegable y acordeón",
  summary: "Contenido plegable con <details> y <summary>, sin JavaScript. Suelto o agrupado en un acordeón con borde.",
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
      title: "Acordeón",
      note: "Un bloque con borde y una fila táctil por pregunta. Los <details> directos de .accordion no necesitan clase.",
      code: `<section class="accordion" aria-labelledby="acc-titulo">
  <h3 id="acc-titulo">Preguntas frecuentes</h3>
  <details open>
    <summary>¿Cómo cambio la paleta?</summary>
    <p>Cambia <code>--angela-brand-h</code> y <code>--angela-brand-c</code> en <code>:root</code>. Todo lo demás se recalcula.</p>
  </details>
  <details>
    <summary>¿Necesito JavaScript?</summary>
    <p>No para los estilos. <code>@angela-ui/angela/js</code> solo añade mejoras: validación accesible, pestañas y tema.</p>
  </details>
  <details>
    <summary>¿Funciona con Tailwind?</summary>
    <p>Sí. Importa <code>@angela-ui/angela/tailwind.css</code> para usar los tokens como utilidades.</p>
  </details>
</section>`,
    },
    {
      title: "Acordeón exclusivo",
      note: "Con el mismo name en cada <details>, abrir uno cierra el otro. Úsalo solo si el diseño lo exige: impide comparar respuestas y mueve el contenido fuera de la vista de quien usa lupa.",
      code: `<section class="accordion" aria-labelledby="acc-exclusivo">
  <h3 id="acc-exclusivo">Envíos</h3>
  <details name="envios" open>
    <summary>¿Cuánto tarda?</summary>
    <p>De 2 a 4 días laborables en la península.</p>
  </details>
  <details name="envios">
    <summary>¿Cuánto cuesta?</summary>
    <p>Gratis a partir de 30 €; por debajo, 3,90 €.</p>
  </details>
</section>`,
    },
    {
      title: "Caret al final de la fila",
      note: "data-marker=\"end\" en .accordion o en .disclosure. Abajo cerrado, arriba abierto. En acordeones anchos el caret queda lejos de su pregunta: mejor en columnas estrechas.",
      code: `<section class="accordion" data-marker="end" aria-labelledby="acc-final">
  <h3 id="acc-final">Cuenta</h3>
  <details>
    <summary>¿Cómo cambio mi correo?</summary>
    <p>En Ajustes → Cuenta. Te enviaremos un enlace para confirmarlo.</p>
  </details>
  <details>
    <summary>¿Puedo borrar mi cuenta?</summary>
    <p>Sí, desde Ajustes → Privacidad. Te pediremos confirmación.</p>
  </details>
</section>`,
    },
    {
      title: "Icono propio",
      note: "--disclosure-icon acepta cualquier SVG de un color (se pinta como máscara con el color del texto). Aquí, un + que gira 45° y se convierte en ×. Ponlo en el .accordion, en un <details> o en :root.",
      code: `<section class="accordion" data-marker="end" aria-labelledby="acc-icono"
  style="--disclosure-icon: url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2020%2020%27%3E%3Cpath%20d=%27M9%204h2v12H9zM4%209h12v2H4z%27/%3E%3C/svg%3E); --disclosure-rotate-open: 45deg">
  <h3 id="acc-icono">Pagos</h3>
  <details>
    <summary>¿Qué tarjetas aceptáis?</summary>
    <p>Visa, Mastercard y American Express.</p>
  </details>
  <details>
    <summary>¿Puedo pagar con transferencia?</summary>
    <p>Sí, en los planes anuales.</p>
  </details>
</section>`,
    },
  ],
  api: [
    [".disclosure", "En un <details> suelto. El caret gira y el contenido se anima donde hay soporte."],
    [".accordion", "Agrupa <details> directos (sin clase) en un bloque con borde. El encabezado del grupo va antes del primero."],
    ["name=\"grupo\"", "Atributo nativo de <details>: con el mismo valor, solo uno abierto a la vez."],
    ["data-marker=\"end\"", "En .accordion o .disclosure: el caret pasa al final de la fila."],
    ["--disclosure-icon", "Icono del caret: url() de un SVG de un color. Por defecto, un chevron."],
    ["--disclosure-rotate", "Giro del icono cerrado. Por defecto -90deg (0deg con data-marker=\"end\"). En RTL se invierte solo."],
    ["--disclosure-rotate-open", "Giro del icono abierto. Por defecto 0deg (180deg con data-marker=\"end\")."],
  ],
  a11y: [
    "No pongas encabezados dentro de <summary>: JAWS y TalkBack lo anuncian como botón y descartan el encabezado.",
    "Da nombre al acordeón con un encabezado y aria-labelledby (o aria-label si no hay título visible); no lo conviertas en región por defecto.",
    "Sin flechas ni tabindex itinerante: cada pregunta es una parada de Tab y se abre con Enter o Espacio.",
    "El estado abierto no depende solo del color: el caret gira y el lector anuncia expandido o contraído.",
    "Dentro del acordeón, el anillo de foco va hacia dentro para que el borde del bloque no lo tape.",
    "El contenido cerrado se puede buscar con Ctrl+F y se abre al encontrarlo.",
    "Con data-marker=\"end\" en un acordeón ancho, el caret queda lejos de su pregunta: limita el ancho o déjalo junto al texto.",
    "El icono propio tiene que ser un SVG de un solo color: se pinta como máscara y así se ve en alto contraste (forced-colors).",
  ],
};
