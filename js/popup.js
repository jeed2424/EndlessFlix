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
        console.log('📥 Received options from loadOptions:', JSON.stringify(receivedOptions, null, 2));
        
        options = receivedOptions;
        
        // Load extension enabled state (default to true if not set)
        // Make sure to handle undefined/null cases properly
        if (options.hasOwnProperty('extensionEnabled')) {
            isExtensionEnabled = options.extensionEnabled;
            console.log('✅ Found extensionEnabled in options:', isExtensionEnabled);
        } else {
            isExtensionEnabled = true; // Default to enabled
            options.extensionEnabled = true; // Set it in options object
            console.log('⚠️ extensionEnabled not found, defaulting to:', isExtensionEnabled);
        }
        
        console.log('🎯 Final extension state:', isExtensionEnabled);
        console.log('🎯 Final options object:', JSON.stringify(options, null, 2));
        
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
        
        // Add debugging before the timeout
        console.log('⏰ About to call setupEventListeners in 100ms...');
        
        // Delay setupEventListeners to ensure i18n processing is complete
        setTimeout(() => {
            console.log('⏰ Timeout fired, calling setupEventListeners now...');
            
            // DIRECT TEST - add manual event listeners to verify elements work
            console.log('🧪 TESTING: Adding direct event listeners');
            
            const testToggle = document.querySelector('[data-state="on"]');
            const testDropdown = document.getElementById('platformCurrent');
            
            console.log('🧪 Test toggle element:', testToggle);
            console.log('🧪 Test dropdown element:', testDropdown);
            
            if (testToggle) {
                testToggle.addEventListener('click', function() {
                    console.log('🧪 DIRECT TEST: Toggle clicked!');
                });
                console.log('✅ Direct toggle listener attached');
            }
            
            if (testDropdown) {
                testDropdown.addEventListener('click', function() {
                    console.log('🧪 DIRECT TEST: Dropdown clicked!');
                });
                console.log('✅ Direct dropdown listener attached');
            }
            
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
        optionsList.classList.remove('disabled');
        searchContainer.classList.remove('disabled');
        console.log('Options enabled (removed disabled class)');
    } else {
        optionsList.classList.add('disabled');
        searchContainer.classList.add('disabled');
        console.log('Options disabled (added disabled class)');
    }
}

// Platform dropdown functions
function togglePlatformDropdown() {
    const platformSelector = document.getElementById('platformSelector');
    const platformDropdown = document.getElementById('platformDropdown');
    
    if (platformDropdown.classList.contains('hidden')) {
        platformDropdown.classList.remove('hidden');
        platformSelector.classList.add('open');
    } else {
        platformDropdown.classList.add('hidden');
        platformSelector.classList.remove('open');
    }
}

function closePlatformDropdown() {
    const platformSelector = document.getElementById('platformSelector');
    const platformDropdown = document.getElementById('platformDropdown');
    
    platformDropdown.classList.add('hidden');
    platformSelector.classList.remove('open');
}

function selectPlatform(platformKey) {
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
    document.querySelector(`[data-platform="${platformKey}"]`).classList.add('active');
    
    // Update current platform variable
    currentPlatform = platformKey;
    
    // Close dropdown
    closePlatformDropdown();
    
    console.log('Platform changed to:', platform.name);
    
    // TODO: Load platform-specific options here
    // loadPlatformOptions(platformKey);
}

// Setup all event listeners
function setupEventListeners() {
    // Checkbox click handlers
    const checkboxes = document.querySelectorAll('.checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            changeOption(this);
        });
    });

    // Option text click handlers (for accessibility)
    const optionTexts = document.querySelectorAll('.option-text');
    optionTexts.forEach(text => {
        text.addEventListener('click', function() {
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
            // Remove active from all options
            toggleOptions.forEach(opt => opt.classList.remove('active'));
            // Add active to clicked option
            this.classList.add('active');
        });
    });

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
}

// Handle option changes
function changeOption(elem) {
    const optionName = elem.getAttribute('data-option');
    const isCurrentlyChecked = elem.classList.contains('checked');
    const newState = !isCurrentlyChecked;
    
    // Update the global options object first
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
    
    // Handle mutual exclusivity - ONLY when ENABLING (checking) an option
    if (mappedName === 'autoPlayNext' && newState === true) {
        options.autoPlayNext = true;
        if (options.watchCredits === true) {
            options.watchCredits = false;
            setCheckboxState('alwaysWatchCredits', false);
        }
    } else if (mappedName === 'watchCredits' && newState === true) {
        options.watchCredits = true;
        if (options.autoPlayNext === true) {
            options.autoPlayNext = false;
            setCheckboxState('autoPlayNext', false);
        }
    } else {
        // For all other cases (including disabling), just update the option normally
        options[mappedName] = newState;
    }
    
    // Set the visual state of the clicked checkbox to match the options value
    setCheckboxState(optionName, options[mappedName]);
    
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