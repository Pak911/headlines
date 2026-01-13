// Game Controller - Main Game Flow and State Management
// Handles game initialization, victory conditions, and overall game state

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('game-controller', message, options);
    } else {
        // Fallback if debug.js not loaded yet
        console.log('[game-controller]', message);
    }
}

// Normalize Russian Ё to Е for crossword algorithm (32-letter alphabet)
function normalizeRussianWords(words) {
    return words.map(word => word.replace(/Ё/g, 'Е').replace(/ё/g, 'е'));
}

function checkVictory() {
    // Check if all letters are in their correct positions
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter && grid[r][c].currentLetter !== grid[r][c].letter) {
                return false;
            }
        }
    }
    return true;
}

function fitGridToScreen() {
    if (!grid || !grid.length) return;

    const rows = grid.length;
    const cols = grid[0].length;

    // Configurable padding constants
    const paddingX = 30;
    const paddingY = 250;

    // Account for 1px margins between cells
    const availableWidth = window.innerWidth - paddingX - (cols - 1) * 2;
    const availableHeight = window.innerHeight - paddingY - (rows - 1) * 2;

    const maxCellWidth = Math.floor(availableWidth / cols);
    const maxCellHeight = Math.floor(availableHeight / rows);

    let newCellSize = Math.min(maxCellWidth, maxCellHeight, 56);
    newCellSize = Math.max(newCellSize, 24);

    document.documentElement.style.setProperty('--cell-size', `${newCellSize}px`);
    _log(`Resizing grid: ${cols}x${rows}. Cell size: ${newCellSize}px`);
}

// Calculate star rating based on swap count and letter count
function calculateStarRating(swapCount, letterCount) {
    const minPossibleSwaps = Math.floor(letterCount * starRatingConfig.baseMultiplier);
    
    let rating = '';
    let starCount = 0;
    
    // Check each star level from highest to lowest
    for (let stars = 5; stars >= 1; stars--) {
        const threshold = starRatingConfig.starThresholds[stars];
        const maxSwaps = threshold === Infinity ? Infinity : Math.floor(minPossibleSwaps * threshold);
        
        if (swapCount <= maxSwaps) {
            starCount = stars;
            rating = starRatingConfig.ratingLabels[stars];
            break;
        }
    }
    
    return { rating, starCount, minPossibleSwaps };
}

// Get swap thresholds for each star level
function getStarThresholds(letterCount) {
    const minPossibleSwaps = Math.floor(letterCount * starRatingConfig.baseMultiplier);
    
    const thresholds = {};
    for (let stars = 5; stars >= 1; stars--) {
        const threshold = starRatingConfig.starThresholds[stars];
        thresholds[stars] = threshold === Infinity ? Infinity : Math.floor(minPossibleSwaps * threshold);
    }
    
    return thresholds;
}

// Generate tooltip content for star hover
function generateTooltipContent(starIndex, currentStars, swapCount, letterCount) {
    const thresholds = getStarThresholds(letterCount);
    
    if (starIndex <= currentStars) {
        // Player achieved this star level
        if (currentStars === 5) {
            return t('victory.tooltips.perfect');
        } else {
            const nextStarThreshold = thresholds[currentStars + 1];
            
            // Use t() with count parameter to handle pluralization correctly
            let tooltipText = t('victory.tooltips.earned', currentStars);
            
            tooltipText = tooltipText.replace('{stars}', currentStars);
            tooltipText = tooltipText.replace('{swaps}', swapCount);
            tooltipText = tooltipText.replace('{swapsWord}', t('ui.moves', swapCount));
            tooltipText = tooltipText.replace('{nextStars}', currentStars + 1);
            tooltipText = tooltipText.replace('{threshold}', nextStarThreshold);
            tooltipText = tooltipText.replace('{thresholdWord}', t('ui.moves', nextStarThreshold));
            return tooltipText;
        }
    } else {
        // Player didn't achieve this star level
        const requiredSwaps = thresholds[starIndex];
        if (requiredSwaps === Infinity) {
            let tooltipText = t('victory.tooltips.getOneStar');
            tooltipText = tooltipText.replace('{starIndex}', starIndex);
            return tooltipText;
        } else {
            // Use t() with count parameter to handle pluralization correctly
            let tooltipText = t('victory.tooltips.getStars', starIndex);
            
            tooltipText = tooltipText.replace('{starIndex}', starIndex);
            tooltipText = tooltipText.replace('{requiredSwaps}', requiredSwaps);
            tooltipText = tooltipText.replace('{requiredSwapsWord}', t('ui.moves', requiredSwaps));
            return tooltipText;
        }
    }
}

