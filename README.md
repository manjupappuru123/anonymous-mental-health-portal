# Anonymous Mental Health & Stress Support Portal - Complete Setup Guide

## Project Overview

This is a comprehensive web application designed to address the problem of **students hesitating to approach counselors**. The portal provides a completely anonymous and confidential platform where students can seek help without fear of judgment or social stigma.

### Problem Statement
Students often struggle to reach out for mental health support due to:
- Fear of being judged by peers
- Social stigma around mental health
- Concerns about confidentiality
- Uncomfortable in-person interactions
- Not knowing where to start

### Solution
An anonymous mental health portal that provides:
- ✓ Complete anonymity with secure anonymous IDs
- ✓ Professional counselors trained to help
- ✓ Safe, judgment-free environment
- ✓ 24/7 availability
- ✓ Easy-to-use interface

---

## Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Vite** - Fast build tool
- **CSS3** - Responsive styling

### Backend
- **Node.js** - Runtime environment
- **Express 5** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

---

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas cloud)
- Git

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd anonymous-mental-health-portal
```

### Step 2: Setup Backend

#### 2a. Navigate to server directory
```bash
cd server
```

#### 2b. Install dependencies
```bash
npm install
```

#### 2c. Create .env file
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mental-health-portal
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

**For MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mental-health-portal
```

#### 2d. Start the server
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Server will run on: **http://localhost:5000**

### Step 3: Setup Frontend

#### 3a. Navigate to client directory
```bash
cd ../client
```

#### 3b. Install dependencies
```bash
npm install
```

#### 3c. Create .env file
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

#### 3d. Start development server
```bash
npm run dev
```

Client will run on: **http://localhost:5173**

---

## Application Features

### For Students (Anonymous Users)

1. **Submit Issues Anonymously**
   - Share concerns without revealing identity
   - Select category and severity level
   - Receive unique anonymous ID

2. **Track Issue Status**
   - Check status using anonymous ID
   - View counselor's response
   - See timeline of updates

3. **Browse Resources**
   - View available counselors
   - Learn about specializations
   - Understand the process

### For Counselors

1. **Authentication**
   - Register with credentials
   - Secure login with JWT
   - Profile management

2. **Dashboard**
   - View all submitted issues
   - Filter by status and category
   - Statistics and analytics

3. **Issue Management**
   - Assign issues to themselves
   - View issue details
   - Provide responses
   - Mark issues as resolved

---

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Counselor registration
- `POST /login` - Counselor login
- `GET /me` - Get current counselor (protected)

### Issue Routes (`/api/issues`)
- `POST /submit` - Submit anonymous issue
- `GET /:anonId` - Get issue by anonymous ID
- `GET /` - Get all issues (protected)
- `PUT /:issueId/assign` - Assign issue (protected)
- `PUT /:issueId/response` - Add counselor response (protected)
- `DELETE /:issueId` - Delete issue (protected)

### Counselor Routes (`/api/counselors`)
- `GET /` - Get all counselors
- `GET /:counselorId` - Get counselor details
- `GET /:counselorId/issues` - Get counselor's issues (protected)
- `PUT /:counselorId/profile` - Update profile (protected)
- `GET /:counselorId/stats` - Get statistics (protected)

---

## Database Schema

### Counselor Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (hashed, required),
  specialization: String (enum),
  isActive: Boolean,
  totalIssuesHandled: Number,
  createdAt: Date
}
```

### Issue Model
```javascript
{
  anonId: String (unique),
  title: String (required),
  description: String (required),
  category: String (enum),
  severity: String (Low/Medium/High/Critical),
  status: String (Open/Assigned/In Progress/Resolved),
  assignedCounselor: ObjectId (ref: Counselor),
  response: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Folder Structure

```
anonymous-mental-health-portal/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Issuecard.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── SubmitIssue.jsx
│   │   │   ├── ViewResponse.jsx
│   │   │   ├── CounselorLogin.jsx
│   │   │   ├── CounselorRegister.jsx
│   │   │   ├── CounselorDashboard.jsx
│   │   │   └── Resources.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── styles/
│   │   │   └── [CSS files]
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── issueController.js
│   │   └── counselorController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── Counselor.js
│   │   └── Issue.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── issueRoutes.js
│   │   └── counselorRoutes.js
│   ├── utils/
│   │   └── generateAnonId.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## Usage Examples

### 1. Student Submitting an Issue

**Request:**
```bash
curl -X POST http://localhost:5000/api/issues/submit \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Stress during exams",
    "description": "I am feeling overwhelmed with exams and need guidance",
    "category": "Academic",
    "severity": "High"
  }'
```

**Response:**
```json
{
  "success": true,
  "anonId": "ANON-ABC123-XYZ789",
  "issue": { ... }
}
```

### 2. Checking Issue Status

Navigate to: `http://localhost:5173/view-response/ANON-ABC123-XYZ789`

### 3. Counselor Login

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "counselor@example.com",
    "password": "password123"
  }'
```

---

## Security Considerations

1. **Authentication**
   - JWT tokens with expiration
   - Password hashing with bcryptjs
   - Protected routes with middleware

2. **Privacy**
   - Anonymous IDs instead of personal info
   - No personal data stored with issues
   - Secure communication

3. **Environment**
   - Sensitive keys in .env files
   - Never commit .env to version control
   - Use strong JWT secrets in production

---

## Testing the Application

### Manual Testing Workflow

1. **Open Application**
   - Navigate to http://localhost:5173

2. **Student Path**
   - Click "Submit Issue Anonymously"
   - Fill form with test data
   - Save the Anonymous ID
   - Check issue status page

3. **Counselor Path**
   - Click "Counselor Register"
   - Create test account
   - Login to dashboard
   - View submitted issues
   - Assign and respond to issues

---

## Deployment

### Backend Deployment (Heroku/Render/Railway)
```bash
cd server
# Create appropriate deployment configuration
# Push to deployment service
```

### Frontend Deployment (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy build folder to Vercel/Netlify
```

---

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running locally or Atlas connection string is correct
- Check MONGODB_URI in .env file

### CORS Error
- Verify frontend and backend URLs match in CORS configuration
- Check VITE_API_URL in client .env

### Port Already in Use
```bash
# Change port in .env or kill process
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000
```

### Dependencies Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Features Roadmap

- [ ] Email notifications for counselors
- [ ] Real-time chat between student and counselor
- [ ] Video call integration
- [ ] Resource library with articles
- [ ] Appointment scheduling
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Multi-language support
- [ ] Mobile app

---

## Contributing

Contributions are welcome! Please follow the code structure and conventions used in the project.

---

## Support & Contact

For issues or questions:
- Create an issue in the repository
- Contact the development team
- Email: support@mentalhealth.portal

---

## License

This project is open source and available under the MIT License.

---

## Acknowledgments

This project is built with the mission to help students overcome the stigma associated with seeking mental health support and to create a safe, anonymous space for guidance and counseling.

**Together, we can break the silence around mental health.** 🧠💚
