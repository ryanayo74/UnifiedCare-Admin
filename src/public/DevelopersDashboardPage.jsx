import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../config/firebase';
import '../css/AdminDashboardPage.css';

function DevelopersDashboardPage() {
    const navigate = useNavigate();
    const [profileImage, setProfileImage] = useState('/path-to-default-profile.jpg');
    const [error, setError] = useState(null);
    const [adminEmail, setAdminEmail] = useState('');
    const [documentName, setDocumentName] = useState(''); // Initialize as empty

    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        if (email) {
            setAdminEmail(email);
            fetchAdminData(email); // Fetch data including name and profile image
        }
    }, []);

    // Function to fetch admin data, including name and profile image
    const fetchAdminData = async (email) => {
        try {
            const docRef = doc(db, "Users", "adminDev", "AdminDevUsers", "Admin1");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.email === email) { // Check if the email matches
                    if (data.profileImage) {
                        setProfileImage(data.profileImage); // Set the fetched image URL
                    }
                    if (data.name) {
                        setDocumentName(data.name); // Set the fetched name
                    }
                } else {
                    console.error("Email does not match the document.");
                    setError("Email does not match the document.");
                }
            } else {
                console.error("No document found with the name 'Admin1'.");
                setError("No document found with the name 'Admin1'.");
            }

        } catch (error) {
            console.error("Error fetching admin data: ", error);
            setError("Failed to fetch admin data.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('adminEmail');
        navigate('/AdminLoginPage');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const storageRef = ref(storage, `AdminProfile/${file.name}`);

            try {
                await uploadBytes(storageRef, file); // Upload image to Firebase Storage
                const downloadURL = await getDownloadURL(storageRef); // Get the image download URL

                // Directly update the 'Admin1' document with the new profile image URL
                const docRef = doc(db, "Users", "adminDev", "AdminDevUsers", "Admin1");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().email === adminEmail) { // Check if the email matches
                    await updateDoc(docRef, { profileImage: downloadURL });

                    setProfileImage(downloadURL); // Update state with new image URL
                } else {
                    console.error("Email does not match or document does not exist.");
                    setError("Email does not match or document does not exist.");
                }

            } catch (error) {
                console.error("Error uploading image: ", error);
                setError("Failed to upload the image. Please try again.");
            }
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
                        />
                        <input
                            type="file"
                            id="imageUpload"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleImageUpload}
                        />
                        <span>{documentName || 'No Name Available'}</span> {/* Display name or fallback text */}
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
