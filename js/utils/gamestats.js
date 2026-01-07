/**
 * Game Stats - Statistics tracking system for Headlines Crossword Game
 * Tracks puzzle completion and skip statistics using custom events
 */

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('gamestats', message, options);
    } else {
        console.log('[gamestats]', message);
    }
}

// Stats storage keys
const STATS_KEYS = {
    SOLVED: 'puzzleSolvedCount',
    SKIPPED: 'puzzleSkippedCount'
};

// Current stats cache
let currentStats = {
    solved: 0,
    skipped: 0
};

let isInitialized = false;

/**
 * Initialize the game stats system
 * Loads existing stats from platform storage
 */
async function initializeGameStats() {
    if (isInitialized) {
        _log('Game stats already initialized');
        return;
    }

    _log('Initializing game stats system...');

    try {
        // Load existing stats
        const solvedCount = await Platform.getPuzzleSolvedStat();
        const skippedCount = await Platform.getPuzzleSkippedStat();

        currentStats.solved = solvedCount || 0;
        currentStats.skipped = skippedCount || 0;

        _log(`Loaded stats - Solved: ${currentStats.solved}, Skipped: ${currentStats.skipped}`);

        // Set up event listeners
        setupEventListeners();

        isInitialized = true;
        _log('Game stats system initialized successfully');

    } catch (error) {
        console.error('[gamestats] Failed to initialize:', error);
        // Continue with default values
        setupEventListeners();
        isInitialized = true;
    }
}

/**
 * Set up event listeners for puzzle events
 */
function setupEventListeners() {
    // Listen for puzzle solved events
    window.addEventListener('headlines:puzzle:solved', async (event) => {
        try {
            await handlePuzzleSolved(event.detail);
        } catch (error) {
            console.error('[gamestats] Error handling puzzle solved:', error);
        }
    });

    // Listen for puzzle skipped events
    window.addEventListener('headlines:puzzle:skipped', async (event) => {
        try {
            await handlePuzzleSkipped(event.detail);
        } catch (error) {
            console.error('[gamestats] Error handling puzzle skipped:', error);
        }
    });

    _log('Event listeners set up for puzzle events');
}

/**
 * Handle puzzle solved event
 * @param {Object} detail - Event detail with puzzleHash and puzzleLink
 */
async function handlePuzzleSolved(detail) {
    _log(`Puzzle solved: ${detail.puzzleHash}`);

    try {
        await Platform.incrementPuzzleSolvedStat();
        currentStats.solved++;
        _log(`Puzzle solved count incremented to: ${currentStats.solved}`);
    } catch (error) {
        console.error('[gamestats] Failed to increment solved stat:', error);
    }
}

/**
 * Handle puzzle skipped event
 * @param {Object} detail - Event detail with puzzleHash and puzzleLink
 */
async function handlePuzzleSkipped(detail) {
    _log(`Puzzle skipped: ${detail.puzzleHash}`);

    try {
        await Platform.incrementPuzzleSkippedStat();
        currentStats.skipped++;
        _log(`Puzzle skipped count incremented to: ${currentStats.skipped}`);
    } catch (error) {
        console.error('[gamestats] Failed to increment skipped stat:', error);
    }
}

/**
 * Get current stats
 * @returns {Object} Current stats object
 */
function getCurrentStats() {
    return {
        solved: currentStats.solved,
        skipped: currentStats.skipped,
        total: currentStats.solved + currentStats.skipped
    };
}

/**
 * Force refresh stats from platform storage
 */
async function refreshStats() {
    try {
        const solvedCount = await Platform.getPuzzleSolvedStat();
        const skippedCount = await Platform.getPuzzleSkippedStat();

        currentStats.solved = solvedCount || 0;
        currentStats.skipped = skippedCount || 0;

        _log(`Stats refreshed - Solved: ${currentStats.solved}, Skipped: ${currentStats.skipped}`);
    } catch (error) {
        console.error('[gamestats] Failed to refresh stats:', error);
    }
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.GameStats = {
        initialize: initializeGameStats,
        getCurrentStats: getCurrentStats,
        refreshStats: refreshStats
    };

    // Auto-initialize when platform is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for platform to be ready
            window.addEventListener('headlines:platform:ready', initializeGameStats);
        });
    } else {
        // DOM already loaded, wait for platform
        window.addEventListener('headlines:platform:ready', initializeGameStats);
    }
}

})();