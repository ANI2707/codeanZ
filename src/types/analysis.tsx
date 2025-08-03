export interface ComplexityResult {
  bigO: string;
  bestCase: string;
  averageCase: string;
  worstCase: string;
  explanation: string;
  codeHighlights: CodeHighlight[];
  confidence: number;
}

export interface CodeHighlight {
  startLine: number;
  endLine: number;
  type: 'loop' | 'recursion' | 'dataStructure' | 'condition';
  contribution: string;
  complexity: string;
}

export interface AnalysisRequest {
  code: string;
  language: string;
  problemContext?: string;
  analysisType: 'time' | 'space' | 'both';
}

export interface AnalysisResponse {
  timeComplexity: ComplexityResult;
  spaceComplexity: ComplexityResult;
  explanation: string;
  suggestions: string[];
  algorithmType: string;
}

export interface AnalysisHistory {
  id: string;
  timestamp: Date;
  code: string;
  language: string;
  result: AnalysisResponse;
}

export type SupportedLanguage = 'javascript' | 'python' | 'java' | 'cpp' | 'c' | 'go' | 'rust';
