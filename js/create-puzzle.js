/**
 * CREATE PUZZLE - Custom Puzzle Creator
 * Allows users to create custom crossword puzzles and generate shareable links
 */

// Global variables needed for crossword engine and grid manager
let grid = [];
let gridSize = { rows: 0, cols: 0 };
let crosswordLayout = null;
let previewGridSolved = []; // Separate grid for solved preview
let previewGridUnsolved = []; // Separate grid for unsolved preview

// DOM Elements (initialized later)
let headlineInput, cleanedWordsDisplay, hintInput, headlineError, hintError, langIndicator;
let previewBtn, previewArea, linkArea, previewGridContainer;
let shareLinkInput, copyBtn, statWords, statLang, statDiff;
let difficultyDropdown, difficultySelectBtn, difficultyText, difficultyDropdownPanel;

// State
let currentLang = null; // 'en' or 'ru'
let cleanedWordsArray = []; // Stores the final processed words
let selectedDifficulty = typeof currentDifficulty !== 'undefined' ? currentDifficulty : 'medium'; // Default difficulty

// Constants
const MIN_WORDS = 5;
const MIN_WORD_LENGTH = 4;

// Regex for language detection
const REGEX_EN = /^[a-zA-Z]+$/;
const REGEX_RU = /^[а-яА-Я]+$/;

/**
 * Initialize DOM elements and event listeners
 */
function initializeDOMElements() {
    headlineInput = document.getElementById('headlineInput');
    cleanedWordsDisplay = document.getElementById('cleanedWordsDisplay');
    hintInput = document.getElementById('hintInput');
    headlineError = document.getElementById('headlineError');
    hintError = document.getElementById('hintError');
    langIndicator = document.getElementById('langIndicator');
    previewBtn = document.getElementById('previewBtn');
    previewArea = document.getElementById('previewArea');
    linkArea = document.getElementById('linkArea');
    previewGridContainer = document.getElementById('previewGridContainer');
    shareLinkInput = document.getElementById('shareLinkInput');
    copyBtn = document.getElementById('copyBtn');
    statWords = document.getElementById('statWords');
    statLang = document.getElementById('statLang');
    statDiff = document.getElementById('statDiff');
    difficultyDropdown = document.getElementById('difficultyDropdown');
    difficultySelectBtn = document.getElementById('difficultySelectBtn');
    difficultyText = document.getElementById('difficultyText');
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Initialize DOM elements first
    initializeDOMElements();
    
    headlineInput.addEventListener('input', () => {
        resetUI();
        validateHeadline();
        // Re-validate hint dynamically if user has started typing it
        if (hintInput.value.trim().length > 0) {
            validateHint(false);
        }
    });

    hintInput.addEventListener('input', () => {
        resetUI();
        validateHint(false);
    });

    previewBtn.addEventListener('click', handlePreview);
    copyBtn.addEventListener('click', copyToClipboard);
    
    // Initialize difficulty dropdown
    initDifficultyDropdown();
}

/**
 * Validate headline input
 * @param {boolean} showUiErrors - Whether to show error messages in UI
 * @returns {boolean} - Whether validation passed
 */
