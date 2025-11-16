// Simple platform configuration for popup UI
// This is separate from selectors.js (which runs in content scripts)

const PLATFORM_CONFIG = {
    netflix: {
        features: {
            skipTitleSequences: true,
            autoPlayNext: true,
            alwaysWatchCredits: true,
            hidePromotedVideos: true,
            dontPromptStillThere: true,
            dontMinimizeEndCredits: true,
            hideDownvotedContent: true
        }
    },
    disney: {
        features: {
            skipTitleSequences: true,
            autoPlayNext: true,
            alwaysWatchCredits: false,
            hidePromotedVideos: false,
            dontPromptStillThere: true,
            dontMinimizeEndCredits: false,
            hideDownvotedContent: false
        }
    }
};