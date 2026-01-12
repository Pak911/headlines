// Main Script - Entry Point and Global State Management
// Coordinates all modules and manages global game state

// Global game state variables
let currentHeadline = null;
let crosswordLayout = null;
let grid = [];
let correctGrid = [];
let swapCount = 0;
let selectedCell = null;
let gridSize = { rows: 0, cols: 0 };
let wordConnections = {};

// Initialize toolbar buttons
function initToolbarButtons() {
    // Help button - show welcome tutorial
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
            if (window.HeadlinesTutorial && typeof window.HeadlinesTutorial.showWelcomeTutorial === 'function') {
                window.HeadlinesTutorial.showWelcomeTutorial();
            }
        });
    }
    
    // Next puzzle button
    const nextPuzzleBtn = document.getElementById('nextPuzzleBtn');
    if (nextPuzzleBtn) {
        nextPuzzleBtn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
            if (typeof skipToNextHeadline === 'function') {
                skipToNextHeadline();
            }
        });
    }
    
    // Hamburger button - opens menu
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
            if (window.HamburgerMenu && typeof window.HamburgerMenu.open === 'function') {
                window.HamburgerMenu.open();
            }
        });
    }
}

// Helper function to use flog from debug
function _log(message, options = {always:true}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('main', message, options);
    } else {
        // Fallback if debug.js not loaded yet
        console.log('[main]', message);
    }
}

// Count total filled cells and correct cells
function countCorrectCells() {
    let totalCells = 0;
    let correctCells = 0;
    
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter) {
                totalCells++;
                if (grid[r][c].letter === grid[r][c].currentLetter) {
                    correctCells++;
                }
            }
        }
    }
    
    return { totalCells, correctCells, percentage: totalCells > 0 ? (correctCells / totalCells) * 100 : 0 };
}

// Enhanced initialization that also resets word completion tracking
async function enhancedInitGameWithReset() {
    // Reset completed words tracking
    if (typeof resetCompletedWords === 'function') {
        resetCompletedWords();
    }
    
    // Call the enhanced init game
    if (typeof enhancedInitGame === 'function') {
        await enhancedInitGame();
    }
}

// Initialize language selector with current language
function initLanguageSelector() {
    if (typeof i18n !== 'undefined' && document.getElementById('languageSelect')) {
        const languageSelect = document.getElementById('languageSelect');
        languageSelect.value = i18n.currentLanguage;
    }
}

