/**
 * Editor de código del laboratorio (CodeMirror 6) con aspecto de editor de escritorio:
 * números de línea, resaltado, plegado, autocompletado, corchetes, búsqueda (Ctrl/Cmd+F)
 * y multicursor. Los colores salen de los tokens de angela, así cumple el contraste y
 * sigue al modo claro/oscuro sin código extra.
 *
 * Emmet (HTML y CSS): escribe una abreviatura (`.tarjeta`, `ul>li*3`, `button.button`, `p10`)
 * y pulsa Tab, o elígela en el autocompletado con Enter. Ctrl+W envuelve la selección.
 * Autocompletado de angela: tokens `--*` en CSS, clases en `class="…"` y valores de data-*.
 *
 * Teclado: Tab expande Emmet o sangra; Esc y luego Tab sale del editor.
 */
import { basicSetup } from 'codemirror';
import { EditorState, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting, indentUnit } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { html, htmlLanguage } from '@codemirror/lang-html';
import { css, cssLanguage } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { abbreviationTracker, wrapWithAbbreviation } from '@emmetio/codemirror6-plugin';

/** Marca, dentro del texto que se inserta, dónde debe quedar el cursor. Nunca llega al documento. */
export const CARET = '\u0000';

/** Atributos de variantes de angela y sus valores, para el autocompletado de HTML. */
const ANGELA_ATTRIBUTES = {
  'data-variant': ['solid', 'soft', 'outline', 'ghost'],
  'data-tone': ['brand', 'neutral', 'success', 'warning', 'danger', 'info'],
  'data-size': ['sm', 'md', 'lg'],
  'data-icon-only': null,
  'data-flush': null,
  // Propia del laboratorio: marca el elemento que recibe el contenido al insertar el componente.
  'data-slot': null,
};

/**
 * Lenguaje + Emmet + autocompletado de angela para cada tipo de archivo.
 * @param {'html' | 'css' | 'js'} language
 * @param {{ classes?: string[], tokens?: string[] }} vocabulary  Se lee en cada sugerencia: si cambia
 *   (por ejemplo, al guardar un componente propio), el autocompletado lo refleja al momento.
 */
function languageSupport(language, vocabulary) {
  // Prec.high: Tab expande la abreviatura antes que sangrar.
  const emmet = (syntax) => [
    Prec.high(abbreviationTracker({ syntax, autocompleteTab: true, previewEnabled: true })),
    wrapWithAbbreviation('Ctrl-w'),
  ];

  if (language === 'html') {
    const classSource = (context) => {
      if (!context.matchBefore(/\bclass\s*=\s*["'][^"']*/)) return null;
      const word = context.matchBefore(/[\w-]*/);
      if (word.from === word.to && !context.explicit) return null;
      const options = (vocabulary.classes ?? []).map((label) => ({
        label,
        type: 'class',
        detail: vocabulary.origin?.[label] ?? 'angela',
      }));
      return { from: word.from, options, validFor: /^[\w-]*$/ };
    };
    return [
      html({ extraTags: { 'angela-tabs': { attrs: {} } }, extraGlobalAttributes: ANGELA_ATTRIBUTES }),
      htmlLanguage.data.of({ autocomplete: classSource }),
      emmet('html'),
    ];
  }

  if (language === 'css') {
    const tokenSource = (context) => {
      const word = context.matchBefore(/--[\w-]*/);
      if (!word) return null;
      // Dentro de var( se inserta el nombre; en un valor suelto, ya envuelto en var().
      const prefix = context.state.sliceDoc(Math.max(0, word.from - 120), word.from);
      const wrap = !/var\(\s*$/.test(prefix) && /:[^;{}]*$/.test(prefix);
      const options = (vocabulary.tokens ?? []).map((label) => ({
        label,
        type: 'variable',
        detail: 'token',
        apply: wrap ? `var(${label})` : label,
      }));
      return { from: word.from, options, validFor: /^--[\w-]*$/ };
    };
    return [css(), cssLanguage.data.of({ autocomplete: tokenSource }), emmet('css')];
  }

  return [javascript()];
}

const theme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'var(--color-surface-sunken)',
    color: 'var(--color-text)',
    fontSize: 'var(--fs-sm)',
  },
  '&.cm-focused': {
    outline: '2px solid var(--color-focus)',
    outlineOffset: '-2px',
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-code)',
    lineHeight: 'var(--lh-normal)',
  },
  '.cm-content': {
    caretColor: 'var(--color-text)',
    paddingBlock: 'var(--space-2)',
  },
  '.cm-cursor, .cm-dropCursor': { borderInlineStartColor: 'var(--color-text)' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    { backgroundColor: 'var(--color-brand-subtle-hover)' },
  '.cm-gutters': {
    backgroundColor: 'var(--color-surface-sunken)',
    color: 'var(--color-text-muted)',
    borderInlineEnd: '1px solid var(--color-border)',
  },
  '.cm-lineNumbers .cm-gutterElement': { paddingInline: 'var(--space-3) var(--space-2)' },
  '.cm-activeLine': { backgroundColor: 'var(--color-surface-hover)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text)' },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)',
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: 'transparent',
    outline: '1px solid var(--color-border-strong)',
  },
  '&.cm-focused .cm-nonmatchingBracket': {
    backgroundColor: 'var(--color-danger-subtle)',
  },
  '.cm-selectionMatch': { backgroundColor: 'var(--color-info-subtle)' },
  '.cm-searchMatch': {
    backgroundColor: 'var(--color-warning-subtle)',
    outline: '1px solid var(--color-warning-border)',
  },
  '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: 'var(--color-warning-subtle-hover)' },
  '.cm-tooltip': {
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--elevation-2)',
    overflow: 'hidden',
  },
  '.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--font-code)' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--color-brand-subtle)',
    color: 'var(--color-text)',
  },
  '.cm-completionDetail': { color: 'var(--color-text-muted)' },
  '.cm-panels': {
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text)',
  },
  '.cm-panels-bottom': { borderBlockStart: '1px solid var(--color-border)' },
  '.cm-panel.cm-search': { fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)' },
  '.cm-textfield': {
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--color-canvas)',
    color: 'var(--color-text)',
  },
  '.cm-button': {
    backgroundImage: 'none',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text)',
  },
  '.emmet-tracker': {
    textDecoration: 'underline 1px dotted var(--color-brand-text)',
    textUnderlineOffset: '2px',
  },
  '.emmet-preview': {
    padding: 'var(--space-2)',
    fontFamily: 'var(--font-code)',
    fontSize: 'var(--fs-xs)',
  },
  '.emmet-preview_error': { color: 'var(--color-danger-text)' },
  '@media (forced-colors: active)': {
    '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'Canvas' },
    '.cm-selectionBackground': { backgroundColor: 'Highlight' },
  },
});

