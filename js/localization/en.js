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
        moves: {
            one: "move",
            other: "moves"
        },
        giveUp: "Give Up",
        nextHeadline: "Next",
        replay: "Replay",
        readFullArticle: "Read Full Article",
        newHeadline: "Next Headline",
        ok: "OK",
        cancel: "Cancel"
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
            swaps: {
                one: "SWAP",
                other: "SWAPS"
            },
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
                one: "🌟 You earned 1 star by completing in {swaps} {swapsWord}!<br>⭐ Get {nextStars} stars by completing in {threshold} {thresholdWord} or fewer",
                other: "🌟 You earned {stars} stars by completing in {swaps} {swapsWord}!<br>⭐ Get {nextStars} stars by completing in {threshold} {thresholdWord} or fewer"
            },
            getStars: {
                one: "⭐ Get 1 star by completing the puzzle in {requiredSwaps} {requiredSwapsWord} or fewer",
                other: "⭐ Get {starIndex} stars by completing the puzzle in {requiredSwaps} {requiredSwapsWord} or fewer"
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
    },
    
    // Loading messages
    loading: {
        fetchingHeadlines: "Fetching latest headlines...",
        fetchingSubtext: "This may take a few seconds"
    },
    
    // Tutorial
    tutorial: {
        welcome: {
            title: "How to Play?",
            content: "Unscramble the **news headline** using the **description below the game board**. Letters turn **green** when placed **correctly**.\n![Reconstructed word](imgs/ex_green_en.png)\n\n---\n\nLetters belonging to the **current word** but in the **wrong position** appear **orange**.\nTo **swap two letters**, simply **tap** them one by one.\n![Tap two letters](imgs/ex_ornage_en.png)\n\n---\n\nLetters in an **intersecting word** appear **purple**. Letters in a **different word** remain **gray**.\n![Other colors](imgs/ex_misc_en.png)\n\n---\n\nUse **logic** and the **news clue** to solve the headline with as few moves as possible.",
            buttonText: "Got it"
        }
    }
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.en = en;
}
