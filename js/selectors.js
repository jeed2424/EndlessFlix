function _findPropertyNameByRegex(o, r) {
  if (!o) {
    return null;
  }
  for (var key in o) {
    if (key.match(r)) {
      return key;
    }
  }
  return undefined;
}

function enableAutoPlayNext(selectors) {
  /*Pulls all classes that start with "Watch Next" */
  if (currentPlatform == 'netflix') {
    netflixPlayNextOptions.forEach(pushSelector);
  };
}

function enableSkipTitleSequence(selectors) {
  /*Skip title sequence*/
  // if (currentPlatform == 'netflix') {
    const currentlyPlayingPlatform = currentTab.platform.toLowerCase();
    const platformSelectors = PLATFORM_SELECTORS[currentlyPlayingPlatform]?.skipIntro || [];
    platformSelectors.forEach(selector => selectors.push(selector));
    console.log('Platform is netflix, selecting ' + netflixSkipIntroOptions);
//  };
}

function enableSkipStillHere(selectors) {
  selectors.push('[data-uia="interrupt-autoplay-continue"]');
  selectors.push('.interrupter-actions > .nf-icon-button:first-child');
  selectors.push('[aria-label^="Continue Playing"]');
}

function enableWatchCredits(selectors) {
  selectors.push('[aria-label^="Watch credits"]');
  selectors.push('[data-uia^="watch-credits-seamless-button"]');
}

function enableDontSkipEndShowCredits(selectors) {
  selectors.push('.watch-video--player-view-minimized > div');
}

function pushSelector(item) {
  const itemString = String(item);
  selectors.push(itemString);
  console.log('Will push selectors');
}