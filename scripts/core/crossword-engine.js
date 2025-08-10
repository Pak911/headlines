// Crossword Engine - Layout Generation and Validation
// Handles crossword layout creation, scoring, and validation

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
            // Validate layout connectivity, parallel spacing, no end-to-end adjacency, proper non-intersecting spacing, valid letter sharing, and each word having shared letters
            if (isLayoutConnected(layout, words) && 
                hasProperParallelSpacing(layout, words) && 
                hasNoEndToEndAdjacency(layout, words) &&
                hasProperNonIntersectingSpacing(layout, words) &&
                hasValidLetterSharing(layout, words) &&
                doesEachWordHaveSharedLetter(layout, words)) {
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
            hasNoEndToEndAdjacency(simpleLayout, words) &&
            hasProperNonIntersectingSpacing(simpleLayout, words) &&
            hasValidLetterSharing(simpleLayout, words) &&
            doesEachWordHaveSharedLetter(simpleLayout, words)) {
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

// Check if non-intersecting words have proper spacing (at least 2 squares apart)
function hasProperNonIntersectingSpacing(layout, words) {
    for (let i = 0; i < layout.words.length; i++) {
        for (let j = i + 1; j < layout.words.length; j++) {
            const word1 = layout.words[i];
            const word2 = layout.words[j];
            
            // Check if words intersect
            if (!doWordsIntersect(word1, word2, words)) {
                // Non-intersecting words must have proper spacing
                if (!hasMinimumDistance(word1, word2, words, 2)) {
                    return false;
                }
            }
        }
    }
    return true;
}

// Check if two words have minimum distance between their letters
function hasMinimumDistance(word1, word2, words, minDistance) {
    const word1Text = words[word1.word];
    const word2Text = words[word2.word];
    
    // Get all positions for both words
    const positions1 = [];
    const positions2 = [];
    
    for (let i = 0; i < word1Text.length; i++) {
        let row = word1.row;
        let col = word1.col;
        if (word1.direction === 'horizontal') {
            col += i;
        } else {
            row += i;
        }
        positions1.push({row, col});
    }
    
    for (let i = 0; i < word2Text.length; i++) {
        let row = word2.row;
        let col = word2.col;
        if (word2.direction === 'horizontal') {
            col += i;
        } else {
            row += i;
        }
        positions2.push({row, col});
    }
    
    // Check minimum distance between all letter positions
    for (let pos1 of positions1) {
        for (let pos2 of positions2) {
            const distance = Math.max(
                Math.abs(pos1.row - pos2.row),
                Math.abs(pos1.col - pos2.col)
            );
            if (distance < minDistance) {
                return false;
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

// Check if two words share more than one letter (invalid for crosswords)
function doWordsShareMultipleLetters(word1, word2, words) {
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
    
    // Count intersections (shared positions with same letters)
    let intersectionCount = 0;
    for (let [pos, letter1] of positions1) {
        if (positions2.has(pos)) {
            const letter2 = positions2.get(pos);
            if (letter1 === letter2) {
                intersectionCount++;
                if (intersectionCount > 1) {
                    return true; // More than one shared letter - invalid
                }
            }
        }
    }
    
    return false; // At most one shared letter - valid
}

// Check if layout has valid letter sharing (no two words share more than one letter)
function hasValidLetterSharing(layout, words) {
    for (let i = 0; i < layout.words.length; i++) {
        for (let j = i + 1; j < layout.words.length; j++) {
            if (doWordsShareMultipleLetters(layout.words[i], layout.words[j], words)) {
                return false; // Found words sharing multiple letters
            }
        }
    }
    return true; // All word pairs share at most one letter
}

// Check if each word in the layout has at least one shared letter with another word
function doesEachWordHaveSharedLetter(layout, words) {
    // Single word or empty layout is valid by default
    if (layout.words.length <= 1) return true;
    
    // For each word, check if it shares at least one letter with another word
    for (let i = 0; i < layout.words.length; i++) {
        let hasSharedLetter = false;
        
        // Check against all other words
        for (let j = 0; j < layout.words.length; j++) {
            if (i !== j) {
                // Check if word i shares at least one letter with word j
                if (doWordsShareAnyLetter(layout.words[i], layout.words[j], words)) {
                    hasSharedLetter = true;
                    break; // Found at least one shared letter, no need to check other words
                }
            }
        }
        
        // If this word doesn't share any letters with other words, layout is invalid
        if (!hasSharedLetter) {
            return false;
        }
    }
    
    return true; // All words have at least one shared letter
}

// Check if two words share any letter (at least one intersection)
function doWordsShareAnyLetter(word1, word2, words) {
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
    
    // Check for any intersections (shared positions with same letters)
    for (let [pos, letter1] of positions1) {
        if (positions2.has(pos)) {
            const letter2 = positions2.get(pos);
            if (letter1 === letter2) {
                return true; // Found shared letter
            }
        }
    }
    
    return false; // No shared letters found
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
    
    // Check if this placement would create multiple shared letters with any existing word
    for (let existing of layout.words) {
        // Create temporary word placements to check letter sharing
        const tempLayout = { words: [...layout.words, newWord] };
        if (doWordsShareMultipleLetters(newWord, existing, words)) {
            return false; // Would create multiple shared letters - invalid
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
