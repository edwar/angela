import type { ComponentProps, ReactNode } from 'react';
import { AlertIcon, CheckIcon, ErrorIcon, InfoIcon } from './icons.js';
import { cx, flag, type Tone } from './utils.js';

/* Componentes sin estado: sirven tal cual en Server Components. */

export interface DisclosureProps extends ComponentProps<'details'> {
  /** Texto del resumen. No pongas encabezados aquí: algunos lectores los descartan. */
  summary: ReactNode;
}

/** Contenido plegable con `<details>`/`<summary>`, sin JavaScript. */
export function Disclosure({ summary, className, children, ...props }: DisclosureProps) {
  return (
    <details className={cx('disclosure', className)} {...props}>
      <summary>{summary}</summary>
      {children}
    </details>
  );
}

/** Agrupa varios `<Disclosure>` con separadores. */
export function Accordion({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cx('accordion', className)} {...props} />;
}

const calloutIcons = {
  info: InfoIcon,
  success: CheckIcon,
  warning: AlertIcon,
  danger: ErrorIcon,
  brand: InfoIcon,
  neutral: InfoIcon,
} satisfies Record<Tone, () => ReactNode>;

export interface CalloutProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** info por defecto. */
  tone?: Tone;
  title?: ReactNode;
  /** Ícono propio. Por defecto, uno según el tono (el estado nunca depende solo del color). */
  icon?: ReactNode;
}

/**
 * Aviso con ícono, título y texto. Si aparece tras una acción, insértalo en una región
 * `role="status"` que ya exista en la página.
 */
export function Callout({ tone = 'info', title, icon, className, children, ...props }: CalloutProps) {
  const Icon = calloutIcons[tone];
  return (
    <div className={cx('callout', className)} data-tone={tone} {...props}>
      {icon ?? <Icon />}
      <div>
        {title && <p className="callout-title">{title}</p>}
        {typeof children === 'string' ? <p>{children}</p> : children}
      </div>
    </div>
  );
}

export interface BadgeProps extends ComponentProps<'span'> {
  tone?: Tone;
  variant?: 'soft' | 'solid' | 'outline';
  /** Punto de estado delante del texto. */
  dot?: boolean;
}

export function Badge({ tone, variant, dot, className, ...props }: BadgeProps) {
  return <span className={cx('badge', className)} data-tone={tone} data-variant={variant} data-dot={flag(dot)} {...props} />;
}

/** `<progress>` nativo, para tareas en curso. */
export function Progress({ className, ...props }: ComponentProps<'progress'>) {
  return <progress className={cx('progress', className)} {...props} />;
}

/** `<meter>` nativo, para una medida dentro de un rango. */
export function Meter({ className, ...props }: ComponentProps<'meter'>) {
  return <meter className={cx('meter', className)} {...props} />;
}

export interface CardProps extends ComponentProps<'article'> {
  /** article (independiente) · section (parte de la página, con encabezado) · div · aside */
  as?: 'article' | 'section' | 'div' | 'aside';
  /** Sin relleno, para tablas o medios a sangre. */
  flush?: boolean;
  /** Con sombra (con moderación). */
  elevated?: boolean;
}

export function Card({ as = 'article', flush, elevated, className, ...props }: CardProps) {
  // Todas las opciones son HTMLElement sin atributos propios: se tipan como <article>.
  const Tag = as as 'article';
  return <Tag className={cx('card', className)} data-flush={flag(flush)} data-elevated={flag(elevated)} {...props} />;
}

/** Título y acciones de una tarjeta. */
export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cx('card-header', className)} {...props} />;
}

/**
 * Contenedor con scroll horizontal propio: la página nunca se desplaza en horizontal.
 * Con nombre (`aria-labelledby` → id del `<caption>`, o `aria-label`) se vuelve una región
 * enfocable, para poder desplazarla con el teclado.
 */
export function TableWrap({ className, ...props }: ComponentProps<'div'>) {
  const named = Boolean(props['aria-label'] || props['aria-labelledby']);
  return (
    <div
      className={cx('table-wrap', className)}
      role={named ? 'region' : undefined}
      tabIndex={named ? 0 : undefined}
      {...props}
    />
  );
}

/** `<table>` nativa: usa `<caption>`, `<thead>` y `<th scope>`. `data-numeric` en celdas de cifras. */
export function Table({ className, ...props }: ComponentProps<'table'>) {
  return <table className={cx('table', className)} {...props} />;
}
