'use client';

import { angela } from '@angela-ui/angela/js';
import { useEffect } from 'react';

export interface AngelaOptions {
  /** Cargar polyfills de command/commandfor y popover solo donde falten (por defecto sí). */
  polyfills?: boolean;
}

/**
 * Activa la capa JS de angela en el cliente: validación accesible, pestañas, diálogos,
 * popovers, selector de tema y polyfills. Escucha en el documento, así cubre también lo que
 * se monte después (rutas, modales).
 */
export function useAngela({ polyfills = true }: AngelaOptions = {}) {
  useEffect(() => angela({ polyfills }), [polyfills]);
}

/** Igual que `useAngela`, como componente. Ponlo una vez en el layout raíz. */
export function Angela(options: AngelaOptions) {
  useAngela(options);
  return null;
}