// Add hover listeners to stars for tooltips
function addStarHoverListeners(currentStars, swapCount, letterCount) {
    const stars = document.querySelectorAll('.victory-star');
    
    stars.forEach((star, index) => {
        const starIndex = index + 1;
        
        star.addEventListener('mouseenter', function(e) {
            showStarTooltip(e.target, starIndex, currentStars, swapCount, letterCount);
        });
        
        star.addEventListener('mouseleave', function() {
            hideStarTooltip();
        });
    });
}

// Show tooltip for star
function showStarTooltip(starElement, starIndex, currentStars, swapCount, letterCount) {
    // Remove existing tooltip
    hideStarTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'star-tooltip';
    tooltip.innerHTML = generateTooltipContent(starIndex, currentStars, swapCount, letterCount);
    
    // Position tooltip
    const starRect = starElement.getBoundingClientRect();
    const tooltipWidth = 280; // Approximate width
    const tooltipHeight = 60; // Approximate height
    
    // Calculate position
    let left = starRect.left + (starRect.width / 2) - (tooltipWidth / 2);
    let top = starRect.top - tooltipHeight - 10; // 10px gap above star
    
    // Adjust if tooltip would go off screen
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) {
        left = window.innerWidth - tooltipWidth - 10;
    }
    
    // If not enough space above, show below
    if (top < 10) {
        top = starRect.bottom + 10;
        tooltip.classList.add('below');
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    
    document.body.appendChild(tooltip);
    
    // Trigger animation
    setTimeout(() => tooltip.classList.add('visible'), 10);
}

// Hide star tooltip
function hideStarTooltip() {
    const existingTooltip = document.querySelector('.star-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
}

function showVictory() {
    // Update victory modal content with localization
    const victoryTitle = document.querySelector('.victory-title');
    const victorySubtitle = document.querySelector('.victory-subtitle');
    const headlineLabel = document.querySelector('.headline-label');
    const articlePrompt = document.getElementById('articlePrompt');
    const replayBtn = document.querySelector('.btn-secondary:first-child');
    const readArticleBtn = document.querySelector('.btn-primary');
    const nextHeadlineBtn = document.querySelector('.btn-secondary:last-child');
    
    // Update stat labels
    const swapsLabel = document.querySelector('#finalSwaps').parentElement.querySelector('.stat-label');
    const ratingLabel = document.querySelector('#performanceRating').parentElement.querySelector('.stat-label');
    
    if (typeof t !== 'undefined') {
        if (victoryTitle) victoryTitle.textContent = t('victory.title');
        if (victorySubtitle) victorySubtitle.textContent = t('victory.subtitle');
        if (headlineLabel) headlineLabel.textContent = t('victory.headlineLabel');
        if (articlePrompt) articlePrompt.textContent = t('victory.articlePrompt');
        if (swapsLabel) swapsLabel.textContent = t('victory.stats.swaps', swapCount);
        if (ratingLabel) ratingLabel.textContent = t('victory.stats.rating');
        
        // Update button texts - no icons
        if (replayBtn) {
            replayBtn.textContent = t('ui.replay');
        }
        
        if (readArticleBtn) {
            readArticleBtn.textContent = t('ui.readFullArticle');
        }
        
        if (nextHeadlineBtn) {
            nextHeadlineBtn.textContent = t('ui.newHeadline');
        }
    }
    
    document.getElementById('headlineReveal').textContent = currentHeadline.text;
    document.getElementById('finalSwaps').textContent = swapCount;
    
    // Calculate performance rating using new function
    const letterCount = currentHeadline.words.reduce((sum, word) => sum + word.length, 0);
    const { rating, starCount } = calculateStarRating(swapCount, letterCount);
    
    // Get localized rating text
    let localizedRating = rating;
    if (typeof t !== 'undefined') {
        const ratingKey = rating.toLowerCase();
        localizedRating = t(`victory.ratings.${ratingKey}`) || rating;
    }
    
    document.getElementById('performanceRating').textContent = localizedRating;
    document.getElementById('articleLink').href = currentHeadline.link || '#';
    
    // Generate star display
    const starsContainer = document.getElementById('victoryStars');
    starsContainer.innerHTML = '';
    
    for (let i = 1; i <= 5; i++) {
        const starDiv = document.createElement('div');
        starDiv.className = 'victory-star' + (i <= starCount ? ' filled' : ' empty');
        starDiv.setAttribute('data-star-index', i);
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '40');
        svg.setAttribute('height', '40');
        svg.setAttribute('viewBox', '0 0 40 40');
        svg.setAttribute('fill', 'none');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M20 3L25 13L36 15L28 23L30 34L20 29L10 34L12 23L4 15L15 13L20 3Z');
        
        if (i <= starCount) {
            path.setAttribute('fill', '#FFD700');
            path.setAttribute('stroke', '#FFA500');
            starDiv.style.animationDelay = `${i * 0.1}s`;
        } else {
            path.setAttribute('fill', 'transparent');
            path.setAttribute('stroke', '#D1D5DB');
        }
        path.setAttribute('stroke-width', '2');
        
        svg.appendChild(path);
        starDiv.appendChild(svg);
        starsContainer.appendChild(starDiv);
    }
    
    // Add hover listeners for tooltips
    addStarHoverListeners(starCount, swapCount, letterCount);
    
    // Save seen headline data (solved)
    if (currentHeadline && currentHeadline.djb2Hash) {
        Platform.saveSeenHeadline(currentHeadline.djb2Hash, {
            isSolved: true,
            movesUsed: swapCount,
            link: currentHeadline.link,
            timestamp: Date.now()
        }).catch(err => {  // Cleanup enabled by default
            console.error('Failed to save seen headline data:', err);
        });

        // Dispatch puzzle solved event
        window.dispatchEvent(new CustomEvent('headlines:puzzle:solved', {
            detail: {
                puzzleHash: currentHeadline.djb2Hash,
                puzzleLink: currentHeadline.link,
                starCount: starCount
            }
        }));
    }
    
    // Switch menu item to Next Puzzle mode
    if (window.HamburgerMenu && typeof window.HamburgerMenu.switchToNextPuzzleMode === 'function') {
        window.HamburgerMenu.switchToNextPuzzleMode();
    }
    
    document.getElementById('victoryModal').style.display = 'flex';
}

