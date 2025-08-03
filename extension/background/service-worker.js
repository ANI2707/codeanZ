class DSAAnalyzerBackground {
  constructor() {
    this.init();
  }

  init() {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    chrome.action.onClicked.addListener(this.handleActionClick.bind(this));
    chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'analyze':
        this.handleAnalyzeRequest(request, sender, sendResponse);
        return true; // Keep message channel open for async response
      
      case 'saveApiKey':
        this.saveApiKey(request.apiKey, sendResponse);
        return true;
      
      case 'getApiKey':
        this.getApiKey(sendResponse);
        return true;
      
      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  async handleAnalyzeRequest(request, sender, sendResponse) {
    try {
      // Get API key from storage
      const result = await chrome.storage.sync.get(['dsa_analyzer_api_key']);
      const apiKey = result.dsa_analyzer_api_key;

      if (!apiKey) {
        sendResponse({ error: 'API key not configured' });
        return;
      }

      // Perform analysis
      const analysisResult = await this.analyzeCode({
        code: request.code,
        language: request.language,
        apiKey: apiKey
      });

      // Save to history
      await this.saveToHistory({
        code: request.code,
        language: request.language,
        result: analysisResult,
        platform: request.platform,
        url: request.url
      });

      sendResponse({ success: true, result: analysisResult });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  async analyzeCode({ code, language, apiKey }) {
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    
    const systemPrompt = `You are an expert algorithm analyst. Analyze code for time and space complexity.

      CRITICAL: Respond with ONLY a valid JSON object. No explanatory text, no markdown formatting, no code blocks.

    Return a JSON response with this exact structure:
    {
      "timeComplexity": {
        "bigO": "O(n)",
        "bestCase": "O(1)",
        "averageCase": "O(n)",
        "worstCase": "O(n)",
        "explanation": "detailed explanation",
        "codeHighlights": [
          {
            "startLine": 1,
            "endLine": 3,
            "type": "loop",
            "contribution": "Linear iteration",
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
        "explanation": "detailed explanation",
        "codeHighlights": [],
        "confidence": 98
      },
      "explanation": "Overall analysis",
      "suggestions": ["optimization suggestions"],
      "algorithmType": "sorting/searching/graph/etc"
    }`;

    const userPrompt = `Analyze this ${language} code for time and space complexity:

    \`\`\`${language}
    ${code}
    \`\`\`

    Provide detailed complexity analysis with explanations.`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON response
    try {
      const jsonMatch = content.match(/``````/) || [null, content];
      const jsonString = jsonMatch[1] || content;
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Failed to parse analysis response');
    }
  }

  async saveApiKey(apiKey, sendResponse) {
    try {
      await chrome.storage.sync.set({ dsa_analyzer_api_key: apiKey });
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  async getApiKey(sendResponse) {
    try {
      const result = await chrome.storage.sync.get(['dsa_analyzer_api_key']);
      sendResponse({ success: true, apiKey: result.dsa_analyzer_api_key || '' });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  async saveToHistory(analysisData) {
    try {
      const result = await chrome.storage.local.get(['analysis_history']);
      const history = result.analysis_history || [];
      
      const newEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...analysisData
      };

      history.unshift(newEntry);
      
      // Keep only last 50 entries
      if (history.length > 50) {
        history.splice(50);
      }

      await chrome.storage.local.set({ analysis_history: history });
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  }

  handleActionClick(tab) {
    // Open popup when extension icon is clicked
    chrome.action.openPopup();
  }

  handleInstall(details) {
    if (details.reason === 'install') {
      // Set default settings
      chrome.storage.sync.set({
        dsa_analyzer_settings: {
          autoAnalyze: false,
          showFloatingButton: true,
          theme: 'auto'
        }
      });

      // Open welcome page
      chrome.tabs.create({
        url: chrome.runtime.getURL('popup/welcome.html')
      });
    }
  }
}

// Initialize background script
new DSAAnalyzerBackground();