function validateHeadline(showUiErrors = false) {
    let text = headlineInput.value;
    
    // 1. Normalize: Replace ё with е for Russian consistency
    text = text.replace(/ё/g, 'е').replace(/Ё/g, 'Е');
    
    // 2. Strict Filtering: Remove everything EXCEPT letters (Eng/Rus) and spaces
    const cleanText = text.replace(/[^a-zA-Zа-яА-Я\s]/g, '');

    // 3. Tokenize
    cleanedWordsArray = cleanText.trim().split(/\s+/).filter(w => w.length > 0);

    // 4. Update Visual Display (Colored Badges)
    if (cleanedWordsArray.length > 0) {
        const badgesHTML = cleanedWordsArray.map(word => {
            const len = word.length;
            const isValidLen = len >= MIN_WORD_LENGTH;
            const badgeClass = isValidLen ? 'word-valid' : 'word-invalid';
            return `
                <div class="word-badge ${badgeClass}">
                    ${word}
                    <span class="word-length-indicator">${len}</span>
                </div>
            `;
        }).join('');

        cleanedWordsDisplay.innerHTML = `
            <span class="cleaned-label">${t('createPuzzle.wordAnalysisLabel')}</span>
            <div class="words-wrapper">${badgesHTML}</div>
        `;
        cleanedWordsDisplay.classList.add('visible');
    } else {
        cleanedWordsDisplay.classList.remove('visible');
    }

    // 5. Check Word Count
    if (cleanedWordsArray.length < MIN_WORDS) {
        if (showUiErrors) {
            showError(headlineError, t('createPuzzle.errors.minWords', cleanedWordsArray.length).replace('{count}', MIN_WORDS).replace('{current}', cleanedWordsArray.length));
        }
        return false;
    }

    // 6. Check Word Length
    const shortWords = cleanedWordsArray.filter(w => w.length < MIN_WORD_LENGTH);
    if (shortWords.length > 0) {
        if (showUiErrors) {
            showError(headlineError, t('createPuzzle.errors.shortWords', shortWords.length).replace('{count}', shortWords.length));
        }
        return false;
    }

    // 7. Check Language Consistency
    const joinedWords = cleanedWordsArray.join('');
    const isEn = REGEX_EN.test(joinedWords);
    const isRu = REGEX_RU.test(joinedWords);

    if (isEn && !isRu) {
        currentLang = 'en';
        if (langIndicator) langIndicator.textContent = t('createPuzzle.language.english');
    } else if (isRu && !isEn) {
        currentLang = 'ru';
        if (langIndicator) langIndicator.textContent = t('createPuzzle.language.russian');
    } else if (!isEn && !isRu && joinedWords.length > 0) {
        if (showUiErrors) {
            showError(headlineError, t('createPuzzle.errors.mixedLanguages'));
        }
        if (langIndicator) langIndicator.textContent = t('createPuzzle.language.mixed');
        return false;
    } else {
        currentLang = null;
    }

    hideError(headlineError);
    return true;
}

/**
 * Validate hint input
 * @param {boolean} isStrictVerify - Whether this is a strict verification (show all errors)
 * @returns {boolean} - Whether validation passed
 */
function validateHint(isStrictVerify = false) {
    const hintVal = hintInput.value.trim();
    const hintWords = hintVal.split(/\s+/).filter(w => w.length > 0);
    const requiredWords = 2 * cleanedWordsArray.length;

    hideError(hintError);

    // 1. Check Empty
    if (hintWords.length === 0) {
        if (isStrictVerify) {
            showError(hintError, t('createPuzzle.errors.noHint'));
        }
        return false;
    }

    // 2. Check Length Ratio
    if (cleanedWordsArray.length > 0 && hintWords.length < requiredWords) {
        showError(hintError, t('createPuzzle.errors.hintTooShort').replace('{hintWords}', hintWords.length).replace('{required}', requiredWords));
        return false;
    }

    return true;
}

/**
 * Handle preview button click
 */
function handlePreview() {
    // 1. Validate Headline
    const isHeadlineValid = validateHeadline(true);
    
    // 2. Validate Hint
    const isHintValid = validateHint(true);

    if (isHeadlineValid && isHintValid) {
        // SIMULATE ENGINE CALL (mock for Phase 1)
        simulateGridGeneration();
    }
}

/**
 * Simulate grid generation (mock for Phase 1)
 */