// Function to close the victory modal
function closeVictoryModal() {
    document.getElementById('victoryModal').style.display = 'none';
    // Clean up any remaining tooltips
    hideStarTooltip();
}

// Function to replay the same game
function replayGame() {
    // Close the victory modal
    document.getElementById('victoryModal').style.display = 'none';
    
    // Reset swap count
    swapCount = 0;
    selectedCell = null;
    document.getElementById('swapCount').textContent = '0';
    
    // Update moves label with proper pluralization
    const movesLabel = document.querySelector('.moves-label');
    if (movesLabel && typeof t !== 'undefined') {
        movesLabel.textContent = t('ui.moves', swapCount) || 'moves';
    }
    
    // Reset completed words tracking
    if (typeof resetCompletedWords === 'function') {
        resetCompletedWords();
    }
    
    // Reset grid to the scrambled state (keep the same puzzle)
    // We need to scramble the letters again
    scrambleLetters();
    
    // Re-render the crossword
    renderCrossword();
    
    fitGridToScreen();
    
    _log('🔄 Replaying the same puzzle');
}

// Make functions globally available
window.closeVictoryModal = closeVictoryModal;
window.replayGame = replayGame;

// Enhanced game initialization with RSS headline fetching
async function enhancedInitGame() {
    const startTime = performance.now();
    
    // Reset debug info
    window.debugInfo = {
        layoutAttempts: 0,
        layoutScore: 0,
        rejectedHeadlines: [],
        alternativeHeadlines: [],
        compatibilityScores: {},
        generationTime: 0,
        variantSelection: {
            totalVariants: 0,
            topScore: 0,
            selectedIndex: 0,
            selectedScore: 0
        },
        shuffleInfo: {
            difficulty: 'medium',
            swapsPerformed: 0,
            minimumSolution: 0,
            intersectionsPreserved: 0,
            totalIntersections: 0
        }
    };
    const debugInfo = window.debugInfo; // Local reference
    
    // Reset game state
    swapCount = 0;
    selectedCell = null;
    document.getElementById('swapCount').textContent = '0';
    document.getElementById('victoryModal').style.display = 'none';
    
    // Reset menu item back to Give Up mode
    if (window.HamburgerMenu && typeof window.HamburgerMenu.switchToGiveUpMode === 'function') {
        window.HamburgerMenu.switchToGiveUpMode();
    }
    
    // Update moves label with proper pluralization
    const movesLabel = document.querySelector('.moves-label');
    if (movesLabel && typeof t !== 'undefined') {
        movesLabel.textContent = t('ui.moves', swapCount) || 'moves';
    }
    
    _log('🎮 Starting enhanced game initialization...');
    
    try {
        // Check for custom puzzle from URL before RSS initialization
        let customPuzzleHeadline = null;
        if (window.CustomPuzzleLoader && typeof window.CustomPuzzleLoader.initializeCustomPuzzle === 'function') {
            customPuzzleHeadline = await window.CustomPuzzleLoader.initializeCustomPuzzle();
        }
        
        // If custom puzzle exists, use it and skip RSS
        if (customPuzzleHeadline) {
            _log('🎯 Loading custom puzzle from URL...');
            currentHeadline = customPuzzleHeadline;
            
            // Normalize Russian Ё → Е for crossword algorithm
            const normalizedWords = normalizeRussianWords(currentHeadline.words);
            
            _log(`🎯 Attempting layout for custom puzzle: "${currentHeadline.text}" (${normalizedWords.length} words)`);
            
            // Generate crossword layout
            crosswordLayout = generateCrosswordLayout(normalizedWords);
            
            if (crosswordLayout !== null) {
                _log(`✅ Successfully generated layout for custom puzzle`);
                currentHeadline.words = normalizedWords;
                currentHeadline.text = currentHeadline.text.replace(/Ё/g, 'Е').replace(/ё/g, 'е');
            } else {
                _log(`⚠️ Failed to generate layout for custom puzzle, trying simple layout...`);
                crosswordLayout = generateSimpleLayout(normalizedWords);
                
                if (crosswordLayout && crosswordLayout.words.length === normalizedWords.length) {
                    normalizeLayout(crosswordLayout, normalizedWords);
                    currentHeadline.words = normalizedWords;
                    currentHeadline.text = currentHeadline.text.replace(/Ё/g, 'Е').replace(/ё/g, 'е');
                } else {
                    console.error('❌ Failed to generate layout for custom puzzle');
                    if (window.CustomPuzzleLoader) {
                        window.CustomPuzzleLoader.clearCustomPuzzleURL();
                    }
                    throw new Error('Failed to generate layout for custom puzzle');
                }
            }
        } else {
            // Normal RSS mode
            // Initialize the enhanced headline management system
            await initializeHeadlineManagement();
        
            // Try to generate a valid layout with enhanced headline management system
            const maxCaptionAttempts = 10;
            let captionAttempts = 0;
            
            while (captionAttempts < maxCaptionAttempts) {
                // Get next available headline using enhanced management system
                currentHeadline = await getNextHeadline();
            
                if (!currentHeadline) {
                    console.error('❌ No headlines available from enhanced system');
                    break;
                }
                
                // Use filtered words if available, otherwise fall back to original words
                const wordsToUse = currentHeadline.filteredWords || currentHeadline.words;
            
            // Normalize Russian Ё → Е for crossword algorithm
            const normalizedWords = normalizeRussianWords(wordsToUse);
            
            _log(`🎯 Attempting layout for: "${currentHeadline.filteredText || currentHeadline.text}" (${normalizedWords.length} words)`);
            
            // Generate crossword layout
            crosswordLayout = generateCrosswordLayout(normalizedWords);
            debugInfo.layoutAttempts = 'Beam search';
            
            // If layout generation succeeded, mark as used and break
            if (crosswordLayout !== null) {
                debugInfo.layoutScore = 'Generated';
                markHeadlineAsUsed(currentHeadline);
                _log(`✅ Successfully generated layout for: "${currentHeadline.filteredText || currentHeadline.text}"`);
                
                // Update currentHeadline to use normalized filtered words for the game
                if (currentHeadline.filteredWords) {
                    currentHeadline.words = normalizedWords;
                    currentHeadline.text = currentHeadline.filteredText.replace(/Ё/g, 'Е').replace(/ё/g, 'е');
                } else {
                    currentHeadline.words = normalizedWords;
                    currentHeadline.text = currentHeadline.text.replace(/Ё/g, 'Е').replace(/ё/g, 'е');
                }
                
                break;
            } else {
                // Mark as rejected and try next headline
                markHeadlineAsRejected(currentHeadline);
                debugInfo.rejectedHeadlines.push(currentHeadline.filteredText || currentHeadline.text);
                _log(`❌ Layout generation failed for: "${currentHeadline.filteredText || currentHeadline.text}"`);
            }
                
                captionAttempts++;
            }
            
            // If we still don't have a valid layout after trying multiple headlines
        if (crosswordLayout === null) {
            _log(`⚠️ Failed to generate valid layout after ${captionAttempts} attempts. Trying simple layout...`);
            
            if (currentHeadline) {
                const wordsToUse = currentHeadline.filteredWords || currentHeadline.words;
                const normalizedWords = normalizeRussianWords(wordsToUse);
                crosswordLayout = generateSimpleLayout(normalizedWords);
                
                if (crosswordLayout && crosswordLayout.words.length === normalizedWords.length) {
                    normalizeLayout(crosswordLayout, normalizedWords);
                    debugInfo.layoutScore = 'Simple layout';
                    markHeadlineAsUsed(currentHeadline);
                    _log(`✅ Simple layout succeeded for: "${currentHeadline.filteredText || currentHeadline.text}"`);
                    
                    // Update currentHeadline to use normalized words
                    if (currentHeadline.filteredWords) {
                        currentHeadline.words = normalizedWords;
                        currentHeadline.text = currentHeadline.filteredText.replace(/Ё/g, 'Е').replace(/ё/g, 'е');
                    } else {
                        currentHeadline.words = normalizedWords;
                        currentHeadline.text = currentHeadline.text.replace(/Ё/g, 'Е').replace(/ё/g, 'е');
                    }
                } else {
                    console.error('❌ Even simple layout failed');
                    markHeadlineAsRejected(currentHeadline);
                }
            }
        }
        } // End of RSS mode else block
        
        // Final fallback check (applies to both custom and RSS modes)
        if (!crosswordLayout || !currentHeadline) {
            console.error('🚨 Critical: No valid layout generated, falling back to emergency headline');
            // Use a guaranteed working headline from mock data
            currentHeadline = mockHeadlines[0];
            const normalizedWords = normalizeRussianWords(currentHeadline.words);
            crosswordLayout = generateSimpleLayout(normalizedWords);
            normalizeLayout(crosswordLayout, normalizedWords);
            currentHeadline.words = normalizedWords;
            currentHeadline.text = currentHeadline.text.replace(/Ё/g, 'Е').replace(/ё/g, 'е');
        }
        
    } catch (error) {
        console.error('❌ Error in enhanced game initialization:', error);
        
        // Emergency fallback to old system
        _log('🔄 Falling back to legacy headline system');
        currentHeadline = mockHeadlines[Math.floor(Math.random() * mockHeadlines.length)];
        const normalizedWords = normalizeRussianWords(currentHeadline.words);
        crosswordLayout = generateCrosswordLayout(normalizedWords);
        
        if (!crosswordLayout) {
            crosswordLayout = generateSimpleLayout(normalizedWords);
            normalizeLayout(crosswordLayout, normalizedWords);
        }
        currentHeadline.words = normalizedWords;
        currentHeadline.text = currentHeadline.text.replace(/Ё/g, 'Е').replace(/ё/g, 'е');
    }
    
    // Place words in grid
    grid = placeWordsInGrid(currentHeadline.words, crosswordLayout);
    correctGrid = JSON.parse(JSON.stringify(grid));
    
    // Find word connections
    findWordConnections();
    
    // Check if player has seen welcome tutorial - if not, use easy difficulty for first puzzle
    let puzzleDifficulty = currentDifficulty;
    if (typeof Platform !== 'undefined' && Platform.isAvailable() && Platform.hasSeenTutorial) {
        try {
            const hasSeenWelcome = await Platform.hasSeenTutorial('welcome');
            if (!hasSeenWelcome) {
                puzzleDifficulty = 'easy';
                _log('🎓 First-time player detected - using easy difficulty for welcome puzzle', {always: true});
            }
        } catch (error) {
            console.error('Failed to check tutorial state:', error);
        }
    }
    
    // Scramble letters using determined difficulty
    scrambleLettersByDifficulty(puzzleDifficulty);
    
    // Render the crossword
    if (typeof renderCrossword === 'function') {
        renderCrossword();
        
        fitGridToScreen();
    } else {
        console.error('renderCrossword function not available');
    }
    
    // Dispatch event that new crossword has been created and rendered
    window.dispatchEvent(new CustomEvent('headlines:newCrosswordCreated'));
    
    // Position the moves counter to avoid intersections
    setTimeout(() => {
        if (typeof positionMovesCounter === 'function') {
            positionMovesCounter();
        }
    }, 100);
    
    // Display headline description as hint
    displayHeadlineDescription();
    
    // Animate hint section appearance with CSS transitions
    setTimeout(() => {
        const crosswordContainer = document.querySelector('.crossword-container');
        const hintSection = document.querySelector('.hint-section');
        
        if (crosswordContainer && hintSection) {
            // Set the maxWidth to match crossword container
            hintSection.style.maxWidth = crosswordContainer.offsetWidth + 'px';
            
            // Set transition and trigger the fade-in animation
            hintSection.style.transition = 'opacity 400ms ease-out';
            hintSection.style.opacity = '1';
        }
    }, 200);
    
    // Update difficulty display
    updateDifficultyDisplay();
    
    // Calculate generation time
    debugInfo.generationTime = Math.round(performance.now() - startTime);
    
    _log(`🎮 Game initialization completed in ${debugInfo.generationTime}ms`);
    
    // Update debug panel if visible
    if (debugPanelVisible) {
        updateDebugInfo();
    }
}

