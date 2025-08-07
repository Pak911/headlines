// Game state
let currentHeadline = null;
let crosswordLayout = null;
let grid = [];
let correctGrid = [];
let swapCount = 0;
let selectedCell = null;
let gridSize = { rows: 0, cols: 0 };
let wordConnections = {};

// Headline management system
let availableHeadlines = [];
let usedHeadlines = [];
let rejectedHeadlines = [];

// Difficulty system (configuration moved to data.js)

// Debug state
let debugInfo = {
    layoutAttempts: 0,
    layoutScore: 0,
    rejectedHeadlines: [],
    alternativeHeadlines: [],
    compatibilityScores: {},
    generationTime: 0,
    shuffleInfo: {
        difficulty: 'medium',
        swapsPerformed: 0,
        minimumSolution: 0,
        intersectionsPreserved: 0,
        totalIntersections: 0
    }
};
let debugPanelVisible = false;

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
            // Validate layout connectivity, parallel spacing, and no end-to-end adjacency
            if (isLayoutConnected(layout, words) && 
                hasProperParallelSpacing(layout, words) && 
                hasNoEndToEndAdjacency(layout, words)) {
                const score = scoreLayout(layout, words);
                if (score < bestScore) {
                    bestScore = score;
                    bestLayout = layout;
                }
            }
        }
    }
    
    // If we couldn't generate a good layout, try simple layout
    if (bestLayout === null || bestLayout.words.length < words.length) {
        const simpleLayout = generateSimpleLayout(words);
        // Validate simple layout with all rules
        if (simpleLayout.words.length === words.length &&
            isLayoutConnected(simpleLayout, words) && 
            hasProperParallelSpacing(simpleLayout, words) &&
            hasNoEndToEndAdjacency(simpleLayout, words)) {
            normalizeLayout(simpleLayout, words);
            return simpleLayout;
        }
        // If even simple layout fails, reject this headline
        console.log(`Rejecting headline: words cannot form valid crossword layout`);
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

// Check if layout has no end-to-end adjacency (words forming continuous sequences)
function hasNoEndToEndAdjacency(layout, words) {
    for (let i = 0; i < layout.words.length; i++) {
        for (let j = i + 1; j < layout.words.length; j++) {
            const word1 = layout.words[i];
            const word2 = layout.words[j];
            const word1Text = words[word1.word];
            const word2Text = words[word2.word];
            
            // Only check words in the same direction
            if (word1.direction === word2.direction) {
                if (word1.direction === 'horizontal') {
                    // Check if words are on the same row
                    if (word1.row === word2.row) {
                        // Check if one word starts where the other ends
                        const word1End = word1.col + word1Text.length - 1;
                        const word2End = word2.col + word2Text.length - 1;
                        
                        // Word2 starts immediately after word1 ends OR overlaps
                        if (word2.col <= word1End + 1 && word2.col >= word1End) {
                            return false;
                        }
                        // Word1 starts immediately after word2 ends OR overlaps
                        if (word1.col <= word2End + 1 && word1.col >= word2End) {
                            return false;
                        }
                    }
                } else { // vertical
                    // Check if words are on the same column
                    if (word1.col === word2.col) {
                        // Check if one word starts where the other ends
                        const word1End = word1.row + word1Text.length - 1;
                        const word2End = word2.row + word2Text.length - 1;
                        
                        // Word2 starts immediately after word1 ends OR overlaps
                        if (word2.row <= word1End + 1 && word2.row >= word1End) {
                            return false;
                        }
                        // Word1 starts immediately after word2 ends OR overlaps
                        if (word1.row <= word2End + 1 && word1.row >= word2End) {
                            return false;
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
        
        // CRITICAL FIX: Check for end-to-end adjacency in same direction
        // This prevents words from forming one continuous word (e.g., PRICES + SURGE = PRICESURGE)
        if (newWord.direction === existing.direction) {
            if (newWord.direction === 'horizontal') {
                // Check if words are on the same row
                if (newWord.row === existing.row) {
                    // Check if new word starts where existing word ends (or vice versa)
                    const newWordEnd = newWord.col + newWordText.length - 1;
                    const existingWordEnd = existing.col + existingText.length - 1;
                    
                    // New word starts immediately after existing word ends
                    if (newWord.col === existingWordEnd + 1) {
                        return false;
                    }
                    // Existing word starts immediately after new word ends
                    if (existing.col === newWordEnd + 1) {
                        return false;
                    }
                }
            } else { // vertical
                // Check if words are on the same column
                if (newWord.col === existing.col) {
                    // Check if new word starts where existing word ends (or vice versa)
                    const newWordEnd = newWord.row + newWordText.length - 1;
                    const existingWordEnd = existing.row + existingText.length - 1;
                    
                    // New word starts immediately after existing word ends
                    if (newWord.row === existingWordEnd + 1) {
                        return false;
                    }
                    // Existing word starts immediately after new word ends
                    if (existing.row === newWordEnd + 1) {
                        return false;
                    }
                }
            }
        }
        
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
            const newPlacement = { 
                word: 1, 
                row: 3 - c.word2Index, 
                col: c.word1Index, 
                direction: 'vertical' 
            };
            
            // Validate placement before adding
            if (isValidPlacement(layout, newPlacement, words)) {
                layout.words.push(newPlacement);
                
                // Try to add third word intersecting with one of the first two
                if (words.length >= 3) {
                    let placed = false;
                    
                    // Try intersecting with first word
                    const common02 = findCommonLetters(words[0], words[2]);
                    if (common02.length > 0 && !placed) {
                        for (let c of common02) {
                            if (c.word1Index !== common01[0].word1Index) { // Different intersection point
                                const thirdPlacement = {
                                    word: 2,
                                    row: 3 - c.word2Index,
                                    col: c.word1Index,
                                    direction: 'vertical'
                                };
                                
                                if (isValidPlacement(layout, thirdPlacement, words)) {
                                    layout.words.push(thirdPlacement);
                                    placed = true;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Try intersecting with second word
                    if (!placed) {
                        const common12 = findCommonLetters(words[1], words[2]);
                        if (common12.length > 0) {
                            const c = common12[0];
                            const thirdPlacement = {
                                word: 2,
                                row: layout.words[1].row + c.word1Index,
                                col: layout.words[1].col - c.word2Index,
                                direction: 'horizontal'
                            };
                            
                            if (isValidPlacement(layout, thirdPlacement, words)) {
                                layout.words.push(thirdPlacement);
                                placed = true;
                            }
                        }
                    }
                    
                    // If still not placed, try placing it with proper spacing
                    if (!placed) {
                        // Try different positions with proper validation
                        const fallbackPlacements = [
                            { word: 2, row: 6, col: 0, direction: 'horizontal' },
                            { word: 2, row: 0, col: 6, direction: 'horizontal' },
                            { word: 2, row: 6, col: 3, direction: 'vertical' }
                        ];
                        
                        for (let placement of fallbackPlacements) {
                            if (isValidPlacement(layout, placement, words)) {
                                layout.words.push(placement);
                                placed = true;
                                break;
                            }
                        }
                    }
                }
                
                // Add fourth word with validation
                if (words.length >= 4) {
                    const fourthPlacements = [
                        { word: 3, row: 8, col: 2, direction: 'horizontal' },
                        { word: 3, row: 0, col: 8, direction: 'vertical' },
                        { word: 3, row: 6, col: 6, direction: 'horizontal' }
                    ];
                    
                    for (let placement of fourthPlacements) {
                        if (isValidPlacement(layout, placement, words)) {
                            layout.words.push(placement);
                            break;
                        }
                    }
                }
            } else {
                // If second word placement is invalid, try alternative layout
                const altPlacement = { word: 1, row: 0, col: 3, direction: 'vertical' };
                if (isValidPlacement(layout, altPlacement, words)) {
                    layout.words.push(altPlacement);
                }
            }
        } else {
            // No common letters, create a sparse layout with validation
            const sparsePlacements = [
                { word: 1, row: 0, col: 3, direction: 'vertical' },
                { word: 1, row: 6, col: 0, direction: 'horizontal' },
                { word: 1, row: 3, col: 8, direction: 'vertical' }
            ];
            
            for (let placement of sparsePlacements) {
                if (isValidPlacement(layout, placement, words)) {
                    layout.words.push(placement);
                    break;
                }
            }
            
            // Add remaining words with proper spacing
            if (words.length >= 3) {
                const thirdPlacements = [
                    { word: 2, row: 6, col: 0, direction: 'horizontal' },
                    { word: 2, row: 0, col: 6, direction: 'horizontal' },
                    { word: 2, row: 8, col: 3, direction: 'vertical' }
                ];
                
                for (let placement of thirdPlacements) {
                    if (isValidPlacement(layout, placement, words)) {
                        layout.words.push(placement);
                        break;
                    }
                }
            }
            
            if (words.length >= 4) {
                const fourthPlacements = [
                    { word: 3, row: 3, col: 6, direction: 'vertical' },
                    { word: 3, row: 9, col: 0, direction: 'horizontal' },
                    { word: 3, row: 0, col: 9, direction: 'vertical' }
                ];
                
                for (let placement of fourthPlacements) {
                    if (isValidPlacement(layout, placement, words)) {
                        layout.words.push(placement);
                        break;
                    }
                }
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
                wordIndices: [], // Changed to array to track multiple words at intersections
                letterIndices: {}, // Map of wordIndex -> letterIndex for each word
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
            // If cell already has a letter (intersection), add to existing word indices
            if (newGrid[row][col].letter) {
                newGrid[row][col].wordIndices.push(wordInfo.word);
                newGrid[row][col].letterIndices[wordInfo.word] = i;
            } else {
                // New cell
                newGrid[row][col] = {
                    letter: word[i],
                    currentLetter: word[i],
                    wordIndices: [wordInfo.word],
                    letterIndices: { [wordInfo.word]: i },
                    originalRow: row,
                    originalCol: col
                };
            }
            
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
    // Find which words are connected (only directly intersect - share cells with same letters)
    wordConnections = {};
    
    // Only find direct intersections (cells that belong to multiple words)
    // Adjacent words that merely touch should NOT be considered connected for purple coloring
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].wordIndices.length > 1) {
                // This cell is an intersection - all words here are directly connected
                for (let i = 0; i < grid[r][c].wordIndices.length; i++) {
                    const wordIdx1 = grid[r][c].wordIndices[i];
                    if (!wordConnections[wordIdx1]) {
                        wordConnections[wordIdx1] = new Set();
                    }
                    for (let j = 0; j < grid[r][c].wordIndices.length; j++) {
                        if (i !== j) {
                            const wordIdx2 = grid[r][c].wordIndices[j];
                            wordConnections[wordIdx1].add(wordIdx2);
                        }
                    }
                }
            }
        }
    }
}

// Identify intersection cells (cells that belong to multiple words)
function getIntersectionCells() {
    const intersections = [];
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter && grid[r][c].wordIndices.length > 1) {
                intersections.push({row: r, col: c});
            }
        }
    }
    return intersections;
}

// Get all cells that belong to a specific word
function getWordCells(wordIndex) {
    const cells = [];
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter && grid[r][c].wordIndices.includes(wordIndex)) {
                cells.push({row: r, col: c});
            }
        }
    }
    return cells;
}

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

// Count total filled cells and correct cells
function countCorrectCells() {
    let totalCells = 0;
    let correctCells = 0;
    
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter) {
                totalCells++;
                if (grid[r][c].letter === grid[r][c].currentLetter) {
                    correctCells++;
                }
            }
        }
    }
    
    return { totalCells, correctCells, percentage: totalCells > 0 ? (correctCells / totalCells) * 100 : 0 };
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
    
    // Phase 1: Aggressively reduce green percentage
    let attempts = 0;
    const maxAttempts = 200;
    
    while (attempts < maxAttempts && swapsPerformed < maxSwaps) {
        const stats = countCorrectCells();
        
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

// MEDIUM-EASY: Preserve about 50% of intersections (was Medium)
function scrambleMediumEasy(swapLog, intersections) {
    let swapsPerformed = 0;
    const maxSwaps = difficultySettings.mediumEasy.maxSwaps;
    
    // Decide which intersections to preserve (50%)
    const shuffledIntersections = [...intersections];
    for (let i = shuffledIntersections.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIntersections[i], shuffledIntersections[j]] = [shuffledIntersections[j], shuffledIntersections[i]];
    }
    
    const intersectionsToDisrupt = shuffledIntersections.slice(0, Math.floor(intersections.length * 0.5));
    
    // Disrupt selected intersections
    for (let intersection of intersectionsToDisrupt) {
        if (swapsPerformed >= maxSwaps) break;
        
        // Find cells to swap with (prefer non-intersections)
        const allCells = [];
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c].letter && (r !== intersection.row || c !== intersection.col)) {
                    allCells.push({row: r, col: c});
                }
            }
        }
        
        if (allCells.length > 0) {
            const randomCell = allCells[Math.floor(Math.random() * allCells.length)];
            performStrategicSwap(intersection, randomCell, swapLog);
            swapsPerformed++;
        }
    }
    
    // Perform additional strategic swaps
    while (swapsPerformed < maxSwaps) {
        const allCells = [];
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c].letter) {
                    allCells.push({row: r, col: c});
                }
            }
        }
        
        if (allCells.length >= 2) {
            const cell1 = allCells[Math.floor(Math.random() * allCells.length)];
            let cell2 = allCells[Math.floor(Math.random() * allCells.length)];
            
            // Ensure different cells
            let attempts = 0;
            while ((cell1.row === cell2.row && cell1.col === cell2.col) && attempts < 10) {
                cell2 = allCells[Math.floor(Math.random() * allCells.length)];
                attempts++;
            }
            
            if (cell1.row !== cell2.row || cell1.col !== cell2.col) {
                performStrategicSwap(cell1, cell2, swapLog);
                swapsPerformed++;
            } else {
                break; // Can't find valid swap
            }
        } else {
            break;
        }
    }
    
    return swapsPerformed;
}

