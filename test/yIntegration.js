/**
 * Platform Integration Module (Yandex Games)
 * Handles Yandex Games SDK integration
 * This file is only included in Yandex-specific builds
 * 
 * Auto-initializes on load and provides clean API for SDK access
 */

class PlatformIntegration {
    constructor() {
        this.sdk = null;
        this.player = null;
        this.initialized = false;
        
        // ===== IN-MEMORY STATE CACHES =====
        // These caches prevent the "replace entire object" problem with Yandex APIs
        // By maintaining full state in memory, we can write complete objects on each save
        this.cachedStats = null;      // player.setStats() cache (maxScore, language, sound, etc.)
        this.cachedData = null;        // player.setData() cache (game saves)
        this.statsDirty = false;       // Flag: cachedStats has unsaved changes
        this.dataDirty = false;        // Flag: cachedData has unsaved changes
        
        // Write counters for periodic verification
        this.statsWriteCount = 0;
        this.dataWriteCount = 0;
        this.VERIFY_EVERY_N_WRITES = 10;  // Re-read from server every 10 successful writes
        
        // Rate limiting for save operations (player.setData - game saves)
        this.lastSaveTime = 0;
        this.MIN_SAVE_INTERVAL = 3050; // 3.05 seconds between saves
        this.pendingSave = null; // {timeout}
        
        // Stats debounce with priority queue (player.setStats - maxScore/tutorial/settings)
        this.STATS_DEBOUNCE_INTERVAL = 1050; // 1.05 seconds
        this.PRIORITY_SETTINGS = 0;  // Highest priority (settings changes)
        this.PRIORITY_TUTORIAL = 1;  // High priority (tutorial flags)
        this.PRIORITY_MAXSCORE = 2;  // Normal priority (max score updates)
        this.pendingStatsUpdate = null; // { priority, timestamp, timeout }
        this.lastStatsTime = 0;
        
        // Language mapping for numeric storage (player.setStats only accepts numbers)
        this.LANG_TO_NUM = { 'en': 0, 'ru': 1 };
        this.NUM_TO_LANG = { 0: 'en', 1: 'ru' };
        
        // Boolean mapping for numeric storage (player.setStats only accepts numbers)
        this.BOOL_TO_NUM = { false: 0, true: 1 };
        this.NUM_TO_BOOL = { 0: false, 1: true };
        
        // Tooltip size mapping for numeric storage (player.setStats only accepts numbers)
        this.TOOLTIP_SIZE_TO_NUM = { 'standard': 0, 'enlarged': 1 };
        this.NUM_TO_TOOLTIP_SIZE = { 0: 'standard', 1: 'enlarged' };
    }
    
    /**
     * Helper method for logging with debug system support
     * Provides consistent logging across the platform integration module.
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
            window.__cosic.flog('yIntegration', message);
        } else {
            console.log('[yIntegration]', ...args);
        }
    }
    
    /**
     * Initialize Yandex Games SDK
     * @returns {Promise<{success: boolean, reason?: string, error?: Error}>}
     */
    async init() {
        // Check if YaGames SDK is available
        if (typeof YaGames === 'undefined') {
            const msg = 'YaGames SDK not available (standalone mode)';
            this._log(msg);
            return { success: false, reason: 'SDK not loaded' };
        }
        
        try {
            this._log('Initializing Yandex SDK...');
            
            // Initialize the Yandex SDK
            this.sdk = await YaGames.init();
            
            // Initialize player module for cloud saves
            try {
                this.player = await this.sdk.getPlayer({ scopes: false });
                this._log('Yandex Player initialized');
            } catch (playerErr) {
                console.warn('[platform] Player initialization failed (cloud saves will not work):', playerErr);
                this.player = null;
            }
            
            this.initialized = true;
            
            // Store SDK in legacy global location for backward compatibility
            window.__cosmic_ysdk = this.sdk;
            
            // Initialize in-memory caches by reading from server
            await this._initializeCaches();
            
            // NOTE: Removed setupPauseResumeEvents() - game_api_pause/resume events 
            // not working as expected in our game architecture.
            // We handle gameplay markup manually via startGameplay()/stopGameplay() calls.
            
            this._log('Yandex SDK initialized successfully');
            
            // Log environment info if available
            if (this.sdk && this.sdk.environment) {
                this._log(['Environment:', this.sdk.environment]);
            }
            
            // Start monitoring fullscreen status changes
            // this._startFullscreenMonitoring();
            
            return { success: true };
            
        } catch (err) {
            console.error('[platform] Failed to initialize Yandex SDK:', err);
            this._log(['SDK initialization failed: ' + err.message]);
            return { success: false, error: err };
        }
    }
    
    /**
     * Initialize in-memory caches by reading from Yandex server
     * Called once during init() to populate cachedStats and cachedData
     * @private
     */
    async _initializeCaches() {
        if (!this.player) {
            this._log('[CACHE] Player not initialized, skipping cache initialization');
            this.cachedStats = {};
            this.cachedData = {};
            return;
        }

        try {
            // Initialize stats cache
            this.cachedStats = await this.player.getStats() || {};
            this._log(`[CACHE] Initialized stats cache with ${Object.keys(this.cachedStats).length} keys`);
        } catch (err) {
            console.warn('[CACHE] Failed to initialize stats cache:', err);
            this.cachedStats = {};
        }

        try {
            // Initialize data cache (get all keys - pass empty array to get everything)
            this.cachedData = await this.player.getData() || {};
            this._log(`[CACHE] Initialized data cache with ${Object.keys(this.cachedData).length} keys`);
        } catch (err) {
            console.warn('[CACHE] Failed to initialize data cache:', err);
            this.cachedData = {};
        }
    }

