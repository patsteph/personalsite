import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';

interface MDEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

const MDEditor: React.FC<MDEditorProps> = ({ initialContent, onChange }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDialogVisible, setLinkDialogVisible] = useState(false);
  const [imageDialogVisible, setImageDialogVisible] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Highlight,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  const addImage = () => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setImageDialogVisible(false);
    }
  };

  const addLink = () => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setLinkDialogVisible(false);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="md-editor">
      <div className="toolbar">
        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
            title="Heading 1"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 4V11H8V4H10V20H8V13H5V20H3V4H5Z" fill="currentColor"/>
              <path d="M13 8V6H21V8H18V18H16V8H13Z" fill="currentColor"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            title="Heading 2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4V11H7V4H9V20H7V13H4V20H2V4H4Z" fill="currentColor"/>
              <path d="M11 17V15.5C11 14.12 11.91 13 13.22 12.5C12.22 12 11.5 10.88 11.5 9.5C11.5 7.56 13.06 6 15 6H21V8H15C14.17 8 13.5 8.67 13.5 9.5C13.5 10.33 14.17 11 15 11H17V13H15C14.17 13 13.5 13.67 13.5 14.5C13.5 15.33 14.17 16 15 16H21V18H15C12.79 18 11 16.21 11 14V17Z" fill="currentColor"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
            title="Heading 3"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4V11H7V4H9V20H7V13H4V20H2V4H4Z" fill="currentColor"/>
              <path d="M21 8H16C14.9 8 14 8.9 14 10C14 10.74 14.4 11.39 15 11.73V11.77C14.4 12.11 14 12.76 14 13.5C14 14.9 15.1 16 16.5 16H21V14H16.5C16.22 14 16 13.78 16 13.5C16 13.22 16.22 13 16.5 13H18V11H16.5C16.22 11 16 10.78 16 10.5C16 10.22 16.22 10 16.5 10H21V8Z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
            title="Bold"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.6 10.79C16.57 10.12 17.25 9.02 17.25 8C17.25 5.74 15.5 4 13.25 4H7V18H14.04C16.13 18 17.75 16.3 17.75 14.21C17.75 12.69 16.89 11.39 15.6 10.79ZM10 6.5H13C13.83 6.5 14.5 7.17 14.5 8C14.5 8.83 13.83 9.5 13 9.5H10V6.5ZM13.5 15.5H10V12.5H13.5C14.33 12.5 15 13.17 15 14C15 14.83 14.33 15.5 13.5 15.5Z" fill="currentColor"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
            title="Italic"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4V7H12.21L8.79 15H6V18H14V15H11.79L15.21 7H18V4H10Z" fill="currentColor"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'is-active' : ''}
            title="Strikethrough"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.24 8.75C7.46 8.43 7.75 8.15 8.09 7.92C8.42 7.68 8.8 7.5 9.22 7.36C9.65 7.22 10.1 7.15 10.57 7.15C11.17 7.15 11.66 7.24 12.06 7.42C12.45 7.6 12.75 7.85 12.95 8.15C13.15 8.46 13.25 8.8 13.25 9.18C13.25 9.62 13.13 9.99 12.9 10.31C12.67 10.62 12.39 10.89 12.05 11.12H13.9C14.08 10.94 14.24 10.76 14.38 10.56C14.72 10.07 14.9 9.5 14.9 8.85C14.9 8.16 14.74 7.57 14.43 7.07C14.11 6.58 13.67 6.19 13.09 5.91C12.52 5.63 11.83 5.49 11.04 5.49C10.36 5.49 9.72 5.59 9.12 5.79C8.53 6 7.99 6.3 7.52 6.7C7.05 7.1 6.68 7.58 6.4 8.13L7.24 8.75ZM13.33 12H6.7C6.63 12.32 6.59 12.65 6.59 13C6.59 13.74 6.75 14.38 7.06 14.92C7.37 15.46 7.81 15.88 8.36 16.17C8.91 16.47 9.54 16.62 10.24 16.62C10.95 16.62 11.58 16.45 12.12 16.13C12.66 15.8 13.09 15.36 13.39 14.8L12.5 14.07C12.29 14.44 12 14.75 11.63 14.97C11.27 15.2 10.83 15.31 10.34 15.31C9.71 15.31 9.18 15.14 8.76 14.8C8.34 14.46 8.12 14.03 8.09 13.5H17V12H13.33Z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'is-active' : ''}
            title="Code Block"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.4 16.6L4.8 12L9.4 7.4L8 6L2 12L8 18L9.4 16.6ZM14.6 16.6L19.2 12L14.6 7.4L16 6L22 12L16 18L14.6 16.6Z" fill="currentColor"/>
            </svg>
          </button>
          <button
            onClick={() => setLinkDialogVisible(!linkDialogVisible)}
            className={editor.isActive('link') ? 'is-active' : ''}
            title="Link"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.9 12C3.9 10.29 5.29 8.9 7 8.9H11V7H7C4.24 7 2 9.24 2 12C2 14.76 4.24 17 7 17H11V15.1H7C5.29 15.1 3.9 13.71 3.9 12ZM8 13H16V11H8V13ZM17 7H13V8.9H17C18.71 8.9 20.1 10.29 20.1 12C20.1 13.71 18.71 15.1 17 15.1H13V17H17C19.76 17 22 14.76 22 12C22 9.24 19.76 7 17 7Z" fill="currentColor"/>
            </svg>
          </button>
          <button
            onClick={() => setImageDialogVisible(!imageDialogVisible)}
            className={editor.isActive('image') ? 'is-active' : ''}
            title="Image"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'is-active' : ''}
            title="Bullet List"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 10.5C3.17 10.5 2.5 11.17 2.5 12C2.5 12.83 3.17 13.5 4 13.5C4.83 13.5 5.5 12.83 5.5 12C5.5 11.17 4.83 10.5 4 10.5ZM4 4.5C3.17 4.5 2.5 5.17 2.5 6C2.5 6.83 3.17 7.5 4 7.5C4.83 7.5 5.5 6.83 5.5 6C5.5 5.17 4.83 4.5 4 4.5ZM4 16.5C3.17 16.5 2.5 17.18 2.5 18C2.5 18.82 3.18 19.5 4 19.5C4.82 19.5 5.5 18

