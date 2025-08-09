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

// Calculate star rating based on swap count and word count
function calculateStarRating(swapCount, wordCount) {
    const minPossibleSwaps = Math.floor(wordCount * starRatingConfig.baseMultiplier);
    
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
function getStarThresholds(wordCount) {
    const minPossibleSwaps = Math.floor(wordCount * starRatingConfig.baseMultiplier);
    
    const thresholds = {};
    for (let stars = 5; stars >= 1; stars--) {
        const threshold = starRatingConfig.starThresholds[stars];
        thresholds[stars] = threshold === Infinity ? Infinity : Math.floor(minPossibleSwaps * threshold);
    }
    
    return thresholds;
}

// Generate tooltip content for star hover
function generateTooltipContent(starIndex, currentStars, swapCount, wordCount) {
    const thresholds = getStarThresholds(wordCount);
    
    if (starIndex <= currentStars) {
        // Player achieved this star level
        if (currentStars === 5) {
            return "🏆 Perfect! You achieved the maximum 5-star rating!";
        } else {
            const nextStarThreshold = thresholds[currentStars + 1];
            return `🌟 You earned ${currentStars} stars by completing in ${swapCount} swaps!<br>⭐ Get ${currentStars + 1} stars by completing in ${nextStarThreshold} swaps or fewer`;
        }
    } else {
        // Player didn't achieve this star level
        const requiredSwaps = thresholds[starIndex];
        if (requiredSwaps === Infinity) {
            return `⭐ Get ${starIndex} star by completing the puzzle`;
        } else {
            return `⭐ Get ${starIndex} stars by completing the puzzle in ${requiredSwaps} swaps or fewer`;
        }
    }
}

// Add hover listeners to stars for tooltips
function addStarHoverListeners(currentStars, swapCount, wordCount) {
    const stars = document.querySelectorAll('.victory-star');
    
    stars.forEach((star, index) => {
        const starIndex = index + 1;
        
        star.addEventListener('mouseenter', function(e) {
            showStarTooltip(e.target, starIndex, currentStars, swapCount, wordCount);
        });
        
        star.addEventListener('mouseleave', function() {
            hideStarTooltip();
        });
    });
}

// Show tooltip for star
function showStarTooltip(starElement, starIndex, currentStars, swapCount, wordCount) {
    // Remove existing tooltip
    hideStarTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'star-tooltip';
    tooltip.innerHTML = generateTooltipContent(starIndex, currentStars, swapCount, wordCount);
    
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
    document.getElementById('headlineReveal').textContent = currentHeadline.text;
    document.getElementById('finalSwaps').textContent = swapCount;
    
    // Calculate performance rating using new function
    const wordCount = currentHeadline.words.length;
    const { rating, starCount } = calculateStarRating(swapCount, wordCount);
    
    document.getElementById('performanceRating').textContent = rating;
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
    addStarHoverListeners(starCount, swapCount, wordCount);
    
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
    
    // Reset completed words tracking
    if (typeof resetCompletedWords === 'function') {
        resetCompletedWords();
    }
    
    // Reset grid to the scrambled state (keep the same puzzle)
    // We need to scramble the letters again
    scrambleLetters();
    
    // Re-render the crossword
    renderCrossword();
    
    console.log('🔄 Replaying the same puzzle');
}

// Make functions globally available
window.closeVictoryModal = closeVictoryModal;
window.replayGame = replayGame;

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
        // Use HTML processor to clean the description if available
        let cleanDescription = currentHeadline.description;
        
        if (typeof window !== 'undefined' && window.HTMLProcessor) {
            // Check if description contains HTML
            if (window.HTMLProcessor.detectHTML(currentHeadline.description)) {
                console.log('🔧 Processing HTML in description:', currentHeadline.description.substring(0, 100) + '...');
                cleanDescription = window.HTMLProcessor.stripHTML(currentHeadline.description);
                console.log('✅ Clean description:', cleanDescription.substring(0, 100) + '...');
            }
        }
        
        descriptionElement.textContent = cleanDescription;
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
