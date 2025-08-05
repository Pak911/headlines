// Game state
let currentHeadline = null;
let crosswordLayout = null;
let grid = [];
let correctGrid = [];
let swapCount = 0;
let selectedCell = null;
let gridSize = { rows: 0, cols: 0 };
let wordConnections = {};

// Find common letters between two words
function findCommonLetters(word1, word2) {
    const common = [];
    for (let i = 0; i < word1.length; i++) {
        for (let j = 0; j < word2.length; j++) {
            if (word1[i] === word2[j]) {
                common.push({ word1Index: i, word2Index: j, letter: word1[i] });
            }
        }
    }
    return common;
}

// Generate crossword layout ensuring words share letters at intersections
function generateCrosswordLayout(words) {
    const layout = { words: [] };
    const placed = new Set();
    
    // Place first word horizontally in the middle
    layout.words.push({
        word: 0,
        row: 5,
        col: 2,
        direction: 'horizontal'
    });
    placed.add(0);
    
    // Try to place remaining words
    let attempts = 0;
    while (placed.size < words.length && attempts < 100) {
        attempts++;
        
        for (let i = 0; i < words.length; i++) {
            if (placed.has(i)) continue;
            
            // Try to intersect with already placed words
            let bestPlacement = null;
            
            for (let placedIdx of placed) {
                const placedWord = layout.words.find(w => w.word === placedIdx);
                const commonLetters = findCommonLetters(words[placedIdx], words[i]);
                
                if (commonLetters.length > 0) {
                    // Pick a random common letter
                    const common = commonLetters[Math.floor(Math.random() * commonLetters.length)];
                    
                    // Calculate position for the new word
                    if (placedWord.direction === 'horizontal') {
                        // Place new word vertically
                        bestPlacement = {
                            word: i,
                            row: placedWord.row - common.word2Index,
                            col: placedWord.col + common.word1Index,
                            direction: 'vertical'
                        };
                    } else {
                        // Place new word horizontally
                        bestPlacement = {
                            word: i,
                            row: placedWord.row + common.word1Index,
                            col: placedWord.col - common.word2Index,
                            direction: 'horizontal'
                        };
                    }
                    
                    // Check if placement is valid (doesn't create conflicts)
                    if (isValidPlacement(layout, bestPlacement, words)) {
                        layout.words.push(bestPlacement);
                        placed.add(i);
                        break;
                    }
                }
            }
        }
    }
    
    // If we couldn't place all words with intersections, fall back to a simple layout
    if (placed.size < words.length) {
        return generateSimpleLayout(words);
    }
    
    // Calculate grid bounds
    let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
    layout.words.forEach(wordInfo => {
        const word = words[wordInfo.word];
        
        // Calculate start position
        const startRow = wordInfo.row;
        const startCol = wordInfo.col;
        
        // Calculate end position
        let endRow = startRow;
        let endCol = startCol;
        
        if (wordInfo.direction === 'horizontal') {
            endCol = startCol + word.length - 1;
        } else {
            endRow = startRow + word.length - 1;
        }
        
        // Update bounds
        minRow = Math.min(minRow, startRow);
        maxRow = Math.max(maxRow, endRow);
        minCol = Math.min(minCol, startCol);
        maxCol = Math.max(maxCol, endCol);
    });
    
    // Add padding to ensure positive indices
    const padding = 2;
    
    // Normalize positions to start from padding
    layout.words.forEach(wordInfo => {
        wordInfo.row = wordInfo.row - minRow + padding;
        wordInfo.col = wordInfo.col - minCol + padding;
    });
    
    gridSize = { 
        rows: maxRow - minRow + 1 + (padding * 2), 
        cols: maxCol - minCol + 1 + (padding * 2) 
    };
    
    return layout;
}

