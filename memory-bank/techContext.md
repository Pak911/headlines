# Tech Context: Headlines Letter-Swap Crossword Game

## Technology Stack
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Build Tools**: None (direct browser execution)
- **Dependencies**: None (zero dependencies)
- **Hosting Requirements**: Any static file server

## Development Environment
- **Editor**: VSCode
- **Browser**: Modern browsers supporting ES6
- **Version Control**: Git
- **Run Commands**: 
  - Main game: `start index.html`
  - Test suite: `start test.html`

## File Structure
```
headlines/
├── index.html                          # Main game interface
├── styles.css                          # Game styling and animations
├── data.js                             # Configuration and data
├── localization/                       # Localization system
│   ├── en.js                           # English translations
│   ├── ru.js                           # Russian translations
│   └── i18n.js                         # Localization manager
├── scripts/                            # Modular JavaScript architecture
│   ├── main.js                         # Entry point and global state
│   ├── core/                           # Core engine modules
│   │   ├── crossword-engine.js         # Layout generation
│   │   ├── grid-manager.js             # Grid management
│   │   └── color-logic.js              # Color feedback
│   ├── gameplay/                       # Game features
│   │   ├── difficulty-system.js         # Letter scrambling
│   │   ├── game-controller.js          # Game flow control
│   │   ├── ui-interactions.js          # User interface
│   │   └── victory-animations.js       # Victory animations
│   └── utils/                          # Utilities
│       ├── headline-manager.js         # Headline management
│       ├── async-rss-fetcher.js        # RSS fetching
│       ├── headline-scorer.js          # Headline scoring
│       ├── rss-parser.js               # RSS parsing
│       ├── html-processor.js           # HTML processing
│       └── debug-utils.js              # Debug tools
├── test/                               # Test framework
│   ├── test.html                       # Main test interface
│   └── other test files...             # Various test utilities
└── memory-bank/                        # Project documentation
```

## Modular Architecture

### Module Organization
**Location**: `scripts/` directory with clean separation of concerns.

### Core Engine Modules (`scripts/core/`)
- **`crossword-engine.js`**: Layout generation and validation algorithms
- **`grid-manager.js`**: Grid data structure creation and management
- **`color-logic.js`**: Wordle-style color determination logic

### Gameplay Modules (`scripts/gameplay/`)
- **`difficulty-system.js`**: Strategic letter scrambling with constraints
- **`game-controller.js`**: Game flow control and initialization
- **`ui-interactions.js`**: User interface interactions and rendering
- **`victory-animations.js`**: Victory celebration animations

### Utility Modules (`scripts/utils/`)
- **`headline-manager.js`**: Headline selection and lifecycle tracking
- **`async-rss-fetcher.js`**: Parallel RSS fetching with caching
- **`headline-scorer.js`**: Headline scoring and filtering
- **`rss-parser.js`**: RSS feed parsing and extraction
- **`html-processor.js`**: HTML detection and stripping
- **`debug-utils.js`**: Debug panel and development tools

### Main Entry Point (`scripts/main.js`)
- Global state variable declarations
- Module coordination and initialization

## Module Loading Strategy
**Critical Dependency Order** (defined in index.html):
1. **Data Layer**: `data.js` (configuration)
2. **Core Engine**: Foundation algorithms
3. **Gameplay**: User-facing features
4. **Utilities**: Supporting functions
5. **Main**: Entry point coordination

## Test Framework
- **Purpose**: Validate color logic and intersection handling
- **Implementation**: Standalone HTML files reusing main game functions
- **Key Features**: Visual grid representation, hover tooltips, click-to-copy

## Browser Requirements
- ES6 JavaScript support
- CSS Grid and Flexbox
- CSS Transitions and Animations
- DOM manipulation APIs

## Technical Constraints
1. **No Build Process**: Direct browser execution
2. **No External Libraries**: Pure vanilla implementation
3. **Client-Side Only**: No server communication

## Performance Considerations
- Minimal DOM manipulation
- Event delegation where possible
- CSS transitions for animations
- No external resource loading
