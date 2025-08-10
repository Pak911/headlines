# Crossword Game Test Suite Explanation

## Overview

This document explains the comprehensive test suite implemented in `test.html` to verify the crossword game's color logic. The tests cover duplicate letter handling, connected word detection, and complex multi-word intersections.

## Test Case 1: Duplicate Letter Handling

**Purpose**: Tests Wordle-style duplicate letter logic to prevent misleading players.

**Scenario**: Target word "GRASS" vs player guess "GRRSS"

**Setup**:
- Target: G-R-A-S-S
- Guess:  G-R-R-S-S

**Expected Results**:
- G (position 0): Green ✓ (correct position)
- R (position 1): Green ✓ (correct position)  
- R (position 2): Gray ✓ (duplicate R - only one R exists in target word)
- S (position 3): Green ✓ (correct position)
- S (position 4): Green ✓ (correct position)

**Why This Matters**: Without proper duplicate letter handling, players would be misled into thinking there are more occurrences of a letter than actually exist in the target word.

## Test Case 3: Three-Way Word Intersection

**Purpose**: Tests complex scenarios with three intersecting words showing all four color variants.

**Words**:
- Word 0: "CROSS" (horizontal, positions 4,2 to 4,6)
- Word 1: "ROAD" (vertical, positions 2,4 to 5,4, intersecting CROSS at position 4,4)
- Word 2: "SEA" (vertical, positions 4,5 to 6,5, intersecting CROSS at position 4,5)

**Setup for CROSS word**:
- Target: C-R-O-S-S
- Guess:  C-O-R-Z-S

**Expected Color Coding for CROSS**:
- C: Green (correct position)
- O: Yellow (wrong position - O exists in CROSS but belongs at position 2, not 1)
- R: Blue (connected word - R exists in connected word ROAD)
- Z: Gray (wrong word - Z doesn't exist in any connected words)
- S: Green (correct position)

**Intersections**: CROSS intersects ROAD at position 4,4 and SEA at position 4,5

## Test Case 4: Complex Multi-Word Scenario

**Purpose**: Tests four-way intersection with all words properly connected and all color variants demonstrated.

**Words**:
- Horizontal: "PUZZLE" (positions 3,1 to 3,6)
- Vertical: "GAZE" (positions 1,3 to 4,3, crossing PUZZLE at 'Z')
- Vertical: "ZEST" (positions 3,4 to 6,4, crossing PUZZLE at 'Z')
- Vertical: "ELSE" (positions 3,6 to 6,6, crossing PUZZLE at 'E')

**Proper Crossword Intersections**:
- PUZZLE-Z intersects with GAZE-Z at position (3,3)
- PUZZLE-Z intersects with ZEST-Z at position (3,4)
- PUZZLE-E intersects with ELSE-E at position (3,6)

**Expected Color Coding**:

**PUZZLE**:
- P: Green (correct position)
- L: Yellow (wrong position - L exists in PUZZLE but not at position 1)
- Z: Green (correct position)
- Z: Green (correct position)
- A: Blue (connected - A exists in GAZE)
- E: Green (correct position)

**GAZE**:
- G: Green (correct position)
- L: Yellow (wrong position - L exists in PUZZLE but not at position 1)
- Z: Green (correct position)
- X: Gray (wrong - X doesn't exist anywhere)

**ZEST**:
- Z: Green (correct position)
- E: Green (correct position)
- S: Green (correct position)
- P: Blue (connected - P exists in PUZZLE)

**ELSE**:
- E: Green (correct position)
- Z: Yellow (wrong position - Z exists in PUZZLE but not at this position)
- G: Blue (connected - G exists in GAZE)
- X: Gray (wrong - X doesn't exist anywhere)

## Color Legend

- **Green (#6aaa64)**: Correct Position - Letter is in the exact correct position
- **Orange (#f5a623)**: Right word, wrong position - Letter exists in word but in wrong position
- **Purple (#9b59b6)**: Belongs to connected word - Letter belongs to a crossing/connected word
- **Gray (#86888a)**: Belongs to other word - Letter doesn't exist anywhere in the puzzle

## Implementation Details

The test suite uses a `TestGrid` class that simulates the crossword grid structure and implements the same color logic as the main game. Each test case manually sets up specific scenarios to verify different aspects of the color coding system.

**Key Features Verified**:
1. Duplicate letter handling prevents misleading hints
2. Connected word detection properly identifies crossing words
3. Multi-word intersections maintain proper color relationships
4. All four color states are correctly applied in various contexts

## Testing Methodology

Each test case:
1. Sets up specific words in predetermined positions
2. Manually configures target letters and player guesses
3. Renders the grid with actual color coding
4. Provides detailed explanations of expected results

This comprehensive test suite ensures the crossword game's color logic works correctly across all scenarios players might encounter.
