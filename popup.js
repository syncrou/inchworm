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
  if (savedApiKey) {
    apiKeyInput.value = '••••••••••••••••••••••••••';
    apiKeyInput.setAttribute('data-has-key', 'true');
    saveApiKeyButton.textContent = 'Update Key';
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
  
  // Save API key when button is clicked
  saveApiKeyButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      saveApiKey(apiKey).then(() => {
        apiKeyInput.value = '••••••••••••••••••••••••••';
        apiKeyInput.setAttribute('data-has-key', 'true');
        saveApiKeyButton.textContent = 'Update Key';
        resultsDiv.innerHTML = '<p style="color: green;">API key saved successfully!</p>';
      });
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
    
    // Send message to background script to run the test with saved images
    chrome.runtime.sendMessage({
      action: "runTestWithImages",
      testConfig: {
        controlImage: recentImages.control.imageData,
        testImage: recentImages.test.imageData,
        controlUrl: recentImages.control.url,
        testUrl: recentImages.test.url
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
        
        resultsDiv.innerHTML = `
          <h3>Test Results</h3>
          ${statusBanner}
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin-top: 10px;">
            <h4>Detailed Analysis:</h4>
            <div style="white-space: pre-wrap; font-family: 'Poppins', sans-serif;">${formattedAnalysis}</div>
          </div>
        `;
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
