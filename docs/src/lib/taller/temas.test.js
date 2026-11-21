import { describe, expect, it } from 'vitest';
import { PRESETS, aHash, auditoria, cssDelTema, desdeHash, inspirame, nombreToken, normalizar, temaPorDefecto, variables } from './temas.js';

/** Un azar repetible para los tests (LCG). */
const semilla = (s) => () => ((s = (s * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);

describe('presets e Inspírame', () => {
  it.each(PRESETS.map((p) => [p.id, p]))('%s cumple todos los pares de contraste', (_, p) => {
    expect(auditoria(p.tema).filter((f) => !f.cumple)).toEqual([]);
  });

  it('Inspírame da temas que cumplen el contraste y respetan el significado de los colores', () => {
    const azar = semilla(42);
    for (let i = 0; i < 200; i++) {
      const t = inspirame(azar);
      expect(auditoria(t).filter((f) => !f.cumple)).toEqual([]);
      expect(t.roles.success.h).toBeGreaterThanOrEqual(135);
      expect(t.roles.success.h).toBeLessThanOrEqual(165);
      expect(t.roles.danger.h).toBeLessThanOrEqual(30);
    }
  });
});

describe('normalizar', () => {
  it('limita el croma a lo que garantiza el contraste y el tono a 0–359', () => {
    const t = normalizar({ roles: { brand: { h: 400, c: 0.5 }, neutral: { h: -10, c: 0.3 } }, neutroSigueMarca: false });
    expect(t.roles.brand).toEqual({ h: 40, c: 0.2 });
    expect(t.roles.neutral).toEqual({ h: 350, c: 0.08 });
  });

  it('el neutro sigue a la marca si así se pide', () => {
    expect(normalizar({ roles: { brand: { h: 120, c: 0.1 } }, neutroSigueMarca: true }).roles.neutral.h).toBe(120);
  });
});

describe('exportar y compartir', () => {
  it('el CSS solo lleva lo que cambia', () => {
    expect(cssDelTema(temaPorDefecto())).toMatch(/no necesitas sobrescribir nada/);
    expect(cssDelTema(normalizar({ roles: { brand: { h: 150, c: 0.17 } }, forma: 'suave', fuente: 'serif' }))).toBe(
      [
        ':root {',
        '  --angela-brand-h: 150;',
        '  --radius-sm: 0.438rem;',
        '  --radius-md: 0.656rem;',
        '  --radius-lg: 0.875rem;',
        "  --font-body: Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif;",
        '}',
      ].join('\n'),
    );
  });

  it('las variables completas fijan también el neutro a la marca', () => {
    expect(variables(temaPorDefecto())).toContainEqual(['--angela-neutral-h', 'var(--angela-brand-h)']);
  });

  it.each(PRESETS.map((p) => [p.id, p]))('el enlace de %s reproduce el mismo tema', (_, p) => {
    expect(desdeHash(aHash(p.tema))).toEqual(p.tema);
  });

  it('un enlace raro no rompe nada', () => {
    expect(desdeHash('#brand=abc&forma=triangular&fuente=comic')).toEqual(temaPorDefecto());
  });
});

describe('nombreToken', () => {
  it('pone nombre a los tokens de la receta', () => {
    expect(nombreToken('text')).toBe('texto');
    expect(nombreToken('brand-on-solid')).toBe('Marca · texto sobre sólido');
    expect(nombreToken('danger-text')).toBe('Peligro · texto');
  });
});