    /**
     * Check if a stats value should be written based on smart filtering rules
     * @param {string} key - The stat key
     * @param {any} newValue - The new value to write
     * @param {any} currentValue - The current cached value
     * @returns {boolean} True if should write, false if should skip
     * @private
     */
    _shouldWriteStat(key, newValue, currentValue) {
        // maxScore: Only increase (never decrease)
        if (key === 'maxScore') {
            const shouldWrite = newValue > (currentValue || 0);
            if (!shouldWrite) {
                this._log(`[FILTER] Skipped maxScore: ${newValue} not greater than ${currentValue || 0}`);
            }
            return shouldWrite;
        }
        
        // Lifetime stats - Cumulative: Always write (increment)
        if (key.startsWith('stats_') && (
            key.endsWith('_gamesPlayed') ||
            key.endsWith('_totalScore') ||
            key.endsWith('_totalTurns') ||
            key.endsWith('_totalMerges') ||
            key.endsWith('_totalBHEarned') ||
            key.endsWith('_totalBHUsed')
        )) {
            return true; // Always write cumulative stats
        }
        
        // Lifetime stats - Max: Only write if bigger
        if (key.startsWith('stats_') && (
            key.endsWith('_maxScore') ||
            key.endsWith('_maxChain') ||
            key.endsWith('_maxPointsPerTurn')
        )) {
            const shouldWrite = newValue > (currentValue || 0);
            if (!shouldWrite) {
                this._log(`[FILTER] Skipped ${key}: ${newValue} not greater than ${currentValue || 0}`);
            }
            return shouldWrite;
        }
        
        // Tutorial flags: Only set to true (never back to false)
        // Compare using boolean constants for consistency
        if (key.startsWith('tutorial_')) {
            const shouldWrite = newValue === this.BOOL_TO_NUM[true] && currentValue !== this.BOOL_TO_NUM[true];
            if (!shouldWrite) {
                this._log(`[FILTER] Skipped ${key}: already true or trying to set false`);
            }
            return shouldWrite;
        }
        
        // Settings (language, soundEnabled, tooltipSize, soundEffectsVolume, musicVolume): Always write (bidirectional)
        const settingsKeys = ['language', 'soundEnabled', 'tooltipSize', 'soundEffectsVolume', 'musicVolume'];
        if (settingsKeys.includes(key)) {
            return true;
        }
        
        // Timestamp metadata: Always write (for debugging/monitoring only)
        if (key === '_statsTimestamp') {
            return true;
        }
        
        // Unknown keys: write by default
        return true;
    }

    /**
     * Verify cache against server state and resync if needed
     * Called every N writes to detect drift (multi-device, network issues)
     * @param {string} cacheType - 'stats' or 'data'
     * @private
     */
    async _verifyAndResyncCache(cacheType) {
        if (!this.player) {
            return;
        }

        try {
            if (cacheType === 'stats') {
                const serverStats = await this.player.getStats() || {};
                
                // Compare critical keys
                const criticalKeys = ['maxScore', 'language', 'soundEnabled', 'tooltipSize'];
                let hasMismatch = false;
                
                for (const key of criticalKeys) {
                    if (this.cachedStats[key] !== serverStats[key]) {
                        this._log(`[VERIFY] Mismatch on ${key}: cache=${this.cachedStats[key]}, server=${serverStats[key]}`);
                        hasMismatch = true;
                    }
                }
                
                if (hasMismatch) {
                    // Server wins: overwrite cache
                    this.cachedStats = { ...serverStats };
                    this._log('[VERIFY] ⚠️ Stats cache resynced from server (server wins)');
                    
                    // Dispatch event for potential UI updates
                    window.dispatchEvent(new CustomEvent('cosmic:platform:statsResync', {
                        detail: { stats: this.cachedStats }
                    }));
                } else {
                    this._log('[VERIFY] ✅ Stats cache and server in sync');
                }
            } else if (cacheType === 'data') {
                const serverData = await this.player.getData() || {};
                
                // For data, just count keys to detect major discrepancies
                const cacheKeyCount = Object.keys(this.cachedData).length;
                const serverKeyCount = Object.keys(serverData).length;
                
                if (cacheKeyCount !== serverKeyCount) {
                    this._log(`[VERIFY] Data key count mismatch: cache=${cacheKeyCount}, server=${serverKeyCount}`);
                    // Server wins: overwrite cache
                    this.cachedData = { ...serverData };
                    this._log('[VERIFY] ⚠️ Data cache resynced from server (server wins)');
                } else {
                    this._log('[VERIFY] ✅ Data cache and server in sync');
                }
            }
        } catch (err) {
            console.error(`[VERIFY] Failed to verify ${cacheType} cache:`, err);
        }
    }
    
    /**
     * Save data to Yandex cloud storage with rate limiting
     * Uses in-memory cache to preserve all keys across updates
     * 
     * @param {string} key - Storage key
     * @param {any} data - Data to save (will be JSON serialized by SDK)
     * @param {boolean} immediate - If true, bypasses rate limiting and saves immediately
     * @returns {Promise<void>}
     */
    async save(key, data, immediate = false) {
        if (!this.isAvailable()) {
            throw new Error('Yandex SDK not initialized');
        }

        // Update cache immediately
        this.cachedData[key] = data;
        this.dataDirty = true;
        this._log(`[CACHE] Updated data cache key: ${key}`);

        const now = Date.now();
        const timeSinceLastSave = now - this.lastSaveTime;

        // If immediate save requested OR enough time has passed, save immediately
        if (immediate || timeSinceLastSave >= this.MIN_SAVE_INTERVAL) {
            if (immediate) {
                this._log(`Immediate save requested (bypassing rate limiting)`);
            }
            await this._performDataWrite();
            return;
        }

        // Too soon! Schedule save for when interval expires
        // If a save is already pending, cancel it (latest-wins strategy)
        if (this.pendingSave && this.pendingSave.timeout) {
            clearTimeout(this.pendingSave.timeout);
        }

        const delay = this.MIN_SAVE_INTERVAL - timeSinceLastSave;
        
        this._log(`Rate limiting: scheduling data write in ${delay}ms`);

        this.pendingSave = {
            timeout: setTimeout(async () => {
                await this._performDataWrite();
                this.pendingSave = null;
            }, delay)
        };
    }