function simulateGridGeneration() {
    // Re-query DOM elements to ensure we have fresh references after localization
    const freshStatWords = document.getElementById('statWords');
    const freshStatLang = document.getElementById('statLang');
    const freshStatDiff = document.getElementById('statDiff');
    
    // Update statistics with fresh references
    if (freshStatWords) freshStatWords.textContent = cleanedWordsArray.length;
    if (freshStatLang) freshStatLang.textContent = currentLang === 'en' ? t('createPuzzle.language.english') : t('createPuzzle.language.russian');
    if (freshStatDiff) freshStatDiff.textContent = t(`difficulty.${selectedDifficulty}.name`);

    // Generate real crossword layout
    const normalizedWords = cleanedWordsArray.map(word => 
        word.replace(/Ё/g, 'Е').replace(/ё/g, 'е')
    );
    
    crosswordLayout = window.generateCrosswordLayout(normalizedWords);
    
    if (!crosswordLayout) {
        showError(headlineError, t('createPuzzle.errors.layoutFailed'));
        return;
    }
    
    // Create grid from layout
    grid = window.placeWordsInGrid(normalizedWords, crosswordLayout);
    
    // Create SOLVED preview grid (deep copy)
    previewGridSolved = createDeepCopyOfGrid(grid);
    
    // Create UNSOLVED preview grid (deep copy + scramble)
    previewGridUnsolved = createDeepCopyOfGrid(grid);
    applyDifficultyToPreviewGrid(previewGridUnsolved, selectedDifficulty);
    
    // Show preview area and render grids
    previewArea.style.display = 'block';
    previewGridContainer.style.display = 'block';
    
    // Render both crossword grids
    renderPreviewGrids();
    
    // Automatically generate and show the link
    generateLink();
    
    // Update unsolved grid title
    updateUnsolvedGridTitle();
    
    // Scroll to preview
    previewArea.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Create a deep copy of the grid
 */
function createDeepCopyOfGrid(sourceGrid) {
    const copy = [];
    for (let r = 0; r < sourceGrid.length; r++) {
        copy[r] = [];
        for (let c = 0; c < sourceGrid[r].length; c++) {
            if (sourceGrid[r][c].letter) {
                copy[r][c] = {
                    letter: sourceGrid[r][c].letter,
                    currentLetter: sourceGrid[r][c].currentLetter,
                    wordIndices: [...sourceGrid[r][c].wordIndices]
                };
            } else {
                copy[r][c] = { letter: null, currentLetter: null, wordIndices: [] };
            }
        }
    }
    return copy;
}

/**
 * Apply difficulty scrambling to preview grid
 */
function applyDifficultyToPreviewGrid(previewGrid, difficulty) {
    // Get difficulty settings
    const settings = typeof difficultySettings !== 'undefined' && difficultySettings[difficulty] 
        ? difficultySettings[difficulty] 
        : { minSwaps: 10, maxSwaps: 60 };
    
    // For easy difficulty, only scramble within words
    if (difficulty === 'easy') {
        scrambleEasyPreview(previewGrid, settings);
    } else {
        // For other difficulties, do random swaps
        scrambleRandomPreview(previewGrid, settings);
    }
}

/**
 * Easy mode: Only swap within individual words, keep intersections intact
 */
function scrambleEasyPreview(previewGrid, settings) {
    let swapsPerformed = 0;
    const maxSwaps = settings.maxSwaps;
    
    // For each word, perform internal swaps
    for (let wordIndex = 0; wordIndex < cleanedWordsArray.length; wordIndex++) {
        const wordCells = getWordCellsForPreview(previewGrid, wordIndex);
        const nonIntersectionCells = wordCells.filter(cell => 
            previewGrid[cell.row][cell.col].wordIndices.length === 1
        );
        
        if (nonIntersectionCells.length >= 2) {
            // Perform 1-2 swaps within this word
            const swapsInWord = Math.min(2, Math.floor(nonIntersectionCells.length / 2));
            for (let i = 0; i < swapsInWord && swapsPerformed < maxSwaps; i++) {
                const shuffled = [...nonIntersectionCells];
                // Fisher-Yates shuffle
                for (let j = shuffled.length - 1; j > 0; j--) {
                    const k = Math.floor(Math.random() * (j + 1));
                    [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
                }
                
                if (shuffled.length >= 2) {
                    const cell1 = shuffled[0];
                    const cell2 = shuffled[1];
                    
                    // Swap currentLetter values
                    const temp = previewGrid[cell1.row][cell1.col].currentLetter;
                    previewGrid[cell1.row][cell1.col].currentLetter = previewGrid[cell2.row][cell2.col].currentLetter;
                    previewGrid[cell2.row][cell2.col].currentLetter = temp;
                    swapsPerformed++;
                }
            }
        }
    }
}

/**
 * Random scrambling for medium/hard difficulties
 */
function scrambleRandomPreview(previewGrid, settings) {
    // Collect all filled cells
    const filledCells = [];
    for (let r = 0; r < previewGrid.length; r++) {
        for (let c = 0; c < previewGrid[r].length; c++) {
            if (previewGrid[r][c].letter) {
                filledCells.push({ row: r, col: c });
            }
        }
    }
    
    if (filledCells.length < 2) return;
    
    const swapsNeeded = Math.max(settings.minSwaps, Math.floor(filledCells.length * 0.6));
    let swapsPerformed = 0;
    
    for (let i = 0; i < swapsNeeded && swapsPerformed < settings.maxSwaps; i++) {
        const idx1 = Math.floor(Math.random() * filledCells.length);
        let idx2 = Math.floor(Math.random() * filledCells.length);
        
        let attempts = 0;
        while (idx1 === idx2 && attempts < 10) {
            idx2 = Math.floor(Math.random() * filledCells.length);
            attempts++;
        }
        
        if (idx1 !== idx2) {
            const cell1 = filledCells[idx1];
            const cell2 = filledCells[idx2];
            
            const temp = previewGrid[cell1.row][cell1.col].currentLetter;
            previewGrid[cell1.row][cell1.col].currentLetter = previewGrid[cell2.row][cell2.col].currentLetter;
            previewGrid[cell2.row][cell2.col].currentLetter = temp;
            
            swapsPerformed++;
        }
    }
}

/**
 * Get all cells that belong to a specific word in preview grid
 */
function getWordCellsForPreview(previewGrid, wordIndex) {
    const cells = [];
    for (let r = 0; r < previewGrid.length; r++) {
        for (let c = 0; c < previewGrid[r].length; c++) {
            if (previewGrid[r][c].letter && previewGrid[r][c].wordIndices.includes(wordIndex)) {
                cells.push({row: r, col: c});
            }
        }
    }
    return cells;
}

/**
 * Build word connections map (which words intersect with which)
 */
function buildWordConnectionsForPreview(gridRef) {
    const connections = {};
    
    for (let r = 0; r < gridRef.length; r++) {
        for (let c = 0; c < gridRef[r].length; c++) {
            const cell = gridRef[r][c];
            if (cell.letter && cell.wordIndices.length > 1) {
                // This is an intersection
                for (let word1 of cell.wordIndices) {
                    if (!connections[word1]) connections[word1] = [];
                    for (let word2 of cell.wordIndices) {
                        if (word1 !== word2 && !connections[word1].includes(word2)) {
                            connections[word1].push(word2);
                        }
                    }
                }
            }
        }
    }
    
    return connections;
}

/**
 * Render both preview grids (unsolved and solved)
 */
function renderPreviewGrids() {
    renderSinglePreviewGrid(previewGridUnsolved, 'unsolvedGrid', true);  // Color-coded
    renderSinglePreviewGrid(previewGridSolved, 'solvedGrid', false);     // All green
}

/**
 * Render a single preview crossword grid
 */
function renderSinglePreviewGrid(gridData, containerId, useColorCoding = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!gridData || !gridData.length) return;
    
    // Find the first and last rows that contain letters
    let firstFilledRow = -1;
    let lastFilledRow = -1;
    
    for (let r = 0; r < gridData.length; r++) {
        for (let c = 0; c < gridData[r].length; c++) {
            if (gridData[r][c].letter) {
                if (firstFilledRow === -1) {
                    firstFilledRow = r;
                }
                lastFilledRow = r;
                break;
            }
        }
    }
    
    // If no filled rows found, render normally
    if (firstFilledRow === -1) {
        firstFilledRow = 0;
        lastFilledRow = gridData.length - 1;
    }
    
    // Add a small buffer (1 row before and after)
    const startRow = Math.max(0, firstFilledRow - 1);
    const endRow = Math.min(gridData.length - 1, lastFilledRow + 1);
    
    // Create grid cells only for the relevant rows
    for (let r = startRow; r <= endRow; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid-row';
        
        for (let c = 0; c < gridData[r].length; c++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            if (gridData[r][c].letter) {
                cell.className += ' filled';
                
                if (useColorCoding) {
                    // Use the game's actual color determination function
                    const wordConnectionsForPreview = buildWordConnectionsForPreview(gridData);
                    const colorClass = window.getLetterColorClass(r, c, gridData, wordConnectionsForPreview);
                    if (colorClass) {
                        cell.className += ' ' + colorClass;
                    }
                } else {
                    // All green for solved puzzle
                    cell.className += ' correct';
                }
                
                cell.textContent = gridData[r][c].currentLetter;
            } else {
                cell.className += ' empty';
            }
            
            rowDiv.appendChild(cell);
        }
        
        container.appendChild(rowDiv);
    }
    
    // Fit grid to screen
    fitGridToScreen();
}

/**
 * Render preview crossword grid (all cells shown as correct/green)
 * DEPRECATED - keeping for backwards compatibility
 */
function renderPreviewGrid() {
    const container = document.getElementById('crosswordGrid');
    container.innerHTML = '';
    
    if (!grid || !grid.length) return;
    
    // Find the first and last rows that contain letters
    let firstFilledRow = -1;
    let lastFilledRow = -1;
    
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].letter) {
                if (firstFilledRow === -1) {
                    firstFilledRow = r;
                }
                lastFilledRow = r;
                break;
            }
        }
    }
    
    // If no filled rows found, render normally
    if (firstFilledRow === -1) {
        firstFilledRow = 0;
        lastFilledRow = grid.length - 1;
    }
    
    // Add a small buffer (1 row before and after)
    const startRow = Math.max(0, firstFilledRow - 1);
    const endRow = Math.min(grid.length - 1, lastFilledRow + 1);
    
    // Create grid cells only for the relevant rows
    for (let r = startRow; r <= endRow; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid-row';
        
        for (let c = 0; c < grid[r].length; c++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            if (grid[r][c].letter) {
                cell.className += ' filled correct'; // Show all as correct (green)
                cell.textContent = grid[r][c].letter;
            } else {
                cell.className += ' empty';
            }
            
            rowDiv.appendChild(cell);
        }
        
        container.appendChild(rowDiv);
    }
    
    // Fit grid to screen
    fitGridToScreen();
}

