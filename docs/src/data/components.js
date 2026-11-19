import { icon } from './icons.js';

/**
 * Catálogo de componentes. Cada ejemplo es HTML real: se renderiza en vivo y se muestra su código.
 * Los ids deben ser únicos dentro de la página del componente.
 */
export const components = [
  {
    slug: 'boton',
    title: 'Botón',
    summary: 'Acciones con <button> y navegación con <a>, con variantes, tonos y tamaños.',
    examples: [
      {
        title: 'Variantes',
        note: 'Una sola acción primaria (solid) por vista. Las demás, soft, outline o ghost.',
        code: `<div class="cluster">
  <button class="button" type="button">Guardar</button>
  <button class="button" type="button" data-variant="soft">Vista previa</button>
  <button class="button" type="button" data-variant="outline">Exportar</button>
  <button class="button" type="button" data-variant="ghost">Cancelar</button>
</div>`,
      },
      {
        title: 'Tonos',
        note: 'El color solo comunica intención o estado. data-tone cambia todos los colores del componente a la vez.',
        code: `<div class="stack" style="--stack-gap: var(--space-3)">
  <div class="cluster">
    <button class="button" type="button" data-tone="brand">Marca</button>
    <button class="button" type="button" data-tone="neutral">Neutral</button>
    <button class="button" type="button" data-tone="success">Éxito</button>
    <button class="button" type="button" data-tone="warning">Aviso</button>
    <button class="button" type="button" data-tone="danger">Peligro</button>
    <button class="button" type="button" data-tone="info">Info</button>
  </div>
  <div class="cluster">
    <button class="button" type="button" data-variant="soft" data-tone="brand">Marca</button>
    <button class="button" type="button" data-variant="soft" data-tone="neutral">Neutral</button>
    <button class="button" type="button" data-variant="soft" data-tone="success">Éxito</button>
    <button class="button" type="button" data-variant="soft" data-tone="warning">Aviso</button>
    <button class="button" type="button" data-variant="soft" data-tone="danger">Peligro</button>
    <button class="button" type="button" data-variant="soft" data-tone="info">Info</button>
  </div>
</div>`,
      },
      {
        title: 'Tamaños',
        code: `<div class="cluster">
  <button class="button" type="button" data-size="sm">Pequeño</button>
  <button class="button" type="button">Mediano</button>
  <button class="button" type="button" data-size="lg">Grande</button>
</div>`,
      },
      {
        title: 'Con ícono y solo ícono',
        note: 'El ícono es decorativo (aria-hidden). Un botón solo-ícono necesita aria-label con un nombre que diga qué hace.',
        code: `<div class="cluster">
  <button class="button" type="button">${icon('plus')} Nuevo cliente</button>
  <button class="button" type="button" data-variant="outline" data-tone="neutral">${icon('download')} Descargar</button>
  <button class="button" type="button" data-variant="ghost" data-tone="neutral" data-icon-only aria-label="Editar perfil">${icon('pencil')}</button>
  <button class="button" type="button" data-variant="ghost" data-tone="danger" data-icon-only aria-label="Eliminar perfil">${icon('trash')}</button>
</div>`,
      },
      {
        title: 'Estados',
        note: 'disabled saca el botón del orden de tabulación. aria-disabled="true" lo mantiene enfocable (útil para explicar por qué no está disponible), pero tú debes bloquear la acción en JS. aria-pressed crea un botón conmutador.',
        code: `<div class="cluster">
  <button class="button" type="button" disabled>Deshabilitado</button>
  <button class="button" type="button" aria-disabled="true" aria-describedby="pago-motivo">Pagar</button>
  <span id="pago-motivo" class="muted">Completa la dirección para pagar.</span>
  <button class="button" type="button" data-variant="outline" data-tone="neutral" aria-pressed="true">Negrita</button>
</div>`,
      },
      {
        title: 'Enlace con aspecto de botón',
        note: 'Si lleva a otra página, es un enlace: conserva abrir en pestaña nueva, copiar URL y funciona sin JS.',
        code: `<a class="button" data-variant="outline" href="#">Ver documentación</a>`,
      },
    ],
    api: [
      ['data-variant', 'solid (defecto) · soft · outline · ghost'],
      ['data-tone', 'brand (defecto) · neutral · success · warning · danger · info'],
      ['data-size', 'sm · md (defecto) · lg'],
      ['data-icon-only', 'Botón cuadrado solo con ícono. Requiere aria-label.'],
      ['data-block', 'Ocupa todo el ancho disponible.'],
      ['aria-pressed', 'true/false para botones conmutadores.'],
    ],
    a11y: [
      'Usa <button type="button"> para acciones y <a href> para navegar. Nunca <div onclick>.',
      'Dentro de un formulario, el botón que envía es type="submit" y los demás type="button".',
      'Altura mínima de 40 px (44 px en pantallas táctiles): supera el objetivo de 24 px de WCAG 2.5.8.',
      'Foco visible con anillo de 2 px y contraste ≥ 3:1. En modo de alto contraste el borde transparente se vuelve visible.',
      'Texto sobre el color sólido con contraste ≥ 4.5:1 para cualquier tono de la paleta.',
    ],
  },

  {
    slug: 'campos',
    title: 'Campos de texto',
    summary: 'Input, select y textarea nativos con etiqueta, ayuda y error accesible.',
    examples: [
      {
        title: 'Campo con ayuda',
        note: 'La etiqueta va siempre visible y antes del control. La ayuda se enlaza con aria-describedby.',
        code: `<div class="field">
  <label for="c-nombre">Nombre completo</label>
  <p class="hint" id="c-nombre-hint">Como aparece en tu documento.</p>
  <input class="input" id="c-nombre" name="nombre" autocomplete="name" aria-describedby="c-nombre-hint">
</div>`,
      },
      {
        title: 'Validación accesible',
        note: 'El error aparece al salir del campo (no mientras escribes) gracias a :user-invalid. angela/js sincroniza aria-invalid, enlaza el mensaje y lo anuncia. Prueba a escribir un correo incompleto y salir del campo, o envía el formulario vacío.',
        code: `<form class="stack" action="#" method="post" aria-labelledby="c-form-titulo">
  <h4 id="c-form-titulo">Crear cuenta</h4>
  <div class="field">
    <label for="c-email">Correo <span aria-hidden="true">*</span></label>
    <input class="input" id="c-email" name="email" type="email" required autocomplete="email"
      autocapitalize="none" spellcheck="false" data-error="c-email-error">
    <p class="error" id="c-email-error">Escribe un correo válido, por ejemplo ana@correo.com.</p>
  </div>
  <div class="field">
    <label for="c-pass">Contraseña <span aria-hidden="true">*</span></label>
    <p class="hint" id="c-pass-hint">Mínimo 8 caracteres.</p>
    <input class="input" id="c-pass" name="password" type="password" required minlength="8"
      autocomplete="new-password" aria-describedby="c-pass-hint" data-error="c-pass-error">
    <p class="error" id="c-pass-error">La contraseña necesita al menos 8 caracteres.</p>
  </div>
  <div class="cluster">
    <button class="button" type="submit">Crear cuenta</button>
  </div>
</form>`,
      },
      {
        title: 'Error del servidor',
        note: 'Si el error viene del servidor, renderiza aria-invalid="true" y enlaza el mensaje en aria-describedby. El script lo respeta.',
        code: `<div class="field">
  <label for="c-usuario">Usuario</label>
  <input class="input" id="c-usuario" name="usuario" value="ana" aria-invalid="true"
    aria-describedby="c-usuario-error" autocapitalize="none" spellcheck="false">
  <p class="error" id="c-usuario-error">Ese usuario ya existe. Prueba con otro.</p>
</div>`,
      },
      {
        title: 'Select y textarea',
        note: 'El select es nativo: en móvil abre el selector del sistema. El textarea crece con el contenido donde se soporta field-sizing.',
        code: `<div class="stack">
  <div class="field">
    <label for="c-pais">País</label>
    <select class="input" id="c-pais" name="pais" autocomplete="country">
      <option value="">Elige un país</option>
      <option>Argentina</option>
      <option>Colombia</option>
      <option>España</option>
      <option>México</option>
      <option>Perú</option>
      <option>Chile</option>
    </select>
  </div>
  <div class="field">
    <label for="c-mensaje">Mensaje</label>
    <textarea class="input" id="c-mensaje" name="mensaje"></textarea>
  </div>
</div>`,
      },
      {
        title: 'Deshabilitado y solo lectura',
        code: `<div class="stack">
  <div class="field">
    <label for="c-dis">Código de cliente</label>
    <input class="input" id="c-dis" value="CL-2048" disabled>
  </div>
  <div class="field">
    <label for="c-ro">Fecha de alta</label>
    <input class="input" id="c-ro" value="18/11/2026" readonly>
  </div>
</div>`,
      },
    ],
    api: [
      ['.field', 'Contenedor: etiqueta, ayuda, control y error en una columna.'],
      ['.input', 'Para <input>, <select> y <textarea>. data-size="sm|lg".'],
      ['.hint', 'Texto de ayuda. Enlázalo con aria-describedby.'],
      ['.error', 'Mensaje de error. Se muestra con :user-invalid o aria-invalid="true".'],
      ['data-error', 'En el control: id de su mensaje de error (lo usa angela/js).'],
      ['.fieldset', 'Para <fieldset> con <legend> como primer hijo.'],
    ],
    a11y: [
      'Cada control tiene un <label for> visible. El placeholder nunca sustituye a la etiqueta.',
      'Usa los atributos nativos: required, minlength, pattern, type="email"… y autocomplete para datos personales.',
      'El error no se muestra antes de interactuar y no se anuncia en cada tecla.',
      'El estado de error se comunica con texto e ícono, no solo con color.',
      'Fuente de 16 px mínimo en los controles para evitar el zoom de iOS.',
      'Inputs numéricos: usa inputmode="numeric" con type="text" para códigos, tarjetas o documentos (sin ceros perdidos).',
    ],
  },

  {
    slug: 'seleccion',
    title: 'Selección',
    summary: 'Casillas, radios e interruptores nativos, teñidos con el color de marca.',
    examples: [
      {
        title: 'Casillas',
        note: 'Para opciones independientes. Agrupa con <fieldset> y <legend>.',
        code: `<fieldset class="fieldset">
  <legend>Notificaciones</legend>
  <div class="choice">
    <input type="checkbox" id="s-email" name="notif" value="email" checked>
    <label for="s-email">Por correo</label>
  </div>
  <div class="choice">
    <input type="checkbox" id="s-sms" name="notif" value="sms">
    <label for="s-sms">Por SMS</label>
  </div>
  <div class="choice">
    <input type="checkbox" id="s-push" name="notif" value="push" disabled>
    <label for="s-push">Notificaciones push (próximamente)</label>
  </div>
</fieldset>`,
      },
      {
        title: 'Radios',
        note: 'De 2 a 5 opciones excluyentes: radios visibles. Con 6 o más, mejor un select.',
        code: `<fieldset class="fieldset">
  <legend>Plan</legend>
  <div class="choice">
    <input type="radio" id="s-mensual" name="plan" value="mensual" checked>
    <label for="s-mensual">Mensual</label>
  </div>
  <div class="choice">
    <input type="radio" id="s-anual" name="plan" value="anual" aria-describedby="s-anual-hint">
    <div>
      <label for="s-anual">Anual</label>
      <p class="hint" id="s-anual-hint">Ahorras dos meses.</p>
    </div>
  </div>
</fieldset>`,
      },
      {
        title: 'Interruptor',
        note: 'Un checkbox con role="switch": se anuncia como "activado/desactivado". El atributo switch lo hace nativo en Safari.',
        code: `<div class="choice">
  <input type="checkbox" role="switch" switch id="s-oscuro" name="modo-oscuro">
  <label for="s-oscuro">Recibir resumen semanal</label>
</div>`,
      },
    ],
    api: [
      ['.choice', 'Fila con el control y su etiqueta (o un bloque etiqueta + ayuda).'],
      ['role="switch" / switch', 'Convierte un checkbox en interruptor.'],
      ['.fieldset', 'Agrupa opciones relacionadas con su <legend>.'],
    ],
    a11y: [
      'Controles 100 % nativos: teclado, lectores de pantalla y estado indeterminado gratis.',
      'La etiqueta va después del control y también es área de clic.',
      'El color de marca se aplica con accent-color; el interruptor cumple contraste 3:1 en ambos estados.',
      'En modo de alto contraste el interruptor usa colores del sistema.',
    ],
  },

  {
    slug: 'dialogo',
    title: 'Diálogo',
    summary: 'Modales con <dialog> nativo y comandos declarativos, sin trampas de foco a mano.',
    examples: [
      {
        title: 'Formulario en modal',
        note: 'Patrón CTA: botón de acción → modal con cabecera (título y cerrar), cuerpo con scroll y pie (Cancelar ghost + acción primaria). Se abre sin JS con command="show-modal".',
        code: `<button class="button" type="button" commandfor="d-cliente" command="show-modal">${icon('plus')} Nuevo cliente</button>

<dialog class="dialog" id="d-cliente" aria-labelledby="d-cliente-titulo" closedby="any">
  <header class="dialog-header">
    <h2 id="d-cliente-titulo">Nuevo cliente</h2>
    <button class="button" type="button" data-variant="ghost" data-tone="neutral" data-icon-only
      commandfor="d-cliente" command="close" aria-label="Cerrar">${icon('x')}</button>
  </header>
  <div class="dialog-body">
    <form id="d-cliente-form" class="stack" method="dialog">
      <div class="field">
        <label for="d-nombre">Nombre</label>
        <input class="input" id="d-nombre" name="nombre" required autocomplete="name" autofocus data-error="d-nombre-error">
        <p class="error" id="d-nombre-error">Escribe el nombre del cliente.</p>
      </div>
      <div class="field">
        <label for="d-email">Correo</label>
        <input class="input" id="d-email" name="email" type="email" autocomplete="email" data-error="d-email-error">
        <p class="error" id="d-email-error">Escribe un correo válido.</p>
      </div>
    </form>
  </div>
  <footer class="dialog-footer">
    <button class="button" type="button" data-variant="ghost" data-tone="neutral" commandfor="d-cliente" command="close">Cancelar</button>
    <button class="button" type="submit" form="d-cliente-form" value="guardar">Guardar cliente</button>
  </footer>
</dialog>`,
      },
      {
        title: 'Confirmar una eliminación',
        note: 'Toda eliminación pide confirmación. El foco inicial va a la opción segura (Cancelar). El diálogo devuelve el botón pulsado en dialog.returnValue.',
        code: `<button class="button" type="button" data-variant="outline" data-tone="danger" commandfor="d-borrar" command="show-modal">${icon('trash')} Eliminar proyecto</button>

<dialog class="dialog" id="d-borrar" data-size="sm" aria-labelledby="d-borrar-titulo" aria-describedby="d-borrar-desc">
  <div class="dialog-body stack" style="--stack-gap: var(--space-2)">
    <h2 id="d-borrar-titulo" style="font-size: var(--fs-lg); margin: 0">¿Eliminar el proyecto?</h2>
    <p id="d-borrar-desc" class="muted">Se borrarán sus 12 tareas. Esta acción no se puede deshacer.</p>
  </div>
  <form class="dialog-footer" method="dialog">
    <button class="button" value="cancelar" data-variant="ghost" data-tone="neutral" autofocus>Cancelar</button>
    <button class="button" value="eliminar" data-tone="danger">Eliminar</button>
  </form>
</dialog>`,
      },
    ],
    api: [
      ['.dialog', 'En <dialog>. data-size="sm|lg" (32rem por defecto).'],
      ['.dialog-header / -body / -footer', 'Cabecera, cuerpo con scroll y pie de acciones.'],
      ['.dialog-form', 'Un <form> que envuelve cabecera, cuerpo y pie, para que el botón de enviar del pie quede dentro del formulario.'],
      ['command="show-modal"', 'En el botón que abre, junto con commandfor="id-del-diálogo".'],
      ['command="close"', 'Cierra el diálogo. Fuera de un <form>, o con type="button".'],
      ['closedby="any"', 'Permite cerrar con clic fuera (angela/js lo completa en Safari).'],
    ],
    a11y: [
      'El navegador vuelve inerte la página, contiene el foco, cierra con Esc y devuelve el foco al botón que lo abrió. No añadas role="dialog", aria-modal ni trampas de foco.',
      'Nombra el diálogo con aria-labelledby apuntando a su título.',
      'Pon autofocus en el primer campo, o en la opción segura si la acción es destructiva.',
      'El fondo no se desplaza mientras el modal está abierto (overscroll-behavior, sin overflow:hidden en <body>).',
      'Animación corta; con movimiento reducido solo se desvanece.',
    ],
  },

  {
    slug: 'popover',
    title: 'Popover',
    summary: 'Paneles anclados a su botón con la API Popover y CSS Anchor Positioning.',
    examples: [
      {
        title: 'Grupo de acciones',
        note: 'Se cierra con Esc o al hacer clic fuera. No es un menú ARIA: se recorre con Tab, sin flechas. Si el navegador no soporta anclaje, aparece como hoja inferior.',
        code: `<button class="button" type="button" data-variant="outline" data-tone="neutral" commandfor="p-acciones" command="toggle-popover">Acciones ${icon('more')}</button>
<div class="popover" id="p-acciones" popover>
  <button class="popover-item" type="button" commandfor="p-acciones" command="hide-popover">${icon('pencil')} Renombrar</button>
  <button class="popover-item" type="button" commandfor="p-acciones" command="hide-popover">${icon('copy')} Duplicar <span class="popover-hint" aria-hidden="true">Ctrl D</span></button>
  <hr>
  <button class="popover-item" type="button" data-tone="danger" commandfor="p-acciones" command="hide-popover">${icon('trash')} Eliminar</button>
</div>`,
      },
      {
        title: 'Panel informativo',
        code: `<button class="button" type="button" data-variant="ghost" commandfor="p-info" command="toggle-popover">${icon('info')} ¿Qué es esto?</button>
<div class="popover prose" id="p-info" popover data-padding="lg">
  <p style="margin: 0">El saldo disponible descuenta los pagos que aún están en proceso.</p>
</div>`,
      },
    ],
    api: [
      ['.popover', 'En un elemento con el atributo popover.'],
      ['data-padding="lg"', 'Más relleno para contenido de texto.'],
      ['.popover-item', 'Botón o enlace de acción dentro del panel. Admite data-tone.'],
      ['command="toggle-popover"', 'En el botón que lo abre, con commandfor="id".'],
    ],
    a11y: [
      'El botón expone automáticamente su estado expandido; no añadas aria-haspopup (prometería un menú ARIA).',
      'Coloca el panel justo después de su botón en el DOM, para que el orden de lectura sea natural.',
      'Al cerrar desde un botón interno, angela/js devuelve el foco al botón que lo abrió.',
      'Para un menú con flechas (role="menu") hace falta más comportamiento: está en la hoja de ruta.',
    ],
  },

  {
    slug: 'pestanas',
    title: 'Pestañas',
    summary: 'Pestañas accesibles con focusgroup nativo y un elemento personalizado mínimo.',
    examples: [
      {
        title: 'Pestañas',
        note: 'Usa las flechas para moverte (la selección sigue al foco), Inicio y Fin. Si no caben, la fila se desplaza con un desvanecido en los bordes. El contenido oculto se encuentra con Ctrl+F donde hay soporte.',
        code: `<angela-tabs class="tabs">
  <div class="tablist" role="tablist" focusgroup="tablist nomemory" aria-label="Detalles del pedido">
    <button type="button" role="tab" id="t-resumen" aria-selected="true" focusgroupstart>Resumen</button>
    <button type="button" role="tab" id="t-envio" aria-selected="false">Envío</button>
    <button type="button" role="tab" id="t-pagos" aria-selected="false">Pagos</button>
    <button type="button" role="tab" id="t-historial" aria-selected="false">Historial</button>
  </div>
  <div role="tabpanel" aria-labelledby="t-resumen" tabindex="0">
    <p>Pedido #1024 · 3 productos · Total 128,40 €.</p>
  </div>
  <div role="tabpanel" aria-labelledby="t-envio" hidden="until-found">
    <p>Envío estándar a Calle Mayor 12, Madrid. Llega el jueves.</p>
  </div>
  <div role="tabpanel" aria-labelledby="t-pagos" hidden="until-found">
    <p>Pagado con tarjeta terminada en 4242 el 18/11/2026.</p>
  </div>
  <div role="tabpanel" aria-labelledby="t-historial" hidden="until-found">
    <p>Creado el 17/11 · Pagado el 18/11 · Enviado el 18/11.</p>
  </div>
</angela-tabs>`,
      },
    ],
    api: [
      ['<angela-tabs>', 'Contenedor. Emite el evento tabchange con { tab, panel }.'],
      ['.tablist[focusgroup="tablist nomemory"]', 'Fila de pestañas, con role="tablist". Necesita aria-label o aria-labelledby.'],
      ['role="tab"', 'En cada <button>. focusgroup ya infiere estos roles; escribirlos hace que validadores como axe los vean.'],
      ['aria-selected', 'En cada <button>: true en la seleccionada (renderízalo en el HTML inicial).'],
      ['role="tabpanel"', 'Paneles, con aria-labelledby apuntando a su pestaña y hidden="until-found" si no están activos.'],
    ],
    a11y: [
      'No uses pestañas para navegar entre páginas: para eso es un <nav> con enlaces.',
      'La pestaña seleccionada se indica con color y subrayado (no solo color), y el subrayado sobrevive al alto contraste.',
      'Una sola parada de Tab para toda la fila; las flechas mueven entre pestañas.',
      'Renderiza el estado inicial en el HTML para que no se vean todos los paneles antes de que cargue el JS.',
    ],
  },

  {
    slug: 'desplegable',
    title: 'Desplegable y acordeón',
    summary: 'Contenido plegable con <details> y <summary>, sin JavaScript.',
    examples: [
      {
        title: 'Desplegable',
        code: `<details class="disclosure">
  <summary>¿Puedo cambiar de plan más adelante?</summary>
  <p>Sí. El cambio se aplica en tu siguiente factura y se prorratea el importe.</p>
</details>`,
      },
      {
        title: 'Acordeón',
        note: 'Varios <details> seguidos. Evita la versión exclusiva (atributo name) salvo que el diseño lo exija: impide comparar contenidos y puede desplazar el contenido fuera de la vista.',
        code: `<section class="accordion" aria-labelledby="acc-titulo">
  <h4 id="acc-titulo">Preguntas frecuentes</h4>
  <details class="disclosure">
    <summary>¿Cómo cambio la paleta?</summary>
    <p>Cambia --angela-brand-h y --angela-brand-c en :root. Todo lo demás se recalcula.</p>
  </details>
  <details class="disclosure">
    <summary>¿Necesito JavaScript?</summary>
    <p>No para los estilos. angela/js solo añade mejoras: validación accesible, pestañas y tema.</p>
  </details>
  <details class="disclosure">
    <summary>¿Funciona con Tailwind?</summary>
    <p>Sí. Importa angela/tailwind.css para usar los tokens como utilidades.</p>
  </details>
</section>`,
      },
    ],
    api: [
      ['.disclosure', 'En <details>. El chevron gira y el contenido se anima donde hay soporte.'],
      ['.accordion', 'Agrupa varios .disclosure con separadores.'],
      ['name="grupo"', 'Atributo nativo de <details> para que solo uno esté abierto.'],
    ],
    a11y: [
      'No pongas encabezados dentro de <summary>: algunos lectores de pantalla los descartan.',
      'Sin flechas ni tabindex itinerante: cada summary es una parada de Tab normal.',
      'El contenido cerrado sigue siendo buscable con Ctrl+F donde se soporta.',
    ],
  },

  {
    slug: 'avisos',
    title: 'Avisos, etiquetas y progreso',
    summary: 'Mensajes de estado, etiquetas y barras de progreso nativas.',
    examples: [
      {
        title: 'Avisos',
        note: 'Cada aviso tiene ícono y título además del color, así el estado no depende solo del color.',
        code: `<div class="stack" style="--stack-gap: var(--space-3)">
  <div class="callout" data-tone="info">
    ${icon('info')}
    <div><p class="callout-title">Novedad</p><p>Ya puedes exportar tus informes a PDF.</p></div>
  </div>
  <div class="callout" data-tone="success">
    ${icon('check')}
    <div><p class="callout-title">Pago recibido</p><p>Hemos enviado el recibo a tu correo.</p></div>
  </div>
  <div class="callout" data-tone="warning">
    ${icon('alert')}
    <div><p class="callout-title">Atención</p><p>Tu plan vence en 3 días.</p></div>
  </div>
  <div class="callout" data-tone="danger">
    ${icon('error')}
    <div><p class="callout-title">No se pudo guardar</p><p>Revisa tu conexión e inténtalo otra vez.</p></div>
  </div>
</div>`,
      },
      {
        title: 'Etiquetas',
        code: `<div class="stack" style="--stack-gap: var(--space-3)">
  <div class="cluster">
    <span class="badge">Borrador</span>
    <span class="badge" data-tone="success" data-dot>Activo</span>
    <span class="badge" data-tone="warning" data-dot>Pendiente</span>
    <span class="badge" data-tone="danger" data-dot>Vencido</span>
    <span class="badge" data-tone="info">Nuevo</span>
  </div>
  <div class="cluster">
    <span class="badge" data-variant="solid" data-tone="brand">Pro</span>
    <span class="badge" data-variant="outline" data-tone="neutral">v0.1</span>
  </div>
</div>`,
      },
      {
        title: 'Progreso y medidor',
        note: '<progress> para tareas en curso; <meter> para una medida dentro de un rango (p. ej. espacio usado).',
        code: `<div class="stack">
  <div class="field">
    <label for="pr-subida">Subiendo factura.pdf</label>
    <progress class="progress" id="pr-subida" max="100" value="64">64 %</progress>
  </div>
  <div class="field">
    <label for="pr-espacio">Espacio usado: 7,2 de 10 GB</label>
    <meter class="meter" id="pr-espacio" min="0" max="10" low="7" high="9" optimum="2" value="7.2">7,2 GB</meter>
  </div>
</div>`,
      },
    ],
    api: [
      ['.callout', 'Aviso con ícono y contenido. data-tone (info por defecto).'],
      ['.callout-title', 'Título del aviso.'],
      ['.badge', 'Etiqueta. data-tone, data-variant="solid|soft|outline", data-dot.'],
      ['.progress / .meter', 'Para <progress> y <meter> nativos.'],
    ],
    a11y: [
      'Un aviso que aparece tras una acción debe insertarse en una región role="status" (o role="alert" si es crítico) que ya exista en la página.',
      'No uses regiones vivas para estados intermedios como "Cargando…": usa <progress>.',
      'Las etiquetas son texto: el lector las lee tal cual, sin rol especial.',
    ],
  },

  {
    slug: 'tarjeta',
    title: 'Tarjeta',
    summary: 'Contenedor de contenido con borde, sin cajas dentro de cajas.',
    examples: [
      {
        title: 'Tarjeta',
        code: `<article class="card" style="max-inline-size: 24rem">
  <div class="card-header">
    <h4>Plan Pro</h4>
    <span class="badge" data-tone="success" data-dot>Activo</span>
  </div>
  <p class="muted">Renueva el 1 de diciembre de 2026.</p>
  <a class="button" data-variant="soft" href="#">Gestionar plan</a>
</article>`,
      },
      {
        title: 'Tarjeta con tabla',
        note: 'data-flush quita el relleno de la tarjeta para que la tabla llegue al borde: una sola caja, no dos.',
        code: `<section class="card" data-flush aria-labelledby="tc-titulo">
  <div class="card-header">
    <h4 id="tc-titulo">Últimos pagos</h4>
    <a class="button" data-variant="ghost" data-size="sm" href="#">Ver todos</a>
  </div>
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th scope="col">Fecha</th><th scope="col" data-numeric>Importe</th></tr></thead>
      <tbody>
        <tr><td>18/11/2026</td><td data-numeric>128,40 €</td></tr>
        <tr><td>02/11/2026</td><td data-numeric>59,00 €</td></tr>
      </tbody>
    </table>
  </div>
</section>`,
      },
    ],
    api: [
      ['.card', 'Contenedor con borde y radio moderado.'],
      ['data-flush', 'Sin relleno, para tablas o medios a sangre.'],
      ['data-elevated', 'Añade sombra (úsala con moderación).'],
      ['.card-header', 'Título y acciones de la tarjeta.'],
    ],
    a11y: [
      'Usa el elemento que corresponda al contenido: <article> si es independiente, <section> con encabezado si es una parte de la página.',
      'Evita hacer toda la tarjeta clicable; pon un enlace o botón claro dentro.',
    ],
  },

  {
    slug: 'tabla',
    title: 'Tabla',
    summary: 'Tablas nativas legibles, con scroll horizontal propio en móvil.',
    examples: [
      {
        title: 'Tabla con acciones',
        note: 'El contenedor con scroll es una región enfocable con nombre, así se puede desplazar con el teclado. Las acciones de fila siempre están visibles y cada una tiene un nombre único.',
        code: `<div class="table-wrap" role="region" aria-labelledby="tb-cap" tabindex="0">
  <table class="table">
    <caption id="tb-cap">Pedidos recientes</caption>
    <thead>
      <tr>
        <th scope="col">Pedido</th>
        <th scope="col">Cliente</th>
        <th scope="col">Estado</th>
        <th scope="col" data-numeric>Total</th>
        <th scope="col"><span class="visually-hidden">Acciones</span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">#1024</th>
        <td>Ana Torres</td>
        <td><span class="badge" data-tone="success" data-dot>Pagado</span></td>
        <td data-numeric>128,40 €</td>
        <td class="table-actions">
          <button class="button" type="button" data-variant="ghost" data-tone="neutral" data-size="sm" data-icon-only aria-label="Editar pedido #1024">${icon('pencil')}</button>
          <button class="button" type="button" data-variant="ghost" data-tone="danger" data-size="sm" data-icon-only aria-label="Eliminar pedido #1024" commandfor="tb-borrar" command="show-modal">${icon('trash')}</button>
        </td>
      </tr>
      <tr>
        <th scope="row">#1023</th>
        <td>Luis Pérez</td>
        <td><span class="badge" data-tone="warning" data-dot>Pendiente</span></td>
        <td data-numeric>59,00 €</td>
        <td class="table-actions">
          <button class="button" type="button" data-variant="ghost" data-tone="neutral" data-size="sm" data-icon-only aria-label="Editar pedido #1023">${icon('pencil')}</button>
          <button class="button" type="button" data-variant="ghost" data-tone="danger" data-size="sm" data-icon-only aria-label="Eliminar pedido #1023" commandfor="tb-borrar" command="show-modal">${icon('trash')}</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<dialog class="dialog" id="tb-borrar" data-size="sm" aria-labelledby="tb-borrar-titulo">
  <div class="dialog-body"><h2 id="tb-borrar-titulo" style="font-size: var(--fs-lg); margin: 0">¿Eliminar el pedido?</h2></div>
  <form class="dialog-footer" method="dialog">
    <button class="button" value="cancelar" data-variant="ghost" data-tone="neutral" autofocus>Cancelar</button>
    <button class="button" value="eliminar" data-tone="danger">Eliminar</button>
  </form>
</dialog>`,
      },
    ],
    api: [
      ['.table-wrap', 'Contenedor con scroll horizontal. Dale role="region", nombre y tabindex="0".'],
      ['.table', 'Tabla nativa con <caption>, <thead> y <th scope>.'],
      ['data-numeric', 'En th/td: alinea al final con cifras tabulares.'],
      ['.table-actions', 'Celda de acciones, ajustada a su contenido.'],
    ],
    a11y: [
      'Usa <caption> como título de la tabla y scope="col" / scope="row" en los encabezados.',
      'Nunca uses tablas para maquetar.',
      'La página nunca se desplaza en horizontal: solo el contenedor de la tabla.',
      'Las acciones de fila están siempre visibles (nada de aparecer al pasar el ratón) y piden confirmación al eliminar.',
    ],
  },
  {
    slug: 'tipografia',
    title: 'Tipografía',
    summary: 'Títulos y texto con la escala de angela, separando el aspecto del nivel semántico.',
    examples: [
      {
        title: 'Tarjeta de producto',
        note: 'El nombre es un <h3> por el esquema de la página, pero se ve como "lg". El precio usa cifras tabulares para que se alineen entre tarjetas.',
        code: `<article class="card stack" style="--stack-gap: var(--space-2); max-inline-size: 16rem">
  <h3 class="heading" data-size="lg">Laptop</h3>
  <p class="text" data-size="sm" data-muted>Potencia para crear.</p>
  <p class="text" data-size="2xl" data-weight="bold" data-numeric>$18.999</p>
  <div class="cluster">
    <button class="button" type="button" data-tone="neutral">Comprar</button>
    <button class="button" type="button" data-variant="outline" data-tone="neutral" data-icon-only aria-label="Agregar Laptop al carrito">${icon('cart')}</button>
  </div>
</article>`,
      },
      {
        title: 'Escala de títulos',
        note: 'data-size elige el tamaño sin cambiar el nivel. Del 3xl en adelante el tamaño es fluido y crece con la pantalla.',
        code: `<div class="stack" style="--stack-gap: var(--space-3)">
  <p class="heading" data-size="4xl">Título 4xl</p>
  <p class="heading" data-size="3xl">Título 3xl</p>
  <p class="heading" data-size="2xl">Título 2xl</p>
  <p class="heading">Título xl (por defecto)</p>
  <p class="heading" data-size="lg">Título lg</p>
  <p class="heading" data-size="md">Título md</p>
</div>`,
      },
      {
        title: 'Texto: tamaño, peso y color',
        note: 'data-muted para lo secundario. data-tone colorea con un rol; acompáñalo siempre de texto o ícono que diga el estado.',
        code: `<div class="stack" style="--stack-gap: var(--space-2)">
  <p class="text" data-size="lg">Texto destacado para la entrada de una sección.</p>
  <p class="text">Texto de lectura con el interlineado cómodo de angela.</p>
  <p class="text" data-size="sm" data-muted>Texto secundario: fechas, ayudas, metadatos.</p>
  <p class="text" data-size="sm" data-weight="medium" data-tone="success">✓ Pago recibido el 18/11/2026.</p>
  <p class="text" data-size="sm" data-weight="medium" data-tone="danger">✕ La tarjeta fue rechazada.</p>
</div>`,
      },
      {
        title: 'Recortar texto',
        note: 'Solo si el texto completo está a mano: aquí, el enlace lleva a la ficha con la descripción entera.',
        code: `<article class="card stack" style="--stack-gap: var(--space-2); max-inline-size: 18rem">
  <h3 class="heading" data-size="md" data-truncate>Auriculares inalámbricos con cancelación activa de ruido</h3>
  <p class="text" data-size="sm" data-muted data-lines="2">Sonido envolvente, 30 horas de batería, carga rápida por USB-C y micrófono con reducción de ruido para llamadas.</p>
  <a href="#" class="text" data-size="sm">Ver ficha completa</a>
</article>`,
      },
      {
        title: 'Texto largo',
        note: '.prose limita la medida a ~68 caracteres y da ritmo a los elementos de dentro sin poner clases en cada uno.',
        code: `<div class="prose">
  <h2>Cómo elegir tu laptop</h2>
  <p>Piensa primero en para qué la vas a usar. Para ofimática basta casi cualquier equipo; para edición de video importan la memoria y la tarjeta gráfica.</p>
  <ul>
    <li>16 GB de memoria como mínimo para crear contenido.</li>
    <li>Pantalla con buena cobertura de color si editas fotos.</li>
  </ul>
  <blockquote><p>Compra pensando en los próximos tres años, no en hoy.</p></blockquote>
  <h3>Garantía</h3>
  <p>Todos los equipos incluyen dos años de garantía y devolución gratuita en 30 días.</p>
</div>`,
      },
    ],
    api: [
      ['.heading', 'Título: negrita, interlineado ajustado y líneas equilibradas. Tamaño por defecto: xl.'],
      ['.text', 'Texto de lectura: interlineado cómodo y sin palabras sueltas al final. Tamaño por defecto: md.'],
      ['data-size', 'xs · sm · md · lg · xl · 2xl · 3xl · 4xl (tokens --fs-*; 3xl y 4xl son fluidos).'],
      ['data-weight', 'regular · medium · bold'],
      ['data-muted', 'Color secundario (--color-text-muted).'],
      ['data-tone', 'brand · success · warning · danger · info · neutral. Color de texto del rol (≥ 4.5:1).'],
      ['data-numeric', 'Cifras tabulares, para precios y columnas de números.'],
      ['data-truncate', 'Una línea con puntos suspensivos.'],
      ['data-lines', '2 · 3 · 4. Corta tras N líneas con puntos suspensivos.'],
      ['data-align', 'start · center · end (respeta la dirección del texto).'],
      ['.prose', 'Contenedor de texto largo: medida legible (--measure) y ritmo vertical.'],
    ],
    a11y: [
      'La clase cambia el aspecto, no el significado: usa el nivel de encabezado que pida el esquema de la página (h1 → h2 → h3) y ajusta el tamaño con data-size.',
      'Los tamaños van en rem: respetan el tamaño de letra que la persona elige en su navegador y el zoom al 200 %.',
      'Sin altura fija: el texto crece si la persona aumenta el interlineado o el espaciado (WCAG 1.4.12).',
      'data-tone nunca va solo: el estado se dice también con texto o con un ícono.',
      'Recortar oculta texto: úsalo solo si el contenido completo está accesible en otro sitio (no basta con title, que no llega con teclado ni en táctil).',
      'Para enfatizar, negrita y <strong>/<em>; evita las mayúsculas sostenidas, que se leen peor.',
    ],
  },
];
