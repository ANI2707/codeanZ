class DSAAnalyzerPopup {
  constructor() {
    this.apiKey = '';
    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadApiKey();
    await this.loadHistory();
    this.updateUI();
  }

  bindEvents() {
    // API Key events
    document.getElementById('saveApiKey').addEventListener('click', () => this.saveApiKey());
    document.getElementById('apiKeyInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.saveApiKey();
    });

    // Analysis events
    document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzeCode());
    document.getElementById('codeInput').addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') this.analyzeCode();
    });

    // History events
    document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());

    // Footer events
    document.getElementById('openWebApp').addEventListener('click', () => this.openWebApp());
    document.getElementById('settings').addEventListener('click', () => this.openSettings());
  }

  async loadApiKey() {
    try {
      const result = await chrome.storage.sync.get(['dsa_analyzer_api_key']);
      this.apiKey = result.dsa_analyzer_api_key || '';
      document.getElementById('apiKeyInput').value = this.apiKey;
    } catch (error) {
      console.error('Failed to load API key:', error);
    }
  }

  async saveApiKey() {
    const input = document.getElementById('apiKeyInput');
    const newApiKey = input.value.trim();

    if (!newApiKey) {
      this.showMessage('Please enter a valid API key', 'error');
      return;
    }

    if (!newApiKey.startsWith('sk-')) {
      this.showMessage('API key should start with "sk-"', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({ dsa_analyzer_api_key: newApiKey });
      this.apiKey = newApiKey;
      this.showMessage('API key saved successfully!', 'success');
      this.updateUI();
    } catch (error) {
      this.showMessage('Failed to save API key', 'error');
    }
  }

  async analyzeCode() {
    const codeInput = document.getElementById('codeInput');
    const languageSelect = document.getElementById('languageSelect');
    const analyzeBtn = document.getElementById('analyzeBtn');

    const code = codeInput.value.trim();
    const language = languageSelect.value;

    if (!code) {
      this.showMessage('Please enter some code to analyze', 'error');
      return;
    }

    if (!this.apiKey) {
      this.showMessage('Please configure your API key first', 'error');
      return;
    }

    // Show loading state
    this.setAnalyzeLoading(true);

    try {
      const response = await this.callAnalysisAPI({
        code,
        language,
        apiKey: this.apiKey
      });

      if (response.error) {
        throw new Error(response.error);
      }

      this.displayResults(response.result);
      await this.saveToHistory({ code, language, result: response.result });
      await this.loadHistory(); // Refresh history
    } catch (error) {
      this.showMessage(`Analysis failed: ${error.message}`, 'error');
    } finally {
      this.setAnalyzeLoading(false);
    }
  }

  async callAnalysisAPI(data) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'analyze',
        ...data
      }, resolve);
    });
  }

  displayResults(result) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContent = document.getElementById('resultsContent');

    resultsContent.innerHTML = `
      <div class="complexity-result">
        <h3>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12,6 12,12 16,14"></polyline>
          </svg>
          Time Complexity
          <span class="complexity-badge">${result.timeComplexity.bigO}</span>
        </h3>
        <p class="complexity-explanation">${result.timeComplexity.explanation}</p>
      </div>

      <div class="complexity-result">
        <h3>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 19c-5 0-8-3-8-8s3-8 8-8 8 3 8 8-3 8-8 8z"></path>
            <path d="M9 9h3l3 4-3 4h-3V9z"></path>
          </svg>
          Space Complexity
          <span class="complexity-badge">${result.spaceComplexity.bigO}</span>
        </h3>
        <p class="complexity-explanation">${result.spaceComplexity.explanation}</p>
      </div>

      ${result.suggestions.length > 0 ? `
        <div class="complexity-result">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            Optimization Suggestions
          </h3>
          <ul style="margin-left: 16px; font-size: 13px; color: var(--text-secondary);">
            ${result.suggestions.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <button id="viewDetailed" class="btn-primary" style="width: 100%; margin-top: 12px;">
        View Detailed Analysis
      </button>
    `;

    // Add event listener for detailed view
    document.getElementById('viewDetailed').addEventListener('click', () => {
      this.openDetailedView(result);
    });

    resultsSection.style.display = 'block';
  }

  async loadHistory() {
    try {
      const result = await chrome.storage.local.get(['analysis_history']);
      const history = result.analysis_history || [];
      
      const historyContent = document.getElementById('historyContent');
      
      if (history.length === 0) {
        historyContent.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px;">No recent analysis</p>';
        return;
      }

      historyContent.innerHTML = history.slice(0, 5).map(item => `
        <div class="history-item" data-id="${item.id}">
          <div class="history-info">
            <span class="history-language">${item.language}</span>
            <span class="history-time">${this.formatTime(item.timestamp)}</span>
          </div>
          <div style="font-size: 12px; color: var(--text-muted);">
            ${item.result.timeComplexity.bigO} | ${item.result.spaceComplexity.bigO}
          </div>
        </div>
      `).join('');

      // Add click events to history items
      historyContent.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.id;
          const historyItem = history.find(h => h.id === id);
          if (historyItem) {
            this.loadHistoryItem(historyItem);
          }
        });
      });
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  loadHistoryItem(item) {
    document.getElementById('codeInput').value = item.code;
    document.getElementById('languageSelect').value = item.language;
    this.displayResults(item.result);
  }

  async saveToHistory(data) {
    try {
      const result = await chrome.storage.local.get(['analysis_history']);
      const history = result.analysis_history || [];
      
      const newEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...data
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

  async clearHistory() {
    if (confirm('Are you sure you want to clear all analysis history?')) {
      try {
        await chrome.storage.local.remove(['analysis_history']);
        await this.loadHistory();
        this.showMessage('History cleared', 'success');
      } catch (error) {
        this.showMessage('Failed to clear history', 'error');
      }
    }
  }

  setAnalyzeLoading(loading) {
    const btn = document.getElementById('analyzeBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    btn.disabled = loading;
    btnText.style.display = loading ? 'none' : 'inline-flex';
    btnLoading.style.display = loading ? 'inline-flex' : 'none';
  }

  updateUI() {
    const statusIndicator = document.getElementById('apiKeyStatus');
    statusIndicator.className = `status-indicator ${this.apiKey ? 'connected' : ''}`;
  }

  showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.error-message, .success-message');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;

    const apiKeySection = document.getElementById('apiKeySection');
    apiKeySection.appendChild(messageDiv);

    // Remove after 3 seconds
    setTimeout(() => messageDiv.remove(), 3000);
  }

  openDetailedView(result) {
    const url = chrome.runtime.getURL('popup/detailed.html') + 
                `?data=${encodeURIComponent(JSON.stringify(result))}`;
    chrome.tabs.create({ url });
  }

  openWebApp() {
    chrome.tabs.create({ url: 'https://your-web-app-url.com' });
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  formatTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => new DSAAnalyzerPopup());
