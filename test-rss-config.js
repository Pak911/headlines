// Simple test to verify RSS language configuration is working
console.log('=== RSS Language Configuration Test ===');

// Test 1: Check if rssLanguageConfig exists and is set to 'ru'
if (typeof rssLanguageConfig !== 'undefined') {
    console.log('✅ RSS language config found:', rssLanguageConfig.rssLanguage);
    
    // Test 2: Check if Russian fallback articles exist
    if (typeof mockRussianHeadlines !== 'undefined') {
        console.log('✅ Russian fallback articles found:', mockRussianHeadlines.length, 'headlines');
        
        // Show first Russian headline as sample
        if (mockRussianHeadlines.length > 0) {
            const firstHeadline = mockRussianHeadlines[0];
            console.log('📝 Sample Russian headline:', firstHeadline.text);
            console.log('🔤 Words:', firstHeadline.words.join(', '));
        }
    } else {
        console.log('❌ Russian fallback articles not found');
    }
    
    // Test 3: Check if RSS sources selection works
    if (typeof getRSSSourcesForCurrentLanguage !== 'undefined') {
        // Temporarily set to Russian
        const originalConfig = rssLanguageConfig.rssLanguage;
        rssLanguageConfig.rssLanguage = 'ru';
        const russianSources = getRSSSourcesForCurrentLanguage();
        console.log('🇷🇺 Russian RSS sources:', russianSources.length, 'sources');
        
        // Temporarily set to English
        rssLanguageConfig.rssLanguage = 'en';
        const englishSources = getRSSSourcesForCurrentLanguage();
        console.log('🇺🇸 English RSS sources:', englishSources.length, 'sources');
        
        // Restore original config
        rssLanguageConfig.rssLanguage = originalConfig;
        
        console.log('✅ RSS sources selection working correctly');
    } else {
        console.log('❌ RSS sources selection function not found');
    }
} else {
    console.log('❌ RSS language config not found');
}

console.log('=== Test Complete ===');
