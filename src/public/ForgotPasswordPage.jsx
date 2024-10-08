import React, { useState } from 'react'; 
import { sendPasswordResetEmail } from "firebase/auth"; // Firebase Auth for password reset
import { auth } from '../config/firebase'; 
import Swal from 'sweetalert2'; // Import SweetAlert
import { useNavigate } from 'react-router-dom'; // For navigation
import loginImage from '../assets/LoginBackgroundImage.png';
import logo from '../assets/loginLogo.png';
import '../css/ChangePasswordPage.css';

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const navigate = useNavigate(); // Initialize navigate function

    const handleChange = (e) => {
        setEmail(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation for email
        if (!email) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please enter your email.',
            });
            return;
        }

        // Send password reset email
        try {
            await sendPasswordResetEmail(auth, email);

            Swal.fire({
                icon: 'success',
                title: 'Email Sent!',
                text: 'Password reset email has been sent successfully. Check your inbox to complete the process.',
            }).then(() => {
                // After showing the success message, navigate to the login page
                navigate('/AdminLoginPage'); // Redirects to the login page
            });

        } catch (error) {
            console.error("Error sending reset email: ", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to send password reset email. Please check your email or try again.',
            });
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
            <div className="logo">
              <img src={logo} alt="Logo" />
            </div>
                <h2>Forgot Password</h2>
                <p>Enter your email to reset your password.</p>
                <form className="change-password-form" onSubmit={handleSubmit}>
                <div className="input-container">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="submit-button">
                        Send Reset Email
                    </button>
                </form>
            </div>
            <div className="login-image">
            <img src={loginImage} alt="Login Background" />
          </div>
        </div>
    );
}

export default ForgotPasswordPage;
