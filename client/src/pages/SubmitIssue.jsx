import { useState } from 'react';
import { CheckCircle, ShieldCheck, Copy, Download, Bookmark } from 'lucide-react';
import { issueAPI } from '../services/api';
import '../styles/SubmitIssue.css';

export default function SubmitIssue() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Academic');
  const [severity, setSeverity] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successAnonId, setSuccessAnonId] = useState('');
  const [chatLink, setChatLink] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [showBookmarkHint, setShowBookmarkHint] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessAnonId('');
    setChatLink('');
    setCopyStatus('');
    setShowBookmarkHint(false);

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
      const link = response.data.chat?.link || '';
      const absoluteLink = link
        ? (link.startsWith('http') ? link : `${window.location.origin}${link}`)
        : '';
      setChatLink(absoluteLink);
      setTitle('');
      setDescription('');
      setCategory('Academic');
      setSeverity('Medium');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!chatLink) {
      return;
    }
    setCopyStatus('');
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(chatLink);
      } else {
        const tempInput = document.createElement('textarea');
        tempInput.value = chatLink;
        tempInput.setAttribute('readonly', '');
        tempInput.style.position = 'absolute';
        tempInput.style.left = '-9999px';
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopyStatus('Copied to clipboard');
    } catch {
      setCopyStatus('Copy failed. Please select and copy manually.');
    }
  };

  const handleDownload = () => {
    if (!chatLink) {
      return;
    }
    const content = `Student Chat Link\n${chatLink}\n\nKeep this link private. Anyone with this link can access the chat.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'student-chat-link.txt';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
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
            <div className="confirmation-card">
              <div className="confirmation-row">
                <span>Anonymous ID</span>
                <strong>{successAnonId}</strong>
              </div>
              <div className="confirmation-row">
                <span>Private Chat Link</span>
                <div className="chat-link-wrapper">
                  <input
                    type="text"
                    value={chatLink}
                    readOnly
                    aria-label="Private chat link"
                  />
                </div>
              </div>
              <div className="confirmation-actions">
                <button
                  type="button"
                  className="icon-btn tooltip-button"
                  data-tooltip="Copy chat link"
                  onClick={handleCopy}
                >
                  <Copy aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="icon-btn tooltip-button"
                  data-tooltip="Download link as .txt"
                  onClick={handleDownload}
                >
                  <Download aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="icon-btn tooltip-button"
                  data-tooltip="How to bookmark"
                  onClick={() => setShowBookmarkHint((prev) => !prev)}
                >
                  <Bookmark aria-hidden="true" />
                </button>
              </div>
              {copyStatus && <p className="copy-status">{copyStatus}</p>}
              {showBookmarkHint && (
                <div className="bookmark-hint">
                  <p>Windows/Linux: Ctrl + D</p>
                  <p>macOS: Cmd + D</p>
                  <p>Mobile: Use your browser menu to bookmark</p>
                </div>
              )}
              <p className="save-id">Keep this link safe. It cannot be recovered later.</p>
            </div>
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
