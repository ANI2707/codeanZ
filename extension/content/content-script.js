class DSAAnalyzerContentScript {
  constructor() {
    this.currentCode = '';
    this.currentLanguage = 'javascript';
    this.init();
  }

  init() {
    this.detectPlatform();
    this.injectAnalyzeButton();
    this.observeCodeChanges();
  }

  detectPlatform() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('leetcode.com')) {
      this.platform = 'leetcode';
      this.setupLeetCode();
    } else if (hostname.includes('hackerrank.com')) {
      this.platform = 'hackerrank';
      this.setupHackerRank();
    } else if (hostname.includes('codechef.com')) {
      this.platform = 'codechef';
      this.setupCodeChef();
    } else if (hostname.includes('codeforces.com')) {
      this.platform = 'codeforces';
      this.setupCodeforces();
    } else {
      this.platform = 'generic';
      this.setupGeneric();
    }
  }

  setupLeetCode() {
    this.codeSelector = '.monaco-editor textarea, .CodeMirror-code';
    this.languageSelector = '[data-cy="lang-select"], .ant-select-selection-selected-value';
    this.submitButtonSelector = '[data-cy="submit-btn"], button[data-e2e-locator="console-submit-button"]';
  }

  setupHackerRank() {
    this.codeSelector = '.monaco-editor textarea, .CodeMirror-code';
    this.languageSelector = '.language-selector select';
    this.submitButtonSelector = '.hr-monaco-submit';
  }

  setupCodeChef() {
    this.codeSelector = '.CodeMirror-code, .monaco-editor textarea';
    this.languageSelector = '#edit_solution_language';
    this.submitButtonSelector = '#edit_solution_submit';
  }

  setupCodeforces() {
    this.codeSelector = '.CodeMirror-code, #sourceCodeTextarea';
    this.languageSelector = 'select[name="programTypeId"]';
    this.submitButtonSelector = '.submit';
  }

  setupGeneric() {
    this.codeSelector = 'textarea, .CodeMirror-code, .monaco-editor textarea';
    this.languageSelector = 'select';
    this.submitButtonSelector = 'button';
  }

  injectAnalyzeButton() {
    const button = document.createElement('button');
    button.id = 'dsa-analyzer-btn';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 3v18h18"/>
        <path d="M7 12h10"/>
        <path d="M7 8h7"/>
        <path d="M7 16h6"/>
      </svg>
      Analyze Complexity
    `;
    button.className = 'dsa-analyzer-button';
    
    button.addEventListener('click', () => this.openAnalyzer());

    // Find appropriate container based on platform
    let container = this.findButtonContainer();
    if (container) {
      container.appendChild(button);
    }
  }

  findButtonContainer() {
    const selectors = [
      '.action-btn-set', // LeetCode
      '.hr-monaco-toolbar', // HackerRank
      '.ide-bottom-bar', // CodeChef
      '.submit-wrapper', // Codeforces
      '.toolbar', // Generic
      '.controls', // Generic
      'body' // Fallback
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    return document.body;
  }

  observeCodeChanges() {
    const observer = new MutationObserver(() => {
      this.updateCurrentCode();
    });

    const codeElement = document.querySelector(this.codeSelector);
    if (codeElement) {
      observer.observe(codeElement, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  updateCurrentCode() {
    const codeElement = document.querySelector(this.codeSelector);
    if (codeElement) {
      if (codeElement.tagName === 'TEXTAREA') {
        this.currentCode = codeElement.value;
      } else {
        this.currentCode = codeElement.textContent || '';
      }
    }

    const languageElement = document.querySelector(this.languageSelector);
    if (languageElement) {
      this.currentLanguage = this.parseLanguage(languageElement.value || languageElement.textContent);
    }
  }

  parseLanguage(lang) {
    const langMap = {
      'javascript': 'javascript',
      'python': 'python',
      'python3': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c++': 'cpp',
      'c': 'c',
      'go': 'go',
      'rust': 'rust'
    };

    const normalized = lang.toLowerCase().trim();
    return langMap[normalized] || 'javascript';
  }

  openAnalyzer() {
    this.updateCurrentCode();
    
    // Send message to popup/background script
    chrome.runtime.sendMessage({
      action: 'analyze',
      code: this.currentCode,
      language: this.currentLanguage,
      platform: this.platform,
      url: window.location.href
    });

    // Open popup or create floating window
    this.createFloatingAnalyzer();
  }

  createFloatingAnalyzer() {
    // Remove existing analyzer if present
    const existing = document.getElementById('dsa-analyzer-float');
    if (existing) existing.remove();

    const floatingDiv = document.createElement('div');
    floatingDiv.id = 'dsa-analyzer-float';
    floatingDiv.className = 'dsa-analyzer-floating';
    
    floatingDiv.innerHTML = `
      <div class="dsa-analyzer-header">
        <h3>DSA Complexity Analyzer</h3>
        <button class="dsa-analyzer-close">&times;</button>
      </div>
      <div class="dsa-analyzer-content">
        <div class="dsa-analyzer-loading">
          <div class="spinner"></div>
          <p>Analyzing complexity...</p>
        </div>
      </div>
    `;

    document.body.appendChild(floatingDiv);

    // Add event listeners
    floatingDiv.querySelector('.dsa-analyzer-close').addEventListener('click', () => {
      floatingDiv.remove();
    });

    // Make draggable
    this.makeDraggable(floatingDiv);

    // Start analysis
    this.performAnalysis(floatingDiv);
  }

  makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = element.querySelector('.dsa-analyzer-header');
    
    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  async performAnalysis(floatingDiv) {
    try {
      // Get API key from storage
      const result = await chrome.storage.sync.get(['dsa_analyzer_api_key']);
      const apiKey = result.dsa_analyzer_api_key;

      if (!apiKey) {
        throw new Error('API key not configured. Please set it in the extension popup.');
      }

      // Call analysis API
      const response = await fetch(chrome.runtime.getURL('popup/api-proxy.html'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: this.currentCode,
          language: this.currentLanguage,
          apiKey: apiKey
        })
      });

      const analysisResult = await response.json();
      this.displayResults(floatingDiv, analysisResult);

    } catch (error) {
      this.displayError(floatingDiv, error.message);
    }
  }

  displayResults(container, results) {
    const content = container.querySelector('.dsa-analyzer-content');
    content.innerHTML = `
      <div class="analysis-results">
        <div class="complexity-section">
          <h4>Time Complexity</h4>
          <div class="complexity-badge">${results.timeComplexity.bigO}</div>
          <p class="complexity-explanation">${results.timeComplexity.explanation}</p>
        </div>
        
        <div class="complexity-section">
          <h4>Space Complexity</h4>
          <div class="complexity-badge">${results.spaceComplexity.bigO}</div>
          <p class="complexity-explanation">${results.spaceComplexity.explanation}</p>
        </div>

        ${results.suggestions.length > 0 ? `
          <div class="suggestions-section">
            <h4>Optimization Suggestions</h4>
            <ul>
              ${results.suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="actions">
          <button class="btn-primary" id="view-details">View Detailed Analysis</button>
        </div>
      </div>
    `;

    // Add event listener for detailed view
    content.querySelector('#view-details').addEventListener('click', () => {
      window.open(chrome.runtime.getURL('popup/detailed.html') + `?data=${encodeURIComponent(JSON.stringify(results))}`);
    });
  }

  displayError(container, error) {
    const content = container.querySelector('.dsa-analyzer-content');
    content.innerHTML = `
      <div class="error-message">
        <h4>Analysis Failed</h4>
        <p>${error}</p>
        <button class="btn-secondary" onclick="this.closest('#dsa-analyzer-float').remove()">Close</button>
      </div>
    `;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new DSAAnalyzerContentScript());
} else {
  new DSAAnalyzerContentScript();
}
