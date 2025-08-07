// Headline Manager - Headline Selection and Management
// Handles headline lifecycle, usage tracking, and selection logic

// Headline management system
let availableHeadlines = [];
let usedHeadlines = [];
let rejectedHeadlines = [];

// Initialize headline management system
function initializeHeadlineManagement() {
    // If availableHeadlines is empty, refill it with all headlines
    if (availableHeadlines.length === 0) {
        console.log('Refilling available headlines list');
        availableHeadlines = [...mockHeadlines];
        // Clear used and rejected lists when starting fresh
        usedHeadlines = [];
        rejectedHeadlines = [];
    }
}

// Get next available headline (excluding used and rejected ones)
function getNextHeadline() {
    initializeHeadlineManagement();
    
    // Filter out used and rejected headlines
    const validHeadlines = availableHeadlines.filter(headline => 
        !usedHeadlines.some(used => used.text === headline.text) &&
        !rejectedHeadlines.some(rejected => rejected.text === headline.text)
    );
    
    if (validHeadlines.length === 0) {
        console.log('No more valid headlines available, refilling list');
        // Reset the system - start over with all headlines
        availableHeadlines = [...mockHeadlines];
        usedHeadlines = [];
        rejectedHeadlines = [];
        return availableHeadlines[Math.floor(Math.random() * availableHeadlines.length)];
    }
    
    // Select random headline from valid ones
    const selectedHeadline = validHeadlines[Math.floor(Math.random() * validHeadlines.length)];
    console.log(`Selected headline: "${selectedHeadline.text}"`);
    console.log(`Remaining available: ${validHeadlines.length - 1}, Used: ${usedHeadlines.length}, Rejected: ${rejectedHeadlines.length}`);
    
    return selectedHeadline;
}

// Mark headline as used (successfully created a puzzle)
function markHeadlineAsUsed(headline) {
    if (!usedHeadlines.some(used => used.text === headline.text)) {
        usedHeadlines.push(headline);
        console.log(`Marked headline as used: "${headline.text}"`);
    }
}

// Mark headline as rejected (failed layout validation)
function markHeadlineAsRejected(headline) {
    if (!rejectedHeadlines.some(rejected => rejected.text === headline.text)) {
        rejectedHeadlines.push(headline);
        console.log(`Marked headline as rejected: "${headline.text}"`);
    }
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
