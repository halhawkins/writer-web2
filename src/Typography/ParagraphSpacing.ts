import { Extension } from '@tiptap/core';

export interface ParagraphSpacingOptions {
  types: string[];
  defaultBeforeSpacing?: string;
  defaultAfterSpacing?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphSpacing: {
      setBeforeSpacing: (value: string) => ReturnType;
      setAfterSpacing: (value: string) => ReturnType;
    };
  }
}

export const ParagraphSpacing = Extension.create<ParagraphSpacingOptions>({
  name: 'paragraphSpacing',

  addOptions() {
    return {
      types: ['paragraph'],
      defaultBeforeSpacing: '0px',
      defaultAfterSpacing: '0px',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          beforeSpacing: {
            default: this.options.defaultBeforeSpacing,
            parseHTML: element =>
              element.style.marginTop || this.options.defaultBeforeSpacing,
            renderHTML: attributes => {
              if (!attributes.beforeSpacing) return {};
              return { style: `margin-top: ${attributes.beforeSpacing}` };
            },
          },
          afterSpacing: {
            default: this.options.defaultAfterSpacing,
            parseHTML: element =>
              element.style.marginBottom || this.options.defaultAfterSpacing,
            renderHTML: attributes => {
              if (!attributes.afterSpacing) return {};
              return { style: `margin-bottom: ${attributes.afterSpacing}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setBeforeSpacing: (value: string) => ({ commands }) => {
        return this.options.types.every(type =>
          commands.updateAttributes(type, { beforeSpacing: value }),
        );
      },
      setAfterSpacing: (value: string) => ({ commands }) => {
        return this.options.types.every(type =>
          commands.updateAttributes(type, { afterSpacing: value }),
        );
      },
    };
  },
});