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
        
        // Feature support flags - TODO: Verify which features Disney+ supports
        features: {
            skipTitleSequences: true,  // Most streaming services have skip intro
            autoPlayNext: true,         // Most have auto-play next
            alwaysWatchCredits: false,  // Unknown if Disney+ has this
            hidePromotedVideos: false,  // Unknown
            dontPromptStillThere: true, // Most services have "Are you still watching?"
            dontMinimizeEndCredits: false, // Unknown
            hideDownvotedContent: false    // Unknown
        },
        
        // Selectors for each feature - TODO: Research and fill these in
        selectors: {
            skipTitleSequences: [
                '[aria-label="SKIP INTRO"]',      // Primary selector (most reliable)
                '.skip__button',                   // Disney+ specific class
                'button.skip__button.body-copy',   // More specific selector
                '.skip-icon-btn.next-chapter'      // Icon container (backup)
            ],
            
            autoPlayNext: [
                // TODO: Research Disney+ next episode button selectors
                // Example placeholder (needs to be researched):
                // '[data-testid="next-episode-button"]',
            ],
            
            dontPromptStillThere: [
                // TODO: Research Disney+ "still watching" selectors
                // Example placeholder (needs to be researched):
                // '[data-testid="continue-watching-button"]',
            ]
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