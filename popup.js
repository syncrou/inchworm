// popup.js - Handles the popup UI and interactions

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyButton = document.getElementById('saveApiKey');
  const runTestButton = document.getElementById('runTest');
  const resultsDiv = document.getElementById('results');
  const productionUrlInput = document.getElementById('productionUrl');
  const testUrlInput = document.getElementById('testUrl');
  
  // Load saved API key if available
  const savedApiKey = await getApiKey();
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
  }
  
  // Save API key when button is clicked
  saveApiKeyButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      saveApiKey(apiKey).then(() => {
        resultsDiv.innerHTML = '<p style="color: green;">API key saved successfully!</p>';
      });
    } else {
      resultsDiv.innerHTML = '<p style="color: red;">Please enter a valid API key</p>';
    }
  });
  
  runTestButton.addEventListener('click', async () => {
    // Check if API key is configured
    const apiKeyConfigured = await isApiKeyConfigured();
    if (!apiKeyConfigured) {
      resultsDiv.innerHTML = '<p style="color: red;">Please configure your OpenAI API key first.</p>';
      return;
    }
    
    const productionUrl = productionUrlInput.value.trim();
    const testUrl = testUrlInput.value.trim();
    
    if (!productionUrl || !testUrl) {
      resultsDiv.innerHTML = '<p style="color: red;">Please enter both Production and Test URLs.</p>';
      return;
    }
    
    // Show loading state
    resultsDiv.innerHTML = '<p>Running test, please wait...</p>';
    
    // Send message to background script to run the test
    chrome.runtime.sendMessage({
      action: "runTest",
      testConfig: {
        productionUrl,
        testUrl
      }
    });
  });
  
  // Listen for test results from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'testResult') {
      if (message.success) {
        resultsDiv.innerHTML = `
          <h3>Test Results</h3>
          <p><strong>Status:</strong> ${message.data.passed ? 'PASSED ✅' : 'FAILED ❌'}</p>
          <p><strong>Analysis:</strong></p>
          <pre>${message.data.analysis}</pre>
        `;
      } else {
        resultsDiv.innerHTML = `
          <h3>Test Failed</h3>
          <p style="color: red;">${message.error}</p>
        `;
      }
    }
  });
});
