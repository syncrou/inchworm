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
    
    // Prepare the API request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: "You are a QA testing assistant that compares screenshots of websites to identify visual differences and determine if they pass quality assurance standards."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "I'm comparing a production website with a test version. The first image is from production, and the second is from the test environment. Please analyze both images and tell me:\n1. Are there any visual differences between them?\n2. If there are differences, are they significant enough to fail QA testing?\n3. Provide a detailed explanation of what differences you found.\n4. Conclude with a clear PASS or FAIL recommendation."
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
    const passed = analysis.toLowerCase().includes("pass");
    
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
    
    // Prepare the API request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You are a QA testing assistant that compares screenshots of websites to identify visual differences and determine if they pass quality assurance standards."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "I'm comparing a production website with a test version. The first image is from production, and the second is from the test environment. Please analyze both images and tell me:\n1. Are there any visual differences between them?\n2. If there are differences, are they significant enough to fail QA testing?\n3. Provide a detailed explanation of what differences you found.\n4. Conclude with a clear PASS or FAIL recommendation."
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
    const passed = analysis.toLowerCase().includes("pass");
    
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
          data: result
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
