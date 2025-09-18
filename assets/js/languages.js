/**
 * Flow Languages Configuration
 * Comprehensive list of languages for consistent selection across the site
 * Structured for easy translation and localization support
 */

window.FlowLanguages = {
  // Primary supported languages (fully translated)
  primary: [
    {
      code: 'en',
      name: 'English',
      native: 'English',
      region: 'Global',
      direction: 'ltr',
      priority: 1,
      supported: true
    },
    {
      code: 'fr',
      name: 'French',
      native: 'Français',
      region: 'West/Central Africa',
      direction: 'ltr',
      priority: 2,
      supported: true
    },
    {
      code: 'ar',
      name: 'Arabic',
      native: 'العربية',
      region: 'North Africa',
      direction: 'rtl',
      priority: 3,
      supported: true
    },
    {
      code: 'sw',
      name: 'Swahili',
      native: 'Kiswahili',
      region: 'East Africa',
      direction: 'ltr',
      priority: 4,
      supported: true
    }
  ],

  // Secondary supported languages (partial translation)
  secondary: [
    {
      code: 'ha',
      name: 'Hausa',
      native: 'Hausa',
      region: 'West Africa',
      direction: 'ltr',
      priority: 5,
      supported: true
    },
    {
      code: 'yo',
      name: 'Yoruba',
      native: 'Yorùbá',
      region: 'West Africa',
      direction: 'ltr',
      priority: 6,
      supported: true
    },
    {
      code: 'ig',
      name: 'Igbo',
      native: 'Asụsụ Igbo',
      region: 'West Africa',
      direction: 'ltr',
      priority: 7,
      supported: true
    },
    {
      code: 'zu',
      name: 'Zulu',
      native: 'isiZulu',
      region: 'Southern Africa',
      direction: 'ltr',
      priority: 8,
      supported: true
    },
    {
      code: 'am',
      name: 'Amharic',
      native: 'አማርኛ',
      region: 'East Africa',
      direction: 'ltr',
      priority: 9,
      supported: true
    }
  ],

  // Additional African languages (planned for future support)
  extended: [
    // West Africa
    {
      code: 'ak',
      name: 'Akan',
      native: 'Akan',
      region: 'West Africa',
      direction: 'ltr',
      priority: 10,
      supported: false,
      country: 'Ghana'
    },
    {
      code: 'tw',
      name: 'Twi',
      native: 'Twi',
      region: 'West Africa',
      direction: 'ltr',
      priority: 11,
      supported: false,
      country: 'Ghana'
    },
    {
      code: 'wo',
      name: 'Wolof',
      native: 'Wolof',
      region: 'West Africa',
      direction: 'ltr',
      priority: 12,
      supported: false,
      country: 'Senegal'
    },
    {
      code: 'ff',
      name: 'Fulani',
      native: 'Fulfulde',
      region: 'West Africa',
      direction: 'ltr',
      priority: 13,
      supported: false,
      country: 'Multiple'
    },
    {
      code: 'bm',
      name: 'Bambara',
      native: 'Bamanankan',
      region: 'West Africa',
      direction: 'ltr',
      priority: 14,
      supported: false,
      country: 'Mali'
    },
    
    // East Africa
    {
      code: 'om',
      name: 'Oromo',
      native: 'Oromoo',
      region: 'East Africa',
      direction: 'ltr',
      priority: 15,
      supported: false,
      country: 'Ethiopia'
    },
    {
      code: 'ti',
      name: 'Tigrinya',
      native: 'ትግርኛ',
      region: 'East Africa',
      direction: 'ltr',
      priority: 16,
      supported: false,
      country: 'Ethiopia/Eritrea'
    },
    {
      code: 'so',
      name: 'Somali',
      native: 'Soomaali',
      region: 'East Africa',
      direction: 'ltr',
      priority: 17,
      supported: false,
      country: 'Somalia'
    },
    {
      code: 'rw',
      name: 'Kinyarwanda',
      native: 'Ikinyarwanda',
      region: 'East Africa',
      direction: 'ltr',
      priority: 18,
      supported: false,
      country: 'Rwanda'
    },
    {
      code: 'rn',
      name: 'Kirundi',
      native: 'Kirundi',
      region: 'East Africa',
      direction: 'ltr',
      priority: 19,
      supported: false,
      country: 'Burundi'
    },
    {
      code: 'lg',
      name: 'Luganda',
      native: 'Oluganda',
      region: 'East Africa',
      direction: 'ltr',
      priority: 20,
      supported: false,
      country: 'Uganda'
    },
    
    // Southern Africa
    {
      code: 'xh',
      name: 'Xhosa',
      native: 'isiXhosa',
      region: 'Southern Africa',
      direction: 'ltr',
      priority: 21,
      supported: false,
      country: 'South Africa'
    },
    {
      code: 'af',
      name: 'Afrikaans',
      native: 'Afrikaans',
      region: 'Southern Africa',
      direction: 'ltr',
      priority: 22,
      supported: false,
      country: 'South Africa'
    },
    {
      code: 'st',
      name: 'Sesotho',
      native: 'Sesotho',
      region: 'Southern Africa',
      direction: 'ltr',
      priority: 23,
      supported: false,
      country: 'Lesotho'
    },
    {
      code: 'ts',
      name: 'Tsonga',
      native: 'Xitsonga',
      region: 'Southern Africa',
      direction: 'ltr',
      priority: 24,
      supported: false,
      country: 'South Africa'
    },
    {
      code: 'tn',
      name: 'Tswana',
      native: 'Setswana',
      region: 'Southern Africa',
      direction: 'ltr',
      priority: 25,
      supported: false,
      country: 'Botswana'
    },
    {
      code: 'sn',
      name: 'Shona',
      native: 'chiShona',
      region: 'Southern Africa',
      direction: 'ltr',
      priority: 26,
      supported: false,
      country: 'Zimbabwe'
    },
    {
      code: 'nd',
      name: 'Ndebele',
      native: 'isiNdebele',
      region: 'Southern Africa',
      direction: 'ltr',
      priority: 27,
      supported: false,
      country: 'Zimbabwe'
    },
    
    // Central Africa
    {
      code: 'ln',
      name: 'Lingala',
      native: 'Lingála',
      region: 'Central Africa',
      direction: 'ltr',
      priority: 28,
      supported: false,
      country: 'DRC/Congo'
    },
    {
      code: 'kg',
      name: 'Kongo',
      native: 'Kikongo',
      region: 'Central Africa',
      direction: 'ltr',
      priority: 29,
      supported: false,
      country: 'DRC/Angola'
    },
    {
      code: 'sg',
      name: 'Sango',
      native: 'Sängö',
      region: 'Central Africa',
      direction: 'ltr',
      priority: 30,
      supported: false,
      country: 'Central African Republic'
    },
    
    // North Africa (additional)
    {
      code: 'ber',
      name: 'Berber',
      native: 'Tamaziɣt',
      region: 'North Africa',
      direction: 'ltr',
      priority: 31,
      supported: false,
      country: 'Morocco/Algeria'
    },
    
    // International languages commonly used in Africa
    {
      code: 'pt',
      name: 'Portuguese',
      native: 'Português',
      region: 'Lusophone Africa',
      direction: 'ltr',
      priority: 32,
      supported: false,
      country: 'Angola/Mozambique'
    },
    {
      code: 'es',
      name: 'Spanish',
      native: 'Español',
      region: 'Equatorial Guinea',
      direction: 'ltr',
      priority: 33,
      supported: false,
      country: 'Equatorial Guinea'
    }
  ],

  // Utility functions
  utils: {
    // Get all supported languages (primary + secondary)
    getSupportedLanguages: function() {
      return [...window.FlowLanguages.primary, ...window.FlowLanguages.secondary];
    },

    // Get all languages including planned ones
    getAllLanguages: function() {
      return [
        ...window.FlowLanguages.primary, 
        ...window.FlowLanguages.secondary, 
        ...window.FlowLanguages.extended
      ];
    },

    // Get languages by region
    getLanguagesByRegion: function(region) {
      const all = this.getAllLanguages();
      return all.filter(lang => lang.region === region);
    },

    // Get language by code
    getLanguageByCode: function(code) {
      const all = this.getAllLanguages();
      return all.find(lang => lang.code === code);
    },

    // Get languages sorted by priority
    getLanguagesByPriority: function(supportedOnly = false) {
      const langs = supportedOnly ? this.getSupportedLanguages() : this.getAllLanguages();
      return langs.sort((a, b) => a.priority - b.priority);
    },

    // Check if language is RTL
    isRTL: function(code) {
      const lang = this.getLanguageByCode(code);
      return lang ? lang.direction === 'rtl' : false;
    },

    // Generate options for HTML select elements
    generateSelectOptions: function(supportedOnly = true, includeRegionGroups = false) {
      const languages = supportedOnly ? this.getSupportedLanguages() : this.getAllLanguages();
      
      if (!includeRegionGroups) {
        return languages
          .sort((a, b) => a.priority - b.priority)
          .map(lang => ({
            value: lang.code,
            text: `${lang.name} (${lang.native})${lang.supported ? '' : ' - Coming Soon'}`,
            disabled: !lang.supported
          }));
      }

      // Group by region
      const regions = [...new Set(languages.map(lang => lang.region))];
      const grouped = [];
      
      regions.forEach(region => {
        const regionLangs = languages
          .filter(lang => lang.region === region)
          .sort((a, b) => a.priority - b.priority);
        
        grouped.push({
          optgroup: region,
          options: regionLangs.map(lang => ({
            value: lang.code,
            text: `${lang.name} (${lang.native})${lang.supported ? '' : ' - Coming Soon'}`,
            disabled: !lang.supported
          }))
        });
      });
      
      return grouped;
    },

    // Get default language
    getDefaultLanguage: function() {
      return window.FlowLanguages.primary[0]; // English
    },

    // Detect browser language preference
    detectBrowserLanguage: function() {
      const browserLang = navigator.language || navigator.languages[0];
      const langCode = browserLang.split('-')[0].toLowerCase();
      
      const supportedLang = this.getSupportedLanguages().find(lang => lang.code === langCode);
      return supportedLang || this.getDefaultLanguage();
    }
  }
};

// Auto-detect and set initial language preference
document.addEventListener('DOMContentLoaded', function() {
  const detectedLang = window.FlowLanguages.utils.detectBrowserLanguage();
  
  // Set initial language in localStorage if not already set
  if (!localStorage.getItem('flowLanguage')) {
    localStorage.setItem('flowLanguage', detectedLang.code);
  }
});

// Export for CommonJS environments (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.FlowLanguages;
}