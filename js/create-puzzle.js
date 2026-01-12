/**
 * CREATE PUZZLE - Custom Puzzle Creator
 * Allows users to create custom crossword puzzles and generate shareable links
 */

// Global variables needed for crossword engine and grid manager
let grid = [];
let gridSize = { rows: 0, cols: 0 };
let crosswordLayout = null;

// DOM Elements
const headlineInput = document.getElementById('headlineInput');
const cleanedWordsDisplay = document.getElementById('cleanedWordsDisplay');
const hintInput = document.getElementById('hintInput');
const headlineError = document.getElementById('headlineError');
const hintError = document.getElementById('hintError');
const langIndicator = document.getElementById('langIndicator');
const previewBtn = document.getElementById('previewBtn');
const previewArea = document.getElementById('previewArea');
const linkArea = document.getElementById('linkArea');
const previewGridContainer = document.getElementById('previewGridContainer');
const generateLinkBtn = document.getElementById('generateLinkBtn');
const shareLinkInput = document.getElementById('shareLinkInput');
const copyBtn = document.getElementById('copyBtn');
const statWords = document.getElementById('statWords');
const statLang = document.getElementById('statLang');

// State
let currentLang = null; // 'en' or 'ru'
let cleanedWordsArray = []; // Stores the final processed words

// Constants
const MIN_WORDS = 5;
const MIN_WORD_LENGTH = 4;

// Regex for language detection
const REGEX_EN = /^[a-zA-Z]+$/;
const REGEX_RU = /^[а-яА-Я]+$/;

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
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
    generateLinkBtn.addEventListener('click', generateLink);
    copyBtn.addEventListener('click', copyToClipboard);
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
            <span class="cleaned-label">WORD ANALYSIS:</span>
            <div class="words-wrapper">${badgesHTML}</div>
        `;
        cleanedWordsDisplay.classList.add('visible');
    } else {
        cleanedWordsDisplay.classList.remove('visible');
    }

    // 5. Check Word Count
    if (cleanedWordsArray.length < MIN_WORDS) {
        if (showUiErrors) {
            showError(headlineError, `Need at least ${MIN_WORDS} words (Current: ${cleanedWordsArray.length}). Keep typing!`);
        }
        return false;
    }

    // 6. Check Word Length
    const shortWords = cleanedWordsArray.filter(w => w.length < MIN_WORD_LENGTH);
    if (shortWords.length > 0) {
        if (showUiErrors) {
            showError(headlineError, `Found ${shortWords.length} word(s) that are too short (marked in RED above). All words must be 4+ letters.`);
        }
        return false;
    }

    // 7. Check Language Consistency
    const joinedWords = cleanedWordsArray.join('');
    const isEn = REGEX_EN.test(joinedWords);
    const isRu = REGEX_RU.test(joinedWords);

    if (isEn && !isRu) {
        currentLang = 'en';
        langIndicator.textContent = 'ENGLISH';
    } else if (isRu && !isEn) {
        currentLang = 'ru';
        langIndicator.textContent = 'РУССКИЙ';
    } else if (!isEn && !isRu && joinedWords.length > 0) {
        if (showUiErrors) {
            showError(headlineError, "Cannot mix English and Russian letters.");
        }
        langIndicator.textContent = 'MIXED/INVALID';
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
            showError(hintError, "Please provide a hint.");
        }
        return false;
    }

    // 2. Check Length Ratio
    if (cleanedWordsArray.length > 0 && hintWords.length < requiredWords) {
        showError(hintError, `Hint too short: ${hintWords.length} words. Needs at least ${requiredWords} (2× headline).`);
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
    statWords.textContent = cleanedWordsArray.length;
    statLang.textContent = currentLang === 'en' ? 'English' : 'Russian';

    // Generate real crossword layout
    const normalizedWords = cleanedWordsArray.map(word => 
        word.replace(/Ё/g, 'Е').replace(/ё/g, 'е')
    );
    
    crosswordLayout = window.generateCrosswordLayout(normalizedWords);
    
    if (!crosswordLayout) {
        showError(headlineError, "Failed to generate crossword layout. Try different words or word order.");
        return;
    }
    
    // Create grid from layout
    grid = window.placeWordsInGrid(normalizedWords, crosswordLayout);
    
    // Show preview area and render grid
    previewArea.style.display = 'block';
    linkArea.style.display = 'none';
    previewGridContainer.style.display = 'block';
    
    // Render the crossword grid
    renderPreviewGrid();
    
    // Scroll to preview
    previewArea.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Render preview crossword grid (all cells shown as correct/green)
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
        l: currentLang                 // Language
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
    shareLinkInput.value = fullUrl;
    linkArea.style.display = 'block';
}

/**
 * Copy link to clipboard
 */
async function copyToClipboard() {
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
    toast.classList.add('visible');
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
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
    previewArea.style.display = 'none';
    linkArea.style.display = 'none';
    previewGridContainer.style.display = 'none';
    langIndicator.textContent = '';
    hideError(headlineError);
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
