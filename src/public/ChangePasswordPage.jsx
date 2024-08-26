import React, { useState, useEffect } from 'react';
import { doc, updateDoc, query, collection, where, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db } from '../config/firebase';
import '../css/ChangePasswordPage.css';
import { useNavigate } from 'react-router-dom';

function ChangePasswordPage() {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Retrieve the email from localStorage
        const email = localStorage.getItem('adminEmail');
        if (email) {
            setUserEmail(email);
        } else {
            // Redirect to login if no email is found
            navigate('/login');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrorMessage('');
        setSuccessMessage('');
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const updatePasswordAndCopyDocument = async (email, newPassword) => {
        try {
            // Query the document(s) where the email matches in newUserFacility collection
            const userQuery = query(
                collection(db, "Users", "facility", "newUserFacility"),
                where("email", "==", email)
            );
            const querySnapshot = await getDocs(userQuery);

            if (querySnapshot.empty) {
                setErrorMessage("No user found with this email.");
                return;
            }

            // Iterate over all matching documents (assuming email is unique, there should be only one)
            querySnapshot.forEach(async (docSnapshot) => {
                const userData = docSnapshot.data();

                // Update the password field
                await updateDoc(docSnapshot.ref, { password: newPassword });

                // Prepare data for the new collection
                const newUserData = {
                    ...userData,
                    password: newPassword, // Ensure password is updated
                    timestamp: new Date() // Optionally add a timestamp
                };

                // Set the document in userFacility collection with the same document ID
                await setDoc(
                    doc(db, "Users", "facility", "userFacility", docSnapshot.id),
                    newUserData
                );

                // Delete the document from the newUserFacility collection
                await deleteDoc(docSnapshot.ref);

                setSuccessMessage("Password updated and user data moved successfully.");
            });

            // Navigate to AdminDashboardPage
            navigate('/AdminDashboardPage');

        } catch (error) {
            console.error("Error updating password and processing document: ", error);
            setErrorMessage("An error occurred while updating the password. Please try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.password || !formData.confirmPassword) {
            setErrorMessage("Please fill in all password fields.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        if (formData.password.length < 6) {
            setErrorMessage("Password should be at least 6 characters long.");
            return;
        }

        // Update password and process document
        await updatePasswordAndCopyDocument(userEmail, formData.password);

        // Clear form fields after successful operation
        setFormData({
            password: '',
            confirmPassword: ''
        });
    };

    return (
        <div className="change-password-container">
            <div className="form-container">
                <img src="/path-to-logo.png" alt="UnifiedCare Logo" className="logo" />
                <h2>Welcome, Admin!</h2>
                <p>Please enter your new password details</p>
                <form className="change-password-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={userEmail} disabled />
                    </div>
                    <div className="form-group">
                        <label>Create New Password</label>
                        <div className="password-input">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                onClick={toggleShowPassword}
                                className="toggle-password"
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <div className="password-input">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                onClick={toggleShowPassword}
                                className="toggle-password"
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

                    <button type="submit" className="submit-button">
                        Change Password
                    </button>
                </form>
            </div>
            <div className="image-container">
                <img src="/path-to-image.jpg" alt="Children" className="background-image" />
            </div>
        </div>
    );
}

export default ChangePasswordPage;
