# System Patterns: Headlines Letter-Swap Crossword Game

## Architecture Overview
Single-page application (SPA) with all logic contained in index.html:
- Pure HTML/CSS/JavaScript implementation
- No external dependencies
- Client-side only (no server required)

## Key Technical Decisions

### 1. Crossword Generation Algorithm
- **Pattern**: Multi-phase generation with strict validation
  - Phase 1: Attempt intelligent placement using shared letters
  - Phase 2: Validate connectivity and parallel spacing
  - Phase 3: Fallback to structured layout if needed
  - Phase 4: Caption rejection and retry system
- **Key Components**:
  - `findCommonLetters()`: Identifies intersection opportunities
  - `isValidPlacement()`: Ensures proper spacing and intersections
  - `isLayoutConnected()`: Validates all words form single connected component
  - `hasProperParallelSpacing()`: Ensures parallel words have minimum gaps
  - `doWordsShareMultipleLetters()`: Prevents words from sharing more than one letter
  - `hasValidLetterSharing()`: Validates entire layout for proper letter sharing
  - `generateCrosswordLayout()`: Main generation logic with validation
  - `generateSimpleLayout()`: Fallback for edge cases

### 2. Grid Data Structure
- 2D array of cell objects containing:
  - `letter`: The correct letter for this position
  - `currentLetter`: The currently displayed letter
  - `wordIndices`: Array of word indices this cell belongs to (for intersections)
  - `letterIndices`: Map of wordIndex → letterIndex for each word
  - `originalRow/Col`: Original position for reference

#### Critical Pattern: Intersection Cell Handling
**Problem**: Cells at word intersections belong to multiple words simultaneously and require special handling for color determination and letter swapping.

**Solution**: Multi-word cell structure with priority-based color logic:

```javascript
// Intersection cell structure
{
  letter: 'T',           // Target letter
  currentLetter: 'E',    // Current scrambled letter
  wordIndices: [0, 3],   // Belongs to words 0 and 3
  letterIndices: {       // Position in each word
    0: 0,                // First letter of word 0
    3: 0                 // First letter of word 3
  }
}
```

**Key Implementation Details**:
1. **Grid Creation**: `placeWordsInGrid()` detects intersections and adds to existing `wordIndices`
2. **Color Logic**: `getLetterColorClass()` checks ALL words and returns highest priority color
3. **Swapping Logic**: Only `currentLetter` changes; word memberships remain intact
4. **Priority Order**: correct > wrong-position > connected-word > wrong-word

**Why This Works**:
- Intersection cells maintain structural integrity during letter swaps
- Color determination considers all word relationships simultaneously
- Connected word logic properly handles duplicate letters across intersections
- Test framework and main game use identical intersection handling

### 3. Color Coding System
- **Implementation**: Dynamic class assignment based on letter analysis
- **Logic Flow**:
  1. Check if letter is in correct position (green)
  2. Find where current letter belongs
  3. Determine relationship between current and target word
  4. Apply appropriate color class

### 4. Interaction Model
- **Selection State**: Track single selected cell
- **Swap Mechanism**: Two-click interaction pattern
- **Animation**: CSS transitions for visual feedback

## Critical Implementation Paths

### Crossword Validation Rules
```javascript
// Parallel words must have gap
if (newWord.direction === existing.direction) {
    if (rowDiff === 1 && colDiff === 0) return false;
}
// Must have intersection (except first word)
return layout.words.length === 0 || hasIntersection;
```

### Grid Normalization
- Add padding to ensure positive indices
- Calculate bounds before normalization
- Adjust all positions relative to minimum values

### 5. Difficulty System & Letter Scrambling Algorithm
- **Pattern**: Configurable constraint-based scrambling with green letter percentage limits
- **Key Innovation**: Strategic swap-based approach that guarantees solvability

#### Difficulty Configuration Structure
**Location**: `data.js` (for easy configuration and adjustment)

```javascript
// Difficulty system configuration
let currentDifficulty = 'medium'; // Default difficulty

const difficultySettings = {
    easy: { 
        name: 'Easy - Word Shuffle Only', 
        minSwaps: 2, maxSwaps: 6, 
        maxGreenPercentage: 100  // No constraint
    },
    medium: { 
        name: 'Medium - 30% Green Max', 
        minSwaps: 6, maxSwaps: 12, 
        maxGreenPercentage: 30   // Max 30% correct letters
    },
    hard: { 
        name: 'Hard - 15% Green Max', 
        minSwaps: 12, maxSwaps: 24, 
        maxGreenPercentage: 15   // Max 15% correct letters
    }
};
```

