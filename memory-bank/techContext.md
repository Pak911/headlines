# Tech Context: Headlines Letter-Swap Crossword Game

## Technology Stack
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Build Tools**: None (direct browser execution)
- **Dependencies**: None (zero dependencies)
- **Hosting Requirements**: Any static file server

## Development Environment
- **Editor**: VSCode
- **Browser**: Modern browsers supporting ES6
- **File Structure**: Modular architecture with main game and test framework
- **Version Control**: Git
- **Run Commands**: 
  - Main game: `start index.html`
  - Test suite: `start test.html`

## File Structure (Post-Modularization)
```
headlines/
├── index.html                          # Main game interface
├── styles.css                          # Game styling and animations
├── data.js                             # Headlines data and configuration
├── script.js                           # Original monolithic file (backup)
├── localization/                       # Localization system
│   ├── en.js                           # English translations
│   ├── ru.js                           # Russian translations
│   └── i18n.js                         # Localization manager
├── scripts/                            # Modular JavaScript architecture
│   ├── main.js                         # Entry point and global state
│   ├── core/                           # Core engine modules
│   │   ├── crossword-engine.js         # Layout generation algorithms
│   │   ├── grid-manager.js             # Grid and word management
│   │   └── color-logic.js              # Wordle-style color feedback
│   ├── gameplay/                       # User-facing game features
│   │   ├── difficulty-system.js        # Letter scrambling algorithms
│   │   ├── game-controller.js          # Game flow and state management
│   │   ├── ui-interactions.js          # User interface interactions
│   │   └── victory-animations.js       # Victory celebration animations
│   └── utils/                          # Supporting utilities
│       ├── headline-manager.js         # Headline lifecycle management
│       ├── async-rss-fetcher.js        # Parallel RSS fetching system
│       ├── headline-scorer.js          # Configurable headline scoring
│       ├── rss-parser.js               # RSS feed parsing and extraction
│       ├── html-processor.js           # HTML detection and stripping utilities
│       └── debug-utils.js              # Debug panel and development tools
├── test/                               # Test framework and utilities
│   ├── test.html                       # Main test interface
│   ├── test-rss-parser.html            # RSS parser testing framework
│   ├── test-html-processor.html        # HTML processing testing framework
│   ├── test-russian-rss.html           # Russian RSS testing framework
│   ├── test-russian-text.html          # Russian text processing tests
│   └── test-explanation.md             # Documentation for test framework
└── memory-bank/                        # Project documentation
    ├── projectbrief.md                 # Project scope and requirements
    ├── productContext.md               # User experience and goals
    ├── systemPatterns.md               # Architecture and design patterns
    ├── techContext.md                  # Technology stack and setup
    └── activeContext.md                # Working log and current status
```

## Modular JavaScript Architecture

### Core Engine Modules (`scripts/core/`)
**Purpose**: Fundamental algorithms and data structures

- **`crossword-engine.js`** (450+ lines)
  - **Functions**: Layout generation, validation, scoring
  - **Key APIs**: `generateCrosswordLayout()`, `isLayoutConnected()`, `hasNoEndToEndAdjacency()`, `doWordsShareMultipleLetters()`, `hasValidLetterSharing()`
  - **Dependencies**: None (pure algorithms)
  - **Purpose**: Creates valid crossword layouts from word lists

- **`grid-manager.js`** (200+ lines)
  - **Functions**: Grid creation, word placement, connection mapping
  - **Key APIs**: `createGrid()`, `placeWordsInGrid()`, `findWordConnections()`
  - **Dependencies**: Requires crossword layout from engine
  - **Purpose**: Manages grid data structures and word relationships

- **`color-logic.js`** (200+ lines)
  - **Functions**: Wordle-style color determination
  - **Key APIs**: `getLetterColorClass()`, `getLetterColorForWord()`
  - **Dependencies**: Requires grid and word connections
  - **Purpose**: Provides visual feedback for letter placement

### Gameplay Modules (`scripts/gameplay/`)
**Purpose**: User-facing game mechanics

- **`difficulty-system.js`** (300+ lines)
  - **Functions**: Strategic letter scrambling with constraints
  - **Key APIs**: `scrambleLettersByDifficulty()`, `changeDifficulty()`
  - **Dependencies**: Requires grid and difficulty settings from data.js
  - **Purpose**: Creates solvable puzzles at different difficulty levels

- **`game-controller.js`** (200+ lines)
  - **Functions**: Game flow control and initialization
  - **Key APIs**: `enhancedInitGame()`, `checkVictory()`, `showVictory()`
  - **Dependencies**: Coordinates all other modules
  - **Purpose**: Orchestrates game lifecycle and state management

- **`ui-interactions.js`** (100+ lines)
  - **Functions**: User interface and visual rendering
  - **Key APIs**: `renderCrossword()`, `selectCell()`, `swapLetters()`
  - **Dependencies**: Requires grid and color logic
  - **Purpose**: Handles user input and visual updates

- **`victory-animations.js`** (200+ lines)
  - **Functions**: Victory field animations and configuration
  - **Key APIs**: `playVictoryAnimation()`, `playWaveAnimation()`, `playJumpAnimation()`
  - **Dependencies**: Requires grid and victoryAnimationConfig from data.js
  - **Purpose**: Plays celebratory animations on game field when puzzle is solved

### Utility Modules (`scripts/utils/`)
**Purpose**: Supporting functionality

