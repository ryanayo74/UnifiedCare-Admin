import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import '../css/AdminLoginPage.css';

function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Reference to the "facility" document inside the "users" collection
      const facilityRef = doc(db, "Users", "facility");

      // Get the document
      const facilityDoc = await getDoc(facilityRef);

      // Check if the facility document exists and if the email and password match
      if (facilityDoc.exists()) {
        const facilityData = facilityDoc.data();
        if (facilityData.email === email && facilityData.password === password) {
          // If credentials match, redirect to the AdminDashboardPage
          navigate('/AdminDashboardPage');
        } else {
          // If credentials do not match, show an error
          setError('Incorrect email or password.');
        }
      } else {
        // If the facility document does not exist, show an error
        setError('Facility not found in the system.');
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError('Failed to log in. Please check your email and password.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="logo">
          <img src="./assets/your-logo.png" alt="Logo" />
        </div>
        <h2>Welcome admin!</h2>
        <p>Please enter your details</p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-container">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="password-eye">&#128065;</span>
          </div>
          <div className="remember-forgot">
            <label>
              <input type="checkbox" /> Remember for 30 days
            </label>
            <a href="#">Forgot Password?</a>
          </div>
          <button type="submit" className="login-button">Log In</button>
        </form>
      </div>
      <div className="login-image">
        <img src="./assets/image.png" alt="Children" />
      </div>
    </div>
  );
}

export default AdminLoginPage;
