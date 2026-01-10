// ===== POPUP SYSTEM =====
// Basic popup functionality for Headlines game

(function() {
'use strict';

// Helper function to use flog from debug.js
function _log(message, options = {}) {
    if (window.__cosic && typeof window.__cosic.flog === 'function') {
        window.__cosic.flog('popups', message, options);
    } else {
        // Fallback if debug.js not loaded yet
        console.log('[popups]', message);
    }
}

/**
 * Shows a popup with title, content, and buttons
 * @param {Object} options - Popup options
 * @param {string} options.title - Popup title
 * @param {string} options.content - Popup content (HTML allowed)
 * @param {Array} options.buttons - Array of button objects {text, action, class}
 * @param {boolean} options.closeOnBackdrop - Whether clicking backdrop closes popup
 * @returns {Promise} Resolves when popup is closed
 */
function showPopup(options) {
    return new Promise((resolve) => {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = options.isTutorial ? 'popup tutorial-popup' : 'popup';
        
        // Create content
        const content = document.createElement('div');
        content.className = 'popup-content';
        
        // Top section
        const top = document.createElement('div');
        top.className = 'popup-top';
        
        const topInner = document.createElement('div');
        topInner.className = 'popup-top-inner';
        
        const title = document.createElement('h2');
        title.className = 'popup-title';
        title.textContent = options.title || '';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'popup-close';
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', () => {
            closePopup();
        });
        
        topInner.appendChild(title);
        topInner.appendChild(closeBtn);
        top.appendChild(topInner);
        
        // Body
        const body = document.createElement('div');
        body.className = 'popup-body';
        body.innerHTML = options.content || '';
        
        // Footer
        const footer = document.createElement('div');
        footer.className = 'popup-footer';
        
        (options.buttons || []).forEach(btnOptions => {
            const btn = document.createElement('button');
            btn.className = `popup-button ${btnOptions.class || 'primary'}`;
            btn.textContent = btnOptions.text || 'OK';
            btn.addEventListener('click', () => {
                if (btnOptions.action) {
                    btnOptions.action();
                }
                closePopup();
            });
            footer.appendChild(btn);
        });
        
        // Assemble
        content.appendChild(top);
        content.appendChild(body);
        content.appendChild(footer);
        overlay.appendChild(content);
        
        // Add to body
        document.body.appendChild(overlay);
        
        // Show with animation
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
        // Handle backdrop click
        if (options.closeOnBackdrop !== false) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closePopup();
                }
            });
        }
        
        // Handle escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closePopup();
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        function closePopup() {
            overlay.classList.remove('visible');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                document.removeEventListener('keydown', escapeHandler);
                resolve();
            }, 300);
        }
    });
}

/**
 * Shows a simple alert popup
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @returns {Promise} Resolves when closed
 */
function showAlert(title, message) {
    return showPopup({
        title: title,
        content: `<p>${message}</p>`,
        buttons: [{ text: t('ui.ok') || 'OK' }]
    });
}

/**
 * Shows a confirmation popup
 * @param {string} title - Confirmation title
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback for confirm action
 * @param {Function} onCancel - Callback for cancel action
 * @returns {Promise} Resolves when closed
 */
function showConfirm(title, message, onConfirm, onCancel) {
    return showPopup({
        title: title,
        content: `<p>${message}</p>`,
        buttons: [
            { text: t('ui.cancel') || 'Cancel', action: onCancel, class: 'secondary' },
            { text: t('ui.ok') || 'OK', action: onConfirm, class: 'primary' }
        ]
    });
}

// Expose functions globally for testing and external use
if (typeof window !== 'undefined') {
    window.showPopup = showPopup;
    window.showAlert = showAlert;
    window.showConfirm = showConfirm;
}

})();