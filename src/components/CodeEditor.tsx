'use client';

import { Editor } from '@monaco-editor/react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SupportedLanguage } from '@/types/analysis';

interface CodeEditorProps {
  code: string;
  language: SupportedLanguage;
  onChange: (code: string) => void;
  onLanguageChange: (language: SupportedLanguage) => void;
  highlights?: Array<{
    startLine: number;
    endLine: number;
    type: string;
  }>;
}

export function CodeEditor({ 
  code, 
  language, 
  onChange, 
  onLanguageChange, 
  highlights = [] 
}: CodeEditorProps) {
  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' }
  ];

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Code Input</h3>
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Editor
          height="300px"
          language={language === 'cpp' ? 'cpp' : language}
          value={code}
          onChange={(value) => onChange(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            automaticLayout: true
          }}
        />
      </div>
    </Card>
  );
}
