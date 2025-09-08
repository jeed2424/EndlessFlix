// EndlessFlix Popup Script - Vanilla JavaScript Version
// Cross-browser compatibility layer for popup
const popupBrowserAPI = (() => {
    if (typeof browser !== 'undefined') {
        return browser; // Firefox
    } else if (typeof chrome !== 'undefined') {
        return chrome; // Chrome
    } else {
        throw new Error('Extension API not available');
    }
})();

let options = {};
let isExtensionEnabled = true;
let currentPlatform = 'netflix';
let currentTab = null;
let originalOptions = {};

// Platform definitions
const PLATFORMS = {
    netflix: {
        name: 'Netflix',
        icon: '📺'
    },
    disney: {
        name: 'Disney+',
        icon: '🏰'
    }
};

// Platform-specific feature support
const PLATFORM_FEATURES = {
    netflix: {
        skipTitleSequence: true,
        autoPlayNext: true,
        watchCredits: true,
        disableAutoPlayOnBrowse: true,
        skipStillHere: true,  // Netflix has "still watching?" prompt
        dontMinimzeEndCreditsOfShow: true,
        hideDisliked: true
    },
    disney: {
        skipTitleSequence: true,
        autoPlayNext: true,
        watchCredits: true,
        disableAutoPlayOnBrowse: false,  // Disney+ doesn't have this
        skipStillHere: false,  // Disney+ doesn't ask "still watching?"
        dontMinimzeEndCreditsOfShow: false,  // Different UI
        hideDisliked: false  // Disney+ uses different rating system
    }
};

// Global error handlers for unhandled Promise rejections
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && (
        (event.reason.message && event.reason.message.includes('Could not establish connection')) ||
        (event.reason.message && event.reason.message.includes('Receiving end does not exist')) ||
        (event.reason.toString && event.reason.toString().includes('Could not establish connection')) ||
        (event.reason.toString && event.reason.toString().includes('Receiving end does not exist'))
    )) {
        // Silently handle Chrome extension messaging error
        event.preventDefault(); // Prevent the error from showing in console
        return;
    }
    // For other errors, log them normally
    console.log('🚨 Unhandled Promise rejection:', event.reason);
});

window.addEventListener('error', function(event) {
    if (event.error && (
        (event.error.message && event.error.message.includes('Could not establish connection')) ||
        (event.error.message && event.error.message.includes('Receiving end does not exist'))
    )) {
        // Silently handle Chrome extension messaging error
        event.preventDefault();
        return;
    }
    // For other errors, log them normally
    console.log('🚨 Global error:', event.error);
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Popup loading...');
    
    loadOptions(function(receivedOptions) {
        console.log('🔥 Received options from loadOptions:', JSON.stringify(receivedOptions, null, 2));
        
        options = receivedOptions;
        originalOptions = JSON.parse(JSON.stringify(receivedOptions));
        // Load extension enabled state per platform
        if (!options.platformStates) {
            options.platformStates = {};
        }

        if (!options.platformSettings) {
            options.platformSettings = {};
        }
        
        // Initialize platform states if not exists
        Object.keys(PLATFORMS).forEach(platform => {
            if (!options.platformSettings[platform]) {
                options.platformSettings[platform] = {
                    skipTitleSequence: true,
                    autoPlayNext: true,
                    watchCredits: false,
                    disableAutoPlayOnBrowse: false,
                    skipStillHere: true,
                    dontMinimzeEndCreditsOfShow: false,
                    hideDisliked: false
                };
            }
        });

        updateOptionsForPlatform(currentPlatform);
        
        // Get current platform state
        isExtensionEnabled = options.platformStates[currentPlatform] !== false;
        
        console.log('✅ Platform states:', options.platformStates);
        console.log('🎯 Current platform:', currentPlatform);
        console.log('🎯 Current platform enabled:', isExtensionEnabled);
        
        // Set checkbox states based on loaded options
        setCheckboxState('skipTitleSequences', options.skipTitleSequence);
        setCheckboxState('autoPlayNext', options.autoPlayNext);
        setCheckboxState('alwaysWatchCredits', options.watchCredits);
        setCheckboxState('hidePromotedVideos', options.disableAutoPlayOnBrowse);
        setCheckboxState('dontPromptStillThere', options.skipStillHere);
        setCheckboxState('dontMinimizeEndCredits', options.dontMinimzeEndCreditsOfShow);
        setCheckboxState('hideDownvotedContent', options.hideDisliked);
        
        // Set toggle state and update UI
        updateToggleState();
        updateOptionsAvailability();
        checkCurrentTab();
        
        // Add debugging before the timeout
        console.log('⏰ About to call setupEventListeners in 100ms...');
        
        // Delay setupEventListeners to ensure i18n processing is complete
        setTimeout(() => {
            console.log('⏰ Timeout fired, calling setupEventListeners now...');
            
            try {
                setupEventListeners();
                console.log('✅ setupEventListeners completed');
            } catch (error) {
                console.error('❌ Error in setupEventListeners:', error);
            }
            
            try {
                reloadSearchLibrary();
                console.log('✅ reloadSearchLibrary completed');
            } catch (error) {
                console.error('❌ Error in reloadSearchLibrary:', error);
            }
        }, 100);
    });
});