// MEDIUM: Disrupt 75% of intersections, create swap chains (was Medium-Hard)
function scrambleMedium(swapLog, intersections) {
    let swapsPerformed = 0;
    const maxSwaps = difficultySettings.medium.maxSwaps;
    
    // Disrupt 75% of intersections
    const shuffledIntersections = [...intersections];
    for (let i = shuffledIntersections.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIntersections[i], shuffledIntersections[j]] = [shuffledIntersections[j], shuffledIntersections[i]];
    }
    
    const intersectionsToDisrupt = shuffledIntersections.slice(0, Math.floor(intersections.length * 0.75));
    
    // Create swap chains involving intersections
    for (let intersection of intersectionsToDisrupt) {
        if (swapsPerformed >= maxSwaps) break;
        
        // Find another intersection or important cell to create a chain
        const otherCells = [];
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c].letter && (r !== intersection.row || c !== intersection.col)) {
                    otherCells.push({row: r, col: c});
                }
            }
        }
        
        if (otherCells.length > 0) {
            const targetCell = otherCells[Math.floor(Math.random() * otherCells.length)];
            performStrategicSwap(intersection, targetCell, swapLog);
            swapsPerformed++;
        }
    }
    
    // Perform additional complex swaps
    while (swapsPerformed < maxSwaps) {
        const allCells = [];
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c].letter) {
                    allCells.push({row: r, col: c});
                }
            }
        }
        
        if (allCells.length >= 2) {
            // Prefer swapping cells from different words to create interdependencies
            const cell1 = allCells[Math.floor(Math.random() * allCells.length)];
            const cell1Words = grid[cell1.row][cell1.col].wordIndices;
            
            // Try to find a cell from a different word
            const differentWordCells = allCells.filter(cell => {
                const cellWords = grid[cell.row][cell.col].wordIndices;
                return !cellWords.some(wordIdx => cell1Words.includes(wordIdx)) &&
                       (cell.row !== cell1.row || cell.col !== cell1.col);
            });
            
            const cell2 = differentWordCells.length > 0 
                ? differentWordCells[Math.floor(Math.random() * differentWordCells.length)]
                : allCells[Math.floor(Math.random() * allCells.length)];
            
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
    
    return swapsPerformed;
}

