let options;
let fuse;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Handle link clicks
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.getAttribute('href')) {
            chrome.tabs.create({url: e.target.getAttribute('href')});
            e.preventDefault();
            return false;
        }
    });

    loadOptions(function (recOptions) {
        options = recOptions;
        
        // Set checkbox states based on loaded options
        setCheckboxState("chkTitleSequence", options.skipTitleSequence);
        setCheckboxState("chkPromptStillHere", options.skipStillHere);
        setCheckboxState("chkPlayNext", options.autoPlayNext);
        setCheckboxState("chkWatchCredits", options.watchCredits);
        setCheckboxState("chkDontMinimzeEndCreditsOfShow", options.dontMinimzeEndCreditsOfShow);
        setCheckboxState("chkDisAutoPlayInBrowse", options.disableAutoPlayOnBrowse);
        setCheckboxState("chkHideDownvoted", options.hideDisliked);

        // Setup event listeners
        setupEventListeners();
        
        reloadSearchLibrary();
        searchOnTypingListener();
    });
});

function setCheckboxState(checkboxId, isChecked) {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox) {
        if (isChecked) {
            checkbox.classList.add('checked');
        } else {
            checkbox.classList.remove('checked');
        }
    }
}

function setupEventListeners() {
    // Checkbox click handlers
    document.querySelectorAll('.checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            this.classList.toggle('checked');
            changeOption(this);
        });
    });

    // Label click handlers
    document.querySelectorAll('.option-text').forEach(label => {
        label.addEventListener('click', function() {
            const checkbox = this.parentElement.querySelector('.checkbox');
            if (checkbox) {
                checkbox.classList.toggle('checked');
                changeOption(checkbox);
            }
        });
    });

    // Toggle handlers
    const toggle = document.getElementById('mainToggle');
    if (toggle) {
        toggle.addEventListener('click', function(e) {
            if (e.target.classList.contains('toggle-option')) {
                document.querySelectorAll('.toggle-option').forEach(opt => opt.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    }

    // Button handlers
    const helpButton = document.getElementById('helpButton');
    const sourceButton = document.getElementById('sourceButton');
    
    if (helpButton) {
        helpButton.addEventListener('click', function() {
            chrome.tabs.create({url: 'https://www.github.com/jeed2424/EndlessFlix'});
        });
    }
    
    if (sourceButton) {
        sourceButton.addEventListener('click', function() {
            chrome.tabs.create({url: 'https://www.github.com/jeed2424/EndlessFlix'});
        });
    }
}

function changeOption(elem) {
    const isChecked = elem.classList.contains('checked');
    
    switch (elem.id) {
        case "chkTitleSequence":
            options.skipTitleSequence = isChecked;
            break;
        case "chkPlayNext":
            options.autoPlayNext = isChecked;
            if (options.autoPlayNext && options.watchCredits) {
                options.watchCredits = false;
                setCheckboxState('chkWatchCredits', false);
            }
            break;
        case "chkPromptStillHere":
            options.skipStillHere = isChecked;
            break;
        case "chkDisAutoPlayInBrowse":
            options.disableAutoPlayOnBrowse = isChecked;
            break;
        case "chkDontMinimzeEndCreditsOfShow":
            options.dontMinimzeEndCreditsOfShow = isChecked;
            break;
        case "chkWatchCredits":
            options.watchCredits = isChecked;
            if (options.autoPlayNext && options.watchCredits) {
                options.autoPlayNext = false;
                setCheckboxState('chkPlayNext', false);
            }
            break;
        case "chkHideDownvoted":
            options.hideDisliked = isChecked;
            break;
    }
    saveOptions();
}

function constructResultDiv(elem) {
    return `<div class='entry'><a href="${elem.link}">${elem.genre}</a></div>`;
}

function reloadSearchLibrary() {
    fetch(chrome.runtime.getURL("data/genres.json"))
        .then(response => response.json())
        .then(data => {
            let fuseOptions = {
                shouldSort: true,
                threshold: 0.6,
                location: 0,
                distance: 100,
                maxPatternLength: 32,
                minMatchCharLength: 1,
                keys: ["genre"]
            };
            fuse = new Fuse(data, fuseOptions);
        })
        .catch(error => {
            console.error('Error loading genres:', error);
        });
}

function searchOnTypingListener() {
    const genreSearch = document.getElementById('genreSearch');
    const results = document.getElementById('results');
    
    if (!genreSearch || !results) return;
    
    genreSearch.addEventListener('keyup', function() {
        results.innerHTML = "";
        
        if (this.value.trim() === '') {
            results.classList.add('hide');
            return;
        }
        
        if (fuse) {
            let searchResults = fuse.search(this.value);
            if (searchResults.length) {
                let max = searchResults.length < 100 ? searchResults.length : 100;
                let entry = "";
                for (let i = 0; i < max; i++) {
                    entry += constructResultDiv(searchResults[i]);
                }
                results.innerHTML = entry;
                results.classList.remove('hide');
            } else {
                results.classList.add('hide');
            }
        } else {
            results.innerHTML = "<div class='entry'>Genres not loaded! Contact developer if issue persists.</div>";
            results.classList.remove('hide');
        }
    });

    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        if (!genreSearch.contains(e.target) && !results.contains(e.target)) {
            results.classList.add('hide');
        }
    });
}

function saveOptions() {
    console.log('Saving options:', options);
    chrome.storage.sync.set({
        'options': options
    }, () => {
        sendOptions(options);
    });
}