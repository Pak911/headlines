// Enhanced Headline Manager - Advanced headline selection with scoring and pool management
// Integrates with HeadlineScorer and AsyncRSSFetcher for intelligent headline management

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('headline-manager', message, options);
    } else {
        // Fallback if debug.js not loaded yet
        console.log('[headline-manager]', message);
    }
}

// Headline pool management system
let headlinePools = null; // Will store grouped headlines by score
let usedHeadlines = [];
let rejectedHeadlines = [];
let isInitialized = false;

/**
 * Initialize the enhanced headline management system
 * Fetches headlines and sets up scoring pools
 */
async function initializeHeadlineManagement() {
    if (isInitialized && headlinePools && headlinePools.totalValid > 0) {
        _log('📋 Headline management already initialized');
        return;
    }
    
    _log('🚀 Initializing enhanced headline management system...');
    
    try {
        // Fetch headlines with fallback mechanisms
        const rawHeadlines = await AsyncRSSFetcher.fetchHeadlinesWithFallback();
        
        // Process and score headlines
        headlinePools = HeadlineScorer.processAndGroupHeadlines(rawHeadlines);
        
        // Clear tracking arrays when starting fresh
        usedHeadlines = [];
        rejectedHeadlines = [];
        isInitialized = true;
        
        _log(`✅ Headline management initialized with ${headlinePools.totalValid} valid headlines`);
        _log(`📊 Score pools: ${headlinePools.sortedScores.join(', ')}`);
        
    } catch (error) {
        console.error('❌ Failed to initialize headline management:', error);
        
        // Emergency fallback to mock headlines
        _log('🔄 Using emergency fallback to mock headlines');
        const mockHeadlinesWithMetadata = mockHeadlines.map(headline => ({
            ...headline,
            source: 'mock',
            sourceName: 'Mock Data',
            category: 'fallback',
            pubDate: new Date().toISOString()
        }));
        
        headlinePools = HeadlineScorer.processAndGroupHeadlines(mockHeadlinesWithMetadata);
        isInitialized = true;
    }
}

/**
 * Get next available headline using intelligent scoring system
 * @returns {Object|null} Best available headline or null if none available
 */
async function getNextHeadline() {
    await initializeHeadlineManagement();
    
    if (!headlinePools || headlinePools.totalValid === 0) {
        _log('❌ No headlines available, reinitializing...');
        isInitialized = false;
        await initializeHeadlineManagement();
        
        if (!headlinePools || headlinePools.totalValid === 0) {
            console.error('❌ Failed to get any headlines after reinitialization');
            // Use Russian fallback headlines if RSS language is Russian
            if (typeof rssLanguageConfig !== 'undefined' && rssLanguageConfig.rssLanguage === 'ru') {
                _log('🇷🇺 Using Russian fallback headlines...');
                const mockHeadlinesWithMetadata = mockRussianHeadlines.map(headline => ({
                    ...headline,
                    source: 'mock',
                    sourceName: 'Russian Mock Data',
                    category: 'fallback',
                    pubDate: new Date().toISOString()
                }));
                headlinePools = HeadlineScorer.processAndGroupHeadlines(mockHeadlinesWithMetadata);
            } else {
                return null;
            }
        }
    }
    
    // Select best available headline
    const selectedHeadline = HeadlineScorer.selectBestHeadline(headlinePools);
    
    if (!selectedHeadline) {
        _log('❌ No more headlines available in pools, reinitializing...');
        isInitialized = false;
        return await getNextHeadline(); // Recursive call to reinitialize
    }
    
    _log(`🎯 Selected headline: "${selectedHeadline.filteredText}" (score: ${selectedHeadline.score})`);
    _log(`📊 Remaining pools: ${headlinePools.sortedScores.map(s => `${s}:${headlinePools.scoreGroups[s].length}`).join(', ')}`);
    
    return selectedHeadline;
}

/**
 * Mark headline as used and remove from pools
 * @param {Object} headline - Headline to mark as used
 */
function markHeadlineAsUsed(headline) {
    if (!usedHeadlines.some(used => used.text === headline.text)) {
        usedHeadlines.push(headline);
        _log(`✅ Marked headline as used: "${headline.filteredText || headline.text}"`);
        
        // Remove from pools
        if (headlinePools) {
            HeadlineScorer.removeHeadlineFromGroups(headlinePools, headline);
        }
    }
}

/**
 * Mark headline as rejected and remove from pools
 * @param {Object} headline - Headline to mark as rejected
 */
function markHeadlineAsRejected(headline) {
    if (!rejectedHeadlines.some(rejected => rejected.text === headline.text)) {
        rejectedHeadlines.push(headline);
        _log(`❌ Marked headline as rejected: "${headline.filteredText || headline.text}"`);
        
        // Remove from pools
        if (headlinePools) {
            HeadlineScorer.removeHeadlineFromGroups(headlinePools, headline);
        }
    }
}