/**
 * Fit grid to screen (adapted from main game)
 */
function fitGridToScreen() {
    if (!grid || !grid.length) return;

    const rows = grid.length;
    const cols = grid[0].length;

    // Configurable padding constants
    const paddingX = 100;
    const paddingY = 400;

    // Account for 1px margins between cells
    const availableWidth = window.innerWidth - paddingX - (cols - 1) * 2;
    const availableHeight = window.innerHeight - paddingY - (rows - 1) * 2;

    const maxCellWidth = Math.floor(availableWidth / cols);
    const maxCellHeight = Math.floor(availableHeight / rows);

    let newCellSize = Math.min(maxCellWidth, maxCellHeight, 56);
    newCellSize = Math.max(newCellSize, 24);

    document.documentElement.style.setProperty('--cell-size', `${newCellSize}px`);
}

/**
 * Generate shareable link
 */
function generateLink() {
    // 1. Gather Data (use cleaned headline)
    const finalHeadline = cleanedWordsArray.join(' ');
    
    const puzzleData = {
        h: finalHeadline,              // Headline (Cleaned)
        d: hintInput.value.trim(),     // Description/Hint
        l: currentLang,                // Language
        dfc: selectedDifficulty        // Difficulty
    };

    // 2. Serialize & Compress
    const jsonString = JSON.stringify(puzzleData);
    const compressed = LZString.compressToEncodedURIComponent(jsonString);

    // 3. Build URL
    const currentPath = window.location.pathname;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const indexUrl = window.location.origin + (basePath ? basePath : '') + '/index.html';
    const fullUrl = `${indexUrl}?p=${compressed}`;

    // 4. Show Result
    if (shareLinkInput) shareLinkInput.value = fullUrl;
    if (linkArea) linkArea.style.display = 'block';
}

