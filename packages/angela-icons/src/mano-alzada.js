/**
 * El estilo de los iconos de angela: formas limpias dibujadas «a mano alzada».
 *
 * Quien diseña dibuja formas exactas (líneas, rectángulos, círculos) y esto las convierte
 * en trazos con carácter de dibujo: lados que se pasan un poco en las esquinas, contornos
 * que no cierran del todo, un temblor leve y repasos finos. Los parámetros son de la guía,
 * no de cada icono: así todos tienen la misma letra aunque los dibujen personas distintas.
 *
 * La clave es la presión: cada trazo empieza fino, engorda en medio y vuelve a afinarse,
 * como un lápiz al apoyarlo y levantarlo. Un trazo SVG no puede variar de grosor, así que
 * cada trazo se dibuja como su silueta rellena (fill="currentColor").
 *
 * Los trazos libres (tipo «trazo», dibujados con el lápiz de una tableta) traen su propia
 * presión: aquí se normaliza por icono (así da igual si quien dibuja aprieta mucho o poco) y
 * se lleva al mismo rango de grosor que el resto. Sin presión, siguen la curva de la guía.
 *
 * Es determinista: la misma forma con la misma semilla da siempre el mismo trazo.
 * Sin dependencias y sin DOM.
 */
import { ZONA } from './reglas.js';

/** Los parámetros del estilo, en unidades de la cuadrícula de 24. */
export const ESTILO = {
  /** Cuánto se pasa un lado de la esquina (mín. y máx.). */
  sobrepaso: [0.1, 0.3],
  /** Amplitud del temblor perpendicular. */
  temblor: 0.06,
  /** Separación entre puntos al muestrear un trazo. */
  paso: 1,
  /** Desviación máxima al simplificar las siluetas: por debajo, no se ve ni a 96 px. */
  tolerancia: 0.04,
  /** Cierre de formas redondas: grados de solape (positivo) o hueco (negativo). */
  cierre: [-4, 9],
  /** Repaso: trazo fino sobre parte del contorno, separado esta distancia. */
  repaso: { probabilidad: 0.35, desde: 0.2, largo: [0.22, 0.4], separacion: 0.6 },
  /** Grosor según la presión: [fino, grueso]. Contorno, detalle y repaso. */
  grosor: { contorno: [0.75, 1.25], detalle: [0.5, 0.85], repaso: [0.4, 0.7] },
  /** Cuánto varía la presión a lo largo del trazo (además de afinarse en los extremos). */
  pulso: 0.08,
  /** Presión real (trazo libre): por debajo de esta variación en el icono no hay presión que leer (ratón). */
  presionMinima: 0.08,
  /** Las puntas del trazo libre siempre se afinan, apriete lo que apriete el lápiz. */
  puntas: 1.6,
};

/* ---------- Azar con semilla ---------- */

