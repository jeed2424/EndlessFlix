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

// Netflix tab detection and refresh functionality
let isNetflixTab = false;
let currentTabId = null;
let hasUnsavedChanges = false;
let originalOptions = {}; // Store original options to compare against

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

// Check if current tab is Netflix
async function checkIfNetflixTab() {
    try {
        const [tab] = await popupBrowserAPI.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            currentTabId = tab.id;
            isNetflixTab = tab.url.includes('netflix.com');
            console.log('Current tab is Netflix:', isNetflixTab, 'URL:', tab.url);
            
            // Update refresh button visibility
            updateRefreshButtonVisibility();
            return isNetflixTab;
        }
    } catch (error) {
        console.log('Could not check current tab:', error);
        return false;
    }
    return false;
}

// Function to check if current options differ from original
function optionsHaveChanged() {
    // Compare relevant settings that would require a Netflix refresh
    const relevantSettings = [
        'extensionEnabled',
        'skipTitleSequence', 
        'autoPlayNext',
        'watchCredits',
        'disableAutoPlayOnBrowse',
        'skipStillHere',
        'dontMinimzeEndCreditsOfShow',
        'hideDisliked'
    ];
    
    for (const setting of relevantSettings) {
        if (originalOptions[setting] !== options[setting]) {
            console.log(`Setting changed: ${setting} from ${originalOptions[setting]} to ${options[setting]}`);
            return true;
        }
    }
    
    console.log('No relevant settings have changed from original');
    return false;
}

// Function to show/hide refresh button based on Netflix tab and actual changes
function updateRefreshButtonVisibility() {
    const refreshContainer = document.getElementById('refreshContainer');
    if (!refreshContainer) return;
    
    const actuallyNeedsRefresh = isNetflixTab && optionsHaveChanged();
    
    if (actuallyNeedsRefresh) {
        refreshContainer.style.display = 'flex';
        console.log('Showing refresh button - Netflix tab with actual changes');
    } else {
        refreshContainer.style.display = 'none';
        hasUnsavedChanges = false; // Reset since no actual changes need refresh
        console.log('Hiding refresh button - no changes or not Netflix');
    }
}

// Function to refresh the Netflix tab
function refreshNetflixTab() {
    if (currentTabId && isNetflixTab) {
        popupBrowserAPI.tabs.reload(currentTabId);
        
        // Update original options to current state since we're refreshing
        originalOptions = JSON.parse(JSON.stringify(options));
        hasUnsavedChanges = false;
        updateRefreshButtonVisibility();
        console.log('Refreshed Netflix tab and updated original options');
        
        // Optional: Close popup after refresh
        window.close();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Popup loading...');
    
    // Check if current tab is Netflix
    checkIfNetflixTab();
    
    loadOptions(function(receivedOptions) {
        console.log('📥 Received options from loadOptions:', JSON.stringify(receivedOptions, null, 2));
        
        options = receivedOptions;
        
        // Store original options for comparison (deep copy)
        originalOptions = JSON.parse(JSON.stringify(options));
        console.log('💾 Stored original options for comparison:', JSON.stringify(originalOptions, null, 2));
        
        // Extension enabled state is already handled in loadOptions/common.js
        console.log('🎯 Extension state from options:', options.extensionEnabled);
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
            console.log('🧪 Direct test - toggle-option elements:', document.querySelectorAll('.toggle-option'));
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
    console.log('Updating toggle state to:', options.extensionEnabled);
    const toggleOptions = document.querySelectorAll('.toggle-option');
    toggleOptions.forEach(option => {
        option.classList.remove('active');
    });
    
    if (options.extensionEnabled) {
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
    console.log('Updating options availability, enabled:', options.extensionEnabled);
    const optionsList = document.querySelector('.options-list');
    const searchContainer = document.querySelector('.search-container');
    const body = document.body;
    
    if (options.extensionEnabled) {
        optionsList.classList.remove('disabled');
        searchContainer.classList.remove('disabled');
        body.classList.remove('extension-disabled');
        console.log('Options enabled (removed disabled class)');
    } else {
        optionsList.classList.add('disabled');
        searchContainer.classList.add('disabled');
        body.classList.add('extension-disabled');
        console.log('Options disabled (added disabled class)');
    }
}

// FIXED: Setup all event listeners
function setupEventListeners() {
    console.log('🎛️ Setting up event listeners...');
    
    // Checkbox click handlers
    const checkboxes = document.querySelectorAll('.checkbox');
    console.log('📦 Found checkboxes:', checkboxes.length);
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            changeOption(this);
        });
    });

    // Option text click handlers (for accessibility)
    const optionTexts = document.querySelectorAll('.option-text');
    console.log('📝 Found option texts:', optionTexts.length);
    optionTexts.forEach(text => {
        text.addEventListener('click', function() {
            const checkbox = this.parentElement.querySelector('.checkbox');
            if (checkbox) {
                changeOption(checkbox);
            }
        });
    });

    // FIXED: Toggle switch handlers
    const toggleOptions = document.querySelectorAll('.toggle-option');
    console.log('🔄 Found toggle options:', toggleOptions.length);
    console.log('🔄 Toggle elements:', toggleOptions);
    
    toggleOptions.forEach((option, index) => {
        console.log(`🔄 Adding listener to toggle ${index}:`, option);
        
        option.addEventListener('click', function(event) {
            console.log('🎯 Toggle clicked!', this, 'data-state:', this.getAttribute('data-state'));
            
            // Get the new state from the clicked element
            const newState = this.getAttribute('data-state') === 'on';
            console.log('🎯 New toggle state will be:', newState);
            
            // Update the options object directly
            options.extensionEnabled = newState;
            
            // Update visual state
            toggleOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            // Update options availability (enable/disable other options)
            updateOptionsAvailability();
            
            // Save the updated options
            saveOptions();
            
            console.log('✅ Toggle state updated to:', options.extensionEnabled);
            
            // Prevent event bubbling
            event.stopPropagation();
        });
    });

    // Search input handler
    const searchInput = document.getElementById('genreSearch');
    if (searchInput) {
        searchInput.addEventListener('input', searchOnTypingListener);
        console.log('🔍 Search input listener added');
    }

    // Help and Source button handlers
    const helpButton = document.getElementById('helpButton');
    const sourceButton = document.getElementById('sourceButton');
    
    if (helpButton) {
        helpButton.addEventListener('click', function() {
            popupBrowserAPI.tabs.create({ url: 'https://www.github.com/jeed2424/EndlessFlix' });
        });
        console.log('❓ Help button listener added');
    }
    
    if (sourceButton) {
        sourceButton.addEventListener('click', function() {
            popupBrowserAPI.tabs.create({ url: 'https://www.github.com/jeed2424/EndlessFlix' });
        });
        console.log('📄 Source button listener added');
    }

    // Refresh button handler
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            refreshNetflixTab();
        });
        console.log('🔄 Refresh button listener added');
    }
    
    console.log('✅ All event listeners set up successfully');
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

