// Difficulty System - Letter Scrambling and Difficulty Management
// Handles strategic letter scrambling with configurable difficulty constraints

// Perform a strategic swap between two positions
function performStrategicSwap(pos1, pos2, swapLog) {
    const temp = grid[pos1.row][pos1.col].currentLetter;
    grid[pos1.row][pos1.col].currentLetter = grid[pos2.row][pos2.col].currentLetter;
    grid[pos2.row][pos2.col].currentLetter = temp;
    
    swapLog.push({
        from: {row: pos1.row, col: pos1.col, letter: grid[pos2.row][pos2.col].currentLetter},
        to: {row: pos2.row, col: pos2.col, letter: grid[pos1.row][pos1.col].currentLetter}
    });
}

// Capture current grid state for state tracking
function captureGridState() {
    const state = [];
    for (let r = 0; r < grid.length; r++) {
        const row = [];
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter) {
                row.push({
                    letter: grid[r][c].letter,
                    currentLetter: grid[r][c].currentLetter
                });
            } else {
                row.push(null);
            }
        }
        state.push(row);
    }
    return state;
}

// Restore grid state from captured state
function restoreGridState(state) {
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (state[r][c] && grid[r][c].letter) {
                grid[r][c].currentLetter = state[r][c].currentLetter;
            }
        }
    }
}

// Difficulty-based scrambling function with green letter percentage constraints
function scrambleLettersByDifficulty(difficulty = currentDifficulty) {
    const intersections = getIntersectionCells();
    const swapLog = [];
    let swapsPerformed = 0;
    
    // Reset shuffle info
    debugInfo.shuffleInfo = {
        difficulty: difficulty,
        swapsPerformed: 0,
        minimumSolution: 0,
        intersectionsPreserved: 0,
        totalIntersections: intersections.length
    };
    
    const settings = difficultySettings[difficulty];
    const targetGreenPercentage = settings.maxGreenPercentage;
    
    // Get initial stats for logging
    const initialStats = countCorrectCells();
    console.log(`Starting scramble - Initial: ${initialStats.correctCells}/${initialStats.totalCells} correct (${initialStats.percentage.toFixed(1)}% green)`);
    console.log(`Target: ${targetGreenPercentage}% green letters for ${settings.name} difficulty`);
    
    switch (difficulty) {
        case 'easy':
            swapsPerformed = scrambleEasy(swapLog);
            break;
        case 'mediumEasy':
        case 'medium':
        case 'mediumHard':
        case 'hard':
            swapsPerformed = scrambleWithGreenConstraint(swapLog, intersections, targetGreenPercentage, settings);
            break;
        default:
            swapsPerformed = scrambleWithGreenConstraint(swapLog, intersections, settings.maxGreenPercentage || 30, settings);
    }
    
    // Get final stats for logging
    const finalStats = countCorrectCells();
    console.log(`Scramble complete - Final: ${finalStats.correctCells}/${finalStats.totalCells} correct (${finalStats.percentage.toFixed(1)}% green)`);
    console.log(`Performed ${swapsPerformed} swaps to achieve target difficulty`);
    
    // Update debug info
    debugInfo.shuffleInfo.swapsPerformed = swapsPerformed;
    debugInfo.shuffleInfo.minimumSolution = swapsPerformed; // Minimum swaps needed equals swaps performed
    
    // Count preserved intersections
    let preservedIntersections = 0;
    for (let intersection of intersections) {
        const cell = grid[intersection.row][intersection.col];
        if (cell.letter === cell.currentLetter) {
            preservedIntersections++;
        }
    }
    debugInfo.shuffleInfo.intersectionsPreserved = preservedIntersections;
}

