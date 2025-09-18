#!/bin/bash

# Flow Education Platform - Cookie Consent Auto-Installer
# This script adds the cookie consent system to all HTML pages

echo "🍪 Adding Flow Cookie Consent System to all HTML pages..."

# Find all HTML files (excluding node_modules)
find . -name "*.html" -not -path "./node_modules/*" -not -path "./dist/*" -not -path "./build/*" | while read -r file; do
    # Check if the file already has cookie consent
    if ! grep -q "cookie-consent.js" "$file"; then
        # Check if file has closing </body> tag
        if grep -q "</body>" "$file"; then
            echo "Adding cookie consent to: $file"
            
            # Create backup
            cp "$file" "$file.backup"
            
            # Add cookie consent script before closing </body> tag
            sed -i 's|</body>|  <!-- Flow Cookie Consent System -->\n  <script src="/assets/js/cookie-consent.js"></script>\n</body>|' "$file"
            
            echo "✅ Added to $file"
        else
            echo "⚠️  Skipping $file (no </body> tag found)"
        fi
    else
        echo "ℹ️  Already has cookie consent: $file"
    fi
done

echo ""
echo "🎉 Cookie consent system installation complete!"
echo ""
echo "📋 Summary:"
echo "- Cookie consent banner will show on first visit"
echo "- Users can customize preferences or accept/reject all"
echo "- Settings accessible via footer 'Cookie Settings' link"
echo "- Preferences stored in localStorage with 365-day expiry"
echo "- GDPR compliant with granular controls"
echo ""
echo "🔧 Features included:"
echo "- Essential cookies (always on)"
echo "- Analytics cookies (user choice)"
echo "- Marketing cookies (user choice)" 
echo "- Preference cookies (user choice)"
echo "- Animated banner and modals"
echo "- Reset/revoke options"
echo "- Cross-page persistence"
echo ""
echo "To remove backups: find . -name '*.html.backup' -delete"