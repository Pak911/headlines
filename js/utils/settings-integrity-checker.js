/**
 * Settings Integrity Checker
 * Validates configuration settings and data integrity
 * Provides warnings for invalid configurations while allowing graceful degradation
 */

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {always:true}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('settings-integrity', message, options);
    } else {
        // Fallback if debug.js not loaded yet
        console.log('[settings-integrity]', message);
    }
}

/**
 * Validates RSS source categories
 * @param {Array} sources - Array of RSS source objects
 * @param {string} sourceName - Name of the source array for logging
 * @returns {Array} Filtered array of valid sources
 */
function validateRSSSourceCategories(sources, sourceName) {
    if (!Array.isArray(sources)) {
        console.warn(`⚠️ ${sourceName} is not an array, skipping validation`);
        return [];
    }

    const validCategories = rssFetchingConfig?.validCategories;
    if (!validCategories || !Array.isArray(validCategories)) {
        console.warn(`⚠️ Valid categories not defined in rssFetchingConfig, skipping category validation`);
        return sources;
    }

    const validSources = [];
    let invalidCount = 0;

    sources.forEach((source, index) => {
        if (!source || typeof source !== 'object') {
            console.warn(`⚠️ ${sourceName}[${index}] is not a valid object, skipping`);
            invalidCount++;
            return;
        }

        if (!source.name || !source.url) {
            console.warn(`⚠️ ${sourceName}[${index}] missing required 'name' or 'url' property, skipping`);
            invalidCount++;
            return;
        }

        if (!source.category) {
            console.warn(`⚠️ ${sourceName}[${index}] (${source.name}) missing 'category' property, skipping`);
            invalidCount++;
            return;
        }

        if (!validCategories.includes(source.category)) {
            console.warn(`⚠️ ${sourceName}[${index}] (${source.name}) has invalid category '${source.category}', valid categories: ${validCategories.join(', ')}, skipping`);
            invalidCount++;
            return;
        }

        // Source is valid
        validSources.push(source);
    });

    if (invalidCount > 0) {
        _log(`⚠️ Filtered out ${invalidCount} invalid sources from ${sourceName}, ${validSources.length} valid sources remaining`);
    } else {
        _log(`✅ All ${validSources.length} sources in ${sourceName} passed category validation`);
    }

    return validSources;
}

/**
 * Validates RSS fetching configuration values
 * @returns {boolean} True if all validations pass
 */
function validateRSSFetchingConfig() {
    let allValid = true;

    // Validate maxConcurrentRequests
    const maxConcurrent = rssFetchingConfig?.maxConcurrentRequests;
    if (typeof maxConcurrent !== 'number' || maxConcurrent < 1 || maxConcurrent > 10) {
        console.warn(`⚠️ rssFetchingConfig.maxConcurrentRequests should be a number between 1-10, got: ${maxConcurrent}`);
        allValid = false;
    }

    // Validate batchDelayMs
    const batchDelay = rssFetchingConfig?.batchDelayMs;
    if (typeof batchDelay !== 'number' || batchDelay < 0 || batchDelay > 10000) {
        console.warn(`⚠️ rssFetchingConfig.batchDelayMs should be a number between 0-10000, got: ${batchDelay}`);
        allValid = false;
    }

    // Validate fetchTimeoutMs
    const fetchTimeout = rssFetchingConfig?.fetchTimeoutMs;
    if (typeof fetchTimeout !== 'number' || fetchTimeout < 1000 || fetchTimeout > 60000) {
        console.warn(`⚠️ rssFetchingConfig.fetchTimeoutMs should be a number between 1000-60000, got: ${fetchTimeout}`);
        allValid = false;
    }

    // Validate articlesPerSource
    const articlesPerSource = rssFetchingConfig?.articlesPerSource;
    if (!articlesPerSource || typeof articlesPerSource !== 'object') {
        console.warn(`⚠️ rssFetchingConfig.articlesPerSource should be an object with language keys`);
        allValid = false;
    } else {
        ['en', 'ru'].forEach(lang => {
            const count = articlesPerSource[lang];
            if (typeof count !== 'number' || count < 1 || count > 50) {
                console.warn(`⚠️ rssFetchingConfig.articlesPerSource.${lang} should be a number between 1-50, got: ${count}`);
                allValid = false;
            }
        });
    }

    // Validate validCategories
    const validCategories = rssFetchingConfig?.validCategories;
    if (!Array.isArray(validCategories) || validCategories.length === 0) {
        console.warn(`⚠️ rssFetchingConfig.validCategories should be a non-empty array`);
        allValid = false;
    } else {
        validCategories.forEach((category, index) => {
            if (typeof category !== 'string' || category.trim() === '') {
                console.warn(`⚠️ rssFetchingConfig.validCategories[${index}] should be a non-empty string, got: ${category}`);
                allValid = false;
            }
        });
    }

    if (allValid) {
        _log(`✅ RSS fetching configuration validation passed`);
    } else {
        _log(`⚠️ RSS fetching configuration has validation issues`);
    }

    return allValid;
}

