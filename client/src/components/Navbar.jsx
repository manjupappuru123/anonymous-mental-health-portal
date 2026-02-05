import { useNavigate } from 'react-router-dom';
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
          <h2 onClick={() => navigate('/')}>🧠 Mental Health Portal</h2>
        </div>

        <div className="nav-menu">
          <button onClick={() => navigate('/')} className="nav-link">Home</button>
          <button onClick={() => navigate('/submit-issue')} className="nav-link">Submit Issue</button>
          <button onClick={() => navigate('/resources')} className="nav-link">Resources</button>

          {user ? (
            <>
              <button onClick={() => navigate('/counselor-dashboard')} className="nav-link">Dashboard</button>
              <button onClick={handleLogout} className="nav-link logout">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/counselor-login')} className="nav-link login">Counselor Login</button>
              <button onClick={() => navigate('/counselor-register')} className="nav-link register">Counselor Register</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
