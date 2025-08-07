// Game Controller - Main Game Flow and State Management
// Handles game initialization, victory conditions, and overall game state

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

function showVictory() {
    document.getElementById('headlineReveal').textContent = currentHeadline.text;
    document.getElementById('finalSwaps').textContent = swapCount;
    document.getElementById('articleLink').href = currentHeadline.link;
    document.getElementById('victoryModal').style.display = 'flex';
}

function initGame() {
    // Reset game state
    swapCount = 0;
    selectedCell = null;
    document.getElementById('swapCount').textContent = '0';
    document.getElementById('victoryModal').style.display = 'none';
    
    // Try to generate a valid layout with different captions
    const maxCaptionAttempts = 10;
    let captionAttempts = 0;
    
    while (captionAttempts < maxCaptionAttempts) {
        // Select random headline
        currentHeadline = mockHeadlines[Math.floor(Math.random() * mockHeadlines.length)];
        
        // Generate crossword layout
        crosswordLayout = generateCrosswordLayout(currentHeadline.words);
        
        // If layout generation succeeded, break out of loop
        if (crosswordLayout !== null) {
            break;
        }
        
        captionAttempts++;
    }
    
    // If we still don't have a valid layout, use the last attempt (even if invalid)
    if (crosswordLayout === null) {
        // Generate a simple layout as final fallback
        crosswordLayout = generateSimpleLayout(currentHeadline.words);
        normalizeLayout(crosswordLayout, currentHeadline.words);
    }
    
    // Place words in grid
    grid = placeWordsInGrid(currentHeadline.words, crosswordLayout);
    correctGrid = JSON.parse(JSON.stringify(grid));
    
    // Find word connections
    findWordConnections();
    
    // Scramble letters
    scrambleLetters();
    
    // Render the crossword
    renderCrossword();
}

function enhancedInitGame() {
    const startTime = performance.now();
    
    // Reset debug info
    debugInfo = {
        layoutAttempts: 0,
        layoutScore: 0,
        rejectedHeadlines: [],
        alternativeHeadlines: [],
        compatibilityScores: {},
        generationTime: 0
    };
    
    // Reset game state
    swapCount = 0;
    selectedCell = null;
    document.getElementById('swapCount').textContent = '0';
    document.getElementById('victoryModal').style.display = 'none';
    
    // Try to generate a valid layout with headline management system
    const maxCaptionAttempts = 10;
    let captionAttempts = 0;
    
    while (captionAttempts < maxCaptionAttempts) {
        // Get next available headline using management system
        currentHeadline = getNextHeadline();
        
        // Generate crossword layout
        crosswordLayout = generateCrosswordLayout(currentHeadline.words);
        debugInfo.layoutAttempts = 50; // From generateCrosswordLayout maxAttempts
        
        // If layout generation succeeded, mark as used and break
        if (crosswordLayout !== null) {
            debugInfo.layoutScore = scoreLayout(crosswordLayout, currentHeadline.words);
            markHeadlineAsUsed(currentHeadline);
            break;
        } else {
            // Mark as rejected and try next headline
            markHeadlineAsRejected(currentHeadline);
            debugInfo.rejectedHeadlines.push(currentHeadline.text);
        }
        
        captionAttempts++;
    }
    
    // If we still don't have a valid layout after trying multiple headlines, reject this session
    if (crosswordLayout === null) {
        console.log(`Failed to generate valid layout after ${captionAttempts} attempts. Trying one more time with relaxed validation...`);
        
        // Try one more time with the current headline but with a simple layout
        crosswordLayout = generateSimpleLayout(currentHeadline.words);
        
        // STRICT VALIDATION: Only proceed if the simple layout also passes all rules
        if (crosswordLayout.words.length === currentHeadline.words.length &&
            isLayoutConnected(crosswordLayout, currentHeadline.words) && 
            hasProperParallelSpacing(crosswordLayout, currentHeadline.words) &&
            hasNoEndToEndAdjacency(crosswordLayout, currentHeadline.words)) {
            
            normalizeLayout(crosswordLayout, currentHeadline.words);
            debugInfo.layoutScore = scoreLayout(crosswordLayout, currentHeadline.words);
            markHeadlineAsUsed(currentHeadline);
            console.log(`Simple layout passed validation for: "${currentHeadline.text}"`);
        } else {
            // Even simple layout failed - reject this headline and try another
            console.log(`Simple layout also failed validation for: "${currentHeadline.text}"`);
            markHeadlineAsRejected(currentHeadline);
            
            // Try one more headline as absolute fallback
            currentHeadline = getNextHeadline();
            crosswordLayout = generateSimpleLayout(currentHeadline.words);
            
            // If this also fails, keep trying more headlines until we find a valid one
            if (!(crosswordLayout.words.length === currentHeadline.words.length &&
                  isLayoutConnected(crosswordLayout, currentHeadline.words) && 
                  hasProperParallelSpacing(crosswordLayout, currentHeadline.words) &&
                  hasNoEndToEndAdjacency(crosswordLayout, currentHeadline.words))) {
                console.error(`CRITICAL: Layout validation failed for: "${currentHeadline.text}". Trying another headline...`);
                markHeadlineAsRejected(currentHeadline);
                
                // Keep trying more headlines until we find one that works
                let additionalAttempts = 0;
                const maxAdditionalAttempts = 20;
                
                while (additionalAttempts < maxAdditionalAttempts) {
                    currentHeadline = getNextHeadline();
                    crosswordLayout = generateSimpleLayout(currentHeadline.words);
                    
                    if (crosswordLayout.words.length === currentHeadline.words.length &&
                        isLayoutConnected(crosswordLayout, currentHeadline.words) && 
                        hasProperParallelSpacing(crosswordLayout, currentHeadline.words) &&
                        hasNoEndToEndAdjacency(crosswordLayout, currentHeadline.words)) {
                        console.log(`Found valid layout after ${additionalAttempts + 1} additional attempts: "${currentHeadline.text}"`);
                        markHeadlineAsUsed(currentHeadline);
                        break;
                    } else {
                        console.log(`Rejecting headline ${additionalAttempts + 1}: "${currentHeadline.text}" - failed validation`);
                        markHeadlineAsRejected(currentHeadline);
                        additionalAttempts++;
                    }
                }
                
                // If we still don't have a valid layout after all attempts, something is seriously wrong
                if (additionalAttempts >= maxAdditionalAttempts) {
                    console.error(`CRITICAL ERROR: Unable to find any valid headline after ${maxAdditionalAttempts} additional attempts. This suggests a fundamental issue with the validation logic or headline data.`);
                    // As absolute last resort, use the last attempted layout but mark it as problematic
                    markHeadlineAsRejected(currentHeadline);
                }
            } else {
                markHeadlineAsUsed(currentHeadline);
            }
            
            normalizeLayout(crosswordLayout, currentHeadline.words);
            debugInfo.layoutScore = scoreLayout(crosswordLayout, currentHeadline.words);
        }
    }
    
    // Place words in grid
    grid = placeWordsInGrid(currentHeadline.words, crosswordLayout);
    correctGrid = JSON.parse(JSON.stringify(grid));
    
    // Find word connections
    findWordConnections();
    
    // Scramble letters
    scrambleLetters();
    
    // Render the crossword
    renderCrossword();
    
    // Update difficulty display
    updateDifficultyDisplay();
    
    // Calculate generation time
    debugInfo.generationTime = Math.round(performance.now() - startTime);
    
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

// Replace the original initGame with enhanced version
window.initGame = enhancedInitGame;
