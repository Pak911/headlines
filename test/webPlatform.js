/**
 * Web Platform Implementation
 * 
 * Simple localStorage-based save/load for local web environment.
 * No SDK initialization required.
 * This file is included in web builds only.
 */

(function() {
    'use strict';

    /**
     * Web platform implementation
     */
    class WebPlatform {
        constructor() {
            this.initialized = false;
        }

        /**
         * Initialize web platform (trivial - just returns success)
         * @returns {Promise<{success: boolean}>}
         */
        async init() {
            this.initialized = true;
            this._log('Web platform initialized (no SDK required)');
            // this._startFullscreenMonitoring();
            return { success: true };
        }

        /**
         * Start monitoring fullscreen status changes using standard browser APIs
         */
        _startFullscreenMonitoring() {
            // Listen to standard fullscreen events
            document.addEventListener('fullscreenchange', () => {
                const isFullscreen = !!document.fullscreenElement;
                if (isFullscreen) {
                    window.Platform.signalFullscreenOn();
                } else {
                    window.Platform.signalFullscreenOff();
                }
            });
        }

        /**
         * Save data to localStorage
         * @param {string} key - Storage key
         * @param {any} data - Data to save (will be JSON serialized)
         * @param {boolean} immediate - Ignored for web platform (no rate limiting)
         * @returns {Promise<void>}
         */
        async save(key, data, immediate = false) {
            try {
                const json = JSON.stringify(data);
                localStorage.setItem(key, json);
                this._log(`Saved to localStorage: ${key} (${json.length} bytes)`);
            } catch (err) {
                console.error('[Web Platform] Save failed:', err);
                throw err;
            }
        }

        /**
         * Load data from localStorage
         * @param {string} key - Storage key
         * @returns {Promise<any|null>} Loaded data or null if not found
         */
        async load(key) {
            try {
                const json = localStorage.getItem(key);
                
                if (!json) {
                    this._log(`No data found for key: ${key}`);
                    return null;
                }

                const data = JSON.parse(json);
                this._log(`Loaded from localStorage: ${key} (${json.length} bytes)`);
                return data;
                
            } catch (err) {
                console.error('[Web Platform] Load failed:', err);
                return null;
            }
        }

        /**
         * Delete data from localStorage
         * @param {string} key - Storage key to delete
         * @returns {Promise<void>}
         */
        async delete(key) {
            try {
                localStorage.removeItem(key);
                this._log(`Deleted from localStorage: ${key}`);
            } catch (err) {
                console.error('[Web Platform] Delete failed:', err);
                throw err;
            }
        }

        /**
         * Check if platform is available and initialized
         * @returns {boolean}
         */
        isAvailable() {
            return this.initialized;
        }

        /**
         * Save numeric stats to localStorage
         * @param {Object} stats - Object with key-value pairs where values are numbers
         * @param {number} priority - Ignored in web platform (no rate limiting needed)
         * @returns {Promise<void>}
         */
        async setStats(stats, priority) {
            try {
                // Add timestamp for tracking freshness
                const statsWithTimestamp = {
                    ...stats,
                    _statsTimestamp: Date.now()
                };
                
                // Save each stat individually with 'stellarMerge_stat_' prefix
                for (const [key, value] of Object.entries(statsWithTimestamp)) {
                    localStorage.setItem(`stellarMerge_stat_${key}`, value.toString());
                }
                
                this._log(`Saved stats: ${Object.keys(stats).join(', ')}`);
            } catch (err) {
                console.error('[Web Platform] setStats failed:', err);
                throw err;
            }
        }

        /**
         * Get numeric stats from localStorage
         * @param {Array<string>} keys - Array of stat keys to retrieve
         * @returns {Promise<Object>} Object with key-value pairs
         */
        async getStats(keys) {
            try {
                const result = {};
                
                // Always include timestamp
                const keysWithTimestamp = [...keys, '_statsTimestamp'];
                
                for (const key of keysWithTimestamp) {
                    const value = localStorage.getItem(`stellarMerge_stat_${key}`);
                    if (value !== null) {
                        result[key] = parseFloat(value);
                    }
                }
                
                this._log(`Loaded stats: ${Object.keys(result).join(', ')}`);
                return result;
            } catch (err) {
                console.error('[Web Platform] getStats failed:', err);
                return {};
            }
        }

        /**
         * Get maximum score from localStorage
         * Simple localStorage read - web platform stores maxScore locally
         * @returns {Promise<number>} The maximum score, or 0 if none found
         */
        async getMaxScore() {
            try {
                const stored = localStorage.getItem('stellarMerge_maxScore');
                if (stored !== null) {
                    const value = parseInt(stored, 10);
                    if (!isNaN(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER) {
                        this._log(`Loaded max score: ${value}`);
                        return value;
                    }
                }
                this._log('No valid max score in localStorage');
                return 0;
            } catch (err) {
                console.error('[Web Platform] getMaxScore failed:', err);
                return 0;
            }
        }

        /**
         * Save maximum score to localStorage
         * Web platform writes directly to localStorage
         * @param {number} score - The score to save
         * @returns {Promise<void>}
         */
        async saveMaxScore(score) {
            try {
                if (typeof score !== 'number' || isNaN(score) || score < 0 || score > Number.MAX_SAFE_INTEGER) {
                    throw new Error(`Invalid score value: ${score}`);
                }
                localStorage.setItem('stellarMerge_maxScore', score.toString());
                this._log(`Saved max score: ${score}`);
            } catch (err) {
                console.error('[Web Platform] saveMaxScore failed:', err);
                throw err;
            }
        }

        /**
         * Get game mode unlock animations played state from localStorage
         * @returns {Promise<Object>} Object with mode keys and boolean values indicating if unlock animation was played
         */
        async getUnlockAnimationsPlayed() {
            try {
                const stored = localStorage.getItem('stellarMerge_unlockAnimationsPlayed');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    this._log(`Loaded unlock animations state: ${Object.keys(parsed).length} modes`);
                    return parsed;
                }
                this._log('No unlock animations state in localStorage');
                return {};
            } catch (err) {
                console.error('[Web Platform] getUnlockAnimationsPlayed failed:', err);
                return {};
            }
        }

        /**
         * Mark a game mode's unlock animation as played
         * @param {string} mode - Game mode identifier ('chill', 'stellar-cleanup')
         * @returns {Promise<void>}
         */
        async setUnlockAnimationPlayed(mode) {
            try {
                // Load current state
                const current = await this.getUnlockAnimationsPlayed();
                
                // Update with new flag
                current[mode] = true;
                
                // Save back to localStorage
                const json = JSON.stringify(current);
                localStorage.setItem('stellarMerge_unlockAnimationsPlayed', json);
                this._log(`Marked unlock animation as played for mode: ${mode}`);
            } catch (err) {
                console.error('[Web Platform] setUnlockAnimationPlayed failed:', err);
                throw err;
            }
        }

        /**
         * Get tutorial state from localStorage
         * @returns {Promise<Object>} Tutorial state object with boolean flags
         */
        async getTutorialState() {
            try {
                const stored = localStorage.getItem('stellarMerge_tutorialShown');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    this._log(`Loaded tutorial state: ${Object.keys(parsed).length} flags`);
                    return parsed;
                }
                this._log('No tutorial state in localStorage');
                return {};
            } catch (err) {
                console.error('[Web Platform] getTutorialState failed:', err);
                return {};
            }
        }

        /**
         * Save tutorial state to localStorage
         * Web platform writes directly to localStorage
         * @param {Object} state - Tutorial state object with boolean flags
         * @returns {Promise<void>}
         */
        async saveTutorialState(state) {
            try {
                localStorage.setItem('stellarMerge_tutorialShown', JSON.stringify(state));
                this._log(`Saved tutorial state: ${Object.keys(state).length} flags`);
            } catch (err) {
                console.error('[Web Platform] saveTutorialState failed:', err);
                throw err;
            }
        }

        /**
         * Get user's preferred language
         * Returns saved language from localStorage, or detects from browser
         * Does NOT validate if language is supported - validation happens at i18n level
         * @returns {Promise<string>} Language code (raw from browser or storage)
         */
        async getLanguage() {
            try {
                // First check localStorage for saved preference
                const saved = localStorage.getItem('stellarMerge_language');
                if (saved) {
                    this._log(`Loaded saved language: ${saved}`);
                    return saved;
                }
                
                // Fallback to browser language detection
                const browserLang = navigator.language.toLowerCase();
                
                // Extract base language code (e.g., 'en' from 'en-US')
                const baseLang = browserLang.split('-')[0];
                this._log(`Detected browser language: ${baseLang} (from ${browserLang})`);
                return baseLang;
            } catch (err) {
                console.error('[Web Platform] getLanguage failed:', err);
                // Return 'en' as absolute fallback
                return 'en';
            }
        }

        /**
         * Save user's language preference to localStorage
         * @param {string} lang - Language code ('en', 'ru', etc.)
         * @returns {Promise<void>}
         */
        async saveLanguage(lang) {
            try {
                localStorage.setItem('stellarMerge_language', lang);
                this._log(`Saved language preference: ${lang}`);
            } catch (err) {
                console.error('[Web Platform] saveLanguage failed:', err);
                throw err;
            }
        }

        /**
         * Get sound enabled state from localStorage
         * @returns {Promise<boolean>} True if sound is enabled
         */
        async getSoundEnabled() {
            try {
                const saved = localStorage.getItem('stellarMerge_soundEnabled');
                if (saved !== null) {
                    const enabled = saved === 'true';
                    this._log(`Loaded sound enabled: ${enabled}`);
                    return enabled;
                }
                // Default to true (sound enabled)
                this._log('No sound preference saved, defaulting to true');
                return true;
            } catch (err) {
                console.error('[Web Platform] getSoundEnabled failed:', err);
                return true;
            }
        }

        /**
         * Save sound enabled state to localStorage
         * @param {boolean} enabled - True to enable sound
         * @returns {Promise<void>}
         */
        async saveSoundEnabled(enabled) {
            try {
                localStorage.setItem('stellarMerge_soundEnabled', enabled.toString());
                this._log(`Saved sound enabled: ${enabled}`);
            } catch (err) {
                console.error('[Web Platform] saveSoundEnabled failed:', err);
                throw err;
            }
        }

        /**
         * Get tooltip size preference from localStorage
         * @returns {Promise<string>} 'standard' or 'enlarged'
         */
        async getTooltipSize() {
            try {
                const saved = localStorage.getItem('stellarMerge_tooltipSize');
                if (saved !== null && (saved === 'standard' || saved === 'enlarged')) {
                    this._log(`Loaded tooltip size: ${saved}`);
                    return saved;
                }
                // Default to 'enlarged'
                this._log('No tooltip size preference saved, defaulting to enlarged');
                return 'enlarged';
            } catch (err) {
                console.error('[Web Platform] getTooltipSize failed:', err);
                return 'enlarged';
            }
        }

        /**
         * Save tooltip size preference to localStorage
         * @param {string} size - 'standard' or 'enlarged'
         * @returns {Promise<void>}
         */
        async saveTooltipSize(size) {
            try {
                if (size !== 'standard' && size !== 'enlarged') {
                    throw new Error(`Invalid tooltip size: ${size}`);
                }
                localStorage.setItem('stellarMerge_tooltipSize', size);
                this._log(`Saved tooltip size: ${size}`);
            } catch (err) {
                console.error('[Web Platform] saveTooltipSize failed:', err);
                throw err;
            }
        }

        /**
         * Get sound effects volume from localStorage
         * @returns {Promise<number>} Volume percentage (0-120)
         */
        async getSoundEffectsVolume() {
            try {
                const saved = localStorage.getItem('stellarMerge_soundEffectsVolume');
                if (saved !== null) {
                    const volume = parseInt(saved, 10);
                    if (!isNaN(volume) && volume >= 0 && volume <= 120) {
                        this._log(`Loaded sound effects volume: ${volume}%`);
                        return volume;
                    }
                }
                this._log('No sound effects volume saved, defaulting to 100%');
                return 100;
            } catch (err) {
                console.error('[Web Platform] getSoundEffectsVolume failed:', err);
                return 100;
            }
        }

        /**
         * Save sound effects volume to localStorage
         * @param {number} volume - Volume percentage (0-120)
         * @returns {Promise<void>}
         */
        async saveSoundEffectsVolume(volume) {
            try {
                if (typeof volume !== 'number' || volume < 0 || volume > 120) {
                    throw new Error(`Invalid sound effects volume: ${volume}`);
                }
                localStorage.setItem('stellarMerge_soundEffectsVolume', volume.toString());
                this._log(`Saved sound effects volume: ${volume}%`);
            } catch (err) {
                console.error('[Web Platform] saveSoundEffectsVolume failed:', err);
                throw err;
            }
        }

        /**
         * Get music volume from localStorage
         * @returns {Promise<number>} Volume percentage (0-120)
         */
        async getMusicVolume() {
            try {
                const saved = localStorage.getItem('stellarMerge_musicVolume');
                if (saved !== null) {
                    const volume = parseInt(saved, 10);
                    if (!isNaN(volume) && volume >= 0 && volume <= 120) {
                        this._log(`Loaded music volume: ${volume}%`);
                        return volume;
                    }
                }
                this._log('No music volume saved, defaulting to 100%');
                return 100;
            } catch (err) {
                console.error('[Web Platform] getMusicVolume failed:', err);
                return 100;
            }
        }

        /**
         * Save music volume to localStorage
         * @param {number} volume - Volume percentage (0-120)
         * @returns {Promise<void>}
         */
        async saveMusicVolume(volume) {
            try {
                if (typeof volume !== 'number' || volume < 0 || volume > 120) {
                    throw new Error(`Invalid music volume: ${volume}`);
                }
                localStorage.setItem('stellarMerge_musicVolume', volume.toString());
                this._log(`Saved music volume: ${volume}%`);
            } catch (err) {
                console.error('[Web Platform] saveMusicVolume failed:', err);
                throw err;
            }
        }

        /**
         * Start gameplay (no-op for web platform)
         * Web builds don't need gameplay markup
         * @returns {Promise<void>}
         */
        async startGameplay() {
            // No-op for web platform
        }

        /**
         * Stop gameplay (no-op for web platform)
         * Web builds don't need gameplay markup
         * @returns {Promise<void>}
         */
        async stopGameplay() {
            // No-op for web platform
        }

        /**
         * Signal game ready (no-op for web platform)
         * Web builds don't need loading API integration
         * @returns {Promise<void>}
         */
        async signalGameReady() {
            // No-op for web platform
        }

        /**
         * Clear all user data from localStorage
         * Removes all game-related data including saves, settings, max score, tutorial progress
         * @returns {Promise<{success: boolean, error?: string}>}
         */
        async clearAllData() {
            try {
                this._log('[clearAllData] 🗑️ Clearing all localStorage data...');
                
                // Clear max score
                if (window.__cosmic_maxScore && typeof window.__cosmic_maxScore.reset === 'function') {
                    window.__cosmic_maxScore.reset();
                }
                
                // Clear all stellarMerge prefixed keys
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('stellarMerge')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                this._log(`[clearAllData] ✅ Cleared ${keysToRemove.length} localStorage items`);
                return { success: true };
            } catch (err) {
                console.error('[Web Platform] clearAllData failed:', err);
                return { success: false, error: err.message };
            }
        }

        /**
         * Check if rewardable ads are available on this platform
         * @returns {boolean} False for web platform (no ads support)
         */
        isRewardedAdsAvailable() {
            // Web platform does not support rewardable ads
            return false;
        }

        /**
         * Show rewarded video ad (web platform simulation)
         * Always succeeds immediately
         * @param {object} callbacks - Callback functions: onOpen, onRewarded, onClose, onError
         * @returns {Promise<void>}
         */
        async showRewardedVideo(callbacks) {
            // Simulate ad opening
            if (callbacks.onOpen) {
                callbacks.onOpen();
            }

            // Simulate successful reward
            if (callbacks.onRewarded) {
                callbacks.onRewarded();
            }

            // Simulate ad closing
            if (callbacks.onClose) {
                callbacks.onClose();
            }

            this._log('Simulated rewarded video completed successfully');
        }

        /**
         * Check if this is the player's first session
         * First session is determined by: maxScore === 0 AND no saves exist
         * @returns {Promise<boolean>} True if this is the first session
         */
        async isFirstSession() {
            try {
                // Check maxScore
                const maxScore = await this.getMaxScore();
                if (maxScore > 0) {
                    this._log('Not first session: maxScore > 0');
                    return false;
                }

                // Check for any saves in localStorage
                const saveKeys = ['stellarMerge_save_', 'stellar-merge-save-'];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && saveKeys.some(prefix => key.startsWith(prefix))) {
                        this._log(`Not first session: found save key "${key}"`);
                        return false;
                    }
                }

                this._log('First session detected: maxScore = 0 and no saves found');
                return true;
            } catch (err) {
                console.error('[Web Platform] isFirstSession failed:', err);
                return false;
            }
        }

        /**
         * Helper for logging with debug system support
         * @private
         */
        _log(message) {
            if (window.__cosic && typeof window.__cosic.flog === 'function') {
                window.__cosic.flog('web-platform', message);
            } else {
                console.log('[Web Platform]', message);
            }
        }
    }

    // Create global instance
    window.__cosmic_webPlatform = new WebPlatform();

})();
