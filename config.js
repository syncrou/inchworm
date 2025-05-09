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
