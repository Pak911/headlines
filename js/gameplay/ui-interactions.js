// UI Interactions - Cell Selection, Swapping, and Rendering
// Handles user interface interactions and visual feedback

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('ui-interactions', message, options);
    } else {
        // Fallback if debug.js not loaded yet
        console.log('[ui-interactions]', message);
    }
}

// Store the last swap positions for victory animation
let lastSwapPositions = null;

// Track completed words to avoid duplicate animations
let completedWords = new Set();

function renderCrossword() {
    const container = document.getElementById('crosswordGrid');
    container.innerHTML = '';
    
    // Find the first and last rows that contain letters
    let firstFilledRow = -1;
    let lastFilledRow = -1;
    
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter) {
                if (firstFilledRow === -1) {
                    firstFilledRow = r;
                }
                lastFilledRow = r;
                break;
            }
        }
    }
    
    // If no filled rows found, render normally
    if (firstFilledRow === -1) {
        firstFilledRow = 0;
        lastFilledRow = grid.length - 1;
    }
    
    // Add a small buffer (1 row before and after)
    const startRow = Math.max(0, firstFilledRow - 1);
    const endRow = Math.min(grid.length - 1, lastFilledRow + 1);
    
    // Create grid cells only for the relevant rows
    for (let r = startRow; r <= endRow; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid-row';
        
        for (let c = 0; c < grid[r].length; c++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            if (grid[r][c].letter) {
                cell.className += ' filled';
                cell.textContent = grid[r][c].currentLetter;
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                // Add click handler
                cell.addEventListener('click', () => selectCell(r, c));
                
                // Apply color coding
                const colorClass = getLetterColorClass(r, c);
                if (colorClass) {
                    cell.classList.add(colorClass);
                }
            } else {
                cell.className += ' empty';
            }
            
            rowDiv.appendChild(cell);
        }
        
        container.appendChild(rowDiv);
    }
    
    // Update color legend with localized text
    updateColorLegend();
}

// Update color legend with localized text
function updateColorLegend() {
    // Call the main update function to handle all localization
    if (typeof updateLocalizedText === 'function') {
        updateLocalizedText();
    }
}

function selectCell(row, col) {
    const cell = grid[row][col];
    if (!cell.letter) return;
    
    const cellElement = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
    
    if (selectedCell === null) {
        // First selection - dispatch button press sound
        selectedCell = {row, col};
        cellElement.classList.add('selected');
        window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
    } else if (selectedCell.row === row && selectedCell.col === col) {
        // Deselect if clicking same cell - dispatch button press sound
        cellElement.classList.remove('selected');
        selectedCell = null;
        window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
    } else {
        // Second selection - perform swap (no sound for swap)
        swapLetters(selectedCell, {row, col});
        
        // Remove selection
        document.querySelector(`.grid-cell[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`).classList.remove('selected');
        selectedCell = null;
    }
}

// Check if a word is completely correct (all letters in correct positions)
function isWordComplete(wordIndex) {
    // Get all cells for this word
    const wordCells = [];
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter && grid[r][c].wordIndices.includes(wordIndex)) {
                wordCells.push({row: r, col: c, cell: grid[r][c]});
            }
        }
    }
    
    // Check if all letters are correct
    for (let cellInfo of wordCells) {
        if (cellInfo.cell.currentLetter !== cellInfo.cell.letter) {
            return false;
        }
    }
    
    return wordCells.length > 0;
}