- **`headline-manager.js`** (150+ lines)
  - **Functions**: Headline selection and lifecycle tracking
  - **Key APIs**: `getNextHeadline()`, `markHeadlineAsUsed()`, `markHeadlineAsRejected()`
  - **Dependencies**: Requires headlines data from data.js
  - **Purpose**: Manages headline pool and prevents duplicates

- **`async-rss-fetcher.js`** (300+ lines)
  - **Functions**: Parallel RSS fetching with caching and loading management
  - **Key APIs**: `fetchHeadlinesFromAllSources()`, `getCacheInfo()`, `getLoadingState()`
  - **Dependencies**: Requires RSS sources from data.js
  - **Purpose**: High-performance parallel RSS fetching with intelligent caching

- **`headline-scorer.js`** (200+ lines)
  - **Functions**: Configurable headline scoring and filtering
  - **Key APIs**: `scoreHeadline()`, `processAndGroupHeadlines()`, `selectBestHeadline()`
  - **Dependencies**: Requires scoring configuration from data.js
  - **Purpose**: Intelligent headline quality assessment and pool management

- **`rss-parser.js`** (200+ lines)
  - **Functions**: RSS feed parsing and headline extraction
  - **Key APIs**: `fetchLatestHeadlines()`, `fetchFromMultipleSources()`, `testAllSources()`, `processCommersantHeadline()`
  - **Dependencies**: Requires RSS configuration from data.js
  - **Purpose**: RSS2JSON API integration with source attribution and Commersant headline processing

- **`html-processor.js`** (300+ lines)
  - **Functions**: HTML detection, stripping, and entity decoding
  - **Key APIs**: `detectHTML()`, `stripHTML()`, `decodeHTMLEntities()`, `processRSSContent()`
  - **Dependencies**: None (standalone utility)
  - **Purpose**: Comprehensive HTML processing for RSS content and game descriptions

- **`debug-utils.js`** (400+ lines)
  - **Functions**: Development tools and debugging
  - **Key APIs**: `toggleDebugPanel()`, `updateDebugInfo()`, `updateGridStateCode()`
  - **Dependencies**: Requires all game state for analysis
  - **Purpose**: Provides development visibility and test case generation

### Main Entry Point (`scripts/main.js`)
**Purpose**: Global state coordination and initialization
- **Functions**: Global variable declarations, module coordination
- **Key APIs**: `countCorrectCells()`, DOM ready event handling
- **Dependencies**: None (declares globals used by other modules)
- **Purpose**: Coordinates module initialization and shared utilities

## Module Loading Strategy
**Critical Dependency Order** (defined in index.html):
1. **Data Layer**: `data.js` (headlines and configuration)
2. **Core Engine**: Foundation algorithms (crossword-engine, grid-manager, color-logic)
3. **Gameplay**: User-facing features (difficulty-system, game-controller, ui-interactions)
4. **Utilities**: Supporting functions (html-processor, rss-parser, headline-scorer, async-rss-fetcher, headline-manager, debug-utils)
5. **Main**: Entry point and coordination (main.js)

**Why This Order Works**:
- Data must load first (provides configuration)
- Core engine provides foundational algorithms
- Gameplay modules build on core functionality
- Utilities can access all game state
- Main coordinates everything after all modules loaded

## Test Framework Architecture
- **Purpose**: Validate color determination logic and intersection cell handling
- **Implementation**: Standalone HTML file that reuses main game functions
- **Key Features**:
  - Multiple test cases for different scenarios
  - Hover tooltips showing cell coordinates and word indices
  - Click-to-copy functionality for easy debugging
  - Text output generation for LLM analysis
  - Visual grid representation with color coding
- **Test Cases**: Focus on edge cases like intersections, duplicate letters, and connected words
- **Usage**: Essential for verifying color logic changes and debugging complex scenarios

## Browser Requirements
- ES6 JavaScript support
- CSS Grid and Flexbox
- CSS Transitions and Animations
- DOM manipulation APIs

## Technical Constraints
1. **No Build Process**: Direct browser execution
2. **No External Libraries**: Pure vanilla implementation
3. **Client-Side Only**: No server communication
4. **Modular File Structure**: Clean separation of concerns across 9 focused modules

## Key JavaScript Features Used
- Array methods (map, forEach, filter)
- Destructuring assignments
- Template literals
- Arrow functions
- Set data structure
- CSS custom properties
- Module pattern (function-based, not ES6 modules)

## CSS Architecture
- BEM-inspired class naming
- CSS variables for theming
- Flexbox for layout
- CSS Grid for crossword display
- Keyframe animations

## Performance Considerations
- Minimal DOM manipulation
- Event delegation where possible
- CSS transitions for animations
- No external resource loading
- Modular loading allows for future optimization

## Modularization Benefits
1. **Maintainability**: Each module has single responsibility
2. **Debugging**: Issues isolated to specific functional areas
3. **Collaboration**: Multiple developers can work on different modules
4. **Testing**: Individual modules can be tested in isolation
5. **Performance**: Modules can be conditionally loaded in future
6. **Code Organization**: Logical grouping by functionality

## Future Enhancement Possibilities
- Local storage for progress saving
- API integration for real headlines
- Enhanced difficulty levels
- Timer functionality
- Hint system
- Mobile touch optimization
- ES6 module conversion
- Module bundling for production
- Lazy loading of non-critical modules
