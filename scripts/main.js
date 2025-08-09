// Main Script - Entry Point and Global State Management
// Coordinates all modules and manages global game state

// Global game state variables
let currentHeadline = null;
let crosswordLayout = null;
let grid = [];
let correctGrid = [];
let swapCount = 0;
let selectedCell = null;
let gridSize = { rows: 0, cols: 0 };
let wordConnections = {};

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

// Enhanced initialization that also resets word completion tracking
async function enhancedInitGameWithReset() {
    // Reset completed words tracking
    if (typeof resetCompletedWords === 'function') {
        resetCompletedWords();
    }
    
    // Call the original enhanced init game
    if (typeof enhancedInitGame === 'function') {
        await enhancedInitGame();
    } else if (typeof initGame === 'function') {
        initGame();
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the main game page (not test page)
    if (document.getElementById('crosswordGrid')) {
        // Use the enhanced initialization that resets word tracking
        enhancedInitGameWithReset();
    }
});
