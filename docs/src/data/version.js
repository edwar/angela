/**
 * Versión de @angela-ui/angela que documenta el sitio, leída de su package.json para que no
 * se desincronice al publicar.
 */
import paquete from '../../../packages/angela/package.json';

/** Versión completa, p. ej. «0.2.0». */
export const VERSION = paquete.version;
/** Mayor.menor, p. ej. «0.2»: en una URL de CDN recibe las correcciones (0.2.1, 0.2.2…). */
export const VERSION_MENOR = VERSION.split('.').slice(0, 2).join('.');
