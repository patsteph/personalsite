import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

interface SimpleMDEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

const SimpleMDEditor: React.FC<SimpleMDEditorProps> = ({ initialContent, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Write something...',
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content if initialContent changes externally
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  const MenuButton = ({ title, action, isActive = null }) => (
    <button
      type="button"
      onClick={action}
      className={`py-1 px-3 mr-1 mb-1 text-sm rounded border ${
        isActive && isActive() 
          ? 'bg-gray-700 text-white border-gray-700' 
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
      }`}
    >
      {title}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-md">
      <div className="flex flex-wrap p-2 bg-gray-50 border-b border-gray-300">
        <MenuButton
          title="H1"
          action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={() => editor.isActive('heading', { level: 1 })}
        />
        <MenuButton
          title="H2"
          action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={() => editor.isActive('heading', { level: 2 })}
        />
        <MenuButton
          title="H3"
          action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={() => editor.isActive('heading', { level: 3 })}
        />
        <MenuButton
          title="Bold"
          action={() => editor.chain().focus().toggleBold().run()}
          isActive={() => editor.isActive('bold')}
        />
        <MenuButton
          title="Italic"
          action={() => editor.chain().focus().toggleItalic().run()}
          isActive={() => editor.isActive('italic')}
        />
        <MenuButton
          title="Bullet List"
          action={() => editor.chain().focus().toggleBulletList().run()}
          isActive={() => editor.isActive('bulletList')}
        />
        <MenuButton
          title="Numbered List"
          action={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={() => editor.isActive('orderedList')}
        />
        <MenuButton
          title="Link"
          action={() => {
            const url = window.prompt('URL');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            } else {
              editor.chain().focus().unsetLink().run();
            }
          }}
          isActive={() => editor.isActive('link')}
        />
        <MenuButton
          title="Code"
          action={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={() => editor.isActive('codeBlock')}
        />
        <MenuButton
          title="Clear"
          action={() => editor.chain().focus().clearContent().run()}
        />
      </div>
      <div className="p-2">
        <EditorContent editor={editor} className="prose max-w-full min-h-[200px]" />
      </div>
    </div>
  );
};

export default SimpleMDEditor;

