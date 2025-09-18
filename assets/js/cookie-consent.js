/**
 * Flow Education Platform - Cookie Consent System
 * Advanced GDPR-compliant cookie management system
 */

// Advanced notification system for cookie consent
function showCookieNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  const colors = {
    success: 'linear-gradient(135deg, #10b981, #059669)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)',
    warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
    info: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
  };
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  notification.style.cssText = `
    position: fixed; top: 2rem; right: 2rem; z-index: 10010;
    background: ${colors[type]}; color: white;
    padding: 1rem 1.5rem; border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    transform: translateX(100%) scale(0.8); 
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    max-width: 350px; backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex; align-items: center; gap: 0.75rem;
  `;
  
  notification.innerHTML = `
    <span style="font-size: 1.25rem;">${icons[type]}</span>
    <span style="font-weight: 500;">${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Show animation
  setTimeout(() => {
    notification.style.transform = 'translateX(0) scale(1)';
  }, 100);
  
  // Hide animation
  setTimeout(() => {
    notification.style.transform = 'translateX(100%) scale(0.8)';
    setTimeout(() => notification.remove(), 400);
  }, duration);
}

// Main Cookie Consent Class
class FlowCookieConsent {
  constructor(options = {}) {
    this.cookieName = options.cookieName || 'flow_cookie_consent';
    this.cookieExpires = options.cookieExpires || 365; // days
    this.autoShow = options.autoShow !== false; // default true
    this.init();
  }

  init() {
    if (this.autoShow && !this.hasConsent()) {
      // Delay showing banner slightly to allow page to load
      setTimeout(() => this.showBanner(), 1000);
    }
    this.addFooterButton();
  }

  hasConsent() {
    return localStorage.getItem(this.cookieName) !== null;
  }

  setConsent(preferences) {
    const consent = {
      necessary: true,
      analytics: preferences.analytics || false,
      marketing: preferences.marketing || false,
      preferences: preferences.preferences || false,
      timestamp: new Date().getTime(),
      version: '1.0'
    };
    
    localStorage.setItem(this.cookieName, JSON.stringify(consent));
    this.hideBanner();
    
    // Dispatch custom event for analytics tracking
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { 
      detail: consent 
    }));
  }

  getConsent() {
    const consent = localStorage.getItem(this.cookieName);
    return consent ? JSON.parse(consent) : null;
  }

  revokeConsent() {
    localStorage.removeItem(this.cookieName);
    showCookieNotification('Cookie consent revoked', 'info');
    if (this.autoShow) {
      setTimeout(() => this.showBanner(), 500);
    }
  }

  showBanner() {
    // Remove existing banner if present
    const existingBanner = document.getElementById('flow-cookie-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

    const banner = document.createElement('div');
    banner.id = 'flow-cookie-banner';
    banner.style.cssText = `
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 10002;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      border-top: 3px solid rgba(245, 158, 11, 0.8);
      box-shadow: 0 -8px 25px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(15px);
      transform: translateY(100%);
      transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;

    banner.innerHTML = `
      <div style="max-width: 1400px; margin: 0 auto; padding: 1.5rem 2rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 300px;">
            <div style="
              width: 48px; height: 48px; 
              background: linear-gradient(135deg, #f59e0b, #d97706);
              border-radius: 50%; display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            ">
              <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.09 0 2.14-.18 3.12-.5l1.42 1.42C15.12 23.58 13.6 24 12 24 5.37 24 0 18.63 0 12S5.37 0 12 0s12 5.37 12 12c0 1.6-.42 3.12-1.08 4.54l-1.42-1.42c.32-.98.5-2.03.5-3.12 0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
            </div>
            <div style="color: white; flex: 1;">
              <h3 style="margin: 0 0 0.25rem 0; font-size: 1.1rem; font-weight: 600;">
                🍪 We use cookies to enhance your experience
              </h3>
              <p style="margin: 0; font-size: 0.875rem; color: rgba(255, 255, 255, 0.8); line-height: 1.4;">
                We use essential cookies to make our site work. We'd also like to set analytics cookies to help us improve our platform. 
                <button onclick="flowCookieConsent.showSettings()" style="color: #f59e0b; background: none; border: none; text-decoration: underline; cursor: pointer; font-size: inherit;">
                  Customize your preferences
                </button>
              </p>
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem; align-items: center; flex-shrink: 0;">
            <button onclick="flowCookieConsent.rejectAll()" style="
              padding: 0.75rem 1.25rem; background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px;
              color: rgba(255, 255, 255, 0.9); cursor: pointer; transition: all 0.3s ease;
              font-weight: 500; font-size: 0.875rem;
            " onmouseenter="this.style.background='rgba(255, 255, 255, 0.2)'" onmouseleave="this.style.background='rgba(255, 255, 255, 0.1)'">
              Reject All
            </button>
            <button onclick="flowCookieConsent.acceptAll()" style="
              padding: 0.75rem 1.25rem; background: linear-gradient(135deg, #f59e0b, #d97706);
              border: none; border-radius: 8px; color: white; cursor: pointer;
              transition: all 0.3s ease; font-weight: 600; font-size: 0.875rem;
            " onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 15px rgba(245, 158, 11, 0.4)'" onmouseleave="this.style.transform=''; this.style.boxShadow=''">
              Accept All
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);
    
    // Show banner with animation
    setTimeout(() => {
      banner.style.transform = 'translateY(0)';
    }, 100);
  }

  hideBanner() {
    const banner = document.getElementById('flow-cookie-banner');
    if (banner) {
      banner.style.transform = 'translateY(100%)';
      setTimeout(() => banner.remove(), 400);
    }
  }

  acceptAll() {
    this.setConsent({
      analytics: true,
      marketing: true,
      preferences: true
    });
    showCookieNotification('All cookies accepted! 🍪', 'success');
  }

  rejectAll() {
    this.setConsent({
      analytics: false,
      marketing: false,
      preferences: false
    });
    showCookieNotification('Only essential cookies will be used', 'info');
  }

  showSettings() {
    const modal = document.createElement('div');
    modal.id = 'flow-cookie-settings-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.7); display: flex; align-items: center;
      justify-content: center; z-index: 10003; backdrop-filter: blur(8px);
      opacity: 0; transition: opacity 0.4s ease;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        border-radius: 20px; padding: 2.5rem; max-width: 650px; width: 90%;
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transform: scale(0.8) translateY(30px);
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        color: white; max-height: 85vh; overflow-y: auto;
      ">
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
            <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.09 0 2.14-.18 3.12-.5l1.42 1.42C15.12 23.58 13.6 24 12 24 5.37 24 0 18.63 0 12S5.37 0 12 0s12 5.37 12 12c0 1.6-.42 3.12-1.08 4.54l-1.42-1.42c.32-.98.5-2.03.5-3.12 0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          <h2 style="margin: 0 0 0.5rem 0; font-size: 1.75rem; font-weight: 700;">Cookie Preferences</h2>
          <p style="margin: 0; color: rgba(255, 255, 255, 0.7);">Choose which cookies you want to accept</p>
        </div>

        <div style="display: grid; gap: 1.5rem; margin-bottom: 2rem;">
          <!-- Essential Cookies -->
          <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.1);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
              <h3 style="margin: 0; color: #10b981; font-size: 1.125rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1l3.09 6.26L22 9l-5 4.87L18.18 21L12 17.77L5.82 21L7 13.87L2 9l6.91-1.74L12 1z"/>
                </svg>
                Essential Cookies
              </h3>
              <div style="width: 48px; height: 24px; background: #10b981; border-radius: 12px; position: relative;">
                <div style="width: 20px; height: 20px; background: white; border-radius: 50%; position: absolute; top: 2px; right: 2px;"></div>
              </div>
            </div>
            <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 0.875rem; line-height: 1.4;">
              These cookies are necessary for the website to function and cannot be switched off. They enable core functionality such as security, network management, and accessibility.
            </p>
          </div>

          <!-- Analytics Cookies -->
          <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.1);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
              <h3 style="margin: 0; color: #3b82f6; font-size: 1.125rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
                Analytics Cookies
              </h3>
              <div id="flow-analytics-toggle" onclick="toggleFlowCookie('analytics')" style="width: 48px; height: 24px; background: #6b7280; border-radius: 12px; position: relative; cursor: pointer; transition: background 0.3s;">
                <div style="width: 20px; height: 20px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: all 0.3s;"></div>
              </div>
            </div>
            <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 0.875rem; line-height: 1.4;">
              These cookies help us understand how visitors interact with our website by collecting and reporting anonymous information. This helps us improve our services.
            </p>
          </div>

          <!-- Marketing Cookies -->
          <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.1);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
              <h3 style="margin: 0; color: #ef4444; font-size: 1.125rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                </svg>
                Marketing Cookies
              </h3>
              <div id="flow-marketing-toggle" onclick="toggleFlowCookie('marketing')" style="width: 48px; height: 24px; background: #6b7280; border-radius: 12px; position: relative; cursor: pointer; transition: background 0.3s;">
                <div style="width: 20px; height: 20px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: all 0.3s;"></div>
              </div>
            </div>
            <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 0.875rem; line-height: 1.4;">
              These cookies are used to track visitors across websites to display relevant and engaging advertisements for individual users.
            </p>
          </div>

          <!-- Preference Cookies -->
          <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.1);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
              <h3 style="margin: 0; color: #8b5cf6; font-size: 1.125rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 21L12 17.77L5.82 21L7 13.87L2 9l6.91-1.74L12 1z"/>
                </svg>
                Preference Cookies
              </h3>
              <div id="flow-preferences-toggle" onclick="toggleFlowCookie('preferences')" style="width: 48px; height: 24px; background: #6b7280; border-radius: 12px; position: relative; cursor: pointer; transition: background 0.3s;">
                <div style="width: 20px; height: 20px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: all 0.3s;"></div>
              </div>
            </div>
            <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 0.875rem; line-height: 1.4;">
              These cookies remember choices you make to give you better functionality and personal features such as language selection and region.
            </p>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: space-between; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <button onclick="flowCookieConsent.revokeConsent(); closeFlowCookieSettings()" style="
            padding: 0.75rem 1.5rem; background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px;
            color: #ef4444; cursor: pointer; transition: all 0.3s ease;
            font-weight: 500; font-size: 0.875rem;
          " onmouseenter="this.style.background='rgba(239, 68, 68, 0.2)'" onmouseleave="this.style.background='rgba(239, 68, 68, 0.1)'">
            Reset All
          </button>
          <div style="display: flex; gap: 1rem;">
            <button onclick="closeFlowCookieSettings()" style="
              padding: 0.75rem 1.5rem; background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 10px;
              color: white; cursor: pointer; transition: all 0.3s ease;
              font-weight: 500; font-size: 0.875rem;
            " onmouseenter="this.style.background='rgba(255, 255, 255, 0.2)'" onmouseleave="this.style.background='rgba(255, 255, 255, 0.1)'">
              Cancel
            </button>
            <button onclick="saveFlowCookiePreferences()" style="
              padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #f59e0b, #d97706);
              border: none; border-radius: 10px; color: white; cursor: pointer;
              transition: all 0.3s ease; font-weight: 500; font-size: 0.875rem;
            " onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 15px rgba(245, 158, 11, 0.4)'" onmouseleave="this.style.transform=''; this.style.boxShadow=''">
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Show modal with animation
    setTimeout(() => {
      modal.style.opacity = '1';
      const content = modal.querySelector('div');
      content.style.transform = 'scale(1) translateY(0)';
    }, 100);

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeFlowCookieSettings();
      }
    });
  }

  addFooterButton() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.addFooterButton());
      return;
    }

    const footer = document.querySelector('footer');
    if (footer) {
      const policyLinks = footer.querySelector('div[style*="display: flex; gap: 1.5rem"]');
      if (policyLinks && !policyLinks.querySelector('[data-flow-cookie-button]')) {
        const cookieButton = document.createElement('a');
        cookieButton.href = '#';
        cookieButton.setAttribute('data-flow-cookie-button', 'true');
        cookieButton.onclick = (e) => {
          e.preventDefault();
          this.showSettings();
        };
        cookieButton.style.cssText = 'color: rgba(255, 255, 255, 0.6); text-decoration: none; font-size: 0.875rem; transition: all 0.3s ease; padding: 0.25rem 0.5rem; border-radius: 4px;';
        cookieButton.onmouseenter = function() {
          this.style.color = 'white';
          this.style.background = 'rgba(255, 255, 255, 0.1)';
        };
        cookieButton.onmouseleave = function() {
          this.style.color = 'rgba(255, 255, 255, 0.6)';
          this.style.background = '';
        };
        cookieButton.textContent = 'Cookie Settings';
        
        policyLinks.appendChild(cookieButton);
      }
    }
  }
}

// Cookie toggle states for the settings modal
const flowCookieStates = {
  analytics: false,
  marketing: false,
  preferences: false
};

function toggleFlowCookie(type) {
  flowCookieStates[type] = !flowCookieStates[type];
  const toggle = document.getElementById(`flow-${type}-toggle`);
  const indicator = toggle.querySelector('div');
  
  if (flowCookieStates[type]) {
    toggle.style.background = '#10b981';
    indicator.style.transform = 'translateX(24px)';
  } else {
    toggle.style.background = '#6b7280';
    indicator.style.transform = 'translateX(0)';
  }
}

function saveFlowCookiePreferences() {
  flowCookieConsent.setConsent(flowCookieStates);
  closeFlowCookieSettings();
  showCookieNotification('Cookie preferences saved! 🍪', 'success');
}

function closeFlowCookieSettings() {
  const modal = document.getElementById('flow-cookie-settings-modal');
  if (modal) {
    modal.style.opacity = '0';
    const content = modal.querySelector('div');
    content.style.transform = 'scale(0.8) translateY(30px)';
    setTimeout(() => modal.remove(), 400);
  }
}

// Initialize global cookie consent system
let flowCookieConsent;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    flowCookieConsent = new FlowCookieConsent();
  });
} else {
  flowCookieConsent = new FlowCookieConsent();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FlowCookieConsent;
}