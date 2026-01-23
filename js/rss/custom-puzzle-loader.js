// Custom Puzzle Loader - Load puzzles from URL parameters
// Allows users to share custom puzzles via compressed URL links

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {always:true}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('custom-puzzle-loader', message, options);
    } else {
        console.log('[custom-puzzle-loader]', message);
    }
}

// State
let customPuzzleData = null;
let isCustomPuzzleMode = false;
let cachedHeadlineObject = null; // Cache the headline object to avoid re-processing

/**
 * Check if URL contains custom puzzle parameter
 * @returns {boolean} True if custom puzzle parameter exists
 */
function checkForCustomPuzzle() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('p');
}

/**
 * Load and decode custom puzzle from URL
 * @returns {Object|null} Decoded puzzle data or null if invalid
 */
function loadCustomPuzzle() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const compressed = urlParams.get('p');
        
        if (!compressed) {
            _log('No custom puzzle parameter found');
            return null;
        }
        
        _log('Loading custom puzzle from URL...');
        
        // Decompress using LZ-String
        if (typeof LZString === 'undefined') {
            console.error('LZString library not loaded');
            showCustomPuzzleError('Failed to load puzzle decoder');
            return null;
        }
        
        const jsonString = LZString.decompressFromEncodedURIComponent(compressed);
        
        if (!jsonString) {
            console.error('Failed to decompress puzzle data');
            showCustomPuzzleError('Invalid or corrupted puzzle link');
            return null;
        }
        
        // Parse JSON
        const puzzleData = JSON.parse(jsonString);
        
        // Validate structure
        if (!puzzleData.h || !puzzleData.d || !puzzleData.l) {
            console.error('Invalid puzzle data structure:', puzzleData);
            showCustomPuzzleError('Invalid puzzle data format');
            return null;
        }
        
        // Validate language
        if (puzzleData.l !== 'en' && puzzleData.l !== 'ru' && puzzleData.l !== 'pt') {
            console.error('Invalid language:', puzzleData.l);
            showCustomPuzzleError('Unsupported language in puzzle');
            return null;
        }
        
        // Extract and validate difficulty (optional field)
        let customDifficulty = null;
        if (puzzleData.dfc) {
            // Check if difficulty is valid
            if (typeof difficultySettings !== 'undefined' && difficultySettings[puzzleData.dfc]) {
                customDifficulty = puzzleData.dfc;
                _log(`Custom puzzle difficulty: ${customDifficulty}`);
            } else {
                _log(`Invalid difficulty '${puzzleData.dfc}' in custom puzzle, will use default`);
            }
        }
        
        _log(`✅ Successfully loaded custom puzzle (${puzzleData.l})`);
        
        customPuzzleData = puzzleData;
        isCustomPuzzleMode = true;
        
        return puzzleData;
        
    } catch (error) {
        console.error('Error loading custom puzzle:', error);
        showCustomPuzzleError('Failed to load puzzle: ' + error.message);
        return null;
    }
}

/**
 * Create headline object from custom puzzle data
 * @param {Object} puzzleData - Decoded puzzle data
 * @returns {Object} Headline object compatible with game
 */
function createCustomHeadlineObject(puzzleData) {
    // Split headline into words
    const words = puzzleData.h.split(/\s+/).filter(w => w.length > 0);
    
    // Extract and validate difficulty
    let customDifficulty = null;
    if (puzzleData.dfc && typeof difficultySettings !== 'undefined' && difficultySettings[puzzleData.dfc]) {
        customDifficulty = puzzleData.dfc;
    }
    
    return {
        text: puzzleData.h,
        words: words,
        description: puzzleData.d,
        language: puzzleData.l,
        customDifficulty: customDifficulty, // Custom difficulty from URL (null if not specified/invalid)
        link: null, // Custom puzzles don't have article links
        source: 'custom',
        sourceName: 'Custom Puzzle',
        category: 'custom',
        pubDate: new Date().toISOString(),
        djb2Hash: null, // No hash for custom puzzles
        isCustomPuzzle: true
    };
}

