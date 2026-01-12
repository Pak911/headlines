// ===== TUTORIAL SYSTEM =====
// Basic tutorial functionality for Headlines game

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('tutorials', message, options);
    } else {
        // Fallback if debug.js not loaded yet
        console.log('[tutorials]', message);
    }
}

// Helper function to process markdown-like syntax
function processMarkdown(text) {
    // Convert --- to horizontal rule (with optional surrounding whitespace/newlines)
    text = text.replace(/\n\s*---\s*\n/g, '\n<hr>\n');
    // Convert ![alt](url) to <center><img alt="alt" src="url"></center>
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<center><img alt="$1" src="$2"></center>');
    // Convert **text** to <strong>text</strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert __text__ to <strong>text</strong>
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
    return text;
}

class HeadlinesTutorial {
    constructor() {
        this.tutorialState = {};
        this.initialized = false;
        this.showingTutorial = false;
    }

    /**
     * Initialize the tutorial system
     */
    async init() {
        if (this.initialized) return;
        
        this.initialized = true;
        
        // Wait for platform before loading state
        window.addEventListener('headlines:platform:ready', async () => {
            await this.loadTutorialState();
            this.checkAndShowTutorial();
        });
    }

    /**
     * Load tutorial state from platform storage
     */
    async loadTutorialState() {
        try {
            if (window.Platform && typeof window.Platform.loadTutorialState === 'function') {
                this.tutorialState = await window.Platform.loadTutorialState();
            }
        } catch (error) {
            console.error('Failed to load tutorial state:', error);
            this.tutorialState = {};
        }
    }

    /**
     * Save tutorial state to platform storage
     */
    async saveTutorialState() {
        try {
            if (window.Platform && typeof window.Platform.saveTutorialState === 'function') {
                await window.Platform.saveTutorialState(this.tutorialState);
            }
        } catch (error) {
            console.error('Failed to save tutorial state:', error);
        }
    }

    /**
     * Check if tutorial should be shown and show it
     */
    checkAndShowTutorial() {
        // For now, only show welcome tutorial if not seen
        if (!this.tutorialState.welcome) {
            this.showWelcomeTutorial();
        }
    }

    /**
     * Show the welcome tutorial
     */
    async showWelcomeTutorial() {
        if (this.showingTutorial) return;

        this.showingTutorial = true;

        await showPopup({
            title: t('tutorial.welcome.title'),
            content: `<div style="line-height: 1.6;">
                <p>${processMarkdown(t('tutorial.welcome.content')).replace(/\n\n/g, '</p><p>')}</p>
            </div>`,
            buttons: [
                { text: t('tutorial.welcome.buttonText'), class: 'primary' }
            ],
            closeOnBackdrop: false,
            isTutorial: true  // Mark this as a tutorial popup
        });
        
        // Mark as seen after popup closes
        this.closeTutorial();
        this.showingTutorial = false;
    }
    closeTutorial() {
        // Mark as seen
        this.tutorialState.welcome = true;
        this.saveTutorialState();
    }

    /**
     * Check if a tutorial has been seen
     * @param {string} tutorialName - Name of the tutorial
     * @returns {boolean} True if seen
     */
    hasSeenTutorial(tutorialName) {
        return !!this.tutorialState[tutorialName];
    }

    /**
     * Mark a tutorial as seen
     * @param {string} tutorialName - Name of the tutorial
     */
    markTutorialAsSeen(tutorialName) {
        this.tutorialState[tutorialName] = true;
        this.saveTutorialState();
    }

    /**
     * Reset tutorial state (for debugging)
     */
    async resetTutorialState() {
        this.tutorialState = {};
        await this.saveTutorialState();
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.HeadlinesTutorial = new HeadlinesTutorial();
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        window.HeadlinesTutorial.init();
    });
}

})();