**Configuration Guidelines**:
- Edit `data.js` to modify difficulty settings
- `maxGreenPercentage`: Controls maximum percentage of correct letters remaining after scrambling
- `minSwaps`/`maxSwaps`: Define the range of swaps performed during scrambling
- `name`: Display name shown in UI and debug information

#### Scrambling Algorithm Logic
**Core Principle**: Every puzzle is solvable in exactly the number of swaps performed during scrambling.

**Two-Phase Approach**:
1. **Phase 1 - Aggressive Reduction**: Systematically reduce green letter percentage to meet target
   - Prioritize swapping correct cells with wrong cells
   - Fall back to correct-with-correct swaps when needed
   - Continue until green percentage ≤ target

2. **Phase 2 - Minimum Swap Requirement**: Reach minimum swap count while maintaining constraint
   - Perform neutral swaps (wrong-with-wrong) when at target
   - Ensure minimum difficulty threshold is met

**Strategic Targeting**:
- **Easy**: Only shuffle within individual words, preserve all intersections
- **Medium-Easy/Medium/Medium-Hard/Hard**: Use constraint-based algorithm with different green percentage limits
- **Intersection Priority**: Intersection cells are prioritized for swapping due to maximum impact

#### Key Functions
- `scrambleWithGreenConstraint()`: Main constraint-based algorithm
- `countCorrectCells()`: Tracks green letter percentage in real-time
- `performStrategicSwap()`: Executes swaps and maintains swap log for solvability
- `changeDifficulty()`: Resets grid and applies new difficulty settings

**Why This Approach Works**:
- Guarantees every puzzle has a known minimum solution
- Provides clear difficulty progression through green letter constraints
- Maintains crossword structure integrity during scrambling
- Allows fine-tuning of difficulty through configurable parameters

## Design Patterns Used
1. **State Management**: Module-level variables for game state
2. **Event Delegation**: Click handlers on individual cells
3. **Factory Pattern**: Grid and layout generation functions
4. **Observer Pattern**: Implicit through DOM updates
5. **Strategy Pattern**: Different scrambling algorithms per difficulty level
6. **Configuration Pattern**: Centralized difficulty settings with runtime modification

## Modular Architecture (2025-01-08 Refactoring)

### Module Organization Pattern
**Achievement**: Successfully refactored monolithic 2,847-line script.js into 9 focused modules following clean separation of concerns.

### Core Engine Modules
**Location**: `scripts/core/`
- **`crossword-engine.js`** (450+ lines)
  - Layout generation algorithms (`generateCrosswordLayout`, `tryGenerateLayout`)
  - Layout scoring and optimization (`scoreLayout`, `scoreWordPlacement`)
  - Validation systems (`isLayoutConnected`, `hasProperParallelSpacing`, `hasNoEndToEndAdjacency`)
  - Word intersection logic (`findCommonLetters`, `isValidPlacement`)
  - Layout normalization (`normalizeLayout`)

- **`grid-manager.js`** (200+ lines)
  - Grid data structure creation (`createGrid`, `placeWordsInGrid`)
  - Word connection mapping (`findWordConnections`)
  - Cell utility functions (`getIntersectionCells`, `getWordCells`)
  - Grid state management and intersection handling

- **`color-logic.js`** (200+ lines)
  - Universal color determination (`getLetterColorClass`, `getLetterColorForWord`)
  - Wordle-style duplicate letter handling
  - Connected word relationship analysis
  - Compatible with both main game and test framework

### Gameplay Modules
**Location**: `scripts/gameplay/`
- **`difficulty-system.js`** (300+ lines)
  - Strategic letter scrambling (`scrambleLettersByDifficulty`, `scrambleWithGreenConstraint`)
  - Difficulty-specific algorithms (`scrambleEasy`, `scrambleWithGreenConstraint`)
  - Swap execution and logging (`performStrategicSwap`)
  - Difficulty management (`changeDifficulty`, `updateDifficultyDisplay`)

- **`game-controller.js`** (200+ lines)
  - Game initialization and flow control (`initGame`, `enhancedInitGame`)
  - Victory condition checking (`checkVictory`, `showVictory`)
  - Headline management integration
  - Keyboard event handling and debug panel toggling

- **`ui-interactions.js`** (100+ lines)
  - Crossword rendering (`renderCrossword`)
  - Cell selection and interaction (`selectCell`)
  - Letter swapping with animations (`swapLetters`)
  - Visual feedback and state updates