/**
 * Clear custom puzzle URL parameters
 */
function clearCustomPuzzleURL() {
    const url = new URL(window.location.href);
    const originalUrl = url.toString();
    url.searchParams.delete('p');
    const newUrl = url.toString();
    _log(`URL change: ${originalUrl} -> ${newUrl}`);
    window.history.replaceState({}, '', newUrl);
    isCustomPuzzleMode = false;
    customPuzzleData = null;
    cachedHeadlineObject = null; // Clear cache
    _log(`Cleared custom puzzle URL parameters: ${originalUrl} -> ${newUrl}`);
}

/**
 * Show error popup for custom puzzle loading failures
 * @param {string} errorMessage - Error message to display (logged to console only)
 */
function showCustomPuzzleError(errorMessage) {
    // Use the popup system if available
    if (typeof showPopup === 'function' && typeof t === 'function') {
        const popupOptions = {
            type: 'error',
            closeOnBackdrop: false,
            title: t('puzzleError.title'),
            content: `<p style="line-height: 1.6;">${t('puzzleError.corruptedLink')}</p>`,
            buttons: [
                {
                    text: t('puzzleError.startRegularGame'),
                    className: 'btn-primary',
                    action: () => {
                        if (typeof skipToNextHeadline === 'function') {
                            skipToNextHeadline();
                        } else {
                            clearCustomPuzzleURL();
                            window.location.reload();
                        }
                    }
                }
            ]
        };
        
        showPopup(popupOptions);
    } else {
        // Fallback to alert
        alert(t('puzzleError.corruptedLink'));
        clearCustomPuzzleURL();
        window.location.reload();
    }
}

/**
 * Initialize custom puzzle if present
 * @returns {Object|null} Custom headline object or null
 */
async function initializeCustomPuzzle() {
    // Return cached version if already initialized
    if (cachedHeadlineObject) {
        _log('Returning cached custom puzzle headline');
        return cachedHeadlineObject;
    }
    
    if (!checkForCustomPuzzle()) {
        return null;
    }
    
    const puzzleData = loadCustomPuzzle();
    
    if (!puzzleData) {
        return null;
    }
    
    // Set temporary language if player has no saved preference
    // IMPORTANT: Do this BEFORE returning so language is set before tutorial checks
    if (typeof Platform !== 'undefined' && Platform.isAvailable()) {
        try {
            const savedLanguage = await Platform.loadGameLanguage();
            
            if (!savedLanguage) {
                // No saved language - use puzzle language and save it
                _log(`Setting language to: ${puzzleData.l}`);
                
                // Use setLanguage to properly set and save the language
                if (typeof i18n !== 'undefined' && i18n.currentLanguage !== puzzleData.l) {
                    await i18n.setLanguage(puzzleData.l);
                    
                    _log(`Language set and saved to: ${puzzleData.l}`);
                    
                    // Dispatch event so tutorial can update its language
                    window.dispatchEvent(new CustomEvent('headlines:customPuzzle:languageChanged', {
                        detail: { language: puzzleData.l }
                    }));
                }
            } else {
                _log(`Player has saved language (${savedLanguage}), keeping it`);
            }
        } catch (error) {
            console.error('Error checking saved language:', error);
        }
    }
    
    // Create and cache the headline object
    cachedHeadlineObject = createCustomHeadlineObject(puzzleData);
    return cachedHeadlineObject;
}

/**
 * Check if currently in custom puzzle mode
 * @returns {boolean}
 */
function isInCustomPuzzleMode() {
    return isCustomPuzzleMode;
}

/**
 * Get current custom puzzle data
 * @returns {Object|null}
 */
function getCustomPuzzleData() {
    return customPuzzleData;
}

// Expose functions globally
window.CustomPuzzleLoader = {
    checkForCustomPuzzle,
    loadCustomPuzzle,
    createCustomHeadlineObject,
    clearCustomPuzzleURL,
    initializeCustomPuzzle,
    isInCustomPuzzleMode,
    getCustomPuzzleData
};

})();
