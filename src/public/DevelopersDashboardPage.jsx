import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../config/firebase';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from 'chart.js';
import '../css/DevelopersDashboardPage.css';

ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip);

function DevelopersDashboardPage() {
    const navigate = useNavigate();
    const [adminEmail, setAdminEmail] = useState('');
    const [developerName, setDeveloperName] = useState('Developer');
    const [profileImage, setProfileImage] = useState('/path-to-default-profile.jpg'); // Default image
    const [error, setError] = useState(null);
    const [currentDocId, setCurrentDocId] = useState(null);

    const [totalUsers, setTotalUsers] = useState(0);
    const [therapistUsers, setTherapistUsers] = useState(0);
    const [parentUsers, setParentUsers] = useState(0);
    const [parentData, setParentData] = useState([0, 0, 0, 0, 0]);
    const [therapistData, setTherapistData] = useState([0, 0, 0, 0, 0]);

    useEffect(() => {
        // Fetch admin email from localStorage
        const email = localStorage.getItem('adminEmail');
        if (email) {
            setAdminEmail(email);
            fetchDeveloperData(email);
        }

        // Fetch user data for chart
        fetchUserData();
    }, []);

    const fetchDeveloperData = async (email) => {
        try {
            const querySnapshot = await getDocs(collection(db, "Users", "adminDev", "AdminDevUsers"));

            let found = false;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.email === email) {
                    setDeveloperName(data.name || 'Sample Developer');
                    setProfileImage(data.profileImage || '/path-to-default-profile.jpg');
                    setCurrentDocId(doc.id);
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

    const fetchUserData = async () => {
        try {
            const therapistSnapshot = await getDocs(collection(db, "Users", "therapists", "newUserTherapist"));
            const parentSnapshot = await getDocs(collection(db, "Users", "parents", "newUserParent"));
    
            const therapistCount = therapistSnapshot.size;
            const parentCount = parentSnapshot.size;
    
            setTherapistUsers(therapistCount);
            setParentUsers(parentCount);
            setTotalUsers(therapistCount + parentCount);
    
            // Processing data for bar chart
            const parentCountByMonth = [0, 0, 0, 0, 0];
            parentSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.createdAt) {
                    const userDate = userData.createdAt.toDate();
                    const month = userDate.getMonth();
    
                    if (month >= 0 && month < 5) {
                        parentCountByMonth[month]++;
                    }
                } else {
                    console.warn("Parent Document missing 'createdAt':", doc.id);
                }
            });
    
            const therapistCountByMonth = [0, 0, 0, 0, 0];
            therapistSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.createdAt) {
                    const userDate = userData.createdAt.toDate();
                    const month = userDate.getMonth();
    
                    if (month >= 0 && month < 5) {
                        therapistCountByMonth[month]++;
                    }
                } else {
                    console.warn("Therapist Document missing 'createdAt':", doc.id);
                }
            });
    
            setParentData(parentCountByMonth);
            setTherapistData(therapistCountByMonth);
    
        } catch (error) {
            console.error("Error fetching user data:", error);
            setError("Failed to fetch user data.");
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file && currentDocId) {
            const storageRef = ref(storage, `developerProfiles/${file.name}`);
            try {
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);

                const docRef = doc(db, "Users", "adminDev", "AdminDevUsers", currentDocId);
                await updateDoc(docRef, { profileImage: downloadURL });

                setProfileImage(downloadURL);
                setError(null);
            } catch (error) {
                console.error("Error uploading image:", error);
                setError("Failed to upload the image. Please try again.");
            }
        } else if (!currentDocId) {
            console.error("No valid document ID found.");
            setError("No valid document ID found to update.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('adminEmail');
        navigate('/AdminLoginPage');
    };

    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [
            {
                label: 'Parents',
                data: parentData,
                backgroundColor: 'blue'
            },
            {
                label: 'Therapists',
                data: therapistData,
                backgroundColor: 'red'
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    return (
        <div className="dev-dashboard-container">
            <aside className="sidebar">
                <div className="logo-container">
                    <img src="https://i.ytimg.com/vi/CYcrmsdZuyw/sddefault.jpg" alt="UnifiedCare Logo" className="logo" />
                </div>
                <nav className="menu">
                    <a href="#" className="menu-item">Dashboard</a>
                    <a href="#" className="menu-item" onClick={() => navigate('/FacilitiesPage')}>Facilities</a>
                    <a href="#" className="menu-item">Approval</a>
                    <a href="#" className="menu-item">Announcements</a>                
               </nav>
                <div className="logout">
                    <a href="#" onClick={handleLogout}>Logout</a>
                </div>
            </aside>
            <main className="dev-main-content">
                    <div className="facility-info">
                        <img
                            src={profileImage}
                            alt="Profile"
                            className="facility-img"
                            onClick={() => document.getElementById('imageUpload').click()}
                            style={{ cursor: 'pointer' }}
                            onError={() => setProfileImage('/path-to-default-profile.jpg')}
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
                <section className="dev-dashboard">               
                    <h1>Users</h1>                 
                    <div className="chart-container">
                        <Bar data={data} options={options} />
                    </div>
                    <div className="user-stats">
                        <p>Total Users: <span>{totalUsers}</span></p>
                        <p>Therapist Users: <span>{therapistUsers}</span></p>
                        <p>Parent Users: <span>{parentUsers}</span></p>
                        <p>Average Session Duration: <span>3m 12s</span></p>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default DevelopersDashboardPage;
