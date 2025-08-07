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
