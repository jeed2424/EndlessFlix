// Cross-browser compatibility
const nenBrowserAPI = (() => {
  if (typeof browser !== 'undefined') {
    return browser; // Firefox
  } else if (typeof chrome !== 'undefined') {
    return chrome; // Chrome
  } else {
    throw new Error('Extension API not available');
  }
})();

let options = {};
nenBrowserAPI.runtime.onMessage.addListener(onMessage);

const MAX_TRIES_DISABLE_AUTO_PREVIEW = 5;
const MAX_TRIES_MONITOR_SKIP = 10;

function onMessage(message, sender, sendResponse) {
  if (message.action === 'optionsChanged') {
    options = message.options;
  }
}

$(_ => {
  loadOptions(receivedOptions => {
    options = receivedOptions;
    // It's a react app, so anytime they navigate away or to another title, we need to rehide/do all our options
    $('.main-header').on('click', '*', function () {
      startHelper();
    });
    startHelper();
  });
});

function dispatchEventToBody(eventType) {
  const event = new Event(eventType, {
    bubbles: true,
    cancelable: false
  });
  document.dispatchEvent(event);
}

function startMonitoringForSelectors(selectors, numTries) {
  if (!selectors.length) {
    return;
  }
  /*Mutation observer for skippable elements*/
  const monitor = new MutationObserver(_ => {
    let selector = selectors.join(', ');
    let elems = document.querySelectorAll(selector);
    for (const elem of elems) {
      const ariaLabel = elem.getAttribute("aria-label");
      const newDataUia = elem.getAttribute("data-uia") || '';
      const isCredits = newDataUia.includes('watch-credits');
      
      // Netflix: Check data-uia for next-episode or watch-credits
      if (isCredits || newDataUia.includes('next-episode')) {
        elem.click();
        elem.dispatchEvent(new PointerEvent('click'));
        // Send an event that tries to trigger the react version of the action
        dispatchEventToBody(isCredits ? 'watchCreditsEvent' : 'nextEpEvent');
      } 
      // Both platforms: Skip intro buttons
      else if (ariaLabel === "Skip Intro" || ariaLabel === "SKIP INTRO") {
        doClick(elem).then(_ => {
          doGetPlayButton();
        });

        function doClick(n) {
          return new Promise(function (resolve) {
            resolve(n.firstChild.click());
          });
        }

        function doGetPlayButton() {
          let evt = document.createEvent('Event');
          evt.initEvent('playEvent', true, false);
          // fire the event
          document.dispatchEvent(evt);
        }

        dispatchEventToBody('skipIntroEvent');
      } 
      // Disney+: Play Next button
      else if (ariaLabel === "PLAY NEXT") {
        elem.click();
        elem.dispatchEvent(new PointerEvent('click'));
        console.log('EndlessFlix: Clicked PLAY NEXT button');
      } 
      // Fallback: Click other matched elements
      else {
        elem.click();
        elem.dispatchEvent(new PointerEvent('click'));
      }
    }
    if (options.disableAutoPlayOnBrowse) {
      disableAutoPreview();
    }
  });

  // Get the appropriate container based on platform
  let reactEntry = null;
  
  if (currentPlatform === 'netflix') {
    // Netflix uses appMountPoint
    reactEntry = document.getElementById("appMountPoint");
  } else if (currentPlatform === 'disney') {
    // Disney+ uses app_index on body, but we can also try to find a more specific container
    reactEntry = document.getElementById("app_index") || document.body;
  } else {
    // Fallback for unknown platforms
    reactEntry = document.body;
  }
  
  if (reactEntry) {
    console.log('EndlessFlix: Starting MutationObserver on', reactEntry.tagName, reactEntry.id || '(no id)');
    /*Start monitoring at react's entry point*/
    monitor.observe(reactEntry, {
      attributes: false, // Don't monitor attribute changes
      childList: true, //Monitor direct child elements (anything observable) changes
      subtree: true // Monitor all descendants
    });
  } else {
    console.warn('EndlessFlix: No container found, retrying...');
    if (numTries > MAX_TRIES_MONITOR_SKIP) {
      console.error('EndlessFlix: Max retries reached, giving up');
      return;
    }
    numTries++;
    setTimeout(_ => {
      startMonitoringForSelectors(selectors, numTries);
    }, 100 * numTries);
  }
}

function startHelper() {

  console.log('EndlessFlix: startHelper() called');
  console.log('EndlessFlix: Current platform detected:', currentPlatform || 'NONE');
  console.log('EndlessFlix: Extension enabled:', options.extensionEnabled);
  
  if (options.extensionEnabled === false) {
    console.log('EndlessFlix is disabled - no modifications applied');
    return;
  }
  
  let selectors = [];

  if (options.skipTitleSequence) {
    enableSkipTitleSequence(selectors);
  }

  if (options.dontMinimzeEndCreditsOfShow) {
    enableDontSkipEndShowCredits(selectors);
  }

  if (options.autoPlayNext) {
    enableAutoPlayNext(selectors);
  }

  if (options.skipStillHere) {
    /* Skip if still watching*/
    enableSkipStillHere(selectors);
  }

  if (options.hideDisliked) {
    hideDisliked();
  }

  if (options.watchCredits) {
    enableWatchCredits(selectors);
  }

  if (options.disableAutoPlayOnBrowse) {
    let numTries = 0;
    disableAutoPreview(numTries);
  }

  console.log('EndlessFlix: Final selectors array:', selectors);
  console.log('EndlessFlix: Total selectors count:', selectors.length);
  startMonitoringForSelectors(selectors, 0);
}

function disableAutoPreview(numTries) {
  let billboard = document.querySelector('.billboard-row');
  if (billboard) {
    const parent = billboard.parentElement;
    // create padding div to prevent sizing issues
    const emptyDiv = document.createElement("div");
    emptyDiv.style.height = '30px';
    parent.appendChild(emptyDiv);
    billboard.remove();
  } else {
    if (numTries > MAX_TRIES_DISABLE_AUTO_PREVIEW) {
      return;
    }
    setTimeout(_ => {
      numTries++;
      disableAutoPreview(numTries);
    }, numTries * 150);
  }
}

function hideDisliked() {
  const monitor = new MutationObserver(_ => {
    if (window.location.pathname === "/search") {
      // Don't hide cards on search page, you might actually be searching for a disliked title
      return;
    }
    let disliked = document.getElementsByClassName("is-disliked");
    for (let card of disliked) {
      hideSliderItem(card);
    }
  });
  let mainCardView = document.getElementsByClassName("lolomo");
  if (mainCardView.length) {
    /*Start monitoring at react's entry point*/
    monitor.observe(mainCardView[0], {
      attributes: false, // Don't monitor attribute changes
      childList: true, // Monitor direct child elements (anything observable) changes
      subtree: true, // Monitor all descendants
      characterData: false // monitor direct text changes
    });
  }

}

function hideSliderItem(elem) {
  let parent = elem.closest(".slider-item");
  if (parent) {
    parent.style.display = "none";
  }
}