// Universal scrambling function with green letter percentage constraint
function scrambleWithGreenConstraint(swapLog, intersections, maxGreenPercentage, settings) {
    let swapsPerformed = 0;
    const maxSwaps = settings.maxSwaps;
    
    // State tracking for best variant
    let bestState = captureGridState();
    let bestPercentage = countCorrectCells().percentage;
    let bestSwapLog = [...swapLog];
    let bestSwapsPerformed = swapsPerformed;
    
    // Phase 1: Aggressively reduce green percentage
    let attempts = 0;
    const maxAttempts = 10000;
    
    while (attempts < maxAttempts && swapsPerformed < maxSwaps) {
        const stats = countCorrectCells();
        
        // Track best state (lowest green percentage achieved)
        if (stats.percentage < bestPercentage) {
            bestState = captureGridState();
            bestPercentage = stats.percentage;
            bestSwapLog = [...swapLog];
            bestSwapsPerformed = swapsPerformed;
        }
        
        // If we're at or below target, we're done with aggressive phase
        if (stats.percentage <= maxGreenPercentage) {
            break;
        }
        
        // Find all cells that are currently correct (green)
        const correctCells = [];
        const wrongCells = [];
        
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c].letter) {
                    if (grid[r][c].letter === grid[r][c].currentLetter) {
                        correctCells.push({row: r, col: c});
                    } else {
                        wrongCells.push({row: r, col: c});
                    }
                }
            }
        }
        
        // Must have both correct and wrong cells to swap
        if (correctCells.length === 0) {
            break;
        }
        
        if (wrongCells.length === 0) {
            // If no wrong cells, swap two correct cells with each other
            if (correctCells.length >= 2) {
                const cell1 = correctCells[Math.floor(Math.random() * correctCells.length)];
                let cell2 = correctCells[Math.floor(Math.random() * correctCells.length)];
                
                // Ensure different cells
                let cellAttempts = 0;
                while ((cell1.row === cell2.row && cell1.col === cell2.col) && cellAttempts < 10) {
                    cell2 = correctCells[Math.floor(Math.random() * correctCells.length)];
                    cellAttempts++;
                }
                
                if (cell1.row !== cell2.row || cell1.col !== cell2.col) {
                    performStrategicSwap(cell1, cell2, swapLog);
                    swapsPerformed++;
                } else {
                    break;
                }
            } else {
                break;
            }
        } else {
            // Swap a correct cell with a wrong cell
            const correctCell = correctCells[Math.floor(Math.random() * correctCells.length)];
            const wrongCell = wrongCells[Math.floor(Math.random() * wrongCells.length)];
            
            performStrategicSwap(correctCell, wrongCell, swapLog);
            swapsPerformed++;
        }
        
        attempts++;
    }
    
    // Check if target was achieved, if not restore best state
    const finalStats = countCorrectCells();
    if (finalStats.percentage > maxGreenPercentage && bestPercentage < finalStats.percentage) {
        console.log(`Target ${maxGreenPercentage}% not achieved (current: ${finalStats.percentage.toFixed(1)}%). Restoring best state with ${bestPercentage.toFixed(1)}% green.`);
        restoreGridState(bestState);
        // Clear and restore the swap log to match the best state
        swapLog.length = 0;
        swapLog.push(...bestSwapLog);
        swapsPerformed = bestSwapsPerformed;
    }
    
    // Phase 2: Additional swaps to reach minimum while maintaining constraint
    while (swapsPerformed < settings.minSwaps && swapsPerformed < maxSwaps) {
        const stats = countCorrectCells();
        
        // If we're still above target, continue reducing
        if (stats.percentage > maxGreenPercentage) {
            const correctCells = [];
            const wrongCells = [];
            
            for (let r = 0; r < grid.length; r++) {
                for (let c = 0; c < grid[r].length; c++) {
                    if (grid[r][c].letter) {
                        if (grid[r][c].letter === grid[r][c].currentLetter) {
                            correctCells.push({row: r, col: c});
                        } else {
                            wrongCells.push({row: r, col: c});
                        }
                    }
                }
            }
            
            if (correctCells.length > 0 && wrongCells.length > 0) {
                const correctCell = correctCells[Math.floor(Math.random() * correctCells.length)];
                const wrongCell = wrongCells[Math.floor(Math.random() * wrongCells.length)];
                performStrategicSwap(correctCell, wrongCell, swapLog);
                swapsPerformed++;
            } else if (correctCells.length >= 2) {
                // Swap two correct cells
                const cell1 = correctCells[0];
                const cell2 = correctCells[1];
                performStrategicSwap(cell1, cell2, swapLog);
                swapsPerformed++;
            } else {
                break;
            }
        } else {
            // We're at target, perform neutral swaps (wrong cell with wrong cell)
            const wrongCells = [];
            
            for (let r = 0; r < grid.length; r++) {
                for (let c = 0; c < grid[r].length; c++) {
                    if (grid[r][c].letter && grid[r][c].letter !== grid[r][c].currentLetter) {
                        wrongCells.push({row: r, col: c});
                    }
                }
            }
            
            if (wrongCells.length >= 2) {
                const cell1 = wrongCells[Math.floor(Math.random() * wrongCells.length)];
                let cell2 = wrongCells[Math.floor(Math.random() * wrongCells.length)];
                
                // Ensure different cells
                let cellAttempts = 0;
                while ((cell1.row === cell2.row && cell1.col === cell2.col) && cellAttempts < 10) {
                    cell2 = wrongCells[Math.floor(Math.random() * wrongCells.length)];
                    cellAttempts++;
                }
                
                if (cell1.row !== cell2.row || cell1.col !== cell2.col) {
                    performStrategicSwap(cell1, cell2, swapLog);
                    swapsPerformed++;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }
    
    return swapsPerformed;
}

// EASY: Only shuffle within individual words, keep all intersections intact
function scrambleEasy(swapLog) {
    let swapsPerformed = 0;
    const maxSwaps = difficultySettings.easy.maxSwaps;
    
    // For each word, perform internal swaps
    for (let wordIndex = 0; wordIndex < currentHeadline.words.length; wordIndex++) {
        const wordCells = getWordCells(wordIndex);
        const nonIntersectionCells = wordCells.filter(cell => 
            grid[cell.row][cell.col].wordIndices.length === 1
        );
        
        if (nonIntersectionCells.length >= 2) {
            // Perform 1-2 swaps within this word
            const swapsInWord = Math.min(2, Math.floor(nonIntersectionCells.length / 2));
            for (let i = 0; i < swapsInWord && swapsPerformed < maxSwaps; i++) {
                const shuffled = [...nonIntersectionCells];
                for (let j = shuffled.length - 1; j > 0; j--) {
                    const k = Math.floor(Math.random() * (j + 1));
                    [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
                }
                
                if (shuffled.length >= 2) {
                    performStrategicSwap(shuffled[0], shuffled[1], swapLog);
                    swapsPerformed++;
                }
            }
        }
    }
    
    return swapsPerformed;
}

// Main scramble function (backwards compatible)
function scrambleLetters() {
    scrambleLettersByDifficulty(currentDifficulty);
}

// Function to change difficulty
function changeDifficulty(newDifficulty) {
    currentDifficulty = newDifficulty;
    
    // Reset to correct grid first
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter) {
                grid[r][c].currentLetter = grid[r][c].letter;
            }
        }
    }
    
    // Reset swap count
    swapCount = 0;
    document.getElementById('swapCount').textContent = '0';
    
    // Apply new difficulty shuffling
    scrambleLettersByDifficulty(newDifficulty);
    renderCrossword();
    
    // Update difficulty display
    updateDifficultyDisplay();
    
    // Update debug panel if visible
    if (debugPanelVisible) {
        updateDebugInfo();
    }
}

// Function to update difficulty display
function updateDifficultyDisplay() {
    const settings = difficultySettings[currentDifficulty];
    const difficultyInfo = document.getElementById('difficultyInfo');
    if (difficultyInfo) {
        difficultyInfo.innerHTML = `
            <strong>Current:</strong> ${settings.name}<br>
            <strong>Minimum swaps to solve:</strong> ${debugInfo.shuffleInfo.minimumSolution}<br>
            <strong>Range:</strong> ${settings.minSwaps}-${settings.maxSwaps} swaps
        `;
    }
}