### Utility Modules
**Location**: `scripts/utils/`
- **`headline-manager.js`** (150+ lines)
  - Headline lifecycle tracking (`getNextHeadline`, `markHeadlineAsUsed`, `markHeadlineAsRejected`)
  - Pool management (`initializeHeadlineManagement`)
  - Alternative headline analysis (`generateAlternativeHeadlines`, `calculateHeadlineCompatibility`)
  - Compatibility scoring and common letter counting

- **`debug-utils.js`** (400+ lines)
  - Debug panel management (`toggleDebugPanel`, `updateDebugInfo`)
  - Grid state analysis and export (`updateGridStateCode`)
  - Test case generation (`getNextTestCaseNumber`)
  - Development utilities (`copyGridState`, `copyGridStateJS`)

### Main Entry Point
**Location**: `scripts/`
- **`main.js`** (50+ lines)
  - Global state variable declarations
  - Module coordination and initialization
  - DOM ready event handling
  - Utility functions shared across modules (`countCorrectCells`)

### Module Loading Order
**Critical Dependency Chain** (as defined in `index.html`):
```html
<!-- Data -->
<script src="data.js"></script>

<!-- Core Engine (foundational algorithms) -->
<script src="scripts/core/crossword-engine.js"></script>
<script src="scripts/core/grid-manager.js"></script>
<script src="scripts/core/color-logic.js"></script>

<!-- Gameplay (user-facing features) -->
<script src="scripts/gameplay/difficulty-system.js"></script>
<script src="scripts/gameplay/game-controller.js"></script>
<script src="scripts/gameplay/ui-interactions.js"></script>

<!-- Utilities (supporting functions) -->
<script src="scripts/utils/headline-manager.js"></script>
<script src="scripts/utils/debug-utils.js"></script>

<!-- Main Entry Point (coordination) -->
<script src="scripts/main.js"></script>
```

### Modularization Benefits Achieved
1. **Single Responsibility**: Each module handles one specific aspect of the game
2. **Maintainability**: Easier to locate and modify specific functionality
3. **Debugging**: Issues can be isolated to specific functional areas
4. **Collaboration**: Multiple developers can work on different modules simultaneously
5. **Testing**: Individual modules can be tested in isolation
6. **Performance**: Modules can be loaded conditionally if needed in future

### Global State Management
**Pattern**: Centralized global variables in `main.js` with module-specific functions
- Core game state (`currentHeadline`, `grid`, `crosswordLayout`) declared in main.js
- Each module contains functions that operate on global state
- No module-to-module direct dependencies (all communication through globals)
- Clean separation between data (global) and behavior (modular)

## Victory Animations System (2025-01-08)

### Configurable Animation Pattern
**Achievement**: Implemented fully configurable victory animations that play on the game field when all letters turn green, providing satisfying feedback before the victory modal appears.

### Configuration-Driven Design
**Location**: `data.js` - Single source of truth for animation parameters

```javascript
// Victory Animation Configuration
const victoryAnimationConfig = {
    animationType: 'wave',      // Options: 'wave', 'jump', 'colorWave', 'shake', 'none'
    duration: 500,              // Total animation duration in ms
    staggerDelay: 30,          // Delay between each cell animation in ms
    intensity: 'subtle',        // Options: 'subtle', 'moderate', 'strong'
    easing: 'ease-out'          // CSS easing function
};
```

### Animation Module Pattern
**Location**: `scripts/gameplay/victory-animations.js`

#### 1. Victory Animation Controller (`victory-animations.js`)
**Pattern**: Configurable animation system with multiple distinct animation types

**Core Functions**:
- `playVictoryAnimation()`: Main entry point that selects and plays configured animation
- `playWaveAnimation()`: Letters pulse in wave pattern across grid
- `playJumpAnimation()`: Letters bounce up/down in ripple sequence from center
- `playColorWaveAnimation()`: Green color intensity builds in wave pattern
- `playShakeAnimation()`: Gentle horizontal shake travels across grid

**Integration Pattern**:
```javascript
// In ui-interactions.js - modified victory flow
if (checkVictory()) {
    setTimeout(playVictoryAnimation, 300); // Instead of showVictory
}
```

**Animation Types**:
1. **Wave**: Scale and shadow effect traveling across grid in row/column order
2. **Jump**: Vertical bounce effect radiating from grid center
3. **Color Wave**: Brighter green color intensity building in wave pattern
4. **Shake**: Gentle horizontal shake with wave timing
5. **None**: Direct victory modal (no animation)

#### 2. Material Design Compliance
**Pattern**: Subtle, performance-optimized animations following design guidelines

