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

## Hint System Implementation

The hint system is implemented through several key components:
- **RSS Parser**: Extracts descriptions alongside headlines from news sources
- **HTML Processor**: Cleans and formats description text for display
- **Game Controller**: Integrates description display as contextual hints
- **Styles**: Provides visual styling for hint presentation in the UI

## Headline Scoring and Selection System

The system ensures high-quality, playable headlines are selected for the crossword through a multi-stage process:

### 1. Scoring Algorithm (`headline-scorer.js`)
Each headline starts with a base score of **0** and is evaluated against several criteria:
- **Mandatory Description**: Headlines without descriptions are penalized (**-999**) and marked invalid.
- **Word Filtering**:
    - **Stop Words**: Common words (e.g., "the", "and", "with") are removed.
    - **Short Words**: Words with 3 letters or less are removed.
    - **Penalty**: **-1 point** for each filtered word.
- **Word Count Optimization**:
    - **Ideal Range**: 4 to 6 words (after filtering).
    - **Penalty**: **-1 point** for each word above or below this range.
- **Validity Check**: A headline must have at least **4 words** remaining after filtering to be considered valid.

### 2. Pooling and Grouping
- **Score Groups**: Valid headlines are grouped into "pools" based on their final score.
- **Sorting**: Pools are sorted in descending order (highest scores first).
- **Selection**: The system always attempts to pick a random headline from the highest available score pool. If a pool is exhausted, it moves to the next highest score.

### 3. Lifecycle Management (`headline-manager.js`)
- **Initialization**: Fetches headlines from RSS sources and processes them through the scorer.
- **Tracking**: Maintains `usedHeadlines` and `rejectedHeadlines` arrays to prevent repetition.
- **Fallback**: Provides mock headlines if RSS fetching fails or no valid headlines are found.

## Crossword Grid Generation (`crossword-engine.js`)

The engine uses a stochastic, score-based algorithm to arrange selected words into a compact crossword layout.

### 1. Generation Process
- **Attempts**: Performs up to 50 attempts per headline to find the optimal layout.
- **Placement**: Starts with a seed word and iteratively places remaining words perpendicularly at shared letter intersections.
- **Validation**: Each placement must pass strict crossword rules:
    - **Connectivity**: All words must form a single connected component.
    - **Single Intersection**: Words can share exactly one letter; multiple intersections are forbidden.
    - **Spacing**: Parallel words must have a 1-square gap; end-to-end touching is prohibited.

### 2. Scoring and Optimization
The engine evaluates valid layouts using a "lower is better" score:
- **Compactness**: Penalizes large grid areas and high aspect ratios (prefers squares).
- **Intersections**: Rewards layouts with more shared letters and multi-crossing words.

### 3. Fallback and Normalization
- **Fallback Mechanism**: If the engine fails to find a valid interconnected layout after 50 attempts, it triggers `generateSimpleLayout`.
- **Word Loss**: The simple layout generator prioritizes grid validity over completeness. If it cannot find valid, non-conflicting spots for all words, it may return a layout containing only a subset of the original headline words (e.g., 3 words instead of 5).
- **Normalization**: Final coordinates are shifted to a (0,0) origin with padding for UI rendering.

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
