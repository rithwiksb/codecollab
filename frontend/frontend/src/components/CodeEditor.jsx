import React, { useRef, useState, useEffect } from 'react';
import Editor from "@monaco-editor/react";

const CodeEditor = ({ 
  code, 
  language = 'javascript', 
  onChange, 
  onLanguageChange 
}) => {
  const [currentCode, setCurrentCode] = useState(code || '');
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  
  // Map room language to Monaco language
  const getLanguageId = (lang) => {
    const langMap = {
      'javascript': 'javascript',
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'csharp': 'csharp',
      'html': 'html',
      'css': 'css'
    };
    
    return langMap[lang] || 'javascript';
  };

  // Update the editor when the code prop changes
  useEffect(() => {
    if (code !== currentCode) {
      setCurrentCode(code || '');
    }
  }, [code]);
  
  // Update language when prop changes
  useEffect(() => {
    if (language !== currentLanguage) {
      setCurrentLanguage(language);
    }
  }, [language]);
  
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    setIsEditorReady(true);
  };

  // Handle code changes
  const handleChange = (value) => {
    setCurrentCode(value);
    
    // Debounce updates to reduce network traffic
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (onChange) {
        onChange(value);
      }
    }, 500);
  };
  
  // Handle language selection changes
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setCurrentLanguage(newLanguage);
    
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };
  
  return (
    <div className="monaco-editor-container">
      <div className="editor-header">
        <span className="language-indicator">{currentLanguage.toUpperCase()}</span>
        {!isEditorReady && <span className="loading-indicator">Loading editor...</span>}
        <select 
          value={currentLanguage} 
          onChange={handleLanguageChange}
          className="language-select"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
      </div>
      <Editor
        height="70vh"
        defaultLanguage={getLanguageId(currentLanguage)}
        defaultValue={currentCode || '// Start coding here...\n'}
        theme="vs-dark"
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
          automaticLayout: true,
          tabSize: 2,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          cursorBlinking: 'blink',
          cursorSmoothCaretAnimation: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;