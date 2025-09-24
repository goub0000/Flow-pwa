// Accessibility Enhancement Utility
// WCAG 2.1 AA compliance and accessibility improvements

/* eslint-env browser */

class AccessibilityEnhancer {
  constructor() {
    this.focusManager = new FocusManager();
    this.announcer = new ScreenReaderAnnouncer();
    this.contrastChecker = new ContrastChecker();
    this.keyboardNavigation = new KeyboardNavigation();

    this.init();
  }

  init() {
    console.log('♿ Initializing Accessibility Enhancements...');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.enhance());
    } else {
      this.enhance();
    }
  }

  enhance() {
    try {
      this.addAriaLabels();
      this.enhanceForms();
      this.setupKeyboardNavigation();
      this.improveColorContrast();
      this.addSkipLinks();
      this.enhanceModals();
      this.setupLiveRegions();
      this.addFocusIndicators();
      this.setupReducedMotion();

      console.log('✅ Accessibility enhancements applied');
    } catch (error) {
      console.error('❌ Accessibility enhancement failed:', error);
    }
  }

  // Add missing ARIA labels and descriptions
  addAriaLabels() {
    // Form inputs without labels
    const unlabeledInputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    unlabeledInputs.forEach(input => {
      const label = this.findAssociatedLabel(input);
      if (label) {
        input.setAttribute('aria-labelledby', label.id || this.generateId('label'));
        if (!label.id) label.id = input.getAttribute('aria-labelledby');
      } else {
        // Generate descriptive label from context
        const ariaLabel = this.generateAriaLabel(input);
        if (ariaLabel) {
          input.setAttribute('aria-label', ariaLabel);
        }
      }
    });

    // Buttons without accessible names
    const unlabeledButtons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    unlabeledButtons.forEach(button => {
      if (!button.textContent.trim()) {
        const icon = button.querySelector('[class*="icon"], svg, img');
        if (icon) {
          const ariaLabel = this.getIconAriaLabel(button, icon);
          button.setAttribute('aria-label', ariaLabel);
        }
      }
    });

    // Links without accessible names
    const unlabeledLinks = document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])');
    unlabeledLinks.forEach(link => {
      if (!link.textContent.trim() || link.textContent.trim() === 'Read more' || link.textContent.trim() === 'Click here') {
        const ariaLabel = this.generateLinkAriaLabel(link);
        if (ariaLabel) {
          link.setAttribute('aria-label', ariaLabel);
        }
      }
    });

    // Images without alt text
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    imagesWithoutAlt.forEach(img => {
      const altText = this.generateAltText(img);
      img.setAttribute('alt', altText);
    });
  }

  // Enhance form accessibility
  enhanceForms() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      // Add form role if not present
      if (!form.getAttribute('role')) {
        form.setAttribute('role', 'form');
      }

      // Add required field indicators
      const requiredFields = form.querySelectorAll('[required]');
      requiredFields.forEach(field => {
        field.setAttribute('aria-required', 'true');

        // Add visual indicator if not present
        const label = this.findAssociatedLabel(field);
        if (label && !label.querySelector('.required-indicator')) {
          const indicator = document.createElement('span');
          indicator.className = 'required-indicator';
          indicator.textContent = '*';
          indicator.setAttribute('aria-hidden', 'true');
          label.appendChild(indicator);
        }
      });

      // Add fieldsets for grouped fields
      this.groupRelatedFields(form);

      // Enhance error messages
      this.enhanceErrorMessages(form);
    });
  }

  // Setup comprehensive keyboard navigation
  setupKeyboardNavigation() {
    this.keyboardNavigation.init();

    // Custom keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Skip if user is typing in an input
      if (e.target.matches('input, textarea, [contenteditable]')) {
        return;
      }

      // Custom shortcuts
      switch (e.key) {
        case 'Escape':
          this.handleEscapeKey(e);
          break;
        case 'Tab':
          this.handleTabKey(e);
          break;
        case 'Enter':
        case ' ':
          this.handleActivationKeys(e);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowKeys(e);
          break;
      }
    });
  }

  // Improve color contrast
  improveColorContrast() {
    this.contrastChecker.checkAndFix();
  }

  // Add skip links for keyboard users
  addSkipLinks() {
    if (document.querySelector('.skip-links')) return; // Already exists

    const skipLinks = document.createElement('nav');
    skipLinks.className = 'skip-links';
    skipLinks.setAttribute('aria-label', 'Skip links');
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#search" class="skip-link">Skip to search</a>
    `;

    document.body.insertBefore(skipLinks, document.body.firstChild);

    // Add skip link styles
    this.addSkipLinkStyles();
  }

  // Enhance modal accessibility
  enhanceModals() {
    const modals = document.querySelectorAll('.modal, [role="dialog"]');

    modals.forEach(modal => {
      this.focusManager.setupModalFocusTrap(modal);

      // Add ARIA attributes
      if (!modal.getAttribute('role')) {
        modal.setAttribute('role', 'dialog');
      }

      if (!modal.getAttribute('aria-modal')) {
        modal.setAttribute('aria-modal', 'true');
      }

      // Find and associate title
      const title = modal.querySelector('h1, h2, h3, .modal-title, .dialog-title');
      if (title) {
        const titleId = title.id || this.generateId('modal-title');
        title.id = titleId;
        modal.setAttribute('aria-labelledby', titleId);
      }

      // Find and associate description
      const description = modal.querySelector('.modal-description, .dialog-description');
      if (description) {
        const descId = description.id || this.generateId('modal-desc');
        description.id = descId;
        modal.setAttribute('aria-describedby', descId);
      }
    });
  }

  // Setup live regions for dynamic content
  setupLiveRegions() {
    // Create announcement region if not exists
    if (!document.getElementById('announcement-region')) {
      const region = document.createElement('div');
      region.id = 'announcement-region';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      document.body.appendChild(region);
    }

    // Create status region if not exists
    if (!document.getElementById('status-region')) {
      const region = document.createElement('div');
      region.id = 'status-region';
      region.setAttribute('aria-live', 'assertive');
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      document.body.appendChild(region);
    }

    // Monitor form validation messages
    this.setupValidationAnnouncements();
  }

  // Add focus indicators
  addFocusIndicators() {
    const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex], [role="button"], [role="link"]');

    focusableElements.forEach(element => {
      element.addEventListener('focus', () => {
        element.classList.add('has-focus');
      });

      element.addEventListener('blur', () => {
        element.classList.remove('has-focus');
      });
    });

    // Add focus indicator styles
    this.addFocusIndicatorStyles();
  }

  // Setup reduced motion preferences
  setupReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleReducedMotion = () => {
      if (prefersReducedMotion.matches) {
        document.body.classList.add('reduce-motion');
        this.announcer.announce('Animations have been reduced based on your preferences');
      } else {
        document.body.classList.remove('reduce-motion');
      }
    };

    handleReducedMotion();
    prefersReducedMotion.addEventListener('change', handleReducedMotion);
  }

  // Helper methods

  findAssociatedLabel(input) {
    // Check for explicit label association
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return label;
    }

    // Check for implicit label association
    const label = input.closest('label');
    if (label) return label;

    // Check for aria-labelledby
    const labelledBy = input.getAttribute('aria-labelledby');
    if (labelledBy) {
      return document.getElementById(labelledBy);
    }

    return null;
  }

  generateAriaLabel(input) {
    const type = input.type || 'text';
    const name = input.name || '';
    const placeholder = input.placeholder || '';

    // Try to extract meaningful context
    const context = this.getElementContext(input);

    if (placeholder) {
      return placeholder;
    }

    if (name) {
      return this.humanizeString(name);
    }

    if (context) {
      return `${this.humanizeString(type)} in ${context}`;
    }

    return `${this.humanizeString(type)} field`;
  }

  getIconAriaLabel(button, icon) {
    // Common icon patterns
    const iconClass = icon.className;
    const iconPatterns = {
      'close': 'Close',
      'menu': 'Open menu',
      'search': 'Search',
      'edit': 'Edit',
      'delete': 'Delete',
      'save': 'Save',
      'cancel': 'Cancel',
      'back': 'Go back',
      'forward': 'Go forward',
      'play': 'Play',
      'pause': 'Pause',
      'stop': 'Stop'
    };

    for (const [pattern, label] of Object.entries(iconPatterns)) {
      if (iconClass.includes(pattern)) {
        return label;
      }
    }

    // Check button context
    const context = this.getElementContext(button);
    return context ? `Button in ${context}` : 'Button';
  }

  generateLinkAriaLabel(link) {
    const href = link.href;
    const context = this.getElementContext(link);

    if (href) {
      const url = new URL(href);
      if (url.hostname !== window.location.hostname) {
        return `${context || 'Link'} (external)`;
      }
    }

    return context || 'Link';
  }

  generateAltText(img) {
    const src = img.src;
    const className = img.className;

    // Logo images
    if (className.includes('logo')) {
      return 'Company logo';
    }

    // Avatar/profile images
    if (className.includes('avatar') || className.includes('profile')) {
      return 'Profile picture';
    }

    // Decorative images
    if (className.includes('decoration') || className.includes('background')) {
      return ''; // Decorative images should have empty alt
    }

    // Try to extract from filename
    if (src) {
      const filename = src.split('/').pop().split('.')[0];
      return this.humanizeString(filename);
    }

    return 'Image';
  }

  getElementContext(element) {
    // Try to find meaningful context from parent elements
    const contextSelectors = [
      '.card-title',
      '.section-title',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      '[data-section]',
      '.form-section'
    ];

    for (const selector of contextSelectors) {
      const contextElement = element.closest('*').querySelector(selector) ||
                            element.parentElement?.querySelector(selector);

      if (contextElement) {
        return contextElement.textContent.trim();
      }
    }

    return null;
  }

  humanizeString(str) {
    return str
      .replace(/[_-]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/^./, char => char.toUpperCase());
  }

  generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  groupRelatedFields(form) {
    // Group fields by common patterns
    const fieldGroups = new Map();

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const name = input.name;
      if (name) {
        const baseName = name.replace(/\[.*\]$/, ''); // Remove array notation
        if (!fieldGroups.has(baseName)) {
          fieldGroups.set(baseName, []);
        }
        fieldGroups.get(baseName).push(input);
      }
    });

    // Create fieldsets for groups with multiple fields
    fieldGroups.forEach((fields, groupName) => {
      if (fields.length > 1 && this.shouldGroupFields(fields)) {
        this.createFieldset(fields, this.humanizeString(groupName));
      }
    });
  }

  shouldGroupFields(fields) {
    // Only group if fields are related (e.g., address fields, name fields)
    const relatedPatterns = [
      /address|street|city|state|zip|postal/i,
      /first.*name|last.*name|middle.*name/i,
      /phone|mobile|tel/i,
      /birth|age|date/i
    ];

    const names = fields.map(field => field.name);
    return relatedPatterns.some(pattern =>
      names.some(name => pattern.test(name))
    );
  }

  createFieldset(fields, legend) {
    const firstField = fields[0];
    const fieldset = document.createElement('fieldset');
    const legendElement = document.createElement('legend');

    legendElement.textContent = legend;
    fieldset.appendChild(legendElement);

    // Move fields into fieldset
    const parent = firstField.parentNode;
    parent.insertBefore(fieldset, firstField);

    fields.forEach(field => {
      const label = this.findAssociatedLabel(field);
      if (label) {
        fieldset.appendChild(label);
      } else {
        fieldset.appendChild(field);
      }
    });
  }

  enhanceErrorMessages(form) {
    const errorElements = form.querySelectorAll('.error, .invalid, [aria-invalid="true"]');

    errorElements.forEach(element => {
      const errorMessage = element.querySelector('.error-message') ||
                          element.nextElementSibling?.classList.contains('error-message') ?
                          element.nextElementSibling : null;

      if (errorMessage) {
        const errorId = errorMessage.id || this.generateId('error');
        errorMessage.id = errorId;
        element.setAttribute('aria-describedby', errorId);
        errorMessage.setAttribute('role', 'alert');
      }
    });
  }

  setupValidationAnnouncements() {
    // Listen for validation messages
    document.addEventListener('invalid', (e) => {
      const field = e.target;
      const message = field.validationMessage;
      if (message) {
        this.announcer.announce(`${this.getFieldName(field)}: ${message}`);
      }
    }, true);
  }

  getFieldName(field) {
    const label = this.findAssociatedLabel(field);
    if (label) {
      return label.textContent.replace('*', '').trim();
    }
    return field.getAttribute('aria-label') || field.name || 'Field';
  }

  // Event handlers

  handleEscapeKey(e) {
    // Close modals
    const openModal = document.querySelector('.modal.is-open, [role="dialog"][aria-modal="true"]');
    if (openModal) {
      const closeButton = openModal.querySelector('.close, [data-dismiss]');
      if (closeButton) {
        closeButton.click();
      }
    }

    // Close dropdowns
    const openDropdown = document.querySelector('.dropdown.open, .menu.open');
    if (openDropdown) {
      openDropdown.classList.remove('open');
    }
  }

  handleTabKey(e) {
    // Ensure visible focus indicators
    document.body.classList.add('using-keyboard');

    // Remove on mouse interaction
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('using-keyboard');
    }, { once: true });
  }

  handleActivationKeys(e) {
    const target = e.target;

    // Handle custom interactive elements
    if (target.hasAttribute('role')) {
      const role = target.getAttribute('role');
      if (role === 'button' && !target.disabled) {
        e.preventDefault();
        target.click();
      }
    }
  }

  handleArrowKeys(e) {
    const target = e.target;

    // Handle menu navigation
    if (target.getAttribute('role') === 'menuitem') {
      this.handleMenuNavigation(e);
    }

    // Handle tab navigation
    if (target.getAttribute('role') === 'tab') {
      this.handleTabNavigation(e);
    }
  }

  handleMenuNavigation(e) {
    // Implementation for arrow key menu navigation
    const menu = e.target.closest('[role="menu"]');
    if (!menu) return;

    const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"]'));
    const currentIndex = menuItems.indexOf(e.target);

    let nextIndex;
    if (e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % menuItems.length;
    } else if (e.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
    } else {
      return;
    }

    e.preventDefault();
    menuItems[nextIndex].focus();
  }

  handleTabNavigation(e) {
    // Implementation for arrow key tab navigation
    const tabList = e.target.closest('[role="tablist"]');
    if (!tabList) return;

    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(e.target);

    let nextIndex;
    if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else {
      return;
    }

    e.preventDefault();
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  }

  // Styles

  addSkipLinkStyles() {
    const styles = `
      .skip-links {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 9999;
      }

      .skip-link {
        position: absolute;
        left: -9999px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
        background: #000;
        color: #fff;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 0 0 4px 4px;
      }

      .skip-link:focus {
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
      }
    `;

    this.addStyles(styles, 'skip-links');
  }

  addFocusIndicatorStyles() {
    const styles = `
      .using-keyboard *:focus {
        outline: 2px solid #005fcc;
        outline-offset: 2px;
      }

      .has-focus {
        box-shadow: 0 0 0 2px #005fcc;
      }

      /* High contrast focus indicators */
      @media (prefers-contrast: high) {
        .using-keyboard *:focus,
        .has-focus {
          outline: 3px solid;
          outline-offset: 3px;
        }
      }
    `;

    this.addStyles(styles, 'focus-indicators');
  }

  addStyles(css, id) {
    if (document.getElementById(id)) return;

    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }
}

// Focus management class
class FocusManager {
  setupModalFocusTrap(modal) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    });

    // Focus first element when modal opens
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (modal.classList.contains('is-open') || modal.style.display !== 'none') {
            setTimeout(() => firstFocusable.focus(), 100);
          }
        }
      });
    });

    observer.observe(modal, { attributes: true });
  }
}

// Screen reader announcer class
class ScreenReaderAnnouncer {
  constructor() {
    this.politeRegion = null;
    this.assertiveRegion = null;
    this.setupRegions();
  }

  setupRegions() {
    // Polite announcements
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.className = 'sr-only';
    document.body.appendChild(this.politeRegion);

    // Assertive announcements
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    document.body.appendChild(this.assertiveRegion);
  }

  announce(message, priority = 'polite') {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;

    region.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      region.textContent = '';
    }, 1000);
  }
}

// Contrast checker class
class ContrastChecker {
  checkAndFix() {
    // This would implement contrast checking and fixing
    // For now, we'll add high contrast mode support
    this.setupHighContrastMode();
  }

  setupHighContrastMode() {
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');

    const handleHighContrast = () => {
      if (prefersHighContrast.matches) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
    };

    handleHighContrast();
    prefersHighContrast.addEventListener('change', handleHighContrast);
  }
}

// Keyboard navigation class
class KeyboardNavigation {
  init() {
    this.setupRovingTabIndex();
    this.setupCustomComponents();
  }

  setupRovingTabIndex() {
    // Implementation for roving tabindex in complex widgets
    const widgets = document.querySelectorAll('[role="tablist"], [role="menu"], [role="listbox"]');

    widgets.forEach(widget => {
      const items = widget.querySelectorAll('[role="tab"], [role="menuitem"], [role="option"]');
      if (items.length === 0) return;

      // Set initial tabindex
      items.forEach((item, index) => {
        item.tabIndex = index === 0 ? 0 : -1;
      });

      // Handle arrow key navigation
      widget.addEventListener('keydown', (e) => {
        this.handleWidgetNavigation(e, items);
      });
    });
  }

  setupCustomComponents() {
    // Setup keyboard support for custom components
    const customButtons = document.querySelectorAll('[role="button"]:not(button)');

    customButtons.forEach(button => {
      button.tabIndex = 0;

      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });
  }

  handleWidgetNavigation(e, items) {
    const currentIndex = Array.from(items).findIndex(item => item.tabIndex === 0);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + items.length) % items.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();

    // Update tabindex
    items[currentIndex].tabIndex = -1;
    items[nextIndex].tabIndex = 0;
    items[nextIndex].focus();
  }
}

// Add screen reader only styles
const srOnlyStyles = `
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  .sr-only-focusable:focus {
    position: static !important;
    width: auto !important;
    height: auto !important;
    padding: inherit !important;
    margin: inherit !important;
    overflow: visible !important;
    clip: auto !important;
    white-space: inherit !important;
  }

  /* Required field indicator */
  .required-indicator {
    color: #d32f2f;
    margin-left: 4px;
  }

  /* Reduced motion styles */
  @media (prefers-reduced-motion: reduce) {
    .reduce-motion *,
    .reduce-motion *::before,
    .reduce-motion *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* High contrast styles */
  .high-contrast {
    filter: contrast(150%);
  }

  .high-contrast button,
  .high-contrast input,
  .high-contrast select,
  .high-contrast textarea {
    border: 2px solid;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = srOnlyStyles;
  document.head.appendChild(style);
}

// Initialize accessibility enhancer
let globalAccessibilityEnhancer;

if (typeof document !== 'undefined') {
  globalAccessibilityEnhancer = new AccessibilityEnhancer();

  // Re-run enhancements when new content is added
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        // Check if new content contains interactive elements
        const hasInteractiveContent = Array.from(mutation.addedNodes).some(node =>
          node.nodeType === Node.ELEMENT_NODE &&
          (node.matches('button, input, select, textarea, a, [role]') ||
           node.querySelector('button, input, select, textarea, a, [role]'))
        );

        if (hasInteractiveContent) {
          setTimeout(() => globalAccessibilityEnhancer.enhance(), 100);
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Export for use in other modules
window.AccessibilityEnhancer = AccessibilityEnhancer;
window.accessibilityEnhancer = globalAccessibilityEnhancer;

export default AccessibilityEnhancer;