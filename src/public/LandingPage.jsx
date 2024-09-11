import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false); // State to control nav menu visibility

  useEffect(() => {
    // Simulate an API call or other logic
    setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Adjust the timeout as needed
  }, []);

  const handleJoinUsClick = () => {
    navigate('/ContactUsPage'); // Redirect to ContactUsPage
  };

  const handleLoginClick = () => {
    navigate('/AdminLoginPage'); // Redirect to AdminLoginPage
  };

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen); // Toggle the burger menu
  };

  return (
    <div className="landing-page">
      <header>
          {/* Burger menu button */}
          <button className="burger-menu" onClick={toggleNav}>
          &#9776; {/* Unicode character for burger icon */}
        </button>
        <div className="logo-container">
          <div className="logo-text">UnifiedCare</div>
        </div>

        {/* Traditional navigation for larger screens */}
        <nav className={isNavOpen ? "nav-open" : ""}>
          <a href="#">Home</a>
          <a href="#">About Us</a>
          <a href="#" className="login" onClick={handleLoginClick}>
            Log in
          </a>
        </nav>
      </header>

      <main>
        <h1>Grow your Facility with UnifiedCare!</h1>
        <p>
          Welcome to UnifiedCare! Join our network of top facilities and help
          provide the best care possible. Partner with us to reach more families
          and showcase your services. Let's work together to make a difference.
          Join UnifiedCare today!
        </p>
        <button className="register" onClick={handleJoinUsClick}>
          JOIN US NOW
        </button>
        <div className="image-container"></div>
      </main>
    </div>
  );
}

export default LandingPage;
