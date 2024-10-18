import React, { useState, useEffect } from 'react';
import { doc, updateDoc, query, collection, where, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from '../config/firebase'; // Import auth from Firebase
import { updatePassword } from 'firebase/auth'; // Import updatePassword from Firebase Auth
import '../css/ChangePasswordPage.css';
import loginImage from '../assets/LoginBackgroundImage.png';
import logo from '../assets/loginLogo.png';
import { useNavigate } from 'react-router-dom';

function ChangePasswordPage() {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(true);
    const [userEmail, setUserEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        if (email) {
            setUserEmail(email);
        } else {
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

    const postClinicServiceToAPI = async (serviceData) => {
        try {
            const response = await fetch('/api/clinic_services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "clinic_id": serviceData.clinic_id,
                    "name": serviceData.name,
                    "description": serviceData.description
                })
            });
    
            if (response.ok) {
                console.log('Service posted successfully');
            } else {
                console.error('Failed to post service', response.statusText);
                alert('Failed to post service: ' + response.statusText);
            }
        } catch (error) {
            console.error('Error posting clinic service:', error);
            alert('Error posting clinic service: ' + error.message);
        }
    };
    
    const updatePasswordAndCopyDocument = async (email, newPassword) => {
        try {
            const userQuery = query(
                collection(db, "Users", "facility", "newUserFacility"),
                where("email", "==", email)
            );
            const querySnapshot = await getDocs(userQuery);
    
            if (querySnapshot.empty) {
                setErrorMessage("No user found with this email.");
                return;
            }
    
            querySnapshot.forEach(async (docSnapshot) => {
                const userData = docSnapshot.data();
                await updateDoc(docSnapshot.ref, { password: newPassword });
    
                const newUserData = {
                    ...userData,
                    password: newPassword,
                    status: "Active",
                    createdAt: new Date()
                };
                const newUserFacilityRef = doc(db, "Users", "facility", "userFacility", docSnapshot.id);
                await setDoc(newUserFacilityRef, newUserData);
    
                const clinicServicesRef = collection(docSnapshot.ref, "clinic_services");
                const clinicServicesSnapshot = await getDocs(clinicServicesRef);
    
                clinicServicesSnapshot.forEach(async (serviceDoc) => {
                    const serviceData = serviceDoc.data();
                    const serviceName = serviceData.name;
    
                    if (serviceName) {
                        const newServiceRef = doc(newUserFacilityRef, "clinic_services", serviceName);
                        await setDoc(newServiceRef, serviceData);
    
                        // Post each clinic service to your API
                        await postClinicServiceToAPI(serviceData);
                    } else {
                        console.error("Service document is missing the 'name' field.");
                    }
                });
    
                clinicServicesSnapshot.forEach(async (serviceDoc) => {
                    await deleteDoc(serviceDoc.ref);
                });
    
                await deleteDoc(docSnapshot.ref);
    
                setSuccessMessage("Password updated and user data moved successfully, including clinic services.");
            });
    
            navigate('/AdminDashboardPage');
        } catch (error) {
            console.error("Error updating password and processing document: ", error);
            setErrorMessage("An error occurred while updating the password. Please try again.");
        }
    };    

    const handleSubmit = async (e) => {
        e.preventDefault();

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

        try {
            // Update Firebase Auth password
            const user = auth.currentUser;
            if (user) {
                await updatePassword(user, formData.password);
                console.log("Password updated in Firebase Auth.");
            } else {
                setErrorMessage("User is not authenticated.");
                return;
            }

            // Update Firestore password and process document
            await updatePasswordAndCopyDocument(userEmail, formData.password);

            // Clear form fields after successful operation
            setFormData({
                password: '',
                confirmPassword: ''
            });

        } catch (error) {
            console.error("Error updating password: ", error);
            setErrorMessage("An error occurred while updating the password. Please try again.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <div className="logo">
                    <img src={logo} alt="Logo" />
                </div>
                <h2>Welcome, Admin!</h2>
                <p>Please enter your new password details</p>
                <form className="change-password-form" onSubmit={handleSubmit}>
                    <div className="input-container">
                        <label>Email</label>
                        <input type="email" value={userEmail} disabled />
                    </div>
                    <div className="input-container">
                        <label>Create New Password</label>
                        <div className="password-input">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <span
                                type="button"
                                onClick={toggleShowPassword}
                                className="password-eye"
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </span>
                        </div>
                    </div>
                    <div className="input-container">
                        <label>Confirm New Password</label>
                        <div className="password-input">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            <span 
                                type="button"
                                onClick={toggleShowPassword}
                                className="password-eye"
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </span>
                        </div>
                    </div>

                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

                    <button type="submit" className="submit-button">
                        Change Password
                    </button>
                </form>
            </div>
            <div className="login-image">
                <img src={loginImage} alt="Login Background" />
            </div>
        </div>
    );
}

export default ChangePasswordPage;