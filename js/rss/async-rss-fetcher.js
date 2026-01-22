/**
 * Async RSS Fetcher - Enhanced RSS fetching with timeouts, caching, and fallbacks
 * Implements smart loading strategies and graceful degradation
 */

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {always:true}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('rss-fetcher', message, options);
    } else {
        // Fallback if debug.js not loaded yet
        console.log('[rss-fetcher]', message);
    }
}

// Configuration
const CACHE_DURATION = headlineScoringConfig?.rssConfig?.cacheTimeout || 300000; // Cache duration from config, default 5 minutes
const MAX_CONCURRENT_REQUESTS = (() => {
    const configValue = rssFetchingConfig?.maxConcurrentRequests;
    if (configValue === undefined) {
        console.warn('⚠️ RSS fetching config not available, falling back to default max concurrent requests of 3');
        return 3;
    }
    return configValue;
})(); // Maximum concurrent requests to avoid rate limiting

// Cache for headlines to avoid repeated API calls
let headlineCache = {
    data: null,
    timestamp: null,
    isValid: function() {
        return this.data && this.timestamp && 
               (Date.now() - this.timestamp) < CACHE_DURATION;
    },
    set: function(data) {
        this.data = data;
        this.timestamp = Date.now();
        _log(`💾 Cached ${data.length} headlines for ${CACHE_DURATION/1000} seconds`);
    },
    get: function() {
        if (this.isValid()) {
            _log(`🎯 Using cached headlines (${this.data.length} items)`);
            return this.data;
        }
        return null;
    },
    clear: function() {
        this.data = null;
        this.timestamp = null;
        _log('🗑️ Headline cache cleared');
    }
};

// Loading state management
let loadingState = {
    isLoading: false,
    startTime: null,
    timeoutId: null,
    showingAnimation: false
};

/**
 * Fetches headlines with timeout and fallback mechanisms
 * @param {boolean} forceRefresh - Force refresh even if cache is valid
 * @returns {Promise<Array>} Array of headlines
 */
async function fetchHeadlinesWithFallback(forceRefresh = false) {
    _log('🚀 Starting headline fetch process...');
    
    // Check cache first (unless forced refresh)
    if (!forceRefresh) {
        // For now, we'll check cache per source later in the fetch process
        // The global cache concept is replaced by per-source caching
        _log('Cache check will be performed per source during fetch');
    } else {
        _log('🔄 Force refresh requested');
    }
    
    // Start loading process
    startLoadingProcess();
    
    try {
        // Try to fetch from RSS sources
        _log('📡 Attempting to fetch headlines from RSS sources...');
        const rssHeadlines = await fetchFromRSSWithTimeout(forceRefresh);
        
        if (rssHeadlines && rssHeadlines.length > 0) {
            _log(`✅ Successfully fetched ${rssHeadlines.length} headlines from RSS`);
            // Headlines are now cached per source in fetchFromRSSSourcesSequentially
            stopLoadingProcess();
            return rssHeadlines;
        }
        
        console.warn('⚠️ FALLBACK TO MOCK: RSS sources returned 0 headlines. Possible causes:');
        console.warn('  - All RSS feeds are currently unreachable or returning empty responses');
        console.warn('  - RSS feeds may be rate-limiting or blocking requests');
        console.warn('  - Network connectivity issues preventing RSS access');
        console.warn('  - All headlines were filtered out during processing');
        _log('⚠️ RSS fetch returned no headlines, falling back to mock data');
        
    } catch (error) {
        // This should no longer happen since fetchFromRSSWithTimeout resolves instead of rejects
        console.error('❌ Unexpected error in RSS fetch (should not happen):', error);
        _log('🔄 Unexpected error, falling back to mock data');
    }
    
    // Fallback to mock headlines
    stopLoadingProcess();
    const mockHeadlinesWithMetadata = englishMockHeadlines.map(headline => ({
        ...headline,
        source: 'mock',
        sourceName: 'Mock Data',
        category: 'fallback',
        pubDate: new Date().toISOString()
    }));
    
    _log(`📋 Using ${mockHeadlinesWithMetadata.length} mock headlines as fallback`);
    return mockHeadlinesWithMetadata;
}

