/**
 * Platform Adapter - Strategy Pattern for Cross-Platform Support
 *
 * Provides unified API for platform-specific operations (init, save, load, cache).
 * Automatically detects the current platform and routes calls to appropriate
 * implementation (Y Games, local web, etc.).
 *
 * Usage:
 *   await Platform.init();
 *   await Platform.save('seamless_standard', gameData);
 *   const data = await Platform.load('seamless_standard');
 *   await Platform.cacheHeadlines('BBC News', headlines);
 */

(function() {
    'use strict';

    /**
     * Platform detection and routing coordinator
     */
    class PlatformAdapter {
        constructor() {
            this.currentPlatform = null;
            this.platformType = 'unknown';
            this.initialized = false;

            // Listen for game ready event to signal platform
            this._setupGameReadyListener();
        }

        /**
         * Helper method for logging with debug system support
         * @private
         * @param {...any} args - Arguments to log
         */
        _log(...args) {
            // Use formatted logging from debug.js if available
            if (window.__cosic && typeof window.__cosic.flog === 'function') {
                // Join strings, but keep objects separate for proper logging
                const message = args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ');
                window.__cosic.flog('platform-adapter', message);
            } else {
                console.log('[platform-adapter]', ...args);
            }
        }

        /**
         * Setup listener for cosmic:platform:gameReady event
         * @private
         */
        _setupGameReadyListener() {
            window.addEventListener('cosmic:platform:gameReady', async (event) => {
                if (!this.initialized) {
                    console.warn('[Platform] Cannot signal game ready - platform not initialized');
                    return;
                }

                if (!this.currentPlatform.signalGameReady) {
                    // Platform doesn't support game ready signaling (e.g., web platform)
                    return;
                }

                try {
                    this._log('Signaling game ready to platform');
                    await this.currentPlatform.signalGameReady();
                } catch (err) {
                    console.error(`[Platform] signalGameReady failed:`, err);
                }
            });
        }

        /**
         * Detect which platform we're running on
         * @returns {string} Platform type: 'y' or 'web'
         */
        detectPlatform() {
            this._log('Detecting platform...');

            // Check if Y Games integration is available
            if (window.__cosmic_platform &&
                typeof window.__cosmic_platform.isAvailable === 'function') {
                this._log('Detected: y');
                return 'y';
            }

            // Check if web platform implementation is available
            if (typeof WebPlatform !== 'undefined') {
                this._log('Detected: web');
                return 'web';
            }

            console.warn('[Platform Adapter] No platform detected!');
            return 'unknown';
        }

        /**
         * Initialize the platform adapter and underlying platform
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async init() {
            this._log('init() called');
            try {
                // Detect platform
                this.platformType = this.detectPlatform();
                this._log(['Platform type:', this.platformType]);

                if (this.platformType === 'unknown') {
                    throw new Error('No platform implementation found');
                }

                // Get platform implementation
                if (this.platformType === 'y') {
                    this.currentPlatform = window.__cosmic_platform;
                    this._log('Using Y platform implementation');
                } else if (this.platformType === 'web') {
                    this.currentPlatform = new WebPlatform();
                    this._log('Using Web platform implementation');
                }

                this._log(`Detected platform: ${this.platformType}`);

                // Initialize the platform
                this._log('Calling platform.init()...');
                const result = await this.currentPlatform.init();
                this._log(['platform.init() result:', result]);

                if (!result.success) {
                    throw new Error(result.reason || 'Platform initialization failed');
                }

                this.initialized = true;
                this._log('Platform adapter initialized successfully');

                // Initialize global game state variables
                if (typeof window.__cosmic_undoUsed !== 'number') {
                    window.__cosmic_undoUsed = 0;
                    this._log('Initialized undoUsed counter to 0');
                }

                this._log('Dispatching headlines:platform:ready event');
                // Dispatch event so other systems can wait for platform readiness
                window.dispatchEvent(new CustomEvent('headlines:platform:ready', {
                    detail: { platformType: this.platformType }
                }));
                this._log('Event dispatched');

                return { success: true };

            } catch (err) {
                console.error('[Platform] Initialization failed:', err);
                return { success: false, error: err };
            }
        }

        /**
         * Cache headlines for a specific source
         * @param {string} sourceName - Name of the RSS source
         * @param {Array} headlines - Array of headline objects
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async cacheHeadlines(sourceName, headlines) {
            if (!this.initialized) {
                console.error('[Platform] Cannot cache headlines - platform not initialized');
                return { success: false, error: new Error('Platform not initialized') };
            }

            try {
                return await this.currentPlatform.cacheHeadlines(sourceName, headlines);
            } catch (err) {
                console.error(`[Platform] cacheHeadlines failed for "${sourceName}":`, err);
                return { success: false, error: err };
            }
        }

        /**
         * Load cached headlines for a specific source
         * @param {string} sourceName - Name of the RSS source
         * @returns {Promise<Array|null>} Array of headlines or null
         */
        async loadCachedHeadlines(sourceName) {
            if (!this.initialized) {
                console.error('[Platform] Cannot load cached headlines - platform not initialized');
                return null;
            }

            try {
                return await this.currentPlatform.loadCachedHeadlines(sourceName);
            } catch (err) {
                console.error(`[Platform] loadCachedHeadlines failed for "${sourceName}":`, err);
                return null;
            }
        }

        /**
         * Check if cache is expired for a specific source
         * @param {string} sourceName - Name of the RSS source
         * @returns {Promise<boolean>} True if expired
         */
        async isCacheExpired(sourceName) {
            if (!this.initialized) {
                console.error('[Platform] Cannot check cache expiration - platform not initialized');
                return true;
            }

            try {
                return await this.currentPlatform.isCacheExpired(sourceName);
            } catch (err) {
                console.error(`[Platform] isCacheExpired failed for "${sourceName}":`, err);
                return true;
            }
        }

        /**
         * Save game language setting
         * @param {string} language - Language code ('en' or 'ru')
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async saveGameLanguage(language) {
            if (!this.initialized) {
                console.error('[Platform] Cannot save game language - platform not initialized');
                return { success: false, error: new Error('Platform not initialized') };
            }

            try {
                return await this.currentPlatform.saveGameLanguage(language);
            } catch (err) {
                console.error(`[Platform] saveGameLanguage failed:`, err);
                return { success: false, error: err };
            }
        }

        /**
         * Load game language setting
         * @returns {Promise<string|null>} Language code or null
         */
        async loadGameLanguage() {
            if (!this.initialized) {
                console.error('[Platform] Cannot load game language - platform not initialized');
                return null;
            }

            try {
                return await this.currentPlatform.loadGameLanguage();
            } catch (err) {
                console.error(`[Platform] loadGameLanguage failed:`, err);
                return null;
            }
        }

        /**
         * Save game difficulty setting
         * @param {string} difficulty - Difficulty key ('easy', 'mediumEasy', 'medium', 'mediumHard', 'hard')
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async saveGameDifficulty(difficulty) {
            if (!this.initialized) {
                console.error('[Platform] Cannot save game difficulty - platform not initialized');
                return { success: false, error: new Error('Platform not initialized') };
            }

            try {
                return await this.currentPlatform.saveGameDifficulty(difficulty);
            } catch (err) {
                console.error(`[Platform] saveGameDifficulty failed:`, err);
                return { success: false, error: err };
            }
        }

        /**
         * Load game difficulty setting
         * @returns {Promise<string|null>} Difficulty key or null
         */
        async loadGameDifficulty() {
            if (!this.initialized) {
                console.error('[Platform] Cannot load game difficulty - platform not initialized');
                return null;
            }

            try {
                return await this.currentPlatform.loadGameDifficulty();
            } catch (err) {
                console.error(`[Platform] loadGameDifficulty failed:`, err);
                return null;
            }
        }

        /**
         * Save sound enabled setting
         * @param {boolean} enabled - Whether sound is enabled
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async saveSoundEnabled(enabled) {
            if (!this.initialized) {
                console.error('[Platform] Cannot save sound enabled - platform not initialized');
                return { success: false, error: new Error('Platform not initialized') };
            }

            try {
                return await this.currentPlatform.saveSoundEnabled(enabled);
            } catch (err) {
                console.error(`[Platform] saveSoundEnabled failed:`, err);
                return { success: false, error: err };
            }
        }

        /**
         * Load sound enabled setting
         * @returns {boolean|null} Sound enabled state or null if not set
         */
        loadSoundEnabled() {
            if (!this.initialized) {
                console.error('[Platform] Cannot load sound enabled - platform not initialized');
                return null;
            }

            try {
                return this.currentPlatform.loadSoundEnabled();
            } catch (err) {
                console.error(`[Platform] loadSoundEnabled failed:`, err);
                return null;
            }
        }

        /**
         * Save data to platform storage
         * @param {string} key - Storage key
         * @param {any} data - Data to save
         * @param {boolean} immediate - If true, bypasses rate limiting
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async save(key, data, immediate = false) {
            if (!this.initialized) {
                console.error('[Platform] Cannot save - platform not initialized');
                return { success: false, error: new Error('Platform not initialized') };
            }

            try {
                await this.currentPlatform.save(key, data, immediate);

                return { success: true };
            } catch (err) {
                // Check for specific network error
                const errorType = err.message === 'NO_INTERNET_CONNECTION' ? 'no_internet_connection' : 'general_error';

                if (err.message === 'NO_INTERNET_CONNECTION') {
                    this._log(`[Platform] Save failed due to no internet connection for key "${key}"`);
                } else {
                    console.error(`[Platform] Save failed for key "${key}":`, err);
                }

                return { success: false, error: err };
            }
        }

        /**
         * Load data from platform storage
         * @param {string} key - Storage key
         * @returns {Promise<any|null>} Loaded data or null
         */
        async load(key) {
            if (!this.initialized) {
                console.error('[Platform] Cannot load - platform not initialized');
                return null;
            }

            try {
                return await this.currentPlatform.load(key);
            } catch (err) {
                console.error(`[Platform] Load failed for key "${key}":`, err);
                return null;
            }
        }

        /**
         * Delete data from platform storage
         * @param {string} key - Storage key to delete
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async delete(key) {
            if (!this.initialized) {
                console.error('[Platform] Cannot delete - platform not initialized');
                return { success: false, error: new Error('Platform not initialized') };
            }

            try {
                await this.currentPlatform.delete(key);
                return { success: true };
            } catch (err) {
                console.error(`[Platform] Delete failed for key "${key}":`, err);
                return { success: false, error: err };
            }
        }

        /**
         * Save seen headline data
         * @param {string} hash - djb2 hash of the headline
         * @param {Object} data - Seen headline data {isSolved, movesUsed, link, timestamp}
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async saveSeenHeadline(hash, data) {
            if (!this.initialized) {
                console.error('[Platform] Cannot save seen headline - platform not initialized');
                return { success: false, error: new Error('Platform not initialized') };
            }

            if (!this.currentPlatform.saveSeenHeadline) {
                console.warn('[Platform] saveSeenHeadline not supported on current platform');
                return { success: false, error: new Error('Method not supported') };
            }

            try {
                const result = await this.currentPlatform.saveSeenHeadline(hash, data);
                if (result.success) {
                    this._log(`Saved seen headline data for hash: ${hash}`);
                }
                return result;
            } catch (err) {
                console.error(`[Platform] saveSeenHeadline failed for hash "${hash}":`, err);
                return { success: false, error: err };
            }
        }

        /**
         * Load seen headline data
         * @param {string} hash - djb2 hash of the headline
         * @returns {Promise<Object|null>} Seen headline data or null if not found
         */
        async loadSeenHeadline(hash) {
            if (!this.initialized) {
                console.error('[Platform] Cannot load seen headline - platform not initialized');
                return null;
            }

            if (!this.currentPlatform.loadSeenHeadline) {
                this._log(`loadSeenHeadline not supported on current platform for hash: ${hash}`);
                return null;
            }

            try {
                const data = await this.currentPlatform.loadSeenHeadline(hash);
                if (data) {
                    this._log(`Loaded seen headline data for hash: ${hash}`);
                } else {
                    this._log(`No seen headline data found for hash: ${hash}`);
                }
                return data;
            } catch (err) {
                console.error(`[Platform] loadSeenHeadline failed for hash "${hash}":`, err);
                return null;
            }
        }

        /**
         * Load all seen headlines data
         * @returns {Promise<Object>} Object with all seen headlines data (hash -> data mapping)
         */
        async loadAllSeenHeadlines() {
            if (!this.initialized) {
                console.error('[Platform] Cannot load seen headlines - platform not initialized');
                return {};
            }

            if (!this.currentPlatform.loadAllSeenHeadlines) {
                this._log('loadAllSeenHeadlines not supported on current platform');
                return {};
            }

            try {
                const data = await this.currentPlatform.loadAllSeenHeadlines();
                this._log(`Loaded ${Object.keys(data).length} seen headlines`);
                return data;
            } catch (err) {
                console.error('[Platform] loadAllSeenHeadlines failed:', err);
                return {};
            }
        }

        /**
         * Increment puzzle solved stat
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async incrementPuzzleSolvedStat() {
            if (!this.initialized) {
                console.error('[Platform] Cannot increment solved stat - platform not initialized');
                return { success: false, error: new Error('Platform not initialized') };
            }

            if (!this.currentPlatform.incrementPuzzleSolvedStat) {
                console.warn('[Platform] incrementPuzzleSolvedStat not supported on current platform');
                return { success: false, error: new Error('Method not supported') };
            }

            try {
                const result = await this.currentPlatform.incrementPuzzleSolvedStat();
                if (result.success) {
                    this._log('Puzzle solved stat incremented');
                }
                return result;
            } catch (err) {
                console.error('[Platform] incrementPuzzleSolvedStat failed:', err);
                return { success: false, error: err };
            }
        }

        /**
         * Increment puzzle skipped stat
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async incrementPuzzleSkippedStat() {
            if (!this.initialized) {
                console.error('[Platform] Cannot increment skipped stat - platform not initialized');
                return { success: false, error: new Error('Platform not initialized') };
            }

            if (!this.currentPlatform.incrementPuzzleSkippedStat) {
                console.warn('[Platform] incrementPuzzleSkippedStat not supported on current platform');
                return { success: false, error: new Error('Method not supported') };
            }

            try {
                const result = await this.currentPlatform.incrementPuzzleSkippedStat();
                if (result.success) {
                    this._log('Puzzle skipped stat incremented');
                }
                return result;
            } catch (err) {
                console.error('[Platform] incrementPuzzleSkippedStat failed:', err);
                return { success: false, error: err };
            }
        }

        /**
         * Get puzzle solved stat
         * @returns {Promise<number>} Current solved count (0 if not found)
         */
        async getPuzzleSolvedStat() {
            if (!this.initialized) {
                console.error('[Platform] Cannot get solved stat - platform not initialized');
                return 0;
            }

            if (!this.currentPlatform.getPuzzleSolvedStat) {
                this._log('getPuzzleSolvedStat not supported on current platform');
                return 0;
            }

            try {
                const count = await this.currentPlatform.getPuzzleSolvedStat();
                this._log(`Retrieved puzzle solved stat: ${count}`);
                return count || 0;
            } catch (err) {
                console.error('[Platform] getPuzzleSolvedStat failed:', err);
                return 0;
            }
        }

        /**
         * Get puzzle skipped stat
         * @returns {Promise<number>} Current skipped count (0 if not found)
         */
        async getPuzzleSkippedStat() {
            if (!this.initialized) {
                console.error('[Platform] Cannot get skipped stat - platform not initialized');
                return 0;
            }

            if (!this.currentPlatform.getPuzzleSkippedStat) {
                this._log('getPuzzleSkippedStat not supported on current platform');
                return 0;
            }

            try {
                const count = await this.currentPlatform.getPuzzleSkippedStat();
                this._log(`Retrieved puzzle skipped stat: ${count}`);
                return count || 0;
            } catch (err) {
                console.error('[Platform] getPuzzleSkippedStat failed:', err);
                return 0;
            }
        }

        /**
         * Save tutorial state
         * @param {Object} state - Tutorial state object {tutorialName: boolean}
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async saveTutorialState(state) {
            if (!this.initialized) {
                console.error('[Platform] Cannot save tutorial state - platform not initialized');
                return { success: false, error: new Error('Platform not initialized') };
            }

            try {
                return await this.currentPlatform.saveTutorialState(state);
            } catch (err) {
                console.error(`[Platform] saveTutorialState failed:`, err);
                return { success: false, error: err };
            }
        }

        /**
         * Load tutorial state
         * @returns {Promise<Object>} Tutorial state object or empty object
         */
        async loadTutorialState() {
            if (!this.initialized) {
                console.error('[Platform] Cannot load tutorial state - platform not initialized');
                return {};
            }

            try {
                return await this.currentPlatform.loadTutorialState();
            } catch (err) {
                console.error(`[Platform] loadTutorialState failed:`, err);
                return {};
            }
        }

        /**
         * Check if a specific tutorial has been seen
         * @param {string} tutorialName - Name of the tutorial to check
         * @returns {Promise<boolean>} True if tutorial has been seen
         */
        async hasSeenTutorial(tutorialName) {
            if (!this.initialized) {
                console.error('[Platform] Cannot check tutorial state - platform not initialized');
                return false;
            }

            try {
                const tutorialState = await this.loadTutorialState();
                return !!tutorialState[tutorialName];
            } catch (err) {
                console.error(`[Platform] hasSeenTutorial failed:`, err);
                return false;
            }
        }

        /**
         * Check if platform is available and initialized
         * @returns {boolean}
         */
        isAvailable() {
            return this.initialized && this.currentPlatform && this.currentPlatform.isAvailable();
        }
    }

    // Create global instance
    if (typeof window !== 'undefined') {
        window.Platform = new PlatformAdapter();
    }

})();