// MEDIUM-HARD: Disrupt all intersections (was Hard)
function scrambleMediumHard(swapLog, intersections) {
    let swapsPerformed = 0;
    const maxSwaps = difficultySettings.mediumHard.maxSwaps;
    
    // Disrupt all intersections
    for (let intersection of intersections) {
        if (swapsPerformed >= maxSwaps) break;
        
        const allOtherCells = [];
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c].letter && (r !== intersection.row || c !== intersection.col)) {
                    allOtherCells.push({row: r, col: c});
                }
            }
        }
        
        if (allOtherCells.length > 0) {
            const randomCell = allOtherCells[Math.floor(Math.random() * allOtherCells.length)];
            performStrategicSwap(intersection, randomCell, swapLog);
            swapsPerformed++;
        }
    }
    
    // Create maximum complexity with strategic swaps
    while (swapsPerformed < maxSwaps) {
        const allCells = [];
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c].letter) {
                    allCells.push({row: r, col: c});
                }
            }
        }
        
        if (allCells.length >= 2) {
            // Create complex interdependencies
            const cell1 = allCells[Math.floor(Math.random() * allCells.length)];
            let cell2 = allCells[Math.floor(Math.random() * allCells.length)];
            
            // Ensure different cells
            let attempts = 0;
            while ((cell1.row === cell2.row && cell1.col === cell2.col) && attempts < 10) {
                cell2 = allCells[Math.floor(Math.random() * allCells.length)];
                attempts++;
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
    
    return swapsPerformed;
}

// HARD: Maximum chaos with complex swap chains and interdependencies
function scrambleHard(swapLog, intersections) {
    let swapsPerformed = 0;
    const maxSwaps = difficultySettings.hard.maxSwaps;
    
    // Phase 1: Disrupt ALL intersections with strategic targeting
    for (let intersection of intersections) {
        if (swapsPerformed >= maxSwaps) break;
        
        // Prefer swapping intersections with other intersections to create maximum chaos
        const otherIntersections = intersections.filter(other => 
            other.row !== intersection.row || other.col !== intersection.col
        );
        
        let targetCell;
        if (otherIntersections.length > 0 && Math.random() < 0.7) {
            // 70% chance to swap with another intersection
            targetCell = otherIntersections[Math.floor(Math.random() * otherIntersections.length)];
        } else {
            // Otherwise swap with any other cell
            const allOtherCells = [];
            for (let r = 0; r < grid.length; r++) {
                for (let c = 0; c < grid[r].length; c++) {
                    if (grid[r][c].letter && (r !== intersection.row || c !== intersection.col)) {
                        allOtherCells.push({row: r, col: c});
                    }
                }
            }
            if (allOtherCells.length > 0) {
                targetCell = allOtherCells[Math.floor(Math.random() * allOtherCells.length)];
            }
        }
        
        if (targetCell) {
            performStrategicSwap(intersection, targetCell, swapLog);
            swapsPerformed++;
        }
    }
    
    // Phase 2: Create complex swap chains across different words
    while (swapsPerformed < maxSwaps) {
        const allCells = [];
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c].letter) {
                    allCells.push({row: r, col: c});
                }
            }
        }
        
        if (allCells.length >= 2) {
            // Strategy: Create 3-way swaps and cross-word dependencies
            const cell1 = allCells[Math.floor(Math.random() * allCells.length)];
            const cell1Words = grid[cell1.row][cell1.col].wordIndices;
            
            // Find cells from completely different words to maximize complexity
            const differentWordCells = allCells.filter(cell => {
                const cellWords = grid[cell.row][cell.col].wordIndices;
                return !cellWords.some(wordIdx => cell1Words.includes(wordIdx)) &&
                       (cell.row !== cell1.row || cell.col !== cell1.col);
            });
            
            let cell2;
            if (differentWordCells.length > 0) {
                // Prefer cells from different words
                cell2 = differentWordCells[Math.floor(Math.random() * differentWordCells.length)];
            } else {
                // Fallback to any different cell
                const otherCells = allCells.filter(cell => 
                    cell.row !== cell1.row || cell.col !== cell1.col
                );
                if (otherCells.length > 0) {
                    cell2 = otherCells[Math.floor(Math.random() * otherCells.length)];
                }
            }
            
            if (cell2) {
                performStrategicSwap(cell1, cell2, swapLog);
                swapsPerformed++;
                
                // 30% chance to create a follow-up swap to form a chain
                if (Math.random() < 0.3 && swapsPerformed < maxSwaps) {
                    const chainCells = allCells.filter(cell => 
                        (cell.row !== cell1.row || cell.col !== cell1.col) &&
                        (cell.row !== cell2.row || cell.col !== cell2.col)
                    );
                    
                    if (chainCells.length > 0) {
                        const cell3 = chainCells[Math.floor(Math.random() * chainCells.length)];
                        // Swap one of the previous cells with a third cell
                        const swapTarget = Math.random() < 0.5 ? cell1 : cell2;
                        performStrategicSwap(swapTarget, cell3, swapLog);
                        swapsPerformed++;
                    }
                }
            } else {
                break; // Can't find valid swap
            }
        } else {
            break;
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

// Universal color determination functions that work with any compatible grid structure
function getLetterColorClass(row, col, gridData = null, connectionsData = null) {
    const targetGrid = gridData || grid;
    const targetConnections = connectionsData || wordConnections;
    
    const cell = targetGrid[row][col];
    if (!cell.letter) return null;
    
    // Handle both array-based wordIndices (main game) and single wordIndex (legacy test format)
    const wordIndices = Array.isArray(cell.wordIndices) ? cell.wordIndices : [cell.wordIndex];
    
    // For cells at intersections, we need to check ALL words they belong to
    // and return the highest priority color
    const colors = [];
    
    for (let wordIdx of wordIndices) {
        if (wordIdx >= 0) { // Valid word index
            const color = getLetterColorForWord(row, col, wordIdx, targetGrid, targetConnections);
            colors.push(color);
        }
    }
    
    // Priority order: correct > wrong-position > connected-word > wrong-word
    const priorityOrder = ['correct', 'wrong-position', 'connected-word', 'wrong-word'];
    
    for (let priority of priorityOrder) {
        if (colors.includes(priority)) {
            return priority;
        }
    }
    
    return 'wrong-word'; // Default fallback
}

function getLetterColorForWord(row, col, targetWordIndex, gridData = null, connectionsData = null) {
    const targetGrid = gridData || grid;
    const targetConnections = connectionsData || wordConnections;
    
    const cell = targetGrid[row][col];
    if (!cell || !cell.letter) return 'wrong-word';
    
    const currentLetter = cell.currentLetter;
    
    // Handle both array-based wordIndices (main game) and single wordIndex (legacy test format)
    const cellBelongsToTargetWord = Array.isArray(cell.wordIndices) 
        ? cell.wordIndices.includes(targetWordIndex)
        : cell.wordIndex === targetWordIndex;
    
    // STEP 1: Check if letter is in correct position for this word
    if (cellBelongsToTargetWord && cell.letter === currentLetter) {
        return 'correct';
    }
    
    // STEP 2: Check if this letter exists in the target word (Wordle-style duplicate logic)
    if (cellBelongsToTargetWord) {
        // Collect all positions where this letter should appear in the target word
        const letterPositions = [];
        for (let r = 0; r < targetGrid.length; r++) {
            for (let c = 0; c < targetGrid[r].length; c++) {
                if (!targetGrid[r][c] || !targetGrid[r][c].letter) continue;
                
                const cellBelongsToTarget = Array.isArray(targetGrid[r][c].wordIndices)
                    ? targetGrid[r][c].wordIndices.includes(targetWordIndex)
                    : targetGrid[r][c].wordIndex === targetWordIndex;
                    
                // Look for positions where the target letter (letter field) matches our current letter
                if (cellBelongsToTarget && targetGrid[r][c].letter === currentLetter) {
                    letterPositions.push({
                        row: r,
                        col: c,
                        isCorrect: targetGrid[r][c].currentLetter === currentLetter
                    });
                }
            }
        }
        
        // If we found positions where this letter should be, apply Wordle logic
        if (letterPositions.length > 0) {
            // Sort positions by grid order (row first, then column)
            letterPositions.sort((a, b) => a.row === b.row ? a.col - b.col : a.row - b.row);
            
            // Count how many instances of this letter are correctly placed
            const correctInstances = letterPositions.filter(pos => pos.isCorrect).length;
            
            // Find the current position in the sorted list
            const currentPosIndex = letterPositions.findIndex(pos => pos.row === row && pos.col === col);
            
            // Apply proper Wordle-style logic: only show orange if there are available instances
            // after accounting for all correctly placed letters
            const availableInstances = letterPositions.length - correctInstances;
            
            // Count wrong-position instances that come before this position
            let wrongPositionsBefore = 0;
            for (let i = 0; i < currentPosIndex; i++) {
                const pos = letterPositions[i];
                if (!pos.isCorrect) {
                    wrongPositionsBefore++;
                }
            }
            
            // This instance gets wrong-position color only if:
            // 1. It's not correctly placed, AND
            // 2. There are still available instances after accounting for wrong positions before it
            if (currentPosIndex >= 0 && !letterPositions[currentPosIndex].isCorrect && wrongPositionsBefore < availableInstances) {
                return 'wrong-position';
            } else if (currentPosIndex < 0 && wrongPositionsBefore < availableInstances) {
                // This position is not in the target word, but the letter exists elsewhere in the word
                return 'wrong-position';
            }
        }
    }
    
    // STEP 3: Check if letter belongs to a directly connected word
    // A word is directly connected if it shares an intersection with the target word
    // IMPORTANT: Only count letters that are NOT already correctly placed anywhere in the connected word
    let belongsToConnectedWord = false;
    
    // Check if this letter belongs to any word that directly intersects with target word
    for (let r = 0; r < targetGrid.length; r++) {
        for (let c = 0; c < targetGrid[r].length; c++) {
            // Check if this cell contains the target letter (correct letter for this position)
            if (targetGrid[r][c].letter === currentLetter) {
                
                // Get all word indices for this cell
                const cellWordIndices = Array.isArray(targetGrid[r][c].wordIndices)
                    ? targetGrid[r][c].wordIndices
                    : [targetGrid[r][c].wordIndex];
                
                // Check each word this cell belongs to
                for (let otherWordIdx of cellWordIndices) {
                    if (otherWordIdx !== targetWordIndex && otherWordIdx >= 0) {
                        
                        // Check if this other word is connected to target word
                        const connections = targetConnections[targetWordIndex] || targetConnections.get?.(targetWordIndex);
                        const isConnected = connections && 
                            (connections.has ? connections.has(otherWordIdx) : connections.includes && connections.includes(otherWordIdx));
                        
                        if (isConnected) {
                            // Apply same Wordle-style logic for connected word
                            const connectedLetterPositions = [];
                            for (let rr = 0; rr < targetGrid.length; rr++) {
                                for (let cc = 0; cc < targetGrid[rr].length; cc++) {
                                    const cellBelongsToOther = Array.isArray(targetGrid[rr][cc].wordIndices)
                                        ? targetGrid[rr][cc].wordIndices.includes(otherWordIdx)
                                        : targetGrid[rr][cc].wordIndex === otherWordIdx;
                                        
                                    if (cellBelongsToOther && targetGrid[rr][cc].letter === currentLetter) {
                                        connectedLetterPositions.push({
                                            row: rr,
                                            col: cc,
                                            isCorrect: targetGrid[rr][cc].currentLetter === currentLetter
                                        });
                                    }
                                }
                            }
                            
                            // Sort positions by grid order
                            connectedLetterPositions.sort((a, b) => a.row === b.row ? a.col - b.col : a.row - b.row);
                            
                            // Count correctly placed instances in connected word
                            const correctInConnected = connectedLetterPositions.filter(pos => pos.isCorrect).length;
                            
                            // Only count this as "belongs to connected word" if there are still
                            // available instances of this letter in the connected word
                            if (correctInConnected < connectedLetterPositions.length) {
                                belongsToConnectedWord = true;
                                break;
                            }
                        }
                    }
                }
            }
            if (belongsToConnectedWord) break;
        }
        if (belongsToConnectedWord) break;
    }
    
    if (belongsToConnectedWord) {
        return 'connected-word';
    }
    
    // STEP 4: Letter doesn't belong to target word or connected words
    return 'wrong-word';
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
    
    // Update swap counter immediately
    swapCount++;
    document.getElementById('swapCount').textContent = swapCount;
    
    // Swap the letters in the middle of the animation (after first 180 degrees)
    setTimeout(() => {
        // Swap the letters in the grid data
        const temp = grid[pos1.row][pos1.col].currentLetter;
        grid[pos1.row][pos1.col].currentLetter = grid[pos2.row][pos2.col].currentLetter;
        grid[pos2.row][pos2.col].currentLetter = temp;
        
        // Update the text content of the cells immediately
        cell1.textContent = grid[pos1.row][pos1.col].currentLetter;
        cell2.textContent = grid[pos2.row][pos2.col].currentLetter;
    }, 250); // Half of the 500ms animation duration
    
    // Re-render after full animation completes
    setTimeout(() => {
        renderCrossword();
        
        // Update debug panel if visible
        if (debugPanelVisible) {
            updateGridStateCode();
        }
        
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

// Debug Functions
function toggleDebugPanel() {
    debugPanelVisible = !debugPanelVisible;
    const panel = document.getElementById('debugPanel');
    panel.style.display = debugPanelVisible ? 'block' : 'none';
    
    if (debugPanelVisible) {
        updateDebugInfo();
    }
}

function updateDebugInfo() {
    // Update current headline info
    document.getElementById('debugCurrentHeadline').innerHTML = `
        <strong>Text:</strong> ${currentHeadline.text}<br>
        <strong>Words:</strong> ${currentHeadline.words.join(', ')}<br>
        <strong>Grid Size:</strong> ${gridSize.rows} × ${gridSize.cols}<br>
        <strong>Layout Score:</strong> ${debugInfo.layoutScore}
    `;
    
    // Update layout generation info
    document.getElementById('debugLayoutInfo').innerHTML = `
        <strong>Generation Time:</strong> ${debugInfo.generationTime}ms<br>
        <strong>Layout Attempts:</strong> ${debugInfo.layoutAttempts}<br>
        <strong>Words Placed:</strong> ${crosswordLayout ? crosswordLayout.words.length : 0}/${currentHeadline.words.length}<br>
        <strong>Connected:</strong> <span class="${crosswordLayout && isLayoutConnected(crosswordLayout, currentHeadline.words) ? 'success' : 'error'}">${crosswordLayout && isLayoutConnected(crosswordLayout, currentHeadline.words) ? 'Yes' : 'No'}</span><br>
        <strong>Proper Spacing:</strong> <span class="${crosswordLayout && hasProperParallelSpacing(crosswordLayout, currentHeadline.words) ? 'success' : 'error'}">${crosswordLayout && hasProperParallelSpacing(crosswordLayout, currentHeadline.words) ? 'Yes' : 'No'}</span>
    `;
    
    // Update shuffle/difficulty info
    const shuffleInfo = debugInfo.shuffleInfo;
    document.getElementById('debugShuffleInfo').innerHTML = `
        <strong>Current Difficulty:</strong> ${difficultySettings[shuffleInfo.difficulty].name}<br>
        <strong>Swaps Performed:</strong> ${shuffleInfo.swapsPerformed}<br>
        <strong>Minimum Solution:</strong> ${shuffleInfo.minimumSolution} swaps<br>
        <strong>Intersections:</strong> ${shuffleInfo.intersectionsPreserved}/${shuffleInfo.totalIntersections} preserved<br>
        <strong>Difficulty Range:</strong> ${difficultySettings[shuffleInfo.difficulty].minSwaps}-${difficultySettings[shuffleInfo.difficulty].maxSwaps} swaps
    `;
    
    // Update headline management info
    const validHeadlines = availableHeadlines.filter(headline => 
        !usedHeadlines.some(used => used.text === headline.text) &&
        !rejectedHeadlines.some(rejected => rejected.text === headline.text)
    );
    
    document.getElementById('debugHeadlineManagement').innerHTML = `
        <strong>Available Headlines:</strong> ${validHeadlines.length}/${mockHeadlines.length}<br>
        <strong>Used Headlines:</strong> ${usedHeadlines.length}<br>
        <strong>Rejected Headlines:</strong> ${rejectedHeadlines.length}<br>
        <br>
        <strong>Remaining Headlines:</strong><br>
        <div style="max-height: 150px; overflow-y: auto; font-size: 11px; background: #f8f9fa; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">
            ${validHeadlines.length > 0 
                ? validHeadlines.map(h => `"${h.text}"`).join('<br>')
                : '<em>No headlines remaining - will refill on next game</em>'
            }
        </div>
        <br>
        <strong>Used Headlines:</strong><br>
        <div style="max-height: 100px; overflow-y: auto; font-size: 11px; background: #e8f5e8; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">
            ${usedHeadlines.length > 0 
                ? usedHeadlines.map(h => `"${h.text}"`).join('<br>')
                : '<em>None used yet</em>'
            }
        </div>
        <br>
        <strong>Rejected Headlines:</strong><br>
        <div style="max-height: 100px; overflow-y: auto; font-size: 11px; background: #ffe8e8; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">
            ${rejectedHeadlines.length > 0 
                ? rejectedHeadlines.map(h => `"${h.text}"`).join('<br>')
                : '<em>None rejected yet</em>'
            }
        </div>
    `;
    
    // Generate alternative headlines
    generateAlternativeHeadlines();
    
    // Update alternatives info
    const alternativesHtml = debugInfo.alternativeHeadlines.length > 0 
        ? `<ul class="debug-list">${debugInfo.alternativeHeadlines.map(alt => 
            `<li><strong>${alt.text}</strong><br>
             <small>Compatibility: ${alt.compatibility}% | Common Letters: ${alt.commonLetters}</small></li>`
          ).join('')}</ul>`
        : '<em>No compatible alternatives found</em>';
    
    document.getElementById('debugAlternatives').innerHTML = alternativesHtml;
    
    // Update compatibility analysis
    const compatibilityHtml = Object.keys(debugInfo.compatibilityScores).length > 0
        ? `<ul class="debug-list">${Object.entries(debugInfo.compatibilityScores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([headline, score]) => 
                `<li><strong>${headline}</strong><br>
                 <small>Score: ${score}%</small></li>`
            ).join('')}</ul>`
        : '<em>Compatibility analysis in progress...</em>';
    
    document.getElementById('debugCompatibility').innerHTML = compatibilityHtml;
    
    // Update grid state code
    updateGridStateCode();
    
}

function updateGridStateCode() {
    // Check if elements exist before trying to update them
    const htmlElement = document.getElementById('gridStateCode');
    const jsElement = document.getElementById('gridStateJSCode');
    
    if (!htmlElement || !jsElement) {
        console.log('Debug panel elements not found, skipping grid state code update');
        return;
    }
    
    // Step 1: Find the bounds of filled cells
    let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
    const filledCells = [];
    
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter) {
                filledCells.push({row: r, col: c, cell: grid[r][c]});
                minRow = Math.min(minRow, r);
                maxRow = Math.max(maxRow, r);
                minCol = Math.min(minCol, c);
                maxCol = Math.max(maxCol, c);
            }
        }
    }
    
    // Step 2: Calculate offset to move to top-left corner
    const rowOffset = minRow;
    const colOffset = minCol;
    
    // Step 3: Generate normalized cell data with proper word mapping
    const normalizedCells = [];
    const cellWordMappings = new Map(); // Map of "row,col" -> array of {wordIndex, letterIndex}
    
    for (let cellData of filledCells) {
        const newRow = cellData.row - rowOffset;
        const newCol = cellData.col - colOffset;
        
        // Only include cells that fit in 10x10 grid
        if (newRow < 10 && newCol < 10) {
            const key = `${newRow},${newCol}`;
            cellWordMappings.set(key, []);
            
            // Find ALL words that contain this position (for intersections)
            for (let i = 0; i < crosswordLayout.words.length; i++) {
                const wordInfo = crosswordLayout.words[i];
                const word = currentHeadline.words[wordInfo.word];
                
                for (let j = 0; j < word.length; j++) {
                    let wordRow = wordInfo.row;
                    let wordCol = wordInfo.col;
                    
                    if (wordInfo.direction === 'horizontal') {
                        wordCol += j;
                    } else {
                        wordRow += j;
                    }
                    
                    if (wordRow === cellData.row && wordCol === cellData.col) {
                        cellWordMappings.get(key).push({
                            wordIndex: wordInfo.word,
                            letterIndex: j
                        });
                    }
                }
            }
            
            normalizedCells.push({
                row: newRow,
                col: newCol,
                letter: cellData.cell.letter,
                currentLetter: cellData.cell.currentLetter,
                wordMappings: cellWordMappings.get(key)
            });
        }
    }
    
    // Step 4: Generate next test case number
    const nextTestNumber = getNextTestCaseNumber();
    const testName = `test${nextTestNumber}`;
    
    // Step 5: Generate HTML code for new test case section
    const htmlLines = [];
    htmlLines.push(`<div class="test-case">`);
    htmlLines.push(`    <h3>Test Case ${nextTestNumber}: ${currentHeadline.text}</h3>`);
    htmlLines.push(`    <p>Words: ${currentHeadline.words.join(', ')}</p>`);
    htmlLines.push(`    <div id="${testName}Container" class="test-grid"></div>`);
    htmlLines.push(`    <div style="margin-top: 15px;">`);
    htmlLines.push(`        <button onclick="generateSingleTestOutput('${testName}', 'Test Case ${nextTestNumber}: ${currentHeadline.text}')" style="background-color: #4a90e2; color: white; padding: 8px 16px; border: none; border-radius: 3px; cursor: pointer; font-size: 14px;">`);
    htmlLines.push(`            Generate Text Output for LLM`);
    htmlLines.push(`        </button>`);
    htmlLines.push(`        <div id="textOutput${nextTestNumber}" style="display: none; margin-top: 10px; padding: 10px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 3px;">`);
    htmlLines.push(`            <h5>Text Output for LLM Analysis:</h5>`);
    htmlLines.push(`            <textarea id="textContent${nextTestNumber}" style="width: 100%; height: 200px; font-family: monospace; font-size: 12px; border: 1px solid #ccc; padding: 8px;" readonly></textarea>`);
    htmlLines.push(`            <button onclick="copySingleToClipboard('textContent${nextTestNumber}')" style="margin-top: 8px; background-color: #28a745; color: white; padding: 6px 12px; border: none; border-radius: 3px; cursor: pointer;">`);
    htmlLines.push(`                Copy to Clipboard`);
    htmlLines.push(`            </button>`);
    htmlLines.push(`        </div>`);
    htmlLines.push(`    </div>`);
    htmlLines.push(`</div>`);
    
    const htmlCode = htmlLines.join('\n');
    
    // Step 6: Generate JavaScript code using new setCell format
    const jsLines = [];
    jsLines.push(`// Test Case ${nextTestNumber}: ${currentHeadline.text}`);
    jsLines.push(`// Words: ${currentHeadline.words.join(', ')}`);
    jsLines.push('');
    jsLines.push(`const ${testName} = new TestGrid();`);
    jsLines.push('');
    
    // Sort cells by row, then by column for consistent output
    normalizedCells.sort((a, b) => a.row === b.row ? a.col - b.col : a.row - b.row);
    
    // Generate setCell calls for each word in each cell
    const setCellCalls = [];
    for (let cellData of normalizedCells) {
        // For each word that this cell belongs to, generate a setCell call
        for (let mapping of cellData.wordMappings) {
            setCellCalls.push({
                row: cellData.row,
                col: cellData.col,
                letter: cellData.letter,
                currentLetter: cellData.currentLetter,
                wordIndex: mapping.wordIndex,
                letterIndex: mapping.letterIndex
            });
        }
    }
    
    // Sort setCell calls by word index, then by letter index for logical ordering
    setCellCalls.sort((a, b) => {
        if (a.wordIndex !== b.wordIndex) return a.wordIndex - b.wordIndex;
        return a.letterIndex - b.letterIndex;
    });
    
    // Add comments for each word
    let currentWordIndex = -1;
    for (let call of setCellCalls) {
        if (call.wordIndex !== currentWordIndex) {
            currentWordIndex = call.wordIndex;
            const wordText = currentHeadline.words[call.wordIndex];
            jsLines.push(`// Set up ${wordText.toUpperCase()} (word ${call.wordIndex})`);
        }
        
        jsLines.push(`${testName}.setCell(${call.row}, ${call.col}, '${call.letter}', '${call.currentLetter}', ${call.wordIndex}, ${call.letterIndex});`);
    }
    
    jsLines.push('');
    jsLines.push('// Set up word connections automatically');
    jsLines.push(`${testName}.setWordConnections();`);
    
    jsLines.push('');
    jsLines.push(`renderTestGrid('${testName}Container', ${testName});`);
    jsLines.push('');
    jsLines.push('// Store test grid globally for text output function');
    jsLines.push(`window.${testName} = ${testName};`);
    
    const jsCode = jsLines.join('\n');
    
    // Update the HTML section
    htmlElement.value = htmlCode;
    
    // Update the JavaScript section  
    jsElement.value = jsCode;
}


function getNextTestCaseNumber() {
    // This function would ideally read the test.html file to find the highest test number
    // For now, we'll use a simple counter or timestamp-based approach
    const now = new Date();
    const timestamp = now.getHours().toString().padStart(2, '0') + 
                     now.getMinutes().toString().padStart(2, '0') + 
                     now.getSeconds().toString().padStart(2, '0');
    return timestamp; // This creates unique test case numbers like test154521
}

function copyGridState() {
    const textarea = document.getElementById('gridStateCode');
    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        
        // Show feedback
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#2196F3';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#4CAF50';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy to clipboard. Please select the text manually and copy.');
    }
}