/** Resaltado al estilo de los editores de escritorio, con los tonos de texto de angela (≥ 4.5:1). */
const highlight = HighlightStyle.define([
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: 'var(--color-text-muted)', fontStyle: 'italic' },
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword, t.modifier], color: 'var(--color-brand-text)' },
  { tag: [t.tagName, t.angleBracket], color: 'var(--color-brand-text)' },
  { tag: [t.attributeName, t.propertyName], color: 'var(--color-info-text)' },
  { tag: [t.string, t.special(t.string), t.attributeValue, t.regexp], color: 'var(--color-warning-text)' },
  { tag: [t.number, t.bool, t.null, t.unit, t.atom], color: 'var(--color-success-text)' },
  { tag: [t.className, t.typeName, t.namespace, t.labelName], color: 'var(--color-success-text)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--color-danger-text)' },
  { tag: [t.definition(t.variableName), t.variableName, t.self], color: 'var(--color-text)' },
  { tag: [t.punctuation, t.separator, t.bracket, t.operator], color: 'var(--color-text-muted)' },
  { tag: t.invalid, color: 'var(--color-danger-text)', textDecoration: 'underline wavy' },
]);

/**
 * Crea un editor dentro de `parent`.
 * @param {HTMLElement} parent
 * @param {{
 *   language: 'html' | 'css' | 'js',
 *   value: string,
 *   label: string,
 *   describedBy?: string,
 *   vocabulary?: { classes?: string[], tokens?: string[] },
 *   onChange?: (value: string) => void,
 *   onCursor?: (pos: { line: number, column: number, selected: number }) => void,
 * }} options
 */
export function createCodeEditor(parent, { language, value, label, describedBy, vocabulary = {}, onChange, onCursor }) {
  const reportCursor = (state) => {
    const range = state.selection.main;
    const line = state.doc.lineAt(range.head);
    onCursor?.({ line: line.number, column: range.head - line.from + 1, selected: Math.abs(range.to - range.from) });
  };

  const extensions = [
    basicSetup,
    keymap.of([indentWithTab]),
    EditorState.tabSize.of(2),
    indentUnit.of('  '),
    languageSupport(language, vocabulary),
    theme,
    syntaxHighlighting(highlight),
    EditorView.contentAttributes.of({
      'aria-label': label,
      ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      spellcheck: 'false',
      autocapitalize: 'off',
      autocorrect: 'off',
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) onChange?.(update.state.doc.toString());
      if (update.selectionSet || update.docChanged || update.focusChanged) reportCursor(update.state);
    }),
  ];

  const view = new EditorView({ parent, state: EditorState.create({ doc: value, extensions }) });

  return {
    view,
    get value() {
      return view.state.doc.toString();
    },
    /** Sustituye el contenido sin avisar a onChange (cargar componente, aplicar propuesta…) y reinicia el historial. */
    setValue(next) {
      if (next === view.state.doc.toString()) return;
      // Estado nuevo: el historial de deshacer empieza en el contenido cargado.
      view.setState(EditorState.create({ doc: next, extensions }));
    },
    focus: () => view.focus(),
    /** Texto seleccionado ahora mismo (cadena vacía si no hay selección). */
    get selection() {
      const { from, to } = view.state.selection.main;
      return view.state.sliceDoc(from, to);
    },
    /**
     * Inserta texto en el cursor como si lo escribiera la persona (avisa a onChange y se
     * puede deshacer). Las líneas siguientes heredan la sangría del punto de inserción.
     * Un carácter CARET en el texto marca dónde queda el cursor al terminar.
     */
    insert(text) {
      const { state } = view;
      const { from, to } = state.selection.main;
      const indent = /^[ \t]*/.exec(state.doc.lineAt(from).text)[0];
      const body = text.replaceAll('\n', `\n${indent}`);
      const caret = body.indexOf(CARET);
      const insert = body.replaceAll(CARET, '');
      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + (caret === -1 ? insert.length : caret) },
        scrollIntoView: true,
        userEvent: 'input.paste',
      });
      view.focus();
    },
    /** Recalcula tamaños al mostrarse (las pestañas ocultas miden cero). */
    refresh: () => view.requestMeasure(),
    reportCursor: () => reportCursor(view.state),
    destroy: () => view.destroy(),
  };
}
