# System Architecture & Data Flow Diagram

## 🏗️ Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT (React)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Pages: Home, SubmitIssue, ViewResponse, Dashboard, etc   │ │
│  │  Components: Navbar, Footer, IssueCard                    │ │
│  │  Services: API client with Axios                          │ │
│  │  State: AuthContext for authentication                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                │                                  │
│                        HTTP/REST (Axios)                          │
│                                │                                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Routes: /api/auth, /api/issues, /api/counselors      │   │
│  │  Controllers: Business Logic                           │   │
│  │  Middleware: Auth, Error Handling, CORS               │   │
│  │  Utils: Anonymous ID Generation                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                                  │
│                        MongoDB Driver                             │
│                                │                                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (MongoDB)                            │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │  Counselors      │      │  Issues          │                │
│  │  Collection      │      │  Collection      │                │
│  │  ┌────────────┐  │      │  ┌────────────┐  │                │
│  │  │ _id        │  │      │  │ _id        │  │                │
│  │  │ name       │  │      │  │ anonId     │  │                │
│  │  │ email      │  │      │  │ title      │  │                │
│  │  │ password   │  │      │  │ description│  │                │
│  │  │ specialty  │  │      │  │ category   │  │                │
│  │  │ isActive   │  │      │  │ severity   │  │                │
│  │  │ createdAt  │  │      │  │ status     │  │                │
│  │  └────────────┘  │      │  │ response   │  │                │
│  └──────────────────┘      │  └────────────┘  │                │
│                            └──────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Student Issue Submission Flow

```
┌──────────────────┐
│  Student Opens   │
│  Application     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Home Page - Multiple Options        │
│  1. Submit Issue                     │
│  2. Check Status (with Anon ID)     │
│  3. View Resources                  │
└────────┬─────────────────────────────┘
         │
    ┌────▼─────┐
    │ Submit?  │
    └────┬─────┘
         │
    ┌────▼────────────────────────────────┐
    │  Click "Submit Issue Anonymously"   │
    └────┬─────────────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────────┐
    │  Fill Issue Form                     │
    │  - Title                             │
    │  - Description                       │
    │  - Category                          │
    │  - Severity Level                    │
    └────┬─────────────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────────┐
    │  Submit to Backend: POST /issues     │
    │  /submit                             │
    └────┬─────────────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────────┐
    │  Backend Generates:                  │
    │  - Unique Anonymous ID               │
    │  - Issue Document in MongoDB         │
    │  - Status: "Open"                    │
    └────┬─────────────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────────┐
    │  Frontend Displays:                  │
    │  - Success Message                   │
    │  - Anonymous ID (Copy to Clipboard)  │
    │  - Instructions to Save ID           │
    └────┬─────────────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────────┐
    │  Student Saves Anonymous ID          │
    │  (Can use to track status anytime)   │
    └──────────────────────────────────────┘
```

---

## 🔄 Counselor Response Flow

```
┌─────────────────────────────────┐
│  Counselor Logs In              │
│  - Email: counselor@test.com    │
│  - Password: ••••••             │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  Backend Verifies:              │
│  - Email exists                 │
│  - Password matches (bcrypt)    │
│  - Generate JWT Token           │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  Counselor Dashboard            │
│  - View All Open Issues         │
│  - Filter by Status/Category    │
│  - Statistics Panel             │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  Click Issue → See Details      │
│  - Anonymous ID (not name)      │
│  - Issue Content                │
│  - Category & Severity          │
│  - Assigned: Empty              │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  Click "Assign to Me"           │
│  - Status → "Assigned"          │
│  - Assigned Counselor → Me      │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  Click "View & Respond"         │
│  Modal Opens with:              │
│  - Issue details                │
│  - Response text area           │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  Write Thoughtful Response      │
│  (Typed in text area)           │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  Submit Response                │
│  PUT /api/issues/:id/response   │
│  - Response saved               │
│  - Status → "Resolved"          │
│  - Updated timestamp set        │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  Student Gets Notification      │
│  (Next time they check status)  │
│  - See Counselor Response       │
│  - Issue marked Resolved        │
│  - Timeline shows update        │
└─────────────────────────────────┘
```

---

## 🔐 Authentication & Security Flow

```
User Registration/Login
       │
       ▼
┌─────────────────────┐
│ Submit Credentials  │
│ POST /auth/register │
│ POST /auth/login    │
└────┬────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ Backend Verification:        │
│ 1. Check if email exists     │
│ 2. Hash password with bcrypt │
│    (if new account)          │
│ 3. For login: compare        │
│    hashed passwords          │
└────┬─────────────────────────┘
     │
     ├─────────────────────┐
     │ Invalid Credentials │
     │ → Error Response    │
     └─────────────────────┘
     │
     ▼ (Valid)
┌──────────────────────────────┐
│ Generate JWT Token:          │
│ - Header: Algorithm          │
│ - Payload: User ID           │
│ - Signature: JWT_SECRET      │
│ - Expires: 7 days            │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ Return Token to Client       │
│ Client Stores in localStorage│
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ For Protected Routes:        │
│ - Include Token in Header    │
│ - Authorization: Bearer .... │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ Backend Middleware:          │
│ - Verify Token Signature     │
│ - Check Expiration           │
│ - Extract User ID            │
└────┬─────────────────────────┘
     │
     ├──────────────────────┐
     │ Invalid/Expired      │
     │ → 401 Unauthorized   │
     └──────────────────────┘
     │
     ▼ (Valid)
┌──────────────────────────────┐
│ Allow Request                │
│ Access Protected Resource    │
└──────────────────────────────┘
```

