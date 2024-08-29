import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../config/firebase';
import { Bar } from 'react-chartjs-2';
import '../css/AdminDashboardPage.css';

import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from 'chart.js';
ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip);

function AdminDashboardPage() {
    const navigate = useNavigate();
    const [adminEmail, setAdminEmail] = useState('');
    const [facilityName, setFacilityName] = useState('Facility');
    const [facilityImage, setFacilityImage] = useState('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png'); // Default image
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
            fetchFacilityData(email);
        }
        
        // Fetch user data from Firestore
        fetchUserData();
    }, []);


    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file && currentDocId) {
            const storageRef = ref(storage, `facilityImages/${file.name}`);
            try {
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);

                const docRef = doc(db, "Users", "facility", "userFacility", currentDocId);
                await updateDoc(docRef, { image: downloadURL });

                setFacilityImage(downloadURL); 
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

    


    const fetchFacilityData = async (email) => {
        try {
            const querySnapshot = await getDocs(collection(db, "Users", "facility", "userFacility"));
            let found = false;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.email === email) {
                    setFacilityName(data.name || 'Sample Facility'); 
                    setFacilityImage(data.image || '/path-to-default-facility.jpg'); 
                    setCurrentDocId(doc.id); 
                    found = true;
                }
            });

            if (!found) {
                console.error("No document found with this email.");
                setError("No document found with this email.");
            }
        } catch (error) {
            console.error("Error fetching facility data:", error);
            setError("Failed to fetch facility data.");
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
    
            console.log('Parent Data by Month:', parentCountByMonth);
            console.log('Therapist Data by Month:', therapistCountByMonth);
    
            setParentData(parentCountByMonth);
            setTherapistData(therapistCountByMonth);
    
        } catch (error) {
            console.error("Error fetching user data:", error);
            setError("Failed to fetch user data.");
        }
    };    
   
    // Bar chart data and options
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [
            {
                label: 'Parents',
                data: parentData, // Dynamic data for parents
                backgroundColor: 'blue'
            },
            {
                label: 'Therapist',
                data: therapistData, // Dynamic data for therapists
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

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('adminEmail');
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
                    <a href="#" className="menu-item" onClick={() => navigate('/TherapistListPage')}>Therapist</a>
                    <a href="#" className="menu-item" onClick={() => navigate('/AdminParentsListPage')}>Parents</a>
                    <a href="#" className="menu-item">Announcements</a>
                    <a href="#" className="menu-item">Approval</a>
                    <a href="#" className="menu-item" onClick={() => navigate('/FacilityMessagePage')}>Messages</a>
                </nav>
                <div className="logout">
                    <a href="#" onClick={handleLogout}>Logout</a>
                </div>
            </aside>
            <main className="main-content">
                <div className="facility-info">
                    <img
                        src={facilityImage}
                        alt=""
                        className="facility-img"
                        onClick={() => document.getElementById('imageUpload').click()}
                        style={{ cursor: 'pointer' }}
                        onError={() => setFacilityImage('/path-to-default-facility.jpg')} 
                    />
                    <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                    />
                    <span>{facilityName}</span>
                    {error && <p className="error">{error}</p>}
                </div>
                <section className="dashboard">
                    <div className="chart-container">
                        <Bar data={data} options={options} />
                    </div>
                    <div className="user-stats">
                        <p>Total users: <span>{totalUsers}</span></p>
                        <p>Therapist users: <span>{therapistUsers}</span></p>
                        <p>Parent users: <span>{parentUsers}</span></p>
                        <p>Average Session Duration: <span>3m 12s</span></p>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default AdminDashboardPage;
