/**
 * Async RSS Fetcher - Enhanced RSS fetching with timeouts, caching, and fallbacks
 * Implements smart loading strategies and graceful degradation
 */

// Configuration
const FETCH_TIMEOUT = 10000; // 10 seconds - increased for rate limiting
const CACHE_DURATION = 300000; // 5 minutes in milliseconds
const MAX_CONCURRENT_REQUESTS = 1; // Only 1 concurrent request to avoid rate limiting

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
        console.log(`💾 Cached ${data.length} headlines for ${CACHE_DURATION/1000} seconds`);
    },
    get: function() {
        if (this.isValid()) {
            console.log(`🎯 Using cached headlines (${this.data.length} items)`);
            return this.data;
        }
        return null;
    },
    clear: function() {
        this.data = null;
        this.timestamp = null;
        console.log('🗑️ Headline cache cleared');
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
    console.log('🚀 Starting headline fetch process...');
    
    // Check cache first (unless forced refresh)
    if (!forceRefresh) {
        const cachedHeadlines = headlineCache.get();
        if (cachedHeadlines) {
            console.log(`🎯 Returning ${cachedHeadlines.length} cached headlines`);
            return cachedHeadlines;
        }
    } else {
        console.log('🔄 Force refresh requested, bypassing cache');
    }
    
    // Start loading process
    startLoadingProcess();
    
    try {
        // Try to fetch from RSS sources
        console.log('📡 Attempting to fetch headlines from RSS sources...');
        const rssHeadlines = await fetchFromRSSWithTimeout();
        
        if (rssHeadlines && rssHeadlines.length > 0) {
            console.log(`✅ Successfully fetched ${rssHeadlines.length} headlines from RSS`);
            headlineCache.set(rssHeadlines);
            stopLoadingProcess();
            return rssHeadlines;
        }
        
        console.log('⚠️ RSS fetch returned no headlines, falling back to mock data');
        
    } catch (error) {
        console.error('❌ RSS fetch failed:', error);
        console.log('🔄 Falling back to mock data');
    }
    
    // Fallback to mock headlines
    stopLoadingProcess();
    const mockHeadlinesWithMetadata = mockHeadlines.map(headline => ({
        ...headline,
        source: 'mock',
        sourceName: 'Mock Data',
        category: 'fallback',
        pubDate: new Date().toISOString()
    }));
    
    console.log(`📋 Using ${mockHeadlinesWithMetadata.length} mock headlines as fallback`);
    return mockHeadlinesWithMetadata;
}

/**
 * Fetches from RSS sources with timeout handling
 * @returns {Promise<Array>} Headlines from RSS or null if failed
 */
async function fetchFromRSSWithTimeout() {
    return new Promise(async (resolve, reject) => {
        // Set up timeout
        const timeoutId = setTimeout(() => {
            console.log(`⏰ RSS fetch timeout after ${FETCH_TIMEOUT}ms`);
            reject(new Error('RSS fetch timeout'));
        }, FETCH_TIMEOUT);
        
        try {
            // Fetch from RSS sources with limited concurrency
            const headlines = await fetchFromRSSSourcesSequentially();
            clearTimeout(timeoutId);
            resolve(headlines);
        } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
        }
    });
}

/**
 * Fetches from all RSS sources simultaneously (async/parallel)
 * @returns {Promise<Array>} Combined headlines from working sources
 */
async function fetchFromRSSSourcesSequentially() {
    // Apply fetch delay if configured (for debugging)
    const fetchDelay = headlineScoringConfig?.rssConfig?.fetchDelay || 0;
    if (fetchDelay > 0) {
        console.log(`⏳ Waiting ${fetchDelay}ms before starting RSS fetch (debug delay)`);
        await new Promise(resolve => setTimeout(resolve, fetchDelay));
    }
    
    console.log(`🚀 Fetching from ${rssNewsSources.length} RSS sources simultaneously...`);
    
    const workingSources = [];
    const failedSources = [];
    
    // Create promises for all sources simultaneously
    const sourcePromises = rssNewsSources.map(async (source, index) => {
        console.log(`📡 Starting fetch from source ${index + 1}/${rssNewsSources.length}: ${source.name}`);
        
        try {
            const headlines = await RSSParser.fetchLatestHeadlines(source.url, 5);
            
            if (headlines && headlines.length > 0) {
                headlines.forEach(headline => {
                    headline.sourceName = source.name;
                    headline.category = source.category;
                });
                
                workingSources.push(source.name);
                console.log(`✅ ${source.name}: Successfully fetched ${headlines.length} headlines`);
                return headlines;
            } else {
                failedSources.push(source.name);
                console.log(`⚠️ ${source.name}: No headlines returned`);
                return [];
            }
            
        } catch (error) {
            failedSources.push(source.name);
            console.error(`❌ ${source.name}: Failed with error:`, error.message || error);
            return [];
        }
    });
    
    // Wait for all sources to complete simultaneously
    console.log(`⏳ Waiting for all ${rssNewsSources.length} sources to complete...`);
    const results = await Promise.all(sourcePromises);
    
    // Combine all results
    const allHeadlines = [];
    results.forEach(headlines => {
        allHeadlines.push(...headlines);
    });
    
    // Summary
    console.log(`📊 RSS Fetch Summary:`);
    console.log(`✅ Working sources (${workingSources.length}): ${workingSources.join(', ')}`);
    console.log(`❌ Failed sources (${failedSources.length}): ${failedSources.join(', ')}`);
    
    // Remove duplicates
    const uniqueHeadlines = RSSParser.removeDuplicateHeadlines(allHeadlines);
    console.log(`📰 Total unique headlines from RSS: ${uniqueHeadlines.length}`);
    
    // If we got at least some headlines, consider it a success
    if (uniqueHeadlines.length > 0) {
        console.log(`🎉 Successfully fetched headlines from ${workingSources.length}/${rssNewsSources.length} sources in parallel`);
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
    
    // Use configurable delay from data.js or fallback to FETCH_TIMEOUT
    const loadingDelay = headlineScoringConfig?.rssConfig?.loadingAnimationDelay || FETCH_TIMEOUT;
    
    // Show loading animation after a delay if still loading
    loadingState.timeoutId = setTimeout(() => {
        if (loadingState.isLoading) {
            showLoadingAnimation();
            console.log(`🎭 Loading animation triggered after ${loadingDelay}ms delay`);
        }
    }, loadingDelay);
    
    console.log(`⏳ Loading process started with ${loadingDelay}ms delay...`);
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
    
    console.log(`✅ Loading process completed in ${duration}ms`);
}

/**
 * Shows loading animation in the UI
 */
function showLoadingAnimation() {
    if (loadingState.showingAnimation) return;
    
    loadingState.showingAnimation = true;
    console.log('🎭 Showing loading animation...');
    
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'rss-loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text">Fetching latest headlines...</div>
            <div class="loading-subtext">This may take a few seconds</div>
        </div>
    `;
    
    // Add styles
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .loading-content {
            text-align: center;
            color: white;
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        .loading-text {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .loading-subtext {
            font-size: 14px;
            opacity: 0.8;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(overlay);
}

/**
 * Hides loading animation from the UI
 */
function hideLoadingAnimation() {
    if (!loadingState.showingAnimation) return;
    
    loadingState.showingAnimation = false;
    console.log('🎭 Hiding loading animation...');
    
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
    console.log('🔄 Forcing headline refresh...');
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
        FETCH_TIMEOUT,
        CACHE_DURATION
    };
}
