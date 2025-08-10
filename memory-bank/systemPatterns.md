# System Patterns: Headlines Letter-Swap Crossword Game

## Architecture Overview
Single-page application (SPA) with all logic contained in index.html:
- Pure HTML/CSS/JavaScript implementation
- No external dependencies
- Client-side only (no server required)

## Core Systems

### Crossword Generation Algorithm
**Pattern**: Multi-phase generation with strict validation
- Phase 1: Attempt intelligent placement using shared letters
- Phase 2: Validate connectivity and parallel spacing  
- Phase 3: Fallback to structured layout if needed
- Phase 4: Caption rejection and retry system

**Key Validation Functions**:
- `isLayoutConnected()`: Ensures all words form single connected component
- `hasProperParallelSpacing()`: Ensures parallel words have minimum gaps
- `doWordsShareMultipleLetters()`: Prevents words from sharing more than one letter
- `hasValidLetterSharing()`: Validates entire layout for proper letter sharing

### Grid Data Structure
**Structure**: 2D array of cell objects containing:
- `letter`: The correct letter for this position
- `currentLetter`: The currently displayed letter
- `wordIndices`: Array of word indices this cell belongs to (for intersections)
- `letterIndices`: Map of wordIndex → letterIndex for each word

**Intersection Handling**:
- Cells at intersections belong to multiple words simultaneously
- Color logic checks ALL words and returns highest priority color
- Priority order: correct > wrong-position > connected-word > wrong-word

### Color Coding System
**Implementation**: Dynamic class assignment based on letter analysis
**Priority Order**: correct > wrong-position > connected-word > wrong-word

**Key Functions**:
- `getLetterColorClass()`: Main color determination function
- `getLetterColorForWord()`: Word-specific color logic

### Interaction Model
**Mechanism**: Two-click interaction pattern
- Track single selected cell
- CSS transitions for visual feedback

**Key Functions**:
- `selectCell()`: Handle cell selection
- `swapLetters()`: Execute letter swapping with animations

## Modular Architecture

### Module Organization
**Location**: `scripts/` directory with clean separation of concerns.

### Core Engine Modules
**Location**: `scripts/core/`
- **`crossword-engine.js`**: Layout generation algorithms (`generateCrosswordLayout()`, validation functions)
- **`grid-manager.js`**: Grid data structure creation (`createGrid()`, `placeWordsInGrid()`)
- **`color-logic.js`**: Color determination logic (`getLetterColorClass()`)

### Gameplay Modules
**Location**: `scripts/gameplay/`
- **`difficulty-system.js`**: Letter scrambling algorithms (`scrambleLettersByDifficulty()`)
- **`game-controller.js`**: Game flow control (`initGame()`, `checkVictory()`)
- **`ui-interactions.js`**: User interface interactions (`renderCrossword()`, `selectCell()`)
- **`victory-animations.js`**: Victory celebration animations (`playVictoryAnimation()`)

### Utility Modules
**Location**: `scripts/utils/`
- **`headline-manager.js`**: Headline lifecycle management (`getNextHeadline()`)
- **`async-rss-fetcher.js`**: Parallel RSS fetching system (`fetchHeadlinesFromAllSources()`)
- **`headline-scorer.js`**: Headline scoring and filtering (`scoreHeadline()`)
- **`rss-parser.js`**: RSS feed parsing (`fetchLatestHeadlines()`)
- **`html-processor.js`**: HTML processing utilities (`stripHTML()`)
- **`debug-utils.js`**: Debug panel and development tools (`toggleDebugPanel()`)

### Main Entry Point
**Location**: `scripts/main.js`
- Global state variable declarations
- Module coordination and initialization

## Configuration Systems

### Victory Animations System
**Location**: `data.js` - Configurable animation parameters

```javascript
const victoryAnimationConfig = {
    animationType: 'wave',      // Options: 'wave', 'jump', 'colorWave', 'shake', 'none'
    duration: 500,              // Total animation duration in ms
    staggerDelay: 30,          // Delay between each cell animation in ms
    intensity: 'subtle',        // Options: 'subtle', 'moderate', 'strong'
    easing: 'ease-out'          // CSS easing function
};
```

**Animation Types**:
1. **Wave**: Scale and shadow effect traveling across grid
2. **Jump**: Vertical bounce effect from grid center
3. **Color Wave**: Green intensity building in wave pattern
4. **Shake**: Gentle horizontal shake across letters
5. **None**: Direct victory modal (no animation)

### Difficulty System
**Location**: `data.js` - Configurable difficulty levels

