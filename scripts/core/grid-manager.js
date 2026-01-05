// Grid Manager - Grid Creation and Word Placement
// Handles grid data structure and word placement logic

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('grid-manager', message, options);
    } else {
        // Fallback if debug.js not loaded yet
        console.log('[grid-manager]', message);
    }
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

// Expose functions globally
window.placeWordsInGrid = placeWordsInGrid;
window.findWordConnections = findWordConnections;
window.getIntersectionCells = getIntersectionCells;
window.countCorrectCells = countCorrectCells;

})();