function copyGridStateJS() {
    const textarea = document.getElementById('gridStateJSCode');
    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        
        // Show feedback
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#4CAF50';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#2196F3';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy to clipboard. Please select the text manually and copy.');
    }
}


function generateAlternativeHeadlines() {
    debugInfo.alternativeHeadlines = [];
    debugInfo.compatibilityScores = {};
    
    // Analyze each headline for compatibility with current layout
    mockHeadlines.forEach(headline => {
        if (headline.text === currentHeadline.text) return;
        
        const compatibility = calculateHeadlineCompatibility(headline, currentHeadline);
        debugInfo.compatibilityScores[headline.text] = Math.round(compatibility * 100);
        
        if (compatibility > 0.3) { // Only show reasonably compatible headlines
            const commonLetters = countCommonLetters(headline.words, currentHeadline.words);
            debugInfo.alternativeHeadlines.push({
                text: headline.text,
                words: headline.words,
                compatibility: Math.round(compatibility * 100),
                commonLetters: commonLetters
            });
        }
    });
    
    // Sort by compatibility
    debugInfo.alternativeHeadlines.sort((a, b) => b.compatibility - a.compatibility);
    debugInfo.alternativeHeadlines = debugInfo.alternativeHeadlines.slice(0, 8); // Top 8
}

