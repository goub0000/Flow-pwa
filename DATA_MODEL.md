# Flow PWA - Comprehensive Data Model

## Overview
This document defines the complete Firestore database structure for the Flow college application management platform.

## Collections & Relationships

### 1. **users** (Main Profile Collection)
Primary collection for all user accounts.

```javascript
users/{userId}
{
  // Common fields for all user types
  uid: string,
  email: string,
  accountType: 'student' | 'institution' | 'counselor' | 'parent' | 'recommender',
  displayName: string,
  photoURL: string,
  emailVerified: boolean,
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLoginAt: timestamp,

  // Type-specific fields (depending on accountType)

  // STUDENT fields
  firstName: string,
  lastName: string,
  dateOfBirth: date,
  phone: string,
  address: {
    street: string,
    city: string,
    state: string,
    zipCode: string,
    country: string
  },
  academicInfo: {
    currentGrade: string,
    gpa: number,
    satScore: number,
    actScore: number,
    schoolName: string,
    graduationYear: number
  },
  counselorId: string,  // Reference to counselor
  parentIds: [string],  // Array of parent user IDs

  // INSTITUTION fields
  institutionName: string,
  institutionType: 'university' | 'college' | 'community_college' | 'vocational',
  website: string,
  phone: string,
  address: { ... },
  adminName: string,
  adminTitle: string,
  establishedYear: number,
  accreditation: string,
  stats: {
    totalStudents: number,
    totalFaculty: number,
    acceptanceRate: number,
    averageGPA: number
  },

  // COUNSELOR fields
  firstName: string,
  lastName: string,
  schoolName: string,
  schoolDistrict: string,
  licenseNumber: string,
  phone: string,
  specializations: [string],
  studentIds: [string],  // Array of student user IDs

  // PARENT fields
  firstName: string,
  lastName: string,
  phone: string,
  relationship: 'mother' | 'father' | 'guardian',
  studentIds: [string],  // Array of student user IDs

  // RECOMMENDER fields
  firstName: string,
  lastName: string,
  title: string,
  organization: string,
  email: string,
  phone: string,
  relationship: 'teacher' | 'employer' | 'mentor' | 'coach' | 'other'
}
```

### 2. **programs** (Institution Programs)
Academic programs offered by institutions.

