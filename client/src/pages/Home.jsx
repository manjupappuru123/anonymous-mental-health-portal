import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [anonId, setAnonId] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleSearch = () => {
    if (!anonId.trim()) {
      setSearchError('Please enter your anonymous ID');
      return;
    }
    navigate(`/view-response/${anonId}`);
    setAnonId('');
    setSearchError('');
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>🧠 Mental Health & Stress Support Portal</h1>
          <p className="subtitle">A Safe, Anonymous Space to Share Your Concerns</p>
          <p className="description">
            We understand that students often hesitate to approach counselors due to fear of judgment or social stigma.
            This portal provides a completely anonymous and confidential way to seek help.
          </p>

          <div className="hero-buttons">
            <button onClick={() => navigate('/submit-issue')} className="btn btn-primary">
              Share Your Concern Anonymously
            </button>
            <button onClick={() => navigate('/resources')} className="btn btn-secondary">
              Explore Resources & Counselors
            </button>
          </div>
        </div>
      </div>

      <div className="search-section">
        <div className="search-card">
          <h2>Check Your Issue Status</h2>
          <p>Enter your anonymous ID to view the status of your submitted concern</p>
          <div className="search-form">
            <input
              type="text"
              value={anonId}
              onChange={(e) => {
                setAnonId(e.target.value);
                setSearchError('');
              }}
              placeholder="Enter your Anonymous ID (e.g., ANON-XXXXX-XXXXX)"
              className="search-input"
            />
            <button onClick={handleSearch} className="search-btn">Search</button>
          </div>
          {searchError && <p className="search-error">{searchError}</p>}
        </div>
      </div>

      <div className="features-section">
        <h2>Why Choose Our Portal?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Complete Anonymity</h3>
            <p>Your personal identity is never revealed. We use secure anonymous IDs to protect your privacy.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Professional Support</h3>
            <p>Access to trained counselors and mental health professionals ready to help.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Confidential</h3>
            <p>All conversations and personal information are kept strictly confidential and secure.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⏰</div>
            <h3>Always Available</h3>
            <p>Submit your concerns 24/7. Counselors review and respond to your issues regularly.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Easy to Use</h3>
            <p>Simple and intuitive interface. No complicated forms or unnecessary questions.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✨</div>
            <h3>No Judgment</h3>
            <p>A safe space free from judgment. All concerns are treated with respect and compassion.</p>
          </div>
        </div>
      </div>

      <div className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Submit Your Concern</h3>
            <p>Share your issue anonymously with complete privacy protection</p>
          </div>
          <div className="arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Get Assigned</h3>
            <p>A suitable counselor is assigned based on your concern category</p>
          </div>
          <div className="arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Receive Support</h3>
            <p>Get professional guidance and support from our counselors</p>
          </div>
          <div className="arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Track Progress</h3>
            <p>Check your issue status anytime using your anonymous ID</p>
          </div>
        </div>
      </div>

      <div className="problem-solution">
        <div className="problem-card">
          <h3>🎓 The Problem</h3>
          <p>Students often hesitate to approach counselors due to:</p>
          <ul>
            <li>Fear of being judged by peers or authority figures</li>
            <li>Social stigma around mental health discussions</li>
            <li>Concerns about confidentiality and privacy</li>
            <li>Uncomfortable in-person interactions</li>
            <li>Not knowing where to start or who to talk to</li>
          </ul>
        </div>

        <div className="solution-card">
          <h3>💡 Our Solution</h3>
          <p>This portal addresses these concerns by providing:</p>
          <ul>
            <li>✓ Complete anonymity - no personal data required</li>
            <li>✓ Safe, judgment-free environment</li>
            <li>✓ Professional counselors trained to help</li>
            <li>✓ Secure and confidential communication</li>
            <li>✓ Easy access 24/7 from anywhere</li>
          </ul>
        </div>
      </div>

      <div className="testimonials">
        <h2>What Students Say</h2>
        <div className="testimonials-grid">
          <div className="testimonial">
            <p>"I felt much more comfortable sharing my concerns anonymously. The counselor's guidance was really helpful!"</p>
            <p className="author">- Anonymous Student</p>
          </div>
          <div className="testimonial">
            <p>"This portal helped me when I was too nervous to talk to the counselor in person. Highly recommended!"</p>
            <p className="author">- Anonymous Student</p>
          </div>
          <div className="testimonial">
            <p>"Finally, a safe space where I can be myself without worrying about judgment. Thank you!"</p>
            <p className="author">- Anonymous Student</p>
          </div>
        </div>
      </div>
    </div>
  );
}