function calculateHeadlineCompatibility(headline1, headline2) {
    let totalCompatibility = 0;
    let comparisons = 0;
    
    // Compare each word in headline1 with each word in headline2
    for (let word1 of headline1.words) {
        for (let word2 of headline2.words) {
            const commonLetters = findCommonLetters(word1, word2);
            const compatibility = commonLetters.length / Math.max(word1.length, word2.length);
            totalCompatibility += compatibility;
            comparisons++;
        }
    }
    
    // Average compatibility
    const avgCompatibility = comparisons > 0 ? totalCompatibility / comparisons : 0;
    
    // Bonus for similar word count
    const wordCountBonus = 1 - Math.abs(headline1.words.length - headline2.words.length) * 0.1;
    
    // Bonus for similar total letter count
    const totalLetters1 = headline1.words.join('').length;
    const totalLetters2 = headline2.words.join('').length;
    const letterCountBonus = 1 - Math.abs(totalLetters1 - totalLetters2) * 0.01;
    
    return avgCompatibility * wordCountBonus * letterCountBonus;
}

function countCommonLetters(words1, words2) {
    const letters1 = words1.join('').split('').sort();
    const letters2 = words2.join('').split('').sort();
    
    let common = 0;
    let i = 0, j = 0;
    
    while (i < letters1.length && j < letters2.length) {
        if (letters1[i] === letters2[j]) {
            common++;
            i++;
            j++;
        } else if (letters1[i] < letters2[j]) {
            i++;
        } else {
            j++;
        }
    }
    
    return common;
}

