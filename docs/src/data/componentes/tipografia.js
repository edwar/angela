/**
 * Tipografía
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "tipografia",
  title: "Tipografía",
  summary: "Títulos y texto con la escala de angela, separando el aspecto del nivel semántico.",
  examples: [
    {
      title: "Tarjeta de producto",
      note: "El nombre es un <h3> por el esquema de la página, pero se ve como \"lg\". El precio usa cifras tabulares para que se alineen entre tarjetas.",
      code: `<article class="card stack" style="--stack-gap: var(--space-2); max-inline-size: 16rem">
  <h3 class="heading" data-size="lg">Laptop</h3>
  <p class="text" data-size="sm" data-muted>Potencia para crear.</p>
  <p class="text" data-size="2xl" data-weight="bold" data-numeric>$18.999</p>
  <div class="cluster">
    <button class="button" type="button" data-tone="neutral">Comprar</button>
    <button class="button" type="button" data-variant="outline" data-tone="neutral" data-icon-only aria-label="Agregar Laptop al carrito"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg></button>
  </div>
</article>`,
    },
    {
      title: "Escala de títulos",
      note: "data-size elige el tamaño sin cambiar el nivel. Del 3xl en adelante el tamaño es fluido y crece con la pantalla.",
      code: `<div class="stack" style="--stack-gap: var(--space-3)">
  <p class="heading" data-size="4xl">Título 4xl</p>
  <p class="heading" data-size="3xl">Título 3xl</p>
  <p class="heading" data-size="2xl">Título 2xl</p>
  <p class="heading">Título xl (por defecto)</p>
  <p class="heading" data-size="lg">Título lg</p>
  <p class="heading" data-size="md">Título md</p>
</div>`,
    },
    {
      title: "Texto: tamaño, peso y color",
      note: "data-muted para lo secundario. data-tone colorea con un rol; acompáñalo siempre de texto o ícono que diga el estado.",
      code: `<div class="stack" style="--stack-gap: var(--space-2)">
  <p class="text" data-size="lg">Texto destacado para la entrada de una sección.</p>
  <p class="text">Texto de lectura con el interlineado cómodo de angela.</p>
  <p class="text" data-size="sm" data-muted>Texto secundario: fechas, ayudas, metadatos.</p>
  <p class="text" data-size="sm" data-weight="medium" data-tone="success">✓ Pago recibido el 18/11/2026.</p>
  <p class="text" data-size="sm" data-weight="medium" data-tone="danger">✕ La tarjeta fue rechazada.</p>
</div>`,
    },
    {
      title: "Recortar texto",
      note: "Solo si el texto completo está a mano: aquí, el enlace lleva a la ficha con la descripción entera.",
      code: `<article class="card stack" style="--stack-gap: var(--space-2); max-inline-size: 18rem">
  <h3 class="heading" data-size="md" data-truncate>Auriculares inalámbricos con cancelación activa de ruido</h3>
  <p class="text" data-size="sm" data-muted data-lines="2">Sonido envolvente, 30 horas de batería, carga rápida por USB-C y micrófono con reducción de ruido para llamadas.</p>
  <a href="#" class="text" data-size="sm">Ver ficha completa</a>
</article>`,
    },
    {
      title: "Texto largo",
      note: ".prose limita la medida a ~68 caracteres y da ritmo a los elementos de dentro sin poner clases en cada uno.",
      code: `<div class="prose">
  <h2>Cómo elegir tu laptop</h2>
  <p>Piensa primero en para qué la vas a usar. Para ofimática basta casi cualquier equipo; para edición de video importan la memoria y la tarjeta gráfica.</p>
  <ul>
    <li>16 GB de memoria como mínimo para crear contenido.</li>
    <li>Pantalla con buena cobertura de color si editas fotos.</li>
  </ul>
  <blockquote><p>Compra pensando en los próximos tres años, no en hoy.</p></blockquote>
  <h3>Garantía</h3>
  <p>Todos los equipos incluyen dos años de garantía y devolución gratuita en 30 días.</p>
</div>`,
    },
  ],
  api: [
    [".heading", "Título: negrita, interlineado ajustado y líneas equilibradas. Tamaño por defecto: xl."],
    [".text", "Texto de lectura: interlineado cómodo y sin palabras sueltas al final. Tamaño por defecto: md."],
    ["data-size", "xs · sm · md · lg · xl · 2xl · 3xl · 4xl (tokens --fs-*; 3xl y 4xl son fluidos)."],
    ["data-weight", "regular · medium · bold"],
    ["data-muted", "Color secundario (--color-text-muted)."],
    ["data-tone", "brand · success · warning · danger · info · neutral. Color de texto del rol (≥ 4.5:1)."],
    ["data-numeric", "Cifras tabulares, para precios y columnas de números."],
    ["data-truncate", "Una línea con puntos suspensivos."],
    ["data-lines", "2 · 3 · 4. Corta tras N líneas con puntos suspensivos."],
    ["data-align", "start · center · end (respeta la dirección del texto)."],
    [".prose", "Contenedor de texto largo: medida legible (--measure) y ritmo vertical."],
  ],
  a11y: [
    "La clase cambia el aspecto, no el significado: usa el nivel de encabezado que pida el esquema de la página (h1 → h2 → h3) y ajusta el tamaño con data-size.",
    "Los tamaños van en rem: respetan el tamaño de letra que la persona elige en su navegador y el zoom al 200 %.",
    "Sin altura fija: el texto crece si la persona aumenta el interlineado o el espaciado (WCAG 1.4.12).",
    "data-tone nunca va solo: el estado se dice también con texto o con un ícono.",
    "Recortar oculta texto: úsalo solo si el contenido completo está accesible en otro sitio (no basta con title, que no llega con teclado ni en táctil).",
    "Para enfatizar, negrita y <strong>/<em>; evita las mayúsculas sostenidas, que se leen peor.",
  ],
};
