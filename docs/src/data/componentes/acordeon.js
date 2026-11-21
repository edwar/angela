/**
 * Acordeón
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "acordeon",
  title: "Acordeón",
  summary: "Varios desplegables en un bloque con borde y una fila táctil por pregunta. Sin JavaScript.",
  examples: [
    {
      title: "Acordeón",
      note: "Los <details> directos de .accordion no necesitan clase. El encabezado del grupo va antes del primero y lo nombra con aria-labelledby.",
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
      title: "Exclusivo",
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
      note: "data-marker=\"end\" en el .accordion lo aplica a todas sus filas. En acordeones anchos el caret queda lejos de su pregunta: mejor en columnas estrechas. El icono y sus giros se cambian como en el desplegable (--disclosure-icon).",
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
  ],
  api: [
    [".accordion", "Agrupa <details> directos (sin clase) en un bloque con borde. El encabezado del grupo va antes del primero."],
    ["name=\"grupo\"", "Atributo nativo de <details>: con el mismo valor, solo uno abierto a la vez."],
    ["data-marker=\"end\"", "En el .accordion: el caret pasa al final de todas las filas."],
    ["--disclosure-icon", "Icono del caret y sus giros: los mismos que en el desplegable."],
  ],
  a11y: [
    "Da nombre al acordeón con un encabezado y aria-labelledby (o aria-label si no hay título visible); no lo conviertas en región por defecto.",
    "No pongas encabezados dentro de <summary>: JAWS y TalkBack lo anuncian como botón y descartan el encabezado.",
    "Sin flechas ni tabindex itinerante: cada pregunta es una parada de Tab y se abre con Enter o Espacio.",
    "Dentro del acordeón, el anillo de foco va hacia dentro para que el borde del bloque no lo tape.",
    "Con pocas preguntas cortas, mejor el texto a la vista: plegar obliga a abrir para leer.",
    "El modo exclusivo (name) impide comparar respuestas y, al cerrar la anterior, mueve el contenido: úsalo con moderación.",
  ],
};