    /**
     * Perform the actual data write operation to Yandex cloud
     * Writes the ENTIRE cachedData object to preserve all keys
     * @private
     */
    async _performDataWrite() {
        if (!this.player) {
            throw new Error('Yandex Player not initialized - cloud saves unavailable');
        }
        
        if (!this.dataDirty) {
            this._log('[DATA WRITE] Cache not dirty, skipping write');
            return;
        }
        
        try {
            // Write ENTIRE cache to preserve all keys
            await this.player.setData(
                { ...this.cachedData },  // Send complete cache
                true  // flush: true to send immediately
            );

            this.lastSaveTime = Date.now();
            this.dataDirty = false;
            this.dataWriteCount++;
            
            this._log(`[DATA WRITE] Saved to Yandex cloud (${Object.keys(this.cachedData).length} keys, write #${this.dataWriteCount})`);

            // Verify every N writes
            if (this.dataWriteCount % this.VERIFY_EVERY_N_WRITES === 0) {
                this._log(`[DATA WRITE] Verification checkpoint (write #${this.dataWriteCount})`);
                await this._verifyAndResyncCache('data');
            }

        } catch (err) {
            // Check for network-related errors
            const errorMessage = err.message || '';
            const isNetworkError = errorMessage.toLowerCase().includes('api request error') && 
                                 errorMessage.toLowerCase().includes('failed to fetch');
            
            if (isNetworkError) {
                this._log(`[DATA WRITE] Network error detected: No Internet connection`);
                throw new Error('NO_INTERNET_CONNECTION');
            }
            console.error(`[Yandex] Data write failed:`, err);
            
            // Keep dirty flag - will retry on next debounce
            // Dispatch event for future UI indicators
            window.dispatchEvent(new CustomEvent('cosmic:save:failed', {
                detail: { 
                    error: err.message, 
                    platform: 'yandex',
                    isRateLimit: err.code === 'RATE_LIMIT_EXCEEDED'
                }
            }));
            
            // Don't throw - allow game to continue, will retry later
        }
    }

    /**
     * Delete data key from Yandex cloud storage
     * Updates cache immediately and schedules server write
     * @param {string} key - Storage key to delete
     * @returns {Promise<void>}
     */
    async delete(key) {
        if (!this.isAvailable()) {
            throw new Error('Yandex SDK not initialized');
        }

        // Remove from cache immediately
        delete this.cachedData[key];
        this.dataDirty = true;
        this._log(`[CACHE] Removed data cache key: ${key}`);

        // Use immediate write to delete (responsive UX)
        await this._performDataWrite();
    }

    /**
     * DEPRECATED: Old immediate deletion method
     * Kept for reference but not used anymore
     * @private
     */
    async _performDelete(key) {
        if (!this.player) {
            throw new Error('Yandex Player not initialized - cloud saves unavailable');
        }
        
        try {
            // Use Yandex player.setData API to delete by setting key to null
            // Structure: { [key]: null }
            await this.player.setData({
                [key]: null
            }, true); // flush: true to send immediately

            this._log(`Deleted from Yandex cloud: ${key}`);

        } catch (err) {
            console.error(`[Yandex] Delete failed for key "${key}":`, err);
            
            // Dispatch event for future UI indicators
            window.dispatchEvent(new CustomEvent('cosmic:save:failed', {
                detail: { 
                    key, 
                    error: err.message, 
                    platform: 'yandex',
                    isRateLimit: err.code === 'RATE_LIMIT_EXCEEDED'
                }
            }));
            
            throw err;
        }
    }

    /**
     * Load data from Yandex cloud storage
     * Returns data from in-memory cache (fast, no network call)
     * @param {string} key - Storage key
     * @returns {Promise<any|null>} Loaded data or null if not found
     */
    async load(key) {
        if (!this.isAvailable()) {
            throw new Error('Yandex SDK not initialized');
        }
        
        // Return from cache (no network call needed)
        if (this.cachedData && key in this.cachedData) {
            this._log(`[CACHE] Loaded from cache: ${key}`);
            return this.cachedData[key];
        }

        this._log(`[CACHE] No data found in cache for key: ${key}`);
        return null;
    }
    
    /**
     * Check if platform SDK is available and initialized
     * @returns {boolean}
     */
    isAvailable() {
        return this.initialized && this.sdk !== null;
    }
    
    /**
     * Save numeric stats (uses Yandex player.setStats API)
     * Updates in-memory cache immediately and schedules debounced write
     * Implements smart filtering to prevent wasteful writes
     * @param {Object} stats - Object with key-value pairs where values are numbers
     * @param {number} priority - Write priority (0=settings/lifetime stats, 1=tutorial, 2=maxScore)
     * @returns {Promise<void>}
     */
    async setStats(stats, priority = this.PRIORITY_MAXSCORE) {
        if (!this.player) {
            throw new Error('Yandex Player not initialized - stats unavailable');
        }

        // Filter and update cache immediately
        const filteredStats = {};
        let hasUpdates = false;
        
        for (const [key, value] of Object.entries(stats)) {
            const currentValue = this.cachedStats[key];
            
            if (this._shouldWriteStat(key, value, currentValue)) {
                filteredStats[key] = value;
                this.cachedStats[key] = value;  // Update cache immediately
                hasUpdates = true;
                this._log(`[CACHE] Updated stats cache: ${key}=${value}`);
            }
        }
        
        if (!hasUpdates) {
            this._log('[FILTER] No stats updates passed filtering');
            return;
        }

        // Mark as dirty and use provided priority
        this.statsDirty = true;

        // Schedule debounced write with priority handling
        const update = {
            priority,
            timestamp: Date.now()
        };

        // Priority logic: Replace pending if new has higher priority or same priority
        if (!this.pendingStatsUpdate || priority <= this.pendingStatsUpdate.priority) {
            if (this.pendingStatsUpdate && priority < this.pendingStatsUpdate.priority) {
                const priorityName = priority === 0 ? 'settings/stats' : priority === 1 ? 'tutorial' : 'maxScore';
                this._log(`[STATS] ${priorityName} priority replacing pending update`);
            }
            
            this.pendingStatsUpdate = update;
            
            // Clear existing timeout
            if (update.timeout) {
                clearTimeout(update.timeout);
            }
            
            // Schedule debounced write
            this.pendingStatsUpdate.timeout = setTimeout(() => {
                this._performStatsWrite();
            }, this.STATS_DEBOUNCE_INTERVAL);
            
            const priorityName = priority === 0 ? 'settings/stats' : priority === 1 ? 'tutorial' : 'maxScore';
            this._log(`[STATS] Scheduled ${priorityName} write (${this.STATS_DEBOUNCE_INTERVAL}ms debounce)`);
        } else {
            const priorityName = priority === 0 ? 'settings/stats' : priority === 1 ? 'tutorial' : 'maxScore';
            this._log(`[STATS] Skipped ${priorityName} write (lower priority)`);
        }
    }

