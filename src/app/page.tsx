'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeEditor } from '@/components/CodeEditor';
import { AnalysisResult } from '@/components/AnalysisResult';
import { SupportedLanguage, AnalysisResponse } from '@/types/analysis';
import { Loader2, Settings, Play } from 'lucide-react';

export default function Home() {
  const [code, setCode] = useState(`function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        if (arr[mid] === target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}`);
  
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [apiKey, setApiKey] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const analyzeCode = async () => {
    if (!code.trim()) {
      setError('Please enter some code to analyze');
      return;
    }

    if (!apiKey.trim()) {
      setError('Please enter your OpenAI API key');
      setShowSettings(true);
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          apiKey,
          analysisType: 'both'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const analysisResult = await response.json();
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 ">DSA Complexity Analyzer</h1>
        <p className="text-muted-foreground text-lg">
          Analyze time and space complexity of your algorithms with AI-powered insights
        </p>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration
            </CardTitle>
            <CardDescription>
              Enter your OpenAI API key to enable analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKey">OpenAI API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Your API key is stored locally and never sent to our servers
                </p>
              </div>
              <Button
                onClick={() => setShowSettings(false)}
                disabled={!apiKey.trim()}
              >
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <CodeEditor
            code={code}
            language={language}
            onChange={setCode}
            onLanguageChange={setLanguage}
          />

          <div className="flex gap-2">
            <Button
              onClick={analyzeCode}
              disabled={isAnalyzing || !code.trim()}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Analyze Complexity
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Results Panel */}
        <div>
          {result ? (
            <AnalysisResult result={result} />
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Enter your code and click "Analyze Complexity" to see results
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

