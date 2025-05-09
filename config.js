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

// Save a captured image to local storage
async function saveImage(type, imageData, url) {
  const timestamp = new Date().toISOString();
  const imageId = `${type}_${timestamp}`;
  
  const imageEntry = {
    id: imageId,
    type: type, // 'control' or 'test'
    url: url,
    imageData: imageData,
    timestamp: timestamp
  };
  
  // Get existing images
  const result = await chrome.storage.local.get(['savedImages']);
  const savedImages = result.savedImages || [];
  
  // Add new image
  savedImages.push(imageEntry);
  
  // Save back to storage
  return chrome.storage.local.set({ savedImages });
}

// Get all saved images
async function getSavedImages() {
  const result = await chrome.storage.local.get(['savedImages']);
  return result.savedImages || [];
}

// Get the most recent control and test images
async function getRecentImages() {
  const savedImages = await getSavedImages();
  
  // Find the most recent control and test images
  let latestControl = null;
  let latestTest = null;
  
  for (const image of savedImages) {
    if (image.type === 'control' && (!latestControl || image.timestamp > latestControl.timestamp)) {
      latestControl = image;
    } else if (image.type === 'test' && (!latestTest || image.timestamp > latestTest.timestamp)) {
      latestTest = image;
    }
  }
  
  return { control: latestControl, test: latestTest };
}

// Delete a saved image by ID
async function deleteImage(imageId) {
  const result = await chrome.storage.local.get(['savedImages']);
  const savedImages = result.savedImages || [];
  
  const updatedImages = savedImages.filter(image => image.id !== imageId);
  
  return chrome.storage.local.set({ savedImages: updatedImages });
}

// Save URLs to Chrome storage
function saveUrls(productionUrl, testUrl) {
  return chrome.storage.local.set({ 
    productionUrl: productionUrl,
    testUrl: testUrl 
  });
}

// Get URLs from Chrome storage
async function getUrls() {
  const result = await chrome.storage.local.get(['productionUrl', 'testUrl']);
  return {
    productionUrl: result.productionUrl || '',
    testUrl: result.testUrl || ''
  };
}

// Save selected model to Chrome storage
function saveSelectedModel(model) {
  return chrome.storage.local.set({ selectedModel: model });
}

// Get selected model from Chrome storage
async function getSelectedModel() {
  const result = await chrome.storage.local.get(['selectedModel']);
  return result.selectedModel || 'gpt-4-turbo'; // Default model
}

// Get available models from OpenAI API
async function getAvailableModels(apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Only these models support vision capabilities
    const visionCapableModels = [
      'gpt-4-vision-preview',
      'gpt-4-turbo-2024-04-09',
      'gpt-4-turbo'
    ];
    
    // Filter models that are vision-capable and available in the API
    const availableModels = data.data
      .filter(model => visionCapableModels.some(supported => model.id.includes(supported)))
      .map(model => model.id);
    
    // Add fallback models if none are found
    if (availableModels.length === 0) {
      return visionCapableModels;
    }
    
    return availableModels;
  } catch (error) {
    console.error("Error fetching models:", error);
    // Return default vision-capable models if API call fails
    return [
      'gpt-4-vision-preview',
      'gpt-4-turbo-2024-04-09',
      'gpt-4-turbo'
    ];
  }
}
