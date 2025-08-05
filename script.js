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

// Score a layout based on compactness and intersections
function scoreLayout(layout, words) {
    if (layout.words.length === 0) return 0;
    
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
    
    // Calculate area (smaller is better)
    const width = maxCol - minCol + 1;
    const height = maxRow - minRow + 1;
    const area = width * height;
    
    // Prefer more square layouts (penalize long skinny grids)
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    const aspectPenalty = aspectRatio > 2 ? (aspectRatio - 2) * 20 : 0;
    
    // Count intersections (more is better)
    let intersectionCount = 0;
    const occupiedPositions = new Map(); // Map of position -> set of word indices
    
    layout.words.forEach(wordInfo => {
        const word = words[wordInfo.word];
        for (let i = 0; i < word.length; i++) {
            let row = wordInfo.row;
            let col = wordInfo.col;
            if (wordInfo.direction === 'horizontal') {
                col += i;
            } else {
                row += i;
            }
            const key = `${row},${col}`;
            if (!occupiedPositions.has(key)) {
                occupiedPositions.set(key, new Set());
            }
            occupiedPositions.get(key).add(wordInfo.word);
        }
    });
    
    // Count positions with multiple words (intersections)
    for (let [position, wordSet] of occupiedPositions) {
        if (wordSet.size > 1) {
            intersectionCount += wordSet.size - 1;
        }
    }
    
    // Bonus for words that cross multiple other words
    let multiCrossBonus = 0;
    let wordsWithMultipleCrossings = 0;
    layout.words.forEach(wordInfo => {
        const word = words[wordInfo.word];
        let crosses = 0;
        for (let i = 0; i < word.length; i++) {
            let row = wordInfo.row;
            let col = wordInfo.col;
            if (wordInfo.direction === 'horizontal') {
                col += i;
            } else {
                row += i;
            }
            const key = `${row},${col}`;
            const wordSet = occupiedPositions.get(key);
            if (wordSet && wordSet.size > 1) {
                crosses += wordSet.size - 1;
            }
        }
        if (crosses > 1) {
            multiCrossBonus += crosses;
            wordsWithMultipleCrossings++;
        }
    });
    
    // Bonus for layouts where words cross multiple other words
    const multiCrossingBonus = wordsWithMultipleCrossings * 15;
    
    // Lower score is better (we want smaller area)
    // But we want to reward intersections and multi-crossings
    return area + aspectPenalty - (intersectionCount * 8) - (multiCrossBonus * 3) - multiCrossingBonus;
}

// Generate multiple layout variations and return the best one
function generateCrosswordLayout(words) {
    const maxAttempts = 50;
    let bestLayout = null;
    let bestScore = Infinity;
    
    // Try multiple starting positions and configurations
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const layout = tryGenerateLayout(words, attempt);
        if (layout.words.length === words.length) { // Only consider complete layouts
            // Validate layout connectivity and parallel spacing
            if (isLayoutConnected(layout, words) && hasProperParallelSpacing(layout, words)) {
                const score = scoreLayout(layout, words);
                if (score < bestScore) {
                    bestScore = score;
                    bestLayout = layout;
                }
            }
        }
    }
    
    // If we couldn't generate a good layout, fall back to simple layout
    if (bestLayout === null || bestLayout.words.length < words.length) {
        const simpleLayout = generateSimpleLayout(words);
        // Validate simple layout too
        if (isLayoutConnected(simpleLayout, words) && hasProperParallelSpacing(simpleLayout, words)) {
            normalizeLayout(simpleLayout, words);
            return simpleLayout;
        }
        // If even simple layout fails, we might need to reject this caption
        return null;
    }
    
    // Normalize the best layout
    normalizeLayout(bestLayout, words);
    return bestLayout;
}

// Score a potential word placement
function scoreWordPlacement(layout, placement, words) {
    // Create a temporary layout with this placement added
    const tempLayout = { words: [...layout.words, placement] };
    return scoreLayout(tempLayout, words);
}

// Try to generate a layout with different starting conditions
function tryGenerateLayout(words, attempt) {
    const layout = { words: [] };
    const placed = new Set();
    
    // Different starting strategies based on attempt number
    const startStrategies = [
        // Strategy 1: Start in middle
        () => ({ row: 5, col: 2 }),
        // Strategy 2: Start at origin
        () => ({ row: 0, col: 0 }),
        // Strategy 3: Start with offset
        () => ({ row: 3, col: 3 }),
        // Strategy 4: Start with larger offset
        () => ({ row: 10, col: 5 })
    ];
    
    const strategy = startStrategies[attempt % startStrategies.length];
    const startPos = strategy();
    
    // Place first word
    layout.words.push({
        word: 0,
        row: startPos.row,
        col: startPos.col,
        direction: attempt % 2 === 0 ? 'horizontal' : 'vertical'
    });
    placed.add(0);
    
    // Try to place remaining words
    let maxIterations = words.length * 30; // Increased iterations for better exploration
    let iterations = 0;
    
    while (placed.size < words.length && iterations < maxIterations) {
        iterations++;
        
        // Try each unplaced word
        for (let i = 0; i < words.length; i++) {
            if (placed.has(i)) continue;
            
            // Try to intersect with all already placed words
            const placements = [];
            
            for (let placedIdx of placed) {
                const placedWord = layout.words.find(w => w.word === placedIdx);
                const commonLetters = findCommonLetters(words[placedIdx], words[i]);
                
                // Try all common letters, not just a random one
                commonLetters.forEach(common => {
                    let newPlacement;
                    
                    if (placedWord.direction === 'horizontal') {
                        // Place new word vertically
                        newPlacement = {
                            word: i,
                            row: placedWord.row - common.word2Index,
                            col: placedWord.col + common.word1Index,
                            direction: 'vertical'
                        };
                    } else {
                        // Place new word horizontally
                        newPlacement = {
                            word: i,
                            row: placedWord.row + common.word1Index,
                            col: placedWord.col - common.word2Index,
                            direction: 'horizontal'
                        };
                    }
                    
                    // Check if placement is valid
                    if (isValidPlacement(layout, newPlacement, words)) {
                        placements.push({
                            placement: newPlacement,
                            score: scoreWordPlacement(layout, newPlacement, words)
                        });
                    }
                });
            }
            
            // Sort placements by score (lower is better)
            placements.sort((a, b) => a.score - b.score);
            
            // If we found valid placements, try to pick the best one that maximizes intersections
            if (placements.length > 0) {
                // Try up to 3 best placements to see which one works best
                let bestPlacement = null;
                let bestTempScore = Infinity;
                
                for (let j = 0; j < Math.min(3, placements.length); j++) {
                    const tempLayout = { words: [...layout.words, placements[j].placement] };
                    const tempScore = scoreLayout(tempLayout, words);
                    if (tempScore < bestTempScore) {
                        bestTempScore = tempScore;
                        bestPlacement = placements[j].placement;
                    }
                }
                
                if (bestPlacement) {
                    layout.words.push(bestPlacement);
                    placed.add(i);
                    break; // Move to next iteration to try placing other words
                }
            }
        }
    }
    
    return layout;
}

