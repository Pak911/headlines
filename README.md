# Headlines 📰🧩

**A Letter-Swapping Crossword Puzzle Game with Real News Headlines**

Transform scrambled letters into news headlines using crossword-style logic! No trivia knowledge required – just spatial reasoning and strategic thinking.

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-green.svg)](https://github.com/Pak911/headlines)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🎮 What Makes This Game Unique?

Headlines combines three engaging elements:
- **Crossword Structure**: Words intersect at shared letters in a proper crossword layout
- **Letter Manipulation**: Swap individual letters instead of solving clues
- **News Awareness**: Learn real headlines as you solve puzzles

Unlike traditional crosswords that require knowledge, this is a pure logic puzzle where the challenge is spatial and strategic.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Pak911/headlines.git

# Navigate to the project
cd headlines

# Open the game (no build process needed!)
open index.html
# or
start index.html
```

**That's it!** The game runs entirely in your browser with zero dependencies.

## 🎯 How to Play

1. **Observe the Grid**: Letters are arranged in a crossword pattern but scrambled
2. **Click Two Letters**: Select any two letters to swap their positions
3. **Use Color Feedback**: Colors guide you toward the correct solution
4. **Solve the Headlines**: Reconstruct all news headlines to win

### 🎨 Color Guide

| Color | Meaning |
|-------|---------|
| 🟢 **Green** | Letter is in the correct position |
| 🟠 **Orange** | Letter belongs to this word but wrong position |
| 🟣 **Purple** | Letter belongs to a connected/intersecting word |
| ⚫ **Gray** | Letter belongs to a different, non-connected word |

### 🎚️ Difficulty Levels

- **Easy**: Only words are shuffled, intersections preserved
- **Medium-Easy**: One intersection disrupted
- **Medium**: Half of intersections preserved (default)
- **Medium-Hard**: Intersection chaos
- **Hard**: Maximum scrambling with 15% green letter limit

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

### 🎲 Strategic Difficulty System
- **Constraint-based scrambling** with green letter percentage limits
- **Solvability guarantee** - every puzzle has a known minimum solution
- **State tracking** to ensure optimal difficulty targeting

### 🛠️ Developer Tools
- **Debug panel** (press 'D') with comprehensive game state analysis
- **Test framework** for validating color logic and edge cases
- **Grid state export** for creating test cases

## 🏗️ Architecture

### Modular Design (9 Focused Modules)

```
scripts/
├── main.js                    # Entry point & global state
├── core/                      # Foundation algorithms
│   ├── crossword-engine.js    # Layout generation (450+ lines)
│   ├── grid-manager.js        # Grid & word management (200+ lines)
│   └── color-logic.js         # Wordle-style feedback (200+ lines)
├── gameplay/                  # User-facing features
│   ├── difficulty-system.js   # Strategic scrambling (300+ lines)
│   ├── game-controller.js     # Game flow control (200+ lines)
│   └── ui-interactions.js     # User interface (100+ lines)
└── utils/                     # Supporting functionality
    ├── headline-manager.js    # Headline lifecycle (150+ lines)
    └── debug-utils.js         # Development tools (400+ lines)
```

### Key Algorithms

#### Crossword Generation
```javascript
// Multi-phase generation with validation
generateCrosswordLayout(words) {
  // Phase 1: Intelligent placement using shared letters
  // Phase 2: Validate connectivity and spacing
  // Phase 3: Fallback to structured layout
  // Phase 4: Rejection and retry system
}
```

#### Strategic Scrambling
```javascript
// Constraint-based difficulty with state tracking
scrambleWithGreenConstraint(targetPercentage) {
  // Track best state during scrambling
  // Guarantee optimal green percentage targeting
  // Maintain solvability through swap logging
}
```

## 🧪 Testing Framework

The project includes a comprehensive test suite (`test.html`) for validating:
- Color determination logic
- Intersection cell handling
- Edge cases with duplicate letters
- Connected word relationships

```bash
# Run the test suite
open test.html
```

## 📁 Project Structure

```
headlines/
├── index.html              # Main game interface
├── styles.css              # Game styling and animations
├── data.js                 # Headlines data and configuration
├── scripts/                # Modular JavaScript architecture
├── test.html              # Color logic testing framework
├── test-explanation.md    # Test framework documentation
└── memory-bank/           # Project documentation
    ├── projectbrief.md    # Project scope and requirements
    ├── productContext.md  # User experience and goals
    ├── systemPatterns.md  # Architecture and design patterns
    ├── techContext.md     # Technology stack and setup
    └── activeContext.md   # Working log and current status
```

## 🔧 Development

### Adding New Headlines
Edit `data.js` to add headlines to the `headlines` array:
```javascript
headlines.push({
    words: ["BREAKING", "NEWS", "STORY", "DEVELOPS"],
    url: "https://example.com/article"
});
```

### Debug Panel
Press **'D'** during gameplay to access:
- Current game state analysis
- Layout generation details
- Difficulty system information
- Test case generation tools
- Grid state export functionality

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
- **Comprehensive Testing**: Dedicated test framework for edge cases
- **Developer-Friendly**: Extensive debug tools and documentation

## 🚀 Future Enhancements

- [ ] Local storage for progress saving
- [ ] API integration for real-time headlines
- [ ] Enhanced difficulty levels
- [ ] Timer functionality and scoring
- [ ] Hint system
- [ ] Mobile touch optimization
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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by crossword puzzles and Wordle-style feedback
- Built with modern web technologies
- Designed for educational and entertainment purposes

---

**Ready to play?** [Open the game](index.html) and start swapping letters! 🎮

*For developers: Press 'D' in-game to explore the debug panel and see the sophisticated algorithms in action.*