// Initialize headline management system
function initializeHeadlineManagement() {
    // If availableHeadlines is empty, refill it with all headlines
    if (availableHeadlines.length === 0) {
        console.log('Refilling available headlines list');
        availableHeadlines = [...mockHeadlines];
        // Clear used and rejected lists when starting fresh
        usedHeadlines = [];
        rejectedHeadlines = [];
    }
}

// Get next available headline (excluding used and rejected ones)
function getNextHeadline() {
    initializeHeadlineManagement();
    
    // Filter out used and rejected headlines
    const validHeadlines = availableHeadlines.filter(headline => 
        !usedHeadlines.some(used => used.text === headline.text) &&
        !rejectedHeadlines.some(rejected => rejected.text === headline.text)
    );
    
    if (validHeadlines.length === 0) {
        console.log('No more valid headlines available, refilling list');
        // Reset the system - start over with all headlines
        availableHeadlines = [...mockHeadlines];
        usedHeadlines = [];
        rejectedHeadlines = [];
        return availableHeadlines[Math.floor(Math.random() * availableHeadlines.length)];
    }
    
    // Select random headline from valid ones
    const selectedHeadline = validHeadlines[Math.floor(Math.random() * validHeadlines.length)];
    console.log(`Selected headline: "${selectedHeadline.text}"`);
    console.log(`Remaining available: ${validHeadlines.length - 1}, Used: ${usedHeadlines.length}, Rejected: ${rejectedHeadlines.length}`);
    
    return selectedHeadline;
}

// Mark headline as used (successfully created a puzzle)
function markHeadlineAsUsed(headline) {
    if (!usedHeadlines.some(used => used.text === headline.text)) {
        usedHeadlines.push(headline);
        console.log(`Marked headline as used: "${headline.text}"`);
    }
}

// Mark headline as rejected (failed layout validation)
function markHeadlineAsRejected(headline) {
    if (!rejectedHeadlines.some(rejected => rejected.text === headline.text)) {
        rejectedHeadlines.push(headline);
        console.log(`Marked headline as rejected: "${headline.text}"`);
    }
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

// Start the game only if we're on the main game page (not test page)
if (document.getElementById('crosswordGrid')) {
    enhancedInitGame();
}
