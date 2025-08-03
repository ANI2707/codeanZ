import { NextRequest, NextResponse } from 'next/server';
import { ChatGPTAnalyzer } from '@/lib/chatgpt-client';
import { AnalysisRequest } from '@/types/analysis';

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest & { apiKey: string } = await request.json();
    
    if (!body.apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    if (!body.code || !body.language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      );
    }

    const analyzer = new ChatGPTAnalyzer(body.apiKey);
    const result = await analyzer.analyzeComplexity({
      code: body.code,
      language: body.language,
      problemContext: body.problemContext,
      analysisType: body.analysisType || 'both'
    });

    console.log("result",result)

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