// Check if a word placement is valid
function isValidPlacement(layout, newWord, words) {
    const newWordText = words[newWord.word];
    let hasIntersection = false;
    
    for (let existing of layout.words) {
        const existingText = words[existing.word];
        
        // Check for conflicts and proper spacing
        for (let i = 0; i < newWordText.length; i++) {
            let newRow = newWord.row;
            let newCol = newWord.col;
            
            if (newWord.direction === 'horizontal') {
                newCol += i;
            } else {
                newRow += i;
            }
            
            for (let j = 0; j < existingText.length; j++) {
                let existingRow = existing.row;
                let existingCol = existing.col;
                
                if (existing.direction === 'horizontal') {
                    existingCol += j;
                } else {
                    existingRow += j;
                }
                
                // If positions overlap
                if (newRow === existingRow && newCol === existingCol) {
                    // They must have the same letter
                    if (newWordText[i] !== existingText[j]) {
                        return false;
                    }
                    // Different directions means proper intersection
                    if (newWord.direction !== existing.direction) {
                        hasIntersection = true;
                    }
                }
                
                // Check for parallel words too close (need at least 1 square gap)
                if (newWord.direction === existing.direction) {
                    const rowDiff = Math.abs(newRow - existingRow);
                    const colDiff = Math.abs(newCol - existingCol);
                    
                    if (newWord.direction === 'horizontal' && rowDiff === 1 && colDiff === 0) {
                        // Horizontal words too close vertically
                        return false;
                    }
                    if (newWord.direction === 'vertical' && colDiff === 1 && rowDiff === 0) {
                        // Vertical words too close horizontally
                        return false;
                    }
                }
            }
        }
    }
    
    // Must have at least one intersection (except for the first word)
    return layout.words.length === 0 || hasIntersection;
}

// Generate a simple fallback layout
function generateSimpleLayout(words) {
    // Create a proper crossword layout even as fallback
    const layout = { words: [] };
    
    // Place first word horizontally
    layout.words.push({ word: 0, row: 3, col: 0, direction: 'horizontal' });
    
    // Try to intersect second word
    if (words.length >= 2) {
        const common01 = findCommonLetters(words[0], words[1]);
        if (common01.length > 0) {
            const c = common01[0];
            layout.words.push({ 
                word: 1, 
                row: 3 - c.word2Index, 
                col: c.word1Index, 
                direction: 'vertical' 
            });
            
            // Try to add third word intersecting with one of the first two
            if (words.length >= 3) {
                let placed = false;
                
                // Try intersecting with first word
                const common02 = findCommonLetters(words[0], words[2]);
                if (common02.length > 0 && !placed) {
                    for (let c of common02) {
                        if (c.word1Index !== common01[0].word1Index) { // Different intersection point
                            layout.words.push({
                                word: 2,
                                row: 3 - c.word2Index,
                                col: c.word1Index,
                                direction: 'vertical'
                            });
                            placed = true;
                            break;
                        }
                    }
                }
                
                // Try intersecting with second word
                if (!placed) {
                    const common12 = findCommonLetters(words[1], words[2]);
                    if (common12.length > 0) {
                        const c = common12[0];
                        layout.words.push({
                            word: 2,
                            row: layout.words[1].row + c.word1Index,
                            col: layout.words[1].col - c.word2Index,
                            direction: 'horizontal'
                        });
                        placed = true;
                    }
                }
                
                // If still not placed, put it below with gap
                if (!placed) {
                    layout.words.push({ word: 2, row: 6, col: 0, direction: 'horizontal' });
                }
            }
            
            // Add fourth word
            if (words.length >= 4) {
                layout.words.push({ word: 3, row: 8, col: 2, direction: 'horizontal' });
            }
        } else {
            // No common letters, create a sparse layout
            layout.words.push({ word: 1, row: 0, col: 3, direction: 'vertical' });
            if (words.length >= 3) {
                layout.words.push({ word: 2, row: 6, col: 0, direction: 'horizontal' });
            }
            if (words.length >= 4) {
                layout.words.push({ word: 3, row: 3, col: 6, direction: 'vertical' });
            }
        }
    }
    
    // Calculate grid size
    let maxRow = 0, maxCol = 0;
    layout.words.forEach(wordInfo => {
        const word = words[wordInfo.word];
        if (wordInfo.direction === 'horizontal') {
            maxRow = Math.max(maxRow, wordInfo.row);
            maxCol = Math.max(maxCol, wordInfo.col + word.length - 1);
        } else {
            maxRow = Math.max(maxRow, wordInfo.row + word.length - 1);
            maxCol = Math.max(maxCol, wordInfo.col);
        }
    });
    
    gridSize = { rows: maxRow + 1, cols: maxCol + 1 };
    
    return layout;
}

function createGrid() {
    const newGrid = [];
    for (let r = 0; r < gridSize.rows; r++) {
        newGrid[r] = [];
        for (let c = 0; c < gridSize.cols; c++) {
            newGrid[r][c] = {
                letter: '',
                currentLetter: '',
                wordIndex: -1,
                letterIndex: -1,
                originalRow: r,
                originalCol: c
            };
        }
    }
    return newGrid;
}

