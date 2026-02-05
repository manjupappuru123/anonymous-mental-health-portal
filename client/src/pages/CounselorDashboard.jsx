import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issueAPI, counselorAPI } from '../services/api';
import '../styles/CounselorDashboard.css';

export default function CounselorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [response, setResponse] = useState('');
  const [responding, setResponding] = useState(false);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/counselor-login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  useEffect(() => {
    filterIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, statusFilter, categoryFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issuesRes, statsRes] = await Promise.all([
        issueAPI.getAllIssues(),
        counselorAPI.getStats(user._id)
      ]);
      setIssues(issuesRes.data.issues);
      setStats(statsRes.data.stats);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filterIssues = () => {
    let filtered = issues;
    if (statusFilter) {
      filtered = filtered.filter(i => i.status === statusFilter);
    }
    if (categoryFilter) {
      filtered = filtered.filter(i => i.category === categoryFilter);
    }
    setFilteredIssues(filtered);
  };

  const handleAssignIssue = async (issueId) => {
    try {
      await issueAPI.assignIssue(issueId, user._id);
      fetchData();
      alert('Issue assigned to you successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign issue');
    }
  };

  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      alert('Please enter a response');
      return;
    }

    try {
      setResponding(true);
      await issueAPI.addResponse(selectedIssue._id, response);
      setResponse('');
      setSelectedIssue(null);
      fetchData();
      alert('Response submitted successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit response');
    } finally {
      setResponding(false);
    }
  };


  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Resolved Issues</h3>
            <p className="stat-number">{stats?.resolvedIssues || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Issues</h3>
            <p className="stat-number">{stats?.pendingIssues || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Handled</h3>
            <p className="stat-number">{stats?.totalHandled || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Specialization</h3>
            <p className="spec-text">{user.specialization}</p>
          </div>
        </div>

        <div className="issues-section">
          <h2>Issues</h2>

          <div className="filters">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Academic">Academic</option>
              <option value="Personal">Personal</option>
              <option value="Mental Health">Mental Health</option>
              <option value="Financial">Financial</option>
              <option value="Relationship">Relationship</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="no-issues">No issues found</div>
          ) : (
            <div className="issues-list">
              {filteredIssues.map((issue) => (
                <div key={issue._id} className="issue-item">
                  <div className="issue-header">
                    <h3>{issue.title}</h3>
                    <span className={`status-badge status-${issue.status.toLowerCase()}`}>
                      {issue.status}
                    </span>
                  </div>
                  <p className="issue-category">Category: <strong>{issue.category}</strong></p>
                  <p className="issue-description">{issue.description.substring(0, 100)}...</p>
                  <div className="issue-meta">
                    <span>Anonymous ID: {issue.anonId}</span>
                    <span>Severity: <strong>{issue.severity}</strong></span>
                  </div>
                  <div className="issue-actions">
                    {issue.status === 'Open' && (
                      <button
                        onClick={() => handleAssignIssue(issue._id)}
                        className="btn-assign"
                      >
                        Assign to Me
                      </button>
                    )}
                    {issue.status === 'Assigned' && issue.assignedCounselor?._id === user._id && (
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        className="btn-respond"
                      >
                        View & Respond
                      </button>
                    )}
                    {issue.status === 'Resolved' && (
                      <span className="resolved-badge">✓ Resolved</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedIssue && (
        <div className="modal-overlay" onClick={() => setSelectedIssue(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedIssue.title}</h2>
              <button onClick={() => setSelectedIssue(null)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="issue-details">
                <p><strong>Anonymous ID:</strong> {selectedIssue.anonId}</p>
                <p><strong>Category:</strong> {selectedIssue.category}</p>
                <p><strong>Severity:</strong> {selectedIssue.severity}</p>
                <div className="description-box">
                  <strong>Description:</strong>
                  <p>{selectedIssue.description}</p>
                </div>
              </div>

              <div className="response-form">
                <h3>Your Response</h3>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your counseling response here..."
                  rows="8"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedIssue(null)} className="btn-cancel">
                Cancel
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={responding}
                className="btn-submit"
              >
                {responding ? 'Submitting...' : 'Submit Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
