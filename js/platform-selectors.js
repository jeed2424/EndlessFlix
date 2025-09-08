const PLATFORM_SELECTORS = {
    netflix: {
        skipIntro: [
            '[aria-label="Skip Intro"]', 
            '[data-uia="player-skip-intro"]', 
            '.skip-credits > a', 
            '.watch-video--skip-content > button'
        ],
        nextEpisode: [
            '.WatchNext-autoplay', 
            '.WatchNext-still-hover-container', 
            '[aria-label^="Next episode"]', 
            '[data-uia^="next-episode-seamless-button"]', 
            '.draining'
        ],
        stillWatching: [
            '[data-uia="interrupt-autoplay-continue-watching-continue-button"]'
        ]
    }}