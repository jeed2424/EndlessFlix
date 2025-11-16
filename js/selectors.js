// EndlessFlix - Platform-Aware Selectors
// This file builds selector lists based on the current platform

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

// Detect which platform we're currently on
function detectCurrentPlatform() {
  // Only run in content script context (not in service worker)
  if (typeof window === 'undefined' || !window.location) {
    return null;
  }
  
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes('netflix.com')) {
    return 'netflix';
  } else if (hostname.includes('disneyplus.com')) {
    return 'disney';
  }
  
  console.log('EndlessFlix: Unknown platform:', hostname);
  return null;
}

// Get the current platform (cached) - only in content script context
// Using var instead of let to avoid errors if loaded multiple times
var currentPlatform = currentPlatform || null;
if (typeof window !== 'undefined' && window.location && !currentPlatform) {
  currentPlatform = detectCurrentPlatform();
  console.log('EndlessFlix: Detected platform:', currentPlatform);
}

// Platform-specific selectors configuration
const PLATFORM_SELECTORS = {
  netflix: {
    autoPlayNext: [
      ".WatchNext-autoplay",
      '.WatchNext-still-hover-container',
      '[aria-label^="Next episode"]',
      '[data-uia^="next-episode-seamless-button"]',
      '.draining'
    ],
    skipTitleSequence: [
      '[aria-label="Skip Intro"]',
      '[data-uia="player-skip-intro"]',
      '.skip-credits > a',
      '.watch-video--skip-content > button'
    ],
    skipStillHere: [
      '[data-uia="interrupt-autoplay-continue"]',
      '.interrupter-actions > .nf-icon-button:first-child',
      '[aria-label^="Continue Playing"]'
    ],
    watchCredits: [
      '[aria-label^="Watch credits"]',
      '[data-uia^="watch-credits-seamless-button"]'
    ],
    dontMinimizeEndCredits: [
      '.watch-video--player-view-minimized > div'
    ]
  },
  
  disney: {
    autoPlayNext: [
      // '[aria-label="PLAY NEXT"]',
      // 'button[aria-label="PLAY NEXT"]',
      // '[data-testid="icon-restart"]'  // The SVG inside (backup)
    ],
    skipTitleSequence: [
      '[aria-label="SKIP INTRO"]',
      '.skip__button',
      'button.skip__button.body-copy',
      '.skip-icon-btn.next-chapter'
    ],
    skipStillHere: [
      // TODO: Add Disney+ "still watching" selectors when found
      // '[aria-label*="Continue"]',
    ],
    watchCredits: [
      // Disney+ might not have this feature
    ],
    dontMinimizeEndCredits: [
      // Disney+ might not have this feature
    ]
  }
};

// Get selectors for current platform
function getPlatformSelectors(feature) {
  if (!currentPlatform) {
    console.warn('EndlessFlix: No platform detected, returning empty selectors');
    return [];
  }
  
  const platformConfig = PLATFORM_SELECTORS[currentPlatform];
  if (!platformConfig) {
    console.warn('EndlessFlix: No config for platform:', currentPlatform);
    return [];
  }
  
  return platformConfig[feature] || [];
}

// Original functions updated to use platform-aware selectors
function enableAutoPlayNext(selectors) {
  const platformSelectors = getPlatformSelectors('autoPlayNext');
  selectors.push(...platformSelectors);
  console.log(`EndlessFlix: Added ${platformSelectors.length} autoPlayNext selectors for ${currentPlatform}`);
}

function enableSkipTitleSequence(selectors) {
  const platformSelectors = getPlatformSelectors('skipTitleSequence');
  selectors.push(...platformSelectors);
  console.log(`EndlessFlix: Added ${platformSelectors.length} skipTitleSequence selectors for ${currentPlatform}`);
}

function enableSkipStillHere(selectors) {
  const platformSelectors = getPlatformSelectors('skipStillHere');
  selectors.push(...platformSelectors);
  console.log(`EndlessFlix: Added ${platformSelectors.length} skipStillHere selectors for ${currentPlatform}`);
}

function enableWatchCredits(selectors) {
  const platformSelectors = getPlatformSelectors('watchCredits');
  selectors.push(...platformSelectors);
  console.log(`EndlessFlix: Added ${platformSelectors.length} watchCredits selectors for ${currentPlatform}`);
}

function enableDontSkipEndShowCredits(selectors) {
  const platformSelectors = getPlatformSelectors('dontMinimizeEndCredits');
  selectors.push(...platformSelectors);
  console.log(`EndlessFlix: Added ${platformSelectors.length} dontMinimizeEndCredits selectors for ${currentPlatform}`);
}