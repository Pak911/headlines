# System Patterns: Headlines Letter-Swap Crossword Game

## Architecture Overview
Single-page application (SPA) with all logic contained in index.html:
- Pure HTML/CSS/JavaScript implementation
- No external dependencies
- Client-side only (no server required)

## Key Technical Decisions

### 1. Crossword Generation Algorithm
- **Pattern**: Two-phase generation with validation
  - Phase 1: Attempt intelligent placement using shared letters
  - Phase 2: Fallback to structured layout if needed
- **Key Components**:
  - `findCommonLetters()`: Identifies intersection opportunities
  - `isValidPlacement()`: Ensures proper spacing and intersections
  - `generateCrosswordLayout()`: Main generation logic
  - `generateSimpleLayout()`: Fallback for edge cases

### 2. Grid Data Structure
- 2D array of cell objects containing:
  - `letter`: The correct letter for this position
  - `currentLetter`: The currently displayed letter
  - `wordIndex`: Which word this cell belongs to
  - `letterIndex`: Position within the word
  - `originalRow/Col`: Original position for reference

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

## Design Patterns Used
1. **State Management**: Module-level variables for game state
2. **Event Delegation**: Click handlers on individual cells
3. **Factory Pattern**: Grid and layout generation functions
4. **Observer Pattern**: Implicit through DOM updates
