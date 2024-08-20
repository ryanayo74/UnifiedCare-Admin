import React from 'react';
import '../css/AdminLoginPage.css';

function AdminLoginPage() {
  return (
    <div className="login-container">
      <div className="login-form">
        <div className="logo">
          <img src="./assets/your-logo.png" alt="Logo" />
        </div>
        <h2>Welcome admin!</h2>
        <p>Please enter your details</p>
        <form>
          <div className="input-container">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="Enter your email" required />
          </div>
          <div className="input-container">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Enter your password" required />
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
