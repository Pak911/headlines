# Custom Events Documentation

This document lists all custom events used in the Headlines Crossword Game, including their parameters, producers, and consumers.

## Event Naming Convention

All events use the `headlines:` prefix for game-specific events.

## Platform Events

### Core Platform Events

#### `headlines:platform:ready`
- **Purpose**: Fired when the platform adapter has successfully initialized
- **Dispatched From**: 
  - `js/platforms/platformAdapter.js` - PlatformAdapter.init()
  - `js/main.js` - DOMContentLoaded handler after platform initialization
- **Data Structure**:
  ```javascript
  {
    platformType: string  // 'y', 'web', or 'unknown'
  }
  ```
- **Listeners**: 
  - `js/utils/gamestats.js` - GameStats module waits for platform initialization before loading stats
  - `js/tutorials/tutorials.js` - Tutorials module waits for platform initialization before loading tutorial state

#### `headlines:customPuzzle:languageChanged`
- **Purpose**: Fired when a custom puzzle sets a temporary language (for players without saved language preference)
- **Dispatched From**: `js/rss/custom-puzzle-loader.js` - When custom puzzle language is applied
- **Data Structure**:
  ```javascript
  {
    detail: {
      language: string  // 'en' or 'ru' - the custom puzzle's language
    }
  }
  ```
- **Listeners**: `js/tutorials/tutorials.js` - Updates tutorial content to match custom puzzle language

## Game Events

### Core Game Events

#### `headlines:puzzle:solved`
- **Purpose**: Fired when a player successfully solves a crossword puzzle
- **Dispatched From**: `js/gameplay/game-controller.js` - showVictory() function
- **Data Structure**:
  ```javascript
  {
    puzzleHash: string,  // djb2 hash of the solved headline
    puzzleLink: string,  // URL link to the original article
    starCount: number    // Number of stars earned (1-5)
  }
  ```
- **Listeners**: `js/utils/gamestats.js` - GameStats module for statistics tracking

#### `headlines:puzzle:skipped`
- **Purpose**: Fired when a player skips or gives up on a crossword puzzle that hasn't been seen before
- **Dispatched From**: `js/gameplay/game-controller.js` - giveUp() and skipToNextHeadline() functions
- **Data Structure**:
  ```javascript
  {
    puzzleHash: string,  // djb2 hash of the skipped headline
    puzzleLink: string   // URL link to the original article
  }
  ```
- **Listeners**: `js/utils/gamestats.js` - GameStats module for statistics tracking

#### `headlines:buttonPress`
- **Purpose**: Fired when a player interacts with UI elements that should produce a button press sound effect
- **Dispatched From**: 
  - `js/gameplay/ui-interactions.js` - selectCell() function when selecting/deselecting grid cells
  - `js/main.js` - Global click handler for all `<button>` elements
- **Data Structure**: No additional data (empty event)
- **Listeners**: `js/singletons/soundManager.js` - SoundManager module for audio feedback

#### `headlines:wordSolved`
- **Purpose**: Fired when a player correctly solves an individual word in the crossword
- **Dispatched From**: `js/gameplay/ui-interactions.js` - checkWordCompletion() function
- **Data Structure**: No additional data (empty event)
- **Listeners**: `js/singletons/soundManager.js` - SoundManager module for word completion sound effects

#### `headlines:letterSwapStart`
- **Purpose**: Fired when a player begins a letter swap operation (selects first letter)
- **Dispatched From**: `js/gameplay/ui-interactions.js` - selectCell() function when starting a swap
- **Data Structure**: No additional data (empty event)
- **Listeners**: `js/singletons/soundManager.js` - SoundManager module for swap start audio feedback

#### `headlines:letterSwapEnd`
- **Purpose**: Fired when a player completes a letter swap operation (swaps two letters)
- **Dispatched From**: `js/gameplay/ui-interactions.js` - selectCell() function when completing a swap
- **Data Structure**: No additional data (empty event)
- **Listeners**: `js/singletons/soundManager.js` - SoundManager module for swap completion audio feedback

#### `headlines:newCrosswordCreated`
- **Purpose**: Fired when a new crossword puzzle has been generated and rendered
- **Dispatched From**: `js/gameplay/game-controller.js` - enhancedInitGame() function after crossword layout generation and rendering
- **Data Structure**: No additional data (empty event)
- **Listeners**: `js/ui/ui-interactions.js` - UI Interactions module for updating color legend text and sizing

## Event Production Logic

### Platform Ready Event
- Produced only in `PlatformAdapter.init()` after successful platform initialization
- Used to signal that the platform is ready for use

### Puzzle Solved Event
- Produced only in `showVictory()` function after successfully saving seen headline data
- Always fired for completed puzzles
- Used to track player progress and completion statistics

### Puzzle Skipped Event
- Produced in `giveUp()` and `skipToNextHeadline()` functions
- **Important**: Only fired if `Platform.loadSeenHeadline(hash)` returns null (headline not previously seen)
- This prevents double-counting when a player gives up then skips the same headline
- Used to track player engagement and difficulty assessment

### Button Press Event
- Produced in `selectCell()` function when selecting or deselecting grid cells (adding/removing blue border)
- Produced by global click handler for all `<button>` elements in the UI
- Used to provide audio feedback for user interactions
- Does not fire during letter swap operations (when clicking a second cell to perform the swap)

## Event Consumption

### GameStats Module (`js/utils/gamestats.js`)
- Listens to `headlines:platform:ready`, `headlines:puzzle:solved`, and `headlines:puzzle:skipped` events
- Waits for platform initialization before loading existing stats from storage
- Maintains running counters for solved and skipped puzzles
- Persists stats using platform storage functions
- Provides `getCurrentStats()` for retrieving current statistics

### SoundManager Module (`js/singletons/soundManager.js`)
- Listens to `headlines:buttonPress` event
- Plays button press sound effect using oscillator synthesis or sample playback
- Provides audio feedback for UI interactions and grid cell selections

### UI Interactions Module (`js/ui/ui-interactions.js`)
- Listens to `headlines:newCrosswordCreated` event
- Updates color legend text and performs height-based text shortening after new crossword rendering
- Ensures legend text is properly localized and sized for the current grid layout