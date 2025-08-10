// UI Interactions - Cell Selection, Swapping, and Rendering
// Handles user interface interactions and visual feedback

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
        // First selection
        selectedCell = {row, col};
        cellElement.classList.add('selected');
    } else if (selectedCell.row === row && selectedCell.col === col) {
        // Deselect if clicking same cell
        cellElement.classList.remove('selected');
        selectedCell = null;
    } else {
        // Second selection - perform swap
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
    // Store last swap positions for victory animation
    lastSwapPositions = [pos1, pos2];
    
    // Get cell elements
    const cell1 = document.querySelector(`.grid-cell[data-row="${pos1.row}"][data-col="${pos1.col}"]`);
    const cell2 = document.querySelector(`.grid-cell[data-row="${pos2.row}"][data-col="${pos2.col}"]`);
    
    // Add swapping animation (first 180 degrees)
    cell1.classList.add('swapping');
    cell2.classList.add('swapping');
    
    // Update swap counter immediately
    swapCount++;
    document.getElementById('swapCount').textContent = swapCount;
    
    // After first 180 degrees, swap letters and update colors immediately
    setTimeout(() => {
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

// Make function globally available
window.resetCompletedWords = resetCompletedWords;
