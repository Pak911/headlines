// Headlines Analytics System
// Handles sending custom events to configured analytics services

const headlinesAnalytics = {
    // Check if Google Analytics is enabled
    isGoogleAnalyticsEnabled() {
        return window.analyticsConfig?.googleAnalytics?.enabled === true;
    },

    // Check if analytics debug logging is enabled
    isAnalyticsDebugEnabled() {
        return window.analyticsConfig?.analyticsDebug === true;
    },

    // Format event data for console logging
    formatEventForConsole(eventName, parameters = {}) {
        const paramStr = Object.keys(parameters).length > 0
            ? ` (${JSON.stringify(parameters)})`
            : '';
        return `${eventName}${paramStr}`;
    },

    // Log analytics event to console if debug is enabled
    logAnalyticsEvent(eventName, parameters = {}) {
        if (this.isAnalyticsDebugEnabled()) {
            const formattedEvent = this.formatEventForConsole(eventName, parameters);
            console.log('[analytics]', formattedEvent);
        }
    },

    // Send event to Google Analytics 4
    sendGoogleAnalyticsEvent(eventName, parameters = {}) {
        // Always log to console if debug is enabled
        this.logAnalyticsEvent(eventName, parameters);

        if (!this.isGoogleAnalyticsEnabled()) {
            return;
        }

        if (typeof gtag !== 'function') {
            console.warn('[analytics] gtag not available, skipping event:', eventName);
            return;
        }

        try {
            gtag('event', eventName, parameters);
        } catch (error) {
            console.warn('[analytics] Failed to send GA event:', eventName, error);
        }
    },

    // Get current game state parameters
    getCurrentGameState() {
        // Get mode from utils if available
        const mode = this.getCurrentMode();
        const difficulty = this.getCurrentDifficulty();
        const language = this.getCurrentLanguage();

        return { mode, difficulty, language };
    },

    // Get current game mode (news or challenge)
    getCurrentMode() {
        // Check if we're in challenge mode (custom puzzle)
        if (window.Utils && window.Utils.isInCustomLinkMode && window.Utils.isInCustomLinkMode()) {
            return 'challenge';
        }
        return 'news';
    },

    // Get current difficulty level
    getCurrentDifficulty() {
        return window.currentDifficulty || 'medium';
    },

    // Get current language
    getCurrentLanguage() {
        // Check for language in localStorage or use default
        return localStorage.getItem('headlines-language') ||
               (navigator.language.startsWith('ru') ? 'ru' : 'en');
    },

    // Core Puzzle Events
    trackPuzzleStart(mode, difficulty, language) {
        const parameters = { mode, difficulty, language };
        this.sendGoogleAnalyticsEvent('puzzleStart', parameters);
    },

    trackPuzzleSolved(mode, movesUsed, starRating, difficulty, language) {
        const parameters = { mode, movesUsed, starRating, difficulty, language };
        this.sendGoogleAnalyticsEvent('puzzleSolved', parameters);
    },

    trackPuzzleGiveUp(mode, movesUsed, difficulty, language) {
        const parameters = { mode, movesUsed, difficulty, language };
        this.sendGoogleAnalyticsEvent('puzzleGiveUp', parameters);
    },

    trackPuzzleSkipped(mode, difficulty, language) {
        const parameters = { mode, difficulty, language };
        this.sendGoogleAnalyticsEvent('puzzleSkipped', parameters);
    },

    trackPuzzleSkipped(mode, difficulty, language) {
        const parameters = { mode, difficulty, language };
        this.sendGoogleAnalyticsEvent('puzzleSkipped', parameters);
    },

    // UI/Feature Events
    trackHelpOpened() {
        this.sendGoogleAnalyticsEvent('helpOpened', {});
    },

    trackLanguageChanged(newLanguage) {
        const parameters = { newLanguage };
        this.sendGoogleAnalyticsEvent('languageChanged', parameters);
    },

    trackDifficultyChanged(newDifficulty) {
        const parameters = { newDifficulty };
        this.sendGoogleAnalyticsEvent('difficultyChanged', parameters);
    },

    trackSoundSettingChanged(enabled) {
        const parameters = { enabled };
        this.sendGoogleAnalyticsEvent('soundSettingChanged', parameters);
    },

    trackArticleRead() {
        this.sendGoogleAnalyticsEvent('articleRead', {});
    },

    trackCreateOwnPuzzleClicked() {
        this.sendGoogleAnalyticsEvent('createOwnPuzzleClicked', {});
    },

    trackCustomPuzzlePreviewed(headlineLength, wordCount, difficulty, language) {
        const parameters = { headlineLength, wordCount, difficulty, language };
        this.sendGoogleAnalyticsEvent('customPuzzlePreviewed', parameters);
    },

    trackCustomPuzzleLinkCopied(headlineLength, wordCount, difficulty, language) {
        const parameters = { headlineLength, wordCount, difficulty, language };
        this.sendGoogleAnalyticsEvent('customPuzzleLinkCopied', parameters);
    }
};

