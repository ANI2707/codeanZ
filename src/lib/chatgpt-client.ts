import OpenAI from 'openai';
import { AnalysisRequest, AnalysisResponse } from '@/types/analysis';

export class ChatGPTAnalyzer {
  private openai: OpenAI;
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

//   async analyzeComplexity(request: AnalysisRequest): Promise<AnalysisResponse> {
//     const systemPrompt = this.createSystemPrompt();
//     const userPrompt = this.createUserPrompt(request);

//     try {
//       const completion = await this.openai.chat.completions.create({
//         model: "gpt-4",
//         messages: [
//           { role: "system", content: systemPrompt },
//           { role: "user", content: userPrompt }
//         ],
//         temperature: 0.1,
//         max_tokens: 2000
//       });

//       console.log("comple=========>",completion)

//       return this.parseResponse(completion.choices[0].message.content || '');
//     } catch (error) {
//       throw new Error(`Analysis failed: ${error}`);
//     }
//   }

async analyzeComplexity(request: AnalysisRequest): Promise<AnalysisResponse> {
  const systemPrompt = this.createSystemPrompt();
  const userPrompt = this.createUserPrompt(request);

  try {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });

    // Add detailed logging to debug the response
    console.log('Full completion object:', JSON.stringify(completion, null, 2));
    console.log('Message content:', completion.choices[0]?.message?.content);

    const messageContent = completion.choices[0]?.message?.content;
    
    if (!messageContent) {
      throw new Error('No content in API response');
    }

    return this.parseResponse(messageContent);
  } catch (error) {
    console.error('Analysis error details:', error);
    throw new Error(`Analysis failed: ${error}`);
  }
}


  private createSystemPrompt(): string {
  return `You are an expert algorithm analyst. Analyze code for time and space complexity.

  CRITICAL: Respond with ONLY a valid JSON object. No explanatory text, no markdown formatting, no code blocks.

  Expected JSON format:
  {
    "timeComplexity": {
      "bigO": "O(n)",
      "bestCase": "O(1)",
      "averageCase": "O(n)",
      "worstCase": "O(n)",
      "explanation": "Brief explanation of time complexity",
      "codeHighlights": [
        {
          "startLine": 1,
          "endLine": 5,
          "type": "loop",
          "contribution": "Linear iteration through array",
          "complexity": "O(n)"
        }
      ],
      "confidence": 95
    },
    "spaceComplexity": {
      "bigO": "O(1)",
      "bestCase": "O(1)",
      "averageCase": "O(1)",
      "worstCase": "O(1)",
      "explanation": "Brief explanation of space complexity",
      "codeHighlights": [],
      "confidence": 98
    },
    "explanation": "Overall algorithm analysis summary",
    "suggestions": ["Specific optimization suggestions"],
    "algorithmType": "searching"
  }

  Rules:
  - Start response with { and end with }
  - Use double quotes for all strings
  - No trailing commas
  - Confidence values must be numbers 0-100
  - Line numbers must be integers
  - Algorithm types: sorting, searching, graph, dynamic-programming, greedy, divide-conquer, recursion, iteration, other`;
}


//   private createSystemPrompt(): string {
//     return `You are an expert algorithm analyst. Analyze code for time and space complexity.

//     Return a JSON response with this exact structure:
//     {
//       "timeComplexity": {
//         "bigO": "O(n)",
//         "bestCase": "O(1)",
//         "averageCase": "O(n)",
//         "worstCase": "O(n)",
//         "explanation": "detailed explanation",
//         "codeHighlights": [
//           {
//             "startLine": 1,
//             "endLine": 3,
//             "type": "loop",
//             "contribution": "Linear iteration",
//             "complexity": "O(n)"
//           }
//         ],
//         "confidence": 95
//       },
//       "spaceComplexity": {
//         "bigO": "O(1)",
//         "bestCase": "O(1)",
//         "averageCase": "O(1)",
//         "worstCase": "O(1)",
//         "explanation": "detailed explanation",
//         "codeHighlights": [],
//         "confidence": 98
//       },
//       "explanation": "Overall analysis",
//       "suggestions": ["optimization suggestions"],
//       "algorithmType": "sorting/searching/graph/etc"
//     }

//     Rules:
//     - Analyze both time and space complexity
//     - Identify loops, recursion, data structures
//     - Provide line-by-line analysis for highlights
//     - Give optimization suggestions
//     - Rate confidence 0-100`;
//   }

  private createUserPrompt(request: AnalysisRequest): string {
    return `Analyze this ${request.language} code for ${request.analysisType} complexity:

    Code:
    \`\`\`${request.language}
    ${request.code}
    \`\`\`

    ${request.problemContext ? `Problem Context: ${request.problemContext}` : ''}

    Provide detailed complexity analysis with explanations.`;
  }


  

  private parseResponse(content: string): AnalysisResponse {
    try {
      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = content.match(/``````/) || [null, content];
      const jsonString = jsonMatch[1] || content;
      
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Failed to parse analysis response');
    }

    
  }
}
