/**
 * Los componentes del «Pruébalo»: su API (props, slots y eventos), su marcado (ir.js) y los
 * controles para jugar con ella.
 *
 * Cada control es una prop del componente, salvo:
 * - slot: llena un slot (el texto de un botón, el contenido de un desplegable…).
 * - demo: solo sirve para el ejemplo (cuántas tarjetas tiene el carrusel).
 * `defecto` es el valor por defecto del componente; `inicial`, con el que empieza el playground.
 *
 * Los nombres de las props son los de @angela-ui/react (variant, tone, size, block…).
 */
import { bandera, booleano, cada, crudo, el, estilo, evento, id, idSi, ids, item, lit, prop, segun, segunProp, si, slot, texto, unir } from '../componentes/ir.js';
import { renderHtml } from '../componentes/render.js';

export const TONOS = ['brand', 'neutral', 'success', 'warning', 'danger', 'info'];

/** Los iconos de @angela-ui/icons (los SVG que genera su build), decorativos dentro de un botón. */
const SVG_ICONOS = Object.fromEntries(
  Object.entries(import.meta.glob('../../../../packages/angela-icons/dist/svg/*.svg', { query: '?raw', import: 'default', eager: true })).map(([ruta, svg]) => [
    ruta.split('/').pop().replace(/\.svg$/, ''),
    String(svg).replace(/^<svg /, '<svg aria-hidden="true" ').replace(/ xmlns="[^"]*"/, ''),
  ]),
);
const ICONOS_BOTON = ['', ...Object.keys(SVG_ICONOS)];
const TAMANOS = ['sm', 'md', 'lg'];

