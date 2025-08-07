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

async function enhancedInitGame() {
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
    
    console.log('🎮 Starting enhanced game initialization...');
    
    try {
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
            
            console.log(`🎯 Attempting layout for: "${currentHeadline.filteredText || currentHeadline.text}" (${wordsToUse.length} words)`);
            
            // Generate crossword layout
            crosswordLayout = generateCrosswordLayout(wordsToUse);
            debugInfo.layoutAttempts = 50; // From generateCrosswordLayout maxAttempts
            
            // If layout generation succeeded, mark as used and break
            if (crosswordLayout !== null) {
                debugInfo.layoutScore = scoreLayout(crosswordLayout, wordsToUse);
                markHeadlineAsUsed(currentHeadline);
                console.log(`✅ Successfully generated layout for: "${currentHeadline.filteredText || currentHeadline.text}"`);
                
                // Update currentHeadline to use filtered words for the game
                if (currentHeadline.filteredWords) {
                    currentHeadline.words = currentHeadline.filteredWords;
                    currentHeadline.text = currentHeadline.filteredText;
                }
                
                break;
            } else {
                // Mark as rejected and try next headline
                markHeadlineAsRejected(currentHeadline);
                debugInfo.rejectedHeadlines.push(currentHeadline.filteredText || currentHeadline.text);
                console.log(`❌ Layout generation failed for: "${currentHeadline.filteredText || currentHeadline.text}"`);
            }
            
            captionAttempts++;
        }
        
        // If we still don't have a valid layout after trying multiple headlines
        if (crosswordLayout === null) {
            console.log(`⚠️ Failed to generate valid layout after ${captionAttempts} attempts. Trying simple layout...`);
            
            if (currentHeadline) {
                const wordsToUse = currentHeadline.filteredWords || currentHeadline.words;
                crosswordLayout = generateSimpleLayout(wordsToUse);
                
                if (crosswordLayout && crosswordLayout.words.length === wordsToUse.length) {
                    normalizeLayout(crosswordLayout, wordsToUse);
                    debugInfo.layoutScore = scoreLayout(crosswordLayout, wordsToUse);
                    markHeadlineAsUsed(currentHeadline);
                    console.log(`✅ Simple layout succeeded for: "${currentHeadline.filteredText || currentHeadline.text}"`);
                    
                    // Update currentHeadline to use filtered words
                    if (currentHeadline.filteredWords) {
                        currentHeadline.words = currentHeadline.filteredWords;
                        currentHeadline.text = currentHeadline.filteredText;
                    }
                } else {
                    console.error('❌ Even simple layout failed');
                    markHeadlineAsRejected(currentHeadline);
                }
            }
        }
        
        // Final fallback check
        if (!crosswordLayout || !currentHeadline) {
            console.error('🚨 Critical: No valid layout generated, falling back to emergency headline');
            // Use a guaranteed working headline from mock data
            currentHeadline = mockHeadlines[0];
            crosswordLayout = generateSimpleLayout(currentHeadline.words);
            normalizeLayout(crosswordLayout, currentHeadline.words);
        }
        
    } catch (error) {
        console.error('❌ Error in enhanced game initialization:', error);
        
        // Emergency fallback to old system
        console.log('🔄 Falling back to legacy headline system');
        currentHeadline = mockHeadlines[Math.floor(Math.random() * mockHeadlines.length)];
        crosswordLayout = generateCrosswordLayout(currentHeadline.words);
        
        if (!crosswordLayout) {
            crosswordLayout = generateSimpleLayout(currentHeadline.words);
            normalizeLayout(crosswordLayout, currentHeadline.words);
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
    
    // Display headline description as hint
    displayHeadlineDescription();
    
    // Update difficulty display
    updateDifficultyDisplay();
    
    // Calculate generation time
    debugInfo.generationTime = Math.round(performance.now() - startTime);
    
    console.log(`🎮 Game initialization completed in ${debugInfo.generationTime}ms`);
    
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
        descriptionElement.textContent = currentHeadline.description;
    } else {
        descriptionElement.textContent = '';
    }
}

// Auto-win function for debug purposes
function autoWinGame() {
    if (!currentHeadline || !grid) {
        console.log('❌ No active game to auto-win');
        return;
    }
    
    console.log('🏆 Auto-winning game...');
    
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
    
    // Show victory
    showVictory();
    
    console.log('✅ Auto-win completed!');
}

// Make auto-win function globally available
window.autoWinGame = autoWinGame;

// Replace the original initGame with enhanced version
window.initGame = enhancedInitGame;
