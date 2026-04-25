import { Node, mergeAttributes, type CommandProps } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { PaginationPlus } from 'tiptap-pagination-plus'

// ─────────────────────────────────────────────
// PageBreak node
// ─────────────────────────────────────────────

const PageBreakNode = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,          // treated as a single unit — not editable inside

  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'page-break',
        class: 'rm-manual-page-break',
      }),
    ]
  },

  addNodeView() {
    return () => {
      const dom = document.createElement('div')
      dom.setAttribute('data-type', 'page-break')
      dom.className = 'rm-manual-page-break'
      dom.contentEditable = 'false'

      // Visual "--- Page Break ---" indicator line
      const indicator = document.createElement('div')
      indicator.className = 'rm-page-break-indicator'
      indicator.setAttribute('contenteditable', 'false')
      dom.appendChild(indicator)

      return { dom }
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.insertPageBreak(),
    }
  },
})

// ─────────────────────────────────────────────
// Height-adjustment plugin
// ─────────────────────────────────────────────

const manualPageBreakKey = new PluginKey('manualPageBreak')
  
/**
 * After every view update, find every .rm-manual-page-break element and
 * stretch it so its bottom aligns exactly with the top of the nearest
 * following .breaker element (the visual gap between pages).
 *
 * Uses requestAnimationFrame so that pagination-plus has already painted
 * its decorations before we measure.s
 */
function createPageBreakPlugin() {
  let rafId: ReturnType<typeof requestAnimationFrame> | null = null

  return new Plugin({
    key: manualPageBreakKey,

    view: () => ({

      update(view, prevState) {
        const docChanged = view.state.doc !== prevState.doc;

        // Only adjust if the document did NOT change (avoid feedback loop)
        if (!docChanged) {
          adjustManualPageBreaks(view.dom as HTMLElement);
        }
      },
      destroy() {
        if (rafId !== null) cancelAnimationFrame(rafId)
      },
    }),
  })
}

function adjustManualPageBreaks(editorDom: HTMLElement) {
  const manualBreaks = Array.from(
    editorDom.querySelectorAll<HTMLElement>('.rm-manual-page-break')
  );
  const breakerElements = Array.from(
    editorDom.querySelectorAll<HTMLElement>('[data-rm-pagination] .breaker')
  );

  if (manualBreaks.length === 0 || breakerElements.length === 0) return;

  manualBreaks.forEach((manualBreak) => {
    const breakRect = manualBreak.getBoundingClientRect();
    const targetBreaker = breakerElements.find(
      (b) => b.getBoundingClientRect().top > breakRect.top + 5
    );
    if (!targetBreaker) return;

    const targetTop = targetBreaker.getBoundingClientRect().top;
    // Snap to integer to prevent sub-pixel looping
    const neededHeight = Math.floor(targetTop - breakRect.top);
    if (!Number.isFinite(neededHeight) || neededHeight < 0) return;

    // Use a data attribute to track last set height
    const lastHeight = parseInt(manualBreak.getAttribute('data-last-height') || '', 10) || 0;
    if (Math.abs(neededHeight - lastHeight) <= 2) return;

    manualBreak.style.height = `${neededHeight}px`;
    manualBreak.setAttribute('data-last-height', `${neededHeight}`);
  });
}
// ─────────────────────────────────────────────
// Extended PaginationPlus
// ─────────────────────────────────────────────

/**
 * Drop-in replacement for PaginationPlus that adds forced page-break support.
 *
 * Usage:
 *   import { PaginationPlusWithBreaks } from './PaginationPlusWithBreaks'
 *
 *   new Editor({
 *     extensions: [
 *       StarterKit,
 *       PaginationPlusWithBreaks.configure({ pageHeight: 1123, ... }),
 *     ],
 *   })
 *
 *   // Insert a forced page break at the cursor:
 *   editor.chain().focus().insertPageBreak().run()
 */
export const PaginationPlusWithBreaks = PaginationPlus.extend({
  // Register the PageBreak node so it is available in this editor instance.
  addExtensions() {
    return [PageBreakNode]
  },

  addCommands() {
    return {
      // Keep every command from the parent (updatePageHeight, updatePageSize, etc.)
      ...(this as any).parent?.(),

      /**
       * Insert a forced page break at the current cursor position,
       * then move the cursor into a fresh paragraph on the new page.
       */
      insertPageBreak:
        () =>
        ({ chain }: CommandProps) => {
          return chain().focus()
            .insertContent({ type: 'pageBreak' })
            .insertContent({ type: 'paragraph' })
            .run()
        },
    }
  },

  addProseMirrorPlugins() {
    // Keep all plugins from the parent (pagination layout, br-decoration).
    const parentPlugins = (this as any).parent?.() ?? []
    return [...parentPlugins, createPageBreakPlugin()]
    // return parentPlugins;
  },
})
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      insertPageBreak: () => ReturnType
    }
  }
}
