/**
 * Progreso
 * Página de documentación del componente. La genera y la actualiza el laboratorio al
 * proponer cambios; también se puede editar a mano.
 */
export default {
  slug: "progreso",
  title: "Progreso",
  summary: "Barras de progreso y medidores nativos (<progress> y <meter>), teñidos con el color de marca.",
  examples: [
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
    {
      title: "Indeterminado",
      note: "Sin value, el progreso no tiene fin conocido: el navegador lo anima.",
      code: `<div class="field">
  <label for="pr-buscando">Buscando coincidencias</label>
  <progress class="progress" id="pr-buscando"></progress>
</div>`,
    },
  ],
  api: [
    [".progress", "En un <progress> nativo: value y max (sin value, indeterminado)."],
    [".meter", "En un <meter> nativo: min, max, value y, si quieres, low, high y optimum."],
  ],
  a11y: [
    "Dales una etiqueta visible con <label for> (o aria-label): sin ella, el lector solo dice un porcentaje.",
    "<progress> es para tareas en curso y <meter> para medidas: no los intercambies, el lector los anuncia distinto.",
    "El texto de dentro solo se ve en navegadores sin soporte: escribe el valor también ahí.",
    "No uses regiones vivas para anunciar cada avance: el lector consulta el valor cuando hace falta.",
  ],
};
