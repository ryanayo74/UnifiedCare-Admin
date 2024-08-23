import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore"; 
import '../css/AdminLoginPage.css';
import { db } from '../config/firebase'; // Import your Firebase configuration

function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Query for AdminFacility users
      const facilityQuery = query(collection(db, "Users", "facility", "newUserFacility"), where("email", "==", email));
      const facilitySnapshot = await getDocs(facilityQuery);
      
      let userAuthenticated = false;
      
      // Check if any facility document matches the email and password
      facilitySnapshot.forEach((doc) => {
        const facilityData = doc.data();
        if (facilityData.password === password) {
          userAuthenticated = true;
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userType', 'AdminFacility'); // Store user type
          navigate('/AdminDashboardPage'); // Navigate to AdminFacility dashboard
        }
      });

      // If not authenticated with a facility, check AdminDev credentials
      if (!userAuthenticated) {
        const adminDevQuery = query(collection(db, "Users", "adminDev", "AdminDevUsers"), where("email", "==", email));
        const adminDevSnapshot = await getDocs(adminDevQuery);

        adminDevSnapshot.forEach((doc) => {
          const adminDevData = doc.data();
          if (adminDevData.password === password) {
            userAuthenticated = true;
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userType', 'AdminDev'); // Store user type
            navigate('/DevelopersDashboardPage'); // Navigate to Developers dashboard
          }
        });
      }

      // If no authentication succeeded
      if (!userAuthenticated) {
        setError('Incorrect email or password.');
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
