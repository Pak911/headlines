// Category System - News category selection and persistence
// Handles category selection, saving/loading, and future filtering logic

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('category-system', message, options);
    } else {
        console.log('[category-system]', message);
    }
}

// Function to change category
function changeCategory(newCategory) {
    currentCategory = newCategory;

    // Save to platform system
    if (typeof Platform !== 'undefined' && Platform.saveGameCategory) {
        Platform.saveGameCategory(newCategory).catch(err => {
            console.error('Failed to save category:', err);
        });
    }

    // Dispatch analytics event
    window.dispatchEvent(new CustomEvent('headlines:categoryChanged', {
        detail: { newCategory: newCategory }
    }));

    // TODO: Implement category filtering in headline selection
    // For now, just save the setting
    _log(`Category changed to: ${newCategory}`);
}

// Initialize category system
async function initCategorySystem() {
    // Load saved category from platform
    if (typeof Platform !== 'undefined' && Platform.isAvailable() && Platform.loadGameCategory) {
        const savedCategory = await Platform.loadGameCategory();
        if (savedCategory) {
            currentCategory = savedCategory;
            _log(`Loaded saved category: ${savedCategory}`);
        } else {
            _log(`Using default category: ${currentCategory}`);
        }
    } else {
        _log(`Platform not available, using default category: ${currentCategory}`);
    }

    // Listen for category changes to trigger headline refetch
    window.addEventListener('headlines:categoryChanged', async (event) => {
        const newCategory = event.detail.newCategory;
        _log(`🔄 Category changed to '${newCategory}', refreshing headlines...`);
        
        // Refresh headline pools and reinitialize game
        if (typeof window.HeadlineManager !== 'undefined' && 
            typeof window.HeadlineManager.refreshHeadlinePools === 'function') {
            await window.HeadlineManager.refreshHeadlinePools(true); // Force refresh
        }
        
        // Reinitialize game to fetch new headlines with new category
        if (typeof enhancedInitGame === 'function') {
            enhancedInitGame();
        }
    });
}

// Expose functions globally
if (typeof window !== 'undefined') {
    window.changeCategory = changeCategory;
    window.initCategorySystem = initCategorySystem;
}

})();