// Keyboard event handler
document.addEventListener('keydown', function(event) {
    // Toggle debug panel with 'D' key
    if (event.key.toLowerCase() === 'd' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        // Only if not typing in an input field
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            event.preventDefault();
            toggleDebugPanel();
        }
    }
    
    // Close debug panel with Escape key
    if (event.key === 'Escape' && debugPanelVisible) {
        toggleDebugPanel();
    }
});

// Function to display headline description as hint
function displayHeadlineDescription() {
    const descriptionElement = document.getElementById('headlineDescription');
    
    if (currentHeadline && currentHeadline.description) {
        // Use HTML processor to clean the description if available
        let cleanDescription = currentHeadline.description;
        
        if (typeof window !== 'undefined' && window.HTMLProcessor) {
            // Check if description contains HTML
            if (window.HTMLProcessor.detectHTML(currentHeadline.description)) {
                _log('🔧 Processing HTML in description:', currentHeadline.description.substring(0, 100) + '...');
                cleanDescription = window.HTMLProcessor.stripHTML(currentHeadline.description);
                _log('✅ Clean description:', cleanDescription.substring(0, 100) + '...');
            }
        }
        
        // Get localized tip text
        let tipText = 'Tip:';
        if (typeof t !== 'undefined') {
            tipText = t('hints.tipPrefix').replace('💡 ', '').replace(':', '') + ':';
        }
        
        // Get source name (fallback to empty if not available)
        let sourceName = '';
        if (currentHeadline.sourceName) {
            sourceName = currentHeadline.sourceName;
        } else if (currentHeadline.source) {
            sourceName = currentHeadline.source;
        }
        
        // Get source link
        let sourceLink = '';
        if (currentHeadline.link) {
            sourceLink = currentHeadline.link;
        }
        
        // Build the hint text with optional source link
        let hintHTML = cleanDescription;
        if (sourceName) {
            if (sourceLink) {
                hintHTML += ` <a href="${sourceLink}" target="_blank" rel="noopener noreferrer">[${sourceName}]</a>`;
            } else {
                hintHTML += ` <span style="opacity: 0.7;">[${sourceName}]</span>`;
            }
        }
        
        // Set the hint text
        descriptionElement.innerHTML = hintHTML;
        
        // Initially hide the entire hint section
        const hintSection = document.querySelector('.hint-section');
        if (hintSection) {
            hintSection.style.transition = 'none';
            hintSection.style.opacity = '0';
            hintSection.style.maxWidth = '0px';
        }
        
    } else {
        // Clear the content if no description
        descriptionElement.innerHTML = '';
    }
}

