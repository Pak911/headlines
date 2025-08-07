// UI Interactions - Cell Selection, Swapping, and Rendering
// Handles user interface interactions and visual feedback

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