/**
 * Fetches from RSS sources with controlled concurrency
 * @returns {Promise<Array>} Headlines from RSS
 */
async function fetchFromRSSWithTimeout(forceRefresh = false) {
    // Removed timeout - let the process complete naturally
    // Individual RSS fetches will timeout via browser's fetch if needed
    _log(`🚀 Starting RSS fetch without global timeout...${forceRefresh ? ' (force refresh)' : ''}`);
    return await fetchFromRSSSourcesSequentially(forceRefresh);
}

// Cache for validated sources to avoid re-validation
let validatedSourcesCache = null;

/**
 * Gets the appropriate RSS sources based on RSS language configuration
 * @returns {Array} Array of RSS source objects
 */
function getRSSSourcesForCurrentLanguage() {
    // Run integrity checks once and cache results
    if (!validatedSourcesCache && typeof window.SettingsIntegrityChecker !== 'undefined') {
        _log('🔍 Running initial settings integrity validation...');
        validatedSourcesCache = window.SettingsIntegrityChecker.validateAllRSSSources();
    }

    // Get current RSS language from centralized i18n system
    const rssLanguage = window.i18n.getCurrentRSSLanguage();
    _log(`📡 RSS language: ${rssLanguage}`);
    
    // Return Russian sources if language is Russian
    if (rssLanguage === 'ru') {
        const sources = validatedSourcesCache?.russianSources || russianRssNewsSources || [];
        _log(`🇷🇺 Using Russian RSS sources (${sources.length} sources)`);
        return sources;
    }
    
    // Default to English sources
    const sources = validatedSourcesCache?.englishSources || englishRssNewsSources || [];
    _log(`🇺🇸 Using English RSS sources (${sources.length} sources)`);
    return sources;
}

/**
 * Fetches from all RSS sources with controlled concurrency
 * @returns {Promise<Array>} Combined headlines from working sources
 */
