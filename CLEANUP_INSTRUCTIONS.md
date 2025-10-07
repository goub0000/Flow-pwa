# Complete Hardcoded Data Cleanup Instructions

## 🎯 Mission: Remove ALL Hardcoded Data from Flow PWA

This guide provides systematic instructions for completing the cleanup of ALL remaining files.

---

## 📋 CLEANUP METHODOLOGY

### Step 1: Identify Hardcoded Data
Search for these patterns in each file:

```bash
# Names
(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)?[\s]?[A-Z][a-z]+\s[A-Z][a-z]+

# Institutions
University of|College of|Institute of|École|Kwame Nkrumah|Makerere

# Programs
B\.Sc|M\.Sc|MBA|Ph\.D|Computer Science|Engineering|Business

# Money
\$[\d,]+|\$\d+\.\d{2}

# Status
Pending|Accepted|Rejected|Approved|Under Review
```

### Step 2: Replace with Empty States
Use this template:

```html
<div class="empty-state" id="[contentType]Container">
  <!-- Icon (choose appropriate one) -->
  <svg class="empty-state__icon" width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="[icon-path]"/>
  </svg>

  <!-- Title -->
  <h3 class="empty-state__title">No [Items] Yet</h3>

  <!-- Description -->
  <p class="empty-state__description">
    [Helpful message explaining why empty and what to do]
  </p>

  <!-- Optional CTA -->
  <a href="[action-url]" class="btn btn--primary">[Action Text]</a>
</div>
```

### Step 3: Dynamize Data Elements
Convert static to dynamic:

**Before:**
```html
<div class="stat-number">156</div>
<input type="text" value="John Doe" />
<h3>University of Ghana</h3>
```

**After:**
```html
<div class="stat-number" id="statCount">0</div>
<input type="text" id="userName" placeholder="Enter your name" />
<h3 id="universityName">Select University</h3>
```

---

## 📁 FILE-BY-FILE CLEANUP GUIDE

### 1. STUDENTS/MESSAGES.HTML

#### Remove:
```html
<!-- Hardcoded conversation items -->
<div class="conversation-item">
  <img src="https://ui-avatars.com/api/?name=Sarah+Johnson..." />
  <h4>Sarah Johnson</h4>
  <p>Thanks for the update...</p>
</div>
```

#### Replace With:
```html
<div id="conversationsList" class="conversations-list">
  <div class="empty-state">
    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
    </svg>
    <h3 class="empty-state__title">No Messages Yet</h3>
    <p class="empty-state__description">Your conversations will appear here once you start chatting with counselors and institutions.</p>
  </div>
</div>
```

#### JavaScript Cleanup:
```javascript
// BEFORE
this.conversations = {
  'sarah-johnson': {
    name: 'Sarah Johnson',
    messages: [...]
  }
};

// AFTER
this.conversations = {};
```

---

### 2. STUDENTS/APPLICATIONS.HTML

#### Remove:
```html
<div class="application-card">
  <h3>University of Ghana</h3>
  <span class="status status--pending">Pending</span>
  <p>B.Sc. Computer Science</p>
  <p>Deadline: Dec 15, 2024</p>
</div>
```

#### Replace With:
```html
<div id="applicationsContainer">
  <div class="empty-state">
    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
    <h3 class="empty-state__title">No Applications Yet</h3>
    <p class="empty-state__description">Start your journey by browsing programs and submitting applications.</p>
    <a href="/students/programs.html" class="btn btn--primary">Browse Programs</a>
  </div>
</div>
```

---

### 3. STUDENTS/PROGRAMS.HTML

#### Remove:
```html
<div class="program-card">
  <h3>B.Sc. Computer Science</h3>
  <p>University of Ghana</p>
  <span>$5,000/year</span>
  <p>4 years • Bachelor's</p>
</div>
```

#### Replace With:
```html
<div id="programsContainer">
  <div class="empty-state">
    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
    </svg>
    <h3 class="empty-state__title">No Programs Found</h3>
    <p class="empty-state__description">Use the filters above to search for programs that match your interests.</p>
  </div>
</div>
```

---

### 4. STUDENTS/PROFILE.HTML

#### Remove ALL:
- Name fields with values
- Test scores (SAT, ACT, etc.)
- GPA values
- School information
- Bio/description text
- Achievement lists

