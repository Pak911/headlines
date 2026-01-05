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
├── README.md                           # Project documentation
├── localization/                       # Localization system
│   ├── en.js                           # English translations
│   ├── ru.js                           # Russian translations
│   └── i18n.js                         # Localization manager
├── scripts/                            # Modular JavaScript architecture
│   ├── main.js                         # Entry point and global state
│   ├── core/                           # Core engine modules
│   │   ├── crossword-engine.js         # Smart backbone-first layout generation
│   │   ├── grid-manager.js             # Grid management
│   │   └── color-logic.js              # Color feedback logic
│   ├── gameplay/                       # Game features
│   │   ├── difficulty-system.js        # Letter scrambling algorithms
│   │   ├── game-controller.js          # Game flow control
│   │   ├── ui-interactions.js          # User interface & rendering
│   │   └── victory-animations.js       # Victory animations
│   └── utils/                          # Utilities
│       ├── headline-manager.js         # Headline pool management
│       ├── async-rss-fetcher.js        # Parallel RSS fetching
│       ├── headline-scorer.js          # Headline filtering & scoring
│       ├── rss-parser.js               # RSS feed parsing
│       ├── html-processor.js           # HTML cleaning
│       └── debug-utils.js              # Debug panel tools
├── test/                               # Test framework
│   ├── test.html                       # Main test interface
│   ├── crossword-generator_1.html      # Algorithm prototype/demo
│   └── other test files...             # Various test utilities
└── memory-bank/                        # Project documentation
    ├── projectbrief.md                 # Project requirements
    ├── techContext.md                  # Technical documentation
    ├── systemPatterns.md               # System architecture
    ├── productContext.md               # Product specifications
    ├── designGuidelines.md             # Design guidelines
    └── activeContext.md                # Current development context
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

The engine uses a sophisticated **three-phase backbone-first algorithm** to generate optimal crossword layouts. This strategic approach ensures high-quality, well-connected grids with all words successfully placed.

### Algorithm Overview: Matchmaker → Backbone → Beam Search

#### Phase 1: Matchmaker (Word Pair Selection)
- **Bitmask Optimization**: Uses 32-bit masks (RU: 32 letters, EN: 26 letters) for fast letter comparison. Note: Russian Ё is normalized to Е for consistency.
- **Bridge Potential Analysis**: Evaluates all word pairs to find which have the highest potential for connections. Scoring formula:
  - `score = (bridgePotential × 50) + (combinedLength × 10)`
  - Bridge potential = count of other words that share letters with BOTH words in the pair
- **Output**: Top-scored word pairs sorted by connection potential.

#### Phase 2: Backbone Generation with Topological Fingerprinting
- **Backbone Creation**: For top 30 word pairs, creates "backbone" structures (two horizontal words at a gap distance).
- **Bridge Discovery**: Finds vertical words that connect both backbone words at matching letters.
- **Dynamic Gap Calculation**: Maximum gap is based on the 3rd longest word length minus 2.
- **Topological Deduplication**: Uses unique structural fingerprints to eliminate duplicate configurations regardless of coordinates.
- **Intermediate Scoring**:
  - Non-linear intersection bonuses: [1→10, 2→20, 3→40, 4→80, 5+→150 points]
  - Squareness penalty: -2 per unit difference between width and height
  - Unused letter penalty: -5 per letter (light penalty at this stage)
- **Output**: ~100-200 unique backbone structures with bridges, sorted by score.

#### Phase 3: Beam Search Fill (Remaining Words)
- **Initialization**: Places backbone words (horizontal) and all bridge words (vertical).
- **Iterative Expansion**: 
  - For each grid anchor point, attempts to place remaining words both horizontally and vertically.
  - Keeps top K candidates (beam width = 10) at each step.
  - Continues until no more words can be added.
- **Placement Validation**:
  - No character conflicts at intersections
  - No adjacent parallel words (classic crossword spacing rule)
  - No extending existing words at their ends
- **Final Scoring**:
  - Intersection bonuses: Non-linear rewards for well-connected words
  - Area penalty: `(width × height) × 0.4` (strongly favors compact grids)
  - Unused word penalty: **300 points per letter** (ensures all words are placed)

### Key Features
- **Language Detection**: Automatically detects Russian vs English based on character patterns.
- **Guaranteed Completeness**: Heavy penalty (300×) for unused words ensures all headline words are placed.
- **Configurable Parameters**: All weights and limits defined in `data.js` under `crosswordEngineConfig`.
- **Time-Limited**: Maximum 300ms generation time prevents hanging on difficult layouts.
- **Fallback Safety**: If main algorithm fails completely, creates minimal valid layout with all words.

### Output Format
Returns layout object with word placements:
```javascript
{
  words: [
    { word: 0, row: 2, col: 0, direction: 'horizontal' },
    { word: 1, row: 0, col: 2, direction: 'vertical' },
    // ...
  ]
}
```
Also sets global `gridSize = { rows, cols }` for grid creation.

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