// Set up event listeners for custom events (only if analytics is enabled)
if (typeof window !== 'undefined') {
    // Check if Google Analytics is enabled before setting up anything
    const isGAEnabled = window.analyticsConfig?.googleAnalytics?.enabled === true;
    
    if (isGAEnabled) {
        // Dynamically load Google Analytics
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + window.analyticsConfig.googleAnalytics.measurementId;
        document.head.appendChild(gaScript);
        
        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', window.analyticsConfig.googleAnalytics.measurementId);
        
        // Set up event listeners only when GA is enabled
        window.addEventListener('headlines:puzzleStart', (event) => {
            window.headlinesAnalytics.trackPuzzleStart(event.detail.mode, event.detail.difficulty, event.detail.language);
        });

        window.addEventListener('headlines:puzzleSolved', (event) => {
            window.headlinesAnalytics.trackPuzzleSolved(
                event.detail.mode, 
                event.detail.movesUsed, 
                event.detail.starRating, 
                event.detail.difficulty, 
                event.detail.language
            );
        });

        window.addEventListener('headlines:puzzleGiveUp', (event) => {
            window.headlinesAnalytics.trackPuzzleGiveUp(
                event.detail.mode,
                event.detail.movesUsed,
                event.detail.difficulty,
                event.detail.language
            );
        });

        window.addEventListener('headlines:puzzleSkipped', (event) => {
            window.headlinesAnalytics.trackPuzzleSkipped(
                event.detail.mode,
                event.detail.difficulty,
                event.detail.language
            );
        });

        window.addEventListener('headlines:articleRead', () => {
            window.headlinesAnalytics.trackArticleRead();
        });

        window.addEventListener('headlines:createOwnPuzzleClicked', () => {
            window.headlinesAnalytics.trackCreateOwnPuzzleClicked();
        });

        window.addEventListener('headlines:customPuzzlePreviewed', (event) => {
            window.headlinesAnalytics.trackCustomPuzzlePreviewed(
                event.detail.headlineLength,
                event.detail.wordCount,
                event.detail.difficulty,
                event.detail.language
            );
        });

        window.addEventListener('headlines:customPuzzleLinkCopied', (event) => {
            window.headlinesAnalytics.trackCustomPuzzleLinkCopied(
                event.detail.headlineLength,
                event.detail.wordCount,
                event.detail.difficulty,
                event.detail.language
            );
        });

        window.addEventListener('headlines:helpOpened', () => {
            window.headlinesAnalytics.trackHelpOpened();
        });

        window.addEventListener('headlines:languageChanged', (event) => {
            window.headlinesAnalytics.trackLanguageChanged(event.detail.newLanguage);
        });

        window.addEventListener('headlines:difficultyChanged', (event) => {
            window.headlinesAnalytics.trackDifficultyChanged(event.detail.newDifficulty);
        });

        window.addEventListener('headlines:soundSettingChanged', (event) => {
            window.headlinesAnalytics.trackSoundSettingChanged(event.detail.enabled);
        });
    }
}

// Expose globally for use by other modules
if (typeof window !== 'undefined') {
    window.headlinesAnalytics = headlinesAnalytics;
}