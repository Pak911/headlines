// English translations
const en = {
    // Game title and instructions
    game: {
        title: "Headlines",
        instructions: "Swap letters to reconstruct the news headline!<br>Click two letters to swap their positions.<br>The tip below is a hint about the article's headline."
    },
    
    // UI elements
    ui: {
        swaps: "Swaps",
        moves: "moves",
        nextHeadline: "Next Headline",
        replay: "Replay",
        readFullArticle: "Read Full Article",
        newHeadline: "Next Headline"
    },
    
    // Color legend
    legend: {
        correct: "Correct position",
        wrongPosition: "Wrong position",
        connectedWord: "Connected word",
        otherWord: "Other word"
    },
    
    // Victory modal
    victory: {
        title: "Congratulations!",
        subtitle: "You've reconstructed the headline!",
        headlineLabel: "RECONSTRUCTED HEADLINE",
        stats: {
            swaps: "SWAPS",
            rating: "RATING"
        },
        ratings: {
            perfect: "PERFECT",
            excellent: "EXCELLENT",
            good: "GOOD",
            fair: "FAIR",
            complete: "COMPLETE"
        },
        tooltips: {
            perfect: "🏆 Perfect! You achieved the maximum 5-star rating!",
            earned: {
                default: "🌟 You earned {stars} stars by completing in {swaps} swaps!<br>⭐ Get {nextStars} stars by completing in {threshold} swaps or fewer"
            },
            getStars: {
                default: "⭐ Get {starIndex} stars by completing the puzzle in {requiredSwaps} swaps or fewer"
            },
            getOneStar: "⭐ Get {starIndex} star by completing the puzzle"
        }
    },
    
    // Difficulty levels
    difficulty: {
        easy: "Easy - Word Shuffle Only",
        mediumEasy: "Medium-Easy - 40% Green Max",
        medium: "Medium - 30% Green Max",
        mediumHard: "Medium-Hard - 20% Green Max",
        hard: "Hard - 15% Green Max"
    },
    
    // Debug panel
    debug: {
        toggleHint: "Press 'D' to toggle debug info",
        title: "🔧 Debug Information",
        close: "×",
        sections: {
            currentHeadline: "Current Headline",
            layoutGeneration: "Layout Generation",
            shuffleDifficulty: "Shuffle & Difficulty",
            headlineManagement: "Headline Management",
            alternativeHeadlines: "Alternative Headlines",
            compatibility: "Compatibility Analysis",
            testCaseHTML: "Test Case HTML Code",
            testCaseJS: "Test Case JavaScript Code"
        },
        difficulty: "Difficulty:",
        autoWin: "🏆 Auto-Win (Debug)"
    },
    
    // Tooltips and hints
    hints: {
        tipPrefix: "💡 Tip:",
        hintTitle: "News Description"
    }
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.en = en;
}