// Load options from storage
function loadOptions(callback) {
    try {
        popupBrowserAPI.storage.sync.get(['options'], function(result) {
            if (popupBrowserAPI.runtime.lastError) {
                console.warn('Error loading options:', popupBrowserAPI.runtime.lastError);
                callback({});
                return;
            }
            
            const loadedOptions = result.options || {};
            console.log('Loaded options from storage:', loadedOptions);
            callback(loadedOptions);
        });
    } catch (error) {
        console.error('Error in loadOptions:', error);
        callback({});
    }
}

// Set checkbox state visually
function setCheckboxState(checkboxId, isChecked) {
    const checkbox = document.querySelector(`[data-option="${checkboxId}"]`);
    if (checkbox) {
        if (isChecked) {
            checkbox.classList.add('checked');
        } else {
            checkbox.classList.remove('checked');
        }
    }
}

// Update toggle switch visual state
function updateToggleState() {
    console.log('Updating toggle state to:', isExtensionEnabled);
    const toggleOptions = document.querySelectorAll('.toggle-option');
    toggleOptions.forEach(option => {
        option.classList.remove('active');
    });
    
    if (isExtensionEnabled) {
        const onButton = document.querySelector('.toggle-option[data-state="on"]');
        if (onButton) {
            onButton.classList.add('active');
            console.log('Set ON button as active');
        }
    } else {
        const offButton = document.querySelector('.toggle-option[data-state="off"]');
        if (offButton) {
            offButton.classList.add('active');
            console.log('Set OFF button as active');
        }
    }
}

// Enable/disable options based on extension state
function updateOptionsAvailability() {
    console.log('Updating options availability, enabled:', isExtensionEnabled);
    const optionsList = document.querySelector('.options-list');
    const searchContainer = document.querySelector('.search-container');
    
    if (isExtensionEnabled) {
        optionsList.style.opacity = '1';
        optionsList.style.pointerEvents = 'auto';
        searchContainer.style.opacity = '1';
        searchContainer.style.pointerEvents = 'auto';
        console.log('Options enabled');
    } else {
        optionsList.style.opacity = '0.4';
        optionsList.style.pointerEvents = 'none';
        searchContainer.style.opacity = '0.4';
        searchContainer.style.pointerEvents = 'none';
        console.log('Options disabled (greyed out)');
    }
}

function updateOptionsForPlatform(platform) {
    const features = PLATFORM_FEATURES[platform];
    if (!features) return;
    
    // Hide/show options based on platform support
    const optionMappings = [
        { element: 'skipTitleSequences', feature: 'skipTitleSequence' },
        { element: 'autoPlayNext', feature: 'autoPlayNext' },
        { element: 'alwaysWatchCredits', feature: 'watchCredits' },
        { element: 'hidePromotedVideos', feature: 'disableAutoPlayOnBrowse' },
        { element: 'dontPromptStillThere', feature: 'skipStillHere' },
        { element: 'dontMinimizeEndCredits', feature: 'dontMinimzeEndCreditsOfShow' },
        { element: 'hideDownvotedContent', feature: 'hideDisliked' }
    ];
    
    optionMappings.forEach(({ element, feature }) => {
        const optionItem = document.querySelector(`[data-option="${element}"]`).closest('.option-item');
        if (optionItem) {
            if (features[feature]) {
                optionItem.style.display = 'flex';
                // Load platform-specific setting
                const platformSettings = options.platformSettings[platform];
                setCheckboxState(element, platformSettings[feature]);
            } else {
                optionItem.style.display = 'none';
            }
        }
    });
}

