class ChatAssistant {
    constructor() {
      this.geminiKey = '';
      this.currentImage = null;
      this.extractedText = '';
      this.currentTab = 'screenshot';
      
      this.initializeElements();
      this.loadApiKeys();
      this.setupEventListeners();
    }
  
    initializeElements() {
      // API Keys
      this.geminiKeyInput = document.getElementById('gemini-key');
      this.saveKeysBtn = document.getElementById('save-keys');
      
      // Sections
      this.setupSection = document.getElementById('setup-section');
      this.mainSection = document.getElementById('main-section');
      
      // Tab elements
      this.tabBtns = document.querySelectorAll('.tab-btn');
      this.tabContents = document.querySelectorAll('.tab-content');
      
      // Screenshot tab elements
      this.uploadArea = document.getElementById('upload-area');
      this.fileInput = document.getElementById('file-input');
      this.selectFileBtn = document.getElementById('select-file');
      this.previewSection = document.getElementById('preview-section');
      this.imagePreview = document.getElementById('image-preview');
      this.analyzeBtn = document.getElementById('analyze-btn');
      this.loadingDiv = document.getElementById('loading');
      this.resultSection = document.getElementById('result-section');
      this.suggestedReply = document.getElementById('suggested-reply');
      this.copyBtn = document.getElementById('copy-btn');
      this.regenerateBtn = document.getElementById('regenerate-btn');
      this.errorSection = document.getElementById('error-section');
      this.errorMessage = document.getElementById('error-message');
      this.retryBtn = document.getElementById('retry-btn');
      
      // Text meaning tab elements
      this.meaningInput = document.getElementById('meaning-input');
      this.analyzeMeaningBtn = document.getElementById('analyze-meaning-btn');
      this.meaningLoading = document.getElementById('meaning-loading');
      this.meaningResultSection = document.getElementById('meaning-result-section');
      this.meaningOutput = document.getElementById('meaning-output');
      this.copyMeaningBtn = document.getElementById('copy-meaning-btn');
      this.meaningErrorSection = document.getElementById('meaning-error-section');
      this.meaningErrorMessage = document.getElementById('meaning-error-message');
      this.meaningRetryBtn = document.getElementById('meaning-retry-btn');
      
      // Grammar fix tab elements
      this.grammarInput = document.getElementById('grammar-input');
      this.fixGrammarBtn = document.getElementById('fix-grammar-btn');
      this.grammarLoading = document.getElementById('grammar-loading');
      this.grammarResultSection = document.getElementById('grammar-result-section');
      this.grammarOutput = document.getElementById('grammar-output');
      this.copyGrammarBtn = document.getElementById('copy-grammar-btn');
      this.grammarErrorSection = document.getElementById('grammar-error-section');
      this.grammarErrorMessage = document.getElementById('grammar-error-message');
      this.grammarRetryBtn = document.getElementById('grammar-retry-btn');
    }
  
    async loadApiKeys() {
      try {
        const result = await chrome.storage.local.get(['geminiKey']);
        
        if (result.geminiKey) {
          this.geminiKey = result.geminiKey;
          this.geminiKeyInput.value = '••••••••';
          this.showMainInterface();
        } else {
          this.showSetupInterface();
        }
      } catch (error) {
        console.error('Error loading API keys:', error);
        this.showSetupInterface();
      }
    }
  
