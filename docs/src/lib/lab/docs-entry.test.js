import { describe, expect, it } from 'vitest';
import { buildDocsEntry, componentTitle, mergeDocsEntry, readParameters, rowToken, serializeDocsEntry, splitExamples } from './docs-entry.js';

/** Importa el archivo generado como lo haría el sitio. */
const importar = async (source) =>
  (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).default;

const CSS_ANTES = `@layer angela.components {
  :where(.faq) { --faq-gap: var(--space-2); }
  .faq { gap: var(--faq-gap); }
  .faq-viejo { color: var(--color-text); }
}`;
const CSS_AHORA = `@layer angela.components {
  :where(.faq) { --faq-gap: var(--space-2); --_faq-interno: 0; }
  .faq { gap: var(--faq-gap); }
  .faq[data-marker="end"] summary::before { order: 1; mask: var(--faq-icon, none); }
}`;
const PAGINA = {
  slug: 'faq',
  title: 'Preguntas',
  summary: 'Preguntas frecuentes.',
  examples: [
    { title: 'Básico', note: 'Nota escrita a mano.', code: '<div class="faq">a</div>' },
    { title: 'Viejo', code: '<div class="faq-viejo"></div>' },
  ],
  api: [
    ['.faq', 'El contenedor.'],
    ['.faq-viejo', 'Ya no existe.'],
    ['--faq-gap', 'Separación.'],
    ['name="grupo"', 'Atributo nativo: no sale del CSS.'],
  ],
  a11y: ['Nota de siempre.'],
};

describe('componentTitle', () => {
  it('primera letra en mayúscula y el resto en minúscula', () => {
    expect(componentTitle('carousel')).toBe('Carousel');
    expect(componentTitle('  select   Personalizable ')).toBe('Select personalizable');
    expect(componentTitle('ÁRBOL DE NAVEGACIÓN')).toBe('Árbol de navegación');
  });

  it('respeta las siglas cortas y lo que lleva números', () => {
    expect(componentTitle('tarjeta 3D')).toBe('Tarjeta 3D');
    expect(componentTitle('botón CTA')).toBe('Botón CTA');
  });
});

describe('splitExamples', () => {
  it('deshace los bloques «<!-- Título -->» que carga el laboratorio', () => {
    const html = '<!-- Básico -->\n<div class="faq">a</div>\n\n<!-- Con caret: al final de la fila -->\n<div class="faq" data-marker="end">\n  <!-- comentario interno -->\n</div>';
    expect(splitExamples(html)).toEqual([
      { title: 'Básico', comment: 'Básico', code: '<div class="faq">a</div>' },
      {
        title: 'Con caret',
        note: 'Al final de la fila.',
        comment: 'Con caret: al final de la fila',
        code: '<div class="faq" data-marker="end">\n  <!-- comentario interno -->\n</div>',
      },
    ]);
  });

  it('la nota no se pone en mayúscula si empieza por código', () => {
    expect(splitExamples('<!-- Tema: data-angela-theme en el contenedor -->\n<p>a</p>')[0].note).toBe('data-angela-theme en el contenedor.');
    expect(splitExamples('<!-- Tema: --angela-brand-h cambia la marca -->\n<p>a</p>')[0].note).toBe('--angela-brand-h cambia la marca.');
    expect(splitExamples('<!-- Tema: con otra marca -->\n<p>a</p>')[0].note).toBe('Con otra marca.');
  });

  it('sin comentarios, todo es un ejemplo', () => {
    expect(splitExamples('<p>hola</p>')).toEqual([{ title: 'Ejemplo', comment: '', code: '<p>hola</p>' }]);
  });
});

describe('readParameters', () => {
  it('incluye las variables que solo se leen con valor de reserva, no las internas ni los tokens', () => {
    expect(readParameters(CSS_AHORA)).toEqual([
      ['--faq-gap', 'var(--space-2)'],
      ['--faq-icon', null],
    ]);
  });
});

