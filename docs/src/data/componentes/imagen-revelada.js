/**
 * Imagen revelada
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "imagen-revelada",
  title: "Imagen revelada",
  summary: "Una imagen que se descubre de abajo arriba mientras entra en pantalla al hacer scroll, solo con CSS (animation-timeline: view()). Sin soporte o con «reducir movimiento» se ve entera desde el principio.",
  examples: [
    {
      title: "Ejemplo",
      code: `<p class="heading" data-size="4xl">Un texto de relleno para tener un scroll para la imagen de revelado con scroll</p>
<button class="button" type="button" data-size="lg">Scroll</button>
<section class="reveal-section" id="galeria">
  <div class="image-container">
    <img src="https://angela.cognilab.dev/img/naturaleza/lago-de-montana.webp" alt="Lago entre montañas nevadas" class="reveal-image">
  </div>
</section>
<p class="heading" data-size="4xl">Este texto va despues de la imagen ya revelada</p>`,
    },
  ],
  api: [
    [".reveal-image", "Clase del componente."],
  ],
  a11y: [
    "Es solo un efecto visual: la imagen está entera en el DOM desde el principio, así que el lector de pantalla la anuncia con su alt aunque aún no se vea. Si informa, necesita un alt que describa lo que se ve.",
    "La animación va dentro de prefers-reduced-motion: no-preference; con el movimiento reducido la imagen se muestra entera, sin animar.",
    "Sin soporte de animaciones por scroll (animation-timeline), la imagen se ve entera: el efecto es una mejora, no hace falta para ver el contenido.",
    "No depende del ratón ni del teclado: avanza con el scroll de cualquier forma (rueda, teclado, táctil) y no bloquea nada.",
    "Pon width y height en la imagen para reservar su espacio: así la página no salta mientras se revela.",
  ],
};
