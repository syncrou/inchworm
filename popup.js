// popup.js - Handles the popup UI and interactions

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyButton = document.getElementById('saveApiKey');
  const runTestButton = document.getElementById('runTest');
  const resultsDiv = document.getElementById('results');
  const productionUrlInput = document.getElementById('productionUrl');
  const testUrlInput = document.getElementById('testUrl');
  const openProductionUrlButton = document.getElementById('openProductionUrl');
  const openTestUrlButton = document.getElementById('openTestUrl');
  const captureControlButton = document.getElementById('captureControl');
  const captureTestButton = document.getElementById('captureTest');
  const viewSavedImagesButton = document.getElementById('viewSavedImages');
  
  // Load saved API key if available
  const savedApiKey = await getApiKey();
  const modelSelectorContainer = document.getElementById('modelSelectorContainer');
  const modelSelector = document.getElementById('modelSelector');
  const modelSaved = document.getElementById('modelSaved');
  
  if (savedApiKey) {
    apiKeyInput.value = '••••••••••••••••••••••••••';
    apiKeyInput.setAttribute('data-has-key', 'true');
    saveApiKeyButton.textContent = 'Update Key';
    
    // Show model selector and populate with available models
    modelSelectorContainer.style.display = 'block';
    
    try {
      // Get available models
      const models = await getAvailableModels(savedApiKey);
      
      // Get saved model
      const savedModel = await getSelectedModel();
      
      // Clear existing options
      modelSelector.innerHTML = '';
      
      // Add options for each model
      const addedModels = new Set(); // Track models we've already added
      models.forEach(model => {
        // Skip duplicate models (different versions of the same model)
        const baseModelName = getBaseModelName(model);
        if (addedModels.has(baseModelName)) return;
        
        addedModels.add(baseModelName);
        
        const option = document.createElement('option');
        option.value = model; // Keep the full model name as the value
        option.textContent = getDisplayName(model);
        modelSelector.appendChild(option);
      });
      
      // Helper function to get base model name
      function getBaseModelName(model) {
        if (model.includes('gpt-4o-mini')) return 'gpt-4o-mini';
        return model;
      }
      
      // Helper function to get friendly display name
      function getDisplayName(model) {
        if (model.includes('gpt-4o-mini')) return 'GPT-4o Mini';
        return model; // Fallback to the original model name
      }
      
      // Set the selected model
      if (savedModel && models.includes(savedModel)) {
        modelSelector.value = savedModel;
        modelSaved.textContent = '(saved)';
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  } else {
    // Hide model selector if no API key
    modelSelectorContainer.style.display = 'none';
  }
  
  // Load saved URLs if available
  const savedUrls = await getUrls();
  const productionUrlSaved = document.getElementById('productionUrlSaved');
  const testUrlSaved = document.getElementById('testUrlSaved');
  
  if (savedUrls.productionUrl) {
    productionUrlInput.value = savedUrls.productionUrl;
    productionUrlSaved.textContent = '(saved)';
  }
  if (savedUrls.testUrl) {
    testUrlInput.value = savedUrls.testUrl;
    testUrlSaved.textContent = '(saved)';
  }
  
  // Update saved indicators when input changes
  productionUrlInput.addEventListener('input', () => {
    if (productionUrlInput.value.trim() !== savedUrls.productionUrl) {
      productionUrlSaved.textContent = '';
    } else {
      productionUrlSaved.textContent = '(saved)';
    }
  });
  
  testUrlInput.addEventListener('input', () => {
    if (testUrlInput.value.trim() !== savedUrls.testUrl) {
      testUrlSaved.textContent = '';
    } else {
      testUrlSaved.textContent = '(saved)';
    }
  });
  
  // Handle API key input focus
  apiKeyInput.addEventListener('focus', function() {
    if (this.getAttribute('data-has-key') === 'true') {
      this.value = '';
    }
  });
  
  // Handle model selection
  modelSelector.addEventListener('change', async function() {
    const selectedModel = this.value;
    await saveSelectedModel(selectedModel);
    modelSaved.textContent = '(saved)';
  });
  
  // Save API key when button is clicked
  saveApiKeyButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      await saveApiKey(apiKey);
      apiKeyInput.value = '••••••••••••••••••••••••••';
      apiKeyInput.setAttribute('data-has-key', 'true');
      saveApiKeyButton.textContent = 'Update Key';
      resultsDiv.innerHTML = '<p style="color: green;">API key saved successfully!</p>';
      
      // Show and populate model selector
      modelSelectorContainer.style.display = 'block';
      
      try {
        // Get available models
        const models = await getAvailableModels(apiKey);
        
        // Clear existing options
        modelSelector.innerHTML = '';
        
        // Add options for each model
        const addedModels = new Set(); // Track models we've already added
        models.forEach(model => {
          // Skip duplicate models (different versions of the same model)
          const baseModelName = getBaseModelName(model);
          if (addedModels.has(baseModelName)) return;
          
          addedModels.add(baseModelName);
          
          const option = document.createElement('option');
          option.value = model; // Keep the full model name as the value
          option.textContent = getDisplayName(model);
          modelSelector.appendChild(option);
        });
        
        // Helper function to get base model name
        function getBaseModelName(model) {
          if (model.includes('gpt-4o-mini')) return 'gpt-4o-mini';
          return model;
        }
        
        // Helper function to get friendly display name
        function getDisplayName(model) {
          if (model.includes('gpt-4o-mini')) return 'GPT-4o-mini';
          return model; // Fallback to the original model name
        }
        
        // Save the first model as default if none is saved
        const savedModel = await getSelectedModel();
        if (models.length > 0) {
          if (!savedModel || !models.includes(savedModel)) {
            await saveSelectedModel(models[0]);
          }
          modelSelector.value = savedModel || models[0];
          modelSaved.textContent = '(saved)';
        }
      } catch (error) {
        console.error('Error loading models:', error);
      }
    } else {
      resultsDiv.innerHTML = '<p style="color: red;">Please enter a valid API key</p>';
    }
  });
  
  // Open production URL in a new tab
  openProductionUrlButton.addEventListener('click', () => {
    const productionUrl = productionUrlInput.value.trim();
    if (productionUrl) {
      // Save the URL before opening
      saveUrls(productionUrl, testUrlInput.value.trim());
      productionUrlSaved.textContent = '(saved)';
      if (testUrlInput.value.trim()) {
        testUrlSaved.textContent = '(saved)';
      }
      chrome.tabs.create({ url: productionUrl });
    } else {
      resultsDiv.innerHTML = '<p style="color: #f44336; font-weight: bold;">Please enter a Production URL</p>';
    }
  });
  
  // Open test URL in a new tab
  openTestUrlButton.addEventListener('click', () => {
    const testUrl = testUrlInput.value.trim();
    if (testUrl) {
      // Save the URL before opening
      saveUrls(productionUrlInput.value.trim(), testUrl);
      testUrlSaved.textContent = '(saved)';
      if (productionUrlInput.value.trim()) {
        productionUrlSaved.textContent = '(saved)';
      }
      chrome.tabs.create({ url: testUrl });
    } else {
      resultsDiv.innerHTML = '<p style="color: #f44336; font-weight: bold;">Please enter a Test URL</p>';
    }
  });
  
  // Capture control image
  captureControlButton.addEventListener('click', async () => {
    try {
      resultsDiv.innerHTML = '<p>Capturing control image...</p>';
      
      // Get the current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab.url;
      
      // Capture screenshot
      const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
      
      // Save the image
      await saveImage('control', screenshot, currentUrl);
      
      resultsDiv.innerHTML = '<p style="color: green;">Control image captured and saved!</p>';
    } catch (error) {
      resultsDiv.innerHTML = `<p style="color: #f44336; font-weight: bold;">Error capturing image: ${error.message}</p>`;
    }
  });
  
  // Capture test image
  captureTestButton.addEventListener('click', async () => {
    try {
      resultsDiv.innerHTML = '<p>Capturing test image...</p>';
      
      // Get the current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab.url;
      
      // Capture screenshot
      const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
      
      // Save the image
      await saveImage('test', screenshot, currentUrl);
      
      resultsDiv.innerHTML = '<p style="color: green;">Test image captured and saved!</p>';
    } catch (error) {
      resultsDiv.innerHTML = `<p style="color: #f44336; font-weight: bold;">Error capturing image: ${error.message}</p>`;
    }
  });
  
  // View saved images
  viewSavedImagesButton.addEventListener('click', async () => {
    try {
      const savedImages = await getSavedImages();
      
      if (savedImages.length === 0) {
        resultsDiv.innerHTML = '<p>No saved images found.</p>';
        return;
      }
      
      let html = '<h3>Saved Images</h3>';
      
      // Group images by type
      const controlImages = savedImages.filter(img => img.type === 'control');
      const testImages = savedImages.filter(img => img.type === 'test');
      
      html += '<h4>Control Images</h4>';
      if (controlImages.length === 0) {
        html += '<p>No control images saved.</p>';
      } else {
        html += '<ul>';
        for (const img of controlImages) {
          const date = new Date(img.timestamp).toLocaleString();
          html += `<li>
            <p><strong>URL:</strong> ${img.url}</p>
            <p><strong>Date:</strong> ${date}</p>
            <img src="${img.imageData}" width="200" />
            <button class="delete-image" data-id="${img.id}">Delete</button>
          </li>`;
        }
        html += '</ul>';
      }
      
      html += '<h4>Test Images</h4>';
      if (testImages.length === 0) {
        html += '<p>No test images saved.</p>';
      } else {
        html += '<ul>';
        for (const img of testImages) {
          const date = new Date(img.timestamp).toLocaleString();
          html += `<li>
            <p><strong>URL:</strong> ${img.url}</p>
            <p><strong>Date:</strong> ${date}</p>
            <img src="${img.imageData}" width="200" />
            <button class="delete-image" data-id="${img.id}">Delete</button>
          </li>`;
        }
        html += '</ul>';
      }
      
      resultsDiv.innerHTML = html;
      
      // Add event listeners to delete buttons
      document.querySelectorAll('.delete-image').forEach(button => {
        button.addEventListener('click', async (e) => {
          const imageId = e.target.getAttribute('data-id');
          await deleteImage(imageId);
          // Refresh the view
          viewSavedImagesButton.click();
        });
      });
    } catch (error) {
      resultsDiv.innerHTML = `<p style="color: #f44336; font-weight: bold;">Error loading images: ${error.message}</p>`;
    }
  });
  
  runTestButton.addEventListener('click', async () => {
    // Check if API key is configured
    const apiKeyConfigured = await isApiKeyConfigured();
    if (!apiKeyConfigured) {
      resultsDiv.innerHTML = '<p style="color: #f44336; font-weight: bold;">Please configure your OpenAI API key first.</p>';
      return;
    }
    
    // Save current URLs
    const productionUrl = productionUrlInput.value.trim();
    const testUrl = testUrlInput.value.trim();
    if (productionUrl || testUrl) {
      saveUrls(productionUrl, testUrl);
    }
    
    // Get the most recent control and test images
    const recentImages = await getRecentImages();
    
    if (!recentImages.control || !recentImages.test) {
      resultsDiv.innerHTML = '<p style="color: #f44336; font-weight: bold;">Please capture both control and test images first.</p>';
      return;
    }
    
    // Show loading state
    resultsDiv.innerHTML = '<p>Running test, please wait...</p>';
    
    // Get the selected model
    const modelResult = await chrome.storage.local.get(['selectedModel']);
    const selectedModel = modelResult.selectedModel || 'gpt-4-vision-preview';
    
    // Send message to background script to run the test with saved images
    chrome.runtime.sendMessage({
      action: "runTestWithImages",
      testConfig: {
        controlImage: recentImages.control.imageData,
        testImage: recentImages.test.imageData,
        controlUrl: recentImages.control.url,
        testUrl: recentImages.test.url,
        selectedModel: selectedModel
      }
    });
  });
  
  // Listen for test results from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'testResult') {
      if (message.success) {
        // Create a more prominent pass/fail banner
        const statusBanner = message.data.passed ? 
          `<div style="background-color: #4caf50; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-size: 20px; font-weight: bold;">
            <span style="font-size: 24px;">✅ PASSED</span>
            <p style="margin: 5px 0 0 0; font-size: 14px;">All tests completed successfully</p>
          </div>` : 
          `<div style="background-color: #f44336; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-size: 20px; font-weight: bold;">
            <span style="font-size: 24px;">❌ FAILED</span>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Issues were detected that require attention</p>
          </div>`;
        
        // Format the analysis to highlight issue categories
        const formattedAnalysis = message.data.analysis
          .replace(/CRITICAL:/g, '<span style="color: #f44336; font-weight: bold;">CRITICAL:</span>')
          .replace(/MAJOR:/g, '<span style="color: #ff9800; font-weight: bold;">MAJOR:</span>')
          .replace(/MINOR:/g, '<span style="color: #ffeb3b; font-weight: bold;">MINOR:</span>')
          .replace(/COSMETIC:/g, '<span style="color: #8bc34a; font-weight: bold;">COSMETIC:</span>')
          .replace(/VERDICT: PASS/gi, '<span style="color: #4caf50; font-weight: bold;">VERDICT: PASS</span>')
          .replace(/VERDICT: FAIL/gi, '<span style="color: #f44336; font-weight: bold;">VERDICT: FAIL</span>');
        
        // Get timestamp for the filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Create download button
        const downloadButton = `
          <button id="downloadResults" style="background-color: #8bc34a; margin-top: 15px; width: 100%;">
            Download Results as HTML
          </button>
        `;
        
        // Get model name for display
        const modelName = message.testConfig?.selectedModel || 'Unknown Model';
        
        resultsDiv.innerHTML = `
          <h3>Test Results</h3>
          ${statusBanner}
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin-top: 10px;">
            <p><strong>Model used:</strong> ${modelName}</p>
            <h4>Detailed Analysis:</h4>
            <div style="white-space: pre-wrap; font-family: 'Poppins', sans-serif;">${formattedAnalysis}</div>
          </div>
          ${downloadButton}
        `;
        
        // Add event listener to download button
        document.getElementById('downloadResults').addEventListener('click', () => {
          // Create full HTML report
          const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Inchworm QA Test Results - ${timestamp}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
              h1, h2, h3 { color: #4caf50; }
              .banner { padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; color: white; }
              .pass { background-color: #4caf50; }
              .fail { background-color: #f44336; }
              .images { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
              .image-container { flex: 1; min-width: 300px; }
              .image-container img { max-width: 100%; border: 1px solid #ddd; }
              .analysis { white-space: pre-wrap; background-color: #f9f9f9; padding: 15px; border-radius: 8px; }
              .critical { color: #f44336; font-weight: bold; }
              .major { color: #ff9800; font-weight: bold; }
              .minor { color: #ffeb3b; font-weight: bold; }
              .cosmetic { color: #8bc34a; font-weight: bold; }
              .verdict-pass { color: #4caf50; font-weight: bold; }
              .verdict-fail { color: #f44336; font-weight: bold; }
              .metadata { background-color: #f5f5f5; padding: 10px; border-radius: 8px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h1>Inchworm QA Test Results</h1>
            
            <div class="metadata">
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Model used:</strong> ${modelName}</p>
              <p><strong>Control URL:</strong> ${message.testConfig?.controlUrl || 'N/A'}</p>
              <p><strong>Test URL:</strong> ${message.testConfig?.testUrl || 'N/A'}</p>
            </div>
            
            <div class="banner ${message.data.passed ? 'pass' : 'fail'}">
              <h2>${message.data.passed ? '✅ PASSED' : '❌ FAILED'}</h2>
              <p>${message.data.passed ? 'All tests completed successfully' : 'Issues were detected that require attention'}</p>
            </div>
            
            <h2>Screenshots Compared</h2>
            <div class="images">
              <div class="image-container">
                <h3>Control Image (Production)</h3>
                <img src="${message.testConfig?.controlImage}" alt="Control Image">
              </div>
              <div class="image-container">
                <h3>Test Image</h3>
                <img src="${message.testConfig?.testImage}" alt="Test Image">
              </div>
            </div>
            
            <h2>Analysis</h2>
            <div class="analysis">
              ${message.data.analysis
                .replace(/CRITICAL:/g, '<span class="critical">CRITICAL:</span>')
                .replace(/MAJOR:/g, '<span class="major">MAJOR:</span>')
                .replace(/MINOR:/g, '<span class="minor">MINOR:</span>')
                .replace(/COSMETIC:/g, '<span class="cosmetic">COSMETIC:</span>')
                .replace(/VERDICT: PASS/gi, '<span class="verdict-pass">VERDICT: PASS</span>')
                .replace(/VERDICT: FAIL/gi, '<span class="verdict-fail">VERDICT: FAIL</span>')}
            </div>
          </body>
          </html>
          `;
          
          // Create download link
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `inchworm-qa-results-${timestamp}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      } else {
        resultsDiv.innerHTML = `
          <div style="background-color: #f44336; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-size: 20px; font-weight: bold;">
            <span style="font-size: 24px;">❌ ERROR</span>
            <p style="margin: 5px 0 0 0; font-size: 14px;">The test could not be completed</p>
          </div>
          <div style="background-color: white; padding: 15px; border-radius: 8px;">
            <h4>Error Details:</h4>
            <p style="color: #f44336; font-weight: bold;">${message.error}</p>
          </div>
        `;
      }
    }
  });
});
