# Project Brief: Headlines Crossword Game

**Headlines** is a CSS/HTML/JavaScript puzzle game where players reconstruct news headlines from their descriptions through strategic letter swapping. Unlike Waffle's static, pre-designed puzzles with fixed word sets, Headlines dynamically generates crossword-style challenges from current news headlines of varying lengths, capturing the zeitgeist of the moment with fresh content that changes daily.

## Core Gameplay
The core gameplay involves swapping letters within a crossword-style grid to match the hidden headline, with the goal of solving puzzles in the minimum number of moves. News descriptions serve as contextual hints rather than the primary content, making the game about puzzle-solving rather than news consumption. Players can optionally read the full articles after solving to learn more about the stories behind the headlines.

## Peer-to-Peer Challenge Mode
In addition to the daily news feed, Headlines features a **serverless "Challenge Mode."** Players can act as creators, inputting their own headlines and hints to generate a unique puzzle link. This link encodes the puzzle data directly into the URL, allowing users to share personalized challenges with friends without requiring a backend database.

## Technical Foundation
Built with zero external dependencies, the game features:
- Real-time RSS headline fetching for standard play.
- A standalone "Creator" page for generating custom challenge links.
- LZ-based URL compression for handling custom puzzle data.
- Multiple difficulty levels and bilingual support (English/Russian).
- Comprehensive statistics tracking.