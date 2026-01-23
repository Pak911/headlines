// Localization Manager
// Handles language detection, storage, and translation

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('i18n', message, options);
    } else {
        // Fallback if debug.js not loaded yet
        console.log('[i18n]', message);
    }
}

class LocalizationManager {
    constructor() {
        this.languages = {
            'en': en,
            'ru': ru,
            'pt': pt
        };
        this.defaultLanguage = 'en';
        this.currentLanguage = this.detectLanguage();
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
        } else if (browserLang.startsWith('pt')) {
            return 'pt'; // Covers pt-BR, pt-PT, etc.
        }
        
        // Check if we have the exact language
        if (this.languages[browserLang]) {
            return browserLang;
        }
        
        // Default to English
        return this.defaultLanguage;
    }

    // Initialize localization system
    async init() {
        // Check platform storage for saved language
        if (typeof Platform !== 'undefined' && Platform.isAvailable() && Platform.loadGameLanguage) {
            const savedLanguage = await Platform.loadGameLanguage();
            if (savedLanguage && this.languages[savedLanguage]) {
                this.currentLanguage = savedLanguage;
            }
        }
        
        // Set HTML lang attribute
        document.documentElement.lang = this.currentLanguage;
    }

    // Get translation for a key with optional pluralization
    t(key, count = null) {
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
        
        // Handle pluralization if count is provided and value is an object with plural forms
        if (count !== null && typeof value === 'object' && value !== null) {
            const pluralForm = this.getPluralForm(this.currentLanguage, count);
            
            // Try the current language's plural form first
            if (value[pluralForm]) {
                value = value[pluralForm];
            } else {
                // If current language's plural form doesn't exist, try smart fallbacks
                // When English rules ('other') don't exist, try Slavic forms ('few', 'many', 'one')
                if (pluralForm === 'other') {
                    if (count === 1 && value['one']) {
                        // Singular form
                        value = value['one'];
                    } else if (count !== 1 && value['few']) {
                        // Few form (covers 2-4, and 22-24, 32-34, etc.)
                        value = value['few'];
                    } else if (count !== 1 && value['many']) {
                        // Many form (covers 0, 5-20, 25-30, etc.)
                        value = value['many'];
                    } else if (value['other']) {
                        // Fallback to English 'other'
                        value = value['other'];
                    } else {
                        // Last resort: use first available form
                        const keys = Object.keys(value);
                        value = keys.length > 0 ? value[keys[0]] : key;
                    }
                } else if (value['other']) {
                    // Standard fallback to 'other' for other languages
                    value = value['other'];
                } else {
                    // Last resort: use first available form
                    const keys = Object.keys(value);
                    value = keys.length > 0 ? value[keys[0]] : key;
                }
            }
        }
        
        // If value is still an object (plural forms object), use default 'other' or first available
        if (typeof value === 'object' && value !== null) {
            if (value['other']) {
                value = value['other'];
            } else {
                const keys = Object.keys(value);
                value = keys.length > 0 ? value[keys[0]] : key;
            }
        }
        
        return value || key; // Return key if no translation found
    }

    // Get plural form based on language and count
    getPluralForm(language, count) {
        if (language === 'ru') {
            return this.getRussianPluralForm(count);
        } else {
            // Default to English plural rules
            return count === 1 ? 'one' : 'other';
        }
    }

    // Russian pluralization rules
    getRussianPluralForm(count) {
        const mod10 = count % 10;
        const mod100 = count % 100;
        
        if (mod100 >= 11 && mod100 <= 19) {
            return 'many'; // 11-19
        } else if (mod10 === 1) {
            return 'one'; // ends with 1 (except 11-19)
        } else if (mod10 >= 2 && mod10 <= 4) {
            return 'few'; // ends with 2-4 (except 12-14)
        } else {
            return 'many'; // ends with 0, 5-9, or 11-19
        }
    }

    // Change language
    async setLanguage(lang) {
        if (this.languages[lang]) {
            this.currentLanguage = lang;
            
            // Save to platform system
            if (typeof Platform !== 'undefined' && Platform.saveGameLanguage) {
                await Platform.saveGameLanguage(lang);
            }
            
            document.documentElement.lang = lang;
            this.updateUI();
            
            // Refresh headline management system if RSS language is set to auto
            if (typeof rssLanguageConfig !== 'undefined' && rssLanguageConfig.rssLanguage === 'auto') {
                if (typeof window !== 'undefined' && window.HeadlineManager) {
                    _log(`🔄 Refreshing headlines for language change to: ${lang}`);
                    // Reset headline management system
                    if (typeof window.HeadlineManager.refreshHeadlinePools === 'function') {
                        window.HeadlineManager.refreshHeadlinePools(true);
                    }
                    // Reinitialize game to fetch new headlines
                    if (typeof enhancedInitGame === 'function') {
                        enhancedInitGame();
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
            { code: 'ru', name: 'Русский' },
            { code: 'pt', name: 'Português' }
        ];
    }

    // Get current RSS language (respects rssLanguageConfig, falls back to UI language)
    getCurrentRSSLanguage() {
        // Check RSS language configuration first
        if (typeof rssLanguageConfig !== 'undefined' && rssLanguageConfig.rssLanguage) {
            const configLang = rssLanguageConfig.rssLanguage;
            
            // If set to 'auto', use current UI language
            if (configLang === 'auto') {
                return this.currentLanguage;
            }
            
            // Otherwise use the configured language
            return configLang;
        }
        
        // Fallback to current UI language
        return this.currentLanguage;
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
function t(key, count = null) {
    return i18n.t(key, count);
}

// Make setLanguage function globally available
async function setLanguage(lang) {
    return await i18n.setLanguage(lang);
}

// Make i18n globally available
if (typeof window !== 'undefined') {
    window.i18n = i18n;
    window.t = t;
    window.setLanguage = setLanguage;
}

})();
