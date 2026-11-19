/**
 * Receta de la paleta de angela. Es la ÚNICA fuente de verdad del color:
 *  - `scripts/build-palette.mjs` genera `src/tokens/palette.css` a partir de aquí.
 *  - `scripts/check-contrast.mjs` y los tests verifican el contraste WCAG para cualquier tono.
 *  - El playground de la documentación calcula el contraste en vivo con estas mismas cifras.
 *
 * Cada token se define por modo como [luminosidad OKLCH, factor de croma].
 * El croma final es `croma del rol × factor`, y el tono (hue) es el del rol.
 * Como la luminosidad es fija por token, el contraste no depende del tono que elijas.
 */

/** Valores por defecto de cada rol: tono (0–360) y croma (0–0.2). */
export const roles = {
  brand: { h: 262, c: 0.17 },
  neutral: { h: 262, c: 0.012 },
  success: { h: 150, c: 0.14 },
  warning: { h: 65, c: 0.14 },
  danger: { h: 25, c: 0.18 },
  info: { h: 235, c: 0.12 },
};

/** Roles con escala de "tono" (sirven para data-tone). */
export const toneRoles = ['brand', 'neutral', 'success', 'warning', 'danger', 'info'];

/** Croma máximo admitido: hasta aquí está garantizado el contraste en cualquier tono. */
export const MAX_CHROMA = 0.2;

/** Tokens de tono: se generan para cada rol cromático. */
export const toneRecipe = {
  solid: { light: [0.5, 1], dark: [0.74, 0.9] },
  'solid-hover': { light: [0.44, 1], dark: [0.8, 0.8] },
  'on-solid': { light: [0.995, 0], dark: [0.18, 0.3] },
  subtle: { light: [0.955, 0.22], dark: [0.27, 0.35] },
  'subtle-hover': { light: [0.925, 0.32], dark: [0.31, 0.45] },
  border: { light: [0.6, 0.85], dark: [0.62, 0.8] },
  text: { light: [0.46, 0.95], dark: [0.84, 0.7] },
};

/** El rol neutral usa otra receta: su "sólido" es casi negro/blanco. */
export const neutralToneRecipe = {
  solid: { light: [0.27, 1.5], dark: [0.93, 1] },
  'solid-hover': { light: [0.35, 1.5], dark: [0.86, 1] },
  'on-solid': { light: [0.99, 0], dark: [0.18, 1] },
  subtle: { light: [0.955, 1], dark: [0.27, 1] },
  'subtle-hover': { light: [0.925, 1.2], dark: [0.31, 1.2] },
  border: { light: [0.6, 1.5], dark: [0.62, 1] },
  text: { light: [0.22, 1.5], dark: [0.95, 0.6] },
};

/** Superficies y texto de la interfaz (derivan del rol neutral). */
export const surfaceRecipe = {
  canvas: { light: [0.985, 0.5], dark: [0.165, 0.8] },
  surface: { light: [1, 0], dark: [0.205, 1] },
  'surface-sunken': { light: [0.965, 1], dark: [0.145, 1] },
  'surface-hover': { light: [0.94, 1.2], dark: [0.27, 1.2] },
  text: { light: [0.22, 1.5], dark: [0.95, 0.6] },
  'text-muted': { light: [0.48, 1.5], dark: [0.74, 1] },
  border: { light: [0.905, 1], dark: [0.3, 1] },
  'border-strong': { light: [0.6, 1.5], dark: [0.62, 1] },
};

/** El anillo de foco usa el rol de marca. */
export const focusRecipe = { light: [0.5, 1], dark: [0.74, 0.9] };

/**
 * Pares que deben cumplir contraste mínimo (WCAG 2.2).
 * 4.5 = texto normal (1.4.3); 3 = componentes y bordes de controles (1.4.11).
 * Formato: [primer plano, fondo, mínimo]. Los nombres son tokens resueltos de `resolvePalette`.
 */
export function contrastPairs(toneNames = toneRoles) {
  const pairs = [
    ['text', 'canvas', 7],
    ['text', 'surface', 7],
    ['text', 'surface-sunken', 7],
    ['text-muted', 'canvas', 4.5],
    ['text-muted', 'surface', 4.5],
    ['text-muted', 'surface-sunken', 4.5],
    ['text-muted', 'surface-hover', 4.5],
    ['border-strong', 'canvas', 3],
    ['border-strong', 'surface', 3],
    ['focus', 'canvas', 3],
    ['focus', 'surface', 3],
  ];
  for (const t of toneNames) {
    pairs.push(
      [`${t}-on-solid`, `${t}-solid`, 4.5],
      [`${t}-on-solid`, `${t}-solid-hover`, 4.5],
      [`${t}-text`, 'canvas', 4.5],
      [`${t}-text`, 'surface', 4.5],
      [`${t}-text`, `${t}-subtle`, 4.5],
      [`${t}-text`, `${t}-subtle-hover`, 4.5],
      [`${t}-solid`, 'canvas', 3],
      [`${t}-solid`, 'surface', 3],
      [`${t}-border`, 'canvas', 3],
      [`${t}-border`, 'surface', 3],
    );
  }
  return pairs;
}

/* ------------------------------------------------------------------ */
/* Matemática de color (OKLCH → sRGB → luminancia relativa WCAG)       */
/* ------------------------------------------------------------------ */

/** Convierte OKLCH a sRGB lineal, recortando al gamut sRGB como hacen los navegadores. */
export function oklchToLinearSrgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  return [
    clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

export function luminance([L, C, H]) {
  const [r, g, b] = oklchToLinearSrgb(L, C, H);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * Resuelve todos los tokens a [L, C, H] para un modo.
 * @param {'light'|'dark'} mode
 * @param {Partial<typeof roles>} overrides tonos y cromas a probar
 */
export function resolvePalette(mode, overrides = {}) {
  const r = Object.fromEntries(
    Object.entries(roles).map(([k, v]) => [k, { ...v, ...(overrides[k] ?? {}) }]),
  );
  const out = {};
  const pick = (spec, role) => {
    const [L, f] = spec[mode];
    return [L, r[role].c * f, r[role].h];
  };
  for (const [name, spec] of Object.entries(surfaceRecipe)) out[name] = pick(spec, 'neutral');
  out.focus = pick(focusRecipe, 'brand');
  for (const role of toneRoles) {
    const recipe = role === 'neutral' ? neutralToneRecipe : toneRecipe;
    for (const [name, spec] of Object.entries(recipe)) out[`${role}-${name}`] = pick(spec, role);
  }
  return out;
}

/** Devuelve los pares que no cumplen el mínimo para un modo y unos valores dados. */
export function auditPalette(mode, overrides = {}) {
  const p = resolvePalette(mode, overrides);
  return contrastPairs()
    .map(([fg, bg, min]) => ({ fg, bg, min, ratio: contrastRatio(p[fg], p[bg]) }))
    .filter((r) => r.ratio < r.min);
}
