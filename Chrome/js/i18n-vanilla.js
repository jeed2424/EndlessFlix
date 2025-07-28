/**
 * Vanilla JavaScript Internationalization Suite
 *
 * Label any element that needs to be internationalized with the class "i18n". Then the id of the element should
 * correspond to the _locales/lang/messages.json top level key, and will be replaced with that key's message.
 *
 * For placeholder text, use class "i18n-placeholder" and the id should correspond to the messages.json key.
 *
 * If the language lookup fails, it defaults to the english string embedded within the HTML
 */

document.addEventListener('DOMContentLoaded', function() {
    // Handle text content internationalization
    const i18nElements = document.querySelectorAll('.i18n');
    i18nElements.forEach(function(element) {
        try {
            const messageKey = element.getAttribute('id');
            if (messageKey && chrome.i18n && chrome.i18n.getMessage) {
                const localizedText = chrome.i18n.getMessage(messageKey);
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
            if (messageKey && chrome.i18n && chrome.i18n.getMessage) {
                const localizedPlaceholder = chrome.i18n.getMessage(messageKey);
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