// Platform dropdown functions
function togglePlatformDropdown() {
    const platformSelector = document.getElementById('platformSelector');
    const platformDropdown = document.getElementById('platformDropdown');
    
    console.log('Toggle dropdown called');
    
    if (platformDropdown.classList.contains('hidden')) {
        platformDropdown.classList.remove('hidden');
        platformSelector.classList.add('open');
        console.log('Dropdown opened');
    } else {
        platformDropdown.classList.add('hidden');
        platformSelector.classList.remove('open');
        console.log('Dropdown closed');
    }
}

function closePlatformDropdown() {
    const platformSelector = document.getElementById('platformSelector');
    const platformDropdown = document.getElementById('platformDropdown');
    
    platformDropdown.classList.add('hidden');
    platformSelector.classList.remove('open');
}

function selectPlatform(platformKey) {
    console.log('Selecting platform:', platformKey);
    
    if (!PLATFORMS[platformKey]) return;
    
    const platform = PLATFORMS[platformKey];
    const platformCurrent = document.getElementById('platformCurrent');
    
    // Update current platform display
    platformCurrent.innerHTML = `
        <span class="platform-icon">${platform.icon}</span>
        <span class="platform-name">${platform.name}</span>
        <span class="platform-arrow">▼</span>
    `;
    
    // Update active state in dropdown
    document.querySelectorAll('.platform-option').forEach(option => {
        option.classList.remove('active');
    });
    const selectedOption = document.querySelector(`[data-platform="${platformKey}"]`);
    if (selectedOption) {
        selectedOption.classList.add('active');
    }
    
    // Update current platform variable
    currentPlatform = platformKey;
    
    // Update extension enabled state for this platform
    isExtensionEnabled = options.platformStates[currentPlatform] !== false;
    
    // Update options for this platform
    updateOptionsForPlatform(platformKey);
    
    // Update UI to reflect the new platform's state
    updateToggleState();
    updateOptionsAvailability();
    updateRefreshButtonVisibility();
    
    // Close dropdown
    closePlatformDropdown();
    
    console.log('Platform changed to:', platform.name);
}

// Setup all event listeners
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Platform dropdown handlers
    const platformCurrent = document.getElementById('platformCurrent');
    const platformOptions = document.querySelectorAll('.platform-option');
    
    if (platformCurrent) {
        platformCurrent.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Platform dropdown clicked');
            togglePlatformDropdown();
        });
        console.log('✅ Platform dropdown listener attached');
    }
    
    platformOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const platformKey = this.getAttribute('data-platform');
            console.log('Platform option clicked:', platformKey);
            selectPlatform(platformKey);
        });
    });
    console.log('✅ Platform option listeners attached');
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const platformSelector = document.getElementById('platformSelector');
        if (platformSelector && !platformSelector.contains(e.target)) {
            closePlatformDropdown();
        }
    });

    // Checkbox click handlers
    const checkboxes = document.querySelectorAll('.checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            if (!isExtensionEnabled) return; // Don't allow changes when disabled
            changeOption(this);
        });
    });

    // Option text click handlers (for accessibility)
    const optionTexts = document.querySelectorAll('.option-text');
    optionTexts.forEach(text => {
        text.addEventListener('click', function() {
            if (!isExtensionEnabled) return; // Don't allow changes when disabled
            const checkbox = this.parentElement.querySelector('.checkbox');
            if (checkbox) {
                changeOption(checkbox);
            }
        });
    });

    // Toggle switch handlers
    const toggleOptions = document.querySelectorAll('.toggle-option');
    toggleOptions.forEach(option => {
        option.addEventListener('click', function() {
            const newState = this.getAttribute('data-state') === 'on';
            console.log('Toggle clicked, new state:', newState);
            
            // Update the platform-specific state
            isExtensionEnabled = newState;
            options.platformStates[currentPlatform] = newState;
            
            // Remove active from all options
            toggleOptions.forEach(opt => opt.classList.remove('active'));
            // Add active to clicked option
            this.classList.add('active');
            
            // Update UI
            updateOptionsAvailability();
            
            // Save the changes
            saveOptions();
        });
    });
    console.log('✅ Toggle listeners attached');

    // Search input handler
    const searchInput = document.getElementById('genreSearch');
    if (searchInput) {
        searchInput.addEventListener('input', searchOnTypingListener);
    }

    // Help and Source button handlers
    const helpButton = document.getElementById('helpButton');
    const sourceButton = document.getElementById('sourceButton');
    
    if (helpButton) {
        helpButton.addEventListener('click', function() {
            popupBrowserAPI.tabs.create({ url: 'https://www.github.com/jeed2424/EndlessFlix' });
        });
    }
    
    if (sourceButton) {
        sourceButton.addEventListener('click', function() {
            popupBrowserAPI.tabs.create({ url: 'https://www.github.com/jeed2424/EndlessFlix' });
        });
    }

    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            refreshCurrentTab();
        });
    }
    
    console.log('✅ All event listeners set up');
}

    // Update the global options object first