/**
 * Force refresh of headline pools
 * @returns {Promise<void>}
 */
async function refreshHeadlinePools() {
    _log('🔄 Forcing headline pools refresh...');
    isInitialized = false;
    headlinePools = null;
    await initializeHeadlineManagement();
}

/**
 * Get current pool statistics for debugging
 * @returns {Object} Pool statistics and debug information
 */
function getPoolStatistics() {
    if (!headlinePools) {
        return {
            initialized: false,
            totalValid: 0,
            totalProcessed: 0,
            poolCount: 0,
            usedCount: usedHeadlines.length,
            rejectedCount: rejectedHeadlines.length
        };
    }
    
    return {
        initialized: isInitialized,
        totalValid: headlinePools.totalValid,
        totalProcessed: headlinePools.totalProcessed,
        poolCount: headlinePools.sortedScores.length,
        bestScore: headlinePools.bestScore,
        worstScore: headlinePools.worstScore,
        usedCount: usedHeadlines.length,
        rejectedCount: rejectedHeadlines.length,
        scoreDistribution: headlinePools.sortedScores.map(score => ({
            score: score,
            count: headlinePools.scoreGroups[score].length
        }))
    };
}

/**
 * Get detailed debug information about headline pools
 * @returns {Object} Detailed debug information
 */
function getDetailedPoolInfo() {
    if (!headlinePools) {
        return null;
    }
    
    return HeadlineScorer.getHeadlinePoolDebugInfo(headlinePools);
}

function generateAlternativeHeadlines() {
    debugInfo.alternativeHeadlines = [];
    debugInfo.compatibilityScores = {};
    
    // Analyze each headline for compatibility with current layout
    mockHeadlines.forEach(headline => {
        if (headline.text === currentHeadline.text) return;
        
        const compatibility = calculateHeadlineCompatibility(headline, currentHeadline);
        debugInfo.compatibilityScores[headline.text] = Math.round(compatibility * 100);
        
        if (compatibility > 0.3) { // Only show reasonably compatible headlines
            const commonLetters = countCommonLetters(headline.words, currentHeadline.words);
            debugInfo.alternativeHeadlines.push({
                text: headline.text,
                words: headline.words,
                compatibility: Math.round(compatibility * 100),
                commonLetters: commonLetters
            });
        }
    });
    
    // Sort by compatibility
    debugInfo.alternativeHeadlines.sort((a, b) => b.compatibility - a.compatibility);
    debugInfo.alternativeHeadlines = debugInfo.alternativeHeadlines.slice(0, 8); // Top 8
}

function calculateHeadlineCompatibility(headline1, headline2) {
    let totalCompatibility = 0;
    let comparisons = 0;
    
    // Compare each word in headline1 with each word in headline2
    for (let word1 of headline1.words) {
        for (let word2 of headline2.words) {
            const commonLetters = findCommonLetters(word1, word2);
            const compatibility = commonLetters.length / Math.max(word1.length, word2.length);
            totalCompatibility += compatibility;
            comparisons++;
        }
    }
    
    // Average compatibility
    const avgCompatibility = comparisons > 0 ? totalCompatibility / comparisons : 0;
    
    // Bonus for similar word count
    const wordCountBonus = 1 - Math.abs(headline1.words.length - headline2.words.length) * 0.1;
    
    // Bonus for similar total letter count
    const totalLetters1 = headline1.words.join('').length;
    const totalLetters2 = headline2.words.join('').length;
    const letterCountBonus = 1 - Math.abs(totalLetters1 - totalLetters2) * 0.01;
    
    return avgCompatibility * wordCountBonus * letterCountBonus;
}

function countCommonLetters(words1, words2) {
    const letters1 = words1.join('').split('').sort();
    const letters2 = words2.join('').split('').sort();
    
    let common = 0;
    let i = 0, j = 0;
    
    while (i < letters1.length && j < letters2.length) {
        if (letters1[i] === letters2[j]) {
            common++;
            i++;
            j++;
        } else if (letters1[i] < letters2[j]) {
            i++;
        } else {
            j++;
        }
    }
    
    return common;
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.HeadlineManager = {
        initializeHeadlineManagement,
        getNextHeadline,
        markHeadlineAsUsed,
        markHeadlineAsRejected,
        refreshHeadlinePools,
        getPoolStatistics,
        getDetailedPoolInfo
    };
    
    // Also export individual functions to global scope for debug panel and other files
    window.initializeHeadlineManagement = initializeHeadlineManagement;
    window.getNextHeadline = getNextHeadline;
    window.markHeadlineAsUsed = markHeadlineAsUsed;
    window.markHeadlineAsRejected = markHeadlineAsRejected;
    window.getPoolStatistics = getPoolStatistics;
    window.getDetailedPoolInfo = getDetailedPoolInfo;
    window.refreshHeadlinePools = refreshHeadlinePools;
}

})();
