/**
 * Taller de temas: el estado de un tema (color de cada rol, forma y tipografía), sus presets,
 * el CSS que se exporta, el enlace para compartirlo y la auditoría de contraste.
 *
 * El contraste se calcula con palette.js, la misma receta que genera palette.css y que verifica
 * `pnpm check:contrast`: lo que dice el taller es lo que dice el CI.
 */
import { MAX_CHROMA, contrastPairs, contrastRatio, resolvePalette, roles } from '@angela-ui/angela/palette';

export const ROLES = ['brand', 'neutral', 'success', 'warning', 'danger', 'info'];
export const NOMBRES_ROL = {
  brand: 'Marca',
  neutral: 'Neutro',
  success: 'Éxito',
  warning: 'Aviso',
  danger: 'Peligro',
  info: 'Información',
};
/** El neutro admite menos croma: con más, los grises dejan de parecer grises. */
export const MAX_CROMA = { neutral: 0.08 };
export { MAX_CHROMA };

/** Escala de radios: los tres tokens se multiplican a la vez (los contenedores siguen más redondeados que los controles). */
export const FORMAS = [
  { id: 'recta', nombre: 'Recta', factor: 0.4 },
  { id: 'moderada', nombre: 'Moderada', factor: 1 },
  { id: 'suave', nombre: 'Suave', factor: 1.75 },
];
const RADIOS = { sm: 0.25, md: 0.375, lg: 0.5 };

/** Tipografías del sistema (sin descargar fuentes): pilas de modernfontstacks.com. */
export const FUENTES = [
  { id: 'sistema', nombre: 'Sistema', pila: null },
  { id: 'humanista', nombre: 'Humanista', pila: "Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', source-sans-pro, sans-serif" },
  { id: 'geometrica', nombre: 'Geométrica', pila: "Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif" },
  { id: 'redondeada', nombre: 'Redondeada', pila: "ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, Manjari, 'Arial Rounded MT', 'Arial Rounded MT Bold', Calibri, source-sans-pro, sans-serif" },
  { id: 'serif', nombre: 'Con serifa', pila: "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif" },
];

const redondear = (n, decimales) => Number(Number(n).toFixed(decimales));

/** @typedef {{ roles: Record<string, { h: number, c: number }>, neutroSigueMarca: boolean, forma: string, fuente: string }} Tema */

/** @returns {Tema} */
export const temaPorDefecto = () => ({
  roles: structuredClone(roles),
  neutroSigueMarca: true,
  forma: 'moderada',
  fuente: 'sistema',
});

const preset = (id, nombre, r, extra = {}) => ({
  id,
  nombre,
  tema: normalizar({ ...temaPorDefecto(), ...extra, roles: { ...structuredClone(roles), ...r } }),
});

/** Presets: puntos de partida, todos con contraste AA garantizado. */
export const PRESETS = [
  preset('angela', 'angela', {}),
  preset(
    'plano',
    'Plano',
    { brand: { h: 78, c: 0.11 }, neutral: { h: 262, c: 0.06 }, info: { h: 215, c: 0.12 }, warning: { h: 50, c: 0.14 }, danger: { h: 18, c: 0.18 } },
    { neutroSigueMarca: false, forma: 'recta' },
  ),
  preset('oceano', 'Océano', { brand: { h: 222, c: 0.14 }, neutral: { h: 222, c: 0.02 }, success: { h: 168, c: 0.13 }, info: { h: 200, c: 0.12 } }),
  preset('bosque', 'Bosque', { brand: { h: 152, c: 0.12 }, neutral: { h: 140, c: 0.015 }, success: { h: 132, c: 0.14 }, warning: { h: 80, c: 0.14 } }, { fuente: 'humanista' }),
  preset('atardecer', 'Atardecer', { brand: { h: 38, c: 0.17 }, neutral: { h: 45, c: 0.015 }, danger: { h: 15, c: 0.19 }, info: { h: 255, c: 0.12 } }, { forma: 'suave' }),
  preset('uva', 'Uva', { brand: { h: 305, c: 0.16 }, neutral: { h: 305, c: 0.02 } }, { forma: 'suave', fuente: 'redondeada' }),
  preset('grafito', 'Grafito', { brand: { h: 262, c: 0.03 }, neutral: { h: 262, c: 0.005 } }, { forma: 'recta', fuente: 'geometrica' }),
  preset('editorial', 'Editorial', { brand: { h: 18, c: 0.14 }, neutral: { h: 60, c: 0.012 } }, { fuente: 'serif' }),
];

/** Limita un tema a lo que garantiza el contraste y a valores con sentido. */
export function normalizar(tema) {
  const base = temaPorDefecto();
  const t = { ...base, ...tema, roles: { ...base.roles } };
  for (const rol of ROLES) {
    const r = tema?.roles?.[rol] ?? base.roles[rol];
    const h = ((redondear(r.h, 0) % 360) + 360) % 360;
    const c = Math.min(Math.max(redondear(r.c, 3), 0), MAX_CROMA[rol] ?? MAX_CHROMA);
    t.roles[rol] = { h: Number.isFinite(h) ? h : base.roles[rol].h, c: Number.isFinite(c) ? c : base.roles[rol].c };
  }
  if (t.neutroSigueMarca) t.roles.neutral.h = t.roles.brand.h;
  if (!FORMAS.some((f) => f.id === t.forma)) t.forma = base.forma;
  if (!FUENTES.some((f) => f.id === t.fuente)) t.fuente = base.fuente;
  t.neutroSigueMarca = Boolean(t.neutroSigueMarca);
  return t;
}

/**
 * Las variables CSS del tema. Con `soloCambios`, solo las que difieren de angela por defecto:
 * es lo que alguien pega en su CSS.
 * @returns {[string, string][]}
 */
