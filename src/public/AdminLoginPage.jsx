import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth } from '../config/firebase';
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
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check Firestore for a user document within the "facility" collection with the matching email
      const facilityQuery = query(collection(db, "facility"), where("email", "==", email));
      const querySnapshot = await getDocs(facilityQuery);

      // Check if a document with the email exists under "facility"
      if (!querySnapshot.empty) {
        // User exists in Firestore
        navigate('/admin-dashboard');
      } else {
        // If the user does not exist in Firestore, sign out and show error
        await auth.signOut();
        setError('User not found in the system.');
      }
    } catch (error) {
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
