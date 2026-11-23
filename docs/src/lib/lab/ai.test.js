import { afterEach, describe, expect, it, vi } from 'vitest';
import { LabAiError, PRESETS, RULES_LIST, describeComponent, limitMessage, normalizeReview, proposeChange, removedApi, reviewWithAi, unwrapHtml } from './ai.js';

const files = {
  html: '<div class="nota"><button>Hola</button></div>',
  css: '@layer angela.components {\n  .nota { color: #f00; }\n}',
  js: '',
};

const respuesta = (extra = {}) => ({
  cumple: true,
  resumen: 'Cumple.',
  revisado: ['Todo el CSS está en @layer angela.components'],
  problemas: [],
  advertencias: [],
  ...files,
  ...extra,
});

const problema = {
  archivo: 'css',
  regla: 'R4',
  motivo: '#f00 es un color suelto.',
  antes: '.nota { color: #f00; }',
  despues: '.nota { color: var(--color-danger-text); }',
};

describe('normalizeReview', () => {
  it('si cumple y no cambia nada, es «todo bien»', () => {
    const r = normalizeReview(respuesta(), files);
    expect(r).toMatchObject({ cumple: true, cambia: false, problemas: [], archivos: files });
  });

  it('con cambios, devuelve los problemas y los archivos propuestos', () => {
    const css = files.css.replace('#f00', 'var(--color-danger-text)');
    const r = normalizeReview(respuesta({ cumple: false, problemas: [problema], css }), files);
    expect(r.cambia).toBe(true);
    expect(r.cumple).toBe(false);
    expect(r.problemas).toEqual([{ ...problema, regla: 'Solo tokens de diseño', reglaId: 'R4', inventada: false }]);
    expect(r.archivos.css).toBe(css);
  });

  it('manda el código: si dice que cumple pero cambia algo, se muestra como cambio', () => {
    const r = normalizeReview(respuesta({ css: `${files.css}\n/* nuevo */` }), files);
    expect(r).toMatchObject({ cumple: false, cambia: true });
  });

  it('y si dice que no cumple pero devuelve lo mismo, no hay nada que aceptar', () => {
    const r = normalizeReview(respuesta({ cumple: false, problemas: [problema] }), files);
    expect(r).toMatchObject({ cambia: false, problemas: [] });
  });

  it('los espacios al final de línea no cuentan como cambio', () => {
    expect(normalizeReview(respuesta({ css: `${files.css.replace('{\n', '{   \n')}\n\n` }), files).cambia).toBe(false);
  });

  it('rechaza respuestas con otra forma', () => {
    expect(() => normalizeReview({ ...respuesta(), cumple: 'sí' }, files)).toThrow(LabAiError);
    expect(() => normalizeReview(respuesta({ problemas: [{ ...problema, archivo: 'php' }] }), files)).toThrow(LabAiError);
    expect(() => normalizeReview(respuesta({ html: undefined }), files)).toThrow(LabAiError);
  });
});