    /**
     * Internal: Perform the actual stats write to server
     * Writes the ENTIRE cachedStats object to preserve all keys
     * @private
     */
    async _performStatsWrite() {
        if (!this.pendingStatsUpdate) {
            return;
        }

        if (!this.statsDirty) {
            this._log('[STATS WRITE] Cache not dirty, skipping write');
            this.pendingStatsUpdate = null;
            return;
        }

        this.pendingStatsUpdate = null;

        try {
            // Add timestamp for debugging/monitoring (not used in logic)
            // Allows us to see when stats were last updated when inspecting server data
            const statsToWrite = {
                ...this.cachedStats,
                _statsTimestamp: Date.now()
            };
            
            // Write ENTIRE cache to preserve all keys
            await this.player.setStats(statsToWrite);
            
            this.lastStatsTime = Date.now();
            this.statsDirty = false;
            
            this.statsWriteCount++;
            
            this._log(`[STATS WRITE] Saved to Yandex (${Object.keys(this.cachedStats).length} keys, write #${this.statsWriteCount})`);

            // Verify every N writes
            if (this.statsWriteCount % this.VERIFY_EVERY_N_WRITES === 0) {
                this._log(`[STATS WRITE] Verification checkpoint (write #${this.statsWriteCount})`);
                await this._verifyAndResyncCache('stats');
            }
        } catch (err) {
            this._log(`[STATS WRITE] Failed: ${err.message}`);
            console.error(`[Yandex] Stats write failed:`, err);
            
            // Check for network-related errors
            const errorMessage = err.message || '';
            const isNetworkError = errorMessage.toLowerCase().includes('api request error') && 
                                 errorMessage.toLowerCase().includes('failed to fetch');
            
            if (isNetworkError) {
                this._log(`[STATS WRITE] Network error detected: No Internet connection`);
                throw new Error('NO_INTERNET_CONNECTION');
            }
            
            // Keep dirty flag - will retry on next debounce
        }
    }

    /**
     * Force immediate stats sync (bypasses debounce)
     * Used on game over, pause, or page unload
     */
    async forceStatsSyncNow() {
        if (this.pendingStatsUpdate) {
            if (this.pendingStatsUpdate.timeout) {
                clearTimeout(this.pendingStatsUpdate.timeout);
            }
            await this._performStatsWrite();
        }
    }

    /**
     * Get numeric stats
     * Returns data from in-memory cache (fast, no network call)
     * @param {Array<string>} keys - Array of stat keys to retrieve
     * @returns {Promise<Object>} Object with key-value pairs
     */
    async getStats(keys) {
        if (!this.player) {
            throw new Error('Yandex Player not initialized - stats unavailable');
        }

        try {
            // Return from cache (no network call needed)
            const result = {};
            
            if (keys && Array.isArray(keys)) {
                // Return specific keys (return 0 for missing keys instead of omitting)
                for (const key of keys) {
                    if (key in this.cachedStats) {
                        result[key] = this.cachedStats[key];
                    } else {
                        // Key doesn't exist yet - return undefined (will be treated as 0 by caller)
                        result[key] = undefined;
                    }
                }
            } else {
                // Return all stats
                Object.assign(result, this.cachedStats);
            }
            
            this._log(`[CACHE] Loaded ${Object.keys(result).length} stats from cache`);
            return result;
        } catch (err) {
            console.error(`[Yandex] getStats failed:`, err);
            throw err;
        }
    }



    /**
     * Get maximum score from Yandex cloud (checks stats cache AND all cloud saves)
     * This is Yandex-specific logic: we need to check multiple sources
     * @returns {Promise<number>} The maximum score, or 0 if none found
     */
    async getMaxScore() {
        if (!this.player) {
            this._log('Yandex Player not initialized - returning 0 for maxScore');
            return 0;
        }

        let maxScore = 0;

        try {
            // 1. Check cachedStats for maxScore
            if (typeof this.cachedStats.maxScore === 'number') {
                maxScore = this.cachedStats.maxScore;
                this._log(`[CACHE] Found maxScore in stats cache: ${maxScore}`);
            }

            // 2. Check all cloud saves in cachedData for highest score
            try {
                for (const [key, value] of Object.entries(this.cachedData)) {
                    // Check if this is a game save (has payload.score)
                    if (value && value.payload && typeof value.payload.score === 'number') {
                        if (value.payload.score > maxScore) {
                            maxScore = value.payload.score;
                            this._log(`[CACHE] Found higher score in ${key}: ${value.payload.score}`);
                        }
                    }
                }
            } catch (savesErr) {
                console.warn('[Yandex] Failed to check cached saves for maxScore:', savesErr);
            }

            this._log(`[CACHE] Final maxScore: ${maxScore}`);
            return maxScore;

        } catch (err) {
            console.error('[Yandex] getMaxScore failed:', err);
            return 0;
        }
    }

    /**
     * Save maximum score to Yandex cloud using setStats
     * Uses smart filtering - only saves if score is higher than current
     * @param {number} score - The score to save
     * @returns {Promise<void>}
     */
    async saveMaxScore(score) {
        if (!this.player) {
            throw new Error('Yandex Player not initialized - cannot save maxScore');
        }

        if (typeof score !== 'number' || isNaN(score) || score < 0 || score > Number.MAX_SAFE_INTEGER) {
            throw new Error(`Invalid score value: ${score}`);
        }

        // Use setStats - it will filter automatically (only saves if higher)
        await this.setStats({ maxScore: score });
        this._log(`[maxScore] Queued maxScore save: ${score}`);
    }

