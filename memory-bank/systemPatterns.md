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
