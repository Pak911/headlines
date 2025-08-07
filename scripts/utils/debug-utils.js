// Debug Utils - Debug Panel and Development Tools
// Handles debug information display, grid state analysis, and development utilities

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
