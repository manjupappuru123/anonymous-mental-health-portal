import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShieldCheck } from 'lucide-react';
import { issueAPI } from '../services/api';
import '../styles/SubmitIssue.css';

export default function SubmitIssue() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Academic');
  const [severity, setSeverity] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successAnonId, setSuccessAnonId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessAnonId('');

    if (!title || !description || !category) {
      setError('Please fill in all required fields');
      return;
    }

    if (title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    if (description.length < 20) {
      setError('Description must be at least 20 characters');
      return;
    }

    try {
      setLoading(true);
      const response = await issueAPI.submitIssue({
        title,
        description,
        category,
        severity
      });

      setSuccessAnonId(response.data.anonId);
      setTitle('');
      setDescription('');
      setCategory('Academic');
      setSeverity('Medium');

      setTimeout(() => {
        navigate(`/view-response/${response.data.anonId}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-issue-container">
      <div className="submit-issue-card">
        <h1>Share Your Concern</h1>
        <p className="subtitle">Your identity will remain completely anonymous</p>

        {error && <div className="error-message">{error}</div>}
        {successAnonId && (
          <div className="success-message">
            <h3 className="message-title">
              <CheckCircle aria-hidden="true" />
              Issue submitted successfully!
            </h3>
            <p>Your Anonymous ID: <strong>{successAnonId}</strong></p>
            <p className="save-id">Save this ID to track your issue status</p>
            <p className="redirecting">Redirecting to your issue...</p>
          </div>
        )}

        {!successAnonId && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief title of your concern"
                disabled={loading}
              />
              <small>{title.length}/100</small>
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
              >
                <option value="Academic">Academic</option>
                <option value="Personal">Personal</option>
                <option value="Mental Health">Mental Health</option>
                <option value="Financial">Financial</option>
                <option value="Relationship">Relationship</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="severity">Severity Level</label>
              <select
                id="severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                disabled={loading}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Detailed Description *</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide detailed information about your concern..."
                rows="6"
                disabled={loading}
              />
              <small>{description.length}/2000</small>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Anonymously'}
            </button>
          </form>
        )}

        <div className="privacy-notice">
          <h4 className="notice-title">
            <ShieldCheck aria-hidden="true" />
            Your Privacy is Protected
          </h4>
          <ul>
            <li>Complete anonymity - no personal information stored</li>
            <li>Your identity cannot be traced</li>
            <li>Only a unique anonymous ID links you to your issue</li>
            <li>All communications are secure and confidential</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
