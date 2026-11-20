import { describe, expect, it } from 'vitest';
import { diffStats, lineDiff, withContext } from './diff.js';

describe('lineDiff', () => {
  it('marca las líneas añadidas, quitadas e iguales en orden', () => {
    const before = 'a\nb\nc\nd';
    const after = 'a\nB\nc\nd\ne';
    expect(lineDiff(before, after)).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'del', text: 'b' },
      { kind: 'add', text: 'B' },
      { kind: 'same', text: 'c' },
      { kind: 'same', text: 'd' },
      { kind: 'add', text: 'e' },
    ]);
  });

  it('un archivo vacío es todo añadido o todo quitado', () => {
    expect(lineDiff('', 'x\ny')).toEqual([
      { kind: 'add', text: 'x' },
      { kind: 'add', text: 'y' },
    ]);
    expect(lineDiff('x', '')).toEqual([{ kind: 'del', text: 'x' }]);
  });

  it('ignora el salto de línea final', () => {
    expect(diffStats(lineDiff('a\nb\n', 'a\nb'))).toEqual({ added: 0, removed: 0 });
  });
});

describe('withContext', () => {
  it('deja dos líneas de contexto y resume las demás', () => {
    const before = Array.from({ length: 10 }, (_, i) => `l${i}`).join('\n');
    const after = before.replace('l5', 'L5');
    const out = withContext(lineDiff(before, after));
    expect(out[0]).toEqual({ kind: 'skip', count: 3 });
    expect(out.filter((l) => l.kind === 'same').map((l) => l.text)).toEqual(['l3', 'l4', 'l6', 'l7']);
    expect(out.at(-1)).toEqual({ kind: 'skip', count: 2 });
  });
});