    /**
     * Get game mode unlock animations played state from Yandex cloud (from cachedStats)
     * @returns {Promise<Object>} Object with mode keys and boolean values indicating if unlock animation was played
     */
    async getUnlockAnimationsPlayed() {
        if (!this.player) {
            this._log('Yandex Player not initialized - returning empty unlock animations state');
            return {};
        }

        try {
            // Convert numeric values (1/0) from cache back to boolean
            const state = {};
            const unlockKeys = [
                'unlockAnim_chill',
                'unlockAnim_stellar-cleanup'
            ];

            unlockKeys.forEach(key => {
                const modeName = key.replace('unlockAnim_', '');
                if (typeof this.cachedStats[key] === 'number') {
                    state[modeName] = this.NUM_TO_BOOL[this.cachedStats[key]] ?? false;
                }
            });

            this._log(`[CACHE] Loaded unlock animations state from cache: ${Object.keys(state).length} modes`);
            return state;
        } catch (err) {
            console.error('[Yandex] getUnlockAnimationsPlayed failed:', err);
            return {};
        }
    }

    /**
     * Mark a game mode's unlock animation as played
     * @param {string} mode - Game mode identifier ('chill', 'stellar-cleanup')
     * @returns {Promise<void>}
     */
    async setUnlockAnimationPlayed(mode) {
        if (!this.player) {
            throw new Error('Yandex Player not initialized - cannot save unlock animation state');
        }

        // Convert to stats format: unlockAnim_<mode> = 1 (true)
        const statsData = {};
        statsData[`unlockAnim_${mode}`] = 1;

        // Use setStats with tutorial priority (high priority)
        await this.setStats(statsData, this.PRIORITY_TUTORIAL);
        this._log(`Scheduled unlock animation state save for mode: ${mode}`);
    }

    /**
     * Get tutorial state from Yandex cloud (from cachedStats)
     * @returns {Promise<Object>} Tutorial state object with boolean flags
     */
    async getTutorialState() {
        if (!this.player) {
            this._log('Yandex Player not initialized - returning empty tutorial state');
            return {};
        }

        try {
            // Convert numeric values (1/0) from cache back to boolean
            const state = {};
            const tutorialKeys = [
                'tutorial_gameIntro',
                'tutorial_blackHoleIntro',
                'tutorial_gravityDrill',
                'tutorial_stellarDestabilizer',
                'tutorial_wormhole',
                'tutorial_chillMode',
                'tutorial_stellarCleanup',
                'tutorial_queueInteractions',
                'tutorial_saveTutorial'
            ];

            tutorialKeys.forEach(key => {
                const tutorialName = key.replace('tutorial_', '');
                if (typeof this.cachedStats[key] === 'number') {
                    state[tutorialName] = this.NUM_TO_BOOL[this.cachedStats[key]] ?? false;
                }
            });

            this._log(`[CACHE] Loaded tutorial state from cache: ${Object.keys(state).length} flags`);
            return state;
        } catch (err) {
            console.error('[Yandex] getTutorialState failed:', err);
            return {};
        }
    }

    /**
     * Save tutorial state to Yandex cloud using setStats
     * Uses smart filtering - only saves true flags (never saves false)
     * @param {Object} state - Tutorial state object with boolean flags
     * @returns {Promise<void>}
     */
    async saveTutorialState(state) {
        if (!this.player) {
            throw new Error('Yandex Player not initialized - cannot save tutorial state');
        }

        // Convert boolean states to 1/0 for Yandex stats API
        const statsData = {};
        for (const [key, value] of Object.entries(state)) {
            statsData[`tutorial_${key}`] = this.BOOL_TO_NUM[value] ?? 0;
        }

        // Use setStats - it will filter automatically (only saves true flags)
        await this.setStats(statsData);
        this._log(`Scheduled tutorial state save to Yandex cloud: ${Object.keys(state).length} flags`);
    }

    /**
     * Get user's preferred language
     * Priority: 1) saved preference in cachedStats, 2) ysdk.environment.i18n.lang, 3) 'en'
     * @returns {Promise<string>} Language code ('en', 'ru', etc.)
     */
    async getLanguage() {
        try {
            // PRIORITY 1: Check saved preference from cachedStats (user explicitly chose this)
            if (this.player && typeof this.cachedStats.language === 'number') {
                if (this.cachedStats.language in this.NUM_TO_LANG) {
                    const savedLang = this.NUM_TO_LANG[this.cachedStats.language];
                    this._log(`[getLanguage] ✅ Using saved preference from cache: ${savedLang} [HIGHEST PRIORITY]`);
                    return savedLang;
                } else {
                    this._log(`[getLanguage] ⚠️ Language number ${this.cachedStats.language} not in NUM_TO_LANG mapping`);
                }
            }
            
            // PRIORITY 2: Check Yandex SDK environment for interface language (fallback for new users)
            if (this.sdk && this.sdk.environment && this.sdk.environment.i18n && this.sdk.environment.i18n.lang) {
                const yandexLang = this.sdk.environment.i18n.lang.toLowerCase();
                
                // Extract base language code (e.g., 'tr' from 'tr-TR')
                const baseLang = yandexLang.split('-')[0];
                this._log(`[getLanguage] 📱 Using Yandex environment language: ${baseLang} [FALLBACK]`);
                return baseLang;
            }
            
            // PRIORITY 3: Default to English as absolute fallback
            this._log('[getLanguage] 🌍 No language found, defaulting to en [LAST RESORT]');
            return 'en';
        } catch (err) {
            console.error('[Yandex] getLanguage failed:', err);
            return 'en';
        }
    }

    /**
     * Save user's language preference to Yandex cloud
     * Converts language code to number and queues for player.setStats() with HIGH priority
     * @param {string} lang - Language code ('en', 'ru', etc.)
     * @returns {Promise<void>}
     */
    async saveLanguage(lang) {
        this._log(`[saveLanguage] 💾 Request to save language: ${lang}`);
        
        if (!this.player) {
            throw new Error('Yandex Player not initialized - cannot save language');
        }

        // Convert language code to number for Yandex stats API
        const langNum = this.LANG_TO_NUM[lang];
        if (typeof langNum !== 'number') {
            this._log(`[saveLanguage] ❌ Unsupported language: ${lang}. Available: ${Object.keys(this.LANG_TO_NUM).join(', ')}`);
            throw new Error(`Unsupported language: ${lang}`);
        }

        this._log(`[saveLanguage] ✅ Converted ${lang} → ${langNum}, queuing for setStats`);
        
        // Use setStats with HIGH priority (settings)
        await this.setStats({ language: langNum });
        this._log(`[saveLanguage] 📤 Queued language save: ${lang} (${langNum})`);
    }

