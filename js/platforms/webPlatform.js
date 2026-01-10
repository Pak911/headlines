/**
 * Web Platform Implementation
 * 
 * Local storage-based platform for web environment.
 * Provides persistent storage for headlines cache and game settings.
 */

(function() {
    'use strict';

    // Import CACHE_DURATION from async-rss-fetcher if available, otherwise use default
    const CACHE_DURATION = (typeof window !== 'undefined' && 
                           window.AsyncRSSFetcher && 
                           window.AsyncRSSFetcher.CACHE_DURATION) 
                          ? window.AsyncRSSFetcher.CACHE_DURATION 
                          : 300000; // 5 minutes default

    /**
     * Web platform implementation
     */
    class WebPlatform {
        constructor() {
            this.initialized = false;
        }

        /**
         * Initialize web platform
         * @returns {Promise<{success: boolean}>}
         */
        async init() {
            this.initialized = true;
            this._log('Web platform initialized');
            return { success: true };
        }

        /**
         * Cache headlines for a specific source
         * @param {string} sourceName - Name of the RSS source
         * @param {Array} headlines - Array of headline objects
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async cacheHeadlines(sourceName, headlines) {
            try {
                const key = `headlines_${sourceName}`;
                const data = {
                    headlines: headlines,
                    timestamp: Date.now(),
                    sourceName: sourceName
                };
                
                const json = JSON.stringify(data);
                localStorage.setItem(key, json);
                
                this._log(`Cached ${headlines.length} headlines for source: ${sourceName}`);
                return { success: true };
                
            } catch (err) {
                console.error('[Web Platform] cacheHeadlines failed:', err);
                return { success: false, error: err };
            }
        }

        /**
         * Load cached headlines for a specific source
         * @param {string} sourceName - Name of the RSS source
         * @returns {Promise<Array|null>} Array of headlines or null if not found/expired
         */
        async loadCachedHeadlines(sourceName) {
            try {
                const key = `headlines_${sourceName}`;
                const json = localStorage.getItem(key);
                
                if (!json) {
                    this._log(`No cached headlines found for source: ${sourceName}`);
                    return null;
                }

                const data = JSON.parse(json);
                
                // Check if cache is expired
                if (this._isCacheExpired(data.timestamp)) {
                    this._log(`Cached headlines expired for source: ${sourceName}`);
                    return null;
                }
                
                this._log(`Loaded ${data.headlines.length} cached headlines for source: ${sourceName}`);
                return data.headlines;
                
            } catch (err) {
                console.error('[Web Platform] loadCachedHeadlines failed:', err);
                return null;
            }
        }

        /**
         * Check if cache is expired for a specific source
         * @param {string} sourceName - Name of the RSS source
         * @returns {Promise<boolean>} True if expired or not found
         */
        async isCacheExpired(sourceName) {
            try {
                const key = `headlines_${sourceName}`;
                const json = localStorage.getItem(key);
                
                if (!json) {
                    return true; // No cache = expired
                }

                const data = JSON.parse(json);
                const expired = this._isCacheExpired(data.timestamp);
                
                this._log(`Cache for ${sourceName} is ${expired ? 'expired' : 'valid'}`);
                return expired;
                
            } catch (err) {
                console.error('[Web Platform] isCacheExpired failed:', err);
                return true; // Error = treat as expired
            }
        }

        /**
         * Save game language setting
         * @param {string} language - Language code ('en' or 'ru')
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async saveGameLanguage(language) {
            try {
                const key = 'settings_gameLanguage';
                localStorage.setItem(key, language);
                
                this._log(`Saved game language: ${language}`);
                return { success: true };
                
            } catch (err) {
                console.error('[Web Platform] saveGameLanguage failed:', err);
                return { success: false, error: err };
            }
        }

        /**
         * Load game language setting
         * @returns {Promise<string|null>} Language code or null if not found
         */
        async loadGameLanguage() {
            try {
                const key = 'settings_gameLanguage';
                const language = localStorage.getItem(key);
                
                if (language) {
                    this._log(`Loaded game language: ${language}`);
                } else {
                    this._log('No saved game language found');
                }
                
                return language;
                
            } catch (err) {
                console.error('[Web Platform] loadGameLanguage failed:', err);
                return null;
            }
        }

        /**
         * Check if cache timestamp is expired
         * @private
         * @param {number} timestamp - Cache timestamp
         * @returns {boolean} True if expired
         */
        _isCacheExpired(timestamp) {
            if (!timestamp || typeof timestamp !== 'number') {
                return true;
            }
            return (Date.now() - timestamp) > CACHE_DURATION;
        }

        /**
         * Logging helper function
         * @private
         * @param {string} message - Message to log
         */
        _log(message) {
            if (window.__cosic && typeof window.__cosic.flog === 'function') {
                window.__cosic.flog('webPlatform', message);
            } else {
                console.log('[webPlatform]', message);
            }
        }

        /**
         * Save seen headline data
         * @param {string} hash - djb2 hash of the headline
         * @param {Object} data - Seen headline data {isSolved, movesUsed, link, timestamp}
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async saveSeenHeadline(hash, data) {
            try {
                // Load existing seen headlines
                const allSeen = await this.loadAllSeenHeadlines();

                // Update with new data
                allSeen[hash] = {
                    ...data,
                    timestamp: data.timestamp || Date.now()
                };

                // Save back to localStorage
                const json = JSON.stringify(allSeen);
                localStorage.setItem('seenHeadlines', json);

                this._log(`Saved seen headline data for hash: ${hash}`);
                return { success: true };

            } catch (err) {
                console.error('[Web Platform] saveSeenHeadline failed:', err);
                return { success: false, error: err };
            }
        }

        /**
         * Load seen headline data for a specific hash
         * @param {string} hash - djb2 hash of the headline
         * @returns {Promise<Object|null>} Seen headline data or null if not found
         */
        async loadSeenHeadline(hash) {
            try {
                const allSeen = await this.loadAllSeenHeadlines();
                const data = allSeen[hash] || null;

                if (data) {
                    this._log(`Loaded seen headline data for hash: ${hash}`);
                } else {
                    this._log(`No seen headline data found for hash: ${hash}`);
                }

                return data;

            } catch (err) {
                console.error('[Web Platform] loadSeenHeadline failed:', err);
                return null;
            }
        }

        /**
         * Load all seen headlines data
         * @returns {Promise<Object>} Object with all seen headlines data (hash -> data mapping)
         */
        async loadAllSeenHeadlines() {
            try {
                const json = localStorage.getItem('seenHeadlines');
                if (!json) {
                    this._log('No seen headlines data found');
                    return {};
                }

                const data = JSON.parse(json);
                this._log(`Loaded ${Object.keys(data).length} seen headlines`);
                return data;

            } catch (err) {
                console.error('[Web Platform] loadAllSeenHeadlines failed:', err);
                return {};
            }
        }

        /**
         * Increment puzzle solved stat
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async incrementPuzzleSolvedStat() {
            try {
                const currentCount = await this.getPuzzleSolvedStat();
                const newCount = currentCount + 1;
                localStorage.setItem('headline_puzzleSolvedCount', newCount.toString());
                this._log(`Incremented puzzle solved count to: ${newCount}`);
                return { success: true };
            } catch (err) {
                console.error('[Web Platform] incrementPuzzleSolvedStat failed:', err);
                return { success: false, error: err };
            }
        }

        /**
         * Increment puzzle skipped stat
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async incrementPuzzleSkippedStat() {
            try {
                const currentCount = await this.getPuzzleSkippedStat();
                const newCount = currentCount + 1;
                localStorage.setItem('headline_puzzleSkippedCount', newCount.toString());
                this._log(`Incremented puzzle skipped count to: ${newCount}`);
                return { success: true };
            } catch (err) {
                console.error('[Web Platform] incrementPuzzleSkippedStat failed:', err);
                return { success: false, error: err };
            }
        }

        /**
         * Get puzzle solved stat
         * @returns {Promise<number>} Current solved count (0 if not found)
         */
        async getPuzzleSolvedStat() {
            try {
                const stored = localStorage.getItem('headline_puzzleSolvedCount');
                if (stored !== null) {
                    const count = parseInt(stored, 10);
                    if (!isNaN(count) && count >= 0) {
                        return count;
                    }
                }
                return 0;
            } catch (err) {
                console.error('[Web Platform] getPuzzleSolvedStat failed:', err);
                return 0;
            }
        }

        /**
         * Get puzzle skipped stat
         * @returns {Promise<number>} Current skipped count (0 if not found)
         */
        async getPuzzleSkippedStat() {
            try {
                const stored = localStorage.getItem('headline_puzzleSkippedCount');
                if (stored !== null) {
                    const count = parseInt(stored, 10);
                    if (!isNaN(count) && count >= 0) {
                        return count;
                    }
                }
                return 0;
            } catch (err) {
                console.error('[Web Platform] getPuzzleSkippedStat failed:', err);
                return 0;
            }
        }

        /**
         * Save tutorial state
         * @param {Object} state - Tutorial state object {tutorialName: boolean}
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async saveTutorialState(state) {
            try {
                const json = JSON.stringify(state);
                localStorage.setItem('tutorialState', json);
                
                this._log('Saved tutorial state');
                return { success: true };
                
            } catch (err) {
                console.error('[Web Platform] saveTutorialState failed:', err);
                return { success: false, error: err };
            }
        }

        /**
         * Load tutorial state
         * @returns {Promise<Object>} Tutorial state object or empty object
         */
        async loadTutorialState() {
            try {
                const json = localStorage.getItem('tutorialState');
                if (!json) {
                    this._log('No tutorial state found');
                    return {};
                }

                const state = JSON.parse(json);
                this._log('Loaded tutorial state');
                return state;
                
            } catch (err) {
                console.error('[Web Platform] loadTutorialState failed:', err);
                return {};
            }
        }

        /**
         * Check if platform is available and initialized
         * @returns {boolean}
         */
        isAvailable() {
            return this.initialized;
        }
    }

    // Export for use in platform adapter
    if (typeof window !== 'undefined') {
        window.WebPlatform = WebPlatform;
    }

})();