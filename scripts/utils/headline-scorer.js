/**
 * Headline Scorer - Advanced filtering and scoring system for headlines
 * Implements sophisticated filtering rules and scoring metrics for crossword suitability
 */

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('headline-scorer', message, options);
    } else {
        // Fallback if debug.js not loaded yet
        console.log('[headline-scorer]', message);
    }
}

// Get configuration from data.js
const getConfig = () => {
    if (typeof headlineScoringConfig !== 'undefined') {
        return headlineScoringConfig;
    }
    // Fallback configuration if data.js is not loaded
    return {
        minWords: 4,
        maxWords: 5,
        idealMinWords: 4,
        idealMaxWords: 5,
        minWordLength: 4,
        filteredWordPenalty: -1,
        wordCountPenalty: -1,
        noDescriptionPenalty: -999,
        stopWords: ['a', 'an', 'and', 'the', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    };
};

// Create stop words set from configuration
const getStopWordsSet = () => {
    const config = getConfig();
    return new Set(config.stopWords);
};

/**
 * Filters and scores a single headline based on crossword suitability
 * @param {Object} headline - Headline object with text and words properties
 * @returns {Object} Scored headline with filtering details
 */
function scoreHeadline(headline) {
    const config = getConfig();
    const STOP_WORDS = getStopWordsSet();
    
    // First check: Must have description to be valid
    if (!headline.description || headline.description.trim() === '') {
        return {
            ...headline,
            originalWords: [...headline.words],
            filteredWords: [],
            score: config.noDescriptionPenalty,
            wordCount: 0,
            filterReasons: [{
                word: null,
                reason: 'no_description',
                description: 'Excluded - no description available'
            }],
            isValid: false,
            filteredText: ''
        };
    }
    
    // Second check: Description must be at least 2x longer than headline
    const headlineLength = headline.text.replace(/\s+/g, '').length; // Count letters only, ignore spaces
    const descriptionLength = headline.description.replace(/\s+/g, '').length; // Count letters only, ignore spaces
    
    if (descriptionLength < headlineLength * 2) {
        return {
            ...headline,
            originalWords: [...headline.words],
            filteredWords: [],
            score: config.noDescriptionPenalty, // Use same penalty as no description
            wordCount: 0,
            filterReasons: [{
                word: null,
                reason: 'description_too_short',
                description: `Excluded - description too short (${descriptionLength} chars vs ${headlineLength * 2} required)`
            }],
            isValid: false,
            filteredText: ''
        };
    }
    
    const originalWords = [...headline.words];
    const filteredWords = [];
    const filterReasons = [];
    let score = 0;
    
    // Filter words and track reasons
    for (const word of originalWords) {
        const wordLower = word.toLowerCase();
        
        if (STOP_WORDS.has(wordLower)) {
            filterReasons.push({
                word: word,
                reason: 'stop_word',
                description: 'Excluded as stop/trash word'
            });
            score += config.filteredWordPenalty; // Penalty for filtered word
        } else if (word.length <= 3) {
            filterReasons.push({
                word: word,
                reason: 'too_short',
                description: `Excluded as 3 letters or less (${word.length} chars)`
            });
            score += config.filteredWordPenalty; // Penalty for filtered word
        } else {
            filteredWords.push(word);
        }
    }
    
    // Score based on final word count (ideal: idealMinWords-idealMaxWords)
    const wordCount = filteredWords.length;
    if (wordCount < config.idealMinWords) {
        const penalty = (config.idealMinWords - wordCount) * Math.abs(config.wordCountPenalty);
        score -= penalty;
        filterReasons.push({
            word: null,
            reason: 'too_few_words',
            description: `Too few words (${wordCount}/${config.idealMinWords} minimum) - penalty: ${penalty}`
        });
    } else if (wordCount > config.idealMaxWords) {
        const penalty = (wordCount - config.idealMaxWords) * Math.abs(config.wordCountPenalty);
        score -= penalty;
        filterReasons.push({
            word: null,
            reason: 'too_many_words',
            description: `Too many words (${wordCount}/${config.idealMaxWords} maximum) - penalty: ${penalty}`
        });
    }
    
    return {
        ...headline,
        originalWords: originalWords,
        filteredWords: filteredWords,
        score: score,
        wordCount: wordCount,
        filterReasons: filterReasons,
        isValid: filteredWords.length >= config.minWords, // Must have at least minWords after filtering
        filteredText: filteredWords.join(' ')
    };
}

/**
 * Processes multiple headlines and groups them by score
 * @param {Array} headlines - Array of headline objects
 * @returns {Object} Grouped headlines by score with metadata
 */
function processAndGroupHeadlines(headlines) {
    _log(`🔄 Processing ${headlines.length} headlines for scoring...`);
    
    const scoredHeadlines = headlines.map(scoreHeadline);
    const validHeadlines = scoredHeadlines.filter(h => h.isValid);
    
    _log(`✅ ${validHeadlines.length}/${headlines.length} headlines passed filtering`);
    
    // Group by score
    const scoreGroups = {};
    validHeadlines.forEach(headline => {
        const score = headline.score;
        if (!scoreGroups[score]) {
            scoreGroups[score] = [];
        }
        scoreGroups[score].push(headline);
    });
    
    // Sort scores in descending order (best scores first)
    const sortedScores = Object.keys(scoreGroups)
        .map(Number)
        .sort((a, b) => b - a);
    
    _log(`📊 Score distribution: ${sortedScores.map(score => `${score}: ${scoreGroups[score].length}`).join(', ')}`);
    
    return {
        scoreGroups: scoreGroups,
        sortedScores: sortedScores,
        totalValid: validHeadlines.length,
        totalProcessed: headlines.length,
        bestScore: sortedScores[0] || null,
        worstScore: sortedScores[sortedScores.length - 1] || null
    };
}

/**
 * Selects a random headline from the best available score group
 * @param {Object} groupedHeadlines - Result from processAndGroupHeadlines
 * @returns {Object|null} Selected headline or null if none available
 */
function selectBestHeadline(groupedHeadlines) {
    const { scoreGroups, sortedScores } = groupedHeadlines;
    
    if (sortedScores.length === 0) {
        _log('❌ No valid headlines available for selection');
        return null;
    }
    
    // Find first non-empty score group
    for (const score of sortedScores) {
        const group = scoreGroups[score];
        if (group && group.length > 0) {
            const selectedHeadline = group[Math.floor(Math.random() * group.length)];
            _log(`🎯 Selected headline from score ${score}: "${selectedHeadline.filteredText}"`);
            return selectedHeadline;
        }
    }
    
    return null;
}

/**
 * Removes a headline from the score groups (after use or rejection)
 * @param {Object} groupedHeadlines - Grouped headlines object
 * @param {Object} headlineToRemove - Headline to remove
 * @returns {Object} Updated grouped headlines
 */
function removeHeadlineFromGroups(groupedHeadlines, headlineToRemove) {
    const { scoreGroups, sortedScores } = groupedHeadlines;
    const score = headlineToRemove.score;
    
    if (scoreGroups[score]) {
        const index = scoreGroups[score].findIndex(h => h.text === headlineToRemove.text);
        if (index !== -1) {
            scoreGroups[score].splice(index, 1);
            _log(`🗑️ Removed headline from score ${score} group: "${headlineToRemove.filteredText}"`);
            
            // Update total count
            groupedHeadlines.totalValid -= 1;
            
            // Remove empty score groups
            if (scoreGroups[score].length === 0) {
                delete scoreGroups[score];
                const scoreIndex = sortedScores.indexOf(score);
                if (scoreIndex !== -1) {
                    sortedScores.splice(scoreIndex, 1);
                }
            }
        }
    }
    
    return groupedHeadlines;
}

/**
 * Gets debug information about current headline pools
 * @param {Object} groupedHeadlines - Grouped headlines object
 * @returns {Object} Debug information for display
 */
function getHeadlinePoolDebugInfo(groupedHeadlines) {
    const { scoreGroups, sortedScores, totalValid, totalProcessed } = groupedHeadlines;
    
    const poolInfo = sortedScores.map(score => ({
        score: score,
        count: scoreGroups[score].length,
        headlines: scoreGroups[score].map(h => ({
            text: h.filteredText,
            originalText: h.text,
            wordCount: h.wordCount,
            filterReasons: h.filterReasons,
            sourceName: h.sourceName,
            source: h.source,
            category: h.category
        }))
    }));
    
    return {
        totalProcessed: totalProcessed,
        totalValid: totalValid,
        poolCount: sortedScores.length,
        pools: poolInfo,
        bestScore: sortedScores[0] || null,
        worstScore: sortedScores[sortedScores.length - 1] || null
    };
}

/**
 * Creates a detailed filtering report for a headline
 * @param {Object} scoredHeadline - Scored headline object
 * @returns {string} Human-readable filtering report
 */
function createFilteringReport(scoredHeadline) {
    const { originalWords, filteredWords, score, filterReasons } = scoredHeadline;
    
    let report = `Original: ${originalWords.join(' ')}\n`;
    report += `Filtered: ${filteredWords.join(' ')}\n`;
    report += `Score: ${score}\n`;
    
    if (filterReasons.length > 0) {
        report += `Filtering details:\n`;
        filterReasons.forEach(reason => {
            if (reason.word) {
                report += `  - "${reason.word}": ${reason.description}\n`;
            } else {
                report += `  - ${reason.description}\n`;
            }
        });
    } else {
        report += `No filtering applied - perfect headline!\n`;
    }
    
    return report;
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.HeadlineScorer = {
        scoreHeadline,
        processAndGroupHeadlines,
        selectBestHeadline,
        removeHeadlineFromGroups,
        getHeadlinePoolDebugInfo,
        createFilteringReport,
        getConfig,
        getStopWordsSet
    };
}

})();
