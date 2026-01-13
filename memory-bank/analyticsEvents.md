# Headlines Analytics Events

## Core Puzzle Events

### puzzleStart
**Description:** Fires when a player begins a new puzzle (either daily news or custom challenge).  
**Parameters:**
- mode: 'news' or 'challenge'
- difficulty: current difficulty level
- language: current language ('en' or 'ru')

### puzzleSolved
**Description:** Fires when a player successfully completes a puzzle.  
**Parameters:**
- mode: 'news' or 'challenge'
- movesUsed: number of moves taken
- starRating: 1-5 stars earned
- difficulty: difficulty level
- language: language used

### puzzleGiveUp
**Description:** Fires when a player gives up on a puzzle and reveals the solution.  
**Parameters:**
- mode: 'news' or 'challenge'
- movesUsed: number of moves attempted before giving up
- difficulty: difficulty level
- language: language used

### puzzleSkipped
**Description:** Fires when a player skips a puzzle without attempting it.  
**Parameters:**
- mode: 'news' or 'challenge'
- difficulty: difficulty level
- language: language used

## Challenge Mode Events

### customPuzzlePreviewed
**Description:** Fires when a player successfully previews a custom puzzle (hits verify/preview button and puzzle generates successfully).  
**Parameters:**
- headlineLength: length of the headline text
- wordCount: number of words in the puzzle
- difficulty: difficulty level set
- language: language used

### customPuzzleLinkCopied
**Description:** Fires when a player copies the custom puzzle link to clipboard.  
**Parameters:**
- headlineLength: length of the headline text
- wordCount: number of words in the puzzle
- difficulty: difficulty level set
- language: language used

## UI/Feature Events

### helpOpened
**Description:** Fires when the help/tutorial system is opened (either manually via help button or automatically for first-time users).  
**Parameters:**
- (no parameters)

### languageChanged
**Description:** Fires when a player changes the language setting.  
**Parameters:**
- newLanguage: 'en' or 'ru'

### difficultyChanged
**Description:** Fires when a player changes the difficulty level.  
**Parameters:**
- newDifficulty: difficulty level

### soundSettingChanged
**Description:** Fires when a player toggles sound on/off.  
**Parameters:**
- enabled: true or false

### articleRead
**Description:** Fires when a player clicks to read the full article after solving a news puzzle.  
**Parameters:**
- (no parameters)

### createOwnPuzzleClicked
**Description:** Fires when a player clicks the "Create Own Puzzle" button in challenge mode.  
**Parameters:**
- (no parameters - triggered when clicking the button in challenge mode)