// Auto-win function for debug purposes
function autoWinGame() {
    if (!currentHeadline || !grid) {
        _log('❌ No active game to auto-win');
        return;
    }
    
    _log('🏆 Auto-winning game...');
    
    // Set all letters to their correct positions
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter) {
                grid[r][c].currentLetter = grid[r][c].letter;
            }
        }
    }
    
    // Re-render the grid
    renderCrossword();
    
    fitGridToScreen();
    
    // Show victory
    showVictory();
    
    _log('✅ Auto-win completed!');
}

// Give up function - reveals solution without victory modal
async function giveUp() {
    if (!currentHeadline || !grid) {
        _log('❌ No active game to give up');
        return;
    }
    
    _log('🏳️ Giving up - revealing solution...');
    
    // Set all letters to their correct positions
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter) {
                grid[r][c].currentLetter = grid[r][c].letter;
            }
        }
    }
    
    // Re-render the grid
    renderCrossword();
    
    fitGridToScreen();
    
    // Switch menu item to Next Puzzle mode
    if (window.HamburgerMenu && typeof window.HamburgerMenu.switchToNextPuzzleMode === 'function') {
        window.HamburgerMenu.switchToNextPuzzleMode();
    }
    
    // Save seen headline data (gave up)
    if (currentHeadline && currentHeadline.djb2Hash) {
        // Check if headline was already seen before saving
        const wasAlreadySeen = await Platform.loadSeenHeadline(currentHeadline.djb2Hash);
        
        Platform.saveSeenHeadline(currentHeadline.djb2Hash, {
            isSolved: false,
            link: currentHeadline.link,
            timestamp: Date.now()
        }).catch(err => {
            console.error('Failed to save seen headline data:', err);
        });

        // Dispatch puzzle skipped event only if not previously seen
        if (!wasAlreadySeen) {
            window.dispatchEvent(new CustomEvent('headlines:puzzle:skipped', {
                detail: {
                    puzzleHash: currentHeadline.djb2Hash,
                    puzzleLink: currentHeadline.link
                }
            }));
        }
    }
    
    _log('✅ Solution revealed!');
}