// Update page text with localized content
function updateLocalizedText() {
    if (typeof t !== 'undefined') {
        // Update main title and instructions
        const gameTitle = document.querySelector('h1');
        const gameInstructions = document.querySelector('.instructions');
        
        if (gameTitle) {
            gameTitle.textContent = t('game.title');
        }
        
        if (gameInstructions) {
            gameInstructions.innerHTML = t('game.instructions');
        }
        
        // Update swap counter label (now in moves counter circle)
        const swapCounter = document.querySelector('.swap-counter');
        if (swapCounter) {
            const currentSwaps = document.getElementById('swapCount').textContent;
            swapCounter.innerHTML = `${t('ui.swaps')}: <span id="swapCount">${currentSwaps}</span>`;
        }
        
        // Update moves label in the new circle counter
        const movesLabel = document.querySelector('.moves-label');
        if (movesLabel) {
            movesLabel.textContent = t('ui.moves', swapCount) || 'moves';
        }
        
        // Update hint title
        const hintTitle = document.getElementById('hintTitle');
        if (hintTitle) {
            hintTitle.textContent = t('hints.hintTitle') || 'News Description';
        }
        
        // Update next headline button (new location)
        const nextHeadlineBtn = document.querySelector('.next-headline-btn');
        if (nextHeadlineBtn) {
            nextHeadlineBtn.textContent = t('ui.nextHeadline');
        }
        
        // Update give up button
        const giveUpBtn = document.querySelector('.give-up-btn');
        if (giveUpBtn) {
            giveUpBtn.textContent = t('ui.giveUp');
        }
        
        // Update old button location for compatibility
        const oldNextHeadlineBtn = document.querySelector('.new-game-btn-header');
        if (oldNextHeadlineBtn) {
            oldNextHeadlineBtn.textContent = t('ui.nextHeadline');
        }
        
        // Update victory modal stat labels if modal exists
        const finalSwaps = document.getElementById('finalSwaps');
        if (finalSwaps) {
            const swapCount = parseInt(finalSwaps.textContent) || 0;
            const swapsLabel = finalSwaps.parentElement.querySelector('.stat-label');
            const ratingLabel = document.querySelector('#performanceRating')?.parentElement.querySelector('.stat-label');
            
            if (swapsLabel) swapsLabel.textContent = t('victory.stats.swaps', swapCount);
            if (ratingLabel) ratingLabel.textContent = t('victory.stats.rating');
        }
        
        // Update color legend text
        const legendItems = document.querySelectorAll('.legend-item .legend-text');
        if (legendItems.length >= 4) {
            legendItems[0].textContent = t('legend.correct');
            legendItems[1].textContent = t('legend.wrongPosition');
            legendItems[2].textContent = t('legend.connectedWord');
            legendItems[3].textContent = t('legend.otherWord');
        }
        
        // Check legend height after a short delay and switch to shorter translations if needed
        setTimeout(() => {
            const colorLegend = document.querySelector('.color-legend');
            if (colorLegend) {
                const legendHeight = colorLegend.offsetHeight;
                if (legendHeight > 110 && legendItems.length >= 4) {
                    // Switch to shorter translations
                    legendItems[0].textContent = t('legend.correctShort');
                    legendItems[1].textContent = t('legend.wrongPositionShort');
                    legendItems[2].textContent = t('legend.connectedWordShort');
                    legendItems[3].textContent = t('legend.otherWordShort');
                }
            }
        }, 100);
        
        // Update debug panel text
        const debugToggleHint = document.querySelector('.debug-toggle-hint small');
        if (debugToggleHint) {
            debugToggleHint.textContent = t('debug.toggleHint');
        }
        
        // Update headline description tip prefix
        const descriptionElement = document.getElementById('headlineDescription');
        if (descriptionElement) {
            const tipPrefix = t('hints.tipPrefix').replace('💡 ', '').replace(':', '');
            descriptionElement.setAttribute('data-tip-prefix', tipPrefix);
        }
        
        // Update toolbar button tooltips
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        if (hamburgerBtn) {
            hamburgerBtn.setAttribute('title', t('toolbar.menu'));
        }
        
        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.setAttribute('title', t('toolbar.howToPlay'));
        }
        
        const nextPuzzleBtn = document.getElementById('nextPuzzleBtn');
        if (nextPuzzleBtn) {
            nextPuzzleBtn.setAttribute('title', t('toolbar.nextPuzzle'));
        }
        
        // Update menu language
        if (window.HamburgerMenu && typeof window.HamburgerMenu.updateLanguage === 'function') {
            window.HamburgerMenu.updateLanguage();
        }
    }
}

// Initialize difficulty selector with current difficulty from data.js
function initDifficultySelector() {
    if (typeof currentDifficulty !== 'undefined' && document.getElementById('difficultySelect')) {
        const difficultySelect = document.getElementById('difficultySelect');
        difficultySelect.value = currentDifficulty;
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Add sound effects for UI button clicks
    document.addEventListener('click', function(event) {
        if (event.target.tagName === 'BUTTON') {
            window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
        }
    });

    // Initialize platform first
    if (typeof Platform !== 'undefined') {
        _log('Initializing platform...');
        const platformResult = await Platform.init();
        if (!platformResult.success) {
            console.error('Platform initialization failed:', platformResult.error);
        } else {
            _log('Platform initialized successfully');
            // Signal that platform is ready
            window.dispatchEvent(new CustomEvent('headlines:platform:ready'));
        }
    } else {
        console.error('[Main] Platform object not found');
    }
    
    // Initialize localization
    if (typeof i18n !== 'undefined' && typeof i18n.init === 'function') {
        await i18n.init();
    }
    
    // Initialize difficulty system
    if (typeof initDifficultySystem === 'function') {
        await initDifficultySystem();
    }
    
    // Initialize language selector
    initLanguageSelector();
    
    // Initialize difficulty selector
    initDifficultySelector();
    
    // Initialize toolbar buttons
    initToolbarButtons();
    
    // Only initialize if we're on the main game page (not test page)
    if (document.getElementById('crosswordGrid')) {
        // Use the enhanced initialization that resets word tracking
        enhancedInitGameWithReset();
    }
});

// BUILD_RELEASE_START
// // Disable the right-click context menu
// document.addEventListener('contextmenu', function(event) {
//   event.preventDefault();
// }, false);
// 
// // Disable dragging of images and links
// document.addEventListener('dragstart', function(event) {
//   if (event.target.tagName === 'IMG' || event.target.tagName === 'A') {
//     event.preventDefault();
//   }
// }, false);
// // BUILD_RELEASE_END
