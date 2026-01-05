/**
 * Platform Adapter - Strategy Pattern for Cross-Platform Support
 * 
 * Provides unified API for platform-specific operations (init, save, load).
 * Automatically detects the current platform and routes calls to appropriate
 * implementation (Y Games, local web, etc.).
 * 
 * Usage:
 *   await Platform.init();
 *   await Platform.save('seamless_standard', gameData);
 *   const data = await Platform.load('seamless_standard');
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
         * Provides consistent logging across the platform adapter module.
         * Uses the game's debug system (window.__cosic.flog) when available,
         * otherwise falls back to console.log.
         * All logs are forced to always display (not gated by debug mode).
         * 
         * @private
         * @param {...any} args - Arguments to log (strings, objects, etc.)
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
         * When the game is ready, call platform's signalGameReady method
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
            this._log(['window.__cosmic_platform exists?', typeof window.__cosmic_platform !== 'undefined']);
            this._log(['window.__cosmic_webPlatform exists?', typeof window.__cosmic_webPlatform !== 'undefined']);
            
            // Check if Y Games integration is available
            if (window.__cosmic_platform && 
                typeof window.__cosmic_platform.isAvailable === 'function') {
                this._log('Detected: y');
                return 'y';
            }
            
            // Check if web platform implementation is available
            if (window.__cosmic_webPlatform) {
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
                    this.currentPlatform = window.__cosmic_webPlatform;
                    this._log('Using Web platform implementation');
                }

                this._log(`Detected platform: ${this.platformType}`);

                // CRITICAL: Check for incompatible configuration
                if (this.platformType === 'y' && 
                    typeof stellarMergeSettings !== 'undefined' &&
                    stellarMergeSettings.saveMode === 'manual') {
                    
                    const errorMsg = 'CRITICAL ERROR: Manual save mode is not supported on Y platform! ' +
                                   'Please set saveMode to "seamless" in data.js for Y builds.';
                    console.error('[Platform]', errorMsg);
                    
                    throw new Error('Incompatible configuration: Manual saves on Y platform');
                }

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
                
                this._log('Dispatching cosmic:platform:ready event');
                // Dispatch event so other systems can wait for platform readiness
                window.dispatchEvent(new CustomEvent('cosmic:platform:ready', {
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
         * Save data to platform storage
         * @param {string} key - Storage key
         * @param {any} data - Data to save (will be JSON serialized by platform)
         * @param {boolean} immediate - If true, bypasses rate limiting and saves immediately
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async save(key, data, immediate = false) {
            if (!this.initialized) {
                console.error('[Platform] Cannot save - platform not initialized');
                return { success: false, error: new Error('Platform not initialized') };
            }

            try {
                await this.currentPlatform.save(key, data, immediate);
                
                // Dispatch success event
                window.dispatchEvent(new CustomEvent('cosmic:data:saved:success', {
                    detail: { key, platform: this.platformType }
                }));
                
                return { success: true };
            } catch (err) {
                // Check for specific network error
                const errorType = err.message === 'NO_INTERNET_CONNECTION' ? 'no_internet_connection' : 'general_error';
                
                // Dispatch error event
                window.dispatchEvent(new CustomEvent('cosmic:data:saved:error', {
                    detail: { key, error: err.message, errorType, platform: this.platformType }
                }));
                
                if (err.message === 'NO_INTERNET_CONNECTION') {
                    this._log(`[Platform] Save failed due to no internet connection for key "${key}"`);
                } else {
                    console.error(`[Platform] Save failed for key "${key}":`, err);
                }
                
                // Dispatch event for future UI indicators
                window.dispatchEvent(new CustomEvent('cosmic:save:failed', {
                    detail: { key, error: err.message, platform: this.platformType }
                }));
                
                return { success: false, error: err };
            }
        }

        /**
         * Load data from platform storage
         * @param {string} key - Storage key
         * @returns {Promise<any|null>} Loaded data or null if not found
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

            if (!this.currentPlatform.delete) {
                console.error('[Platform] Delete not supported on this platform');
                return { success: false, error: new Error('Delete not supported') };
            }

            try {
                await this.currentPlatform.delete(key);
                this._log(`Deleted key: ${key}`);
                return { success: true };
            } catch (err) {
                console.error(`[Platform] Delete failed for key "${key}":`, err);
                return { success: false, error: err };
            }
        }

        /**
         * Get current platform type
         * @returns {string} Platform type: 'y', 'web', or 'unknown'
         */
        getPlatformType() {
            return this.platformType;
        }

        /**
         * Check if platform is initialized and ready
         * @returns {boolean}
         */
        isReady() {
            return this.initialized && this.currentPlatform !== null;
        }

        /**
         * Save numeric stats (optimized for frequently changing values like scores)
         * @param {Object} stats - Object with key-value pairs where values are numbers
         * @param {number} priority - Write priority (0=highest for settings/lifetime stats, 1=tutorial, 2=maxScore)
         * @returns {Promise<{success: boolean, error?: Error}>}
         */
        async setStats(stats, priority = 2) {
            if (!this.initialized) {
                console.error('[Platform] Cannot setStats - platform not initialized');
                return { success: false, error: new Error('Platform not initialized') };
            }

            if (!this.currentPlatform.setStats) {
                console.warn('[Platform] setStats not supported on this platform');
                return { success: false, error: new Error('Not supported') };
            }

            try {
                await this.currentPlatform.setStats(stats, priority);
                return { success: true };
            } catch (err) {
                console.error(`[Platform] setStats failed:`, err);
                return { success: false, error: err };
            }
        }

        /**
         * Get numeric stats
         * @param {Array<string>} keys - Array of stat keys to retrieve
         * @returns {Promise<Object>} Object with key-value pairs
         */
        async getStats(keys) {
            if (!this.initialized) {
                console.error('[Platform] Cannot getStats - platform not initialized');
                return {};
            }

            if (!this.currentPlatform.getStats) {
                console.warn('[Platform] getStats not supported on this platform');
                return {};
            }

            try {
                return await this.currentPlatform.getStats(keys);
            } catch (err) {
                console.error(`[Platform] getStats failed:`, err);
                return {};
            }
        }

        /**
         * Force immediate stats sync (bypasses debounce)
         * Critical for Yandex platform before page reload/unload
         * @returns {Promise<void>}
         */
        async forceStatsSyncNow() {
            if (!this.initialized) {
                console.warn('[Platform] Cannot forceStatsSyncNow - platform not initialized');
                return;
            }

            if (!this.currentPlatform.forceStatsSyncNow) {
                // Web platform doesn't need this (no debouncing)
                return;
            }

            try {
                await this.currentPlatform.forceStatsSyncNow();
            } catch (err) {
                console.error(`[Platform] forceStatsSyncNow failed:`, err);
            }
        }

        /**
         * Get maximum score from platform storage (cloud or local)
         * Each platform implementation determines how to retrieve the max score:
         * - Web: reads from localStorage
         * - Y: checks player.getStats() AND scans all cloud saves
         * @returns {Promise<number>} The maximum score, or 0 if none found
         */
        async getMaxScore() {
            if (!this.initialized) {
                console.warn('[Platform] Cannot getMaxScore - platform not initialized, returning 0');
                return 0;
            }

            if (!this.currentPlatform.getMaxScore) {
                console.warn('[Platform] getMaxScore not supported on this platform, returning 0');
                return 0;
            }

            try {
                const maxScore = await this.currentPlatform.getMaxScore();
                return typeof maxScore === 'number' ? maxScore : 0;
            } catch (err) {
                console.error(`[Platform] getMaxScore failed:`, err);
                return 0;
            }
        }

        /**
         * Save maximum score to platform storage (cloud or local)
         * Each platform implementation determines where to save:
         * - Web: writes to localStorage
         * - Y: writes to player.setStats() only (no localStorage)
         * @param {number} score - The score to save
         * @returns {Promise<void>}
         */
        async saveMaxScore(score) {
            if (!this.initialized) {
                console.error('[Platform] Cannot saveMaxScore - platform not initialized');
                throw new Error('Platform not initialized');
            }

            if (!this.currentPlatform.saveMaxScore) {
                console.warn('[Platform] saveMaxScore not supported on this platform');
                throw new Error('Not supported');
            }

            try {
                await this.currentPlatform.saveMaxScore(score);
            } catch (err) {
                console.error(`[Platform] saveMaxScore failed:`, err);
                throw err;
            }
        }

        /**
         * Get tutorial state from platform storage (cloud or local)
         * @returns {Promise<Object>} Tutorial state object with boolean flags
         */
        async getTutorialState() {
            if (!this.initialized) {
                console.warn('[Platform] Cannot getTutorialState - platform not initialized');
                return {};
            }

            if (!this.currentPlatform.getTutorialState) {
                console.warn('[Platform] getTutorialState not supported on this platform');
                return {};
            }

            try {
                return await this.currentPlatform.getTutorialState();
            } catch (err) {
                console.error(`[Platform] getTutorialState failed:`, err);
                return {};
            }
        }

        /**
         * Save tutorial state to platform storage (cloud or local)
         * Each platform implementation determines where to save:
         * - Web: writes to localStorage
         * - Y: writes to player.setStats() only (no localStorage)
         * @param {Object} state - Tutorial state object with boolean flags
         * @returns {Promise<void>}
         */
        async saveTutorialState(state) {
            if (!this.initialized) {
                console.error('[Platform] Cannot saveTutorialState - platform not initialized');
                throw new Error('Platform not initialized');
            }

            if (!this.currentPlatform.saveTutorialState) {
                console.warn('[Platform] saveTutorialState not supported on this platform');
                throw new Error('Not supported');
            }

            try {
                await this.currentPlatform.saveTutorialState(state);
            } catch (err) {
                console.error(`[Platform] saveTutorialState failed:`, err);
                throw err;
            }
        }

        /**
         * Get game mode unlock animations played state
         * @returns {Promise<Object>} Object with mode keys and boolean values indicating if unlock animation was played
         */
        async getUnlockAnimationsPlayed() {
            if (!this.initialized) {
                console.warn('[Platform] Cannot getUnlockAnimationsPlayed - platform not initialized');
                return {};
            }

            if (!this.currentPlatform.getUnlockAnimationsPlayed) {
                console.warn('[Platform] getUnlockAnimationsPlayed not supported on this platform');
                return {};
            }

            try {
                return await this.currentPlatform.getUnlockAnimationsPlayed();
            } catch (err) {
                console.error(`[Platform] getUnlockAnimationsPlayed failed:`, err);
                return {};
            }
        }

        /**
         * Mark a game mode's unlock animation as played
         * @param {string} mode - Game mode identifier ('chill', 'stellar-cleanup')
         * @returns {Promise<void>}
         */
        async setUnlockAnimationPlayed(mode) {
            if (!this.initialized) {
                console.error('[Platform] Cannot setUnlockAnimationPlayed - platform not initialized');
                throw new Error('Platform not initialized');
            }

            if (!this.currentPlatform.setUnlockAnimationPlayed) {
                console.warn('[Platform] setUnlockAnimationPlayed not supported on this platform');
                throw new Error('Not supported');
            }

            try {
                await this.currentPlatform.setUnlockAnimationPlayed(mode);
            } catch (err) {
                console.error(`[Platform] setUnlockAnimationPlayed failed:`, err);
                throw err;
            }
        }

        /**
         * Get user's preferred language
         * Each platform determines the initial language:
         * - Web: Reads from localStorage, falls back to navigator.language
         * - Y: Uses ysdk.environment.i18n.lang, falls back to saved preference
         * @returns {Promise<string>} Language code ('en', 'ru', etc.)
         */
        async getLanguage() {
            if (!this.initialized) {
                console.warn('[Platform] Cannot getLanguage - platform not initialized, falling back to "en"');
                return 'en';
            }

            if (!this.currentPlatform.getLanguage) {
                console.warn('[Platform] getLanguage not supported on this platform, falling back to "en"');
                return 'en';
            }

            try {
                const lang = await this.currentPlatform.getLanguage();
                return lang || 'en';
            } catch (err) {
                console.error(`[Platform] getLanguage failed:`, err);
                return 'en';
            }
        }

        /**
         * Save user's language preference
         * Each platform determines how to save:
         * - Web: Writes to localStorage immediately
         * - Y: Queues for player.setStats() with HIGH priority
         * @param {string} lang - Language code ('en', 'ru', etc.)
         * @returns {Promise<void>}
         */
        async saveLanguage(lang) {
            if (!this.initialized) {
                console.error('[Platform] Cannot saveLanguage - platform not initialized');
                throw new Error('Platform not initialized');
            }

            if (!this.currentPlatform.saveLanguage) {
                console.warn('[Platform] saveLanguage not supported on this platform');
                throw new Error('Not supported');
            }

            try {
                await this.currentPlatform.saveLanguage(lang);
            } catch (err) {
                console.error(`[Platform] saveLanguage failed:`, err);
                throw err;
            }
        }

        /**
         * Get sound enabled state
         * @returns {Promise<boolean>} True if sound is enabled
         */
        async getSoundEnabled() {
            if (!this.initialized) {
                console.warn('[Platform] Cannot getSoundEnabled - platform not initialized, returning true');
                return true;
            }

            if (!this.currentPlatform.getSoundEnabled) {
                console.warn('[Platform] getSoundEnabled not supported on this platform, returning true');
                return true;
            }

            try {
                const enabled = await this.currentPlatform.getSoundEnabled();
                return enabled !== false; // Default to true
            } catch (err) {
                console.error(`[Platform] getSoundEnabled failed:`, err);
                return true;
            }
        }

        /**
         * Save sound enabled state
         * Each platform determines how to save:
         * - Web: Writes to localStorage immediately
         * - Y: Queues for player.setStats() with HIGH priority
         * @param {boolean} enabled - True to enable sound
         * @returns {Promise<void>}
         */
        async saveSoundEnabled(enabled) {
            if (!this.initialized) {
                console.error('[Platform] Cannot saveSoundEnabled - platform not initialized');
                throw new Error('Platform not initialized');
            }

            if (!this.currentPlatform.saveSoundEnabled) {
                console.warn('[Platform] saveSoundEnabled not supported on this platform');
                throw new Error('Not supported');
            }

            try {
                await this.currentPlatform.saveSoundEnabled(enabled);
            } catch (err) {
                console.error(`[Platform] saveSoundEnabled failed:`, err);
                throw err;
            }
        }

        /**
         * Get tooltip size preference
         * @returns {Promise<string>} 'standard' or 'enlarged'
         */
        async getTooltipSize() {
            if (!this.initialized) {
                console.warn('[Platform] Cannot getTooltipSize - platform not initialized, returning standard');
                return 'standard';
            }

            if (!this.currentPlatform.getTooltipSize) {
                console.warn('[Platform] getTooltipSize not supported on this platform, returning standard');
                return 'standard';
            }

            try {
                const size = await this.currentPlatform.getTooltipSize();
                return (size === 'enlarged') ? 'enlarged' : 'standard';
            } catch (err) {
                console.error(`[Platform] getTooltipSize failed:`, err);
                return 'standard';
            }
        }

        /**
         * Save tooltip size preference
         * Each platform determines how to save:
         * - Web: Writes to localStorage immediately
         * - Y: Queues for player.setStats() with HIGH priority (converts to number: 0=standard, 1=enlarged)
         * @param {string} size - 'standard' or 'enlarged'
         * @returns {Promise<void>}
         */
        async saveTooltipSize(size) {
            if (!this.initialized) {
                console.error('[Platform] Cannot saveTooltipSize - platform not initialized');
                throw new Error('Platform not initialized');
            }

            if (!this.currentPlatform.saveTooltipSize) {
                console.warn('[Platform] saveTooltipSize not supported on this platform');
                throw new Error('Not supported');
            }

            try {
                await this.currentPlatform.saveTooltipSize(size);
            } catch (err) {
                console.error(`[Platform] saveTooltipSize failed:`, err);
                throw err;
            }
        }

        /**
         * Check if this is the player's first session
         * First session is determined by: maxScore === 0 AND no saves exist
         * @returns {Promise<boolean>} True if this is the first session
         */
        async isFirstSession() {
            if (!this.initialized) {
                console.warn('[Platform] Cannot check isFirstSession - platform not initialized, returning false');
                return false;
            }

            if (!this.currentPlatform.isFirstSession) {
                console.warn('[Platform] isFirstSession not supported on this platform, returning false');
                return false;
            }

            try {
                return await this.currentPlatform.isFirstSession();
            } catch (err) {
                console.error(`[Platform] isFirstSession failed:`, err);
                return false;
            }
        }

        /**
         * Get sound effects volume preference
         * @returns {Promise<number>} Volume percentage (0-120)
         */
        async getSoundEffectsVolume() {
            if (!this.initialized) {
                console.warn('[Platform] Cannot getSoundEffectsVolume - platform not initialized, returning 100');
                return 100;
            }
            if (!this.currentPlatform.getSoundEffectsVolume) {
                console.warn('[Platform] getSoundEffectsVolume not supported on this platform, returning 100');
                return 100;
            }
            try {
                const volume = await this.currentPlatform.getSoundEffectsVolume();
                return (typeof volume === 'number' && volume >= 0 && volume <= 120) ? volume : 100;
            } catch (err) {
                console.error(`[Platform] getSoundEffectsVolume failed:`, err);
                return 100;
            }
        }

        /**
         * Save sound effects volume preference
         * @param {number} volume - Volume percentage (0-120)
         * @returns {Promise<void>}
         */
        async saveSoundEffectsVolume(volume) {
            if (!this.initialized) {
                console.error('[Platform] Cannot saveSoundEffectsVolume - platform not initialized');
                throw new Error('Platform not initialized');
            }
            if (!this.currentPlatform.saveSoundEffectsVolume) {
                console.warn('[Platform] saveSoundEffectsVolume not supported on this platform');
                throw new Error('Not supported');
            }
            try {
                await this.currentPlatform.saveSoundEffectsVolume(volume);
            } catch (err) {
                console.error(`[Platform] saveSoundEffectsVolume failed:`, err);
                throw err;
            }
        }

        /**
         * Get music volume preference
         * @returns {Promise<number>} Volume percentage (0-120)
         */
        async getMusicVolume() {
            if (!this.initialized) {
                console.warn('[Platform] Cannot getMusicVolume - platform not initialized, returning 100');
                return 100;
            }
            if (!this.currentPlatform.getMusicVolume) {
                console.warn('[Platform] getMusicVolume not supported on this platform, returning 100');
                return 100;
            }
            try {
                const volume = await this.currentPlatform.getMusicVolume();
                return (typeof volume === 'number' && volume >= 0 && volume <= 120) ? volume : 100;
            } catch (err) {
                console.error(`[Platform] getMusicVolume failed:`, err);
                return 100;
            }
        }

        /**
         * Save music volume preference
         * @param {number} volume - Volume percentage (0-120)
         * @returns {Promise<void>}
         */
        async saveMusicVolume(volume) {
            if (!this.initialized) {
                console.error('[Platform] Cannot saveMusicVolume - platform not initialized');
                throw new Error('Platform not initialized');
            }
            if (!this.currentPlatform.saveMusicVolume) {
                console.warn('[Platform] saveMusicVolume not supported on this platform');
                throw new Error('Not supported');
            }
            try {
                await this.currentPlatform.saveMusicVolume(volume);
            } catch (err) {
                console.error(`[Platform] saveMusicVolume failed:`, err);
                throw err;
            }
        }

        /**
         * Start gameplay markup (Y GameplayAPI.start())
         * Signals to the platform that gameplay has started or resumed
         * Call when: new game starts, menu closes, game resumes
         * @returns {Promise<void>}
         */
        async startGameplay() {
            if (!this.initialized) {
                console.warn('[Platform] Cannot startGameplay - platform not initialized');
                return;
            }

            if (!this.currentPlatform.startGameplay) {
                // Platform doesn't support gameplay markup (e.g., web platform)
                return;
            }

            try {
                await this.currentPlatform.startGameplay();
            } catch (err) {
                console.error(`[Platform] startGameplay failed:`, err);
            }
        }

        /**
         * Stop gameplay markup (Y GameplayAPI.stop())
         * Signals to the platform that gameplay has stopped or paused
         * Call when: game ends, menu opens, game pauses
         * @returns {Promise<void>}
         */
        async stopGameplay() {
            if (!this.initialized) {
                console.warn('[Platform] Cannot stopGameplay - platform not initialized');
                return;
            }

            if (!this.currentPlatform.stopGameplay) {
                // Platform doesn't support gameplay markup (e.g., web platform)
                return;
            }

            try {
                await this.currentPlatform.stopGameplay();
            } catch (err) {
                console.error(`[Platform] stopGameplay failed:`, err);
            }
        }

        /**
         * Clear all user data from platform storage
         * For web: clears localStorage
         * For Y: clears cloud storage (player.setData and player.setStats)
         * @returns {Promise<{success: boolean, error?: string}>}
         */
        async clearAllData() {
            if (!this.initialized) {
                console.warn('[Platform] Cannot clear data - platform not initialized');
                return { success: false, error: 'Platform not initialized' };
            }

            if (!this.currentPlatform.clearAllData) {
                console.warn('[Platform] clearAllData not supported on this platform');
                return { success: false, error: 'Method not supported' };
            }

            try {
                return await this.currentPlatform.clearAllData();
            } catch (err) {
                console.error(`[Platform] clearAllData failed:`, err);
                return { success: false, error: err.message };
            }
        }

        /**
         * Show rewarded video ad
         * @param {object} callbacks - Callback functions: onOpen, onRewarded, onClose, onError
         * @returns {Promise<void>}
         */
        async showRewardedVideo(callbacks) {
            if (!this.initialized) {
                console.warn('[Platform] Cannot show rewarded video - platform not initialized');
                return;
            }

            if (!this.currentPlatform.showRewardedVideo) {
                console.warn('[Platform] showRewardedVideo not supported on this platform');
                return;
            }

            try {
                await this.currentPlatform.showRewardedVideo(callbacks);
            } catch (err) {
                console.error(`[Platform] showRewardedVideo failed:`, err);
            }
        }

        /**
         * Check if rewardable ads are available on this platform
         * @returns {boolean} True if the platform supports rewardable ads
         */
        isRewardedAdsAvailable() {
            if (!this.initialized) {
                console.warn('[Platform] Cannot check adverts availability - platform not initialized, returning false');
                return false;
            }

            if (!this.currentPlatform.isRewardedAdsAvailable) {
                console.warn('[Platform] isRewardedAdsAvailable not supported on this platform, returning false');
                return false;
            }

            try {
                return this.currentPlatform.isRewardedAdsAvailable();
            } catch (err) {
                console.error(`[Platform] isRewardedAdsAvailable failed:`, err);
                return false;
            }
        }

        /**
         * Signal that fullscreen mode has been entered
         * Dispatches cosmic:fullscreen:on event for viewport recalculation
         */
        signalFullscreenOn() {
            window.dispatchEvent(new CustomEvent('cosmic:fullscreen:on'));
            this._log('Fullscreen mode entered');
        }

        /**
         * Signal that fullscreen mode has been exited
         * Dispatches cosmic:fullscreen:off event for viewport recalculation
         */
        signalFullscreenOff() {
            window.dispatchEvent(new CustomEvent('cosmic:fullscreen:off'));
            this._log('Fullscreen mode exited');
        }

    }

    // Create global platform adapter instance
    window.Platform = new PlatformAdapter();

    // Auto-initialize on script load
    window.Platform._log(['Script loaded, readyState:', document.readyState]);
    
    // Stage 1: Base scripts loaded (i18n, utils, platformAdapter)
    if (window.__cosmic_loadingManager) {
        window.__cosmic_loadingManager.setStage(1);
    }
    
    if (document.readyState === 'loading') {
        window.Platform._log('DOM still loading, adding DOMContentLoaded listener');
        document.addEventListener('DOMContentLoaded', () => {
            window.Platform._log('DOMContentLoaded fired, calling Platform.init()');
            window.Platform.init().catch(err => {
                console.error('[Platform] Auto-initialization failed:', err);
            });
        });
    } else {
        // DOM already loaded, initialize immediately
        window.Platform._log('DOM already ready, initializing immediately');
        window.Platform.init().catch(err => {
            console.error('[Platform] Auto-initialization failed:', err);
        });
    }

})();