async function fetchFromRSSSourcesSequentially(forceRefresh = false) {
    // Apply fetch delay if configured (for debugging)
    const fetchDelay = headlineScoringConfig?.rssConfig?.fetchDelay || 0;
    if (fetchDelay > 0) {
        _log(`⏳ Waiting ${fetchDelay}ms before starting RSS fetch (debug delay)`);
        await new Promise(resolve => setTimeout(resolve, fetchDelay));
    }

    // Get appropriate RSS sources based on current language
    const currentRSSSources = getRSSSourcesForCurrentLanguage();

    // Determine language for article count configuration using centralized i18n logic
    const rssLanguage = window.i18n.getCurrentRSSLanguage();
    
    // Get articles per source from config, with fallback
    let articlesPerSource = rssFetchingConfig?.articlesPerSource?.[rssLanguage];
    if (articlesPerSource === undefined) {
        articlesPerSource = rssLanguage === 'ru' ? 15 : 5; // Fallback values
        console.warn(`⚠️ RSS fetching config not available for articles per source (${rssLanguage}), falling back to ${articlesPerSource} articles per source`);
    }
    _log(`📊 Fetching ${articlesPerSource} articles per source for ${rssLanguage.toUpperCase()}`);

    const batchDelay = rssFetchingConfig?.batchDelayMs;
    if (batchDelay === undefined) {
        console.warn('⚠️ RSS fetching config not available, falling back to default batch delay of 10ms');
    }
    _log(`🚀 Fetching from ${currentRSSSources.length} RSS sources with max ${MAX_CONCURRENT_REQUESTS} concurrent requests and ${batchDelay || 10}ms batch delay...`);

    const workingSources = [];
    const failedSources = [];
    const allHeadlines = [];

    // Process sources in batches to respect concurrency limit
    for (let i = 0; i < currentRSSSources.length; i += MAX_CONCURRENT_REQUESTS) {
        const batch = currentRSSSources.slice(i, i + MAX_CONCURRENT_REQUESTS);
        _log(`📦 Processing batch ${Math.floor(i / MAX_CONCURRENT_REQUESTS) + 1}/${Math.ceil(currentRSSSources.length / MAX_CONCURRENT_REQUESTS)} (${batch.length} sources)`);

        // Create promises for this batch
        const batchPromises = batch.map(async (source, batchIndex) => {
            const globalIndex = i + batchIndex;
            _log(`📡 Starting fetch from source ${globalIndex + 1}/${currentRSSSources.length}: ${source.name}`);

            try {
                // Check if we have valid cached headlines for this source (skip if force refresh)
                if (!forceRefresh && typeof Platform !== 'undefined' && Platform.isCacheExpired) {
                    const isExpired = await Platform.isCacheExpired(source.name);
                    if (!isExpired) {
                        _log(`🎯 Using cached headlines for ${source.name}`);
                        const cachedHeadlines = await Platform.loadCachedHeadlines(source.name);
                        if (cachedHeadlines && cachedHeadlines.length > 0) {
                            cachedHeadlines.forEach(headline => {
                                headline.sourceName = source.name;
                                headline.category = source.category;
                            });
                            workingSources.push(source.name);
                            _log(`✅ ${source.name}: Loaded ${cachedHeadlines.length} headlines from cache`);
                            return cachedHeadlines;
                        }
                    }
                }

                // No valid cache, fetch from RSS
                const headlines = await RSSParser.fetchLatestHeadlines(source.url, articlesPerSource, rssLanguage);

                if (headlines && headlines.length > 0) {
                    headlines.forEach(headline => {
                        headline.sourceName = source.name;
                        headline.category = source.category;
                    });

                    // Cache the headlines for this source
                    if (typeof Platform !== 'undefined' && Platform.cacheHeadlines) {
                        await Platform.cacheHeadlines(source.name, headlines);
                        _log(`💾 Cached ${headlines.length} headlines for ${source.name}`);
                    }

                    workingSources.push(source.name);
                    _log(`✅ ${source.name}: Successfully fetched ${headlines.length} headlines`);
                    return headlines;
                } else {
                    failedSources.push(source.name);
                    _log(`⚠️ ${source.name}: No headlines returned`);
                    return [];
                }

            } catch (error) {
                failedSources.push(source.name);
                console.error(`❌ ${source.name}: Failed with error:`, error.message || error);
                return [];
            }
        });

        // Wait for this batch to complete before starting the next
        _log(`⏳ Waiting for batch to complete...`);
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(headlines => {
            allHeadlines.push(...headlines);
        });

        // Add delay between batches to avoid rate limiting (except for the last batch)
        if (i + MAX_CONCURRENT_REQUESTS < currentRSSSources.length) {
            const delay = rssFetchingConfig?.batchDelayMs;
            if (delay === undefined) {
                console.warn('⚠️ RSS fetching config not available, falling back to default batch delay of 10ms');
            }
            await new Promise(resolve => setTimeout(resolve, delay || 10));
            _log(`⏳ Waiting ${delay || 10}ms before next batch to avoid rate limiting`);
        }
    }

    // Summary
    _log(`📊 RSS Fetch Summary:`);
    _log(`✅ Working sources (${workingSources.length}): ${workingSources.join(', ')}`);
    _log(`❌ Failed sources (${failedSources.length}): ${failedSources.join(', ')}`);

    // Remove duplicates
    const uniqueHeadlines = RSSParser.removeDuplicateHeadlines(allHeadlines);
    _log(`📰 Total unique headlines from RSS: ${uniqueHeadlines.length}`);

    // If we got at least some headlines, consider it a success
    if (uniqueHeadlines.length > 0) {
        _log(`🎉 Successfully fetched headlines from ${workingSources.length}/${currentRSSSources.length} sources with controlled concurrency`);
    }
    
    return uniqueHeadlines;
}

