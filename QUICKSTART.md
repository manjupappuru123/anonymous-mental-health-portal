# Quick Start Guide - Anonymous Mental Health Portal

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js installed
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)

---

## Step 1: Setup Backend (Terminal 1)

```bash
# Navigate to server
cd server

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env - Set your MongoDB connection
# Windows: notepad .env
# Mac/Linux: nano .env

# Start server
npm run dev
```

✅ Server running on: **http://localhost:5000**

---

## Step 2: Setup Frontend (Terminal 2)

```bash
# Navigate to client
cd client

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Start client
npm run dev
```

✅ Client running on: **http://localhost:5173**

---

## Step 3: Test the Application

### Student Flow:
1. Visit http://localhost:5173
2. Click "Submit Issue Anonymously"
3. Fill in the form and submit
4. **Save your Anonymous ID** (e.g., ANON-XXXXX-XXXXX)
5. Use the ID to track your issue

### Counselor Flow:
1. Click "Counselor Register"
2. Create an account with test credentials
3. Login to access the dashboard
4. View submitted issues
5. Click "Assign to Me" on any issue
6. View full details and provide a response

---

## Database Setup

### Option 1: Local MongoDB
```bash
# Start MongoDB
mongod
```

### Option 2: MongoDB Atlas (Cloud - Recommended)
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Copy connection string
4. Add to `server/.env`:
   ```
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/mental-health-portal
   ```

---

## Key Features to Test

✓ **Submit Issue** - Anonymous submission
✓ **Track Status** - Check issue with Anonymous ID
✓ **Counselor Login** - Secure authentication
✓ **Dashboard** - View and manage issues
✓ **Responsive Design** - Works on desktop & mobile

---

## Common Commands

```bash
# Backend
npm run dev     # Start with auto-reload
npm start       # Start production

# Frontend
npm run dev     # Start dev server
npm run build   # Build for production
npm run preview # Preview built version
```

---

## Need Help?

Check the full [README.md](../README.md) for:
- Detailed API documentation
- Database schema
- Deployment instructions
- Troubleshooting guide

---

## Project Structure at a Glance

```
server/
├── models/          # Database schemas
├── controllers/     # Business logic
├── routes/          # API endpoints
├── middleware/      # Auth & error handling
└── server.js        # Entry point

client/
├── pages/           # Page components
├── components/      # Reusable components
├── services/        # API calls
├── context/         # Auth state
├── styles/          # CSS files
└── App.jsx          # Main component
```

---

## What Gets Created?

After first run, you'll have:

**Student Perspective:**
- Anonymous issue ID (never expires)
- Real-time status tracking
- Counselor responses

**Counselor Perspective:**
- Dashboard with all issues
- Assign & respond capability
- Statistics and analytics

---

**Now open http://localhost:5173 and start helping! 💚**
