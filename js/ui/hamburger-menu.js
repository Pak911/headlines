// ===== HAMBURGER MENU =====
// Side menu functionality for Headlines game

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('menu', message, options);
    } else {
        console.log('[menu]', message);
    }
}

class HamburgerMenu {
    constructor() {
        this.overlay = null;
        this.isOpen = false;
    }

    /**
     * Initialize the hamburger menu
     */
    init() {
        this.overlay = document.getElementById('menuOverlay');
        const menuClose = document.getElementById('menuClose');
        
        if (!this.overlay) {
            console.error('Menu overlay not found');
            return;
        }
        
        // Close button
        if (menuClose) {
            menuClose.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
                this.close();
            });
        }
        
        // Close on backdrop click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        // Menu item handlers
        this.initMenuItems();
        
        _log('Hamburger menu initialized');
    }

    /**
     * Initialize menu item click handlers
     */
    initMenuItems() {
        // Language dropdown
        this.initLanguageDropdown();
        
        // Difficulty dropdown
        this.initDifficultyDropdown();
        
        // Statistics
        const statisticsItem = document.getElementById('menuStatistics');
        if (statisticsItem) {
            statisticsItem.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
                _log('Statistics menu item clicked - TODO: implement statistics view');
                // TODO: Implement statistics view
            });
        }
        
        // Sound toggle
        const soundItem = document.getElementById('menuSound');
        const soundToggle = document.getElementById('menuSoundToggle');
        if (soundItem && soundToggle) {
            soundItem.addEventListener('click', (e) => {
                window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
                e.stopPropagation();
                // Toggle visual state immediately
                soundToggle.classList.toggle('active');
                // Ensure sound manager is initialized
                window.__headlines_sound;
                // Dispatch sound toggle event
                window.dispatchEvent(new CustomEvent('headlines:soundToggle'));
                
                // Dispatch analytics event for sound setting change
                const isEnabled = soundToggle.classList.contains('active');
                window.dispatchEvent(new CustomEvent('headlines:soundSettingChanged', {
                    detail: { enabled: isEnabled }
                }));
            });
        }
        
        // Help
        const helpItem = document.getElementById('menuHelp');
        if (helpItem) {
            helpItem.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
                _log('Help menu item clicked');
                this.close();
                // Show tutorial popup
                if (window.HeadlinesTutorial && typeof window.HeadlinesTutorial.showWelcomeTutorial === 'function') {
                    window.HeadlinesTutorial.showWelcomeTutorial();
                }
            });
        }
        
        // Give Up
        const giveUpItem = document.getElementById('menuGiveUp');
        if (giveUpItem) {
            giveUpItem.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
                _log('Give Up/Next Puzzle menu item clicked');
                this.close();
                
                // Check if puzzle is solved (item is in Next Puzzle mode)
                if (giveUpItem.classList.contains('next-puzzle-mode')) {
                    // Call next headline function
                    if (typeof skipToNextHeadline === 'function') {
                        skipToNextHeadline();
                    }
                } else {
                    // Call give up function
                    if (typeof giveUp === 'function') {
                        giveUp();
                    }
                }
            });
        }
        
        // Create Own Puzzle
        const createOwnPuzzleItem = document.getElementById('menuCreateOwnPuzzle');
        if (createOwnPuzzleItem) {
            createOwnPuzzleItem.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
                _log('Create Own Puzzle menu item clicked');
                this.close();
                // Open create-puzzle.html in new tab
                window.open('create-puzzle.html', '_blank');
            });
        }
    }
    
    /**
     * Switch Give Up item to Next Puzzle mode
     */
    switchToNextPuzzleMode() {
        const giveUpItem = document.getElementById('menuGiveUp');
        if (!giveUpItem) return;
        
        // Add mode class and remove danger class
        giveUpItem.classList.add('next-puzzle-mode');
        giveUpItem.classList.remove('danger');
        
        // Update icon to fast-forward icon (same as toolbar button)
        const icon = giveUpItem.querySelector('.menu-item-icon svg');
        if (icon) {
            icon.innerHTML = '<path d="M6 6l6 6-6 6V6z"/><path d="M13 6l6 6-6 6V6z"/>';
        }
        
        // Update label
        const label = document.getElementById('menuGiveUpLabel');
        if (label && typeof t !== 'undefined') {
            label.textContent = t('menu.nextPuzzle');
            label.style.color = ''; // Reset to default color
        }
        
        // Update description
        const value = document.getElementById('menuGiveUpValue');
        if (value && typeof t !== 'undefined') {
            value.textContent = t('menu.nextPuzzleDescription');
        }
        
        _log('Switched Give Up item to Next Puzzle mode');
    }
    
    /**
     * Switch Next Puzzle item back to Give Up mode
     */
    switchToGiveUpMode() {
        const giveUpItem = document.getElementById('menuGiveUp');
        if (!giveUpItem) return;
        
        // Remove mode class and add danger class back
        giveUpItem.classList.remove('next-puzzle-mode');
        giveUpItem.classList.add('danger');
        
        // Update icon back to X icon
        const icon = giveUpItem.querySelector('.menu-item-icon svg');
        if (icon) {
            icon.innerHTML = '<path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>';
        }
        
        // Update label
        const label = document.getElementById('menuGiveUpLabel');
        if (label && typeof t !== 'undefined') {
            label.textContent = t('menu.giveUp');
        }
        
        // Update description
        const value = document.getElementById('menuGiveUpValue');
        if (value && typeof t !== 'undefined') {
            value.textContent = t('menu.giveUpDescription');
        }
        
        _log('Switched Next Puzzle item back to Give Up mode');
    }

    /**
     * Open the menu
     */
    open() {
        if (!this.overlay) return;
        
        this.isOpen = true;
        this.overlay.classList.add('visible');
        this.updateMenuValues();
        this.updateSoundToggleState();
        
        _log('Menu opened');
    }

    /**
     * Close the menu
     */
    close() {
        if (!this.overlay) return;
        
        this.isOpen = false;
        this.overlay.classList.remove('visible');
        
        _log('Menu closed');
    }

    /**
     * Toggle the menu
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Update menu values to reflect current state
     */
    updateMenuValues() {
        // Update language value
        const languageValue = document.getElementById('menuLanguageText');
        if (languageValue && typeof i18n !== 'undefined') {
            const currentLang = i18n.currentLanguage;
            const displayName = currentLang === 'ru' ? 'Русский' : 'English';
            _log(`Language dropdown: current i18n language = '${currentLang}', setting display to '${displayName}'`);
            languageValue.textContent = displayName;
            
            // Also update the selected state of dropdown options
            if (this.languageDropdown) {
                this.languageDropdown.querySelectorAll('.menu-dropdown-option').forEach(option => {
                    option.classList.toggle('selected', option.dataset.langCode === currentLang);
                });
            }
        }
        
        // Update difficulty name and description
        const difficultyText = document.getElementById('menuDifficultyText');
        const difficultyValue = document.getElementById('menuDifficultyValue');
        if (difficultyText && difficultyValue && typeof currentDifficulty !== 'undefined' && typeof t !== 'undefined') {
            difficultyText.textContent = t(`difficulty.${currentDifficulty}.name`);
            difficultyValue.textContent = t(`difficulty.${currentDifficulty}.description`);
            
            // Also update the selected state of difficulty dropdown options
            if (this.difficultyDropdown) {
                this.difficultyDropdown.querySelectorAll('.menu-dropdown-option').forEach(option => {
                    option.classList.toggle('selected', option.dataset.difficultyId === currentDifficulty);
                });
            }
        }
    }
    
    /**
     * Update sound toggle state to reflect current sound manager state
     */
    updateSoundToggleState() {
        const soundToggle = document.getElementById('menuSoundToggle');
        if (soundToggle && window.__headlines_sound) {
            soundToggle.classList.toggle('active', window.__headlines_sound.enabled);
        }
    }
    
    /**
     * Update difficulty dropdown text when language changes
     */
    updateDifficultyDropdownLanguage() {
        if (!this.difficultyDropdown) return;
        
        this.difficultyDropdown.querySelectorAll('.menu-dropdown-option').forEach(option => {
            const diffId = option.dataset.difficultyId;
            const optionText = option.querySelector('.menu-dropdown-option-text');
            if (optionText && diffId && typeof t !== 'undefined') {
                const name = t(`difficulty.${diffId}.name`);
                const description = t(`difficulty.${diffId}.description`);
                optionText.textContent = `${name} - ${description}`;
            }
        });
    }

    /**
     * Update menu text when language changes
     */
    updateLanguage() {
        const menuTitle = document.getElementById('menuTitle');
        if (menuTitle) {
            menuTitle.textContent = t('menu.title');
        }
        
        const menuLanguageLabel = document.getElementById('menuLanguageLabel');
        if (menuLanguageLabel) {
            menuLanguageLabel.textContent = t('menu.language');
        }
        
        const menuDifficultyLabel = document.getElementById('menuDifficultyLabel');
        if (menuDifficultyLabel) {
            menuDifficultyLabel.textContent = t('menu.difficulty');
        }
        
        const menuStatisticsLabel = document.getElementById('menuStatisticsLabel');
        if (menuStatisticsLabel) {
            menuStatisticsLabel.textContent = t('menu.statistics');
        }
        
        const menuSoundLabel = document.getElementById('menuSoundLabel');
        if (menuSoundLabel) {
            menuSoundLabel.textContent = t('menu.sound');
        }
        
        const menuHelpLabel = document.getElementById('menuHelpLabel');
        if (menuHelpLabel) {
            menuHelpLabel.textContent = t('menu.help');
        }
        
        const menuGiveUpLabel = document.getElementById('menuGiveUpLabel');
        if (menuGiveUpLabel) {
            menuGiveUpLabel.textContent = t('menu.giveUp');
        }
        
        const menuGiveUpValue = document.getElementById('menuGiveUpValue');
        if (menuGiveUpValue) {
            menuGiveUpValue.textContent = t('menu.giveUpDescription');
        }
        
        const menuCreateOwnPuzzleLabel = document.getElementById('menuCreateOwnPuzzleLabel');
        if (menuCreateOwnPuzzleLabel) {
            menuCreateOwnPuzzleLabel.textContent = t('menu.createOwnPuzzle');
        }
        
        const menuCreateOwnPuzzleValue = document.getElementById('menuCreateOwnPuzzleValue');
        if (menuCreateOwnPuzzleValue) {
            menuCreateOwnPuzzleValue.textContent = t('menu.createOwnPuzzleDescription');
        }
        
        // Update difficulty dropdown language
        this.updateDifficultyDropdownLanguage();
        
        // Update values as well
        this.updateMenuValues();
    }
    
    /**
     * Initialize language dropdown
     */
    initLanguageDropdown() {
        const languageItem = document.getElementById('menuLanguage');
        const languageText = document.getElementById('menuLanguageText');
        
        if (!languageItem || !languageText) return;
        
        // Create dropdown panel
        const dropdownPanel = document.createElement('div');
        dropdownPanel.className = 'menu-dropdown-panel';
        dropdownPanel.id = 'languageDropdownPanel';
        
        // Language options
        const languages = [
            { code: 'en', name: 'English' },
            { code: 'ru', name: 'Русский' }
        ];
        
        languages.forEach(lang => {
            const option = document.createElement('div');
            option.className = 'menu-dropdown-option';
            option.dataset.langCode = lang.code;
            
            const optionText = document.createElement('span');
            optionText.className = 'menu-dropdown-option-text';
            optionText.textContent = lang.name;
            option.appendChild(optionText);
            
            const checkIcon = document.createElement('div');
            checkIcon.className = 'menu-dropdown-check';
            checkIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
            option.appendChild(checkIcon);
            
            // Mark current language as selected
            if (typeof i18n !== 'undefined' && lang.code === i18n.currentLanguage) {
                option.classList.add('selected');
            }
            
            option.addEventListener('click', (e) => {
                window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
                e.stopPropagation();
                this.selectLanguage(lang.code, lang.name);
                this.closeLanguageDropdown();
            });
            
            dropdownPanel.appendChild(option);
        });
        
        // Append to body
        document.body.appendChild(dropdownPanel);
        
        // Click handler for language item
        languageItem.addEventListener('click', (e) => {
            window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
            e.stopPropagation();
            if (languageItem.classList.contains('open')) {
                this.closeLanguageDropdown();
            } else {
                this.closeDifficultyDropdown(); // Close other dropdown
                this.openLanguageDropdown();
            }
        });
        
        // Store references
        this.languageDropdown = dropdownPanel;
        this.languageItem = languageItem;
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (languageItem.classList.contains('open') && 
                !languageItem.contains(e.target) && 
                !dropdownPanel.contains(e.target)) {
                this.closeLanguageDropdown();
            }
        });
    }
    
    /**
     * Open language dropdown
     */
    openLanguageDropdown() {
        if (!this.languageItem || !this.languageDropdown) return;
        
        this.languageItem.classList.add('open');
        
        // Position dropdown
        const rect = this.languageItem.getBoundingClientRect();
        const dropdownSelect = this.languageItem.querySelector('.menu-dropdown-select');
        const selectRect = dropdownSelect ? dropdownSelect.getBoundingClientRect() : rect;
        
        this.languageDropdown.style.right = `${window.innerWidth - selectRect.right - 12}px`;
        this.languageDropdown.style.top = `${selectRect.bottom}px`;
        
        this.languageDropdown.classList.add('visible');
        
        _log('Language dropdown opened');
    }
    
    /**
     * Close language dropdown
     */
    closeLanguageDropdown() {
        if (!this.languageItem || !this.languageDropdown) return;
        
        this.languageItem.classList.remove('open');
        this.languageDropdown.classList.remove('visible');
        
        _log('Language dropdown closed');
    }
    
    /**
     * Select a language
     */
    async selectLanguage(langCode, langName) {
        if (typeof i18n === 'undefined') return;
        
        const currentLang = i18n.currentLanguage;
        if (langCode === currentLang) return;
        
        _log(`Language changed to: ${langCode}`);
        
        // Update i18n
        i18n.setLanguage(langCode);
        
        // Update display text
        const languageText = document.getElementById('menuLanguageText');
        if (languageText) {
            languageText.textContent = langName;
        }
        
        // Update selected state in dropdown
        if (this.languageDropdown) {
            this.languageDropdown.querySelectorAll('.menu-dropdown-option').forEach(option => {
                option.classList.toggle('selected', option.dataset.langCode === langCode);
            });
        }
        
        // Save to platform
        if (typeof Platform !== 'undefined' && Platform.saveGameLanguage) {
            await Platform.saveGameLanguage(langCode);
        }
        
        // Dispatch analytics event
        window.dispatchEvent(new CustomEvent('headlines:languageChanged', {
            detail: { newLanguage: langCode }
        }));
        
        // Update all UI
        if (typeof updateLocalizedText === 'function') {
            updateLocalizedText();
        }
        this.updateLanguage();
    }
    
    /**
     * Initialize difficulty dropdown
     */
    initDifficultyDropdown() {
        const difficultyItem = document.getElementById('menuDifficulty');
        const difficultyText = document.getElementById('menuDifficultyText');
        
        if (!difficultyItem || !difficultyText) return;
        
        // Create dropdown panel
        const dropdownPanel = document.createElement('div');
        dropdownPanel.className = 'menu-dropdown-panel';
        dropdownPanel.id = 'difficultyDropdownPanel';
        
        // Difficulty options
        const difficulties = [
            { id: 'easy', key: 'difficulty.easy' },
            { id: 'mediumEasy', key: 'difficulty.mediumEasy' },
            { id: 'medium', key: 'difficulty.medium' },
            { id: 'mediumHard', key: 'difficulty.mediumHard' },
            { id: 'hard', key: 'difficulty.hard' }
        ];
        
        difficulties.forEach(diff => {
            const option = document.createElement('div');
            option.className = 'menu-dropdown-option';
            option.dataset.difficultyId = diff.id;
            
            const optionText = document.createElement('span');
            optionText.className = 'menu-dropdown-option-text';
            // Show "Name - Description" in dropdown
            if (typeof t !== 'undefined') {
                const name = t(`${diff.key}.name`);
                const description = t(`${diff.key}.description`);
                optionText.textContent = `${name} - ${description}`;
            } else {
                optionText.textContent = diff.id;
            }
            option.appendChild(optionText);
            
            const checkIcon = document.createElement('div');
            checkIcon.className = 'menu-dropdown-check';
            checkIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
            option.appendChild(checkIcon);
            
            // Mark current difficulty as selected
            if (typeof currentDifficulty !== 'undefined' && diff.id === currentDifficulty) {
                option.classList.add('selected');
            }
            
            option.addEventListener('click', (e) => {
                window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
                e.stopPropagation();
                this.selectDifficulty(diff.id);
                this.closeDifficultyDropdown();
            });
            
            dropdownPanel.appendChild(option);
        });
        
        // Append to body
        document.body.appendChild(dropdownPanel);
        
        // Click handler for difficulty item
        difficultyItem.addEventListener('click', (e) => {
            window.dispatchEvent(new CustomEvent('headlines:buttonPress'));
            e.stopPropagation();
            if (difficultyItem.classList.contains('open')) {
                this.closeDifficultyDropdown();
            } else {
                this.closeLanguageDropdown(); // Close other dropdown
                this.openDifficultyDropdown();
            }
        });
        
        // Store references
        this.difficultyDropdown = dropdownPanel;
        this.difficultyItem = difficultyItem;
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (difficultyItem.classList.contains('open') && 
                !difficultyItem.contains(e.target) && 
                !dropdownPanel.contains(e.target)) {
                this.closeDifficultyDropdown();
            }
        });
    }
    
    /**
     * Open difficulty dropdown
     */
    openDifficultyDropdown() {
        if (!this.difficultyItem || !this.difficultyDropdown) return;
        
        this.difficultyItem.classList.add('open');
        
        // Position dropdown
        const rect = this.difficultyItem.getBoundingClientRect();
        const dropdownSelect = this.difficultyItem.querySelector('.menu-dropdown-select');
        const selectRect = dropdownSelect ? dropdownSelect.getBoundingClientRect() : rect;
        
        this.difficultyDropdown.style.right = `${window.innerWidth - selectRect.right - 12}px`;
        this.difficultyDropdown.style.top = `${selectRect.bottom}px`;
        
        this.difficultyDropdown.classList.add('visible');
        
        _log('Difficulty dropdown opened');
    }
    
    /**
     * Close difficulty dropdown
     */
    closeDifficultyDropdown() {
        if (!this.difficultyItem || !this.difficultyDropdown) return;
        
        this.difficultyItem.classList.remove('open');
        this.difficultyDropdown.classList.remove('visible');
        
        _log('Difficulty dropdown closed');
    }
    
    /**
     * Select a difficulty
     */
    selectDifficulty(difficultyId) {
        if (typeof currentDifficulty === 'undefined') return;
        
        if (difficultyId === currentDifficulty) return;
        
        _log(`Difficulty changed to: ${difficultyId}`);
        
        // Update global difficulty
        if (typeof changeDifficulty === 'function') {
            changeDifficulty(difficultyId);
        } else {
            window.currentDifficulty = difficultyId;
        }
        
        // Dispatch analytics event
        window.dispatchEvent(new CustomEvent('headlines:difficultyChanged', {
            detail: { newDifficulty: difficultyId }
        }));
        
        // Update display text - show only name
        const difficultyText = document.getElementById('menuDifficultyText');
        if (difficultyText && typeof t !== 'undefined') {
            difficultyText.textContent = t(`difficulty.${difficultyId}.name`);
        }
        
        // Update description text
        const difficultyValue = document.getElementById('menuDifficultyValue');
        if (difficultyValue && typeof t !== 'undefined') {
            difficultyValue.textContent = t(`difficulty.${difficultyId}.description`);
        }
        
        // Update selected state in dropdown
        if (this.difficultyDropdown) {
            this.difficultyDropdown.querySelectorAll('.menu-dropdown-option').forEach(option => {
                option.classList.toggle('selected', option.dataset.difficultyId === difficultyId);
            });
        }
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.HamburgerMenu = new HamburgerMenu();
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        window.HamburgerMenu.init();
    });
}

})();
