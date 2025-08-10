// Localization Manager
// Handles language detection, storage, and translation

class LocalizationManager {
    constructor() {
        this.languages = {
            'en': en,
            'ru': ru
        };
        this.defaultLanguage = 'en';
        this.currentLanguage = this.detectLanguage();
        this.init();
    }

    // Detect browser language and map to supported languages
    detectLanguage() {
        // Check if default language is set in data.js
        if (typeof defaultLanguageConfig !== 'undefined') {
            const configLang = defaultLanguageConfig.defaultLanguage;
            if (configLang !== 'auto' && this.languages[configLang]) {
                return configLang;
            }
        }
        
        // Get browser language
        const browserLang = navigator.language.toLowerCase();
        
        // Map language variants to base languages
        if (browserLang.startsWith('en')) {
            return 'en';
        } else if (browserLang.startsWith('ru')) {
            return 'ru';
        }
        
        // Check if we have the exact language
        if (this.languages[browserLang]) {
            return browserLang;
        }
        
        // Default to English
        return this.defaultLanguage;
    }

    // Initialize localization system
    init() {
        // Check if user has previously selected a language
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage && this.languages[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        }
        
        // Set HTML lang attribute
        document.documentElement.lang = this.currentLanguage;
    }

    // Get translation for a key
    t(key) {
        const keys = key.split('.');
        let value = this.languages[this.currentLanguage];
        
        // Navigate through the key path
        for (let k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                // Fallback to English if translation not found
                value = this.languages[this.defaultLanguage];
                for (let fallbackKey of keys) {
                    if (value && value[fallbackKey] !== undefined) {
                        value = value[fallbackKey];
                    } else {
                        value = undefined;
                        break;
                    }
                }
                break;
            }
        }
        
        return value || key; // Return key if no translation found
    }

    // Change language
    setLanguage(lang) {
        if (this.languages[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('preferredLanguage', lang);
            document.documentElement.lang = lang;
            this.updateUI();
            
            // Refresh headline management system if RSS language is set to auto
            if (typeof rssLanguageConfig !== 'undefined' && rssLanguageConfig.rssLanguage === 'auto') {
                if (typeof window !== 'undefined' && window.HeadlineManager) {
                    console.log(`🔄 Refreshing headlines for language change to: ${lang}`);
                    // Clear headline cache and reinitialize
                    if (typeof headlineCache !== 'undefined') {
                        headlineCache.clear();
                    }
                    // Reset headline management system
                    if (typeof window.HeadlineManager.refreshHeadlinePools === 'function') {
                        window.HeadlineManager.refreshHeadlinePools();
                    }
                    // Reinitialize game to fetch new headlines
                    if (typeof initGame === 'function') {
                        initGame();
                    }
                }
            }
            
            return true;
        }
        return false;
    }

    // Get available languages with names
    getAvailableLanguages() {
        return [
            { code: 'en', name: 'English' },
            { code: 'ru', name: 'Русский' }
        ];
    }

    // Update UI with current language
    updateUI() {
        // This will be called when language changes
        // UI elements will be updated in their respective modules
        if (typeof updateLocalizedText === 'function') {
            updateLocalizedText();
        }
        if (typeof renderCrossword === 'function') {
            renderCrossword();
        }
        if (document.getElementById('headlineDescription')) {
            displayHeadlineDescription();
        }
    }
}

// Initialize localization manager
const i18n = new LocalizationManager();

// Make translate function globally available
function t(key) {
    return i18n.t(key);
}

// Make setLanguage function globally available
function setLanguage(lang) {
    return i18n.setLanguage(lang);
}

// Make i18n globally available
if (typeof window !== 'undefined') {
    window.i18n = i18n;
    window.t = t;
    window.setLanguage = setLanguage;
}
