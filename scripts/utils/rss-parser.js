/**
 * RSS Parser for Headlines Crossword Game
 * Fetches and processes RSS feeds to extract headlines suitable for the game
 */

// RSS2JSON API configuration
const RSS_API_BASE = 'https://api.rss2json.com/v1/api.json';

// Get configuration from data.js
const getRSSConfig = () => {
    if (typeof headlineScoringConfig !== 'undefined' && headlineScoringConfig.rssConfig) {
        return headlineScoringConfig.rssConfig;
    }
    // Fallback configuration
    return {
        defaultCount: 10,
        minWordLengthForParsing: 2,
        skipWordsInParsing: ['THE', 'AND', 'OR', 'BUT', 'FOR', 'NOR', 'SO', 'YET', 'A', 'AN']
    };
};

/**
 * Fetches headlines from a single RSS source
 * @param {string} rssUrl - The RSS feed URL
 * @param {number} count - Number of articles to fetch (default: 10)
 * @returns {Promise<Array>} Array of processed headlines
 */
async function fetchLatestHeadlines(rssUrl, count) {
    const config = getRSSConfig();
    const defaultCount = count || config.defaultCount;
    try {
        console.log(`🔄 Fetching headlines from: ${rssUrl}`);
        
        // Construct RSS2JSON API URL (without count parameter for better compatibility)
        const apiUrl = `${RSS_API_BASE}?rss_url=${encodeURIComponent(rssUrl)}`;
        
        // Fetch data from RSS2JSON API
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status !== 'ok') {
            throw new Error(`RSS API error: ${data.message || 'Unknown error'}`);
        }
        
        console.log(`✅ Successfully fetched ${data.items.length} items from RSS`);
        
        // Process and filter headlines
        const processedHeadlines = processRSSItems(data.items);
        
        console.log(`📰 Processed ${processedHeadlines.length} valid headlines (4+ words)`);
        
        return processedHeadlines;
        
    } catch (error) {
        console.error(`❌ Error fetching headlines from ${rssUrl}:`, error);
        return [];
    }
}

/**
 * Processes RSS items and converts them to game format
 * @param {Array} items - Raw RSS items from API
 * @returns {Array} Processed headlines in game format
 */
function processRSSItems(items) {
    const processedHeadlines = [];
    
    for (const item of items) {
        try {
            // Clean and process the title
            const cleanTitle = cleanHeadlineText(item.title);
            
            if (!cleanTitle) {
                console.log(`⚠️ Skipping empty title: ${item.title}`);
                continue;
            }
            
            // Split into words and filter
            const words = extractWords(cleanTitle);
            
            // Only include headlines with 4+ words (game requirement)
            if (words.length < 4) {
                console.log(`⚠️ Skipping short headline (${words.length} words): ${cleanTitle}`);
                continue;
            }
            
            // Create headline object in game format
            const headline = {
                text: words.join(' '),
                words: words,
                link: item.link || '#',
                source: item.source || 'RSS',
                pubDate: item.pubDate || new Date().toISOString(),
                originalTitle: item.title,
                description: item.description || item.content || ''
            };
            
            processedHeadlines.push(headline);
            console.log(`✅ Processed: "${headline.text}" (${words.length} words)`);
            
        } catch (error) {
            console.error(`❌ Error processing item:`, item, error);
        }
    }
    
    return processedHeadlines;
}

/**
 * Cleans headline text by removing unwanted characters and formatting
 * Enhanced with HTML processor integration
 * @param {string} title - Raw headline title
 * @returns {string} Cleaned title
 */