**Implementation Details**:
- **Performance**: CSS transforms for 60fps animations (hardware accelerated)
- **Subtlety**: Configurable intensity levels ('subtle', 'moderate', 'strong')
- **Consistency**: Animations match existing color palette and timing
- **Accessibility**: Smooth transitions without jarring movements

```javascript
// Example: Wave Animation Implementation
cell.element.style.transition = `all ${duration}ms ${easing}`;
cell.element.style.transform = 'scale(1.15)';
cell.element.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
```

### Benefits Achieved
1. **Enhanced User Experience**: Satisfying feedback when puzzles are completed
2. **Configurable**: Easy to change animation type and parameters
3. **Performance**: Smooth 60fps animations using hardware acceleration
4. **Design Compliant**: Follows Material Design principles and existing styling
5. **Maintainable**: Clean separation of animation logic from game flow
6. **Extensible**: Easy to add new animation types in future

## Enhanced Headline Management System (2025-01-08)

### Configurable Architecture Pattern
**Achievement**: Implemented fully configurable headline management with centralized configuration in `data.js` for easy parameter adjustment without code modification.

### Configuration-Driven Design
**Location**: `data.js` - Single source of truth for all system parameters

```javascript
// Centralized configuration object
const headlineScoringConfig = {
    // Core scoring parameters
    minWords: 4,                    // Minimum words after filtering
    maxWords: 5,                    // Maximum words for ideal score
    idealMinWords: 4,               // Ideal minimum word count
    idealMaxWords: 5,               // Ideal maximum word count
    minWordLength: 4,               // Minimum individual word length
    
    // Penalty system
    filteredWordPenalty: -1,        // Penalty per filtered word
    wordCountPenalty: -1,           // Penalty per word outside ideal range
    noDescriptionPenalty: -999,     // Penalty for headlines without description
    
    // Configurable filtering
    stopWords: [...],               // Trash/stop words to filter out
    
    // RSS processing configuration
    rssConfig: {
        defaultCount: 10,           // Default headlines per RSS source
        minWordLengthForParsing: 2, // Minimum word length during parsing
        skipWordsInParsing: [...]   // Words to skip during RSS parsing
    }
};
```

### Headline Management Modules
**Location**: `scripts/utils/`

#### 1. Parallel RSS Fetcher (`async-rss-fetcher.js`)
**Pattern**: Asynchronous parallel processing with intelligent caching and fallback
- **Parallel Execution**: All RSS sources fetch simultaneously using `Promise.all()`
- **Smart Caching**: 5-minute cache prevents repeated API calls
- **Loading Management**: Shows animation if fetching exceeds 5 seconds
- **Graceful Degradation**: Falls back to mock data if RSS fails
- **Performance**: Instant loading vs previous 24+ second sequential approach

```javascript
// Core parallel fetching pattern
const fetchPromises = sources.map(source => 
    AsyncRSSFetcher.fetchFromSource(source)
);
const results = await Promise.all(fetchPromises);
```

#### 2. Intelligent Headline Scorer (`headline-scorer.js`)
**Pattern**: Configuration-driven scoring with multi-criteria evaluation
- **Configurable Filtering**: Uses parameters from `data.js` for all thresholds
- **Multi-Stage Scoring**: Applies trash word filtering, length filtering, and word count penalties
- **Pool Management**: Groups headlines by score for intelligent selection
- **Source Attribution**: Preserves RSS source information through scoring process

```javascript
// Configuration-driven scoring pattern
const config = getConfig();
const STOP_WORDS = getStopWordsSet();

// Apply configurable penalties
if (STOP_WORDS.has(wordLower)) {
    score += config.filteredWordPenalty;
} else if (word.length <= 3) {
    score += config.filteredWordPenalty;
}
```

#### 3. Enhanced RSS Parser (`rss-parser.js`)
**Pattern**: Configuration-aware parsing with source attribution
- **API Compatibility**: Fixed RSS2JSON API issues by removing problematic parameters
- **Source Preservation**: Maintains source name and category through processing pipeline
- **Configurable Processing**: Uses parameters from `data.js` for word filtering and parsing

#### 4. Async RSS Fetcher (`async-rss-fetcher.js`)
**Pattern**: High-performance parallel fetching with caching and loading states
- **Simultaneous Processing**: Fetches from all 7+ RSS sources in parallel
- **Cache Management**: Intelligent caching with configurable expiration
- **Loading State Management**: Provides loading animations and progress feedback
- **Error Handling**: Robust fallback to mock data when RSS sources fail

### Source Attribution System
**Pattern**: End-to-end source tracking from RSS to debug display