/**
 * Initialize difficulty dropdown
 */
function initDifficultyDropdown() {
    if (!difficultyDropdown || !difficultySelectBtn) return;
    
    // Create dropdown panel
    difficultyDropdownPanel = document.createElement('div');
    difficultyDropdownPanel.className = 'difficulty-dropdown-panel';
    
    // Difficulty options
    const difficulties = [
        { id: 'easy', key: 'difficulty.easy' },
        { id: 'mediumEasy', key: 'difficulty.mediumEasy' },
        { id: 'medium', key: 'difficulty.medium' },
        { id: 'mediumHard', key: 'difficulty.mediumHard' },
        { id: 'hard', key: 'difficulty.hard' }
    ];
    
    difficulties.forEach(diff => {
        const option = document.createElement('div');
        option.className = 'difficulty-dropdown-option';
        option.dataset.difficultyId = diff.id;
        
        const optionText = document.createElement('span');
        optionText.className = 'difficulty-dropdown-option-text';
        // Show "Name - Description" in dropdown
        if (typeof t !== 'undefined') {
            const name = t(`${diff.key}.name`);
            const description = t(`${diff.key}.description`);
            optionText.textContent = `${name} - ${description}`;
        } else {
            optionText.textContent = diff.id;
        }
        option.appendChild(optionText);
        
        const checkIcon = document.createElement('div');
        checkIcon.className = 'difficulty-dropdown-check';
        checkIcon.innerHTML = '<svg viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z\"/></svg>';
        option.appendChild(checkIcon);
        
        // Mark current difficulty as selected
        if (diff.id === selectedDifficulty) {
            option.classList.add('selected');
        }
        
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            selectDifficulty(diff.id);
            closeDifficultyDropdown();
        });
        
        difficultyDropdownPanel.appendChild(option);
    });
    
    // Append to difficulty dropdown container
    difficultyDropdown.appendChild(difficultyDropdownPanel);
    
    // Click handler for difficulty select button
    difficultySelectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (difficultyDropdown.classList.contains('open')) {
            closeDifficultyDropdown();
        } else {
            openDifficultyDropdown();
        }
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (difficultyDropdown.classList.contains('open') && 
            !difficultyDropdown.contains(e.target)) {
            closeDifficultyDropdown();
        }
    });
    
    // Set initial difficulty text
    updateDifficultyText();
}

