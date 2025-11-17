// Cross-browser compatibility layer
// Firefox supports chrome.* as an alias, but use browser.* if available
const commonBrowserAPI = (() => {
  if (typeof browser !== 'undefined') {
    return browser; // Firefox
  } else if (typeof chrome !== 'undefined') {
    return chrome; // Chrome
  } else {
    throw new Error('Extension API not available');
  }
})();

// Load options from local storage
// Return default values if none exist
function loadOptions(callback) {
  commonBrowserAPI.storage.sync.get('options', items => {
    let options = items['options'];
    if (options == null || options === "{}") {
      options = {};
    }

    options.skipStillHere = options.hasOwnProperty('skipStillHere') ? options.skipStillHere : true;
    options.autoPlayNext = options.hasOwnProperty('autoPlayNext') ? options.autoPlayNext : true;
    options.watchCredits = options.hasOwnProperty('watchCredits') ? options.watchCredits : false;
    options.skipTitleSequence = options.hasOwnProperty('skipTitleSequence') ? options.skipTitleSequence : true;
    options.disableAutoPlayOnBrowse = options.hasOwnProperty('disableAutoPlayOnBrowse') ? options.disableAutoPlayOnBrowse : false;
    options.dontMinimzeEndCreditsOfShow = options.hasOwnProperty('dontMinimzeEndCreditsOfShow') ? options.dontMinimzeEndCreditsOfShow : false;
    options.hideDisliked = options.hasOwnProperty('hideDisliked') ? options.hideDisliked : false;
    options.highContrast = options.hasOwnProperty('highContrast') ? options.highContrast : false;
    options.extensionEnabled = options.hasOwnProperty('extensionEnabled') ? options.extensionEnabled : true;

    commonBrowserAPI.storage.sync.set({
      'options': options
    }, _ => {
      callback(options);
    });
  });
}

// Send options to all tabs and extension pages
function sendOptions(options) {
  let request = {
    action: 'optionsChanged',
    'options': options
  };

  // Send options to all tabs - updated for Manifest V3
  commonBrowserAPI.tabs.query({}, function(tabs) {
    for (let tab of tabs) {
      commonBrowserAPI.tabs.sendMessage(tab.id, request).catch(() => {
        // Ignore errors for tabs that can't receive messages
      });
    }
  });

  // Send options to other extension pages
  commonBrowserAPI.runtime.sendMessage(request);
}


function injectScript(file_path, tag) {
  var node = document.getElementsByTagName(tag)[0];
  var script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', file_path);
  node.appendChild(script);
}

// Only inject playerInject.js on Netflix (it's Netflix-specific)
if (window.location.hostname.includes('netflix.com')) {
  injectScript(commonBrowserAPI.runtime.getURL('js/playerInject.js'), 'body');
}

// Always inject selectors.js (works on all platforms)
injectScript(commonBrowserAPI.runtime.getURL('js/selectors.js'), 'body');