<search>107|            <span className="material-icons text-base">title</span>
</search>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4v6a6 6 0 0 0 12 0V4"></path>
              <line x1="4" y1="20" x2="20" y2="20"></line>
            </svg>
<search>137|          <span className="material-icons text-base">format_bold</span>
</search>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          </svg>
<search>144|          <span className="material-icons text-base">format_italic</span>
</search>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4"></line>
            <line x1="14" y1="20" x2="5" y2="20"></line>
            <line x1="15" y1="4" x2="9" y2="20"></line>
          </svg>
<search>151|          <span className="material-icons text-base">format_strikethrough</span>
</search>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.8 3.3 3.6 3.9h.2m8.2 3.7c.3.4.4.8.4 1.3 0 2.9-2.7 3.6-5.3 3.6-2.5 0-4.4-.6-6.3-1.3"></path>
            <line x1="4" y1="12" x2="20" y2="12"></line>
          </svg>
<search>160|          <span className="material-icons text-base">link</span>
</search>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
<search>167|          <span className="material-icons text-base">image</span>
</search>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
<search>176|          <span className="material-icons text-base">code</span>
</search>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
<search>185|          <span className="material-icons text-base">format_list_bulleted</span>
</search>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <circle cx="4" cy="6" r="2"></circle>
            <circle cx="4" cy="12" r="2"></circle>
            <circle cx="4" cy="18" r="2"></circle>
          </svg>
<search>192|          <span className="material-icons text-base">format_list_numbered</span>
</search>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6"></line>
            <line x1="10" y1="12" x2="21" y2="12"></line>
            <line x1="10" y1="18" x2="21" y2="18"></line>
            <path d="M4 6h1v4"></path>
            <path d="M4 10h2"></path>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
          </svg>
<search>202|          <span className="material-icons text-base">undo</span>
</search>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6"></path>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
          </svg>
<search>209|          <span className="material-icons text-base">redo</span>
</search>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6"></path>
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
          </svg>

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';
import CodeBlock from '@tiptap/extension-code-block';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { useTranslation } from 'next-i18next';

interface MDEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MDEditor: React.FC<MDEditorProps> = ({ initialContent, onChange, placeholder = 'Write your content here...' }) => {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  // Initialize TipTap editor with desired extensions
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      CodeBlock,
      Highlight,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // Pass HTML content to parent component
      const html = editor.getHTML();
      onChange(html);
    },
    autofocus: true,
    editable: true,
  });

  // Handle editor initialization on mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle content update when initialContent prop changes
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  // Button class helper
  const buttonClass = "p-2 mx-1 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors text-sm flex items-center justify-center";
  const activeButtonClass = "bg-blue-100 hover:bg-blue-200";

  if (!isMounted) {
    return <div className="h-60 bg-gray-100 animate-pulse rounded-md"></div>;
  }

  if (!editor) {
    return null;
  }

  // Handle image insertion
  const addImage = () => {
    const url = window.prompt(t('editor.enterImageUrl', 'Enter image URL'));
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // Handle link insertion
  const setLink = () => {
    const url = window.prompt(t('editor.enterLinkUrl', 'Enter URL'));
    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="md-editor border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="toolbar bg-gray-100 p-2 border-b border-gray-300 flex flex-wrap">
        {/* Heading dropdown */}
        <div className="relative inline-block">
          <button
            className={buttonClass}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title={t('editor.heading', 'Heading')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4v6a6 6 0 0 0 12 0V4"></path>
              <line x1="4" y1="20" x2="20" y2="20"></line>
            </svg>
          </button>
          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 hidden group-hover:block">
            <button
              className={`${buttonClass} ${editor.isActive('heading', { level: 
