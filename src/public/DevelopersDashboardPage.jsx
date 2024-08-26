import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../config/firebase';
import '../css/AdminDashboardPage.css';

function DevelopersDashboardPage() {
    const navigate = useNavigate();
    const [adminEmail, setAdminEmail] = useState('');
    const [developerName, setDeveloperName] = useState('Developer');
    const [profileImage, setProfileImage] = useState('/path-to-default-profile.jpg'); // Default image
    const [error, setError] = useState(null);
    const [currentDocId, setCurrentDocId] = useState(null);

    useEffect(() => {
        // Fetch admin email from localStorage
        const email = localStorage.getItem('adminEmail');
        if (email) {
            setAdminEmail(email);
            fetchDeveloperData(email);
        }
    }, []);

    const fetchDeveloperData = async (email) => {
        try {
            // Query all documents in the 'AdminDevUsers' collection
            const querySnapshot = await getDocs(collection(db, "Users", "adminDev", "AdminDevUsers"));
            
            let found = false;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.email === email) {
                    setDeveloperName(data.name || 'Sample Developer'); // Update developer name
                    setProfileImage(data.profileImage || '/path-to-default-profile.jpg'); // Update profile image
                    setCurrentDocId(doc.id); // Save the document ID for future updates
                    found = true;
                }
            });

            if (!found) {
                console.error("No document found with this email.");
                setError("No document found with this email.");
            }
        } catch (error) {
            console.error("Error fetching developer data:", error);
            setError("Failed to fetch developer data.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('adminEmail');
        navigate('/AdminLoginPage');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file && currentDocId) { // Check if file is selected and currentDocId is available
            const storageRef = ref(storage, `developerProfiles/${file.name}`);
            try {
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);

                const docRef = doc(db, "Users", "adminDev", "AdminDevUsers", currentDocId);
                await updateDoc(docRef, { profileImage: downloadURL });

                setProfileImage(downloadURL); // Update state with the new image URL
                setError(null); // Clear any previous errors
            } catch (error) {
                console.error("Error uploading image:", error);
                setError("Failed to upload the image. Please try again.");
            }
        } else if (!currentDocId) {
            console.error("No valid document ID found.");
            setError("No valid document ID found to update.");
        }
    };

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="logo-container">
                    <img src="https://i.ytimg.com/vi/CYcrmsdZuyw/sddefault.jpg" alt="UnifiedCare Logo" className="logo" />
                </div>
                <nav className="menu">
                    <a href="#" className="menu-item">Dashboard</a>
                    <a href="#" className="menu-item">Facilities</a>
                    <a href="#" className="menu-item">Approval</a>
                    <a href="#" className="menu-item">Announcements</a>
                    <a href="#" className="menu-item">Approval</a>
                </nav>
                <div className="logout">
                    <a href="#" onClick={handleLogout}>Logout</a>
                </div>
            </aside>
            <main className="main-content">
                <header className="header">
                    <div className="facility-info">
                        <img
                            src={profileImage}
                            alt="Profile"
                            className="facility-img"
                            onClick={() => document.getElementById('imageUpload').click()}
                            style={{ cursor: 'pointer' }}
                            onError={() => setProfileImage('/path-to-default-profile.jpg')} // Fallback to default image on error
                        />
                        <input
                            type="file"
                            id="imageUpload"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleImageUpload}
                        />
                        <span>{developerName}</span>
                        {error && <p className="error">{error}</p>}
                    </div>
                </header>
                <section className="dashboard">
                    <h1>Users</h1>
                    <canvas id="userChart"></canvas>
                    <div className="user-stats">
                        <p>Total Users: <span>35</span></p>
                        <p>Therapist Users: <span>12</span></p>
                        <p>Parent Users: <span>23</span></p>
                        <p>Average Session Duration: <span>3m 12s</span></p>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default DevelopersDashboardPage;
