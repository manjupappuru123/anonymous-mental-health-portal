import { useNavigate } from 'react-router-dom';
import '../styles/IssueCard.css';

export default function IssueCard({ issue }) {
  const navigate = useNavigate();
  const statusClass = `status-${issue.status.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="issue-card" onClick={() => navigate(`/view-response/${issue.anonId}`)}>
      <div className="card-header">
        <h3>{issue.title}</h3>
        <span className={`status-badge ${statusClass}`}>
          {issue.status}
        </span>
      </div>

      <p className="card-category">{issue.category}</p>
      <p className="card-description">{issue.description.substring(0, 80)}...</p>

      <div className="card-footer">
        <span className="anon-id">ID: {issue.anonId}</span>
        <span className="severity">Severity: {issue.severity}</span>
      </div>
    </div>
  );
}
