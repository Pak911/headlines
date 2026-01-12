# Project Brief: Headlines Letter-Swap Crossword Game

## Project Name
Captions - A letter-swapping crossword puzzle game

## Core Purpose
Create an engaging word puzzle game where players swap individual letters to reconstruct news headlines arranged in a crossword format. The game functions in two modes: a "Daily News" mode fetching live RSS feeds, and a "Challenge Mode" allowing players to create and share custom puzzles via URL.

## Key Requirements

1. **Crossword Layout**: Words must be arranged in a proper crossword pattern where:
   - Words intersect at shared letters (not just touch)
   - Parallel words have at least one square gap between them
   - Each word crosses at least one other word
   - Words share exactly one letter with any intersecting word (no multiple shared letters)

2. **Letter Swapping Mechanics**: 
   - Players swap individual letters (not whole words)
   - Click two letters to swap their positions
   - Letters are randomly scrambled at game start

3. **Visual Feedback**:
   - Green: Letter in correct position
   - Orange: Letter belongs to current word but wrong position
   - Purple: Letter belongs to connected/intersecting word
   - Gray: Letter belongs to non-connected word

4. **Headlines (Standard Mode)**: 
   - All headlines must contain at least 4 words
   - Headlines should be realistic news-style phrases
   - Headlines must include descriptions that provide semantic clues for solving

5. **Custom Puzzle Creator (`create.html`)**:
   - **Interface**: A standalone page allowing users ("Alice") to input a custom Headline (puzzle words) and a Hint (description).
   - **Validation Logic**:
     - **Word Count**: Input must contain at least 5 words.
     - **Word Length**: Each word must be at least 4 letters long.
     - **Alphabet Consistency**: All characters must belong to a single alphabet (English OR Russian); mixed scripts are rejected.
     - **Language Detection**: Automatically detects language; users cannot manually override this to prevent mismatches.
   - **Preview & Generation**:
     - User clicks "Preview" to generate a valid crossword layout using the game engine.
     - If valid, the user can verify the layout.
     - On confirmation, the system generates a shareable link.
     - **Data Encoding**: The Headline, Hint, and Language are compressed (using `LZ-String` or similar) and encoded into a URL parameter (e.g., `index.html?p=encryptedString`).
   - **Clipboard**: "Copy Link" button automatically copies the generated URL to the clipboard.

6. **Custom Puzzle Player Flow ("Bob")**:
   - **Initialization**: When `index.html` loads, it checks for URL parameters.
   - **Bypass Logic**: If parameters exist, the game skips RSS fetching and decodes the custom payload to build the board.
   - **Completion Flow**: Upon solving the puzzle (or clicking "Give Up"), the "Next Puzzle" button transitions the player **back to Standard Mode** (fetching RSS news), rather than replaying the custom puzzle.

7. **Hint System**:
   - Contextual hints from descriptions guide players toward solutions
   - Descriptions provide semantic similarity to headlines for meaningful clues
   - Hint system is essential for player engagement and puzzle solvability

## Success Criteria
- Proper crossword generation with valid intersections
- Intuitive letter-swapping interface
- Clear color-coded feedback system
- Successful encoding/decoding of custom puzzle links (serverless sharing)
- Robust validation preventing invalid custom puzzles (mixed languages, short words)
- Smooth transition between Custom Mode and Standard Mode