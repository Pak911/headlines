// Victory Animations - Game Field Animations for Victory Moment
// Plays animations on the crossword grid when all letters are correctly placed

/**
 * Play victory animation on the crossword grid
 * Called when all letters turn green but before victory modal appears
 */
function playVictoryAnimation() {
    // Get all filled cells
    const filledCells = getAllFilledCells();
    
    if (filledCells.length === 0) return;
    
    // Apply the configured animation type
    switch (victoryAnimationConfig.animationType) {
        case 'wave':
            playWaveAnimation(filledCells);
            break;
        case 'jump':
            playJumpAnimation(filledCells);
            break;
        case 'colorWave':
            playColorWaveAnimation(filledCells);
            break;
        case 'shake':
            playShakeAnimation(filledCells);
            break;
        case 'none':
        default:
            // No animation - proceed directly to victory
            setTimeout(() => showVictory(), 100);
            return;
    }
}

/**
 * Get all filled cells in the grid with their positions
 */
function getAllFilledCells() {
    const filledCells = [];
    
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter) {
                filledCells.push({
                    row: r,
                    col: c,
                    element: document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`)
                });
            }
        }
    }
    
    return filledCells;
}

/**
 * Wave Animation - Letters pulse in a wave pattern across the grid
 */
function playWaveAnimation(filledCells) {
    // Get the last swap positions from UI interactions
    let centerRow, centerCol;
    
    if (typeof lastSwapPositions !== 'undefined' && lastSwapPositions && lastSwapPositions.length >= 2) {
        // Randomly choose one of the two last swap positions
        const randomIndex = Math.floor(Math.random() * 2);
        const centerPos = lastSwapPositions[randomIndex];
        centerRow = centerPos.row;
        centerCol = centerPos.col;
    } else {
        // Fallback to grid center if no last swap positions available
        centerRow = grid.length / 2;
        centerCol = grid[0] ? grid[0].length / 2 : 0;
    }
    
    // Sort by distance from the chosen center position for ripple effect
    filledCells.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.row - centerRow, 2) + Math.pow(a.col - centerCol, 2));
        const distB = Math.sqrt(Math.pow(b.row - centerRow, 2) + Math.pow(b.col - centerCol, 2));
        return distA - distB;
    });
    
    // Apply animation with staggered delays based on distance from center
    filledCells.forEach((cell, index) => {
        if (cell.element) {
            const delay = index * victoryAnimationConfig.staggerDelay;
            
            // Add animation class with delay
            setTimeout(() => {
                cell.element.style.transition = `all ${victoryAnimationConfig.duration}ms ${victoryAnimationConfig.easing}`;
                cell.element.style.transform = 'scale(1.15)';
                cell.element.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4), 0 2px 6px rgba(0, 0, 0, 0.15)';
                
                // Return to normal
                setTimeout(() => {
                    if (cell.element) {
                        cell.element.style.transform = '';
                        cell.element.style.boxShadow = '';
                    }
                }, victoryAnimationConfig.duration / 2);
            }, delay);
        }
    });
    
    // Show victory after all animations complete
    setTimeout(() => showVictory(), filledCells.length * victoryAnimationConfig.staggerDelay + victoryAnimationConfig.duration);
}

/**
 * Jump Animation - Letters bounce up and down in sequence
 */
function playJumpAnimation(filledCells) {
    // Calculate center of grid for ripple effect
    const centerRow = grid.length / 2;
    const centerCol = grid[0] ? grid[0].length / 2 : 0;
    
    // Sort by distance from center for ripple effect
    filledCells.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.row - centerRow, 2) + Math.pow(a.col - centerCol, 2));
        const distB = Math.sqrt(Math.pow(b.row - centerRow, 2) + Math.pow(b.col - centerCol, 2));
        return distA - distB;
    });
    
    // Apply jump animation with staggered delays
    filledCells.forEach((cell, index) => {
        if (cell.element) {
            const delay = index * victoryAnimationConfig.staggerDelay;
            
            setTimeout(() => {
                cell.element.style.transition = `transform ${victoryAnimationConfig.duration}ms ${victoryAnimationConfig.easing}`;
                cell.element.style.transform = 'translateY(-12px)';
                
                // Bounce back down
                setTimeout(() => {
                    if (cell.element) {
                        cell.element.style.transform = 'translateY(0)';
                    }
                }, victoryAnimationConfig.duration / 2);
            }, delay);
        }
    });
    
    // Show victory after all animations complete
    setTimeout(() => showVictory(), filledCells.length * victoryAnimationConfig.staggerDelay + victoryAnimationConfig.duration);
}

/**
 * Color Wave Animation - Green color intensity builds in a wave pattern
 */
function playColorWaveAnimation(filledCells) {
    // Sort cells by row then column for wave effect
    filledCells.sort((a, b) => {
        if (a.row === b.row) return a.col - b.col;
        return a.row - b.row;
    });
    
    // Apply color wave animation with staggered delays
    filledCells.forEach((cell, index) => {
        if (cell.element) {
            const delay = index * victoryAnimationConfig.staggerDelay;
            
            setTimeout(() => {
                cell.element.style.transition = `all ${victoryAnimationConfig.duration}ms ${victoryAnimationConfig.easing}`;
                cell.element.style.backgroundColor = '#4ade80'; // Brighter green
                cell.element.style.boxShadow = '0 0 15px rgba(74, 222, 128, 0.6)';
                
                // Return to normal green
                setTimeout(() => {
                    if (cell.element) {
                        cell.element.style.backgroundColor = '';
                        cell.element.style.boxShadow = '';
                    }
                }, victoryAnimationConfig.duration / 2);
            }, delay);
        }
    });
    
    // Show victory after all animations complete
    setTimeout(() => showVictory(), filledCells.length * victoryAnimationConfig.staggerDelay + victoryAnimationConfig.duration);
}

/**
 * Shake Animation - Gentle horizontal shake traveling across the grid
 */
function playShakeAnimation(filledCells) {
    // Sort cells by row then column for wave effect
    filledCells.sort((a, b) => {
        if (a.row === b.row) return a.col - b.col;
        return a.row - b.row;
    });
    
    // Apply shake animation with staggered delays
    filledCells.forEach((cell, index) => {
        if (cell.element) {
            const delay = index * victoryAnimationConfig.staggerDelay;
            
            setTimeout(() => {
                cell.element.style.transition = `transform ${victoryAnimationConfig.duration / 4}ms ${victoryAnimationConfig.easing}`;
                
                // Shake sequence
                const shakeIntensity = 3;
                let shakeCount = 0;
                const maxShakes = 4;
                
                const shakeInterval = setInterval(() => {
                    if (shakeCount >= maxShakes) {
                        clearInterval(shakeInterval);
                        if (cell.element) {
                            cell.element.style.transform = '';
                        }
                        return;
                    }
                    
                    if (cell.element) {
                        const offset = shakeCount % 2 === 0 ? shakeIntensity : -shakeIntensity;
                        cell.element.style.transform = `translateX(${offset}px)`;
                    }
                    
                    shakeCount++;
                }, victoryAnimationConfig.duration / 8);
            }, delay);
        }
    });
    
    // Show victory after all animations complete
    setTimeout(() => showVictory(), filledCells.length * victoryAnimationConfig.staggerDelay + victoryAnimationConfig.duration);
}

// Make function globally available
window.playVictoryAnimation = playVictoryAnimation;
