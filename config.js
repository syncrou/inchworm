// config.js - Handles API key storage and configuration

// Save API key to Chrome storage
function saveApiKey(apiKey) {
  return chrome.storage.sync.set({ apiKey });
}

// Get API key from Chrome storage
async function getApiKey() {
  const result = await chrome.storage.sync.get(['apiKey']);
  return result.apiKey;
}

// Check if API key is configured
async function isApiKeyConfigured() {
  const apiKey = await getApiKey();
  return !!apiKey;
}

// Initialize event listeners for configuration UI
document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyButton = document.getElementById('saveApiKey');
  
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
        alert('API key saved successfully!');
      });
    } else {
      alert('Please enter a valid API key');
    }
  });
});
