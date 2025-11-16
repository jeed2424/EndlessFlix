// js/service-worker.js
// Service worker for EndlessFlix Chrome extension

// Note: We don't need to import selectors.js here
// Selectors are only used in content scripts (NEN.js)

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle any background tasks here if needed
  if (message.action === 'optionsChanged') {
    // Options were changed, message is already sent to content scripts
    console.log('EndlessFlix: Options updated');
  }
  return true;
});

console.log('EndlessFlix: Service worker loaded');