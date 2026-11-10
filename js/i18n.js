// i18n.js - Internationalization module
// Currently a passthrough stub. Replace with full implementation when translations are ready.
//
// Usage:
//   i18n.t('search.placeholder')  → returns the key as-is (passthrough)
//
// Future: Load locale JSON files and replace t() with a real lookup.

(function () {
    const _translations = {};
    let _locale = 'en';

    window.i18n = {
        /**
         * Translate a key. Returns the key itself if no translation found.
         * @param {string} key - Translation key (e.g. 'nav.home')
         * @param {Object} [params] - Optional interpolation params (e.g. { name: 'Anna' })
         * @returns {string}
         */
        t: function (key, params) {
            let text = (_translations[_locale] && _translations[_locale][key]) || key;
            if (params) {
                Object.keys(params).forEach(function (k) {
                    text = text.replace(new RegExp('{{' + k + '}}', 'g'), params[k]);
                });
            }
            return text;
        },

        /**
         * Set the active locale.
         * @param {string} locale - e.g. 'en', 'ta', 'hi'
         */
        setLocale: function (locale) {
            _locale = locale;
        },

        /**
         * Get the current locale.
         * @returns {string}
         */
        getLocale: function () {
            return _locale;
        },

        /**
         * Load a translations object for a locale.
         * @param {string} locale
         * @param {Object} translations
         */
        load: function (locale, translations) {
            _translations[locale] = Object.assign(_translations[locale] || {}, translations);
        }
    };
})();
