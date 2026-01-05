// Debug Utils - Debug Panel and Development Tools
// Handles debug information display, grid state analysis, and development utilities

(function() {
'use strict';

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

// Expose debugInfo globally so other files can access it
window.debugInfo = debugInfo;
window.debugPanelVisible = debugPanelVisible;

// Debug Functions
function toggleDebugPanel() {
    debugPanelVisible = !debugPanelVisible;
    window.debugPanelVisible = debugPanelVisible; // Keep global in sync
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
        <strong>Source:</strong> ${currentHeadline.sourceName || currentHeadline.source || 'Unknown'}<br>
        <strong>Category:</strong> ${currentHeadline.category || 'N/A'}<br>
        <strong>Grid Size:</strong> ${gridSize.rows} × ${gridSize.cols}<br>
        <strong>Layout Score:</strong> ${debugInfo.layoutScore}
    `;
    
    // Update layout generation info
    document.getElementById('debugLayoutInfo').innerHTML = `
        <strong>Generation Time:</strong> ${debugInfo.generationTime}ms<br>
        <strong>Layout Attempts:</strong> ${debugInfo.layoutAttempts}<br>
        <strong>Words Placed:</strong> ${crosswordLayout ? crosswordLayout.words.length : 0}/${currentHeadline.words.length}
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
    
    // Update enhanced headline management info with pools
    updateHeadlinePoolsDebugInfo();
    
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

/**
 * Updates the headline pools debug information
 * Shows detailed information about scoring, pools, and filtering
 */
function updateHeadlinePoolsDebugInfo() {
    const debugElement = document.getElementById('debugHeadlineManagement');
    if (!debugElement) {
        console.log('Debug headline management element not found');
        return;
    }
    
    // Check if new headline management system is available
    if (typeof getPoolStatistics === 'function') {
        const poolStats = getPoolStatistics();
        const detailedInfo = getDetailedPoolInfo();
        const loadingState = typeof AsyncRSSFetcher !== 'undefined' ? AsyncRSSFetcher.getLoadingState() : null;
        const cacheInfo = typeof AsyncRSSFetcher !== 'undefined' ? AsyncRSSFetcher.getCacheInfo() : null;
        
        let html = `
            <div style="margin-bottom: 15px;">
                <strong>📊 Enhanced Headline Management System</strong><br>
                <strong>Initialized:</strong> <span class="${poolStats.initialized ? 'success' : 'error'}">${poolStats.initialized ? 'Yes' : 'No'}</span><br>
                <strong>Total Processed:</strong> ${poolStats.totalProcessed}<br>
                <strong>Valid Headlines:</strong> ${poolStats.totalValid}<br>
                <strong>Score Pools:</strong> ${poolStats.poolCount}<br>
                <strong>Used:</strong> ${poolStats.usedCount} | <strong>Rejected:</strong> ${poolStats.rejectedCount}
        `;
        
        if (poolStats.bestScore !== null) {
            html += `<br><strong>Best Score:</strong> ${poolStats.bestScore} | <strong>Worst Score:</strong> ${poolStats.worstScore}`;
        }
        
        html += `</div>`;
        
        // Loading and cache information
        if (loadingState) {
            html += `
                <div style="margin-bottom: 15px; padding: 8px; background: #f0f8ff; border: 1px solid #ddd; border-radius: 3px;">
                    <strong>🔄 Loading State:</strong><br>
                    <strong>Currently Loading:</strong> ${loadingState.isLoading ? 'Yes' : 'No'}<br>
                    <strong>Animation Showing:</strong> ${loadingState.showingAnimation ? 'Yes' : 'No'}<br>
                    <strong>Duration:</strong> ${loadingState.duration}ms
            `;
            
            if (cacheInfo) {
                html += `<br><strong>Cache Valid:</strong> ${cacheInfo.isValid ? 'Yes' : 'No'}`;
                if (cacheInfo.age) {
                    html += `<br><strong>Cache Age:</strong> ${Math.round(cacheInfo.age / 1000)}s`;
                }
                if (cacheInfo.expiresIn > 0) {
                    html += `<br><strong>Expires In:</strong> ${Math.round(cacheInfo.expiresIn / 1000)}s`;
                }
            }
            
            html += `</div>`;
        }
        
        // Score distribution
        if (poolStats.scoreDistribution && poolStats.scoreDistribution.length > 0) {
            html += `
                <div style="margin-bottom: 15px;">
                    <strong>📈 Score Distribution:</strong><br>
                    <div style="font-size: 11px; background: #f8f9fa; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">
            `;
            
            poolStats.scoreDistribution.forEach(pool => {
                const barWidth = Math.max(5, (pool.count / poolStats.totalValid) * 100);
                html += `
                    <div style="margin: 2px 0; display: flex; align-items: center;">
                        <span style="width: 40px; display: inline-block;">Score ${pool.score}:</span>
                        <div style="width: ${barWidth}%; height: 12px; background: ${pool.score === poolStats.bestScore ? '#4CAF50' : '#2196F3'}; margin-right: 5px;"></div>
                        <span>${pool.count} headlines</span>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }
        
        // Detailed pool contents
        if (detailedInfo && detailedInfo.pools && detailedInfo.pools.length > 0) {
            html += `
                <div style="margin-bottom: 15px;">
                    <strong>🎯 Pool Contents (Top 3 pools):</strong><br>
            `;
            
            const topPools = detailedInfo.pools.slice(0, 3);
            topPools.forEach((pool, index) => {
                const bgColor = index === 0 ? '#e8f5e8' : index === 1 ? '#fff3cd' : '#f8f9fa';
                html += `
                    <div style="margin: 8px 0; padding: 8px; background: ${bgColor}; border: 1px solid #ddd; border-radius: 3px;">
                        <strong>Score ${pool.score} (${pool.count} headlines):</strong><br>
                        <div style="max-height: 120px; overflow-y: auto; font-size: 10px; margin-top: 5px;">
                `;
                
                pool.headlines.slice(0, 5).forEach(headline => {
                    html += `
                        <div style="margin: 2px 0; padding: 2px; background: white; border-radius: 2px;">
                            <strong>"${headline.text}"</strong><br>
                            <span style="color: #666;">Words: ${headline.wordCount}</span>
                    `;
                    
                    // Add source information if available
                    if (headline.sourceName || headline.source) {
                        html += `<br><span style="color: #2196F3; font-size: 9px;">📡 ${headline.sourceName || headline.source}</span>`;
                    }
                    
                    if (headline.filterReasons && headline.filterReasons.length > 0) {
                        html += `<br><span style="color: #999; font-size: 9px;">Filtered: ${headline.filterReasons.length} items</span>`;
                    }
                    
                    html += `</div>`;
                });
                
                if (pool.headlines.length > 5) {
                    html += `<div style="text-align: center; color: #666; font-style: italic;">... and ${pool.headlines.length - 5} more</div>`;
                }
                
                html += `</div></div>`;
            });
            
            html += `</div>`;
        }
        
        // Current headline filtering details
        if (currentHeadline && typeof HeadlineScorer !== 'undefined') {
            const scoredHeadline = HeadlineScorer.scoreHeadline(currentHeadline);
            html += `
                <div style="margin-bottom: 15px; padding: 8px; background: #e8f5e8; border: 1px solid #ddd; border-radius: 3px;">
                    <strong>🎯 Current Headline Analysis:</strong><br>
                    <strong>Original:</strong> ${scoredHeadline.originalWords.join(' ')}<br>
                    <strong>Filtered:</strong> ${scoredHeadline.filteredWords.join(' ')}<br>
                    <strong>Score:</strong> ${scoredHeadline.score}<br>
                    <strong>Word Count:</strong> ${scoredHeadline.wordCount}
            `;
            
            if (scoredHeadline.filterReasons.length > 0) {
                html += `<br><strong>Filtering Applied:</strong><br>`;
                scoredHeadline.filterReasons.forEach(reason => {
                    html += `<span style="font-size: 10px; color: #666;">• ${reason.description}</span><br>`;
                });
            } else {
                html += `<br><span style="color: #4CAF50;">✅ Perfect headline - no filtering needed!</span>`;
            }
            
            html += `</div>`;
        }
        
        // Action buttons
        html += `
            <div style="margin-top: 10px;">
                <button onclick="refreshHeadlinePools()" style="background-color: #2196F3; color: white; padding: 6px 12px; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px;">
                    🔄 Refresh Pools
                </button>
                <button onclick="console.log('Pool Stats:', getPoolStatistics()); console.log('Detailed Info:', getDetailedPoolInfo());" style="background-color: #FF9800; color: white; padding: 6px 12px; border: none; border-radius: 3px; cursor: pointer;">
                    📋 Log to Console
                </button>
            </div>
        `;
        
        debugElement.innerHTML = html;
        
    } else {
        // Fallback to old system if new system not available
        debugElement.innerHTML = `
            <div style="color: #ff6b6b; padding: 10px; background: #ffe8e8; border: 1px solid #ffcdd2; border-radius: 3px;">
                <strong>⚠️ Legacy Headline System</strong><br>
                Enhanced headline management not yet initialized.<br>
                <small>The new scoring and pool system will be available after the next game initialization.</small>
            </div>
        `;
    }
}

// Initialize global debug utilities
window.__cosic = window.__cosic || {};

// Debug logging state - read from data.js config, default to false
let debugEnabled = (typeof debugConfig !== 'undefined' && debugConfig.enabled) || false;

// Helper function to format timestamp
function _formatTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
}

// prefixedLog: (prefix, messageOrArgs, opts)
// - prefix: string label shown inside brackets
// - messageOrArgs: string or array/varargs passed to console (what to output)
// - opts: { always, level } ONLY - controls behavior, never output as content
window.__cosic.prefixedLog = function(prefix, messageOrArgs, opts) {
    try {
        // Extract options - ONLY recognize objects that contain 'always' or 'level' properties
        // Everything else is treated as message content
        let o = {};
        if (opts && typeof opts === 'object' && !Array.isArray(opts)) {
            // Check if this looks like an options object (has options keys)
            if (opts.always !== undefined || opts.level !== undefined) {
                o = opts;
            }
            // Otherwise, opts is treated as content (strange but possible)
        }
        
        const always = !!o.always;
        const level = o.level || 'log'; // 'log', 'warn', or 'error'
        
        if (!always && !debugEnabled) return;
        
        const ts = _formatTimestamp();
        const effectivePrefix = prefix || 'debug';
        
        // Select console method based on level
        const consoleFn = (level === 'error') ? console.error : 
                        (level === 'warn') ? console.warn : 
                        console.log;
        
        // Add emoji indicators for visibility
        const levelIndicator = (level === 'error') ? '❌' : 
                              (level === 'warn') ? '⚠️' : 
                              '';
        
        const fullPrefix = levelIndicator ? `${levelIndicator} ${ts} [${effectivePrefix}]` : `${ts} [${effectivePrefix}]`;
        
        if (Array.isArray(messageOrArgs)) {
            consoleFn(fullPrefix, ...messageOrArgs);
        } else {
            // Single message or varargs (but NOT including opts)
            consoleFn(fullPrefix, messageOrArgs);
        }
    } catch (e) { /* noop */ }
};

// Very short alias for prefixedLog so modules can call a compact helper (e.g. __cosic.flog)
// Simple pass-through: flog(prefix, messageOrArgs, opts)
// - The SECOND argument (messageOrArgs) is ALWAYS what gets output
// - The THIRD argument (opts) is ALWAYS the control object { always, level, ... }
// - prefixedLog recognizes opts only by its properties (always, level) and ignores the rest
window.__cosic.flog = function(prefix, messageOrArgs, opts) {
    try {
        if (window.__cosic && typeof window.__cosic.prefixedLog === 'function') {
            return window.__cosic.prefixedLog(prefix, messageOrArgs, opts);
        }
    } catch (e) { /* noop */ }
};

// Expose debug functions globally
window.toggleDebugPanel = toggleDebugPanel;
window.updateDebugInfo = updateDebugInfo;

})();