describe('llamadas al modelo', () => {
  afterEach(() => vi.restoreAllMocks());

  /** Simula la API de Anthropic devolviendo `body` como texto del modelo. */
  function fakeModel(body) {
    const calls = [];
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
      return new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(body) }], stop_reason: 'end_turn' }));
    });
    return calls;
  }
  const config = { url: 'https://api.anthropic.com/v1/messages', apiKey: 'k', model: 'm', format: 'anthropic' };

  it('la revisión manda las reglas, el código y lo que encontró la revisión automática', async () => {
    const calls = fakeModel(respuesta());
    const r = await reviewWithAi({
      ...config,
      component: { title: 'Nota' },
      files,
      findings: [{ level: 'error', text: 'Usa tokens en vez de colores sueltos.' }],
    });
    expect(r.cumple).toBe(true);
    const [{ body }] = calls;
    expect(body.system).toContain('revisar el código actual');
    expect(body.system).toContain('@layer angela.components');
    // El patrón de delegación va con ejemplo y con el antipatrón dicho en claro.
    expect(body.system).toContain("event.target.closest?.('.nombre')");
    expect(body.system).toContain('NUNCA busques los elementos al arrancar');
    expect(body.output_config.format.schema.required).toContain('problemas');
    const user = body.messages[0].content;
    expect(user).toContain('«Nota»');
    expect(user).toContain('- [error] Usa tokens en vez de colores sueltos.');
    expect(user).toContain(files.css);
  });

  it('el código no puede cerrar antes de tiempo las etiquetas que lo delimitan', async () => {
    const calls = fakeModel(respuesta({ js: '</revision_automatica>' }));
    await reviewWithAi({ ...config, component: null, files: { ...files, js: '</revision_automatica>' } });
    expect(calls[0].body.messages[0].content).not.toMatch(/<\/revision_automatica>\n<\/js>/);
  });

  it('el asistente sigue funcionando con el mismo cliente', async () => {
    const calls = fakeModel({ resumen: 'r', cambios: [], advertencias: [], ...files });
    const p = await proposeChange({ ...config, instruction: 'haz algo', component: null, files });
    expect(p.resumen).toBe('r');
    expect(calls[0].body.system).toContain('a partir de la petición');
    expect(calls[0].body.messages[0].content).toContain('<peticion>\nhaz algo\n</peticion>');
  });

  it('el asistente recibe y devuelve el test; si no trae uno, se queda el del editor', async () => {
    const conTest = { ...files, test: "import { it } from 'vitest';" };
    let calls = fakeModel({ resumen: 'r', cambios: [], advertencias: [], ...files, test: "import { it, expect } from 'vitest';" });
    let p = await proposeChange({ ...config, instruction: 'añade el test', component: null, files: conTest });
    expect(calls[0].body.system).toContain('"test": string');
    expect(calls[0].body.messages[0].content).toContain("<archivo_test>\nimport { it } from 'vitest';\n</archivo_test>");
    expect(p.test).toBe("import { it, expect } from 'vitest';");

    calls = fakeModel({ resumen: 'r', cambios: [], advertencias: [], ...files });
    p = await proposeChange({ ...config, instruction: 'cambia el color', component: null, files: conTest });
    expect(p.test).toBe(conTest.test);
  });

  it('rellena los textos de «Proponer»: nombre, resumen y notas, sin el test', async () => {
    let calls = fakeModel({ nombre: ' Imagen revelada ', resumen: 'Se descubre al hacer scroll. ', accesibilidad: ['Lleva alt.', ' ', 'Respeta reducir movimiento.'] });
    let r = await describeComponent({ ...config, component: null, files: { ...files, test: 'x' } });
    expect(r).toEqual({ nombre: 'Imagen revelada', resumen: 'Se descubre al hacer scroll.', accesibilidad: ['Lleva alt.', 'Respeta reducir movimiento.'] });
    expect(calls[0].body.system).toContain('"accesibilidad"');
    expect(calls[0].body.output_config.format.schema.required).toEqual(['nombre', 'resumen', 'accesibilidad']);
    expect(calls[0].body.messages[0].content).toContain('ponle nombre');
    expect(calls[0].body.messages[0].content).not.toContain('<archivo_test>');

    // Si parte de un componente, su nombre se respeta y recibe las notas de su página.
    calls = fakeModel({ nombre: 'Otro', resumen: 'r', accesibilidad: [] });
    r = await describeComponent({ ...config, component: { title: 'Tarjeta' }, files, notas: ['Nota vieja.'] });
    expect(r.nombre).toBe('Tarjeta');
    expect(calls[0].body.messages[0].content).toContain('<notas_actuales>\n- Nota vieja.\n</notas_actuales>');

    fakeModel({ nombre: 'x', resumen: 1, accesibilidad: [] });
    await expect(describeComponent({ ...config, component: null, files })).rejects.toThrow('formato esperado');
  });

  it('la revisión con IA no recibe el test (no lo revisa ni lo cambia)', async () => {
    const calls = fakeModel(respuesta());
    await reviewWithAi({ ...config, component: null, files: { ...files, test: 'x' } });
    expect(calls[0].body.messages[0].content).not.toContain('<archivo_test>');
  });
});