---

## 📱 Anonymous ID System

```
Issue Submitted
       │
       ▼
┌─────────────────────────┐
│ Trigger ID Generation   │
│ generateAnonId()        │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Build Anonymous ID:                 │
│ Prefix: "ANON"                      │
│ + "-"                               │
│ + Timestamp (Base36)                │
│ + "-"                               │
│ + Random String (8 chars)           │
│                                     │
│ Example:                            │
│ ANON-ABC123XYZ-PQR789ST             │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Save in Database:                   │
│ Issues Collection                   │
│ {                                   │
│   anonId: "ANON-ABC123XYZ-PQR789ST" │
│   title: "...",                     │
│   description: "...",               │
│   ...                               │
│ }                                   │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Return to Student:                  │
│ "Your Anonymous ID: ANON-..."       │
│ ✓ Copy Button                       │
│ ✓ Save Instruction                  │
└─────────────────────────────────────┘
```

---

## 📈 Status Progression

```
┌──────────┐
│   OPEN   │  Issue submitted, awaiting assignment
└────┬─────┘
     │ Counselor assigns
     ▼
┌──────────────┐
│  ASSIGNED    │  Counselor taken responsibility
└────┬─────────┘
     │ Counselor responds
     ▼
┌──────────────────┐
│  IN PROGRESS     │  Being actively worked on
└────┬─────────────┘
     │ Response submitted
     ▼
┌──────────────┐
│  RESOLVED    │  Issue addressed with response
└──────────────┘
     │
     └─► Student can view counselor's response
     └─► Can always reopen if needed
```

---

## 🗄️ Data Storage Strategy

```
MongoDB Database: mental-health-portal
│
├─ Collection: counselors
│  └─ Documents: Each counselor's profile
│     - Encrypted passwords (bcrypt)
│     - Contact info
│     - Specialization
│     - Activity status
│
├─ Collection: issues
│  └─ Documents: Each submitted issue
│     - Anonymous ID (no personal data)
│     - Issue content
│     - Severity & category
│     - Status tracking
│     - Counselor reference (not identity)
│     - Responses
│     - Timestamps
│
└─ Indexes:
   - issues.anonId (unique, for fast lookup)
   - issues.assignedCounselor (for counselor queries)
   - counselors.email (unique, for auth)
```

---

## 🔌 API Request/Response Examples

### Submit Issue
```
REQUEST:
POST /api/issues/submit
{
  "title": "Exam anxiety",
  "description": "I have severe anxiety before exams",
  "category": "Academic",
  "severity": "High"
}

RESPONSE:
{
  "success": true,
  "anonId": "ANON-ABC123-XYZ789",
  "issue": {
    "_id": "507f1f77bcf86cd799439011",
    "anonId": "ANON-ABC123-XYZ789",
    "title": "Exam anxiety",
    "description": "I have severe anxiety before exams",
    "category": "Academic",
    "severity": "High",
    "status": "Open",
    "response": null,
    "createdAt": "2024-01-26T12:30:00Z"
  }
}
```

### Get Issue Status
```
REQUEST:
GET /api/issues/ANON-ABC123-XYZ789

RESPONSE:
{
  "success": true,
  "issue": {
    "anonId": "ANON-ABC123-XYZ789",
    "title": "Exam anxiety",
    "status": "Resolved",
    "assignedCounselor": { "name": "Dr. Sarah" },
    "response": "Here are some techniques to manage exam anxiety...",
    "updatedAt": "2024-01-26T14:45:00Z"
  }
}
```

### Counselor Login
```
REQUEST:
POST /api/auth/login
{
  "email": "counselor@example.com",
  "password": "securepassword"
}

RESPONSE:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "counselor": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Dr. Sarah Johnson",
    "email": "counselor@example.com",
    "specialization": "Academic"
  }
}
```

---

## 🎯 Key Points

✓ **Complete Anonymity** - Anonymous ID has no personal info
✓ **Secure Passwords** - Hashed with bcrypt, never stored plain
✓ **JWT Tokens** - Stateless authentication
✓ **MongoDB Indexed** - Fast lookups on critical fields
✓ **Error Handling** - Centralized middleware for consistency
✓ **CORS Protected** - Secure cross-origin requests
✓ **Scalable** - Ready for production deployment

This architecture ensures privacy, security, and scalability while providing a seamless experience for both students and counselors.