/**
 * Validates that all RSS source names are unique across all language arrays
 * @param {Array} englishSources - English RSS sources
 * @param {Array} russianSources - Russian RSS sources  
 * @param {Array} portugueseSources - Portuguese RSS sources
 */
function validateUniqueRSSSourceNames(englishSources, russianSources, portugueseSources) {
    const allSources = [
        ...(englishSources || []),
        ...(russianSources || []),
        ...(portugueseSources || [])
    ];

    const nameCounts = {};
    const duplicates = [];

    // Count occurrences of each name
    allSources.forEach(source => {
        if (source && source.name) {
            const name = source.name.trim();
            if (name) {
                nameCounts[name] = (nameCounts[name] || 0) + 1;
                if (nameCounts[name] === 2) {
                    duplicates.push(name);
                }
            }
        }
    });

    if (duplicates.length > 0) {
        console.warn(`⚠️ Found ${duplicates.length} duplicate RSS source name(s): ${duplicates.join(', ')}`);
        duplicates.forEach(duplicateName => {
            const sourcesWithName = allSources.filter(source => source && source.name && source.name.trim() === duplicateName);
            console.warn(`   - "${duplicateName}" appears in: ${sourcesWithName.map(s => `${s.category || 'unknown'} category`).join(', ')}`);
        });
        console.warn(`⚠️ Duplicate names may cause confusion but RSS fetching will continue normally`);
    } else {
        _log(`✅ All RSS source names are unique (${allSources.length} total sources)`);
    }
}

/**
 * Validates all RSS sources (English, Russian, and Portuguese)
 * @returns {Object} Object with validated source arrays
 */
function validateAllRSSSources() {
    const result = {
        englishSources: [],
        russianSources: [],
        portugueseSources: []
    };

    // Validate English sources
    if (typeof englishRssNewsSources !== 'undefined') {
        result.englishSources = validateRSSSourceCategories(englishRssNewsSources, 'englishRssNewsSources');
    } else {
        console.warn(`⚠️ englishRssNewsSources not found, skipping English source validation`);
    }

    // Validate Russian sources
    if (typeof russianRssNewsSources !== 'undefined') {
        result.russianSources = validateRSSSourceCategories(russianRssNewsSources, 'russianRssNewsSources');
    } else {
        console.warn(`⚠️ russianRssNewsSources not found, skipping Russian source validation`);
    }

    // Validate Portuguese sources
    if (typeof portugueseRssNewsSources !== 'undefined') {
        result.portugueseSources = validateRSSSourceCategories(portugueseRssNewsSources, 'portugueseRssNewsSources');
    } else {
        console.warn(`⚠️ portugueseRssNewsSources not found, skipping Portuguese source validation`);
    }

    // Check for duplicate names across all sources
    validateUniqueRSSSourceNames(result.englishSources, result.russianSources, result.portugueseSources);

    _log(`📊 Validation complete: ${result.englishSources.length} English, ${result.russianSources.length} Russian, ${result.portugueseSources.length} Portuguese valid sources`);

    return result;
}

/**
 * Runs all settings integrity checks
 * @returns {Object} Validation results
 */
function runIntegrityChecks() {
    _log('🔍 Running settings integrity checks...');

    const results = {
        configValid: validateRSSFetchingConfig(),
        sourcesValid: false,
        validatedSources: null
    };

    // Validate sources
    results.validatedSources = validateAllRSSSources();
    results.sourcesValid = (results.validatedSources.englishSources.length > 0 ||
                           results.validatedSources.russianSources.length > 0);

    const totalValidSources = results.validatedSources.englishSources.length +
                             results.validatedSources.russianSources.length;

    if (results.configValid && results.sourcesValid) {
        _log(`✅ All integrity checks passed (${totalValidSources} valid sources)`);
    } else {
        _log(`⚠️ Integrity checks completed with issues (${totalValidSources} valid sources)`);
    }

    return results;
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.SettingsIntegrityChecker = {
        runIntegrityChecks,
        validateRSSSourceCategories,
        validateRSSFetchingConfig,
        validateAllRSSSources,
        validateUniqueRSSSourceNames
    };
}

})();