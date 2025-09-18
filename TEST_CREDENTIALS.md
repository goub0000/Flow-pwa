# Flow Test Credentials & Testing Guide

## 🔐 Test Account Credentials

Use these credentials to test different user portals:

### Student Accounts
- **Email:** `oumarou.diallo@example.com`
- **Password:** `flow2025`
- **Portal:** Students Portal
- **Features:** Profile setup, program search, applications, messaging

- **Email:** `sarah.k@example.com`  
- **Password:** `flow2025`
- **Portal:** Students Portal
- **Features:** Draft applications, program recommendations

### Institution Accounts
- **Email:** `admin@university.edu.gh`
- **Password:** `flow2025` 
- **Portal:** Institutions Portal
- **Features:** Applicant management, program setup, messaging

- **Email:** `admissions@makerere.ac.ug`
- **Password:** `flow2025`
- **Portal:** Institutions Portal
- **Features:** Application review, analytics

### Counselor Accounts
- **Email:** `dr.johnson@counseling.org`
- **Password:** `flow2025`
- **Portal:** Counselors Portal  
- **Features:** Student management, recommendation writing, messaging

- **Email:** `counselor@ghana-edu.org`
- **Password:** `flow2025`
- **Portal:** Counselors Portal
- **Features:** Multi-student oversight, application tracking

### Parent Accounts
- **Email:** `fatou@example.com`
- **Password:** `flow2025`
- **Portal:** Parents Portal
- **Features:** Financial management, approval workflows, student tracking

- **Email:** `parent@family.sn`
- **Password:** `flow2025`
- **Portal:** Parents Portal
- **Features:** Multiple student linking, payment approvals

### Recommender Accounts
- **Email:** `prof.smith@university.edu`
- **Password:** `flow2025`
- **Portal:** Recommenders Portal
- **Features:** Letter submission, request management, secure uploads

- **Email:** `teacher@school.ke`
- **Password:** `flow2025`
- **Portal:** Recommenders Portal
- **Features:** Academic recommendations, student progress tracking

## 🚀 How to Test Each Portal

### 1. **Students Portal** (`/students/`)
**Test Flow:**
1. Visit `/auth/` or click "Sign In" on homepage
2. Use student credentials above
3. **Test Features:**
   - Complete onboarding process
   - Set up profile with new country selector
   - Search programs by country/field
   - Submit applications
   - Upload documents
   - Send/receive messages
   - Track application status

**Key Test Points:**
- ✅ Country selector shows all 249 countries with African countries first
- ✅ Language switching works across all pages
- ✅ Modal text is readable (dark background, white text)

### 2. **Institutions Portal** (`/institutions/`)
**Test Flow:**
1. Use institution credentials
2. Navigate to institution dashboard
3. **Test Features:**
   - Review incoming applications
   - Manage programs and requirements  
   - Set up admission criteria
   - Bulk actions on applicants
   - Export applicant data
   - Institution settings and team management

**Key Test Points:**
- ✅ Applicant filtering and search
- ✅ Modal dialogs for applicant details are readable
- ✅ Country selector in onboarding has full list

### 3. **Counselors Portal** (`/counselors/`)
**Test Flow:**
1. Use counselor credentials
2. Access counselor dashboard
3. **Test Features:**
   - Manage student roster
   - Write recommendation letters
   - Track student progress
   - Messaging with students/institutions
   - Calendar and deadline management
   - Analytics and reporting

**Key Test Points:**
- ✅ Student assignment and tracking
- ✅ Template management for recommendations
- ✅ Multi-language support

### 4. **Parents Portal** (`/parents/`)
**Test Flow:**
1. Use parent credentials
2. Access parent dashboard
3. **Test Features:**
   - Link to student accounts
   - Approve application fees
   - Financial planning tools
   - Communication with counselors
   - Application status monitoring
   - Payment history and budgeting

**Key Test Points:**
- ✅ Financial approval workflows
- ✅ Multi-student management
- ✅ Real-time notifications

### 5. **Recommenders Portal** (`/recommenders/`)  
**Test Flow:**
1. Use recommender credentials
2. Access recommender dashboard
3. **Test Features:**
   - View recommendation requests
   - Upload recommendation letters
   - Submit forms securely
   - Track submission status
   - Manage student relationships
   - Deadline notifications

**Key Test Points:**
- ✅ Secure document upload
- ✅ Request management system
- ✅ Multi-student recommendations

## 🌐 Language Testing

Test language switching on each portal:

1. **Available Languages:**
   - English (Default)
   - Français (French)
   - العربية (Arabic)
   - Kiswahili (Swahili)
   - Hausa
   - Yoruba
   - Igbo  
   - Zulu
   - Amharic

2. **Test Process:**
   - Use language selector in header
   - Verify text changes across pages
   - Test form labels and buttons
   - Check modal dialogs and notifications

## 🛠️ Technical Testing Notes

### Modal Readability Fix
- **Issue:** White text on transparent background
- **Fix Applied:** Dark semi-transparent background with proper contrast
- **Test:** Open "Sign In - Choose Your Portal" modal from homepage

### Country Selector Enhancement
- **Issue:** Limited country options (5-10 countries)
- **Fix Applied:** Full list of 249 countries with African countries prioritized
- **Test:** Any onboarding form country dropdown

### Server Setup for Testing
```bash
# Start local development server
cd C:\Users\Oumarou\Desktop\flow-pwa
python -m http.server 8000
# or
npx serve . -l 8000

# Access at: http://localhost:8000
```

## 🔍 What to Look For

### ✅ Successful Tests
- All text is readable (no white on white)
- Language selector has all 9 languages
- Country dropdowns show 249 countries
- Modals have proper dark backgrounds
- Navigation works smoothly between portals
- Forms submit without errors

### ❌ Issues to Report
- Text readability problems
- Missing translations
- Country selector not populating
- JavaScript console errors
- Broken navigation or forms
- Modal visibility issues

## 📧 Demo Data Available

The system includes demo data for testing:
- Sample student applications
- Mock university programs  
- Test recommendation letters
- Example financial transactions
- Simulated messaging threads

This allows full feature testing without needing real data entry.