    /**
     * Get sound enabled state from cached stats
     * @returns {Promise<boolean>} True if sound is enabled
     */
    async getSoundEnabled() {
        try {
            if (!this.player) {
                this._log('[getSoundEnabled] Player not initialized, defaulting to true');
                return true;
            }

            if (typeof this.cachedStats.soundEnabled === 'number') {
                const enabled = this.NUM_TO_BOOL[this.cachedStats.soundEnabled] ?? true;
                this._log(`[getSoundEnabled] ✅ Loaded from cache: ${enabled}`);
                return enabled;
            }
            
            // Default to true (sound enabled)
            this._log('[getSoundEnabled] 🔊 No sound preference in cache, defaulting to true');
            return true;
        } catch (err) {
            console.error('[Yandex] getSoundEnabled failed:', err);
            return true;
        }
    }

    /**
     * Save sound enabled state to Yandex cloud
     * Converts boolean to 1/0 and queues for player.setStats() with HIGH priority
     * @param {boolean} enabled - True to enable sound
     * @returns {Promise<void>}
     */
    async saveSoundEnabled(enabled) {
        this._log(`[saveSoundEnabled] 💾 Request to save sound: ${enabled}`);
        
        if (!this.player) {
            throw new Error('Yandex Player not initialized - cannot save sound setting');
        }

        // Convert boolean to 1/0 for Yandex stats API
        const soundNum = this.BOOL_TO_NUM[enabled] ?? 0;
        this._log(`[saveSoundEnabled] ✅ Converted ${enabled} → ${soundNum}, queuing for setStats`);

        // Use setStats with HIGH priority (settings)
        await this.setStats({ soundEnabled: soundNum });
        this._log(`[saveSoundEnabled] 📤 Queued sound save: ${enabled} (${soundNum})`);
    }

    /**
     * Get tooltip size preference from cached stats
     * Converts number (0=standard, 1=enlarged) to string
     * @returns {Promise<string>} 'standard' or 'enlarged'
     */
    async getTooltipSize() {
        try {
            if (!this.player) {
                this._log('[getTooltipSize] Player not initialized, defaulting to standard');
                return 'standard';
            }

            if (typeof this.cachedStats.tooltipSize === 'number') {
                const size = this.NUM_TO_TOOLTIP_SIZE[this.cachedStats.tooltipSize] || 'enlarged';
                this._log(`[getTooltipSize] ✅ Loaded from cache: ${size}`);
                return size;
            }
            
            // Default to 'enlarged'
            this._log('[getTooltipSize] 📏 No tooltip size in cache, defaulting to enlarged');
            return 'enlarged';
        } catch (err) {
            console.error('[Yandex] getTooltipSize failed:', err);
            return 'enlarged';
        }
    }

    /**
     * Save tooltip size preference to Yandex cloud
     * Converts 'standard'/'enlarged' to 0/1 and queues for player.setStats() with HIGH priority
     * @param {string} size - 'standard' or 'enlarged'
     * @returns {Promise<void>}
     */
    async saveTooltipSize(size) {
        this._log(`[saveTooltipSize] 💾 Request to save tooltip size: ${size}`);
        
        if (!this.player) {
            throw new Error('Yandex Player not initialized - cannot save tooltip size setting');
        }

        // Convert 'standard'/'enlarged' to 0/1 for Yandex stats API
        const sizeNum = this.TOOLTIP_SIZE_TO_NUM[size] ?? 0;
        this._log(`[saveTooltipSize] ✅ Converted ${size} → ${sizeNum}, queuing for setStats`);

        // Use setStats with HIGH priority (settings)
        await this.setStats({ tooltipSize: sizeNum });
        this._log(`[saveTooltipSize] 📤 Queued tooltip size save: ${size} (${sizeNum})`);
    }

    /**
     * Get sound effects volume from cached stats
     * @returns {Promise<number>} Volume percentage (0-120)
     */
    async getSoundEffectsVolume() {
        try {
            if (!this.player) {
                this._log('[getSoundEffectsVolume] Player not initialized, defaulting to 100');
                return 100;
            }

            if (typeof this.cachedStats.soundEffectsVolume === 'number') {
                const volume = this.cachedStats.soundEffectsVolume;
                if (volume >= 0 && volume <= 120) {
                    this._log(`[getSoundEffectsVolume] ✅ Loaded from cache: ${volume}%`);
                    return volume;
                }
            }
            
            this._log('[getSoundEffectsVolume] 🔊 No sound effects volume in cache, defaulting to 100%');
            return 100;
        } catch (err) {
            console.error('[Yandex] getSoundEffectsVolume failed:', err);
            return 100;
        }
    }

    /**
     * Save sound effects volume to Yandex cloud
     * Stores integer directly (0-120) and queues for player.setStats() with HIGH priority
     * @param {number} volume - Volume percentage (0-120)
     * @returns {Promise<void>}
     */
    async saveSoundEffectsVolume(volume) {
        this._log(`[saveSoundEffectsVolume] 💾 Request to save sound effects volume: ${volume}%`);
        
        if (!this.player) {
            throw new Error('Yandex Player not initialized - cannot save sound effects volume');
        }

        if (typeof volume !== 'number' || volume < 0 || volume > 120) {
            throw new Error(`Invalid sound effects volume: ${volume}`);
        }

        this._log(`[saveSoundEffectsVolume] ✅ Queuing for setStats: ${volume}%`);
        await this.setStats({ soundEffectsVolume: volume });
        this._log(`[saveSoundEffectsVolume] 📤 Queued sound effects volume save: ${volume}%`);
    }

    /**
     * Get music volume from cached stats
     * @returns {Promise<number>} Volume percentage (0-120)
     */
    async getMusicVolume() {
        try {
            if (!this.player) {
                this._log('[getMusicVolume] Player not initialized, defaulting to 100');
                return 100;
            }

            if (typeof this.cachedStats.musicVolume === 'number') {
                const volume = this.cachedStats.musicVolume;
                if (volume >= 0 && volume <= 120) {
                    this._log(`[getMusicVolume] ✅ Loaded from cache: ${volume}%`);
                    return volume;
                }
            }
            
            this._log('[getMusicVolume] 🎵 No music volume in cache, defaulting to 100%');
            return 100;
        } catch (err) {
            console.error('[Yandex] getMusicVolume failed:', err);
            return 100;
        }
    }