#### Replace With:
```html
<!-- Personal Info -->
<input type="text" id="studentName" placeholder="Enter your full name" />
<input type="email" id="studentEmail" placeholder="your.email@example.com" />
<input type="tel" id="studentPhone" placeholder="+1 234 567 8900" />

<!-- Academic Info -->
<input type="number" id="gpa" placeholder="0.00" step="0.01" min="0" max="4" />
<input type="number" id="satScore" placeholder="Enter SAT score" />
<input type="text" id="currentSchool" placeholder="Current school name" />

<!-- Bio -->
<textarea id="studentBio" placeholder="Tell us about yourself..."></textarea>

<!-- Achievements -->
<div id="achievementsList">
  <div class="empty-state">
    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
    </svg>
    <h3>No Achievements Added</h3>
    <p>Add your academic and extracurricular achievements</p>
  </div>
</div>
```

---

### 5. INSTITUTIONS/PROGRAMS.HTML

#### Remove:
- All program listings
- Department names
- Faculty information
- Admission requirements with specific data

#### Replace With:
```html
<div id="institutionProgramsContainer">
  <div class="empty-state">
    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
    </svg>
    <h3 class="empty-state__title">No Programs Listed</h3>
    <p class="empty-state__description">Add your institution's programs to attract qualified applicants.</p>
    <button class="btn btn--primary" onclick="showAddProgramModal()">Add Program</button>
  </div>
</div>
```

---

### 6. INSTITUTIONS/APPLICANTS.HTML

#### Remove:
- All applicant profiles
- Application statuses
- Student names and data

#### Replace With:
```html
<div id="applicantsContainer">
  <div class="empty-state">
    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
    </svg>
    <h3 class="empty-state__title">No Applicants Yet</h3>
    <p class="empty-state__description">Applications from students will appear here during the admission cycle.</p>
  </div>
</div>
```

---

### 7. COUNSELORS/MESSAGES.HTML

Same as students/messages.html - remove all conversations and messages.

---

### 8. INSTITUTIONS/MESSAGES.HTML

Same pattern - remove institutional conversations.

---

### 9. HELP PAGES (All Roles)

#### Check for:
- Sample user names in examples
- Example institutions
- Fake email addresses
- Sample phone numbers

#### Replace With:
- Generic placeholders
- "user@example.com"
- "institution@example.edu"
- "+1 234 567 8900"

---

## 🎨 EMPTY STATE ICON LIBRARY

### Messages
```html
<path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
```

### Applications/Documents
```html
<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
```

### Programs/Education
```html
<path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
```

### Achievements/Success
```html
<path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
```

### People/Users
```html
<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
```

### Statistics/Charts
```html
<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
```

### Finance/Money
```html
<path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
```

### Building/Institution
```html
<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
```

---

## ✅ VERIFICATION CHECKLIST

For each file, verify:

- [ ] No real names (search for capital letters: `[A-Z][a-z]+ [A-Z][a-z]+`)
- [ ] No institution names
- [ ] No program names with degrees
- [ ] No dollar amounts
- [ ] No specific dates
- [ ] No status values (Pending, Accepted, etc.)
- [ ] All stats = 0
- [ ] All inputs have placeholders
- [ ] All data containers have IDs
- [ ] Empty states are present
- [ ] JavaScript data objects are empty
- [ ] No console errors

---

## 🚀 QUICK CLEANUP REGEX

Use these find/replace patterns:

### Remove email addresses:
```
Find: [a-z]+\.[a-z]+@[a-z]+\.(edu|com|org)
Replace: user@example.com
```

### Remove phone numbers:
```
Find: \+?[\d\s\-\(\)]{10,}
Replace: +1 234 567 8900
```

### Remove dollar amounts:
```
Find: \$[\d,]+(\.\d{2})?
Replace: $0.00
```

### Remove specific universities:
```
Find: (University of|College of|Institute of) [A-Z][a-z]+
Replace: Select Institution
```

---

## 🎯 SUCCESS CRITERIA

Cleanup is complete when:

1. ✅ Zero grep matches for real names
2. ✅ Zero grep matches for real institutions
3. ✅ Zero grep matches for money amounts
4. ✅ All data arrays/objects are empty
5. ✅ All empty states render correctly
6. ✅ All forms have placeholders
7. ✅ No privacy violations possible

---

## 📞 NEED HELP?

If you encounter:
- Complex nested data structures
- Shared components
- Template systems
- Build processes

Refer to the data-service.js integration guide and ensure all dynamic loading functions are properly connected.

---

**Remember: Better to have an empty, professional UI than hardcoded fake data that could be mistaken for real user information!**
