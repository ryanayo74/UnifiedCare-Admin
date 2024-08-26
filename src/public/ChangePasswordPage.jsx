import React, { useState, useEffect } from 'react';
import '../css/ChangePasswordPage.css'; // Import the corresponding CSS file

function ChangePasswordPage() {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        // Retrieve the email from localStorage
        const email = localStorage.getItem('adminEmail');
        if (email) {
            setUserEmail(email);
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission (e.g., validate and update password)
        if (formData.password === formData.confirmPassword) {
            console.log('Password changed successfully');
            // You may want to add logic here to actually update the password in the database
        } else {
            console.log('Passwords do not match');
        }
    };

    return (
        <div className="change-password-container">
            <div className="form-container">
                <img src="/path-to-logo.png" alt="UnifiedCare Logo" className="logo" />
                <h2>Welcome admin!</h2>
                <p>Please enter your details</p>
                <form className="change-password-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={userEmail} disabled />
                    </div>
                    <div className="form-group">
                        <label>Create new password</label>
                        <div className="password-input">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button type="button" onClick={toggleShowPassword} className="toggle-password">
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Confirm new password</label>
                        <div className="password-input">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            <button type="button" onClick={toggleShowPassword} className="toggle-password">
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="submit-button">Change new password</button>
                </form>
            </div>
            <div className="image-container">
                <img src="/path-to-image.jpg" alt="Children" className="background-image" />
            </div>
        </div>
    );
}

export default ChangePasswordPage;
