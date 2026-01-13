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
        connectedWord: "Intersecting word",
        otherWord: "Other word",
        // Shorter versions for when legend wraps to multiple lines
        correctShort: "Correct",
        wrongPositionShort: "Wrong position",
        connectedWordShort: "Connected word",
        otherWordShort: "Other"
    },
    
    // Victory modal
    victory: {
        title: "Congratulations!",
        subtitle: "You've reconstructed the headline!",
        headlineLabel: "RECONSTRUCTED HEADLINE",
        articlePrompt: "Please read the full article for complete headline",
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
        easy: {
            name: "Easy",
            description: "Word Shuffle Only"
        },
        mediumEasy: {
            name: "Medium-Easy",
            description: "40% Green Max"
        },
        medium: {
            name: "Medium",
            description: "30% Green Max"
        },
        mediumHard: {
            name: "Medium-Hard",
            description: "20% Green Max"
        },
        hard: {
            name: "Hard",
            description: "15% Green Max"
        }
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
        hintTitle: "Tip"
    },
    
    // Toolbar tooltips
    toolbar: {
        menu: "Menu",
        howToPlay: "How to Play",
        nextPuzzle: "Next Puzzle"
    },
    
    // Menu items
    menu: {
        title: "Menu",
        language: "Language",
        difficulty: "Difficulty",
        statistics: "Statistics",
        sound: "Sound",
        help: "Help",
        giveUp: "Give Up",
        giveUpDescription: "Reveals the puzzle",
        nextPuzzle: "Next Puzzle",
        nextPuzzleDescription: "Load next headline"
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
            content: "Unscramble the **headline** using the **description below the game board**. Letters turn **green** when placed **correctly**.\n![Reconstructed word](imgs/ex_green_en.png)\n\n---\n\nLetters belonging to the **current word** but in the **wrong position** appear **orange**.\nTo **swap two letters**, simply **tap** them one by one.\n![Tap two letters](imgs/ex_ornage_en.png)\n\n---\n\nLetters in an **intersecting word** appear **purple**. Letters in a **different word** remain **gray**.\n![Other colors](imgs/ex_misc_en.png)\n\n---\n\nUse **logic** and the **clue** to solve the headline with as few moves as possible.",
            buttonText: "Got it"
        }
    },

    // Create Puzzle Page
    createPuzzle: {
        title: "Create Challenge",
        subtitle: "Design a custom puzzle for your friends.",
        headlineLabel: "Hidden Headline (The Puzzle)",
        headlineHint: "Min 5 words, 4+ letters each. Punctuation & emojis will be ignored.",
        headlinePlaceholder: "e.g., Pirates of the Caribbean: The Curse of the Black Pearl",
        wordAnalysisLabel: "WORD ANALYSIS:",
        hintLabel: "Contextual Hint",
        hintHint: "The clue displayed to the player. <strong>Must contain at least 2x the number of words in the headline.</strong>",
        hintPlaceholder: "e.g., A swashbuckling adventure film about cursed pirates who must break an ancient curse by finding lost pieces of Aztec gold before the moon turns full",
        verifyButton: "Verify & Generate Preview",
        backButton: "Back to Game",
        previewTitle: "✨ Grid Generated Successfully",
        statsWords: "Words:",
        statsLanguage: "Language:",
        createLinkButton: "Create Challenge Link",
        shareLabel: "Share this link:",
        copyButton: "Copy Link",
        previewHeader: "Preview",
        previewDisclaimer: "This is one example layout generated for your device. The actual puzzle layout may vary on different devices depending on screen size and aspect ratio.",
        toastCopied: "Copied to Clipboard!",
        errors: {
            minWords: "Need at least {count} words (Current: {current}). Keep typing!",
            shortWords: "Found {count} word(s) that are too short (marked in RED above). All words must be 4+ letters.",
            mixedLanguages: "Cannot mix English and Russian letters.",
            noHint: "Please provide a hint.",
            hintTooShort: "Hint too short: {hintWords} words. Needs at least {required} (2× headline).",
            layoutFailed: "Failed to generate crossword layout. Try different words or word order."
        },
        language: {
            english: "ENGLISH",
            russian: "Russian",
            mixed: "MIXED/INVALID"
        }
    },

    // Puzzle Error (for custom puzzle loading failures)
    puzzleError: {
        title: "Puzzle Error",
        corruptedLink: "The puzzle link may be corrupted or invalid.<br>Please ask the person who sent you to resend the link.<br>Until then, you can play the regular Headlines game.",
        startRegularGame: "Start Regular Game"
    }
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.en = en;
}
