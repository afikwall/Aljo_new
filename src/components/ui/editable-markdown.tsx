/**
 * Editable markdown editor component with full editing capabilities and change tracking
 *
 * Built on top of BaseEditor with editing features enabled, this component provides
 * a rich text editing experience for markdown content with real-time change detection
 * and state synchronization.
 *
 * @param {Object} props - Component props
 * @param {string} props.defaultValue - The initial markdown content to be displayed and edited
 * @param {function} props.onChange - Callback function triggered when content changes, receives the updated markdown string
 * @returns {JSX.Element} EditableEditor component
 * @example
 * ```tsx
 * import { EditableMarkdown } from "@/components/ui/editable-markdown";
 *
 * function DocumentEditor() {
 *   const [content, setContent] = useState("# Document Title\n\nStart typing here...");
 *
 *   const handleContentChange = (newContent: string) => {
 *     setContent(newContent);
 *     // Auto-save or other logic here
 *   };
 *
 *   return (
 *     <div className="editor-panel">
 *       <h2>Document Editor</h2>
 *       <EditableMarkdown
 *         defaultValue={content}
 *         onChange={handleContentChange}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
import * as React from 'react';

import { useMemo, useRef } from 'react';

import BaseMarkdown from '@/components/ui/base-markdown/base-markdown';
import { type Editor, BubbleMenu as TiptapBubbleMenu } from '@tiptap/react';
import { getExtensions } from '@/components/ui/base-markdown/extensions';
import { useCurrentEditor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Strikethrough } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { textVariants } from '@/components/ui/base-markdown/text';

import { cn } from '@/lib/utils';

const TextTypeOptions: {
  label: string;
  className: string;
  getIsActive: ({ editor }: { editor: Editor }) => boolean;
  toggleFunction: ({ editor }: { editor: Editor }) => void;
}[] = [
  {
    label: 'Heading 1',
    className: textVariants({ variant: 'heading1' }),
    getIsActive: ({ editor }) => editor.isActive('heading', { level: 1 }),
    toggleFunction: ({ editor }) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: 'Heading 2',
    className: textVariants({ variant: 'heading2' }),
    getIsActive: ({ editor }) => editor.isActive('heading', { level: 2 }),
    toggleFunction: ({ editor }) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: 'Heading 3',
    className: textVariants({ variant: 'heading3' }),
    getIsActive: ({ editor }) => editor.isActive('heading', { level: 3 }),
    toggleFunction: ({ editor }) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: 'Heading 4',
    className: textVariants({ variant: 'heading4' }),
    getIsActive: ({ editor }) => editor.isActive('heading', { level: 4 }),
    toggleFunction: ({ editor }) =>
      editor.chain().focus().toggleHeading({ level: 4 }).run(),
  },
  {
    label: 'Paragraph',
    className: textVariants({ variant: 'paragraph' }),
    getIsActive: ({ editor }) => editor.isActive('paragraph'),
    toggleFunction: ({ editor }) => editor.chain().focus().setParagraph().run(),
  },
];

export const TextTypeButton = ({
  container,
}: {
  container?: HTMLElement | null;
}) => {
  const { editor } = useCurrentEditor();

  const textTypeValue = useMemo(() => {
    if (!editor) {
      return;
    }

    return TextTypeOptions.find((option) => option.getIsActive({ editor }))
      ?.label;
  }, [editor, editor?.state.selection]);

  if (!editor) {
    return null;
  }

  return (
    <Select
      value={textTypeValue}
      onValueChange={(value) => {
        const option = TextTypeOptions.find((option) => option.label === value);
        if (option) {
          option.toggleFunction({ editor });
        }
      }}
    >
      <SelectTrigger className="w-40 border-none">
        <SelectValue placeholder="Select text type" />
      </SelectTrigger>
      <SelectContent container={container}>
        <SelectGroup>
          {TextTypeOptions.map((option) => (
            <SelectItem
              key={option.label}
              value={option.label}
              className={option.className}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

const BubbleMenu = () => {
  const { editor } = useCurrentEditor();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <TiptapBubbleMenu editor={editor} shouldShow={() => true}>
        <div
          className="bg-background border rounded-sm shadow-sm flex items-center"
          ref={containerRef}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={editor?.isActive('bold') ? 'text-primary' : ''}
            type="button"
          >
            <Bold />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={editor?.isActive('italic') ? 'text-primary' : ''}
            type="button"
          >
            <Italic />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            className={editor?.isActive('strike') ? 'text-primary' : ''}
            type="button"
          >
            <Strikethrough />
          </Button>
          <Separator orientation="vertical" className="h-4 mx-1" />
          <TextTypeButton container={containerRef.current} />
        </div>
      </TiptapBubbleMenu>
    </div>
  );
};

const EditableMarkdown = ({
  defaultValue,
  onChange,
  size = 'md',
  className,
}: {
  defaultValue: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const extensions = useMemo(() => getExtensions({ editable: true }), []);

  return (
    <BaseMarkdown
      extensions={extensions}
      defaultValue={defaultValue}
      onChange={({ editor }) => onChange(editor.storage.markdown.getMarkdown())}
      editable
      size={size}
      className={cn('min-w-64 min-h-6', className)}
    >
      <BubbleMenu />
      {/* <FloatingMenu /> */}
    </BaseMarkdown>
  );
};

export { EditableMarkdown };
