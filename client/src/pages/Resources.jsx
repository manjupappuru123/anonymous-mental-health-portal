import { useState, useEffect } from 'react';
import { counselorAPI } from '../services/api';
import '../styles/Resources.css';

export default function Resources() {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCounselors();
  }, []);

  const fetchCounselors = async () => {
    try {
      setLoading(true);
      const response = await counselorAPI.getAllCounselors();
      setCounselors(response.data.counselors);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch counselors');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resources-container">
      <div className="resources-header">
        <h1>Available Counselors & Resources</h1>
        <p>Our dedicated team of professionals ready to help</p>
      </div>

      {loading && <div className="loading">Loading counselors...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="counselors-grid">
        {counselors.map((counselor) => (
          <div key={counselor._id} className="counselor-card">
            <div className="counselor-header">
              <div className="counselor-avatar">{counselor.name[0]}</div>
              <div className="counselor-info">
                <h3>{counselor.name}</h3>
                <p className="specialization">{counselor.specialization}</p>
              </div>
            </div>
            <div className="counselor-details">
              <p><strong>Email:</strong> {counselor.email}</p>
              <p><strong>Experience:</strong> {counselor.totalIssuesHandled} issues handled</p>
              <p><strong>Status:</strong> <span className="status-active">Active</span></p>
            </div>
          </div>
        ))}
      </div>

      {counselors.length === 0 && !loading && (
        <div className="no-counselors">No counselors available</div>
      )}

      <div className="resources-info">
        <h2>How to Use This Portal</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>1. Submit Your Issue</h3>
            <p>Go to the "Submit Issue" page and anonymously share your concern. Your identity is completely protected.</p>
          </div>
          <div className="info-card">
            <h3>2. Get Assigned a Counselor</h3>
            <p>Our team reviews your issue and assigns a suitable counselor based on their specialization.</p>
          </div>
          <div className="info-card">
            <h3>3. Receive Support</h3>
            <p>The assigned counselor provides guidance and support. Check your issue status using your anonymous ID.</p>
          </div>
          <div className="info-card">
            <h3>4. Track Progress</h3>
            <p>Monitor your issue status and counselor's response in real-time through our portal.</p>
          </div>
        </div>
      </div>

      <div className="resources-tips">
        <h2>Tips for Getting the Most Help</h2>
        <ul>
          <li>Be specific about your concern - the more details, the better the guidance</li>
          <li>Select the appropriate category for faster assignment</li>
          <li>Indicate severity level to help prioritize your issue</li>
          <li>Save your anonymous ID to track your issue</li>
          <li>Check back regularly for counselor responses</li>
          <li>Feel free to submit multiple issues on different topics</li>
        </ul>
      </div>
    </div>
  );
}