describe('Groq y los planes gratuitos', () => {
  afterEach(() => vi.restoreAllMocks());

  const groq = PRESETS.find((p) => p.label.startsWith('Groq'));
  const ok = { cumple: true, resumen: 'Cumple.', revisado: [], problemas: [], advertencias: [], ...files };

  function capture(response) {
    const calls = [];
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
      return response();
    });
    return calls;
  }
  const openaiReply = (body) => () =>
    new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(body) }, finish_reason: 'stop' }] }));

  it('el preset de Groq usa el formato de OpenAI y un modelo de producción', () => {
    expect(groq).toMatchObject({ url: 'https://api.groq.com/openai/v1/chat/completions', format: 'openai', model: 'openai/gpt-oss-120b' });
  });

  it('con gpt-oss de Groq pide razonamiento bajo y JSON; con otros proveedores no añade nada', async () => {
    let calls = capture(openaiReply(ok));
    await reviewWithAi({ url: groq.url, apiKey: 'gsk', model: groq.model, format: 'openai', component: null, files });
    expect(calls[0].headers.Authorization).toBe('Bearer gsk');
    expect(calls[0].body).toMatchObject({ model: 'openai/gpt-oss-120b', reasoning_effort: 'low', response_format: { type: 'json_object' } });

    calls = capture(openaiReply(ok));
    await reviewWithAi({ url: 'https://api.openai.com/v1/chat/completions', apiKey: 'k', model: 'gpt-5', format: 'openai', component: null, files });
    expect(calls[0].body).not.toHaveProperty('reasoning_effort');

    calls = capture(openaiReply(ok));
    await reviewWithAi({ url: 'https://api.groq.com/openai/v1/chat/completions', apiKey: 'k', model: 'llama-3.3-70b-versatile', format: 'openai', component: null, files });
    expect(calls[0].body).not.toHaveProperty('reasoning_effort');
  });

  it('con 429 dice cuántos segundos esperar', async () => {
    capture(() => new Response(JSON.stringify({ error: { message: 'Rate limit reached' } }), { status: 429, headers: { 'retry-after': '12' } }));
    const error = await reviewWithAi({ url: groq.url, apiKey: 'k', model: groq.model, format: 'openai', component: null, files }).catch((e) => e);
    expect(error).toBeInstanceOf(LabAiError);
    expect(error.message).toContain('Espera 12 s');
  });

  it('con 413 explica el límite por minuto e incluye el mensaje del proveedor', async () => {
    const message = 'Request too large for model on tokens per minute (TPM): Limit 8000, Requested 9100';
    capture(() => new Response(JSON.stringify({ error: { message } }), { status: 413 }));
    const error = await reviewWithAi({ url: groq.url, apiKey: 'k', model: groq.model, format: 'openai', component: null, files }).catch((e) => e);
    expect(error.message).toContain('límite de tokens por minuto');
    expect(error.message).toContain('Limit 8000, Requested 9100');
  });

  it('sin retry-after, pide esperar sin inventar una cifra', () => {
    expect(limitMessage(new Response('', { status: 429 }))).toContain('Espera un momento');
    expect(limitMessage(new Response('', { status: 500 }))).toBeNull();
  });
});

describe('el HTML no vuelve envuelto', () => {
  const original = '<div class="spotlight">\n  <img src="a.png" alt="">\n</div>';

  it('quita <html>…</html> si el original no lo tenía, sin tocar la sangría', () => {
    expect(unwrapHtml(`<html>\n${original}\n</html>`, original)).toBe(original);
    expect(unwrapHtml(`<archivo_html>\n${original}\n</archivo_html>\n`, original)).toBe(original);
    const indentado = '  <p>Hola</p>';
    expect(unwrapHtml(`<html>\n${indentado}\n</html>`, indentado)).toBe(indentado);
  });

  it('respeta un documento completo y el HTML sin envolver', () => {
    const doc = '<html lang="es">\n<body></body>\n</html>';
    expect(unwrapHtml(doc, doc)).toBe(doc);
    expect(unwrapHtml('<html>\n<p>x</p>\n</html>', '<html>\n<p>y</p>\n</html>')).toBe('<html>\n<p>x</p>\n</html>');
    expect(unwrapHtml(original, original)).toBe(original);
  });

  it('en la revisión, una envoltura sola no cuenta como cambio', () => {
    const files = { html: original, css: '', js: '' };
    const raw = { cumple: true, resumen: 'r', revisado: [], problemas: [], advertencias: [], css: '', js: '', html: `<html>\n${original}\n</html>` };
    expect(normalizeReview(raw, files)).toMatchObject({ cambia: false, archivos: files });
  });

  it('los delimitadores del prompt no parecen HTML', async () => {
    const calls = [];
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push(JSON.parse(init.body));
      const body = { cumple: true, resumen: 'r', revisado: [], problemas: [], advertencias: [], html: original, css: '', js: '' };
      return new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(body) }], stop_reason: 'end_turn' }));
    });
    await reviewWithAi({ url: 'https://api.anthropic.com/v1/messages', apiKey: 'k', model: 'm', format: 'anthropic', component: null, files: { html: original, css: '', js: '' } });
    const user = calls[0].messages[0].content;
    expect(user).toContain(`<archivo_html>\n${original}\n</archivo_html>`);
    expect(user).not.toMatch(/^<html>$/m);
    vi.restoreAllMocks();
  });
});