function placeWordsInGrid(words, layout) {
    const newGrid = createGrid();
    
    layout.words.forEach(wordInfo => {
        const word = words[wordInfo.word];
        let row = wordInfo.row;
        let col = wordInfo.col;
        
        for (let i = 0; i < word.length; i++) {
            newGrid[row][col] = {
                letter: word[i],
                currentLetter: word[i],
                wordIndex: wordInfo.word,
                letterIndex: i,
                originalRow: row,
                originalCol: col
            };
            
            if (wordInfo.direction === 'horizontal') {
                col++;
            } else {
                row++;
            }
        }
    });
    
    return newGrid;
}

function findWordConnections() {
    // Find which words are connected (share adjacent cells)
    wordConnections = {};
    
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].wordIndex >= 0) {
                const wordIdx = grid[r][c].wordIndex;
                if (!wordConnections[wordIdx]) {
                    wordConnections[wordIdx] = new Set();
                }
                
                // Check all adjacent cells
                const directions = [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]];
                for (let [dr, dc] of directions) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length) {
                        if (grid[nr][nc].wordIndex >= 0 && grid[nr][nc].wordIndex !== wordIdx) {
                            wordConnections[wordIdx].add(grid[nr][nc].wordIndex);
                        }
                    }
                }
            }
        }
    }
}

function scrambleLetters() {
    // Collect all filled positions
    const filledPositions = [];
    const letters = [];
    
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter) {
                filledPositions.push({row: r, col: c});
                letters.push(grid[r][c].letter);
            }
        }
    }
    
    // Shuffle letters
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    
    // Place shuffled letters back
    filledPositions.forEach((pos, index) => {
        grid[pos.row][pos.col].currentLetter = letters[index];
    });
}

function renderCrossword() {
    const container = document.getElementById('crosswordGrid');
    container.innerHTML = '';
    
    // Create grid cells
    for (let r = 0; r < grid.length; r++) {
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
}

function getLetterColorClass(row, col) {
    const cell = grid[row][col];
    if (!cell.letter) return null;
    
    // Check if letter is in correct position
    if (cell.currentLetter === cell.letter) {
        return 'correct';
    }
    
    // Find where the current letter at this position should actually be
    let targetWordIndex = -1;
    let foundInSameWord = false;
    let foundInConnectedWord = false;
    
    // Look through all positions to find where this letter belongs
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter === cell.currentLetter) {
                targetWordIndex = grid[r][c].wordIndex;
                
                // Check if this letter belongs to the same word as the current position
                if (targetWordIndex === cell.wordIndex) {
                    foundInSameWord = true;
                }
                // Check if this letter belongs to a connected word
                else if (wordConnections[cell.wordIndex] && wordConnections[cell.wordIndex].has(targetWordIndex)) {
                    foundInConnectedWord = true;
                }
            }
        }
    }
    
    // Return appropriate color based on where the letter belongs
    if (foundInSameWord) {
        return 'wrong-position';
    } else if (foundInConnectedWord) {
        return 'connected-word';
    } else {
        return 'wrong-word';
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

function swapLetters(pos1, pos2) {
    // Add swapping animation
    const cell1 = document.querySelector(`.grid-cell[data-row="${pos1.row}"][data-col="${pos1.col}"]`);
    const cell2 = document.querySelector(`.grid-cell[data-row="${pos2.row}"][data-col="${pos2.col}"]`);
    
    cell1.classList.add('swapping');
    cell2.classList.add('swapping');
    
    // Swap the letters
    const temp = grid[pos1.row][pos1.col].currentLetter;
    grid[pos1.row][pos1.col].currentLetter = grid[pos2.row][pos2.col].currentLetter;
    grid[pos2.row][pos2.col].currentLetter = temp;
    
    // Update swap counter
    swapCount++;
    document.getElementById('swapCount').textContent = swapCount;
    
    // Re-render after animation
    setTimeout(() => {
        renderCrossword();
        
        // Check for victory
        if (checkVictory()) {
            setTimeout(showVictory, 300);
        }
    }, 500);
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
    
    // Select random headline
    currentHeadline = mockHeadlines[Math.floor(Math.random() * mockHeadlines.length)];
    
    // Generate crossword layout
    crosswordLayout = generateCrosswordLayout(currentHeadline.words);
    
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

// Start the game
initGame();
