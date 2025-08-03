'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComplexityGraph } from './ComplexityGraph';
import { AnalysisResponse, CodeHighlight } from '@/types/analysis';
import { Clock, MemoryStick, Lightbulb, Target } from 'lucide-react';

interface AnalysisResultProps {
  result: AnalysisResponse;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const ConfidenceIndicator = ({ confidence }: { confidence: number }) => {
    const getColor = (conf: number) => {
      if (conf >= 90) return 'bg-green-500';
      if (conf >= 70) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Confidence:</span>
        <div className="w-16 h-2 bg-gray-200 rounded-full">
          <div 
            className={`h-full rounded-full ${getColor(confidence)}`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <span className="text-sm font-medium">{confidence}%</span>
      </div>
    );
  };

  const ComplexityCard = ({ 
    title, 
    icon, 
    complexity, 
    type 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    complexity: any; 
    type: 'time' | 'space';
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Big O</p>
            <Badge variant="outline" className="text-lg font-mono">
              {complexity.bigO}
            </Badge>
          </div>
          <div>
            <ConfidenceIndicator confidence={complexity.confidence} />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Best:</span>
            <code className="text-sm">{complexity.bestCase}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Average:</span>
            <code className="text-sm">{complexity.averageCase}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Worst:</span>
            <code className="text-sm">{complexity.worstCase}</code>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Explanation:</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {complexity.explanation}
          </p>
        </div>

        {complexity.codeHighlights.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Code Analysis:</p>
            <div className="space-y-2">
              {complexity.codeHighlights.map((highlight: CodeHighlight, index: number) => (
                <div key={index} className="text-sm p-2 bg-muted rounded">
                  <div className="flex justify-between items-start">
                    <span className="font-mono">
                      Lines {highlight.startLine}-{highlight.endLine}
                    </span>
                    <Badge variant="secondary">{highlight.complexity}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {highlight.contribution}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Algorithm Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Algorithm Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="default" className="text-sm">
              {result.algorithmType}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {result.explanation}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Complexity Analysis */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="time">Time</TabsTrigger>
          <TabsTrigger value="space">Space</TabsTrigger>
          <TabsTrigger value="graphs">Graphs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <ComplexityCard
              title="Time Complexity"
              icon={<Clock className="h-5 w-5" />}
              complexity={result.timeComplexity}
              type="time"
            />
            <ComplexityCard
              title="Space Complexity"
              icon={<MemoryStick className="h-5 w-5" />}
              complexity={result.spaceComplexity}
              type="space"
            />
          </div>
        </TabsContent>

        <TabsContent value="time">
          <ComplexityCard
            title="Time Complexity Analysis"
            icon={<Clock className="h-5 w-5" />}
            complexity={result.timeComplexity}
            type="time"
          />
        </TabsContent>

        <TabsContent value="space">
          <ComplexityCard
            title="Space Complexity Analysis"
            icon={<MemoryStick className="h-5 w-5" />}
            complexity={result.spaceComplexity}
            type="space"
          />
        </TabsContent>

        <TabsContent value="graphs" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <ComplexityGraph
              type="time"
              complexity={result.timeComplexity.bigO}
              title="Time Complexity Growth"
            />
            <ComplexityGraph
              type="space"
              complexity={result.spaceComplexity.bigO}
              title="Space Complexity Growth"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Optimization Suggestions */}
      {result.suggestions.length > 0 && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Optimization Suggestions:</p>
            <ul className="list-disc list-inside space-y-1">
              {result.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm">{suggestion}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