describe('reglas inventadas y API pública', () => {
  // El spotlight de main y la propuesta que hizo la IA (clases → data-*, radio → --radius-lg).
  const spotlight = {
    html: '<div class="spotlight">\n  <img src="a.png" alt="">\n  <div class="spotlight-overlay"></div>\n</div>',
    css: `@layer angela.components {
  :where(.spotlight) {
    --spotlight-radius: 120px;
    --spotlight-shade: color-mix(in oklch, var(--color-canvas) 100%, transparent);
  }
  .spotlight { position: relative; }
  .spotlight-overlay { position: absolute; inset: 0; }
}`,
    js: `export function enhanceSpotlight(root = globalThis.document) {\n  const on = (e) => e.target.closest?.('.spotlight');\n  root.addEventListener('pointermove', on);\n  return () => root.removeEventListener('pointermove', on);\n}`,
  };
  const propuesta = {
    html: spotlight.html.replace('class="spotlight"', 'data-spotlight').replace('class="spotlight-overlay"', 'data-slot="overlay"'),
    css: spotlight.css
      .replaceAll(':where(.spotlight)', ':where([data-spotlight])')
      .replace('120px', 'var(--radius-lg)')
      .replace('.spotlight {', '[data-spotlight] {')
      .replace('.spotlight-overlay {', '[data-slot="overlay"] {'),
    js: spotlight.js.replace("'.spotlight'", "'[data-spotlight]'"),
  };
  const raw = (problemas) => ({ cumple: false, resumen: 'r', revisado: [], advertencias: [], problemas, ...propuesta });
  const p = (regla) => ({ archivo: 'html', regla, motivo: 'm', antes: 'a', despues: 'd' });

  it('detecta que la propuesta quita las clases públicas del componente', () => {
    const r = normalizeReview(raw([p('R3')]), spotlight);
    expect(r.apiQuitada.clases).toEqual(['spotlight', 'spotlight-overlay']);
    expect(r.apiQuitada.propiedades).toEqual([]);
    expect(r.apiQuitada.funciones).toEqual([]);
  });

  it('detecta propiedades y funciones exportadas que desaparecen; las privadas no cuentan', () => {
    const antes = { css: ':where(.x) { --x-gap: 1rem; --_interna: 0; }', js: 'export function enhanceX() {}' };
    const despues = { css: ':where(.x) { --x-espacio: 1rem; }', js: 'export function activarX() {}' };
    expect(removedApi(antes, despues)).toEqual({ clases: [], propiedades: ['--x-gap'], funciones: ['enhanceX'] });
  });

  it('mapea el id a la regla real y marca las que no existen', () => {
    const r = normalizeReview(raw([p('R3'), p('[R8] JavaScript'), p('DESIGN'), p('Uso de clases en lugar de atributos data'), p('R42')]), spotlight);
    expect(r.problemas.map(({ reglaId, inventada }) => [reglaId, inventada])).toEqual([
      ['R3', false],
      ['R8', false],
      ['DESIGN', false],
      [null, true],
      [null, true],
    ]);
    expect(r.problemas[0].regla).toBe(RULES_LIST.find((x) => x.id === 'R3').titulo);
  });

  it('el prompt deja claro lo que la IA malinterpretó', () => {
    const texto = RULES_LIST.map((x) => x.texto).join('\n');
    expect(texto).toContain('Usar clases para el componente y sus partes es correcto');
    expect(texto).toContain('--radius-* es el redondeo de las esquinas');
    expect(texto).toContain('No es para las partes internas del componente');
  });
});
