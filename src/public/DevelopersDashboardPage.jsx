import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/AdminDashboardPage.css';

function DevelopersDashboardPage() {
    const navigate = useNavigate();

    // Logout function
    const handleLogout = () => {
        // Remove the authentication status from localStorage
        localStorage.removeItem('isAuthenticated');

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
                    <a href="#" className="menu-item">Facilities</a>
                    <a href="#" className="menu-item">Approval</a>
                    <a href="#" className="menu-item">Announcements</a>
                    <a href="#" className="menu-item">Approval</a>
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
                        <span>Sample Facility</span>
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