// Make auto-win function globally available
window.autoWinGame = autoWinGame;
window.giveUp = giveUp;

// Expose enhancedInitGame globally
window.enhancedInitGame = enhancedInitGame;

// Skip to next headline function - saves as not solved
async function skipToNextHeadline() {
    // Check if we're in custom puzzle mode by checking URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const hasCustomParam = urlParams.has('p');
    _log('skipToNextHeadline called. Custom puzzle mode:', hasCustomParam);
    
    if (hasCustomParam) {
        _log('🔄 Exiting custom puzzle mode, returning to RSS mode...');
        
        // Clear URL parameters and reload to return to normal RSS mode
        if (window.CustomPuzzleLoader && typeof window.CustomPuzzleLoader.clearCustomPuzzleURL === 'function') {
            window.CustomPuzzleLoader.clearCustomPuzzleURL();
        }
        window.location.reload();
        return;
    }
    
    // Save seen headline data (skipped)
    if (currentHeadline && currentHeadline.djb2Hash) {
        // Check if headline was already seen before saving
        const wasAlreadySeen = await Platform.loadSeenHeadline(currentHeadline.djb2Hash);
        
        await Platform.saveSeenHeadline(currentHeadline.djb2Hash, {
            isSolved: false,
            link: currentHeadline.link,
            timestamp: Date.now()
        }).catch(err => {
            console.error('Failed to save seen headline data:', err);
        });

        // Dispatch puzzle skipped event only if not previously seen
        if (!wasAlreadySeen) {
            window.dispatchEvent(new CustomEvent('headlines:puzzle:skipped', {
                detail: {
                    puzzleHash: currentHeadline.djb2Hash,
                    puzzleLink: currentHeadline.link
                }
            }));
        }
    }
    
    // Start new game and wait for completion - call enhanced version directly
    // This will automatically reset the Give Up menu item via enhancedInitGame
    await enhancedInitGame();
}

// Expose functions needed by other files
window.checkVictory = checkVictory;
window.showVictory = showVictory;
window.displayHeadlineDescription = displayHeadlineDescription;
window.generateTooltipContent = generateTooltipContent;
window.getStarThresholds = getStarThresholds;
window.calculateStarRating = calculateStarRating;
window.skipToNextHeadline = skipToNextHeadline;

// window.addEventListener('resize', () => {
//     setTimeout(fitGridToScreen, 50);
// });

})();
