/**
 * General Utilities - Common utility functions used across the application
 */

(function() {
'use strict';

/**
 * Creates a djb2 hash for content identification
 * @param {string} headline - The headline text
 * @param {string} description - The description text (optional)
 * @returns {string} Base36 encoded hash string
 */
function createDjb2Hash(headline, description = '') {
    // Normalize content: lowercase, remove punctuation, normalize whitespace
    // Include Cyrillic characters in the allowed character set
    const content = (headline + ' ' + description).toLowerCase()
        .replace(/[^a-zа-яё0-9\s]/g, '') // Remove punctuation but keep letters and numbers
        .replace(/\s+/g, ' ')   // Normalize whitespace
        .trim();

    // djb2 hash algorithm
    let hash = 5381;
    for (let i = 0; i < content.length; i++) {
        hash = ((hash << 5) + hash) + content.charCodeAt(i); // hash * 33 + char
    }

    // Return positive hash as base36 string for shorter representation
    return (hash >>> 0).toString(36);
}

// Export functions to global scope
window.Utils = {
    createDjb2Hash: createDjb2Hash
};

})();