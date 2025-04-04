import React from 'react';
import SimpleMDEditor from './SimpleMDEditor';

interface MDEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

/**
 * MDEditor - A wrapper component around SimpleMDEditor for backward compatibility
 * 
 * This component simply passes through props to SimpleMDEditor, allowing existing
 * code to continue using MDEditor while the actual implementation is in SimpleMDEditor.
 */
const MDEditor: React.FC<MDEditorProps> = ({ initialContent, onChange }) => {
  return (
    <SimpleMDEditor 
      initialContent={initialContent} 
      onChange={onChange} 
    />
  );
};

export default MDEditor;