function hash(texto) {
  let h = 2166136261;
  for (const c of String(texto)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Generador pseudoaleatorio (mulberry32): mismo resultado con la misma semilla. */
function azar(semilla) {
  let a = hash(semilla);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const entre = (r, [a, b]) => a + (b - a) * r();
const r2 = (n) => Math.round(n * 100) / 100;
const limitar = (n) => Math.min(ZONA.max, Math.max(ZONA.min, n));

/* ---------- Trazos ---------- */

/**
 * Un trazo «a mano» por una lista de puntos: muestrea, añade un temblor suave (dos ondas con
 * fase al azar, así no es ruido sino pulso) y redondea a 2 decimales.
 * @param {[number, number][]} puntos
 */
function trazoTembloroso(puntos, r, amplitud = ESTILO.temblor) {
  const fase1 = r() * Math.PI * 2;
  const fase2 = r() * Math.PI * 2;
  const largoTotal = puntos.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - puntos[i][0], p[1] - puntos[i][1]), 0) || 1;
  const salida = [];
  let recorrido = 0;
  for (let i = 0; i < puntos.length - 1; i++) {
    const [x1, y1] = puntos[i];
    const [x2, y2] = puntos[i + 1];
    const largo = Math.hypot(x2 - x1, y2 - y1);
    const pasos = Math.max(1, Math.round(largo / ESTILO.paso));
    const nx = largo ? -(y2 - y1) / largo : 0;
    const ny = largo ? (x2 - x1) / largo : 0;
    for (let k = i === 0 ? 0 : 1; k <= pasos; k++) {
      const t = k / pasos;
      const s = (recorrido + largo * t) / largoTotal;
      // Los extremos tiemblan menos: la mano es más firme al empezar y al acabar.
      const firmeza = Math.sin(Math.PI * Math.min(1, Math.max(0, s))) ** 0.5;
      const d = amplitud * firmeza * (0.65 * Math.sin(s * 5.1 + fase1) + 0.35 * Math.sin(s * 11.7 + fase2));
      salida.push([limitar(x1 + (x2 - x1) * t + nx * d), limitar(y1 + (y2 - y1) * t + ny * d)]);
    }
    recorrido += largo;
  }
  return salida;
}

/**
 * Un paso de suavizado de Chaikin: redondea los quiebros que deja el muestreo. Interpola
 * todas las componentes del punto, también la presión si la trae.
 */
function suavizar(puntos) {
  if (puntos.length < 3) return puntos;
  const out = [puntos[0]];
  const mezcla = (a, b, t) => a.map((v, k) => v * (1 - t) + b[k] * t);
  for (let i = 0; i < puntos.length - 1; i++) {
    const [a, b] = [puntos[i], puntos[i + 1]];
    out.push(mezcla(a, b, 0.25), mezcla(a, b, 0.75));
  }
  out.push(puntos.at(-1));
  return out;
}

/**
 * Douglas-Peucker: quita los puntos que no cambian la forma más de `tolerancia`.
 * El muestreo y el suavizado dejan cientos de vértices; casi todos sobran.
 */
function simplificar(puntos, tolerancia) {
  if (puntos.length < 3) return puntos;
  const [a, b] = [puntos[0], puntos.at(-1)];
  const largo = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-9;
  let peor = 0;
  let indice = 0;
  for (let i = 1; i < puntos.length - 1; i++) {
    const p = puntos[i];
    const dist = Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / largo;
    if (dist > peor) [peor, indice] = [dist, i];
  }
  if (peor <= tolerancia) return [a, b];
  return [...simplificar(puntos.slice(0, indice + 1), tolerancia).slice(0, -1), ...simplificar(puntos.slice(indice), tolerancia)];
}

/** Área con signo de un polígono: sirve para orientar todas las siluetas igual. */
const area = (pts) => pts.reduce((s, p, i) => {
  const q = pts[(i + 1) % pts.length];
  return s + p[0] * q[1] - q[0] * p[1];
}, 0) / 2;

/** Silueta curva y cerrada por una lista de puntos (curvas cuadráticas entre puntos medios). */
function rutaCerrada(pts) {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const f = ([x, y]) => `${r2(x)} ${r2(y)}`;
  const n = pts.length;
  let d = `M${f(m(pts[n - 1], pts[0]))}`;
  for (let i = 0; i < n; i++) d += `Q${f(pts[i])} ${f(m(pts[i], pts[(i + 1) % n]))}`;
  return `${d}Z`;
}

/**
 * La silueta de un trazo con presión: fino en los extremos, más grueso en medio y con un
 * pulso suave. Todas las siluetas giran en el mismo sentido: donde dos trazos se cruzan,
 * el relleno se suma en lugar de dejar un hueco.
 * @param {number[][]} linea  Centro del trazo: [x, y] o, con presión real, [x, y, presión 0–1].
 * @param {[number, number]} rango  Grosor [fino, grueso].
 */
function silueta(linea, rango, r) {
  const pts = suavizar(linea);
  if (pts.length < 2) return '';
  const fase = r() * Math.PI * 2;
  const largos = [0];
  for (let i = 1; i < pts.length; i++) largos.push(largos[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = largos.at(-1) || 1;
  const izquierda = [];
  const derecha = [];
  pts.forEach((p, i) => {
    const s = largos[i] / total;
    // Presión: el lápiz se apoya, empuja y se levanta. Con presión real manda la mano, pero
    // las puntas siempre se afinan.
    const curva = Math.sin(Math.PI * s) ** 0.6;
    const presion = Math.min(1, Math.max(0, p.length > 2 ? Math.min(p[2], curva * ESTILO.puntas) : curva + ESTILO.pulso * Math.sin(s * 7 + fase)));
    const medio = (rango[0] + (rango[1] - rango[0]) * presion) / 2;
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const largo = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / largo;
    const ny = (b[0] - a[0]) / largo;
    izquierda.push([p[0] + nx * medio, p[1] + ny * medio]);
    derecha.push([p[0] - nx * medio, p[1] - ny * medio]);
  });
  // Extremos redondeados: medio círculo del grosor fino en cada punta.
  const punta = (centro, haciaX, haciaY, radio) => [0.5, 0, -0.5].map((k) => {
    const ang = Math.atan2(haciaY, haciaX) + (k * Math.PI) / 2;
    return [centro[0] + Math.cos(ang) * radio, centro[1] + Math.sin(ang) * radio];
  });
  const r0 = rango[0] / 2;
  const [p0, p1] = [pts[0], pts[1]];
  const [pn1, pn] = [pts.at(-2), pts.at(-1)];
  const contorno = [
    ...izquierda,
    ...punta(pn, pn[0] - pn1[0], pn[1] - pn1[1], r0),
    ...derecha.reverse(),
    ...punta(p0, p0[0] - p1[0], p0[1] - p1[1], r0),
  ];
  const limpio = simplificar(contorno, ESTILO.tolerancia);
  return rutaCerrada(area(limpio) < 0 ? limpio.reverse() : limpio);
}


/** Alarga un segmento por sus dos extremos (el sobrepaso de las esquinas). */
function alargar([a, b], antes, despues) {
  const largo = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = (b[0] - a[0]) / largo;
  const uy = (b[1] - a[1]) / largo;
  return [
    [a[0] - ux * antes, a[1] - uy * antes],
    [b[0] + ux * despues, b[1] + uy * despues],
  ];
}

/** Repaso fino paralelo a una parte de un trazo. */
function repaso(puntos, r) {
  const { probabilidad, desde, largo, separacion } = ESTILO.repaso;
  if (r() > probabilidad || puntos.length < 4) return null;
  const n = puntos.length;
  const inicio = Math.floor(n * (desde + r() * (1 - desde - largo[1])));
  const fin = Math.min(n - 1, inicio + Math.max(3, Math.floor(n * entre(r, largo))));
  const tramo = puntos.slice(inicio, fin + 1);
  const lado = r() < 0.5 ? -1 : 1;
  const desplazado = tramo.map((p, i) => {
    const q = tramo[Math.min(i + 1, tramo.length - 1)];
    const o = tramo[Math.max(i - 1, 0)];
    const largoT = Math.hypot(q[0] - o[0], q[1] - o[1]) || 1;
    return [limitar(p[0] - ((q[1] - o[1]) / largoT) * separacion * lado), limitar(p[1] + ((q[0] - o[0]) / largoT) * separacion * lado)];
  });
  return desplazado;
}

/* ---------- Formas ---------- */

/**
 * Presión de los trazos libres de un icono, normalizada entre todos: el más suave del icono
 * va a 0 y el más fuerte a 1. Si apenas varía (ratón, dedo), no hay presión: null.
 * @param {Forma[]} formas
 * @returns {((p: number) => number) | null}
 */
function normalizarPresion(formas) {
  const valores = formas
    .filter((f) => f.tipo === 'trazo')
    .flatMap((f) => f.puntos.filter((p) => p.length > 2).map((p) => p[2]))
    .sort((a, b) => a - b);
  if (valores.length < 2) return null;
  // Percentiles 5 y 95: un pico suelto del lápiz no decide la escala.
  const lo = valores[Math.floor(valores.length * 0.05)];
  const hi = valores[Math.ceil(valores.length * 0.95) - 1];
  if (hi - lo < ESTILO.presionMinima) return null;
  return (p) => Math.min(1, Math.max(0, (p - lo) / (hi - lo)));
}

/**
 * @typedef {{ tipo: 'linea', puntos: [number, number][], cerrada?: boolean, detalle?: boolean }
 *   | { tipo: 'rect', x: number, y: number, ancho: number, alto: number, radio?: number, detalle?: boolean }
 *   | { tipo: 'circulo', cx: number, cy: number, r: number, detalle?: boolean }
 *   | { tipo: 'elipse', cx: number, cy: number, rx: number, ry: number, detalle?: boolean }
 *   | { tipo: 'trazo', puntos: number[][], detalle?: boolean }} Forma
 */

/** Puntos de un contorno redondo (círculo o elipse) con su cierre imperfecto. */
function contornoRedondo(cx, cy, rx, ry, r) {
  const inicio = r() * Math.PI * 2;
  const barrido = Math.PI * 2 + (entre(r, ESTILO.cierre) * Math.PI) / 180;
  const pasos = Math.max(12, Math.round((barrido * Math.max(rx, ry)) / ESTILO.paso));
  return Array.from({ length: pasos + 1 }, (_, i) => {
    const a = inicio + (barrido * i) / pasos;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
}

/** Puntos de un rectángulo con esquinas redondeadas, recorrido de una vez. */
function contornoRectRedondeado({ x, y, ancho, alto, radio }) {
  const rr = Math.min(radio, ancho / 2, alto / 2);
  const arco = (cx, cy, desde) => Array.from({ length: 5 }, (_, i) => {
    const a = desde + (Math.PI / 2) * (i / 4);
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  });
  return [
    ...arco(x + ancho - rr, y + rr, -Math.PI / 2),
    ...arco(x + ancho - rr, y + alto - rr, 0),
    ...arco(x + rr, y + alto - rr, Math.PI / 2),
    ...arco(x + rr, y + rr, Math.PI),
    [x + ancho - rr + 0.4, y],
  ];
}

/**
 * Dibuja unas formas a mano alzada.
 * @param {Forma[]} formas
 * @param {{ semilla?: string }} [opciones]
 * @returns {{ contorno: string[], detalle: string[] }} Subtrazados (d) de cada grosor.
 */
export function dibujar(formas, { semilla = 'angela' } = {}) {
  const contorno = [];
  const detalle = [];
  const repasos = [];
  const presion = normalizarPresion(formas);
  formas.forEach((forma, i) => {
    const r = azar(`${semilla}:${i}:${forma.tipo}`);
    const destino = forma.detalle ? detalle : contorno;
    const trazar = (puntos) => destino.push(silueta(puntos, forma.detalle ? ESTILO.grosor.detalle : ESTILO.grosor.contorno, r));
    let principal = null;

    if (forma.tipo === 'trazo') {
      // El trazo libre ya es de la mano: ni temblor ni sobrepaso ni repaso. Solo la presión.
      trazar(forma.puntos.map(([x, y, p]) => (presion && p !== undefined ? [limitar(x), limitar(y), presion(p)] : [limitar(x), limitar(y)])));
      return;
    }

    if (forma.tipo === 'linea' || (forma.tipo === 'rect' && !forma.radio)) {
      // Líneas y rectángulos de esquina viva: cada lado es un trazo que se pasa de la esquina.
      const p = forma.tipo === 'rect'
        ? [[forma.x, forma.y], [forma.x + forma.ancho, forma.y], [forma.x + forma.ancho, forma.y + forma.alto], [forma.x, forma.y + forma.alto]]
        : forma.puntos;
      const cerrada = forma.tipo === 'rect' || forma.cerrada;
      const lados = p.slice(0, cerrada ? p.length : p.length - 1).map((a, k) => [a, p[(k + 1) % p.length]]);
      // Una línea abierta de un solo tramo se pasa poco: no hay esquina que cruzar.
      const factor = lados.length === 1 ? 0.35 : 1;
      let masLargo = null;
      for (const lado of lados) {
        const alargado = alargar(lado, entre(r, ESTILO.sobrepaso) * factor, entre(r, ESTILO.sobrepaso) * factor);
        const puntos = trazoTembloroso(alargado, r);
        trazar(puntos);
        if (!masLargo || puntos.length > masLargo.length) masLargo = puntos;
      }
      principal = masLargo;
    } else if (forma.tipo === 'rect') {
      principal = trazoTembloroso(contornoRectRedondeado(forma), r);
      trazar(principal);
    } else if (forma.tipo === 'circulo' || forma.tipo === 'elipse') {
      const rx = forma.tipo === 'circulo' ? forma.r : forma.rx;
      const ry = forma.tipo === 'circulo' ? forma.r : forma.ry;
      principal = trazoTembloroso(contornoRedondo(forma.cx, forma.cy, rx, ry, r), r, ESTILO.temblor * 0.8);
      trazar(principal);
    }

    // El repaso fino solo en contornos principales.
    if (principal && !forma.detalle) {
      const extra = repaso(principal, r);
      if (extra) repasos.push(silueta(extra, ESTILO.grosor.repaso, r));
    }
  });
  return { contorno, detalle: [...detalle, ...repasos] };
}

/** El dibujo como un solo <path> relleno: todas las siluetas en un trazado. */
export function piezasSvg({ contorno, detalle }) {
  const d = [...contorno, ...detalle].join('');
  return d ? `<path d="${d}"/>` : '';
}

/** Atributos de la raíz de un icono: relleno en currentColor (cada trazo es su silueta). */
export const RAIZ = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"';

/** SVG completo de un dibujo. */
export function svgDeDibujo(dibujo) {
  return `<svg ${RAIZ}>${piezasSvg(dibujo)}</svg>`;
}

/**
 * Una forma tal como la dibuja quien diseña, sin el estilo: para las guías y el editor.
 * @param {Forma} f
 * @param {string} [extra]  Atributos añadidos (class, data-*…).
 */
export function formaLimpia(f, extra = '') {
  const a = extra ? ` ${extra}` : '';
  if (f.tipo === 'trazo') return `<polyline points="${f.puntos.map((p) => `${p[0]},${p[1]}`).join(' ')}"${a}/>`;
  if (f.tipo === 'linea') return `<${f.cerrada ? 'polygon' : 'polyline'} points="${f.puntos.map((p) => p.join(',')).join(' ')}"${a}/>`;
  if (f.tipo === 'rect') return `<rect x="${f.x}" y="${f.y}" width="${f.ancho}" height="${f.alto}" rx="${f.radio ?? 0}"${a}/>`;
  if (f.tipo === 'circulo') return `<circle cx="${f.cx}" cy="${f.cy}" r="${f.r}"${a}/>`;
  if (f.tipo === 'elipse') return `<ellipse cx="${f.cx}" cy="${f.cy}" rx="${f.rx}" ry="${f.ry}"${a}/>`;
  return '';
}
