// EndlessFlix Popup Script - Vanilla JavaScript Version
// Cross-browser compatibility layer
const browserType = (() => {
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
    loadOptions(function(receivedOptions) {
        options = receivedOptions;
        
        // Set checkbox states based on loaded options
        setCheckboxState('skipTitleSequences', options.skipTitleSequence);
        setCheckboxState('autoPlayNext', options.autoPlayNext);
        setCheckboxState('alwaysWatchCredits', options.watchCredits);
        setCheckboxState('hidePromotedVideos', options.disableAutoPlayOnBrowse);
        setCheckboxState('dontPromptStillThere', options.skipStillHere);
        setCheckboxState('dontMinimizeEndCredits', options.dontMinimzeEndCreditsOfShow);
        setCheckboxState('hideDownvotedContent', options.hideDisliked);
        
        setupEventListeners();
        reloadSearchLibrary();
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
            browserType.tabs.create({ url: 'https://www.github.com/jeed2424/EndlessFlix' });
        });
    }
    
    if (sourceButton) {
        sourceButton.addEventListener('click', function() {
            browserType.tabs.create({ url: 'https://www.github.com/jeed2424/EndlessFlix' });
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
        browserType.storage.sync.set({ 'options': options }, function() {
            if (browserType.runtime.lastError) {
                console.warn('Error saving options:', browserType.runtime.lastError);
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
                if (browserType.runtime.lastError) {
                    reject(browserType.runtime.lastError);
                    return;
                }
                
                // Give time for async errors to surface
                setTimeout(() => {
                    if (browserType.runtime.lastError) {
                        reject(browserType.runtime.lastError);
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
    fetch(browserType.runtime.getURL('../data/genres.json'))
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