describe('rowToken', () => {
  it('reconoce clases, atributos y parámetros; lo nativo no sale del CSS', () => {
    expect(rowToken('.faq')).toEqual({ tipo: 'clases', nombre: 'faq' });
    expect(rowToken('select.input')).toEqual({ tipo: 'clases', nombre: 'input' });
    expect(rowToken('data-marker="end"')).toEqual({ tipo: 'atributos', nombre: 'data-marker' });
    expect(rowToken('--faq-icon')).toEqual({ tipo: 'parametros', nombre: '--faq-icon' });
    expect(rowToken('name="grupo"')).toBeNull();
  });
});

describe('mergeDocsEntry', () => {
  const html = '<!-- Básico -->\n<div class="faq">b</div>\n\n<!-- Caret al final: con data-marker -->\n<div class="faq" data-marker="end"></div>';
  const { entry, resumen } = mergeDocsEntry(PAGINA, { html, css: CSS_AHORA, oldCss: CSS_ANTES });

  it('cambia el código de los ejemplos por título y conserva su nota; añade los nuevos y quita los que faltan', () => {
    expect(entry.examples).toEqual([
      { title: 'Básico', note: 'Nota escrita a mano.', code: '<div class="faq">b</div>' },
      { title: 'Caret al final', note: 'Con data-marker.', code: '<div class="faq" data-marker="end"></div>' },
    ]);
    expect(resumen.ejemplos).toEqual({ nuevos: ['Caret al final'], cambiados: ['Básico'], quitados: ['Viejo'] });
  });

  it('la API conserva las descripciones, quita lo que el CSS ya no tiene y añade lo nuevo como pendiente', () => {
    expect(entry.api).toEqual([
      ['.faq', 'El contenedor.'],
      ['--faq-gap', 'Separación.'],
      ['name="grupo"', 'Atributo nativo: no sale del CSS.'],
      ['data-marker="end"', 'Pendiente de describir.'],
      ['--faq-icon', 'Pendiente de describir.'],
    ]);
    expect(resumen.api).toEqual({ nuevos: ['data-marker="end"', '--faq-icon'], quitados: ['.faq-viejo'] });
  });

  it('mantiene slug, título y resumen; las notas de accesibilidad son las del diálogo si las hay', () => {
    expect(entry).toMatchObject({ slug: 'faq', title: 'Preguntas', summary: 'Preguntas frecuentes.' });
    expect(entry.a11y).toEqual(['Nota de siempre.']);
    expect(mergeDocsEntry(PAGINA, { html, css: CSS_AHORA, oldCss: CSS_ANTES, a11y: ['Otra.'] }).entry.a11y).toEqual(['Otra.']);
  });

  it('sin HTML, los ejemplos se quedan como estaban', () => {
    expect(mergeDocsEntry(PAGINA, { html: '', css: CSS_ANTES, oldCss: CSS_ANTES }).entry.examples).toEqual(PAGINA.examples);
  });
});

describe('serializeDocsEntry', () => {
  it('escribe un módulo que se importa igual que la página de partida', async () => {
    const pagina = {
      ...PAGINA,
      examples: [{ title: 'Raro', note: 'Con `comillas` y ${llaves}.', code: '<p>`a` ${b} \\ c</p>\n<p>d</p>' }],
    };
    expect(await importar(serializeDocsEntry(pagina))).toEqual(pagina);
  });

  it('buildDocsEntry: un componente nuevo con varios bloques da varios ejemplos', async () => {
    const source = buildDocsEntry({
      id: 'faq',
      title: 'Preguntas',
      summary: 'Preguntas frecuentes.',
      files: { html: '<!-- Uno -->\n<div class="faq"></div>\n<!-- Dos -->\n<div class="faq"></div>', css: CSS_AHORA, js: '' },
    });
    const entry = await importar(source);
    expect(entry.examples.map((ex) => ex.title)).toEqual(['Uno', 'Dos']);
    expect(entry.api[0]).toEqual(['.faq', 'Clase del componente.']);
  });
});
