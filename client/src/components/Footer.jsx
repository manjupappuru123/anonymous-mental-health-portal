import '../styles/Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>About Us</h4>
          <p>Providing anonymous mental health support to students in need. Your voice matters.</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/submit-issue">Submit Issue</a></li>
            <li><a href="/resources">Resources</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact</h4>
          <p>Email: support@mentalhealth.portal</p>
          <p>Available 24/7</p>
        </div>

        <div className="footer-section">
          <h4>Crisis Support</h4>
          <p>National Helpline: 1-800-HELP</p>
          <p>Emergency: Always call 911</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2024 Mental Health & Stress Support Portal. All rights reserved.</p>
      </div>
    </footer>
  );
}
