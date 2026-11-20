export function enhanceNota(root = globalThis.document) {
  if (typeof window === 'undefined' || !root) return () => {};
  // No listeners needed para este componente, pero se mantiene la firma.
  return () => {};
}
