/**
 * La guía de los iconos de angela, en código. La usan el build (no publica un icono que la
 * incumpla), el editor de iconos (avisa mientras se dibuja) y la revisión de los PR.
 *
 * Un icono son formas limpias sobre una cuadrícula de 24×24 (su fuente, en JSON). El estilo
 * a mano alzada lo pone mano-alzada.js al generar el SVG: aquí se comprueban las formas.
 *
 * Sin dependencias y sin DOM: funciona igual en Node que en el navegador.
 */

/** Zona segura: las formas viven aquí. Fuera, el trazo tocaría el borde a 16 px. */
export const ZONA = { min: 2, max: 22 };
/** Por debajo de esto, a 16 px la forma se queda en un punto. */
export const MINIMO = 1;
export const MAX_FORMAS = 12;
export const TIPOS = ['linea', 'rect', 'circulo', 'elipse'];

export const CATEGORIAS = [
  'interfaz',
  'acciones',
  'estado',
  'flechas',
  'archivos',
  'comercio',
  'comunicacion',
  'educacion',
  'multimedia',
  'dispositivos',
  'tiempo',
  'personas',
  'lugares',
  'naturaleza',
];

/** La guía para personas: el editor y la página «Iconos» la muestran tal cual. */
export const GUIA = [
  { id: 'lienzo', titulo: 'Cuadrícula de 24×24', texto: 'Se dibuja sobre 24×24 con imán a medio píxel. El tamaño final lo pone quien usa el icono.' },
  { id: 'zona', titulo: 'Zona segura de 2 a 22', texto: 'Las formas dejan 2 px de margen, para que a 16 px el trazo no toque el borde.' },
  { id: 'formas', titulo: 'Formas limpias', texto: 'Líneas, rectángulos, círculos y elipses exactos. El carácter de dibujo lo pone el estilo, no la mano: así todos los iconos tienen la misma letra.' },
  { id: 'trazo', titulo: 'Dos trazos', texto: 'Contorno para la silueta y detalle (más fino) para lo interior: renglones, brillos, texturas.' },
  { id: 'tamano', titulo: 'Nada demasiado pequeño', texto: `Ninguna forma por debajo de ${MINIMO} px: a 16 px se quedaría en un punto. Huecos de al menos 2 px.` },
  { id: 'sencillez', titulo: 'Sencillo', texto: `Pocas formas (${MAX_FORMAS} como mucho): tiene que leerse a 16 px.` },
  { id: 'nombre', titulo: 'Nombre y etiquetas', texto: 'Nombre en inglés y kebab-case (shopping-cart); etiquetas en español e inglés para encontrarlo.' },
];

/* ---------- Geometría ---------- */

const numero = (n) => typeof n === 'number' && Number.isFinite(n);

/** Puntos que definen una forma (para la caja y los decimales). */
export function puntosDeForma(f) {
  if (f.tipo === 'linea') return f.puntos ?? [];
  if (f.tipo === 'rect') return [[f.x, f.y], [f.x + f.ancho, f.y + f.alto]];
  if (f.tipo === 'circulo') return [[f.cx - f.r, f.cy - f.r], [f.cx + f.r, f.cy + f.r]];
  if (f.tipo === 'elipse') return [[f.cx - f.rx, f.cy - f.ry], [f.cx + f.rx, f.cy + f.ry]];
  return [];
}

/**
 * Medida que decide si una forma se verá a 16 px: el lado corto de un rectángulo, el diámetro
 * de un círculo o, en una línea, su tramo más largo (si todos son minúsculos, es un punto).
 */
export function medidaMinima(f) {
  if (f.tipo === 'linea') {
    const p = f.puntos ?? [];
    const tramos = p.slice(1).map((q, i) => Math.hypot(q[0] - p[i][0], q[1] - p[i][1]));
    return tramos.length ? Math.max(...tramos) : 0;
  }
  if (f.tipo === 'rect') return Math.min(f.ancho, f.alto);
  if (f.tipo === 'circulo') return f.r * 2;
  if (f.tipo === 'elipse') return Math.min(f.rx, f.ry) * 2;
  return 0;
}

