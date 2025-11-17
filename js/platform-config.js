// Platform Configuration
// Each platform has its own selectors and supported features

const PLATFORM_CONFIG = {
    netflix: {
        name: 'Netflix',
        icon: '📺',
        domains: ['netflix.com'],
        
        // Feature support flags
        features: {
            skipTitleSequences: true,
            autoPlayNext: true,
            alwaysWatchCredits: true,
            hidePromotedVideos: true,
            dontPromptStillThere: true,
            dontMinimizeEndCredits: true,
            hideDownvotedContent: true
        },
        
        // Selectors for each feature
        selectors: {
            skipTitleSequences: [
                '[aria-label="Skip Intro"]',
                '[data-uia="player-skip-intro"]',
                '.skip-credits > a',
                '.watch-video--skip-content > button'
            ],
            
            autoPlayNext: [
                '.WatchNext-autoplay',
                '.WatchNext-still-hover-container',
                '[aria-label^="Next episode"]',
                '[data-uia^="next-episode-seamless-button"]',
                '.draining'
            ],
            
            alwaysWatchCredits: [
                '[aria-label^="Watch credits"]',
                '[data-uia^="watch-credits-seamless-button"]'
            ],
            
            dontPromptStillThere: [
                '[data-uia="interrupt-autoplay-continue"]',
                '.interrupter-actions > .nf-icon-button:first-child',
                '[aria-label^="Continue Playing"]'
            ],
            
            dontMinimizeEndCredits: [
                '.watch-video--player-view-minimized > div'
            ],
            
            // These features don't have click selectors, they modify the page differently
            hidePromotedVideos: [],
            hideDownvotedContent: []
        }
    },
    
    disney: {
        name: 'Disney+',
        icon: '🏰',
        domains: ['disneyplus.com'],
        
        features: {
            skipTitleSequences: true,
            autoPlayNext: true,
            alwaysWatchCredits: false,  // Should be enabled, issues need to be fixed first
            hidePromotedVideos: false,
            dontPromptStillThere: true,
            dontMinimizeEndCredits: false,
            hideDownvotedContent: false
        },
        
        selectors: {
            skipTitleSequences: [
                '[aria-label="SKIP INTRO"]',  // Most specific
            ],
            
            autoPlayNext: [
                '[aria-label^="PLAY NEXT"]',          // Matches "PLAY NEXT IN 1", etc.
                'button[aria-label^="PLAY NEXT"]',
                '[data-testid="icon-restart"]',
            ],
            
            alwaysWatchCredits: [
                // '#hivePlayer2',
                // 'video#hivePlayer2',
            ],
            
            dontPromptStillThere: [
                // TODO: Research Disney+ "still watching" selectors
            ],
            
            dontMinimizeEndCredits: [],
            hidePromotedVideos: [],
            hideDownvotedContent: []
        }
    }
};

// Helper function to get platform from URL
function getPlatformFromUrl(url) {
    if (!url) return null;
    
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        
        for (const [platformKey, config] of Object.entries(PLATFORM_CONFIG)) {
            if (config.domains.some(domain => hostname.includes(domain))) {
                return platformKey;
            }
        }
    } catch (e) {
        console.error('Error parsing URL:', e);
    }
    
    return null;
}

// Helper function to get all selectors for a platform and enabled features
function getSelectorsForPlatform(platformKey, enabledOptions) {
    const config = PLATFORM_CONFIG[platformKey];
    if (!config) return [];
    
    let selectors = [];
    
    // Add selectors for each enabled feature
    Object.keys(enabledOptions).forEach(optionKey => {
        if (enabledOptions[optionKey] && config.selectors[optionKey]) {
            selectors.push(...config.selectors[optionKey]);
        }
    });
    
    return selectors;
}

// Helper function to check if a feature is supported by a platform
function isPlatformFeatureSupported(platformKey, featureKey) {
    const config = PLATFORM_CONFIG[platformKey];
    if (!config) return false;
    
    return config.features[featureKey] === true;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PLATFORM_CONFIG, getPlatformFromUrl, getSelectorsForPlatform, isPlatformFeatureSupported };
}