function changeOption(elem) {
    const optionName = elem.getAttribute('data-option');
    const isCurrentlyChecked = elem.classList.contains('checked');
    const newState = !isCurrentlyChecked;
    
    const optionMap = {
        'skipTitleSequences': 'skipTitleSequence',
        'autoPlayNext': 'autoPlayNext',
        'alwaysWatchCredits': 'watchCredits',
        'hidePromotedVideos': 'disableAutoPlayOnBrowse',
        'dontPromptStillThere': 'skipStillHere',
        'dontMinimizeEndCredits': 'dontMinimzeEndCreditsOfShow',
        'hideDownvotedContent': 'hideDisliked'
    };
    
    const mappedName = optionMap[optionName] || optionName;
    
    // Update platform-specific settings
    if (!options.platformSettings[currentPlatform]) {
        options.platformSettings[currentPlatform] = {};
    }
    
    // Handle mutual exclusivity within platform
    if (mappedName === 'autoPlayNext' && newState === true) {
        options.platformSettings[currentPlatform].autoPlayNext = true;
        if (options.platformSettings[currentPlatform].watchCredits === true) {
            options.platformSettings[currentPlatform].watchCredits = false;
            setCheckboxState('alwaysWatchCredits', false);
        }
    } else if (mappedName === 'watchCredits' && newState === true) {
        options.platformSettings[currentPlatform].watchCredits = true;
        if (options.platformSettings[currentPlatform].autoPlayNext === true) {
            options.platformSettings[currentPlatform].autoPlayNext = false;
            setCheckboxState('autoPlayNext', false);
        }
    } else {
        options.platformSettings[currentPlatform][mappedName] = newState;
    }
    
    // Set the visual state
    setCheckboxState(optionName, options.platformSettings[currentPlatform][mappedName]);
    
    // Save options
    saveOptions();
}

// Save options with error handling - matches original storage structure
function saveOptions() {
    try {
        // Save to browser storage using the same structure as original
        popupBrowserAPI.storage.sync.set({ 'options': options }, function() {
            if (popupBrowserAPI.runtime.lastError) {
                console.warn('Error saving options:', popupBrowserAPI.runtime.lastError);
                return;
            }
            
            console.log('Options saved:', options);
            
            // Send options to other parts of extension with safe error handling
            safeSendOptions(options);
            updateRefreshButtonVisibility();
        });
    } catch (error) {
        console.error('Error in saveOptions:', error);
    }
}

// Helper function to handle sendOptions errors
function handleSendOptionsError(error) {
    if (error && (
        (error.message && error.message.includes('Could not establish connection')) ||
        (error.message && error.message.includes('Receiving end does not exist')) ||
        error.toString().includes('Could not establish connection') ||
        error.toString().includes('Receiving end does not exist')
    )) {
        console.log('Extension content scripts not available - options saved locally');
    } else {
        console.warn('Error sending options:', error);
    }
}

// Safe wrapper for sendOptions that handles all possible errors
async function safeSendOptions(options) {
    if (typeof sendOptions !== 'function') {
        return;
    }
    
    try {
        // Wrap in Promise to catch any async errors
        await new Promise((resolve, reject) => {
            try {
                sendOptions(options);
                
                // Check for immediate runtime errors
                if (popupBrowserAPI.runtime.lastError) {
                    reject(popupBrowserAPI.runtime.lastError);
                    return;
                }
                
                // Give time for async errors to surface
                setTimeout(() => {
                    if (popupBrowserAPI.runtime.lastError) {
                        reject(popupBrowserAPI.runtime.lastError);
                    } else {
                        resolve();
                    }
                }, 100);
                
            } catch (syncError) {
                reject(syncError);
            }
        });
        
    } catch (error) {
        handleSendOptionsError(error);
    }
}