/** ¿Es una forma bien construida? Devuelve el problema o null. */
function problemaDeForma(f) {
  if (!f || typeof f !== 'object' || !TIPOS.includes(f.tipo)) return `tipo desconocido (${f?.tipo ?? 'ninguno'})`;
  if (f.detalle !== undefined && typeof f.detalle !== 'boolean') return 'detalle tiene que ser true o false';
  if (f.tipo === 'linea') {
    if (!Array.isArray(f.puntos) || f.puntos.length < 2) return 'una línea necesita al menos 2 puntos';
    if (!f.puntos.every((p) => Array.isArray(p) && p.length === 2 && p.every(numero))) return 'hay un punto que no son dos números';
    if (f.cerrada !== undefined && typeof f.cerrada !== 'boolean') return 'cerrada tiene que ser true o false';
    return null;
  }
  const campos = { rect: ['x', 'y', 'ancho', 'alto'], circulo: ['cx', 'cy', 'r'], elipse: ['cx', 'cy', 'rx', 'ry'] }[f.tipo];
  if (!campos.every((k) => numero(f[k]))) return `le faltan medidas (${campos.join(', ')})`;
  if (f.tipo === 'rect' && f.radio !== undefined && !(numero(f.radio) && f.radio >= 0)) return 'el radio tiene que ser un número positivo';
  if (['ancho', 'alto', 'r', 'rx', 'ry'].some((k) => f[k] !== undefined && f[k] <= 0)) return 'tiene una medida de 0 o negativa';
  return null;
}

/* ---------- Revisión ---------- */

/**
 * Comprueba un icono contra la guía.
 * @param {{ formas?: unknown[], categoria?: string, etiquetas?: string[], licencia?: string }} icono
 * @param {{ nombre?: string }} [extra]
 * @returns {{ nivel: 'error' | 'aviso', regla: string, texto: string, forma?: number }[]}
 */
export function revisarIcono(icono, { nombre } = {}) {
  const hallazgos = [];
  const error = (regla, texto, forma) => hallazgos.push({ nivel: 'error', regla, texto, ...(forma !== undefined && { forma }) });
  const aviso = (regla, texto, forma) => hallazgos.push({ nivel: 'aviso', regla, texto, ...(forma !== undefined && { forma }) });

  const formas = Array.isArray(icono?.formas) ? icono.formas : null;
  if (!formas) {
    error('formas', 'El icono no tiene formas.');
    return hallazgos;
  }
  if (!formas.length) error('formas', 'El icono está vacío: dibuja al menos una forma.');
  if (formas.length > MAX_FORMAS) aviso('sencillez', `Tiene ${formas.length} formas: con más de ${MAX_FORMAS} cuesta leerlo a 16 px.`);
  if (formas.length && formas.every((f) => f?.detalle)) aviso('trazo', 'Todo es trazo de detalle: la silueta del icono necesita al menos una forma de contorno.');

  const r = (n) => Math.round(n * 100) / 100;
  formas.forEach((f, i) => {
    const n = i + 1;
    const problema = problemaDeForma(f);
    if (problema) {
      error('formas', `La forma ${n}: ${problema}.`, i);
      return;
    }
    const puntos = puntosDeForma(f);
    const xs = puntos.map((p) => p[0]);
    const ys = puntos.map((p) => p[1]);
    const [min, max] = [Math.min(...xs, ...ys), Math.max(...xs, ...ys)];
    if (min < ZONA.min || max > ZONA.max) error('zona', `La forma ${n} sale de la zona segura (llega de ${r(min)} a ${r(max)}; tiene que estar entre ${ZONA.min} y ${ZONA.max}).`, i);
    if (medidaMinima(f) < MINIMO) aviso('tamano', `La forma ${n} mide menos de ${MINIMO} px: a 16 px se quedará en un punto.`, i);
    const sucios = [...puntos.flat(), f.radio].filter((v) => numero(v) && (String(v).split('.')[1] ?? '').length > 2);
    if (sucios.length) aviso('lienzo', `La forma ${n} tiene medidas con más de 2 decimales (${sucios.slice(0, 2).join(', ')}): usa la cuadrícula.`, i);
  });

  if (nombre !== undefined && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(nombre)) error('nombre', `«${nombre}» no vale como nombre: en inglés, minúsculas y guiones (shopping-cart).`);
  if (icono.categoria !== undefined || icono.etiquetas !== undefined) {
    if (!CATEGORIAS.includes(icono.categoria)) error('nombre', `Elige una categoría: ${CATEGORIAS.join(', ')}.`);
    if (!Array.isArray(icono.etiquetas) || icono.etiquetas.filter((e) => String(e).trim()).length < 2) aviso('nombre', 'Añade al menos 2 etiquetas (en español e inglés) para que se pueda encontrar.');
  }
  return hallazgos;
}
