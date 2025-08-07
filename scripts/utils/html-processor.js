/**
 * HTML Processor for Headlines Crossword Game
 * Enhanced HTML detection, stripping, and text extraction utilities
 */

/**
 * Detects if text contains HTML tags
 * @param {string} text - Text to check for HTML
 * @returns {boolean} True if HTML is detected
 */
function detectHTML(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }
    
    // Check for common HTML patterns
    const htmlPatterns = [
        /<[^>]+>/,           // Any HTML tag
        /&[a-zA-Z]+;/,       // HTML entities like &amp; &quot;
        /&#\d+;/,            // Numeric HTML entities like &#39;
        /&#+x[0-9a-fA-F]+;/  // Hex HTML entities like &#x27;
    ];
    
    return htmlPatterns.some(pattern => pattern.test(text));
}

/**
 * Comprehensive HTML stripping and text extraction
 * @param {string} htmlContent - HTML content to process
 * @returns {string} Clean text without HTML
 */
function stripHTML(htmlContent) {
    if (!htmlContent || typeof htmlContent !== 'string') {
        return '';
    }
    
    let cleanText = htmlContent;
    
    // Step 1: Handle HTML entities first
    cleanText = decodeHTMLEntities(cleanText);
    
    // Step 2: Convert common block elements to spaces/newlines
    cleanText = cleanText
        // Convert paragraph breaks to spaces
        .replace(/<\/p>\s*<p[^>]*>/gi, ' ')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<\/p>/gi, ' ')
        
        // Convert div breaks to spaces
        .replace(/<\/div>\s*<div[^>]*>/gi, ' ')
        .replace(/<div[^>]*>/gi, '')
        .replace(/<\/div>/gi, ' ')
        
        // Convert line breaks to spaces
        .replace(/<br\s*\/?>/gi, ' ')
        
        // Convert list items to spaces
        .replace(/<\/li>\s*<li[^>]*>/gi, ' ')
        .replace(/<li[^>]*>/gi, '')
        .replace(/<\/li>/gi, ' ')
        
        // Remove other block elements
        .replace(/<\/?(?:ul|ol|dl|dt|dd|h[1-6]|blockquote|pre)[^>]*>/gi, ' ');
    
    // Step 3: Remove all remaining HTML tags
    cleanText = cleanText.replace(/<[^>]*>/g, '');
    
    // Step 4: Clean up whitespace and formatting
    cleanText = cleanText
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Remove leading/trailing whitespace
        .trim();
    
    return cleanText;
}

/**
 * Decodes HTML entities to their text equivalents
 * @param {string} text - Text containing HTML entities
 * @returns {string} Text with entities decoded
 */
function decodeHTMLEntities(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    
    // Common HTML entities mapping
    const entityMap = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&#x27;': "'",
        '&apos;': "'",
        '&nbsp;': ' ',
        '&ndash;': '–',
        '&mdash;': '—',
        '&hellip;': '...',
        '&lsquo;': "'",
        '&rsquo;': "'",
        '&ldquo;': '"',
        '&rdquo;': '"',
        '&bull;': '•',
        '&middot;': '·',
        '&copy;': '©',
        '&reg;': '®',
        '&trade;': '™'
    };
    
    let decodedText = text;
    
    // Replace named entities
    for (const [entity, replacement] of Object.entries(entityMap)) {
        decodedText = decodedText.replace(new RegExp(entity, 'gi'), replacement);
    }
    
    // Handle numeric entities (&#123; format)
    decodedText = decodedText.replace(/&#(\d+);/g, (match, num) => {
        return String.fromCharCode(parseInt(num, 10));
    });
    
    // Handle hex entities (&#x1F; format)
    decodedText = decodedText.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });
    
    return decodedText;
}

/**
 * Extracts clean text from HTML and processes it for headline use
 * @param {string} htmlContent - HTML content (could be from RSS description)
 * @returns {string} Processed text suitable for headlines
 */
