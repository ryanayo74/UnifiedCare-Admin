import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase'; 
import '../css/FacilityMessagePage.css';


const currentUserId = "currentLoggedInUserId";

function FacilityMessagePage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove the authentication status from localStorage
    localStorage.removeItem('isAuthenticated');
  
    // Redirect to the login page
    navigate('/AdminLoginPage');
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data: ', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserClick = (userId) => {
    navigate(`/messages/${userId}?currentUserId=${currentUserId}`);
  };
 
  return (
    <div className=" facility-message-page">
    <aside className="sidebar">
        <div className="logo-container">
            <img src="/path-to-logo.png" alt="UnifiedCare Logo" className="logo" />
        </div>
        <nav className="menu">
                    <a href="#" className="menu-item" onClick={() => navigate('/AdminDashboardPage')}>Dashboard</a>
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
        <header className="main-header">
          <h2>Messages</h2>
          <div className="search-container">
            <input type="text" placeholder="Search here..." />
          </div>
        </header>

       
      </main>
    </div>
  );
}

export default FacilityMessagePage;