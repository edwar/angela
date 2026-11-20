import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { medidaMinima, puntosDeForma, revisarIcono } from './reglas.js';

const icono = (formas, extra = {}) => ({ formas, categoria: 'interfaz', etiquetas: ['cerrar', 'close'], ...extra });
const reglas = (i, nombre) => revisarIcono(i, { nombre }).map((h) => `${h.nivel}:${h.regla}`);
const linea = (...puntos) => ({ tipo: 'linea', puntos });

describe('geometría de las formas', () => {
  it('saca los puntos que definen cada forma', () => {
    expect(puntosDeForma({ tipo: 'rect', x: 4, y: 5, ancho: 10, alto: 6 })).toEqual([[4, 5], [14, 11]]);
    expect(puntosDeForma({ tipo: 'circulo', cx: 12, cy: 12, r: 10 })).toEqual([[2, 2], [22, 22]]);
  });

  it('mide si una forma se verá a 16 px', () => {
    expect(medidaMinima(linea([4, 4], [4.5, 4], [12, 4]))).toBe(7.5);
    expect(medidaMinima({ tipo: 'circulo', cx: 12, cy: 12, r: 0.4 })).toBe(0.8);
  });
});

describe('revisarIcono', () => {
  it('un icono que sigue la guía no tiene hallazgos', () => {
    expect(revisarIcono(icono([linea([5, 12], [19, 12]), linea([12, 5], [12, 19])]), { nombre: 'plus' })).toEqual([]);
  });

  it('formas mal construidas son error y dicen cuál es', () => {
    const h = revisarIcono(icono([linea([5, 12], [19, 12]), { tipo: 'triangulo' }, linea([4, 4]), { tipo: 'rect', x: 4, y: 4, ancho: 0, alto: 3 }]));
    expect(h.filter((x) => x.nivel === 'error').map((x) => x.forma)).toEqual([1, 2, 3]);
    expect(h[0].texto).toContain('La forma 2');
  });

  it('las formas viven en la zona segura (2–22)', () => {
    expect(reglas(icono([linea([2, 2], [22, 22])]))).toEqual([]);
    expect(reglas(icono([linea([1.5, 12], [20, 12])]))).toEqual(['error:zona']);
    expect(reglas(icono([{ tipo: 'circulo', cx: 12, cy: 12, r: 10.5 }]))).toEqual(['error:zona']);
  });

  it('avisa de lo demasiado pequeño, de los decimales y de los excesos', () => {
    expect(reglas(icono([linea([4, 4], [4.5, 4])]))).toEqual(['aviso:tamano']);
    expect(reglas(icono([linea([4.123, 4], [9, 4])]))).toEqual(['aviso:lienzo']);
    expect(reglas(icono(Array.from({ length: 13 }, (_, i) => linea([4, 4 + i], [9, 4 + i]))))).toEqual(['aviso:sencillez']);
    expect(reglas(icono([{ ...linea([4, 4], [9, 4]), detalle: true }]))).toEqual(['aviso:trazo']);
  });

  it('vacío o sin formas es error', () => {
    expect(reglas(icono([]))).toEqual(['error:formas']);
    expect(reglas({})).toEqual(['error:formas']);
  });

  it('nombre en kebab-case y metadatos', () => {
    expect(reglas(icono([linea([4, 4], [9, 4])]), 'Mi Icono')).toEqual(['error:nombre']);
    expect(reglas(icono([linea([4, 4], [9, 4])], { categoria: 'otra', etiquetas: ['a'] }))).toEqual(['error:nombre', 'aviso:nombre']);
  });
});

describe('los iconos del repositorio', () => {
  const dir = new URL('../iconos/', import.meta.url);
  const nombres = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));

  it.each(nombres)('%s cumple la guía', (nombre) => {
    const i = JSON.parse(readFileSync(new URL(`${nombre}.json`, dir), 'utf8'));
    expect(revisarIcono(i, { nombre }).filter((h) => h.nivel === 'error')).toEqual([]);
    expect(i.licencia).toBeTruthy();
    expect(i.autor).toBeTruthy();
  });
});

describe('trazo libre', () => {
  it('acepta puntos con y sin presión', () => {
    expect(revisarIcono({ formas: [{ tipo: 'trazo', puntos: [[4, 4, 0.3], [12, 12, 0.8], [20, 6]] }] })).toEqual([]);
  });
  it('rechaza una presión fuera de 0–1 y avisa si tiene demasiados puntos', () => {
    expect(revisarIcono({ formas: [{ tipo: 'trazo', puntos: [[4, 4, 2], [12, 12, 0.8]] }] })[0]).toMatchObject({ nivel: 'error', regla: 'formas' });
    const largo = { tipo: 'trazo', puntos: Array.from({ length: 301 }, (_, k) => [4 + (k % 160) * 0.1, 4 + Math.floor(k / 160)]) };
    expect(revisarIcono({ formas: [largo] }).map((h) => h.regla)).toContain('lapiz');
  });
});
