import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore"; 
import '../css/AdminLoginPage.css';
import { db } from '../config/firebase'; // Make sure to import your firebase configuration

function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Query all facilities in the "newUserFacility" collection
      const facilityQuery = query(collection(db, "Users", "facility", "newUserFacility"), where("email", "==", email));
      const facilitySnapshot = await getDocs(facilityQuery);
      
      let userAuthenticated = false;
      
      // Check if any facility document matches the email and password
      facilitySnapshot.forEach((doc) => {
        const facilityData = doc.data();
        if (facilityData.password === password) {
          userAuthenticated = true;
          localStorage.setItem('isAuthenticated', 'true');
          navigate('/AdminDashboardPage');
        }
      });

      // If not authenticated with a facility, check the admin credentials
      if (!userAuthenticated) {
        const adminRef = doc(db, "Users", "admin");
        const adminDoc = await getDoc(adminRef);

        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          if (adminData.email === email && adminData.password === password) {
            userAuthenticated = true;
            localStorage.setItem('isAuthenticated', 'true');
            navigate('/AdminDashboardPage');
          }
        }
      }

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