    /**
     * Save music volume to Yandex cloud
     * Stores integer directly (0-120) and queues for player.setStats() with HIGH priority
     * @param {number} volume - Volume percentage (0-120)
     * @returns {Promise<void>}
     */
    async saveMusicVolume(volume) {
        this._log(`[saveMusicVolume] 💾 Request to save music volume: ${volume}%`);
        
        if (!this.player) {
            throw new Error('Yandex Player not initialized - cannot save music volume');
        }

        if (typeof volume !== 'number' || volume < 0 || volume > 120) {
            throw new Error(`Invalid music volume: ${volume}`);
        }

        this._log(`[saveMusicVolume] ✅ Queuing for setStats: ${volume}%`);
        await this.setStats({ musicVolume: volume });
        this._log(`[saveMusicVolume] 📤 Queued music volume save: ${volume}%`);
    }

    /**
     * Start gameplay markup (calls ysdk.features.GameplayAPI.start())
     * Call this when gameplay begins or resumes (new game, menu closes, etc.)
     * @returns {Promise<void>}
     */
    async startGameplay() {
        if (!this.sdk || !this.sdk.features || !this.sdk.features.GameplayAPI) {
            this._log('[startGameplay] ⚠️ SDK or GameplayAPI not available');
            return;
        }

        try {
            await this.sdk.features.GameplayAPI.start();
            this._log('[startGameplay] ▶️ Gameplay started (ysdk.features.GameplayAPI.start called)');
        } catch (err) {
            console.error('[Yandex] startGameplay failed:', err);
        }
    }

    /**
     * Stop gameplay markup (calls ysdk.features.GameplayAPI.stop())
     * Call this when gameplay stops or pauses (game ends, menu opens, etc.)
     * @returns {Promise<void>}
     */
    async stopGameplay() {
        if (!this.sdk || !this.sdk.features || !this.sdk.features.GameplayAPI) {
            this._log('[stopGameplay] ⚠️ SDK or GameplayAPI not available');
            return;
        }

        try {
            await this.sdk.features.GameplayAPI.stop();
            this._log('[stopGameplay] ⏸️ Gameplay stopped (ysdk.features.GameplayAPI.stop called)');
        } catch (err) {
            console.error('[Yandex] stopGameplay failed:', err);
        }
    }

    /**
     * Signal that game has finished loading and is ready to play
     * Call this when loading screen completes and start menu is shown
     * This should be called ONCE when the game is ready for user interaction
     * @returns {Promise<void>}
     */
    async signalGameReady() {
        if (!this.sdk || !this.sdk.features || !this.sdk.features.LoadingAPI) {
            this._log('[signalGameReady] ⚠️ SDK or LoadingAPI not available');
            return;
        }

        try {
            await this.sdk.features.LoadingAPI.ready();
            this._log('[signalGameReady] ✅ Game ready signal sent (ysdk.features.LoadingAPI.ready called)');
        } catch (err) {
            console.error('[Yandex] signalGameReady failed:', err);
        }
    }

    /**
     * Clear all user data from Yandex cloud storage
     * Clears both player.setData() (game saves) and player.setStats() (settings)
     * Also clears in-memory caches
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async clearAllData() {
        if (!this.player) {
            this._log('[clearAllData] ⚠️ Player not initialized');
            return { success: false, error: 'Player not initialized' };
        }

        try {
            this._log('[clearAllData] 🗑️ Clearing all Yandex cloud data and caches...');
            
            // Clear player.setData() (game saves)
            await this.player.setData({}, true); // flush: true to send immediately
            this.cachedData = {};  // Clear cache
            this.dataDirty = false;
            this._log('[clearAllData] ✅ Cleared player.setData() and data cache');
            
            // Clear player.setStats() (settings)
            await this.player.setStats({});
            this.cachedStats = {};  // Clear cache
            this.statsDirty = false;
            this._log('[clearAllData] ✅ Cleared player.setStats() and stats cache');
            
            // Clear max score using the global API (if available)
            if (window.__cosmic_maxScore && typeof window.__cosmic_maxScore.reset === 'function') {
                window.__cosmic_maxScore.reset();
                this._log('[clearAllData] ✅ Cleared max score tracker');
            }
            
            this._log('[clearAllData] ✅ All data and caches cleared successfully');
            return { success: true };
        } catch (err) {
            console.error('[Yandex] clearAllData failed:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * DISABLED: Setup game_api_pause and game_api_resume event handlers
     * These events are not working as expected in our game architecture.
     * We handle gameplay markup manually via startGameplay()/stopGameplay() calls.
     * 
     * Keeping the code commented for reference if needed in the future.
     * @private
     */
    /*
    setupPauseResumeEvents() {
        if (!this.sdk) {
            this._log('[setupPauseResumeEvents] ⚠️ SDK not available, skipping event setup');
            return;
        }

        // Handle platform-initiated pause (ads, tab switch, etc.)
        this.sdk.on('game_api_pause', () => {
            this._log('[game_api_pause] 🎬 Platform requested pause (ad/tab switch) - Yandex auto-called gameplay.stop()');
            
            // Pause our game (physics, sound)
            this.handleGameApiPause();
        });

        // Handle platform-initiated resume
        this.sdk.on('game_api_resume', () => {
            this._log('[game_api_resume] ▶️ Platform requested resume (ad closed/tab returned) - Yandex auto-called gameplay.start()');
            
            // Resume our game (physics, sound)
            this.handleGameApiResume();
        });

        this._log('[setupPauseResumeEvents] ✅ Subscribed to game_api_pause and game_api_resume events');
    }
    */

