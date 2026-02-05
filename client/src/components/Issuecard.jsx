import { useNavigate } from 'react-router-dom';
import '../styles/IssueCard.css';

export default function IssueCard({ issue }) {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    const colors = {
      'Open': '#ff9800',
      'Assigned': '#2196f3',
      'In Progress': '#9c27b0',
      'Resolved': '#4caf50'
    };
    return colors[status] || '#666';
  };

  return (
    <div className="issue-card" onClick={() => navigate(`/view-response/${issue.anonId}`)}>
      <div className="card-header">
        <h3>{issue.title}</h3>
        <span className="status-badge" style={{ backgroundColor: getStatusColor(issue.status) }}>
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
