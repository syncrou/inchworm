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