    /**
     * DISABLED: Handle game_api_pause event from platform
     * @private
     */
    /*
    handleGameApiPause() {
        try {
            // Pause game loop (use existing main menu pause function if available)
            if (window.__cosmic_mainmenu && typeof window.__cosmic_mainmenu.pauseGame === 'function') {
                // Use the main menu's pause function (stops physics, adds blur)
                window.__cosmic_mainmenu.pauseGame();
            } else {
                console.error('[yIntegration] mainmenu.pauseGame function not available - critical error');
            }
            }

            // Mute sound
            if (window.__cosmic_sound && typeof window.__cosmic_sound.setEnabled === 'function') {
                // Store previous sound state to restore later
                this._soundEnabledBeforePause = window.__cosmic_sound.enabled;
                window.__cosmic_sound.setEnabled(false);
            }

            this._log('[handleGameApiPause] ✅ Game paused (physics stopped, sound muted)');
        } catch (err) {
            console.error('[Yandex] handleGameApiPause failed:', err);
        }
    }
    */

    /**
     * DISABLED: Handle game_api_resume event from platform
     * @private
     */
    /*
    handleGameApiResume() {
        try {
            // Resume game loop (use existing main menu resume function if available)
            if (window.__cosmic_mainmenu && typeof window.__cosmic_mainmenu.resumeGame === 'function') {
                // Use the main menu's resume function (restarts physics, removes blur)
                window.__cosmic_mainmenu.resumeGame();
            } else {
                console.error('[yIntegration] mainmenu.resumeGame function not available - critical error');
            }
            }

            // Restore sound to previous state
            if (window.__cosmic_sound && typeof window.__cosmic_sound.setEnabled === 'function') {
                // Restore sound state (use stored state or default to true)
                const shouldEnableSound = this._soundEnabledBeforePause !== undefined 
                    ? this._soundEnabledBeforePause 
                    : true;
                window.__cosmic_sound.setEnabled(shouldEnableSound);
                delete this._soundEnabledBeforePause; // Clean up
            }

            this._log('[handleGameApiResume] ✅ Game resumed (physics restarted, sound restored)');
        } catch (err) {
            console.error('[Yandex] handleGameApiResume failed:', err);
        }
    }
    */
    
    /**
     * Check if rewardable ads are available on this platform
     * @returns {boolean} True if Yandex platform supports rewardable ads
     */
    isRewardedAdsAvailable() {
        // Yandex Games platform supports rewardable ads
        return true;
    }

    /**
     * Show rewarded video ad using Yandex SDK
     * @param {object} callbacks - Callback functions: onOpen, onRewarded, onClose, onError
     * @returns {Promise<void>}
     */
    async showRewardedVideo(callbacks) {
        if (!this.sdk || !this.sdk.adv || !this.sdk.adv.showRewardedVideo) {
            console.warn('[Yandex] showRewardedVideo not available');
            if (callbacks.onError) {
                callbacks.onError(new Error('SDK not available'));
            }
            return;
        }

        let wasRewarded = false;

        try {
            await this.sdk.adv.showRewardedVideo({
                callbacks: {
                    onOpen: () => {
                        this._log('Rewarded video opened', { always: true });
                        if (callbacks.onOpen) {
                            callbacks.onOpen();
                        }
                    },
                    onRewarded: () => {
                        wasRewarded = true;
                        this._log('Rewarded video completed successfully', { always: true });
                        if (callbacks.onRewarded) {
                            callbacks.onRewarded();
                        }
                    },
                    onCancel: () => {
                        console.warn('[Yandex] Rewarded video cancelled (player closed early)');
                        // onCancel indicates failure, but we'll handle it in onClose
                    },
                    onClose: () => {
                        if (!wasRewarded) {
                            this._log('Rewarded video closed without reward', { always: true });
                            if (callbacks.onClose) {
                                callbacks.onClose();
                            }
                        } else {
                            this._log('Rewarded video closed after successful reward');
                        }
                    },
                    onError: (error) => {
                        console.warn('[Yandex] Rewarded video error:', error);
                        if (callbacks.onError) {
                            callbacks.onError(error);
                        }
                    }
                }
            });
        } catch (err) {
            console.warn('[Yandex] Failed to show rewarded video:', err);
            if (callbacks.onError) {
                callbacks.onError(err);
            }
        }
    }

    /**
     * Start monitoring fullscreen status changes
     * Polls Yandex SDK fullscreen status and signals platform adapter
     */
    _startFullscreenMonitoring() {
        if (!this.sdk?.screen?.fullscreen) {
            this._log('Fullscreen API not available');
            return;
        }

        let lastStatus = this.sdk.screen.fullscreen.status;

        this.fullscreenCheckInterval = setInterval(() => {
            const currentStatus = this.sdk.screen.fullscreen.status;
            if (currentStatus !== lastStatus) {
                lastStatus = currentStatus;
                this._log(`Fullscreen status changed to: ${currentStatus}`);

                // Call platform adapter methods
                if (currentStatus === this.sdk.screen.fullscreen.STATUS_ON) {
                    window.Platform.signalFullscreenOn();
                } else {
                    window.Platform.signalFullscreenOff();
                }
            }
        }, 200);
    }

    /**
     * Check if this is the player's first session
     * First session is determined by: maxScore === 0 AND no saves exist
     * @returns {Promise<boolean>} True if this is the first session
     */
    async isFirstSession() {
        try {
            // Check maxScore from cached stats
            const maxScore = this.cachedStats.maxScore || 0;
            if (maxScore > 0) {
                this._log('[isFirstSession] Not first session: maxScore > 0');
                return false;
            }

            // Check for any saves in cached data
            const saveKeys = Object.keys(this.cachedData);
            const hasSaves = saveKeys.some(key => 
                key.startsWith('stellar-merge-save-') || 
                key.startsWith('stellarMerge_save_')
            );

            if (hasSaves) {
                this._log('[isFirstSession] Not first session: found saves in cached data');
                return false;
            }

            this._log('[isFirstSession] First session detected: maxScore = 0 and no saves found');
            return true;
        } catch (err) {
            console.error('[Yandex] isFirstSession failed:', err);
            return false;
        }
    }

}

// Create global instance
window.__cosmic_platform = new PlatformIntegration();

// Auto-initialize on load
window.__cosmic_platform.init()
    .then(result => {
        if (!result.success) {
            console.log('[platform] SDK initialization skipped:', result.reason || 'Unknown reason');
        }
    })
    .catch(err => {
        console.error('[platform] Unexpected error during auto-initialization:', err);
    });
