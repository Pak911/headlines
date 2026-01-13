# Headlines 📰🧩

**A Letter-Swapping Crossword Puzzle Game with Real News Headlines**

Transform scrambled letters into news headlines using crossword-style logic! No trivia knowledge required – just spatial reasoning and strategic thinking.

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-green.svg)](https://github.com/Pak911/headlines)

## 🎮 Play the Game

Want to jump right in and try Headlines? Play the full game online right now:

**[Play Headlines Now](https://pak911.github.io/headlines)**

No downloads or setup required – just click and start solving crossword puzzles with real news headlines!

## 🎨 Create Custom Puzzles

You can also create your own personalized crossword puzzle and share it with your friends with a simple link

**[Create Custom Puzzles](https://pak911.github.io/headlines/create-puzzle.html)**



## 🎮 What Makes This Game Unique?

Headlines combines engaging elements:
- **Crossword Structure**: Words intersect at shared letters in a proper crossword layout
- **Letter Manipulation**: Swap individual letters instead of solving clues
- **Contextual Hints**: Use semantic clues from news descriptions to guide solving
- **News Awareness**: Learn real headlines as you solve puzzles
- **Multi-language Support**: Play in English or Russian with automatic language detection
- **Real-time RSS Integration**: Current news headlines from multiple sources

Unlike traditional crosswords that require knowledge, this is a pure logic puzzle where contextual hints make the challenge engaging and solvable.


## 🎯 How to Play

1. **Observe the Grid**: Letters are arranged in a crossword pattern but scrambled
2. **Read the Hint**: Check the description below the grid for contextual clues about the headline
3. **Click Two Letters**: Select any two letters to swap their positions
4. **Use Color Feedback**: Colors guide you toward the correct solution
5. **Solve the Headlines**: Reconstruct all news headlines to win

The hint system is crucial - descriptions provide semantic clues that help you think about what words might fit in the scrambled headline. Most of the time, words present in the description are also present or have synonyms in the headlines, giving you meaningful guidance for solving.

### 🎨 Color Guide

| Color | Meaning |
|-------|---------|
| 🟢 **Green** | Letter is in the correct position |
| 🟠 **Orange** | Letter belongs to this word but wrong position |
| 🟣 **Purple** | Letter belongs to a connected/intersecting word |
| ⚫ **Gray** | Letter belongs to a different, non-connected word |

## ✨ Key Features

### 🧠 Advanced Crossword Generation
- **Multi-phase algorithm** with intelligent word placement
- **Intersection detection** using shared letters
- **Layout validation** ensuring proper crossword rules
- **Fallback systems** for edge cases

### 🎯 Wordle-Style Feedback
- **Dynamic color coding** based on letter relationships
- **Intersection cell handling** for letters belonging to multiple words
- **Connected word logic** showing relationships between crossing words

### 🌐 Multi-language Support
- **English and Russian** with automatic language detection
- **Language selector dropdown** for manual switching
- **Independent RSS language configuration**

### 📰 Enhanced RSS Integration
- **Parallel fetching** from multiple news sources for instant loading
- **Real-time headline processing** with HTML content cleaning
- **Multilingual RSS support** with special headline formatting

### 🛠️ Developer Tools
- **Debug panel** (press 'D') with comprehensive game state analysis
- **Test framework** for validating color logic and edge cases
- **Grid state export** for creating test cases

## 🏗️ Architecture

### Modular Design

```
js/                                 # Modular JavaScript architecture
├── main.js                         # Entry point and global state
├── create-puzzle.js                # Creator page logic
├── core/                           # Core engine modules
│   ├── crossword-engine.js         # Smart backbone-first layout generation
│   ├── grid-manager.js             # Grid management
│   └── color-logic.js              # Color feedback logic
├── gameplay/                       # Game features
│   ├── difficulty-system.js        # Letter scrambling algorithms
│   └── game-controller.js          # Game flow control
├── localization/                   # Localization system
│   ├── en.js                       # English translations
│   ├── ru.js                       # Russian translations
│   └── i18n.js                     # Localization manager
├── platforms/                      # Platform abstraction layer
│   ├── platformAdapter.js          # Platform adapter interface
│   └── webPlatform.js              # Web platform implementation
├── rss/                            # RSS and headline processing
│   ├── async-rss-fetcher.js        # Parallel RSS fetching
│   ├── custom-puzzle-loader.js     # Custom puzzle loading
│   ├── headline-manager.js         # Headline pool management
│   ├── headline-scorer.js          # Headline filtering & scoring
│   ├── rss-parser.js               # RSS feed parsing
│   └── html-processor.js           # HTML cleaning
├── singletons/                     # Singleton pattern modules
│   ├── analytics.js                # Analytics tracking
│   └── soundManager.js             # Audio system management
├── tutorials/                      # Tutorial system
│   ├── popups.js                   # General popup/modal system
│   └── tutorials.js                # Tutorial state management
├── ui/                             # User interface modules
│   ├── hamburger-menu.js           # Hamburger menu functionality
│   ├── ui-interactions.js          # User interface & rendering
│   └── victory-animations.js       # Victory animations
├── utils/                          # Utilities
│   ├── debug-utils.js              # Debug panel tools
│   ├── gamestats.js                # Game statistics tracking
│   └── utils.js                    # General utilities
└── lib/                            # Third-party libraries
    └── lz-string.min.js            # LZ compression library
```

## 📁 Project Structure

```
headlines/
├── index.html                          # Main game interface
├── create-puzzle.html                  # Creator page interface
├── data.js                             # Configuration and data
├── data-audio.js                       # Audio system configuration
├── news-fetching-config.js             # RSS feed configuration
├── build-utils.js                      # Build utilities
├── build.js                            # Build script
├── launch.bat                          # Windows launcher
├── launch.sh                           # Unix launcher
├── package.json                        # Node.js dependencies
├── README.md                           # Project documentation
├── content/                            # Content assets
│   ├── bgs/                            # Background images
│   ├── images/                         # Game images
│   └── prototypes/                     # Prototype files
├── css/                                # Stylesheets
│   ├── base.css                        # Base styling and layout
│   ├── theme.css                       # CSS custom properties and design tokens
│   ├── game-board.css                  # Game board styling
│   ├── create-puzzle.css               # Creator page styling
│   ├── hamburger-menu.css              # Hamburger menu styling
│   ├── debug-panel.css                 # Debug panel styling
│   ├── hint-section.css                # Hint section styling
│   ├── moves-counter.css               # Moves counter styling
│   ├── victory-modal.css               # Victory modal styling
│   ├── popups.css                      # General popup/modal styling
│   ├── tutorials.css                   # Tutorial overlay and content styling
│   ├── loading.css                     # Loading animation and spinner styling
│   └── responsive.css                  # Responsive design and media queries
├── fonts/                              # Font files
├── imgs/                               # Image assets
├── js/                                 # See Modular Design section above
├── test/                               # Test framework and utilities
│   └── [various test files]            # Test interfaces and utilities
└── memory-bank/                        # Project documentation
    ├── activeContext.md                # Current development context
    ├── analyticsEvents.md              # Analytics events documentation
    ├── customEvents.md                 # Custom events documentation
    ├── designGuidelines.md             # Design guidelines
    ├── projectBrief.md                 # Project brief
    ├── projectOverview.md              # Project overview
    ├── systemPatterns.md               # System architecture patterns
    └── techContext.md                  # Technical documentation
```

## 🔧 Development

### Development Guidelines

This project uses a comprehensive **memory-bank** system for development guidance:

- **`memory-bank/designGuidelines.md`**: Contains visual design principles, Material Design approach, color palette, typography, and component styling guidelines
- **`memory-bank/systemPatterns.md`**: Documents architecture decisions and technical patterns
- **`memory-bank/techContext.md`**: Technology stack and development environment setup
- **`memory-bank/projectbrief.md`**: Project scope and core requirements

**For developers**: Start by reading the memory-bank files to understand the project's design philosophy and technical decisions.

### Debug Panel (made off in the release version)
Press **'D'** during to access:
- Current game state analysis
- Layout generation details
- Difficulty system information
- Test case generation tools
- Grid state export functionality

### Testing
The project includes multiple test files:
- `test.html` - Main testing interface
- `test-html-processor.html` - HTML processing tests
- `test-rss-parser.html` - RSS parsing tests

### Browser Requirements
- ES6 JavaScript support
- CSS Grid and Flexbox
- Modern DOM APIs
- No external dependencies

## 🎯 Technical Highlights

- **Zero Dependencies**: Pure vanilla JavaScript, HTML, and CSS
- **No Build Process**: Direct browser execution
- **Modular Architecture**: Clean separation of concerns
- **Advanced Algorithms**: Sophisticated crossword generation and scrambling
- **Developer-Friendly**: Extensive debug tools and documentation
- **RSS Integration**: Real-time headline fetching with parallel processing
- **Multi-language Support**: Zero-dependency localization system with automatic detection
- **Configurable Systems**: Runtime configuration for difficulty, animations, and scoring

## 🚀 Future Enhancements

- [x] Local storage for progress saving
- [x] API integration for real-time headlines
- [x] Enhanced difficulty levels
- [x] Timer functionality and scoring
- [x] Hint system
- [ ] Mobile touch optimization (partially implemented)
- [ ] Multiplayer support
- [ ] Achievement system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly using the test framework
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Maintain the modular architecture
- Add test cases for new features
- Update documentation in the memory-bank
- Use the debug panel for testing
- Follow the existing code patterns
- Consult `memory-bank/designGuidelines.md` for styling consistency

### Attribution Requirements

**If you use this code or create derivative works, please provide proper attribution:**

- Include a clear acknowledgment that the project was created using this repository
- Credit **Pak911** as the original author
- Link back to the original repository: https://github.com/Pak911/headlines

Example attribution:
```
Based on "Headlines" by Pak911 (https://github.com/Pak911/headlines)
```

This attribution helps support the open-source community and gives credit where it's due.

## 🙏 Acknowledgments

- Inspired by crossword puzzles and Wordle-style feedback
- Built with modern web technologies
- Designed for educational and entertainment purposes
- Created by **Pak911** with love for game design and code