async function checkCurrentTab() {
    try {
        const [tab] = await popupBrowserAPI.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            currentTab = {
                id: tab.id,
                url: tab.url,
                platform: null
            };
            
            // Determine platform
            if (tab.url.includes('netflix.com')) {
                currentTab.platform = 'netflix';
            } else if (tab.url.includes('disneyplus.com')) {
                currentTab.platform = 'disney';
            }
            
            updateRefreshButtonVisibility();
            return currentTab;
        }
    } catch (error) {
        console.log('Could not check current tab:', error);
        return null;
    }
}

function platformOptionsHaveChanged(platform) {
    if (!originalOptions.platformStates || !options.platformStates) {
        return false;
    }
    
    // Check platform enabled state
    const originalEnabled = originalOptions.platformStates[platform] !== false;
    const currentEnabled = options.platformStates[platform] !== false;
    
    if (originalEnabled !== currentEnabled) {
        return true;
    }
    
    // Check other settings if platform is enabled
    if (currentEnabled) {
        const relevantSettings = [
            'skipTitleSequence', 'autoPlayNext', 'watchCredits',
            'disableAutoPlayOnBrowse', 'skipStillHere', 
            'dontMinimzeEndCreditsOfShow', 'hideDisliked'
        ];
        
        for (const setting of relevantSettings) {
            if (originalOptions[setting] !== options[setting]) {
                return true;
            }
        }
    }
    
    return false;
}

function updateRefreshButtonVisibility() {
    const refreshContainer = document.getElementById('refreshContainer');
    const refreshMessage = document.getElementById('refreshMessage');
    
    if (!refreshContainer || !currentTab) return;
    
    const needsRefresh = currentTab.platform && platformOptionsHaveChanged(currentTab.platform);
    
    if (needsRefresh) {
        const platformName = currentTab.platform === 'netflix' ? 'Netflix' : 'Disney+';
        if (refreshMessage) {
            refreshMessage.textContent = `Settings changed - refresh ${platformName} to apply`;
        }
        refreshContainer.style.display = 'flex';
    } else {
        refreshContainer.style.display = 'none';
    }
}

function refreshCurrentTab() {
    if (currentTab && currentTab.platform) {
        popupBrowserAPI.tabs.reload(currentTab.id);
        originalOptions = JSON.parse(JSON.stringify(options));
        updateRefreshButtonVisibility();
        window.close();
    }
}

// Genre search functionality
let fuse;
let genreData = [];

function reloadSearchLibrary() {
    fetch(popupBrowserAPI.runtime.getURL('../data/genres.json'))
        .then(response => response.json())
        .then(data => {
            genreData = data;
            fuse = new Fuse(genreData, {
                keys: ['name'],
                threshold: 0.3,
                includeScore: true
            });
        })
        .catch(error => {
            console.warn('Could not load genres.json:', error);
        });
}

function searchOnTypingListener() {
    const searchInput = document.getElementById('genreSearch');
    const resultsContainer = document.getElementById('searchResults');
    
    if (!searchInput || !resultsContainer || !fuse) return;
    
    const query = searchInput.value.trim();
    
    if (query.length === 0) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
        return;
    }
    
    const results = fuse.search(query);
    
    if (results.length === 0) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
        return;
    }
    
    // Display results
    resultsContainer.innerHTML = '';
    results.slice(0, 5).forEach(result => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.textContent = result.item.name;
        item.addEventListener('click', function() {
            searchInput.value = result.item.name;
            resultsContainer.style.display = 'none';
        });
        resultsContainer.appendChild(item);
    });
    
    resultsContainer.style.display = 'block';
}

// Hide search results when clicking outside
document.addEventListener('click', function(event) {
    const searchContainer = document.querySelector('.search-container');
    const resultsContainer = document.getElementById('searchResults');
    
    if (searchContainer && resultsContainer && !searchContainer.contains(event.target)) {
        resultsContainer.style.display = 'none';
    }
});