export function variables(tema, { soloCambios = false } = {}) {
  const t = normalizar(tema);
  const base = temaPorDefecto();
  const lista = [];
  for (const rol of ROLES) {
    const r = t.roles[rol];
    const sigue = rol === 'neutral' && t.neutroSigueMarca;
    if (!sigue && (!soloCambios || r.h !== base.roles[rol].h)) lista.push([`--angela-${rol}-h`, String(r.h)]);
    if (!soloCambios || r.c !== base.roles[rol].c) lista.push([`--angela-${rol}-c`, String(r.c)]);
  }
  if (!soloCambios && t.neutroSigueMarca) lista.push(['--angela-neutral-h', 'var(--angela-brand-h)']);
  const forma = FORMAS.find((f) => f.id === t.forma);
  if (!soloCambios || forma.factor !== 1) {
    for (const [k, v] of Object.entries(RADIOS)) lista.push([`--radius-${k}`, `${redondear(v * forma.factor, 3)}rem`]);
  }
  const fuente = FUENTES.find((f) => f.id === t.fuente);
  if (fuente.pila) lista.push(['--font-body', fuente.pila]);
  return lista;
}

/** El CSS para pegar en el proyecto. */
export function cssDelTema(tema, selector = ':root') {
  const lista = variables(tema, { soloCambios: true });
  if (!lista.length) return `/* Es angela tal cual: no necesitas sobrescribir nada. */`;
  return `${selector} {\n${lista.map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`;
}

/* ---------- Enlace para compartir ---------- */

/** El tema en el hash de la URL: #brand=222,0.14&forma=suave… (solo lo que cambia). */
export function aHash(tema) {
  const t = normalizar(tema);
  const base = temaPorDefecto();
  const p = new URLSearchParams();
  for (const rol of ROLES) {
    const r = t.roles[rol];
    if (r.h !== base.roles[rol].h || r.c !== base.roles[rol].c) p.set(rol, `${r.h},${r.c}`);
  }
  if (!t.neutroSigueMarca) p.set('neutro', 'propio');
  if (t.forma !== base.forma) p.set('forma', t.forma);
  if (t.fuente !== base.fuente) p.set('fuente', t.fuente);
  return p.toString();
}

export function desdeHash(hash) {
  const p = new URLSearchParams(String(hash).replace(/^#/, ''));
  const t = temaPorDefecto();
  for (const rol of ROLES) {
    const v = p.get(rol);
    if (!v) continue;
    const [h, c] = v.split(',').map(Number);
    t.roles[rol] = { h, c };
  }
  t.neutroSigueMarca = p.get('neutro') !== 'propio';
  t.forma = p.get('forma') ?? t.forma;
  t.fuente = p.get('fuente') ?? t.fuente;
  return normalizar(t);
}

/* ---------- Inspírame ---------- */

/**
 * Un tema al azar que respeta el significado de los colores: la marca y el neutro son libres; éxito,
 * aviso, peligro e información se mueven poco alrededor de su tono (verde, ámbar, rojo, azul).
 * @param {() => number} azar  Math.random por defecto (inyectable en los tests)
 */
export function inspirame(azar = Math.random) {
  const entre = (a, b) => a + (b - a) * azar();
  const marca = Math.round(entre(0, 360));
  return normalizar({
    roles: {
      brand: { h: marca, c: entre(0.08, 0.19) },
      neutral: { h: marca, c: entre(0.005, 0.03) },
      success: { h: Math.round(entre(135, 165)), c: entre(0.11, 0.16) },
      warning: { h: Math.round(entre(55, 80)), c: entre(0.12, 0.16) },
      danger: { h: Math.round(entre(15, 30)), c: entre(0.15, 0.19) },
      info: { h: Math.round(entre(210, 250)), c: entre(0.1, 0.14) },
    },
    neutroSigueMarca: azar() < 0.7,
    forma: FORMAS[Math.floor(azar() * FORMAS.length)].id,
    fuente: FUENTES[Math.floor(azar() * FUENTES.length)].id,
  });
}

/* ---------- Contraste ---------- */

/** Nombre legible de un token de la receta (`brand-on-solid` → «Marca · sobre sólido»). */
const TOKENS = {
  canvas: 'fondo de página',
  surface: 'superficie',
  'surface-sunken': 'superficie hundida',
  'surface-hover': 'superficie al pasar',
  text: 'texto',
  'text-muted': 'texto secundario',
  border: 'borde',
  'border-strong': 'borde de controles',
  focus: 'foco',
  solid: 'sólido',
  'solid-hover': 'sólido al pasar',
  'on-solid': 'texto sobre sólido',
  subtle: 'suave',
  'subtle-hover': 'suave al pasar',
  'text-tone': 'texto',
};
export function nombreToken(token) {
  if (TOKENS[token]) return TOKENS[token];
  const [rol, ...resto] = token.split('-');
  const parte = resto.join('-');
  return NOMBRES_ROL[rol] ? `${NOMBRES_ROL[rol]} · ${TOKENS[parte === 'text' ? 'text-tone' : parte] ?? parte}` : token;
}

/**
 * Todos los pares de contraste del tema, en claro y en oscuro.
 * @returns {{ modo: 'light' | 'dark', fg: string, bg: string, min: number, ratio: number, cumple: boolean }[]}
 */
export function auditoria(tema) {
  const t = normalizar(tema);
  const overrides = Object.fromEntries(ROLES.map((rol) => [rol, t.roles[rol]]));
  return ['light', 'dark'].flatMap((modo) => {
    const p = resolvePalette(modo, overrides);
    return contrastPairs().map(([fg, bg, min]) => {
      const ratio = contrastRatio(p[fg], p[bg]);
      return { modo, fg, bg, min, ratio, cumple: ratio >= min };
    });
  });
}
