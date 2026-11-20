/**
 * Diff por líneas para enseñar qué cambia una propuesta de la IA.
 *
 * LCS clásico: los archivos de un componente son pequeños. Si alguno es enorme, se
 * muestra como sustitución completa en vez de bloquear la página.
 */

const MAX_CELLS = 4_000_000;

/**
 * @param {string} before
 * @param {string} after
 * @returns {{ kind: 'same' | 'add' | 'del', text: string }[]}
 */
export function lineDiff(before, after) {
  const a = before.replace(/\n$/, '').split('\n');
  const b = after.replace(/\n$/, '').split('\n');
  if (before === '') a.length = 0;
  if (after === '') b.length = 0;

  if (a.length * b.length > MAX_CELLS) {
    return [...a.map((text) => ({ kind: 'del', text })), ...b.map((text) => ({ kind: 'add', text }))];
  }

  // lcs[i][j] = longitud de la subsecuencia común más larga de a[i..] y b[j..].
  const lcs = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ kind: 'same', text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push({ kind: 'del', text: a[i++] });
    } else {
      out.push({ kind: 'add', text: b[j++] });
    }
  }
  while (i < a.length) out.push({ kind: 'del', text: a[i++] });
  while (j < b.length) out.push({ kind: 'add', text: b[j++] });
  return out;
}

/**
 * Deja solo los cambios y unas líneas de contexto alrededor; lo demás se resume.
 * @param {ReturnType<typeof lineDiff>} diff
 * @param {number} [context=2]
 * @returns {({ kind: 'same' | 'add' | 'del', text: string } | { kind: 'skip', count: number })[]}
 */
export function withContext(diff, context = 2) {
  const keep = diff.map(() => false);
  diff.forEach((line, index) => {
    if (line.kind === 'same') return;
    for (let k = Math.max(0, index - context); k <= Math.min(diff.length - 1, index + context); k++) keep[k] = true;
  });
  const out = [];
  let skipped = 0;
  diff.forEach((line, index) => {
    if (keep[index]) {
      if (skipped) out.push({ kind: 'skip', count: skipped });
      skipped = 0;
      out.push(line);
    } else {
      skipped++;
    }
  });
  if (skipped) out.push({ kind: 'skip', count: skipped });
  return out;
}

/** Cuántas líneas se añaden y se quitan. */
export const diffStats = (diff) => ({
  added: diff.filter((l) => l.kind === 'add').length,
  removed: diff.filter((l) => l.kind === 'del').length,
});
