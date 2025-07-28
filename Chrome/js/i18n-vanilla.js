/**
 * Vanilla JavaScript Internationalization Suite - Cross-browser compatible
 *
 * Label any element that needs to be internationalized with the class "i18n". Then the id of the element should
 * correspond to the _locales/lang/messages.json top level key, and will be replaced with that key's message.
 *
 * For placeholder text, use class "i18n-placeholder" and the id should correspond to the messages.json key.
 *
 * If the language lookup fails, it defaults to the english string embedded within the HTML
 */

// Cross-browser compatibility layer
const browserTypeI18 = (() => {
    if (typeof browser !== 'undefined') {
        return browser; // Firefox
    } else if (typeof chrome !== 'undefined') {
        return chrome; // Chrome
    } else {
        throw new Error('Extension API not available');
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    // Handle text content internationalization
    const i18nElements = document.querySelectorAll('.i18n');
    i18nElements.forEach(function(element) {
        try {
            const messageKey = element.getAttribute('id');
            if (messageKey && browserTypeI18.i18n && browserTypeI18.i18n.getMessage) {
                const localizedText = browserTypeI18.i18n.getMessage(messageKey);
                if (localizedText) {
                    element.textContent = localizedText;
                }
            }
        } catch (err) {
            console.log('i18n error for element:', element);
            console.log('Error:', err);
        }
    });

    // Handle placeholder internationalization
    const i18nPlaceholderElements = document.querySelectorAll('.i18n-placeholder');
    i18nPlaceholderElements.forEach(function(element) {
        try {
            const messageKey = element.getAttribute('id');
            if (messageKey && browserTypeI18.i18n && browserTypeI18.i18n.getMessage) {
                const localizedPlaceholder = browserTypeI18.i18n.getMessage(messageKey);
                if (localizedPlaceholder) {
                    element.setAttribute('placeholder', localizedPlaceholder);
                }
            }
        } catch (err) {
            console.log('i18n placeholder error for element:', element);
            console.log('Error:', err);
        }
    });
});