```javascript
const difficultySettings = {
    easy: { name: 'Easy - Word Shuffle Only', minSwaps: 2, maxSwaps: 6, maxGreenPercentage: 100 },
    mediumEasy: { name: 'Medium-Easy - 40% Green Max', minSwaps: 3, maxSwaps: 8, maxGreenPercentage: 40 },
    medium: { name: 'Medium - 30% Green Max', minSwaps: 6, maxSwaps: 12, maxGreenPercentage: 30 },
    mediumHard: { name: 'Medium-Hard - 20% Green Max', minSwaps: 8, maxSwaps: 16, maxGreenPercentage: 20 },
    hard: { name: 'Hard - 15% Green Max', minSwaps: 12, maxSwaps: 24, maxGreenPercentage: 15 }
};
```

**Algorithm**: Two-phase scrambling with green percentage constraints
- Phase 1: Reduce green percentage to meet difficulty target
- Phase 2: Reach minimum swap count while maintaining constraint

### Star Rating System
**Location**: `data.js` - Performance rating configuration

```javascript
const starRatingConfig = {
    baseMultiplier: 1,           // Base multiplier for minimum swaps
    starThresholds: {           // Multipliers for star thresholds
        5: 3.0,    // 5 stars: ≤ wordCount × 3
        4: 5.0,    // 4 stars: ≤ wordCount × 4.5
        3: 7.0,    // 3 stars: ≤ wordCount × 6
        2: 12.0,   // 2 stars: ≤ wordCount × 9
        1: Infinity // 1 star: any number of swaps
    },
    ratingLabels: {             // Performance rating labels
        5: 'PERFECT', 4: 'EXCELLENT', 3: 'GOOD', 2: 'FAIR', 1: 'COMPLETE'
    }
};
```

### Headline Scoring System
**Location**: `data.js` - Configurable headline filtering and scoring

```javascript
const headlineScoringConfig = {
    minWords: 4,                // Minimum words required
    maxWords: 6,                // Maximum words for optimal score
    minWordLength: 4,           // Filter words with 3 letters or less
    filteredWordPenalty: -1,    // Penalty for filtered words
    wordCountPenalty: -1,       // Penalty for words outside ideal range
    noDescriptionPenalty: -999, // Severe penalty for no description
    stopWords: [...],           // Words to exclude from headlines
    rssConfig: {                // RSS parsing configuration
        minWordLengthForParsing: 2,
        skipWordsInParsing: [...],
        cacheTimeout: 300000,   // 5-minute cache
        loadingAnimationDelay: 300
    }
};
```

### Localization System
**Location**: `data.js` - Language configuration

```javascript
const defaultLanguageConfig = {
    defaultLanguage: 'auto'     // 'auto', 'en', or 'ru'
};
```

### RSS Language Configuration
**Location**: `data.js` - RSS source language control

```javascript
const rssLanguageConfig = {
    rssLanguage: 'auto'         // 'auto', 'ru', or 'en'
};
```

## Data Flow Systems

### Game Flow
1. **Initialization**: `initGame()` → `generateCrosswordLayout()` → `scrambleLettersByDifficulty()`
2. **Interaction**: `selectCell()` → `swapLetters()` → `getLetterColorClass()` (real-time updates)
3. **Victory**: `checkVictory()` → `playVictoryAnimation()` → `showVictory()`

### Headline Management Flow
1. **Fetching**: `fetchHeadlinesFromAllSources()` → Parallel RSS fetching with caching
2. **Processing**: `fetchLatestHeadlines()` → `processAndGroupHeadlines()` → Scoring and filtering
3. **Selection**: `getNextHeadline()` → Pool-based selection with quality prioritization

### RSS Integration Flow
1. **Source Selection**: `getRSSSourcesForCurrentLanguage()` → Language-aware source selection
2. **Fetching**: `fetchFromMultipleSources()` → Parallel execution with loading management
3. **Parsing**: `processRSSItems()` → HTML processing and headline cleaning
4. **Scoring**: `scoreHeadline()` → Quality assessment and pool management
5. **Attribution**: Source information preserved through entire pipeline to debug panel

## Key Functions Reference

### Core Game Functions
- `generateCrosswordLayout()`: Main layout generation with validation
- `scrambleLettersByDifficulty()`: Strategic letter scrambling with constraints
- `getLetterColorClass()`: Color determination for visual feedback
- `checkVictory()`: Victory condition checking
- `playVictoryAnimation()`: Field animations before victory modal

### Headline Management Functions
- `fetchHeadlinesFromAllSources()`: Parallel RSS fetching with caching
- `processAndGroupHeadlines()`: Processing and scoring pipeline
- `getNextHeadline()`: Quality-based headline selection
- `markHeadlineAsUsed()`: Track used headlines to avoid repeats

### Utility Functions
- `stripHTML()`: Comprehensive HTML detection and cleaning
- `t('key')`: Translation function for localization
- `toggleDebugPanel()`: Debug panel management
