import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CounselorLogin from './pages/CounselorLogin';
import CounselorRegister from './pages/CounselorRegister';
import SubmitIssue from './pages/SubmitIssue';
import ViewResponse from './pages/ViewResponse';
import CounselorDashboard from './pages/CounselorDashboard';
import Resources from './pages/Resources';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  return user ? children : <Navigate to="/counselor-login" />;
}

function AppContent() {
  return (
    <Router>
      <div className="app-wrapper">
        <Navbar />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/counselor-login" element={<CounselorLogin />} />
            <Route path="/counselor-register" element={<CounselorRegister />} />
            <Route path="/submit-issue" element={<SubmitIssue />} />
            <Route path="/view-response/:anonId" element={<ViewResponse />} />
            <Route path="/resources" element={<Resources />} />
            <Route
              path="/counselor-dashboard"
              element={
                <ProtectedRoute>
                  <CounselorDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
