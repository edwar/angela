import type { ComponentProps } from 'react';
import { cx, flag, type Tone } from './utils.js';

/* Componentes sin estado: sirven tal cual en Server Components. */

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
export type TextWeight = 'regular' | 'medium' | 'bold';

interface TypographyOptions {
  /** Tamaño visual (tokens `--fs-*`). Independiente del nivel semántico. */
  size?: TextSize;
  weight?: TextWeight;
  /** Color de un rol. Acompáñalo de texto o ícono: el estado nunca va solo en el color. */
  tone?: Tone;
  /** Texto secundario. */
  muted?: boolean;
  /** Cifras tabulares (precios, columnas de números). */
  numeric?: boolean;
  /** Una línea con "…". Solo si el texto completo está accesible en otro sitio. */
  truncate?: boolean;
  /** Corta tras N líneas con "…". Solo si el texto completo está accesible en otro sitio. */
  lines?: 2 | 3 | 4;
  align?: 'start' | 'center' | 'end';
}

function typographyAttributes({ size, weight, tone, muted, numeric, truncate, lines, align }: TypographyOptions) {
  return {
    'data-size': size,
    'data-weight': weight,
    'data-tone': tone,
    'data-muted': flag(muted),
    'data-numeric': flag(numeric),
    'data-truncate': flag(truncate),
    'data-lines': lines,
    'data-align': align,
  };
}

export interface HeadingProps extends ComponentProps<'h2'>, TypographyOptions {
  /**
   * Elemento que se renderiza: el nivel que pide el esquema de la página.
   * `p`, `span` o `div` cuando solo quieres el aspecto de título.
   */
  as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
}

/**
 * Título con el aspecto de angela. `as` es obligatorio para que el nivel sea una decisión
 * consciente: el tamaño se elige aparte con `size` (por defecto xl).
 *
 *   <Heading as="h3" size="lg">Laptop</Heading>
 */
export function Heading({ as, className, size, weight, tone, muted, numeric, truncate, lines, align, ...props }: HeadingProps) {
  // Todas las opciones son HTMLElement sin atributos propios: se tipan como <h2>.
  const Tag = as as 'h2';
  return (
    <Tag
      className={cx('heading', className)}
      {...typographyAttributes({ size, weight, tone, muted, numeric, truncate, lines, align })}
      {...props}
    />
  );
}

export interface TextProps extends ComponentProps<'p'>, TypographyOptions {
  /** p por defecto. */
  as?: 'p' | 'span' | 'div' | 'strong' | 'em' | 'small' | 'label';
}

/**
 *   <Text muted size="sm">Potencia para crear.</Text>
 *   <Text size="2xl" weight="bold" numeric>$18.999</Text>
 */
export function Text({ as = 'p', className, size, weight, tone, muted, numeric, truncate, lines, align, ...props }: TextProps) {
  const Tag = as as 'p';
  return (
    <Tag
      className={cx('text', className)}
      {...typographyAttributes({ size, weight, tone, muted, numeric, truncate, lines, align })}
      {...props}
    />
  );
}

export interface ProseProps extends ComponentProps<'div'> {
  /** div por defecto; article para un texto independiente. */
  as?: 'div' | 'article' | 'section';
}

/** Contenedor de texto largo: medida legible y ritmo vertical sin clases en cada elemento. */
export function Prose({ as = 'div', className, ...props }: ProseProps) {
  const Tag = as as 'div';
  return <Tag className={cx('prose', className)} {...props} />;
}