// Modified saveOptions function to handle Netflix refresh prompt
function saveOptions() {
    try {
        // Save to browser storage using the same structure as original
        popupBrowserAPI.storage.sync.set({ 'options': options }, function() {
            if (popupBrowserAPI.runtime.lastError) {
                console.warn('Error saving options:', popupBrowserAPI.runtime.lastError);
                return;
            }
            
            console.log('Options saved:', options);
            
            // Check if refresh button should be shown based on actual changes
            if (isNetflixTab) {
                updateRefreshButtonVisibility();
            }
            
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
            console.log('📚 Loaded genres:', genreData.length, 'genres');
            console.log('📚 Sample genre:', genreData[0]); // Debug log
            
            fuse = new Fuse(genreData, {
                keys: ['genre'], // Changed from 'name' to 'genre'
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
    
    if (!searchInput || !resultsContainer || !fuse) {
        console.log('🔍 Search components not ready:', {
            searchInput: !!searchInput,
            resultsContainer: !!resultsContainer,
            fuse: !!fuse
        });
        return;
    }
    
    const query = searchInput.value.trim();
    console.log('🔍 Searching for:', query);
    
    if (query.length === 0) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
        return;
    }
    
    const results = fuse.search(query);
    console.log('🔍 Search results:', results.length, 'matches');
    
    if (results.length === 0) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
        return;
    }
    
    // Display results
    resultsContainer.innerHTML = '';
    results.slice(0, 5).forEach((result, index) => {
        console.log(`🔍 Result ${index}:`, result.item.genre);
        
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.textContent = result.item.genre; // Changed from result.item.name
        
        item.addEventListener('click', function() {
            console.log('🔍 Genre clicked:', result.item.genre, 'Link:', result.item.link);
            
            // Set the input value
            searchInput.value = result.item.genre;
            resultsContainer.style.display = 'none';
            
            // Open the Netflix genre link in a new tab
            if (result.item.link) {
                popupBrowserAPI.tabs.create({ 
                    url: result.item.link,
                    active: true // Make the new tab active
                });
                
                // Optional: Close the popup after opening the link
                setTimeout(() => {
                    window.close();
                }, 100);
            }
        });
        
        resultsContainer.appendChild(item);
    });
    
    resultsContainer.style.display = 'block';
    console.log('🔍 Displayed', results.slice(0, 5).length, 'results');
}

// Hide search results when clicking outside
document.addEventListener('click', function(event) {
    const searchContainer = document.querySelector('.search-container');
    const resultsContainer = document.getElementById('searchResults');
    
    if (searchContainer && resultsContainer && !searchContainer.contains(event.target)) {
        resultsContainer.style.display = 'none';
    }
});