function extractHeadlineText(htmlContent) {
    if (!htmlContent || typeof htmlContent !== 'string') {
        return '';
    }
    
    // First strip HTML
    let cleanText = stripHTML(htmlContent);
    
    // Additional processing for headline format
    cleanText = cleanText
        // Convert to uppercase (game format)
        .toUpperCase()
        // Remove quotes and special punctuation that might interfere
        .replace(/["""'']/g, '')
        // Remove trailing punctuation that's not essential
        .replace(/[.!?]+$/, '')
        // Remove extra punctuation
        .replace(/[,;:]+/g, '')
        // Clean up any remaining problematic characters
        .replace(/[^\w\s\-]/g, ' ')
        // Normalize whitespace again
        .replace(/\s+/g, ' ')
        .trim();
    
    return cleanText;
}

/**
 * Processes your example RSS content
 * @param {string} rssContent - Raw RSS content with HTML
 * @returns {Object} Processed result with analysis
 */
function processRSSContent(rssContent) {
    const result = {
        originalContent: rssContent,
        hasHTML: detectHTML(rssContent),
        cleanText: '',
        headlineText: '',
        words: [],
        wordCount: 0,
        suitableForGame: false
    };
    
    if (result.hasHTML) {
        result.cleanText = stripHTML(rssContent);
        result.headlineText = extractHeadlineText(rssContent);
    } else {
        result.cleanText = rssContent;
        result.headlineText = extractHeadlineText(rssContent);
    }
    
    // Extract words for game compatibility
    if (result.headlineText) {
        result.words = result.headlineText
            .split(/[\s\-–—:;,]+/)
            .filter(word => {
                // Must be non-empty and contain only letters
                return word && word.length > 0 && /^[A-Z]+$/.test(word) && word.length >= 3;
            });
        
        result.wordCount = result.words.length;
        result.suitableForGame = result.wordCount >= 4; // Game requires 4+ words
    }
    
    return result;
}

/**
 * Test function to demonstrate HTML processing with your example
 */
function testWithExample() {
    const exampleContent = `<p>Poor safety practices, lack of oversight and toxic workplace blamed for implosion in which five people died</p> <p>Inadequate safety practices, deliberate efforts to avoid oversight and a "toxic workplace culture" were among the factors that led to the 2023 implosion of the Titan submersible, the US Coast Guard has said in a damning report that described the disaster as a "preventable tragedy".</p> <p>The submersible <a href="https://www.theguardian.com/world/titanic-sub-incident">was on a commercial voyage</a> to explore the wreck of the Titanic when it disappeared in the Atlantic, leading to the deaths of all five people on board. The ensuing search captured headlines around the world for days as it evolved from a potential <a href="https://www.theguardian.com/world/2023/jun/28/titan-sub-debris-implosion-wreckage-oceangate">rescue mission to a recovery operation</a>.</p> <a href="https://www.theguardian.com/world/2025/aug/05/us-coast-guard-releases-damning-report-into-implosion-of-titan-submersible">Continue reading...</a>`;
    
    console.log('🧪 Testing HTML Processor with RSS example...');
    
    const result = processRSSContent(exampleContent);
    
    console.log('📊 Processing Results:');
    console.log(`HTML Detected: ${result.hasHTML}`);
    console.log(`Clean Text: "${result.cleanText}"`);
    console.log(`Headline Text: "${result.headlineText}"`);
    console.log(`Words: [${result.words.join(', ')}]`);
    console.log(`Word Count: ${result.wordCount}`);
    console.log(`Suitable for Game: ${result.suitableForGame}`);
    
    return result;
}

/**
 * Enhanced version of the existing RSS parser's cleanHeadlineText function
 * @param {string} title - Raw headline title (could contain HTML)
 * @returns {string} Cleaned title
 */
function enhancedCleanHeadlineText(title) {
    if (!title || typeof title !== 'string') {
        return '';
    }
    
    // Use our enhanced HTML processing
    if (detectHTML(title)) {
        return extractHeadlineText(title);
    } else {
        // Use simpler processing for non-HTML content
        return title
            .replace(/\s+/g, ' ')
            .replace(/["""'']/g, '')
            .replace(/[.!?]+$/, '')
            .toUpperCase()
            .trim();
    }
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    // Browser environment - attach to window
    window.HTMLProcessor = {
        detectHTML,
        stripHTML,
        decodeHTMLEntities,
        extractHeadlineText,
        processRSSContent,
        enhancedCleanHeadlineText,
        testWithExample
    };
}

// Also make functions available globally for easy testing
if (typeof window !== 'undefined') {
    window.detectHTML = detectHTML;
    window.stripHTML = stripHTML;
    window.processRSSContent = processRSSContent;
    window.testHTMLProcessor = testWithExample;
}
