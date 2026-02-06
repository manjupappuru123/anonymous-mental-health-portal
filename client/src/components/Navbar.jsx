import { useNavigate } from 'react-router-dom';
import { Brain, ChevronDown, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <h2 onClick={() => navigate(user ? '/counselor-dashboard' : '/')}>
            <span className="nav-icon">
              <Brain aria-hidden="true" />
              Mental Health Portal
            </span>
          </h2>
        </div>

        <div className="nav-menu">
          {user ? (
            <>
              <span className="nav-welcome">Welcome, {user.name}</span>
              <button onClick={() => navigate('/counselor-dashboard')} className="nav-link">Dashboard</button>
              <button onClick={handleLogout} className="nav-link logout">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/')} className="nav-link">Home</button>
              <button onClick={() => navigate('/submit-issue')} className="nav-link">Submit Issue</button>
              <button onClick={() => navigate('/resources')} className="nav-link">Resources</button>
              <div className="nav-dropdown">
                <button type="button" className="nav-link counselor-toggle">
                  I'm a counselor <ChevronDown className="caret" aria-hidden="true" />
                </button>
                <div className="dropdown-menu">
                  <button onClick={() => navigate('/counselor-login')} className="dropdown-item">
                    <span className="dropdown-icon"><LogIn aria-hidden="true" /></span>
                    Login
                  </button>
                  <button onClick={() => navigate('/counselor-register')} className="dropdown-item">
                    <span className="dropdown-icon"><UserPlus aria-hidden="true" /></span>
                    Register
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
