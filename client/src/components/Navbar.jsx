import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Brain, ChevronDown, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import '../styles/Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const notificationRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationOpen(false);
      setNotificationError('');
      return;
    }

    const fetchUnread = async () => {
      try {
        const response = await notificationAPI.getUnreadCount();
        setUnreadCount(response.data?.count || 0);
        setNotificationError('');
      } catch (err) {
        console.error('Failed to load unread notifications:', err);
        setNotificationError(err.response?.data?.message || 'Failed to load notifications');
      }
    };

    fetchUnread();
  }, [user]);

  useEffect(() => {
    if (!notificationOpen || !user) {
      return;
    }

    const fetchNotifications = async () => {
      try {
        setNotificationLoading(true);
        const response = await notificationAPI.getNotifications({ page: 1, limit: 10 });
        setNotifications(response.data?.notifications || []);
        setNotificationError('');
      } catch (err) {
        console.error('Failed to load notifications:', err);
        setNotificationError(err.response?.data?.message || 'Failed to load notifications');
      } finally {
        setNotificationLoading(false);
      }
    };

    fetchNotifications();
  }, [notificationOpen, user]);

  useEffect(() => {
    if (!notificationOpen) {
      return;
    }

    const handleOutsideClick = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [notificationOpen]);

  const handleNotificationClick = () => {
    if (!user) {
      return;
    }
    setNotificationOpen((prev) => !prev);
  };

  const markNotificationAsRead = async (notificationId, isRead) => {
    if (isRead) {
      return;
    }
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data?.count || 0);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setNotificationError(err.response?.data?.message || 'Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString()
        }))
      );
      setUnreadCount(0);
      setNotificationError('');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      setNotificationError(err.response?.data?.message || 'Failed to update notifications');
    }
  };

  const formatNotificationLabel = (notification) => {
    if (notification?.type === 'IssueAssigned') {
      return 'New issue assigned';
    }
    return 'Notification';
  };

  const formatIssueId = (issueId) => {
    if (!issueId) {
      return 'N/A';
    }
    const idString = typeof issueId === 'string' ? issueId : issueId.toString();
    return idString.slice(-6);
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
              <div className="nav-notifications" ref={notificationRef}>
                <button
                  type="button"
                  className="notification-button"
                  onClick={handleNotificationClick}
                  aria-label="View notifications"
                >
                  <Bell aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="notification-badge" aria-label={`${unreadCount} unread notifications`}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {notificationOpen && (
                  <div className="notification-panel">
                    <div className="notification-header">
                      <span>Notifications</span>
                      <div className="notification-actions">
                        <span className="notification-count">{unreadCount} unread</span>
                        <button
                          type="button"
                          className="notification-mark-all"
                          onClick={markAllAsRead}
                          disabled={notifications.length === 0 || unreadCount === 0}
                        >
                          Mark all read
                        </button>
                      </div>
                    </div>
                    {notificationLoading ? (
                      <div className="notification-state">Loading...</div>
                    ) : notificationError ? (
                      <div className="notification-state error">{notificationError}</div>
                    ) : notifications.length === 0 ? (
                      <div className="notification-state">No notifications yet</div>
                    ) : (
                      <div className="notification-list">
                        {notifications.map((notification) => (
                          <button
                            key={notification._id}
                            type="button"
                            className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                            onClick={() => markNotificationAsRead(notification._id, notification.isRead)}
                          >
                            <div className="notification-title">
                              {formatNotificationLabel(notification)}
                            </div>
                            <div className="notification-meta">
                              <span>Issue: {formatIssueId(notification.issue?._id)}</span>
                              <span>{notification.issue?.category || 'General'}</span>
                              <span>{notification.issue?.severity || 'Medium'}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
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
