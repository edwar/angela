import { describe, expect, it } from 'vitest';
import { nextScheme } from './theme.js';

describe('nextScheme (selector de dos estados)', () => {
  it('con el sistema en claro, alterna a oscuro y lo guarda', () => {
    expect(nextScheme('light', 'light')).toBe('dark');
  });

  it('si el destino coincide con el sistema, vuelve a "sistema" en vez de fijarlo', () => {
    expect(nextScheme('dark', 'light')).toBe('system');
    expect(nextScheme('light', 'dark')).toBe('system');
  });

  it('con el sistema en oscuro, alterna a claro y lo guarda', () => {
    expect(nextScheme('dark', 'dark')).toBe('light');
  });
});