// Normalize layout positions to start from padding
function normalizeLayout(layout, words) {
    if (layout.words.length === 0) return;
    
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
}

// Check if all words in a layout are connected (form a single component)
function isLayoutConnected(layout, words) {
    if (layout.words.length <= 1) return true;
    
    // Build adjacency graph
    const graph = new Map();
    layout.words.forEach((wordInfo, index) => {
        graph.set(index, new Set());
    });
    
    // Connect words that intersect or are adjacent
    for (let i = 0; i < layout.words.length; i++) {
        for (let j = i + 1; j < layout.words.length; j++) {
            if (doWordsIntersect(layout.words[i], layout.words[j], words)) {
                graph.get(i).add(j);
                graph.get(j).add(i);
            }
        }
    }
    
    // Check if all words are reachable from the first word (BFS)
    const visited = new Set();
    const queue = [0];
    visited.add(0);
    
    while (queue.length > 0) {
        const current = queue.shift();
        for (let neighbor of graph.get(current)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
    
    // All words should be visited (connected)
    return visited.size === layout.words.length;
}

// Check if parallel words have proper spacing (at least 1 square gap)
function hasProperParallelSpacing(layout, words) {
    for (let i = 0; i < layout.words.length; i++) {
        for (let j = i + 1; j < layout.words.length; j++) {
            const word1 = layout.words[i];
            const word2 = layout.words[j];
            const word1Text = words[word1.word];
            const word2Text = words[word2.word];
            
            // Only check parallel words (same direction)
            if (word1.direction === word2.direction) {
                // Get all positions for both words
                const positions1 = [];
                const positions2 = [];
                
                for (let k = 0; k < word1Text.length; k++) {
                    let row = word1.row;
                    let col = word1.col;
                    if (word1.direction === 'horizontal') {
                        col += k;
                    } else {
                        row += k;
                    }
                    positions1.push({row, col});
                }
                
                for (let k = 0; k < word2Text.length; k++) {
                    let row = word2.row;
                    let col = word2.col;
                    if (word2.direction === 'horizontal') {
                        col += k;
                    } else {
                        row += k;
                    }
                    positions2.push({row, col});
                }
                
                // Check if words are too close
                for (let pos1 of positions1) {
                    for (let pos2 of positions2) {
                        if (word1.direction === 'horizontal') {
                            // Horizontal words: check vertical distance
                            if (pos1.col === pos2.col && Math.abs(pos1.row - pos2.row) === 1) {
                                return false; // Words are adjacent vertically
                            }
                        } else {
                            // Vertical words: check horizontal distance
                            if (pos1.row === pos2.row && Math.abs(pos1.col - pos2.col) === 1) {
                                return false; // Words are adjacent horizontally
                            }
                        }
                    }
                }
            }
        }
    }
    return true;
}

// Check if two words intersect (share a cell with the same letter)
function doWordsIntersect(word1, word2, words) {
    const word1Text = words[word1.word];
    const word2Text = words[word2.word];
    
    // Get all positions for both words
    const positions1 = new Map(); // position -> letter
    const positions2 = new Map(); // position -> letter
    
    for (let i = 0; i < word1Text.length; i++) {
        let row = word1.row;
        let col = word1.col;
        if (word1.direction === 'horizontal') {
            col += i;
        } else {
            row += i;
        }
        positions1.set(`${row},${col}`, word1Text[i]);
    }
    
    for (let i = 0; i < word2Text.length; i++) {
        let row = word2.row;
        let col = word2.col;
        if (word2.direction === 'horizontal') {
            col += i;
        } else {
            row += i;
        }
        positions2.set(`${row},${col}`, word2Text[i]);
    }
    
    // Check for proper intersections (same letter at same position)
    for (let [pos, letter1] of positions1) {
        if (positions2.has(pos)) {
            const letter2 = positions2.get(pos);
            if (letter1 === letter2) {
                return true; // Proper intersection with same letter
            }
        }
    }
    
    return false;
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

// Start the game
initGame();
