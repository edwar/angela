import { describe, expect, it } from 'vitest';
import { transformWithOxc } from 'vite';
import { codigoPorFramework, htmlAAngular, htmlAAstro, htmlAJsx, nombreComponente } from './codigo-frameworks.js';

const paginas = Object.values(import.meta.glob('../data/componentes/*.js', { eager: true, import: 'default' }));
const { BLOQUES } = await import('../data/bloques.js');

describe('htmlAJsx', () => {
  it('pasa los atributos a sus nombres de React', () => {
    expect(htmlAJsx('<label for="a" class="x">A</label>')).toBe('<label htmlFor="a" className="x">A</label>');
    expect(htmlAJsx('<input class="input" autocomplete="email" readonly spellcheck="false">')).toBe(
      '<input className="input" autoComplete="email" readOnly spellCheck="false" />',
    );
    expect(htmlAJsx('<svg viewBox="0 0 24 24" stroke-width="2" aria-hidden="true"><path d="M0"/></svg>')).toBe(
      '<svg viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true"><path d="M0" /></svg>',
    );
  });

  it('los números van como número y los booleanos que React no conoce, con =""', () => {
    expect(htmlAJsx('<input minlength="8" tabindex="-1">')).toBe('<input minLength={8} tabIndex={-1} />');
    expect(htmlAJsx('<input type="checkbox" role="switch" switch>')).toBe('<input type="checkbox" role="switch" switch="" />');
    expect(htmlAJsx('<button focusgroupstart disabled>a</button>')).toBe('<button focusgroupstart="" disabled>a</button>');
  });

  it('value, checked y la opción elegida pasan a sus valores por defecto', () => {
    expect(htmlAJsx('<input value="ana" checked>')).toBe('<input defaultValue="ana" defaultChecked />');
    expect(htmlAJsx('<select><option value="a">A</option><option value="b" selected>B</option></select>')).toBe(
      '<select defaultValue="b"><option value="a">A</option><option value="b">B</option></select>',
    );
    expect(htmlAJsx('<textarea class="input">Hola</textarea>')).toBe(`<textarea className="input" defaultValue='Hola' />`);
  });

  it('style pasa a objeto; las variables CSS, con «as CSSProperties»', () => {
    expect(htmlAJsx('<div style="margin-block: 0; max-inline-size: 20rem">a</div>')).toBe(
      `<div style={{ marginBlock: '0', maxInlineSize: '20rem' }}>a</div>`,
    );
    expect(htmlAJsx('<div style="--stack-gap: var(--space-3)">a</div>')).toBe(
      `<div style={{ '--stack-gap': 'var(--space-3)' } as CSSProperties}>a</div>`,
    );
  });

  it('hidden="until-found" queda en hidden: enhanceTabs lo pone al preparar', () => {
    expect(htmlAJsx('<div role="tabpanel" hidden="until-found">a</div>')).toBe('<div role="tabpanel" hidden>a</div>');
  });

  it('varias raíces o comentarios van en un fragmento; las llaves del texto se escapan', () => {
    expect(htmlAJsx('<!-- Nota -->\n<p>{a}</p>')).toBe(`<>\n  {/* Nota */}\n  <p>{'{'}a{'}'}</p>\n</>`);
  });
});

describe('Astro, Angular y Vue', () => {
  it('Astro escapa las llaves del texto', () => {
    expect(htmlAAstro('<p>{x}</p>')).toBe(`<p>{'{'}x{'}'}</p>`);
  });

  it('Angular escapa @ y las llaves del texto', () => {
    expect(htmlAAngular('<p>ana@correo.com {x}</p>')).toBe('<p>ana&#64;correo.com &#123;x&#125;</p>');
  });

  it('Angular pide CUSTOM_ELEMENTS_SCHEMA solo si hay elementos con guion', () => {
    const angular = (html) => codigoPorFramework(html, 'Tabs').find((f) => f.id === 'angular').codigo;
    expect(angular('<mi-elemento></mi-elemento>')).toContain('schemas: [CUSTOM_ELEMENTS_SCHEMA]');
    expect(angular('<div class="tabs"></div>')).not.toContain('CUSTOM_ELEMENTS_SCHEMA');
    expect(angular('<p>a</p>')).not.toContain('CUSTOM_ELEMENTS_SCHEMA');
    // La comilla invertida se escapa para la plantilla de TypeScript; las llaves ya van como entidad.
    expect(angular('<p>`a` ${b}</p>')).toContain('<p>\\`a\\` $&#123;b&#125;</p>');
  });

  it('Vue envuelve el HTML tal cual en <template>', () => {
    expect(codigoPorFramework('<p>a</p>', 'X').find((f) => f.id === 'vue').codigo).toBe('<template>\n  <p>a</p>\n</template>');
  });
});

describe('nombreComponente', () => {
  it('saca un nombre de componente del título', () => {
    expect(nombreComponente('Con ícono y solo ícono')).toBe('ConIconoYSoloIcono');
    expect(nombreComponente('3D')).toBe('Ejemplo3d');
    expect(nombreComponente('')).toBe('Ejemplo');
  });
});

describe('todos los ejemplos del sitio', () => {
  const ejemplos = [
    ...paginas.flatMap((p) => p.examples.map((ex) => [`${p.slug} · ${ex.title}`, ex])),
    ...BLOQUES.map((b) => [`bloque · ${b.titulo}`, { title: b.titulo, code: b.html }]),
  ];

  it.each(ejemplos)('%s: el JSX de React y Next.js compila', async (_, ex) => {
    for (const fw of codigoPorFramework(ex.code, ex.title).filter((f) => ['react', 'next'].includes(f.id))) {
      await expect(transformWithOxc(fw.codigo, 'Ejemplo.tsx', { lang: 'tsx' })).resolves.toBeTruthy();
    }
  });
});