    setupEventListeners() {
      // API Keys
      this.saveKeysBtn.addEventListener('click', () => this.saveApiKeys());
      
      // Tab navigation
      this.tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
      });
      
      // Screenshot tab events
      this.selectFileBtn.addEventListener('click', () => this.fileInput.click());
      this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
      this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
      this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
      this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
      document.addEventListener('paste', (e) => this.handlePaste(e));
      this.analyzeBtn.addEventListener('click', () => this.analyzeImage());
      this.copyBtn.addEventListener('click', () => this.copyToClipboard(this.suggestedReply.value));
      this.regenerateBtn.addEventListener('click', () => this.regenerateReply());
      this.retryBtn.addEventListener('click', () => this.hideError());
      
      // Text meaning tab events
      this.analyzeMeaningBtn.addEventListener('click', () => this.analyzeMeaning());
      this.copyMeaningBtn.addEventListener('click', () => this.copyToClipboard(this.meaningOutput.value));
      this.meaningRetryBtn.addEventListener('click', () => this.hideMeaningError());
      
      // Grammar fix tab events
      this.fixGrammarBtn.addEventListener('click', () => this.fixGrammar());
      this.copyGrammarBtn.addEventListener('click', () => this.copyToClipboard(this.grammarOutput.value));
      this.grammarRetryBtn.addEventListener('click', () => this.hideGrammarError());
    }
  
    switchTab(tabName) {
      this.currentTab = tabName;
      
      // Update tab buttons
      this.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
      });
      
      // Update tab contents
      this.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
      });
    }
  
    async saveApiKeys() {
      console.log("🔑 saveApiKeys() called");
      const geminiKey = this.geminiKeyInput.value.trim();
      
      if (!geminiKey) {
        this.showError('Please enter your Gemini API key');
        return;
      }
      
      if (geminiKey === '••••••••') {
        this.showMainInterface();
        return;
      }
  
      try {
        await chrome.storage.local.set({
          geminiKey: geminiKey
        });
        
        this.geminiKey = geminiKey;
        this.showMainInterface();
      } catch (error) {
        console.error('Error saving API key:', error);
        this.showError('Failed to save API key');
      }
      console.log("API key saved successfully");
    }
  
    showSetupInterface() {
      this.setupSection.style.display = 'block';
      this.mainSection.style.display = 'none';
    }
  
    showMainInterface() {
      this.setupSection.style.display = 'none';
      this.mainSection.style.display = 'block';
    }
  
    // Screenshot tab methods
    handleDragOver(e) {
      e.preventDefault();
      this.uploadArea.classList.add('dragover');
    }
  
    handleDragLeave(e) {
      e.preventDefault();
      this.uploadArea.classList.remove('dragover');
    }
  
    handleDrop(e) {
      e.preventDefault();
      this.uploadArea.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        this.processImageFile(files[0]);
      }
    }
  
    handleFileSelect(e) {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        this.processImageFile(file);
      }
    }
  
    async handlePaste(e) {
      if (this.currentTab !== 'screenshot') return;
      
      const items = e.clipboardData?.items;
      if (!items) return;
  
      for (let item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            this.processImageFile(file);
          }
          break;
        }
      }
    }
  
    async processImageFile(file) {
      this.currentImage = file;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.src = e.target.result;
        this.previewSection.style.display = 'block';
        this.hideError();
        this.hideResults();
      };
      reader.readAsDataURL(file);
    }
  
    async analyzeImage() {
      if (!this.currentImage) return;
      
      this.showLoading();
      this.hideError();
      
      try {
        const extractedText = await this.extractTextFromImage(this.currentImage);
        console.log("Extracted conversation text:\n", extractedText);
        if (!extractedText.trim()) {
          throw new Error('No text could be extracted from the image');
        }
        
        this.extractedText = extractedText;
        const suggestion = await this.generateReplySuggestion(extractedText);
        this.showResults(suggestion);
        
      } catch (error) {
        console.error('Analysis error:', error);
        this.showError(error.message || 'Failed to analyze image');
      } finally {
        this.hideLoading();
      }
    }
  
    async regenerateReply() {
      if (!this.extractedText) return;
      
      this.showLoading();
      this.hideError();
      
      try {
        const suggestion = await this.generateReplySuggestion(this.extractedText);
        this.showResults(suggestion);
      } catch (error) {
        console.error('Regeneration error:', error);
        this.showError(error.message || 'Failed to regenerate reply');
      } finally {
        this.hideLoading();
      }
    }
  
    // Text meaning methods
    async analyzeMeaning() {
      const text = this.meaningInput.value.trim();
      if (!text) {
        this.showMeaningError('Please enter some text to analyze');
        return;
      }
      
      this.showMeaningLoading();
      this.hideMeaningError();
      
      try {
        const meaning = await this.getTextMeaning(text);
        this.showMeaningResults(meaning);
      } catch (error) {
        console.error('Meaning analysis error:', error);
        this.showMeaningError(error.message || 'Failed to analyze text meaning');
      } finally {
        this.hideMeaningLoading();
      }
    }
  
    async getTextMeaning(text) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Please analyze and explain the meaning of the following text. Provide a clear, very small explanation that covers:
  
  1. The main meaning and context
  2. Any implicit meanings or subtext
  3. The tone and emotional content
  4. Cultural or contextual references if applicable
  5. Any ambiguities or multiple interpretations
  do not give explanation to all sections , include all of them in your analysis but give me a one liner very small explanation not more than 10 words
  Text to analyze:
  "${text}"
  
  Please provide a very short explanation.`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
            topP: 0.8
          }
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
      }
  
      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('No meaning analysis generated');
      }
      
      return data.candidates[0].content.parts[0].text.trim();
    }
  
    // Grammar fix methods
    async fixGrammar() {
      const text = this.grammarInput.value.trim();
      if (!text) {
        this.showGrammarError('Please enter some text to improve');
        return;
      }
      
      this.showGrammarLoading();
      this.hideGrammarError();
      
      try {
        const improvedText = await this.improveGrammar(text);
        this.showGrammarResults(improvedText);
      } catch (error) {
        console.error('Grammar fix error:', error);
        this.showGrammarError(error.message || 'Failed to improve text');
      } finally {
        this.hideGrammarLoading();
      }
    }
  
    async improveGrammar(text) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Please improve the following text by:
  
  1. Correcting any grammar mistakes
  2. Fixing spelling errors
  3. Improving sentence structure and flow
  4. Enhancing clarity and readability
  5. Maintaining the original meaning and tone
  
  Original text:
  "${text}"
  
  Please provide only the improved version without any explanations or additional commentary.`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000,
            topP: 0.8
          }
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
      }
  
      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('No improved text generated');
      }
      
      return data.candidates[0].content.parts[0].text.trim();
    }
  
    // Existing API methods
    async extractTextFromImage(imageFile) {
      const base64Image = await this.fileToBase64(imageFile);
      const base64Data = base64Image.split(',')[1];
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `
                You will receive an image of a WhatsApp‐style conversation.
                Your job is to extract only the text of each message, in the order it appears, and label each line as either:
                
                  sender:<message text>
                  receiver:<message text>
                
                Definitions:
                - "sender" = the right‐aligned chat bubbles
                - "receiver" = the left‐aligned chat bubbles
                - Discard all timestamps, emojis (unless the emoji is literally part of the spoken text), and any UI elements (ticks, "Yesterday" header, etc.).
                - Output exactly one line per message. Do not add any extra words or commentary—just label + a colon + the message text.
                
                For example, if the right‐side says "Hey" and the left‐side says "Ok joining now," you would output:
                
                  sender:Hey
                  receiver:Ok joining now
                
                Now extract from the image and return only the labeled lines, in proper order.
                `
              },
              {
                inline_data: {
                  mime_type: imageFile.type,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048
          }
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
      }
  
      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('No text extracted from image');
      }
      
      return data.candidates[0].content.parts[0].text;
    }
  
    async generateReplySuggestion(conversationText) {
      const maxLength = 3000;
      const truncatedText = conversationText.length > maxLength 
        ? '...' + conversationText.slice(-maxLength)
        : conversationText;
  
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an AI assistant whose job is to generate a human,
               context-aware reply that the "sender" should send in an ongoing conversation.
                The input you receive will clearly label each message as either "sender:" or "receiver:".
                 First, you should analyze the conversation's tone, relationship, and style based on those sender/receiver labels.
                 Then, craft a single, medium-length, natural-sounding response that the sender could send next. Your reply should feel warm and genuine,
                  match the conversation's existing mood and topic, and use a touch of wit if appropriate.
                   Do not add any extra explanations—only output the suggested reply text.
  
  Here's a conversation transcript:
  
  ${truncatedText}
  
  What should be the next reply?`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
            topP: 0.8,
            topK: 10
          }
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
      }
  
      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('No reply suggestion generated');
      }
      
      return data.candidates[0].content.parts[0].text.trim();
    }
  
    async fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  
    // Utility methods
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        

        // Change button to “Copied!” with green background
      this.copyMeaningBtn.textContent = 'Copied!';
      this.copyMeaningBtn.classList.add('copied');

      // After 2 seconds, revert back so you can copy again
      setTimeout(() => {
        this.copyMeaningBtn.textContent = 'Copy';
        this.copyMeaningBtn.classList.remove('copied');
      }, 2000);


         // Change button to “Copied!” with green background
      this.copyGrammarBtn .textContent = 'Copied!';
      this.copyGrammarBtn .classList.add('copied');

      // After 2 seconds, revert back so you can copy again
      setTimeout(() => {
        this.copyGrammarBtn .textContent = 'Copy';
        this.copyGrammarBtn .classList.remove('copied');
      }, 2000);
        // Show temporary success feedback

        // Change button to “Copied!” with green background
      this.copyBtn .textContent = 'Copied!';
      this.copyBtn .classList.add('copied');

      // After 2 seconds, revert back so you can copy again
      setTimeout(() => {
        this.copyBtn .textContent = 'Copy';
        this.copyBtn .classList.remove('copied');
      }, 2000);
        // Show temporary success feedback


        const event = new CustomEvent('copySuccess');
        document.dispatchEvent(event);



      } catch (error) {
        console.error('Failed to copy:', error);
        this.showError('Failed to copy to clipboard');
      }
    }
  
    // UI state methods
    showLoading() {
      this.loadingDiv.style.display = 'block';
      this.resultSection.style.display = 'none';
      this.errorSection.style.display = 'none';
    }
  
    hideLoading() {
      this.loadingDiv.style.display = 'none';
    }
  
    showResults(suggestion) {
      this.suggestedReply.value = suggestion;
      this.resultSection.style.display = 'block';
      this.errorSection.style.display = 'none';
      this.hideLoading();
    }
  
    hideResults() {
      this.resultSection.style.display = 'none';
    }
  
    showError(message) {
      this.errorMessage.textContent = message;
      this.errorSection.style.display = 'block';
      this.resultSection.style.display = 'none';
      this.hideLoading();
    }
  
    hideError() {
      this.errorSection.style.display = 'none';
    }
  
    // Meaning tab UI methods
    showMeaningLoading() {
      this.meaningLoading.style.display = 'block';
      this.meaningResultSection.style.display = 'none';
      this.meaningErrorSection.style.display = 'none';
    }
  
    hideMeaningLoading() {
      this.meaningLoading.style.display = 'none';
    }
  
    showMeaningResults(meaning) {
      this.meaningOutput.value = meaning;
      this.meaningResultSection.style.display = 'block';
      this.meaningErrorSection.style.display = 'none';
      this.hideMeaningLoading();
    }
  
    showMeaningError(message) {
      this.meaningErrorMessage.textContent = message;
      this.meaningErrorSection.style.display = 'block';
      this.meaningResultSection.style.display = 'none';
      this.hideMeaningLoading();
    }
  
    hideMeaningError() {
      this.meaningErrorSection.style.display = 'none';
    }
  
    // Grammar tab UI methods
    showGrammarLoading() {
      this.grammarLoading.style.display = 'block';
      this.grammarResultSection.style.display = 'none';
      this.grammarErrorSection.style.display = 'none';
    }
  
    hideGrammarLoading() {
      this.grammarLoading.style.display = 'none';
    }
  
    showGrammarResults(improvedText) {
      this.grammarOutput.value = improvedText;
      this.grammarResultSection.style.display = 'block';
      this.grammarErrorSection.style.display = 'none';
      this.hideGrammarLoading();
    }
  
    showGrammarError(message) {
      this.grammarErrorMessage.textContent = message;
      this.grammarErrorSection.style.display = 'block';
      this.grammarResultSection.style.display = 'none';
      this.hideGrammarLoading();
    }
  
    hideGrammarError() {
      this.grammarErrorSection.style.display = 'none';
    }
  }
  
  // Initialize the application when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    new ChatAssistant();
  });