function cleanHeadlineText(title) {
    if (!title || typeof title !== 'string') {
        return '';
    }
    
    // Use enhanced HTML processing if available
    if (typeof window !== 'undefined' && window.HTMLProcessor) {
        return window.HTMLProcessor.enhancedCleanHeadlineText(title);
    }
    
    // Fallback to original processing
    return title
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        // Remove quotes and special punctuation that might interfere
        .replace(/["""'']/g, '')
        // Remove trailing punctuation that's not essential
        .replace(/[.!?]+$/, '')
        // Convert to uppercase (game format)
        .toUpperCase()
        // Trim whitespace
        .trim();
}

/**
 * Extracts valid words from headline text
 * @param {string} text - Cleaned headline text
 * @returns {Array} Array of valid words
 */
function extractWords(text) {
    const config = getRSSConfig();
    
    return text
        // Split on whitespace and common separators
        .split(/[\s\-–—:;,]+/)
        // Filter out empty strings and invalid words
        .filter(word => {
            // Must be non-empty
            if (!word || word.length === 0) return false;
            
            // Must contain only letters (no numbers or special chars)
            if (!/^[A-Z]+$/.test(word)) return false;
            
            // Must be at least minWordLengthForParsing characters
            if (word.length < config.minWordLengthForParsing) return false;
            
            // Avoid common non-content words that don't work well in crosswords
            if (config.skipWordsInParsing.includes(word)) return false;
            
            return true;
        });
}

/**
 * Fetches headlines from multiple RSS sources
 * @param {Array} sources - Array of RSS source objects
 * @param {number} countPerSource - Headlines to fetch per source
 * @returns {Promise<Array>} Combined array of headlines from all sources
 */
async function fetchFromMultipleSources(sources, countPerSource = 5) {
    console.log(`🔄 Fetching from ${sources.length} RSS sources...`);
    
    const allHeadlines = [];
    const fetchPromises = sources.map(async (source) => {
        try {
            const headlines = await fetchLatestHeadlines(source.url, countPerSource);
            // Add source information to each headline
            headlines.forEach(headline => {
                headline.sourceName = source.name;
                headline.category = source.category;
            });
            return headlines;
        } catch (error) {
            console.error(`❌ Failed to fetch from ${source.name}:`, error);
            return [];
        }
    });
    
    // Wait for all sources to complete
    const results = await Promise.all(fetchPromises);
    
    // Combine all results
    results.forEach(headlines => {
        allHeadlines.push(...headlines);
    });
    
    // Remove duplicates based on text content
    const uniqueHeadlines = removeDuplicateHeadlines(allHeadlines);
    
    console.log(`📰 Total unique headlines fetched: ${uniqueHeadlines.length}`);
    
    return uniqueHeadlines;
}

/**
 * Removes duplicate headlines based on text similarity
 * @param {Array} headlines - Array of headline objects
 * @returns {Array} Array with duplicates removed
 */
function removeDuplicateHeadlines(headlines) {
    const seen = new Set();
    const unique = [];
    
    for (const headline of headlines) {
        // Create a normalized key for duplicate detection
        const key = headline.text.replace(/\s+/g, '').toLowerCase();
        
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(headline);
        } else {
            console.log(`🔄 Removing duplicate: "${headline.text}"`);
        }
    }
    
    return unique;
}

/**
 * Test function to fetch headlines from a specific source
 * @param {string} sourceName - Name of the source to test
 * @returns {Promise<Array>} Headlines from the specified source
 */
async function testSingleSource(sourceName) {
    const source = rssNewsSources.find(s => s.name === sourceName);
    
    if (!source) {
        console.error(`❌ Source "${sourceName}" not found`);
        return [];
    }
    
    console.log(`🧪 Testing source: ${source.name}`);
    return await fetchLatestHeadlines(source.url);
}

/**
 * Test function to fetch headlines from all configured sources
 * @returns {Promise<Array>} Headlines from all sources
 */
async function testAllSources() {
    console.log(`🧪 Testing all ${rssNewsSources.length} RSS sources...`);
    return await fetchFromMultipleSources(rssNewsSources, 3);
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    // Browser environment - attach to window
    window.RSSParser = {
        fetchLatestHeadlines,
        fetchFromMultipleSources,
        testSingleSource,
        testAllSources,
        processRSSItems,
        cleanHeadlineText,
        extractWords,
        removeDuplicateHeadlines
    };
}
