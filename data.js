// Default language configuration
const defaultLanguageConfig = {
    // Set to 'auto' to detect browser language, or specify 'en' or 'ru'
    defaultLanguage: 'ru'
};

// RSS language configuration - controls which RSS sources to use
// Options: 'auto' (detect from UI language), 'ru' (Russian RSS), 'en' (English RSS)
const rssLanguageConfig = {
    rssLanguage: 'auto'
};

// Debug configuration - controls debug mode and logging
const debugConfig = {
    enabled: false  // Set to true to enable debug mode and logging
};

// Crossword Engine Configuration (Smart Backbone-First Algorithm)
const crosswordEngineConfig = {
    // Phase 1: Matchmaker - Find best word pairs for backbone
    bridgeWeight: 50,           // Bonus for pairs with high bridge potential
    lengthBonus: 10,            // Bonus for longer word pairs
    
    // Phase 2: Backbone Generation
    variantsToTry: 70,         // How many backbones to try filling (affects quality vs speed)
    
    // Phase 3: Beam Search Fill
    beamWidth: 30,              // Number of states to keep in beam search (higher = better but slower)
    timeLimit: 300,             // Maximum time to spend generating layout (ms)
    
    // Final Scoring
    finalCompactness: 0.4,      // Penalty per unit of area (width × height) - lower values prefer compact grids
    finalUnusedWeight: 30,     // Penalty per unused letter (total unused letters × 300) - ensures all words are placed
    ratioWeight: 400,           // Penalty for aspect ratio deviation from screen (1/5 used in Phase 2 intermediate scoring)
    cycleBonus: 100,            // Bonus for each closed loop/cycle of words (graph connectivity)
    
    // Final Selection - Weighted Random from Top Variants
    finalVariantCount: 3,       // Number of top-scoring variants to choose from using weighted probability
                                // Higher scores have higher chance, but adds variety to grid layouts
                                // Set to 1 to always pick the best variant (deterministic)
                                // Different users will likely get different grids from same word bag
    
    // Intersection Bonuses (non-linear rewards for well-connected words)
    // [1 intersection, 2 intersections, 3 intersections, 4 intersections, 5+ intersections]
    intersectionWeights: [10, 60, 100, 160, 160]
};

// Headline Scoring Configuration
const headlineScoringConfig = {
    // Word count constraints
    minWords: 4,           // Minimum words required after filtering
    maxWords: 15,           // Maximum words for optimal score
    idealMinWords: 4,      // Ideal minimum word count
    idealMaxWords: 10,      // Ideal maximum word count
    
    // Word length filtering
    minWordLength: 4,      // Words with 3 letters or less are filtered out
    
    // Scoring penalties
    filteredWordPenalty: -1,    // Penalty for each filtered word (stop words, short words)
    wordCountPenalty: -1,       // Penalty for each word above/below ideal range
    noDescriptionPenalty: -999, // Severe penalty for headlines without description
    alreadySeenPenalty: -500,   // Penalty for headlines already seen by the player
    
    // Stop words and trash words to exclude
    stopWords: [
        'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
        'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
        'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
        'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
        'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
        'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
        'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself',
        'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
        'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
        'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they',
        'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
        'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what',
        'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with',
        'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
        // Custom additions for news headlines
        'says', 'said', 'will', 'may', 'might', 'new', 'latest'
    ],
    
    // RSS parsing configuration
    rssConfig: {
        minWordLengthForParsing: 2,  // Minimum word length during RSS parsing
        skipWordsInParsing: ['THE', 'AND', 'OR', 'BUT', 'FOR', 'NOR', 'SO', 'YET', 'A', 'AN', 'И', 'В', 'НА', 'С', 'ПО', 'К', 'О', 'ТО', 'ТАКЖЕ', 'ТАК', 'НЕ', 'НИ', 'ЧТО', 'КАК', 'КТО', 'ГДЕ', 'КОГДА', 'ПОЧЕМУ', 'ЗАЧЕМ'], // Words to skip during parsing
        defaultCount: 10,            // Default number of headlines to fetch per source
        cacheTimeout: 300000,        // Cache timeout in milliseconds (5 minutes)
        loadingAnimationDelay: 300,  // Show loading animation after 5ms (for debugging)
        fetchDelay: 0              // Delay before starting RSS fetch (for debugging)
    }
};

// Difficulty system configuration
let currentDifficulty = 'medium'; // Default difficulty - hardest level with big hint (description)

// Difficulty Settings:
// - minSwaps: Minimum number of swaps to ensure puzzle complexity
// - maxSwaps: Hard limit (60) - algorithm stops here even if maxGreenPercentage not reached, but usually stops earlier when target is achieved
// - maxGreenPercentage: Target percentage of correct (green) letters after scrambling
// - intersectionGreenPercentage: Target percentage of crossroad/intersection letters that should remain correct (green)
const difficultySettings = {
    easy: { 
        name: 'Easy - Word Shuffle Only', 
        minSwaps: 2, 
        maxSwaps: 60, 
        maxGreenPercentage: 100, // No constraint for easy
        intersectionGreenPercentage: 100 // All intersections stay correct
    },
    mediumEasy: { 
        name: 'Medium-Easy - 40% Green Max', 
        minSwaps: 3, 
        maxSwaps: 60, 
        maxGreenPercentage: 40,
        intersectionGreenPercentage: 75 // Most intersections stay correct
    },
    medium: { 
        name: 'Medium - 30% Green Max', 
        minSwaps: 6, 
        maxSwaps: 60, 
        maxGreenPercentage: 30,
        intersectionGreenPercentage: 50 // Half of intersections stay correct
    },
    mediumHard: { 
        name: 'Medium-Hard - 20% Green Max', 
        minSwaps: 8, 
        maxSwaps: 60, 
        maxGreenPercentage: 20,
        intersectionGreenPercentage: 25 // Few intersections stay correct
    },
    hard: { 
        name: 'Hard - 15% Green Max', 
        minSwaps: 12, 
        maxSwaps: 60, 
        maxGreenPercentage: 15,
        intersectionGreenPercentage: 0 // No intersections stay correct
    }
};

// Star rating system configuration
const starRatingConfig = {
    // Base multiplier for minimum possible swaps (0.5 since each move swaps two letters)
    baseMultiplier: 0.5,
    
    // Star threshold multipliers (applied to base threshold)
    starThresholds: {
        5: 1.2,   // 5 stars: ≤ letterCount × 0.5 × 0.8
        4: 1.7,   // 4 stars: ≤ letterCount × 0.5 × 1.0
        3: 2.0,   // 3 stars: ≤ letterCount × 0.5 × 1.5
        2: 3.0,    // 2 stars: ≤ letterCount × 0.5 × 2.0
        1: Infinity // 1 star: any number of swaps
    },
    
    // Performance rating labels
    ratingLabels: {
        5: 'PERFECT',
        4: 'EXCELLENT', 
        3: 'GOOD',
        2: 'FAIR',
        1: 'COMPLETE'
    }
};

// Victory Animation Configuration
// Choose from: 'wave', 'jump', 'colorWave', 'shake', or 'none'
const victoryAnimationConfig = {
    animationType: 'wave',      // Options: 'wave', 'jump', 'colorWave', 'shake', 'none'
    duration: 500,              // Total animation duration in ms
    staggerDelay: 30,          // Delay between each cell animation in ms
    intensity: 'subtle',        // Options: 'subtle', 'moderate', 'strong'
    easing: 'ease-out'          // CSS easing function
};
