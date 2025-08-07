// Color Logic - Letter Color Determination
// Handles Wordle-style color coding for letters in crossword cells

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
