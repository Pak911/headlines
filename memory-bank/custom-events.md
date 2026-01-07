# Custom Events Documentation

This document lists all custom events used in the Headlines Crossword Game, including their parameters, producers, and consumers.

## Event Naming Convention

All events use the `headlines:` prefix for game-specific events.

## Platform Events

### Core Platform Events

#### `headlines:platform:ready`
- **Purpose**: Fired when the platform adapter has successfully initialized
- **Dispatched From**: `js/platforms/platformAdapter.js` - PlatformAdapter.init()
- **Data Structure**:
  ```javascript
  {
    platformType: string  // 'y', 'web', or 'unknown'
  }
  ```
- **Listeners**: `js/utils/gamestats.js` - GameStats module waits for platform initialization before loading stats

## Game Events

### Core Game Events

#### `headlines:puzzle:solved`
- **Purpose**: Fired when a player successfully solves a crossword puzzle
- **Dispatched From**: `js/gameplay/game-controller.js` - showVictory() function
- **Data Structure**:
  ```javascript
  {
    puzzleHash: string,  // djb2 hash of the solved headline
    puzzleLink: string   // URL link to the original article
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

## Event Consumption

### GameStats Module (`js/utils/gamestats.js`)
- Listens to `headlines:platform:ready`, `headlines:puzzle:solved`, and `headlines:puzzle:skipped` events
- Waits for platform initialization before loading existing stats from storage
- Maintains running counters for solved and skipped puzzles
- Persists stats using platform storage functions
- Provides `getCurrentStats()` for retrieving current statistics