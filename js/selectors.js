// EndlessFlix - Platform-Aware Selectors
// This file uses platform-config.js as the source of truth

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

// Get selectors for current platform from PLATFORM_CONFIG
function getPlatformSelectors(feature) {
  if (!currentPlatform) {
    console.warn('EndlessFlix: No platform detected, returning empty selectors');
    return [];
  }
  
  // PLATFORM_CONFIG is loaded from platform-config.js
  if (typeof PLATFORM_CONFIG === 'undefined') {
    console.error('EndlessFlix: PLATFORM_CONFIG not loaded!');
    return [];
  }
  
  const platformConfig = PLATFORM_CONFIG[currentPlatform];
  if (!platformConfig) {
    console.warn('EndlessFlix: No config for platform:', currentPlatform);
    return [];
  }
  
  // Map feature names to selector keys
  const selectorKeyMap = {
    'autoPlayNext': 'autoPlayNext',
    'skipTitleSequence': 'skipTitleSequences',
    'skipStillHere': 'dontPromptStillThere',
    'watchCredits': 'alwaysWatchCredits',
    'dontMinimizeEndCredits': 'dontMinimizeEndCredits'
  };
  
  const selectorKey = selectorKeyMap[feature] || feature;
  return platformConfig.selectors[selectorKey] || [];
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