/**
 * Open difficulty dropdown
 */
function openDifficultyDropdown() {
    if (!difficultyDropdown || !difficultyDropdownPanel) return;
    
    difficultyDropdown.classList.add('open');
    difficultyDropdownPanel.classList.add('visible');
}

/**
 * Close difficulty dropdown
 */
function closeDifficultyDropdown() {
    if (!difficultyDropdown || !difficultyDropdownPanel) return;
    
    difficultyDropdown.classList.remove('open');
    difficultyDropdownPanel.classList.remove('visible');
}

/**
 * Select a difficulty
 */
function selectDifficulty(difficultyId) {
    if (difficultyId === selectedDifficulty) return;
    
    selectedDifficulty = difficultyId;
    
    // Update display text
    updateDifficultyText();
    
    // Update selected state in dropdown
    if (difficultyDropdownPanel) {
        difficultyDropdownPanel.querySelectorAll('.difficulty-dropdown-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.difficultyId === difficultyId);
        });
    }
    
    // If grids are already generated, update them in real-time
    if (previewGridUnsolved.length > 0) {
        // Regenerate unsolved grid with new difficulty
        previewGridUnsolved = createDeepCopyOfGrid(grid);
        applyDifficultyToPreviewGrid(previewGridUnsolved, selectedDifficulty);
        
        // Re-render unsolved grid
        renderSinglePreviewGrid(previewGridUnsolved, 'unsolvedGrid', true);
        
        // Update unsolved grid title
        updateUnsolvedGridTitle();
        
        // Update difficulty stat
        const freshStatDiff = document.getElementById('statDiff');
        if (freshStatDiff) freshStatDiff.textContent = t(`difficulty.${selectedDifficulty}.name`);
        
        // Regenerate link with new difficulty
        generateLink();
    }
}

/**
 * Update difficulty text display
 */
function updateDifficultyText() {
    if (!difficultyText) return;
    
    if (typeof t !== 'undefined') {
        difficultyText.textContent = t(`difficulty.${selectedDifficulty}.name`);
    } else {
        difficultyText.textContent = selectedDifficulty;
    }
}

/**
 * Update unsolved grid title with current difficulty
 */
function updateUnsolvedGridTitle() {
    const unsolvedGridTitle = document.getElementById('unsolvedGridTitle');
    if (!unsolvedGridTitle) return;
    
    if (typeof t !== 'undefined') {
        const difficultyName = t(`difficulty.${selectedDifficulty}.name`);
        unsolvedGridTitle.textContent = t('createPuzzle.unsolvedGridTitle').replace('{difficulty}', difficultyName);
    }
}

/**
 * Copy link to clipboard
 */
async function copyToClipboard() {
    if (!shareLinkInput) return;
    
    const link = shareLinkInput.value;
    if (!link) return;

    try {
        await navigator.clipboard.writeText(link);
        showToast();
        shareLinkInput.select();
    } catch (err) {
        console.error('Failed to copy: ', err);
        // Fallback for older browsers
        shareLinkInput.select();
        document.execCommand('copy');
        showToast();
    }
}

/**
 * Show toast notification
 */
function showToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.add('visible');
        setTimeout(() => {
            toast.classList.remove('visible');
        }, 3000);
    }
}

/**
 * Show error message
 */
function showError(element, msg) {
    element.textContent = msg;
    element.style.display = 'inline-flex';
}

/**
 * Hide error message
 */
function hideError(element) {
    element.style.display = 'none';
}

/**
 * Reset UI state
 */
function resetUI() {
    if (previewArea) previewArea.style.display = 'none';
    if (linkArea) linkArea.style.display = 'none';
    if (previewGridContainer) previewGridContainer.style.display = 'none';
    if (langIndicator) langIndicator.textContent = '';
    if (headlineError) hideError(headlineError);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEventListeners);
} else {
    initializeEventListeners();
}

// Add window resize listener for grid fitting
window.addEventListener('resize', () => {
    if (grid && grid.length > 0) {
        fitGridToScreen();
    }
});