// Play subtle color wave animation along a completed word
function playWordCompletionAnimation(wordIndex) {
    // Dispatch word solved event for sound
    window.dispatchEvent(new CustomEvent('headlines:wordSolved'));
    
    // Get all cells for this word
    const wordCells = [];
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter && grid[r][c].wordIndices.includes(wordIndex)) {
                wordCells.push({
                    row: r,
                    col: c,
                    element: document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`)
                });
            }
        }
    }
    
    if (wordCells.length === 0) return;
    
    // Get word info to determine direction
    const wordInfo = crosswordLayout.words.find(w => w.word === wordIndex);
    const isHorizontal = wordInfo && wordInfo.direction === 'horizontal';
    
    // Sort cells based on word direction
    if (isHorizontal) {
        // Left to right
        wordCells.sort((a, b) => a.col - b.col);
    } else {
        // Top to bottom
        wordCells.sort((a, b) => a.row - b.row);
    }
    
    // Apply subtle color wave animation with staggered delays
    const baseDelay = 80; // Slower, more subtle timing
    const duration = 400; // Longer duration for smoother transition
    
    wordCells.forEach((cell, index) => {
        if (cell.element) {
            const delay = index * baseDelay;
            
            setTimeout(() => {
                cell.element.style.transition = `all ${duration}ms ease-out`;
                cell.element.style.backgroundColor = '#4ade80'; // Brighter green
                
                // Return to normal green with smooth transition
                setTimeout(() => {
                    if (cell.element) {
                        cell.element.style.backgroundColor = '#4CAF50'; // Normal green
                    }
                }, duration);
            }, delay);
        }
    });
}

function swapLetters(pos1, pos2) {
    // Dispatch letter swap start event for sound
    window.dispatchEvent(new CustomEvent('headlines:letterSwapStart'));
    
    // Store last swap positions for victory animation
    lastSwapPositions = [pos1, pos2];
    
    // Get cell elements
    const cell1 = document.querySelector(`.grid-cell[data-row="${pos1.row}"][data-col="${pos1.col}"]`);
    const cell2 = document.querySelector(`.grid-cell[data-row="${pos2.row}"][data-col="${pos2.col}"]`);
    
    // Add swapping animation (first 180 degrees)
    cell1.classList.add('swapping');
    cell2.classList.add('swapping');
    
    // Update swap counter immediately with animation
    swapCount++;
    const swapCountElement = document.getElementById('swapCount');
    swapCountElement.textContent = swapCount;
    
    // Update moves label with proper pluralization
    const movesLabel = document.querySelector('.moves-label');
    if (movesLabel && typeof t !== 'undefined') {
        movesLabel.textContent = t('ui.moves', swapCount) || 'moves';
    }
    
    // Add pulse animation to moves counter circle
    const movesCircle = document.querySelector('.moves-counter-circle');
    if (movesCircle) {
        movesCircle.classList.remove('pulse');
        // Force reflow to restart animation
        void movesCircle.offsetWidth;
        movesCircle.classList.add('pulse');
    }
    // After first 180 degrees, swap letters and update colors immediately
    setTimeout(() => {
        // Dispatch letter swap end event for sound
        window.dispatchEvent(new CustomEvent('headlines:letterSwapEnd'));
        
        // Swap the letters in the grid data
        const temp = grid[pos1.row][pos1.col].currentLetter;
        grid[pos1.row][pos1.col].currentLetter = grid[pos2.row][pos2.col].currentLetter;
        grid[pos2.row][pos2.col].currentLetter = temp;
        
        // Update the text content of the cells immediately
        cell1.textContent = grid[pos1.row][pos1.col].currentLetter;
        cell2.textContent = grid[pos2.row][pos2.col].currentLetter;
        
        // Remove first animation and add second animation
        cell1.classList.remove('swapping');
        cell2.classList.remove('swapping');
        cell1.style.animation = 'swapSpinSecond 0.25s ease forwards';
        cell2.style.animation = 'swapSpinSecond 0.25s ease forwards';
        
        // Force reflow to restart animation
        cell1.offsetHeight;
        cell2.offsetHeight;
        
        // Apply color classes immediately after swapping
        const colorClass1 = getLetterColorClass(pos1.row, pos1.col);
        const colorClass2 = getLetterColorClass(pos2.row, pos2.col);
        
        // Remove old color classes
        cell1.classList.remove('correct', 'wrong-position', 'connected-word', 'wrong-word');
        cell2.classList.remove('correct', 'wrong-position', 'connected-word', 'wrong-word');
        
        // Add new color classes
        if (colorClass1) {
            cell1.classList.add(colorClass1);
        }
        if (colorClass2) {
            cell2.classList.add(colorClass2);
        }
    }, 250); // Half of the 500ms animation duration (first 180 degrees)
    
    // Clean up and check for completions after full animation
    setTimeout(() => {
        // Remove animation styles
        cell1.style.animation = '';
        cell2.style.animation = '';
        
        // Re-render the entire grid to update all dependent letters
        renderCrossword();
        
        // Check for word completions (but not if this completes the entire puzzle)
        if (!checkVictory()) {
            // Check each word to see if it's now complete
            for (let wordIndex = 0; wordIndex < currentHeadline.words.length; wordIndex++) {
                if (!completedWords.has(wordIndex) && isWordComplete(wordIndex)) {
                    completedWords.add(wordIndex);
                    playWordCompletionAnimation(wordIndex);
                }
            }
        }
        
        // Update debug panel if visible
        if (debugPanelVisible) {
            updateGridStateCode();
        }
        
        // Check for victory
        if (checkVictory()) {
            setTimeout(playVictoryAnimation, 300);
        }
    }, 500); // Full animation duration
}

// Reset completed words when starting a new game
function resetCompletedWords() {
    completedWords.clear();
}

// Position the moves counter to avoid intersections with grid elements
function positionMovesCounter() {
    const movesCounter = document.querySelector('.moves-counter-circle');
    const gridContainer = document.querySelector('.crossword-container');
    const legend = document.querySelector('.color-legend');
    const grid = document.querySelector('.crossword-grid');
    
    if (!movesCounter || !gridContainer) {
        return;
    }
    
    // Get grid and legend dimensions
    const containerRect = gridContainer.getBoundingClientRect();
    const legendRect = legend ? legend.getBoundingClientRect() : null;
    const gridRect = grid ? grid.getBoundingClientRect() : null;
    
    // Counter dimensions
    const counterSize = 80; // width and height of the circle
    const margin = 16;
    
    // Get all filled grid cells
    const filledCells = document.querySelectorAll('.grid-cell.filled');
    const cellRects = Array.from(filledCells).map(cell => cell.getBoundingClientRect());
    
    // Define corner positions to try (in order: bottom-right, bottom-left, top-left, top-right)
    const positions = [
        { bottom: margin, right: margin, top: 'auto', left: 'auto', name: 'bottom-right' },
        { bottom: margin, left: margin, top: 'auto', right: 'auto', name: 'bottom-left' },
        { top: margin, left: margin, bottom: 'auto', right: 'auto', name: 'top-left' },
        { top: margin, right: margin, bottom: 'auto', left: 'auto', name: 'top-right' }
    ];
    
    // Check each position for intersections
    for (let pos of positions) {
        let hasIntersection = false;
        
        // Calculate absolute position of counter for this corner
        let counterTop, counterLeft;
        if (pos.top !== 'auto') {
            counterTop = containerRect.top + pos.top;
        } else {
            counterTop = containerRect.bottom - pos.bottom - counterSize;
        }
        if (pos.left !== 'auto') {
            counterLeft = containerRect.left + pos.left;
        } else {
            counterLeft = containerRect.right - pos.right - counterSize;
        }
        
        const counterRect = {
            top: counterTop,
            left: counterLeft,
            right: counterLeft + counterSize,
            bottom: counterTop + counterSize
        };
        
        // Check intersection with any filled grid cell (letters)
        for (let cellRect of cellRects) {
            if (!(counterRect.right <= cellRect.left || 
                  counterRect.left >= cellRect.right || 
                  counterRect.bottom <= cellRect.top || 
                  counterRect.top >= cellRect.bottom)) {
                hasIntersection = true;
                _log(`Position ${pos.name} would hide a letter`);
                break;
            }
        }
        
        // If no intersection with letters, use this position
        // Note: We allow intersection with legend at top-left position as per user request
        if (!hasIntersection) {
            movesCounter.style.top = pos.top === 'auto' ? 'auto' : pos.top + 'px';
            movesCounter.style.bottom = pos.bottom === 'auto' ? 'auto' : pos.bottom + 'px';
            movesCounter.style.left = pos.left === 'auto' ? 'auto' : pos.left + 'px';
            movesCounter.style.right = pos.right === 'auto' ? 'auto' : pos.right + 'px';
            _log(`Moves counter positioned at: ${pos.name}`);
            return;
        }
    }
    
    // If all positions hide letters, use top-left as last resort (may hide legend but that's acceptable)
    movesCounter.style.top = margin + 'px';
    movesCounter.style.left = margin + 'px';
    movesCounter.style.bottom = 'auto';
    movesCounter.style.right = 'auto';
    _log('Moves counter positioned at: top-left (fallback - may overlap legend)');
}

// Make functions globally available
window.renderCrossword = renderCrossword;
window.resetCompletedWords = resetCompletedWords;
window.positionMovesCounter = positionMovesCounter;

})();
