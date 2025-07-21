// Load options from local storage
// Return default values if none exist
function loadOptions(callback) {
  browser.storage.sync.get('options', items => {
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

    browser.storage.sync.set({
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

  // Send options to all tabs
  browser.windows.getAll(null, function (windows) {
    for (let i = 0; i < windows.length; i++) {
      browser.tabs.getAllInWindow(windows[i].id, function (tabs) {
        for (let j = 0; j < tabs.length; j++) {
          browser.tabs.sendMessage(tabs[j].id, request);
        }
      });
    }
  });

  // Send options to other extension pages
  browser.runtime.sendMessage(request);
}


function injectScript(file_path, tag) {
  var node = document.getElementsByTagName(tag)[0];
  var script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', file_path);
  node.appendChild(script);
}

injectScript(browser.extension.getURL('js/playerInject.js'), 'body');
injectScript(browser.extension.getURL('js/selectors.js'), 'body');