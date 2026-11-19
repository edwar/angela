import { describe, expect, it } from 'vitest';
import { auditPalette, contrastRatio, MAX_CHROMA, roles } from './palette.js';

describe('contrastRatio', () => {
  it('blanco sobre negro es 21:1', () => {
    expect(contrastRatio([1, 0, 0], [0, 0, 0])).toBeCloseTo(21, 0);
  });
  it('un color contra sí mismo es 1:1', () => {
    expect(contrastRatio([0.5, 0.1, 200], [0.5, 0.1, 200])).toBeCloseTo(1, 5);
  });
});

describe('paleta', () => {
  for (const mode of ['light', 'dark']) {
    it(`los valores por defecto cumplen WCAG AA en modo ${mode}`, () => {
      expect(auditPalette(mode)).toEqual([]);
    });

    it(`cualquier tono y croma ≤ ${MAX_CHROMA} cumple WCAG AA en modo ${mode}`, () => {
      const failures = [];
      for (let h = 0; h < 360; h += 10) {
        for (const c of [0, MAX_CHROMA / 2, MAX_CHROMA]) {
          const o = {};
          for (const k of Object.keys(roles)) o[k] = { h, c: k === 'neutral' ? Math.min(c, 0.03) : c };
          failures.push(...auditPalette(mode, o).map((f) => ({ ...f, h, c })));
        }
      }
      expect(failures).toEqual([]);
    });
  }
});
