/**
 * Demos de «Interacciones»: lo que hoy hace la plataforma casi sin JS. Cada demo es una carpeta en
 * src/demos/ con su HTML, CSS y JS: lo que se ejecuta en la página es lo mismo que se muestra.
 *
 * usa: ids de web-features (la página calcula su Baseline y qué parte de los usuarios lo ve).
 * sinSoporte: qué se ve en un navegador que no lo tiene.
 */
import avisosHtml from '../demos/avisos/demo.html?raw';
import avisosCss from '../demos/avisos/avisos.css?raw';
import avisosJs from '../demos/avisos/avisos.js?raw';
import expandirHtml from '../demos/expandir/demo.html?raw';
import expandirCss from '../demos/expandir/expandir.css?raw';
import expandirJs from '../demos/expandir/expandir.js?raw';
import revelarHtml from '../demos/revelar/demo.html?raw';
import revelarCss from '../demos/revelar/revelar.css?raw';
import menuHtml from '../demos/menu/demo.html?raw';
import menuCss from '../demos/menu/menu.css?raw';
import acordeonHtml from '../demos/acordeon/demo.html?raw';

/**
 * @typedef {{ nombre: string, archivo: string, lenguaje: string, codigo: string }} Archivo
 * @typedef {{ id: string, titulo: string, resumen: string, html: string, css?: string,
 *   archivos: Archivo[], usa: string[], sinSoporte: string, enlace?: { texto: string, href: string } }} Demo
 */

/** @type {Demo[]} */
export const DEMOS = [
  {
    id: 'avisos',
    titulo: 'Avisos que entran y salen',
    resumen:
      'Avisos emergentes en la capa superior, por encima de cualquier diálogo, sin z-index. Entran y salen con una transición solo de CSS; se quedan mientras el ratón o el foco están encima, y el lector de pantalla los anuncia.',
    html: avisosHtml,
    css: avisosCss,
    archivos: [
      { nombre: 'JS', archivo: 'avisos.js', lenguaje: 'js', codigo: avisosJs },
      { nombre: 'CSS', archivo: 'avisos.css', lenguaje: 'css', codigo: avisosCss },
      {
        nombre: 'Uso',
        archivo: 'main.js',
        lenguaje: 'js',
        codigo: `import { avisar } from './avisos.js';

avisar('Cambios guardados.', { tono: 'success' });
avisar('No se pudo enviar. Revisa tu conexión.', { tono: 'danger', duracion: 8000 });

// En React, Vue o Angular es igual: avisar() solo usa el DOM. Llámalo desde un evento.`,
      },
    ],
    usa: ['popover', 'starting-style', 'transition-behavior'],
    sinSoporte: 'Sin @starting-style, el aviso aparece sin animación. Sin popover, angela() carga un polyfill.',
  },
  {
    id: 'expandir',
    titulo: 'Tarjeta que se expande',
    resumen:
      'Al abrir una tarjeta, la imagen y el texto viajan a su nuevo sitio y tamaño. El navegador fotografía el antes y el después (View Transitions) y anima la diferencia: el JS solo cambia aria-expanded.',
    html: expandirHtml,
    css: expandirCss,
    archivos: [
      { nombre: 'HTML', archivo: 'productos.html', lenguaje: 'html', codigo: expandirHtml },
      { nombre: 'CSS', archivo: 'expandir.css', lenguaje: 'css', codigo: expandirCss },
      { nombre: 'JS', archivo: 'expandir.js', lenguaje: 'js', codigo: expandirJs },
      {
        nombre: 'En React',
        archivo: 'Producto.tsx',
        lenguaje: 'tsx',
        codigo: `import { useState } from 'react';
import { flushSync } from 'react-dom';

// React pinta después del evento: flushSync hace que el cambio ocurra dentro de la transición.
function alternar(cambiar: () => void) {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || quieto) return cambiar();
  document.startViewTransition(() => flushSync(cambiar));
}

export function Productos({ productos }: { productos: { id: string; nombre: string; detalle: string }[] }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  return (
    <ul className="expandir" role="list">
      {productos.map((p) => (
        <li key={p.id} style={{ viewTransitionName: \`producto-\${p.id}\` }}>
          <button
            className="expandir-cabecera"
            type="button"
            aria-expanded={abierto === p.id}
            aria-controls={\`det-\${p.id}\`}
            onClick={() => alternar(() => setAbierto(abierto === p.id ? null : p.id))}
          >
            {p.nombre}
          </button>
          <div className="expandir-detalle" id={\`det-\${p.id}\`}>{p.detalle}</div>
        </li>
      ))}
    </ul>
  );
}`,
      },
    ],
    usa: ['view-transitions', 'has'],
    sinSoporte: 'Sin View Transitions (o con «reducir movimiento»), la tarjeta se abre al instante.',
  },
  {
    id: 'revelar',
    titulo: 'Aparición al hacer scroll',
    resumen:
      'Cada tarjeta aparece al entrar en la zona visible, y la animación avanza con el scroll, no con el tiempo. Solo CSS: ni IntersectionObserver ni JS.',
    html: revelarHtml,
    css: revelarCss,
    archivos: [
      { nombre: 'HTML', archivo: 'novedades.html', lenguaje: 'html', codigo: revelarHtml },
      { nombre: 'CSS', archivo: 'revelar.css', lenguaje: 'css', codigo: revelarCss },
    ],
    usa: ['scroll-driven-animations'],
    sinSoporte: 'Sin animaciones con el scroll (o con «reducir movimiento»), las tarjetas se ven quietas desde el principio.',
  },
  {
    id: 'menu',
    titulo: 'Menú que se recoloca',
    resumen:
      'Un menú anclado a su botón que se abre sin JS (commandfor) y, si no cabe debajo, se coloca encima solo. Es el .popover de angela: anchor positioning con posiciones de reserva.',
    html: menuHtml,
    css: menuCss,
    archivos: [{ nombre: 'HTML', archivo: 'menu.html', lenguaje: 'html', codigo: menuHtml.replace(/<div class="menu-zona">\n\s*<p[^>]*>.*<\/p>\n/, '').replace(/\n<\/div>\n?$/, '').replace(/^ {2}/gm, '') }],
    usa: ['popover', 'invoker-commands', 'anchor-positioning'],
    sinSoporte: 'Sin anchor positioning, el menú se abre como una hoja en la parte inferior. Sin popover ni commandfor, angela() carga sus polyfills.',
    enlace: { texto: 'Popover', href: '/componentes/popover' },
  },
  {
    id: 'acordeon',
    titulo: 'Acordeón exclusivo y animado',
    resumen:
      'Al abrir una pregunta se cierra la anterior (<details name>) y el contenido se despliega con su altura real animada (::details-content e interpolate-size). Sin una línea de JS.',
    html: acordeonHtml,
    archivos: [{ nombre: 'HTML', archivo: 'faq.html', lenguaje: 'html', codigo: acordeonHtml }],
    usa: ['details-name', 'details-content', 'interpolate-size'],
    sinSoporte: 'Sin name, se pueden abrir varias a la vez. Sin ::details-content o interpolate-size, se abren sin animación.',
    enlace: { texto: 'Acordeón', href: '/componentes/acordeon' },
  },
];
