import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from "firebase/firestore"; 
import '../css/AdminLoginPage.css';
import { db } from '../config/firebase';
import logo from '../assets/loginLogo.png';
import loginImage from '../assets/LoginBackgroundImage.png';

function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      let userAuthenticated = false;

      // Query the userFacility collection for the given email
      const facilityQuery = query(collection(db, "Users", "facility", "userFacility"), where("email", "==", email));
      const facilitySnapshot = await getDocs(facilityQuery);
      
      facilitySnapshot.forEach((doc) => {
        const facilityData = doc.data();
        if (facilityData.password === password) {
          userAuthenticated = true;
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('adminEmail', email); // Store the email
          localStorage.setItem('userType', 'AdminFacility');
          navigate('/AdminDashboardPage');
        }
      });

      if (!userAuthenticated) {
        // Query the AdminDevUsers collection for the given email
        const adminDevQuery = query(collection(db, "Users", "adminDev", "AdminDevUsers"), where("email", "==", email));
        const adminDevSnapshot = await getDocs(adminDevQuery);

        adminDevSnapshot.forEach((doc) => {
          const adminDevData = doc.data();
          if (adminDevData.password === password) {
            userAuthenticated = true;
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('adminEmail', email); // Store the email
            localStorage.setItem('userType', 'AdminDev');
            navigate('/DevelopersDashboardPage');
          }
        });
      }

      if (!userAuthenticated) {
        // Query the newUserFacility collection for the given email
        const newUserQuery = query(collection(db, "Users", "facility", "newUserFacility"), where("email", "==", email));
        const newUserSnapshot = await getDocs(newUserQuery);

        newUserSnapshot.forEach((doc) => {
          const newUserFacilityData = doc.data();
          if (newUserFacilityData.password === password) {
            userAuthenticated = true;
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('adminEmail', email); // Store the email
            localStorage.setItem('userType', 'NewUserFacility');
            navigate('/ChangePasswordPage');
          }
        });
      }

      if (!userAuthenticated) {
        setError('Incorrect email or password.');
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError('Failed to log in. Please check your email and password.');
    }
  };

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="logo">
          <img src={logo} alt="Logo" />
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
              type={showPassword ? "text" : "password"} // Toggle between "text" and "password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* Eye icon to toggle password visibility */}
            <span className="password-eye" onClick={togglePasswordVisibility}>
              {showPassword ? '🙈' : '👁️'} {/* Change icon based on visibility */}
            </span>
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
        <img src={loginImage} alt="Logo" />
      </div>
    </div>
  );
}

export default AdminLoginPage;
