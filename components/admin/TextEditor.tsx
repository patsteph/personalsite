import { useState, useEffect, useRef, useCallback } from 'react';

interface TextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

export default function TextEditor({ initialContent, onChange }: TextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(initialContent || '');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Enforce LTR direction on an element
  const enforceLTR = useCallback((element: HTMLElement) => {
    // Set multiple attributes and styles to ensure LTR direction
    element.setAttribute('dir', 'ltr');
    element.style.direction = 'ltr';
    element.style.textAlign = 'left';
    element.style.unicodeBidi = 'isolate';
    element.setAttribute('data-direction', 'ltr');
    
    // Additional attributes that might help
    element.setAttribute('lang', 'en');
    
    // Apply to all children recursively
    Array.from(element.children).forEach(child => {
      if (child instanceof HTMLElement) {
        enforceLTR(child);
      }
    });
  }, []);
  
  // Initialize the editor with content
  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      console.log('Initializing editor with LTR direction');
      
      // First, apply global styles to force LTR for all contentEditable elements
      const styleId = 'editor-ltr-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          [contenteditable] {
            direction: ltr;
            text-align: left;
            unicode-bidi: isolate;
          }
          [contenteditable] * {
            direction: ltr;
            text-align: left;
            unicode-bidi: isolate;
          }
          .editor-content {
            direction: ltr;
            text-align: left;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Set initial content
      editorRef.current.innerHTML = initialContent || '';
      
      // Apply LTR to the editor container
      enforceLTR(editorRef.current);
      
      // Force LTR for all existing elements
      Array.from(editorRef.current.querySelectorAll('*')).forEach(el => {
        if (el instanceof HTMLElement) {
          enforceLTR(el);
        }
      });
      
      // Set default paragraph formatting
      document.execCommand('defaultParagraphSeparator', false, 'p');
      
      setIsInitialized(true);
    }
  }, [initialContent, enforceLTR, isInitialized]);
  
  // Additionally enforce LTR direction after component has mounted
  useEffect(() => {
    if (editorRef.current && isInitialized) {
      const observer = new MutationObserver((mutations) => {
        // When DOM changes, ensure all elements are LTR
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node instanceof HTMLElement) {
                enforceLTR(node);
              }
            });
          }
        });
      });
      
      // Start observing the editor for DOM changes
      observer.observe(editorRef.current, { 
        childList: true, 
        subtree: true, 
        attributes: true 
      });
      
      return () => observer.disconnect();
    }
    
    // TypeScript requires all code paths to return a value in useEffect cleanup function
    return () => {}; // Empty cleanup function for when conditions aren't met
  }, [enforceLTR, isInitialized]);
  
  // Handle paste to strip formatting and ensure LTR
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    // Get plain text from clipboard
    const text = e.clipboardData.getData('text/plain');
    
    // Insert text at cursor position
    document.execCommand('insertText', false, text);
    
    // Re-apply LTR direction after paste
    if (editorRef.current) {
      enforceLTR(editorRef.current);
    }
  };
  
  // Handle input changes
  const handleInput = () => {
    if (editorRef.current) {
      // Enforce LTR on the entire editor
      enforceLTR(editorRef.current);
      
      // Get content and update state
      const content = editorRef.current.innerHTML;
      setHtml(content);
      onChange(content);
    }
  };
  
  // Execute commands on the document
  const execCommand = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value || undefined);
    
    // Refocus editor after command execution
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };
  
  // Insert a link
  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };
  
  // Insert an image
  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };
  
  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.5 10a2.5 2.5 0 01-2.5 2.5H7V7h4a2.5 2.5 0 012.5 2.5v.5zm-2.5-5H7v10h4a5 5 0 005-5v-.5a5 5 0 00-5-5z" />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Italic"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 5h8v2H6V5zm0 8h8v2H6v-2zm10-8h-2v2h2V5zM4 5H2v2h2V5zM2 13h2v2H2v-2zm14 0h-2v2h2v-2z" />
            <path d="M10 3L8 17h2l2-14h-2z" />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 3C7 2.44772 6.55228 2 6 2C5.44772 2 5 2.44772 5 3V10C5 12.7614 7.23858 15 10 15C12.7614 15 15 12.7614 15 10V3C15 2.44772 14.5523 2 14 2C13.4477 2 13 2.44772 13 3V10C13 11.6569 11.6569 13 10 13C8.34315 13 7 11.6569 7 10V3Z" />
            <path d="M5 17C5 16.4477 5.44772 16 6 16H14C14.5523 16 15 16.4477 15 17C15 17.5523 14.5523 18 14 18H6C5.44772 18 5 17.5523 5 17Z" />
          </svg>
        </button>
        
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h2>')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Heading"
        >
          <span className="font-bold">H</span>
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<p>')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Paragraph"
        >
          <span>P</span>
        </button>
        
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Bullet List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4a1 1 0 011-1h10a1 1 0 110 2H6a1 1 0 01-1-1zm0 6a1 1 0 011-1h10a1 1 0 110 2H6a1 1 0 01-1-1zm0 6a1 1 0 011-1h10a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            <circle cx="2" cy="4" r="1.5" />
            <circle cx="2" cy="10" r="1.5" />
            <circle cx="2" cy="16" r="1.5" />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Numbered List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4a1 1 0 011-1h10a1 1 0 110 2H6a1 1 0 01-1-1zm0 6a1 1 0 011-1h10a1 1 0 110 2H6a1 1 0 01-1-1zm0 6a1 1 0 011-1h10a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            <path d="M3 4.5a.5.5 0 01-1 0V3h-.5a.5.5 0 010-1h1a.5.5 0 01.5.5v2zM2.5 10a.5.5 0 01-.5-.5v-2a.5.5 0 011 0v1h1a.5.5 0 010 1h-1.5zm0 5a.5.5 0 01-.5-.5v-2a.5.5 0 011 0v1h1a.5.5 0 010 1h-1.5z" />
          </svg>
        </button>
        
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={insertLink}
          className="p-1 hover:bg-gray-200 rounded"
          title="Insert Link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={insertImage}
          className="p-1 hover:bg-gray-200 rounded"
          title="Insert Image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => {
            const codeBlock = `<pre dir="ltr" style="direction: ltr; text-align: left; unicode-bidi: isolate; white-space: pre; font-family: monospace;" lang="en" data-direction="ltr"><code dir="ltr" style="direction: ltr; text-align: left; unicode-bidi: isolate; font-family: monospace;" lang="en" data-direction="ltr">// Your code here</code></pre>`;
            execCommand('insertHTML', codeBlock);
            // After inserting, re-enforce LTR
            setTimeout(() => {
              if (editorRef.current) {
                const allPres = editorRef.current.querySelectorAll('pre, code');
                allPres.forEach(el => {
                  if (el instanceof HTMLElement) {
                    enforceLTR(el);
                  }
                });
              }
            }, 0);
          }}
          className="p-1 hover:bg-gray-200 rounded"
          title="Insert Code Block"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Clear Formatting"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.146 9.146a.5.5 0 011.708 0L10 9.293l.146-.147a.5.5 0 01.708.708L10.707 10l.147.146a.5.5 0 11-.708.708L10 10.707l-.146.147a.5.5 0 11-.708-.708L9.293 10l-.147-.146a.5.5 0 010-.708z" clipRule="evenodd" />
            <path d="M4 2a1 1 0 011-1h10a1 1 0 011 1v1a1 1 0 01-2 0V3H6v10.59L9.88 8.71a1 1 0 111.42 1.42L6.41 15h7.59a1 1 0 110 2H4a1 1 0 01-1-1V2z" />
          </svg>
        </button>
      </div>
      
      {/* Editable content area */}
      <div
        ref={editorRef}
        className="min-h-[300px] p-4 focus:outline-none overflow-auto editor-content"
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        dir="ltr" 
        lang="en"
        style={{ 
          unicodeBidi: 'isolate', 
          direction: 'ltr', 
          textAlign: 'left',
          writingMode: 'horizontal-tb'
        }}
        data-lang="en"
        data-direction="ltr"
      />
    </div>
  );
}