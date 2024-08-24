import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from "firebase/firestore";
import { db } from '../config/firebase';
import '../css/AdminDashboardPage.css';

function AdminDashboardPage() {
    const navigate = useNavigate();
    const [adminEmail, setAdminEmail] = useState('');
    const [facilityName, setFacilityName] = useState('Sample Facility');
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch admin email from localStorage
        const email = localStorage.getItem('adminEmail');
        if (email) {
            setAdminEmail(email);
            fetchFacilityData(email);
        }
    }, []);

    const fetchFacilityData = async (email) => {
        try {
            // Correct document path according to your Firestore structure
            const docRef = doc(db, "Users", "facility", "newUserFacility", "sample2");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.email === email) { // Verify the email matches
                    if (data.name) { // Use `data.name` instead of `data.facilityName` since your document has `name`
                        setFacilityName(data.name);
                    }
                } else {
                    console.error("Email does not match the document.");
                    setError("Email does not match the document.");
                }
            } else {
                console.error("No document found.");
                setError("No document found with this email.");
            }
        } catch (error) {
            console.error("Error fetching facility data:", error);
            setError("Failed to fetch facility data.");
        }
    };

    // Logout function
    const handleLogout = () => {
        // Remove the authentication status and email from localStorage
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('adminEmail');

        // Redirect to the login page
        navigate('/AdminLoginPage');
    };

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="logo-container">
                    <img src="https://i.ytimg.com/vi/CYcrmsdZuyw/sddefault.jpg" alt="UnifiedCare Logo" className="logo" />
                </div>
                <nav className="menu">
                    <a href="#" className="menu-item">Dashboard</a>
                    <a href="#" className="menu-item">Therapist</a>
                    <a href="#" className="menu-item">Parents</a>
                    <a href="#" className="menu-item">Announcements</a>
                    <a href="#" className="menu-item">Approval</a>
                    <a href="#" className="menu-item" onClick={() => navigate('/FacilityMessagePage')}>Messages</a>
                </nav>
                <div className="logout">
                    {/* Attach the handleLogout function to the logout link */}
                    <a href="#" onClick={handleLogout}>Logout</a>
                </div>
            </aside>
            <main className="main-content">
                <header className="header">
                    <div className="facility-info">
                        <img src="/path-to-facility.jpg" alt="Facility" className="facility-img" />
                        <span>{facilityName}</span>
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

export default AdminDashboardPage;