/**
 * Starts the loading process and manages UI state
 */
function startLoadingProcess() {
    loadingState.isLoading = true;
    loadingState.startTime = Date.now();
    loadingState.showingAnimation = false;
    
    // Use configurable delay from data.js or fallback to 300ms
    const loadingDelay = headlineScoringConfig?.rssConfig?.loadingAnimationDelay || 300;
    
    // Show loading animation after a delay if still loading
    loadingState.timeoutId = setTimeout(() => {
        if (loadingState.isLoading) {
            showLoadingAnimation();
            _log(`🎭 Loading animation triggered after ${loadingDelay}ms delay`);
        }
    }, loadingDelay);
    
    _log(`⏳ Loading process started with ${loadingDelay}ms delay...`);
}

/**
 * Stops the loading process and cleans up
 */
function stopLoadingProcess() {
    const duration = loadingState.startTime ? Date.now() - loadingState.startTime : 0;
    
    loadingState.isLoading = false;
    loadingState.startTime = null;
    
    if (loadingState.timeoutId) {
        clearTimeout(loadingState.timeoutId);
        loadingState.timeoutId = null;
    }
    
    if (loadingState.showingAnimation) {
        hideLoadingAnimation();
    }
    
    _log(`✅ Loading process completed in ${duration}ms`);
}

/**
 * Shows loading animation in the UI
 */
function showLoadingAnimation() {
    if (loadingState.showingAnimation) return;
    
    loadingState.showingAnimation = true;
    _log('🎭 Showing loading animation...');

    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'rss-loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text">${t('loading.fetchingHeadlines')}</div>
            <div class="loading-subtext">${t('loading.fetchingSubtext')}</div>
        </div>
    `;

    document.body.appendChild(overlay);
}

/**
 * Hides loading animation from the UI
 */
function hideLoadingAnimation() {
    if (!loadingState.showingAnimation) return;
    
    loadingState.showingAnimation = false;
    _log('🎭 Hiding loading animation...');
    
    const overlay = document.getElementById('rss-loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Gets current loading state information
 * @returns {Object} Loading state details
 */
function getLoadingState() {
    return {
        isLoading: loadingState.isLoading,
        showingAnimation: loadingState.showingAnimation,
        duration: loadingState.startTime ? Date.now() - loadingState.startTime : 0,
        cacheValid: headlineCache.isValid(),
        cacheAge: headlineCache.timestamp ? Date.now() - headlineCache.timestamp : null
    };
}

/**
 * Forces a cache refresh
 * @returns {Promise<Array>} Fresh headlines
 */
async function refreshHeadlines() {
    _log('🔄 Forcing headline refresh...');
    headlineCache.clear();
    return await fetchHeadlinesWithFallback(true);
}

/**
 * Gets cache statistics for debugging
 * @returns {Object} Cache information
 */
function getCacheInfo() {
    return {
        hasData: !!headlineCache.data,
        itemCount: headlineCache.data ? headlineCache.data.length : 0,
        timestamp: headlineCache.timestamp,
        age: headlineCache.timestamp ? Date.now() - headlineCache.timestamp : null,
        isValid: headlineCache.isValid(),
        expiresIn: headlineCache.timestamp ? 
            Math.max(0, CACHE_DURATION - (Date.now() - headlineCache.timestamp)) : 0
    };
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.AsyncRSSFetcher = {
        fetchHeadlinesWithFallback,
        refreshHeadlines,
        getLoadingState,
        getCacheInfo,
        showLoadingAnimation,
        hideLoadingAnimation,
        CACHE_DURATION
    };
}

})();
