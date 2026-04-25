import { commands, Mark, mergeAttributes } from "@tiptap/react";

export interface AnnotationOptions {
  HTMLAttributes: Record<string, any>,
}

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        annotation: {
            setAnnotation: ( attributes: { id: string}) => ReturnType,
            unsetAnnotation: () => ReturnType,
        }
    }
}

export const Annotation = Mark.create<AnnotationOptions>({
    name: "annotation",

    addOptions() {
        return {
            HTMLAttributes: {
                class: "annotation",
            },
        }
    },

    addAttributes() {
        return {
            id: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-annotation-id]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(this.options.HTMLAttributes), 0]
    },

    addCommands() {
        return {
            setAnnotation: attributes => ({ commands }) => {
                return commands.setMark(this.name, attributes)
            },
            unsetAnnotation: () => ({ commands }) => {
                return commands.unsetMark(this.name)
            },
        }
    }
})