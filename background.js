 // /path/to/your/extension/background.js
 
 // Function to capture a screenshot of the current tab
 async function captureScreenshot() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
 }
 
 // Function to convert data URL to base64 string (removing the prefix)
 function dataURLToBase64(dataURL) {
  return dataURL.split(',')[1];
 }
 
 // Function to compare screenshots using OpenAI Vision API
 async function compareScreenshotsWithLLM(controlData, testData) {
  try {
    // Get API key from storage
    const result = await chrome.storage.sync.get(['apiKey']);
    const apiKey = result.apiKey;
    
    if (!apiKey) {
      throw new Error("API key not configured");
    }
    
    // Convert data URLs to base64
    const controlBase64 = dataURLToBase64(controlData);
    const testBase64 = dataURLToBase64(testData);
    
    // Get the selected model from the request or storage
    const selectedModel = request.testConfig.selectedModel || 
                         (await chrome.storage.local.get(['selectedModel'])).selectedModel || 
                         'gpt-4-vision-preview';
    
    // Prepare the API request to OpenAI
    console.log(`Using model: ${selectedModel}`);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: "You are an expert QA testing engineer that compares screenshots of websites to identify visual differences. You have a keen eye for detail and understand what issues would impact users versus minor cosmetic differences that don't affect functionality."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "I'm comparing a production website with a test version. The first image is from production (control), and the second is from the test environment.\n\nAs a QA engineer, please analyze both images and provide:\n\n1. A summary of all visual differences you can identify\n2. For each difference, categorize it as:\n   - CRITICAL: Breaks functionality or severely impacts user experience\n   - MAJOR: Significant visual issues that would confuse users\n   - MINOR: Small visual differences that don't impact usability\n   - COSMETIC: Tiny differences that most users wouldn't notice\n3. Explain the potential impact of each difference on the user experience\n4. Provide specific locations of issues (e.g., 'top navigation bar', 'footer', 'main content area')\n5. End with a clear PASS or FAIL verdict\n   - PASS: Only if there are no CRITICAL or MAJOR issues\n   - FAIL: If any CRITICAL or MAJOR issues exist\n\nFormat your conclusion clearly with 'VERDICT: PASS' or 'VERDICT: FAIL' on its own line at the end."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${controlBase64}`
                }
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${testBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    // Determine if the test passed based on the analysis
    const passed = analysis.toLowerCase().includes("verdict: pass");
    
    return {
      passed,
      analysis
    };
  } catch (error) {
    console.error("LLM comparison failed:", error);
    throw error;
  }
 }
 
 // Function to run a test
 async function runTest(testConfig) {
  try {
    const productionUrl = testConfig.productionUrl;
    const testUrl = testConfig.testUrl;
    
    if (!productionUrl || !testUrl) {
      throw new Error("Production and test URLs are required");
    }
    
    // Create a new tab for production site
    const productionTab = await chrome.tabs.create({ url: productionUrl, active: true });
    
    // Wait for page to load completely
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Capture control screenshot
    const controlScreenshot = await captureScreenshot();
    
    // Navigate to test site in the same tab
    await chrome.tabs.update(productionTab.id, { url: testUrl });
    
    // Wait for page to load completely
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Capture test screenshot
    const testScreenshot = await captureScreenshot();
    
    // Close the tab we created
    await chrome.tabs.remove(productionTab.id);
    
    // Compare screenshots using LLM
    const comparisonResult = await compareScreenshotsWithLLM(controlScreenshot, testScreenshot);
    
    // Report results to the popup
    chrome.runtime.sendMessage({
      type: 'testResult',
      success: true,
      data: comparisonResult
    });
    
    console.log("Test Result:", comparisonResult);
    return comparisonResult;
  } catch (error) {
    console.error("Test failed:", error);
    
    // Report error to the popup
    chrome.runtime.sendMessage({
      type: 'testResult',
      success: false,
      error: error.message
    });
    
    throw error;
  }
 }
 
 // Function to compare saved screenshots using OpenAI Vision API
 async function compareSavedScreenshots(controlData, testData) {
  try {
    // Get API key from storage
    const result = await chrome.storage.sync.get(['apiKey']);
    const apiKey = result.apiKey;
    
    if (!apiKey) {
      throw new Error("API key not configured");
    }
    
    // Convert data URLs to base64 if they aren't already
    const controlBase64 = controlData.startsWith('data:image') ? dataURLToBase64(controlData) : controlData;
    const testBase64 = testData.startsWith('data:image') ? dataURLToBase64(testData) : testData;
    
    // Get the selected model
    const modelResult = await chrome.storage.local.get(['selectedModel']);
    const selectedModel = modelResult.selectedModel || 'gpt-4-vision-preview';
    
    // Prepare the API request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: "You are an expert QA testing engineer that compares screenshots of websites to identify visual differences. You have a keen eye for detail and understand what issues would impact users versus minor cosmetic differences that don't affect functionality."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "I'm comparing a production website with a test version. The first image is from production (control), and the second is from the test environment.\n\nAs a QA engineer, please analyze both images and provide:\n\n1. A summary of all visual differences you can identify\n2. For each difference, categorize it as:\n   - CRITICAL: Breaks functionality or severely impacts user experience\n   - MAJOR: Significant visual issues that would confuse users\n   - MINOR: Small visual differences that don't impact usability\n   - COSMETIC: Tiny differences that most users wouldn't notice\n3. Explain the potential impact of each difference on the user experience\n4. Provide specific locations of issues (e.g., 'top navigation bar', 'footer', 'main content area')\n5. End with a clear PASS or FAIL verdict\n   - PASS: Only if there are no CRITICAL or MAJOR issues\n   - FAIL: If any CRITICAL or MAJOR issues exist\n\nFormat your conclusion clearly with 'VERDICT: PASS' or 'VERDICT: FAIL' on its own line at the end."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${controlBase64}`
                }
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${testBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    // Determine if the test passed based on the analysis
    const passed = analysis.toLowerCase().includes("verdict: pass");
    
    return {
      passed,
      analysis
    };
  } catch (error) {
    console.error("LLM comparison failed:", error);
    throw error;
  }
 }

 // Listen for messages from the popup or other parts of the extension
 chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "runTest") {
    runTest(request.testConfig)
      .catch(error => console.error("Test execution failed:", error));
    return true; // Indicates async response
  }
  else if (request.action === "runTestWithImages") {
    // Run test with saved images
    compareSavedScreenshots(request.testConfig.controlImage, request.testConfig.testImage)
      .then(result => {
        chrome.runtime.sendMessage({
          type: 'testResult',
          success: true,
          data: result,
          testConfig: request.testConfig
        });
      })
      .catch(error => {
        console.error("Test execution failed:", error);
        chrome.runtime.sendMessage({
          type: 'testResult',
          success: false,
          error: error.message
        });
      });
    return true; // Indicates async response
  }
 });
