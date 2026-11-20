import { describe, expect, it } from 'vitest';
import { dibujar, piezasSvg, svgDeDibujo } from './mano-alzada.js';

const casa = [
  { tipo: 'linea', puntos: [[3, 11], [12, 3.5], [21, 11]] },
  { tipo: 'rect', x: 10, y: 14.5, ancho: 4, alto: 6 },
  { tipo: 'circulo', cx: 12, cy: 12, r: 3 },
  { tipo: 'linea', puntos: [[8, 8], [16, 8]], detalle: true },
];
const numeros = (d) => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
/** Puntos de las siluetas: los vértices de cada subtrazado (M y Q). */
const siluetas = (d) => d.split('M').filter(Boolean).map((sub) => {
  const n = numeros(sub);
  const pts = [];
  for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]]);
  return pts;
});
const area = (pts) => pts.reduce((s, p, i) => s + p[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * p[1], 0) / 2;

describe('dibujar a mano alzada', () => {
  it('es determinista: la misma forma y semilla dan el mismo trazo', () => {
    expect(piezasSvg(dibujar(casa, { semilla: 'house' }))).toBe(piezasSvg(dibujar(casa, { semilla: 'house' })));
  });

  it('otra semilla da otro trazo (cada icono tiene el suyo)', () => {
    expect(piezasSvg(dibujar(casa, { semilla: 'house' }))).not.toBe(piezasSvg(dibujar(casa, { semilla: 'home' })));
  });

  it('separa contorno y detalle, y el resultado es un solo <path> relleno', () => {
    const d = dibujar(casa, { semilla: 'x' });
    expect(d.contorno.length).toBeGreaterThanOrEqual(4);
    expect(d.detalle.length).toBeGreaterThanOrEqual(1);
    const svg = svgDeDibujo(d);
    expect(svg).toMatch(/^<svg [^>]*fill="currentColor"><path d="[^"]+"\/><\/svg>$/);
    expect(svg).not.toContain('stroke');
  });

  it('nada sale del lienzo de 24', () => {
    const todos = numeros(piezasSvg(dibujar(casa, { semilla: 'x' })));
    expect(Math.min(...todos)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...todos)).toBeLessThanOrEqual(24);
  });

  it('todas las siluetas giran en el mismo sentido: los cruces no dejan huecos', () => {
    const d = piezasSvg(dibujar(casa, { semilla: 'x' })).match(/d="([^"]+)"/)[1];
    const signos = siluetas(d).map((pts) => Math.sign(area(pts)));
    expect(new Set(signos).size).toBe(1);
  });

  it('presión: el trazo es más fino en las puntas que en medio', () => {
    // Una línea horizontal larga: el grosor es la distancia vertical entre los dos bordes.
    const [sil] = siluetas(dibujar([{ tipo: 'linea', puntos: [[3, 12], [21, 12]] }], { semilla: 'p' }).contorno[0]);
    // Corta la silueta con la vertical x: el grosor es la distancia entre los dos cortes.
    const grosorEn = (x) => {
      const cortes = [];
      sil.forEach((p, i) => {
        const q = sil[(i + 1) % sil.length];
        if ((p[0] - x) * (q[0] - x) <= 0 && p[0] !== q[0]) cortes.push(p[1] + ((x - p[0]) / (q[0] - p[0])) * (q[1] - p[1]));
      });
      return Math.max(...cortes) - Math.min(...cortes);
    };
    expect(grosorEn(12)).toBeGreaterThan(grosorEn(4) + 0.15);
    expect(grosorEn(12)).toBeLessThanOrEqual(1.3);
  });
});

describe('trazo libre con presión', () => {
  // Un trazo horizontal: presión baja a la izquierda, alta a la derecha.
  const conPresion = (f) => ({ tipo: 'trazo', puntos: Array.from({ length: 37 }, (_, k) => [3 + k * 0.5, 12, f(k / 36)]) });
  const grosores = (forma) => {
    const [sil] = siluetas(dibujar([forma], { semilla: 't' }).contorno[0]);
    return (x) => {
      const cortes = [];
      sil.forEach((p, i) => {
        const q = sil[(i + 1) % sil.length];
        if ((p[0] - x) * (q[0] - x) <= 0 && p[0] !== q[0]) cortes.push(p[1] + ((x - p[0]) / (q[0] - p[0])) * (q[1] - p[1]));
      });
      return Math.max(...cortes) - Math.min(...cortes);
    };
  };

  it('la presión real decide el grosor: apretar más engorda el trazo', () => {
    const g = grosores(conPresion((t) => 0.2 + 0.6 * t));
    expect(g(16)).toBeGreaterThan(g(8) + 0.2);
  });

  it('sigue dentro del rango de la guía y con las puntas finas, apriete lo que apriete', () => {
    const g = grosores(conPresion(() => 1));
    // Toda la presión al máximo: el normalizado no tiene rango y se usa la curva.
    expect(g(12)).toBeLessThanOrEqual(1.3);
    const fuerte = grosores(conPresion((t) => (t < 0.5 ? 0.3 : 0.95)));
    expect(fuerte(20.8)).toBeLessThan(fuerte(16));
    expect(fuerte(16)).toBeLessThanOrEqual(1.3);
  });

  it('se normaliza por icono: apretar poco o mucho da el mismo dibujo', () => {
    const suave = piezasSvg(dibujar([conPresion((t) => 0.1 + 0.2 * t)], { semilla: 't' }));
    const fuerte = piezasSvg(dibujar([conPresion((t) => 0.5 + 0.4 * t)], { semilla: 't' }));
    expect(suave).toBe(fuerte);
  });

  it('sin presión (ratón) sigue la curva de la guía, igual que sin el dato', () => {
    const raton = { tipo: 'trazo', puntos: conPresion(() => 0.5).puntos };
    const sinDato = { tipo: 'trazo', puntos: raton.puntos.map(([x, y]) => [x, y]) };
    expect(piezasSvg(dibujar([raton], { semilla: 't' }))).toBe(piezasSvg(dibujar([sinDato], { semilla: 't' })));
  });
});