/** Texto para HTML (el contenido de los slots del ejemplo). */
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const svg = (cuerpo) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${cuerpo}</svg>`;
const ICONOS = {
  info: svg('<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>'),
  success: svg('<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>'),
  warning: svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>'),
  danger: svg('<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>'),
  cerrar: svg('<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>'),
};

/**
 * @typedef {{ nombre: string, etiqueta: string, tipo: 'opciones' | 'booleano' | 'texto' | 'numero' | 'lista',
 *   valores?: string[], defecto?: unknown, inicial?: unknown, min?: number, max?: number, ayuda?: string,
 *   descripcion?: string, slot?: string, demo?: boolean, separador?: string }} Control
 * @typedef {{ slug: string, centrar?: boolean, altoMinimo?: number, controles: Control[],
 *   componente: { nombre: string, slots?: Record<string, string>, eventos?: Record<string, string>, raiz: object[] },
 *   slots: (v: Record<string, unknown>) => Record<string, string> }} Definicion
 */

/** @type {Definicion[]} */
export const DEFINICIONES = [
  {
    slug: 'boton',
    centrar: true,
    controles: [
      { nombre: 'children', etiqueta: 'Texto', tipo: 'texto', slot: 'children', inicial: 'Guardar' },
      { nombre: 'icono', etiqueta: 'Ícono (de @angela-ui/icons)', tipo: 'opciones', valores: ICONOS_BOTON, inicial: '', demo: true, ayuda: 'Va en el contenido, delante del texto, con aria-hidden: el nombre lo da el texto.' },
      { nombre: 'variant', etiqueta: 'Variante', tipo: 'opciones', valores: ['solid', 'soft', 'outline', 'ghost'], defecto: 'solid', descripcion: 'solid para la acción principal (una por vista).' },
      { nombre: 'tone', etiqueta: 'Tono', tipo: 'opciones', valores: TONOS, defecto: 'brand' },
      { nombre: 'size', etiqueta: 'Tamaño', tipo: 'opciones', valores: TAMANOS, defecto: 'md' },
      { nombre: 'block', etiqueta: 'Todo el ancho', tipo: 'booleano', defecto: false },
      { nombre: 'disabled', etiqueta: 'Deshabilitado', tipo: 'booleano', defecto: false },
    ],
    componente: {
      nombre: 'Button',
      slots: { children: 'El texto (y el ícono) del botón.' },
      raiz: [
        el(
          'button',
          {
            type: 'button',
            class: 'button',
            'data-variant': prop('variant', 'solid'),
            'data-tone': prop('tone', 'brand'),
            'data-size': prop('size', 'md'),
            'data-block': bandera('block'),
            disabled: booleano('disabled'),
          },
          [slot()],
        ),
      ],
    },
    slots: (v) => ({ children: `${v.icono && SVG_ICONOS[v.icono] ? `${SVG_ICONOS[v.icono]} ` : ''}${esc(v.children)}` }),
  },

  {
    slug: 'aviso',
    controles: [
      { nombre: 'title', etiqueta: 'Título', tipo: 'texto', inicial: 'Novedad' },
      { nombre: 'children', etiqueta: 'Texto', tipo: 'texto', slot: 'children', inicial: 'Ya puedes exportar tus informes a PDF.' },
      { nombre: 'tone', etiqueta: 'Tono', tipo: 'opciones', valores: TONOS, defecto: 'info', ayuda: 'El ícono cambia con el tono: el estado nunca depende solo del color.' },
    ],
    componente: {
      nombre: 'Callout',
      slots: { children: 'El mensaje.' },
      raiz: [
        el('div', { class: 'callout', 'data-tone': prop('tone') }, [
          segun('tone', { success: [crudo(ICONOS.success)], warning: [crudo(ICONOS.warning)], danger: [crudo(ICONOS.danger)] }, [crudo(ICONOS.info)]),
          el('div', {}, [si('title', [el('p', { class: 'callout-title' }, [texto('title')])]), el('p', {}, [slot()])]),
        ]),
      ],
    },
    slots: (v) => ({ children: esc(v.children) }),
  },

  {
    slug: 'etiqueta',
    controles: [
      { nombre: 'children', etiqueta: 'Texto', tipo: 'texto', slot: 'children', inicial: 'Activo' },
      { nombre: 'tone', etiqueta: 'Tono', tipo: 'opciones', valores: TONOS, defecto: 'neutral', inicial: 'success', ayuda: 'El estado lo dice el texto: el color solo lo refuerza.' },
      { nombre: 'variant', etiqueta: 'Variante', tipo: 'opciones', valores: ['soft', 'solid', 'outline'], defecto: 'soft', descripcion: 'soft (por defecto) · solid para destacar · outline para metadatos.' },
      { nombre: 'dot', etiqueta: 'Punto de estado', tipo: 'booleano', defecto: false, inicial: true },
    ],
    componente: {
      nombre: 'Badge',
      slots: { children: 'El texto de la etiqueta.' },
      raiz: [el('span', { class: 'badge', 'data-tone': prop('tone'), 'data-variant': prop('variant'), 'data-dot': bandera('dot') }, [slot()])],
    },
    slots: (v) => ({ children: esc(v.children) }),
  },

  {
    slug: 'progreso',
    controles: [
      { nombre: 'label', etiqueta: 'Etiqueta', tipo: 'texto', inicial: 'Subiendo factura.pdf', descripcion: 'Etiqueta visible: sin ella, el lector solo dice un porcentaje.' },
      { nombre: 'value', etiqueta: 'Valor', tipo: 'numero', min: 0, max: 100, defecto: 0, inicial: 64 },
      { nombre: 'max', etiqueta: 'Máximo', tipo: 'numero', min: 1, max: 1000, defecto: 100 },
      { nombre: 'indeterminate', etiqueta: 'Indeterminado', tipo: 'booleano', defecto: false, ayuda: 'Sin value: una tarea sin fin conocido. El navegador lo anima.', descripcion: 'Sin fin conocido: se pinta sin value.' },
    ],
    componente: {
      nombre: 'Progress',
      raiz: [
        el('div', { class: 'field' }, [
          el('label', { for: id() }, [texto('label')]),
          si('indeterminate', [el('progress', { class: 'progress', id: id(), max: prop('max') })]),
          si('!indeterminate', [el('progress', { class: 'progress', id: id(), max: prop('max'), value: prop('value') }, [texto('value')])]),
        ]),
      ],
    },
    slots: () => ({}),
  },

  {
    slug: 'campo-de-texto',
    controles: [
      { nombre: 'label', etiqueta: 'Etiqueta', tipo: 'texto', inicial: 'Correo', descripcion: 'Etiqueta visible (nunca la sustituyas por un placeholder).' },
      { nombre: 'name', etiqueta: 'Nombre del campo', tipo: 'texto', inicial: 'email' },
      { nombre: 'hint', etiqueta: 'Ayuda', tipo: 'texto', inicial: 'Te enviaremos el recibo.' },
      { nombre: 'error', etiqueta: 'Error', tipo: 'texto', inicial: 'Escribe un correo válido, por ejemplo ana@correo.com.', descripcion: 'Se muestra al salir del campo si es inválido, o desde el principio con invalid.' },
      { nombre: 'type', etiqueta: 'Tipo', tipo: 'opciones', valores: ['text', 'email', 'password', 'number', 'date', 'search'], defecto: 'text', inicial: 'email' },
      { nombre: 'size', etiqueta: 'Tamaño', tipo: 'opciones', valores: TAMANOS, defecto: 'md' },
      { nombre: 'required', etiqueta: 'Obligatorio', tipo: 'booleano', defecto: false, inicial: true },
      { nombre: 'invalid', etiqueta: 'Error del servidor', tipo: 'booleano', defecto: false, ayuda: 'Muestra el error desde el principio, sin esperar a que se toque el campo.' },
      { nombre: 'disabled', etiqueta: 'Deshabilitado', tipo: 'booleano', defecto: false },
    ],
    componente: {
      nombre: 'Field',
      raiz: [
        el('div', { class: 'field' }, [
          el('label', { for: id() }, [texto('label'), si('required', [el('span', { 'aria-hidden': 'true' }, [lit(' *')])])]),
          si('hint', [el('p', { class: 'hint', id: id('-hint') }, [texto('hint')])]),
          el('input', {
            class: 'input',
            id: id(),
            name: prop('name'),
            type: prop('type'),
            'data-size': prop('size', 'md'),
            required: booleano('required'),
            disabled: booleano('disabled'),
            'aria-describedby': ids([
              ['hint', '-hint'],
              [['invalid', 'error'], '-error'],
            ]),
            // Empieza en "false": Firefox y Safari anuncian como inválido un campo requerido vacío sin él.
            'aria-invalid': segunProp('invalid', 'true', 'false'),
            'data-error': idSi('error', '-error'),
          }),
          si('error', [el('p', { class: 'error', id: id('-error') }, [texto('error')])]),
        ]),
      ],
    },
    slots: () => ({}),
  },

  {
    slug: 'desplegable',
    controles: [
      { nombre: 'summary', etiqueta: 'Resumen', tipo: 'texto', inicial: '¿Puedo devolver un pedido?' },
      { nombre: 'children', etiqueta: 'Contenido', tipo: 'texto', slot: 'children', inicial: 'Sí, tienes 30 días desde que lo recibes.' },
      { nombre: 'name', etiqueta: 'Grupo', tipo: 'texto', ayuda: 'Los desplegables con el mismo name forman un acordeón: abrir uno cierra el otro.', descripcion: 'Agrupa desplegables: solo uno abierto a la vez.' },
      { nombre: 'open', etiqueta: 'Abierto al cargar', tipo: 'booleano', defecto: false },
      { nombre: 'marker', etiqueta: 'Flecha', tipo: 'opciones', valores: ['start', 'end'], defecto: 'start', ayuda: 'end la lleva al final de la fila y la gira hacia abajo.' },
    ],
    componente: {
      nombre: 'Disclosure',
      slots: { children: 'Lo que se muestra al abrirlo.' },
      raiz: [
        el('details', { class: 'disclosure', name: prop('name'), open: booleano('open'), 'data-marker': prop('marker', 'start') }, [
          el('summary', {}, [texto('summary')]),
          slot(),
        ]),
      ],
    },
    slots: (v) => ({ children: `<p>${esc(v.children)}</p>` }),
  },

  {
    slug: 'acordeon',
    controles: [
      { nombre: 'marker', etiqueta: 'Flecha', tipo: 'opciones', valores: ['start', 'end'], defecto: 'start', ayuda: 'end la lleva al final de cada fila: mejor en columnas estrechas.', descripcion: 'start: junto al texto · end: al final de la fila.' },
      { nombre: 'titulo', etiqueta: 'Encabezado del grupo', tipo: 'texto', inicial: 'Preguntas frecuentes', demo: true },
      { nombre: 'preguntas', etiqueta: 'Preguntas (separadas por |)', tipo: 'lista', separador: '|', inicial: ['¿Cuánto tarda el envío?', '¿Puedo devolver un pedido?', '¿Qué formas de pago hay?'], defecto: [], demo: true },
      { nombre: 'exclusivo', etiqueta: 'Solo uno abierto a la vez', tipo: 'booleano', defecto: false, demo: true, ayuda: 'El mismo name en cada <details>. Con moderación: impide comparar respuestas.' },
    ],
    componente: {
      nombre: 'Accordion',
      slots: { children: 'El encabezado del grupo y un <details> por pregunta.' },
      raiz: [el('section', { class: 'accordion', 'data-marker': prop('marker', 'start') }, [slot()])],
    },
    slots: (v) => {
      const name = v.exclusivo ? ' name="faq"' : '';
      const filas = (v.preguntas ?? []).map(
        (p, i) => `<details${name}${i === 0 ? ' open' : ''}><summary>${esc(p)}</summary><p>Respuesta a «${esc(p)}».</p></details>`,
      );
      return { children: [v.titulo ? `<h3>${esc(v.titulo)}</h3>` : '', ...filas].filter(Boolean).join('') };
    },
  },

  {
    slug: 'tarjeta',
    controles: [
      { nombre: 'title', etiqueta: 'Título', tipo: 'texto', inicial: 'Plan Pro' },
      { nombre: 'children', etiqueta: 'Texto', tipo: 'texto', slot: 'children', inicial: 'Renueva el 1 de diciembre de 2026.' },
      { nombre: 'elevated', etiqueta: 'Con sombra', tipo: 'booleano', defecto: false, descripcion: 'Con sombra (con moderación: solo para lo que flota).' },
    ],
    componente: {
      nombre: 'Card',
      slots: { children: 'El cuerpo de la tarjeta.' },
      raiz: [
        el('article', { class: 'card', 'data-elevated': bandera('elevated') }, [
          el('div', { class: 'card-header' }, [el('h4', {}, [texto('title')])]),
          slot(),
        ]),
      ],
    },
    slots: (v) => ({ children: `<p class="muted">${esc(v.children)}</p>` }),
  },

  {
    slug: 'dialogo',
    centrar: true,
    // El diálogo se abre dentro del marco: necesita altura.
    altoMinimo: 460,
    controles: [
      { nombre: 'trigger', etiqueta: 'Botón que lo abre', tipo: 'texto', inicial: 'Eliminar proyecto' },
      { nombre: 'title', etiqueta: 'Título', tipo: 'texto', inicial: '¿Eliminar el proyecto?', descripcion: 'Título visible; también nombra el diálogo.' },
      { nombre: 'children', etiqueta: 'Texto', tipo: 'texto', slot: 'children', inicial: 'Se borrarán sus 12 tareas. No se puede deshacer.' },
      { nombre: 'confirmLabel', etiqueta: 'Acción', tipo: 'texto', inicial: 'Eliminar' },
      { nombre: 'cancelLabel', etiqueta: 'Cancelar', tipo: 'texto', defecto: 'Cancelar' },
      { nombre: 'tone', etiqueta: 'Tono de la acción', tipo: 'opciones', valores: TONOS, defecto: 'brand', inicial: 'danger' },
      { nombre: 'size', etiqueta: 'Tamaño', tipo: 'opciones', valores: TAMANOS, defecto: 'md' },
      { nombre: 'dismissible', etiqueta: 'Se cierra al pulsar fuera', tipo: 'booleano', defecto: true, descripcion: 'Cerrar con clic fuera. Desactívalo en formularios largos.' },
    ],
    componente: {
      nombre: 'Dialog',
      slots: { children: 'El cuerpo del diálogo.' },
      eventos: { confirm: 'Al pulsar la acción principal.' },
      raiz: [
        el('button', { type: 'button', class: 'button', 'data-tone': prop('tone', 'brand'), commandfor: id(), command: 'show-modal' }, [texto('trigger')]),
        el('dialog', { id: id(), class: 'dialog', 'data-size': prop('size', 'md'), 'aria-labelledby': id('-title'), closedby: segunProp('dismissible', 'any', 'closerequest') }, [
          el('header', { class: 'dialog-header' }, [
            el('h2', { id: id('-title') }, [texto('title')]),
            el('button', { type: 'button', class: 'button', 'data-variant': 'ghost', 'data-tone': 'neutral', 'data-icon-only': '', commandfor: id(), command: 'close', 'aria-label': 'Cerrar' }, [crudo(ICONOS.cerrar)]),
          ]),
          el('div', { class: 'dialog-body' }, [slot()]),
          el('footer', { class: 'dialog-footer' }, [
            // El foco empieza en Cancelar: borrar nunca debe ser lo que se pulsa por accidente.
            el('button', { type: 'button', class: 'button', 'data-variant': 'ghost', 'data-tone': 'neutral', commandfor: id(), command: 'close', autofocus: '' }, [texto('cancelLabel')]),
            el('button', { type: 'button', class: 'button', 'data-tone': prop('tone', 'brand'), '@click': evento('confirm') }, [texto('confirmLabel')]),
          ]),
        ]),
      ],
    },
    slots: (v) => ({ children: `<p>${esc(v.children)}</p>` }),
  },

  {
    slug: 'cinta',
    controles: [
      { nombre: 'items', etiqueta: 'Textos (separados por ✧)', tipo: 'lista', separador: '✧', inicial: ['Envío gratis', 'Devoluciones en 30 días', 'Pago seguro'], defecto: [] },
      { nombre: 'tone', etiqueta: 'Tono', tipo: 'opciones', valores: TONOS, defecto: 'brand' },
      { nombre: 'duration', etiqueta: 'Segundos por vuelta', tipo: 'numero', min: 5, max: 60, defecto: 20, ayuda: '--marquee-duration: menos segundos, más rápido.' },
      { nombre: 'pauseLabel', etiqueta: 'Texto del interruptor', tipo: 'texto', defecto: 'Pausar', descripcion: 'Lo que se mueve más de 5 s se tiene que poder pausar (WCAG 2.2.2).' },
    ],
    componente: {
      nombre: 'Marquee',
      raiz: [
        el('div', { class: 'marquee', 'data-tone': prop('tone', 'brand'), style: estilo([['--marquee-duration', prop('duration', 20), 's']]) }, [
          el('div', { class: 'marquee-track' }, [
            el('span', {}, [cada('items', [item(), lit(' '), el('span', { 'aria-hidden': 'true' }, [lit('✧')]), lit(' ')])]),
            el('span', { 'aria-hidden': 'true' }, [unir('items', ' ✧ ', ' ✧')]),
          ]),
          el('div', { class: 'choice marquee-pause' }, [
            el('input', { type: 'checkbox', role: 'switch', switch: '', id: id('-pausa') }),
            el('label', { for: id('-pausa') }, [texto('pauseLabel')]),
          ]),
        ]),
      ],
    },
    slots: () => ({}),
  },

  {
    slug: 'carrusel',
    controles: [
      { nombre: 'label', etiqueta: 'Nombre de la región', tipo: 'texto', inicial: 'Productos destacados', descripcion: 'Lo anuncia el lector de pantalla al llegar.' },
      { nombre: 'itemWidth', etiqueta: 'Ancho de cada uno', tipo: 'opciones', valores: ['min(80%, 18rem)', '60%', '45%', '30%'], defecto: 'min(80%, 18rem)', ayuda: '--carousel-item' },
      { nombre: 'gap', etiqueta: 'Separación', tipo: 'opciones', valores: ['var(--space-2)', 'var(--space-4)', 'var(--space-6)'], defecto: 'var(--space-4)', ayuda: '--carousel-gap' },
      { nombre: 'elementos', etiqueta: 'Elementos del ejemplo', tipo: 'numero', min: 2, max: 10, inicial: 5, demo: true },
    ],
    componente: {
      nombre: 'Carousel',
      slots: { children: 'Los elementos: cada hijo directo es una parada del scroll.' },
      raiz: [
        el(
          'div',
          {
            class: 'carousel',
            role: 'region',
            'aria-label': prop('label'),
            tabindex: '0',
            style: estilo([
              ['--carousel-item', prop('itemWidth', 'min(80%, 18rem)')],
              ['--carousel-gap', prop('gap', 'var(--space-4)')],
            ]),
          },
          [slot()],
        ),
      ],
    },
    slots: (v) => ({
      children: Array.from({ length: Math.max(2, Math.min(10, Number(v.elementos) || 5)) }, (_, i) => `<article class="card">Producto ${i + 1}</article>`).join('\n'),
    }),
  },

  // Casilla, Radio e Interruptor comparten marcado (.choice); cambian el input y los textos.
  ...[
    {
      slug: 'casilla',
      nombre: 'Checkbox',
      label: 'Recibir el resumen semanal',
      hint: 'Cada lunes, con lo más importante.',
      name: 'resumen',
      input: { type: 'checkbox' },
      marcada: 'Marcada',
    },
    {
      slug: 'radio',
      nombre: 'Radio',
      label: 'Plan anual',
      hint: 'Ahorras dos meses.',
      name: 'plan',
      input: { type: 'radio', value: 'anual' },
      marcada: 'Elegida',
    },
    {
      slug: 'interruptor',
      nombre: 'Switch',
      label: 'Perfil público',
      hint: 'Cualquiera con el enlace ve tu perfil.',
      name: 'perfil',
      // role="switch" se anuncia como activado/desactivado; el atributo switch lo hace nativo en Safari.
      input: { type: 'checkbox', role: 'switch', switch: '' },
      marcada: 'Activado',
    },
  ].map((c) => ({
    slug: c.slug,
    controles: [
      { nombre: 'label', etiqueta: 'Etiqueta', tipo: 'texto', inicial: c.label },
      { nombre: 'hint', etiqueta: 'Ayuda', tipo: 'texto', inicial: c.hint },
      { nombre: 'name', etiqueta: 'Nombre del campo', tipo: 'texto', inicial: c.name },
      { nombre: 'checked', etiqueta: c.marcada, tipo: 'booleano', defecto: false },
      { nombre: 'disabled', etiqueta: 'Deshabilitado', tipo: 'booleano', defecto: false },
    ],
    componente: {
      nombre: c.nombre,
      raiz: [
        el('div', { class: 'choice' }, [
          el('input', {
            ...c.input,
            id: id(),
            name: prop('name'),
            checked: booleano('checked'),
            disabled: booleano('disabled'),
            'aria-describedby': idSi('hint', '-hint'),
          }),
          si('!hint', [el('label', { for: id() }, [texto('label')])]),
          si('hint', [el('div', {}, [el('label', { for: id() }, [texto('label')]), el('p', { class: 'hint', id: id('-hint') }, [texto('hint')])])]),
        ]),
      ],
    },
    slots: () => ({}),
  })),

  {
    slug: 'popover',
    centrar: true,
    altoMinimo: 300,
    controles: [
      { nombre: 'trigger', etiqueta: 'Botón', tipo: 'texto', inicial: 'Acciones' },
      { nombre: 'items', etiqueta: 'Acciones (separadas por |)', tipo: 'lista', separador: '|', inicial: ['Renombrar', 'Duplicar', 'Mover a…'], defecto: [] },
      { nombre: 'danger', etiqueta: 'Acción peligrosa', tipo: 'texto', inicial: 'Eliminar', descripcion: 'La última, separada y en rojo (con texto: el color no va solo).' },
    ],
    componente: {
      nombre: 'Popover',
      raiz: [
        el('button', { type: 'button', class: 'button', 'data-variant': 'outline', 'data-tone': 'neutral', commandfor: id(), command: 'toggle-popover' }, [texto('trigger')]),
        el('div', { class: 'popover', id: id(), popover: '' }, [
          cada('items', [el('button', { type: 'button', class: 'popover-item', commandfor: id(), command: 'hide-popover' }, [item()])]),
          si('danger', [el('hr'), el('button', { type: 'button', class: 'popover-item', 'data-tone': 'danger', commandfor: id(), command: 'hide-popover' }, [texto('danger')])]),
        ]),
      ],
    },
    slots: () => ({}),
  },

  {
    slug: 'tipografia',
    controles: [
      { nombre: 'children', etiqueta: 'Texto', tipo: 'texto', slot: 'children', inicial: 'El color comunica, no decora.' },
      { nombre: 'size', etiqueta: 'Tamaño', tipo: 'opciones', valores: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'], defecto: 'md' },
      { nombre: 'weight', etiqueta: 'Peso', tipo: 'opciones', valores: ['regular', 'medium', 'bold'], defecto: 'regular' },
      { nombre: 'tone', etiqueta: 'Tono', tipo: 'opciones', valores: ['', ...TONOS], inicial: '', descripcion: 'Color de estado (texto ≥ 4.5:1).' },
      { nombre: 'align', etiqueta: 'Alineación', tipo: 'opciones', valores: ['start', 'center', 'end'], defecto: 'start', ayuda: 'Lógica: en RTL, start es la derecha.' },
      { nombre: 'muted', etiqueta: 'Secundario', tipo: 'booleano', defecto: false },
      { nombre: 'numeric', etiqueta: 'Cifras tabulares', tipo: 'booleano', defecto: false },
    ],
    componente: {
      nombre: 'Text',
      slots: { children: 'El texto.' },
      raiz: [
        el(
          'p',
          {
            class: 'text',
            'data-size': prop('size', 'md'),
            'data-weight': prop('weight', 'regular'),
            'data-tone': prop('tone'),
            'data-align': prop('align', 'start'),
            'data-muted': bandera('muted'),
            'data-numeric': bandera('numeric'),
          },
          [slot()],
        ),
      ],
    },
    slots: (v) => ({ children: esc(v.children) }),
  },

  {
    slug: 'selector',
    altoMinimo: 320,
    controles: [
      { nombre: 'label', etiqueta: 'Etiqueta', tipo: 'texto', inicial: 'País' },
      { nombre: 'name', etiqueta: 'Nombre del campo', tipo: 'texto', inicial: 'pais' },
      { nombre: 'placeholder', etiqueta: 'Primera opción vacía', tipo: 'texto', inicial: 'Elige un país' },
      { nombre: 'items', etiqueta: 'Opciones (separadas por |)', tipo: 'lista', separador: '|', inicial: ['Argentina', 'Colombia', 'España', 'México'], defecto: [] },
      { nombre: 'required', etiqueta: 'Obligatorio', tipo: 'booleano', defecto: false },
      { nombre: 'disabled', etiqueta: 'Deshabilitado', tipo: 'booleano', defecto: false },
    ],
    componente: {
      nombre: 'Select',
      raiz: [
        el('div', { class: 'field' }, [
          el('label', { for: id() }, [texto('label')]),
          el('select', { class: 'input', id: id(), name: prop('name'), required: booleano('required'), disabled: booleano('disabled') }, [
            si('placeholder', [el('option', { value: '' }, [texto('placeholder')])]),
            cada('items', [el('option', {}, [item()])]),
          ]),
        ]),
      ],
    },
    slots: () => ({}),
  },
];

export const definicion = (slug) => DEFINICIONES.find((d) => d.slug === slug);

/** Los valores con los que empieza el playground. */
export const valoresPorDefecto = (def) => Object.fromEntries(def.controles.map((c) => [c.nombre, structuredClone(c.inicial ?? c.defecto ?? (c.tipo === 'booleano' ? false : ''))]));

/** El componente con su API: las props son los controles que no llenan un slot ni son del ejemplo. */
export function componenteDe(def) {
  return {
    ...def.componente,
    props: def.controles
      .filter((c) => !c.slot && !c.demo)
      .map(({ nombre, tipo, valores, defecto, descripcion }) => ({ nombre, tipo, valores, defecto, descripcion })),
  };
}

/** Las props del componente para unos valores del playground. */
export const propsDe = (def, valores) => Object.fromEntries(componenteDe(def).props.map((p) => [p.nombre, valores[p.nombre]]));

/** El HTML de la vista previa: el componente con esas props y el contenido de sus slots. */
export const htmlDe = (def, valores, base = `pg-${def.slug}`) => renderHtml(componenteDe(def), propsDe(def, valores), def.slots(valores), base);
