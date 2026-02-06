import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Circle, Copy, Info } from 'lucide-react';
import { issueAPI } from '../services/api';
import '../styles/ViewResponse.css';

export default function ViewResponse() {
  const { anonId } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIssue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anonId]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      const response = await issueAPI.getIssueByAnonId(anonId);
      setIssue(response.data.issue);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch issue');
    } finally {
      setLoading(false);
    }
  };

  const toKebab = (value) => value.toLowerCase().replace(/\s+/g, '-');

  if (loading) {
    return (
      <div className="view-response-container">
        <div className="loading">Loading your issue...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-response-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="view-response-container">
        <div className="error-message">Issue not found</div>
      </div>
    );
  }

  const statusClass = `status-${toKebab(issue.status)}`;
  const severityClass = `severity-${toKebab(issue.severity)}`;

  return (
    <div className="view-response-container">
      <div className="response-card">
        <div className="response-header">
          <h1>Your Issue Status</h1>
          <div className="anon-id">
            <span className="label">Anonymous ID:</span>
            <span className="id">{anonId}</span>
            <button onClick={() => navigator.clipboard.writeText(anonId)} className="copy-btn">
              <Copy aria-hidden="true" />
              Copy
            </button>
          </div>
        </div>

        <div className="issue-details">
          <div className="detail-row">
            <span className="label">Title:</span>
            <span className="value">{issue.title}</span>
          </div>

          <div className="detail-row">
            <span className="label">Category:</span>
            <span className="badge badge-category">{issue.category}</span>
          </div>

          <div className="detail-row">
            <span className="label">Severity:</span>
            <span className={`badge badge-severity ${severityClass}`}>
              {issue.severity}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Status:</span>
            <span className={`badge badge-status ${statusClass}`}>
              {issue.status}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Description:</span>
            <div className="description">{issue.description}</div>
          </div>

          {issue.assignedCounselor && (
            <div className="detail-row">
              <span className="label">Assigned Counselor:</span>
              <span className="value">{issue.assignedCounselor.name}</span>
            </div>
          )}

          {issue.response && (
            <div className="response-section">
              <h3>Counselor's Response</h3>
              <div className="response-text">{issue.response}</div>
              <div className="response-meta">
                Updated: {new Date(issue.updatedAt).toLocaleDateString()}
              </div>
            </div>
          )}

          {!issue.response && issue.status !== 'Open' && (
            <div className="pending-message">
              <p>A counselor is reviewing your issue. You will receive a response soon.</p>
            </div>
          )}

          {issue.status === 'Open' && (
            <div className="pending-message">
              <p>Your issue is awaiting assignment to a counselor. Thank you for your patience.</p>
            </div>
          )}
        </div>

        <div className="timeline">
          <h3>Timeline</h3>
          <div className="timeline-item">
            <div className="timeline-status complete"><Check aria-hidden="true" /></div>
            <div className="timeline-text">
              <strong>Submitted</strong>
              <p>{new Date(issue.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="timeline-item">
            <div className={`timeline-status ${issue.status !== 'Open' ? 'complete' : 'pending'}`}>
              {issue.status !== 'Open' ? <Check aria-hidden="true" /> : <Circle aria-hidden="true" />}
            </div>
            <div className="timeline-text">
              <strong>Status Update</strong>
              <p>{issue.status}</p>
            </div>
          </div>
        </div>

        <div className="info-box">
          <h4 className="info-title"><Info aria-hidden="true" /> How It Works</h4>
          <ol>
            <li>Your issue is reviewed by our counseling team</li>
            <li>A suitable counselor is assigned based on the issue category</li>
            <li>You will receive a response from the counselor</li>
            <li>Check back here using your anonymous ID to view updates</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