```javascript
programs/{programId}
{
  institutionId: string,  // Reference to institution user
  name: string,
  degree: 'bachelor' | 'master' | 'doctorate' | 'certificate' | 'associate',
  department: string,
  description: string,
  duration: number,  // in years
  tuitionPerYear: number,
  isActive: boolean,
  requirements: {
    minGPA: number,
    minSAT: number,
    minACT: number,
    requiredDocuments: [string],
    essayPrompts: [string]
  },
  stats: {
    totalSpots: number,
    availableSpots: number,
    applicantsCount: number,
    acceptedCount: number,
    enrolledCount: number
  },
  deadlines: {
    earlyDecision: date,
    regularDecision: date,
    finalDecision: date
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3. **applications** (Student Applications)
Applications submitted by students to programs.

```javascript
applications/{applicationId}
{
  studentId: string,  // Reference to student user
  targetInstitutionId: string,  // Reference to institution user
  programId: string,  // Reference to program
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'waitlisted' | 'withdrawn',
  submittedAt: timestamp,
  reviewedAt: timestamp,
  decisionAt: timestamp,

  // Application data
  personalStatement: string,
  essays: [{
    prompt: string,
    response: string,
    wordCount: number
  }],

  academicInfo: {
    gpa: number,
    satScore: number,
    actScore: number,
    transcriptURL: string,
    schoolName: string,
    graduationYear: number
  },

  activities: [{
    name: string,
    type: 'sport' | 'club' | 'volunteer' | 'work' | 'leadership',
    description: string,
    yearsInvolved: number,
    hoursPerWeek: number,
    leadershipRole: string
  }],

  awards: [{
    name: string,
    description: string,
    year: number,
    level: 'school' | 'regional' | 'state' | 'national' | 'international'
  }],

  documentUrls: {
    transcript: string,
    resume: string,
    additionalDocs: [string]
  },

  recommendationRequestIds: [string],  // References to recommendation_requests

  reviewNotes: [{
    reviewerId: string,
    note: string,
    createdAt: timestamp
  }],

  completionPercentage: number,

  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4. **recommendation_requests** (Recommendation Requests)
Requests for letters of recommendation.

```javascript
recommendation_requests/{requestId}
{
  studentId: string,
  recommenderId: string,  // Can be recommender user or external email
  applicationId: string,
  status: 'pending' | 'accepted' | 'declined' | 'submitted',
  requestedAt: timestamp,
  submittedAt: timestamp,

  recommenderInfo: {
    name: string,
    email: string,
    title: string,
    organization: string,
    relationship: string
  },

  recommendation: {
    content: string,
    rating: number,  // 1-5
    documentURL: string
  },

  reminders: [{
    sentAt: timestamp,
    type: 'initial' | 'reminder'
  }],

  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 5. **messages** (Direct Messages)
Messages between users.

```javascript
messages/{messageId}
{
  senderId: string,
  recipientId: string,
  subject: string,
  content: string,
  type: 'text' | 'file' | 'system',
  read: boolean,
  readAt: timestamp,
  attachments: [{
    name: string,
    url: string,
    type: string,
    size: number
  }],
  threadId: string,  // For grouping conversations
  createdAt: timestamp
}
```

### 6. **notifications** (User Notifications)
System notifications for users.

```javascript
notifications/{notificationId}
{
  userId: string,
  type: 'application_status' | 'message' | 'deadline' | 'recommendation' | 'system',
  title: string,
  message: string,
  actionUrl: string,
  read: boolean,
  readAt: timestamp,
  data: object,  // Additional context data
  createdAt: timestamp
}
```

### 7. **documents** (File Storage References)
References to uploaded files.

```javascript
documents/{documentId}
{
  userId: string,
  applicationId: string,  // Optional
  fileName: string,
  fileType: string,
  fileSize: number,
  storagePath: string,
  downloadURL: string,
  category: 'transcript' | 'resume' | 'essay' | 'recommendation' | 'financial' | 'other',
  uploadedAt: timestamp,
  lastAccessedAt: timestamp
}
```

### 8. **analytics** (Usage Analytics)
Tracking user activity and engagement.

```javascript
analytics/{analyticsId}
{
  userId: string,
  accountType: string,
  eventType: string,
  eventData: object,
  timestamp: timestamp,
  sessionId: string,
  deviceInfo: {
    platform: string,
    browser: string,
    screenSize: string
  }
}
```

### 9. **deadlines** (Important Dates)
Track important deadlines across the platform.

```javascript
deadlines/{deadlineId}
{
  userId: string,  // Student who created it
  programId: string,  // Related program
  title: string,
  description: string,
  date: timestamp,
  type: 'application' | 'financial_aid' | 'enrollment' | 'custom',
  completed: boolean,
  completedAt: timestamp,
  reminders: [{
    daysBeforeDays before: number,
    sent: boolean,
    sentAt: timestamp
  }],
  createdAt: timestamp
}
```

## Key Relationships

### Student Relationships
- **Student → Counselor**: `users.counselorId` → `users.uid` (many-to-one)
- **Student → Parents**: `users.parentIds` → `users.uid` (many-to-many)
- **Student → Applications**: `applications.studentId` → `users.uid` (one-to-many)
- **Student → Recommendations**: `recommendation_requests.studentId` → `users.uid` (one-to-many)

### Institution Relationships
- **Institution → Programs**: `programs.institutionId` → `users.uid` (one-to-many)
- **Institution → Applications**: `applications.targetInstitutionId` → `users.uid` (one-to-many)

### Application Relationships
- **Application → Student**: `applications.studentId` → `users.uid` (many-to-one)
- **Application → Program**: `applications.programId` → `programs.programId` (many-to-one)
- **Application → Institution**: `applications.targetInstitutionId` → `users.uid` (many-to-one)
- **Application → Recommendations**: `recommendation_requests.applicationId` → `applications.applicationId` (one-to-many)

### Counselor Relationships
- **Counselor → Students**: `users.studentIds` → `users.uid` (one-to-many)

### Parent Relationships
- **Parent → Students**: `users.studentIds` → `users.uid` (one-to-many)

## Data Integrity Rules

1. **Cascading Updates**: When a user's displayName changes, update references
2. **Soft Deletes**: Mark accounts as `isActive: false` instead of deleting
3. **Audit Trail**: All major actions logged in `analytics`
4. **Data Validation**: Enforce required fields based on accountType
5. **Privacy**: Parents can only see their children's data
6. **Permissions**: Institutions only see applications to their programs

## Dashboard Data Queries

### Student Dashboard
```javascript
// Applications
WHERE studentId == currentUser.uid

// Deadlines
WHERE userId == currentUser.uid AND completed == false
ORDER BY date ASC

// Messages
WHERE recipientId == currentUser.uid AND read == false
```

### Institution Dashboard
```javascript
// Statistics
programs WHERE institutionId == currentUser.uid
applications WHERE targetInstitutionId == currentUser.uid

// Recent Applications
WHERE targetInstitutionId == currentUser.uid
ORDER BY submittedAt DESC
LIMIT 10
```

### Counselor Dashboard
```javascript
// Students
WHERE uid IN counselor.studentIds

// Student Applications
WHERE studentId IN counselor.studentIds
```

### Parent Dashboard
```javascript
// Children
WHERE uid IN parent.studentIds

// Children's Applications
WHERE studentId IN parent.studentIds
```

## Next Steps
1. Implement Firestore security rules
2. Create data seeding scripts
3. Build service layer for CRUD operations
4. Update all dashboards to query real data
5. Implement real-time listeners for live updates