**Data Flow**:
1. **RSS Parser**: Extracts source name and category from RSS metadata
2. **Headline Scorer**: Preserves source information through scoring process
3. **Debug Panel**: Displays source attribution in headline pools and current headline info

**Implementation**:
```javascript
// Source information preserved throughout pipeline
headline = {
    text: "PROCESSED HEADLINE TEXT",
    words: ["PROCESSED", "HEADLINE", "TEXT"],
    sourceName: "BBC Technology",    // From RSS source
    category: "technology",          // From RSS source
    score: -2,                      // From scoring system
    // ... other properties
};
```

### Pool-Based Selection System
**Pattern**: Score-based prioritization with randomization within tiers

**Selection Algorithm**:
1. Group headlines by score (higher scores = better headlines)
2. Select from highest scoring pool first
3. Randomize within equal-score pools
4. Move to next pool when current pool exhausted
5. Track used/rejected headlines to avoid repeats

**Benefits**:
- Ensures best quality headlines are used first
- Provides variety through randomization within quality tiers
- Maintains headline quality standards throughout gaming session
- Enables debugging and monitoring of headline quality distribution

### Configuration Benefits
1. **Easy Tuning**: Modify scoring parameters without code changes
2. **A/B Testing**: Quick parameter adjustments for testing different configurations
3. **Maintainability**: Single location for all system parameters
4. **Transparency**: Clear documentation of all configurable values
5. **Flexibility**: Easy adaptation to different news sources or scoring criteria

### Performance Achievements
- **Loading Time**: 24+ seconds → instant (parallel fetching)
- **RSS Success Rate**: 75% (7/8 sources working reliably)
- **Headline Quality**: Real current news with intelligent scoring
- **Cache Efficiency**: 5-minute cache prevents API rate limiting
- **Source Attribution**: Complete source tracking from RSS to display

## Localization System (2025-08-10)

### Zero-Dependency Architecture Pattern
**Achievement**: Implemented fully functional localization system with zero external dependencies, following pure JavaScript approach consistent with existing architecture.

### File Structure Pattern
**Location**: `localization/` directory with modular language files

```
localization/
├── en.js          # English translations (key-value structure)
├── ru.js          # Russian translations (key-value structure)  
└── i18n.js        # Localization manager and core logic
```

### Configuration-Driven Design
**Location**: `data.js` - Centralized default language configuration

```javascript
// Default language configuration
const defaultLanguageConfig = {
    // Set to 'auto' to detect browser language, or specify 'en' or 'ru'
    defaultLanguage: 'auto'
};
```

### Localization Manager Pattern
**Location**: `localization/i18n.js`

#### Core Architecture
- **Language Detection**: Browser language detection with fallback to English
- **Configuration Override**: Respects `defaultLanguageConfig` from data.js
- **Storage Management**: localStorage for user preference persistence
- **Dynamic Updates**: Real-time UI updates when language changes

#### Key Functions
- `detectLanguage()`: Smart language detection with configuration override
- `t(key)`: Translation function with dot-notation key access
- `setLanguage(lang)`: Language switching with UI updates
- `updateUI()`: Coordinated UI refresh across all modules

#### Translation Structure Pattern
**Location**: Individual language files (`en.js`, `ru.js`)

```javascript
// Example: English translations (en.js)
const en = {
    game: {
        title: "Headlines",
        instructions: "Swap letters to reconstruct the news headline!<br>Click two letters to swap their positions.<br>The tip below is a hint about the article's headline."
    },
    ui: {
        swaps: "Swaps",
        nextHeadline: "Next Headline"
    }
    // ... more translation keys
};
```

### Integration Pattern
**Location**: `scripts/main.js` and individual modules

#### Global Access
- `t('key.path')`: Universal translation function available everywhere
- `setLanguage('en')`: Global language switching function
- Automatic UI updates through coordinated refresh system

#### Module Integration
- **Main.js**: Centralized text updating (`updateLocalizedText()`)
- **Game Controller**: Dynamic victory modal content
- **UI Interactions**: Real-time legend and button text updates
- **Data.js**: Configurable default language behavior

### Benefits Achieved
1. **Zero Dependencies**: Pure JavaScript implementation consistent with project philosophy
2. **Configurable**: Easy default language setting in data.js
3. **Extensible**: Simple addition of new languages through new files
4. **Persistent**: User preferences saved in localStorage
5. **Material Design**: Consistent styling with existing UI
6. **Maintainable**: Clean separation of translations from code logic
7. **Performance**: Instant language switching with minimal overhead
