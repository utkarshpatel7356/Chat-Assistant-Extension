// Background service worker for the extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Chat Assistant extension installed');
  });
  
  // Handle extension icon click
  chrome.action.onClicked.addListener((tab) => {
    // The popup will handle everything, so this is just for completeness
    console.log('Extension clicked');
  });