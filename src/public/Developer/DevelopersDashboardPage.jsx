import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../../config/firebase';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from 'chart.js';
import '../../css/DevelopersDashboardPage.css';

ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip);

function DevelopersDashboardPage() {
    const navigate = useNavigate();
    const [adminEmail, setAdminEmail] = useState('');
    const [developerName, setDeveloperName] = useState('Developer');
    const [profileDescription, setProfileDescription] = useState('Senior Developer at Company XYZ');
    const [profileImage, setProfileImage] = useState('/path-to-default-profile.jpg');
    const [error, setError] = useState(null);
    const [currentDocId, setCurrentDocId] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [newProfileImage, setNewProfileImage] = useState(null); // For storing the new image file

    const [totalUsers, setTotalUsers] = useState(0);
    const [therapistUsers, setTherapistUsers] = useState(0);
    const [parentUsers, setParentUsers] = useState(0);
    const [parentData, setParentData] = useState([0, 0, 0, 0, 0]);
    const [therapistData, setTherapistData] = useState([0, 0, 0, 0, 0]);

    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        if (email) {
            setAdminEmail(email);
            fetchDeveloperData(email);
        }
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
                    setProfileDescription(data.profileDescription || 'Senior Developer at Company XYZ');
                    setProfileImage(data.profileImage || '/path-to-default-profile.jpg');
                    setCurrentDocId(doc.id);
                    found = true;
                }
            });
            if (!found) {
                setError("No document found with this email.");
            }
        } catch (error) {
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

            const processUserData = (snapshot) => {
                const dataByMonth = [0, 0, 0, 0, 0];
                snapshot.forEach(doc => {
                    const userData = doc.data();
                    if (userData.createdAt) {
                        const month = userData.createdAt.toDate().getMonth();
                        if (month >= 0 && month < 5) {
                            dataByMonth[month]++;
                        }
                    }
                });
                return dataByMonth;
            };

            setParentData(processUserData(parentSnapshot));
            setTherapistData(processUserData(therapistSnapshot));

        } catch (error) {
            setError("Failed to fetch user data.");
        }
    };

    const handleProfileImageClick = () => {
        setIsProfileModalOpen(true);
      };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewProfileImage(file); // Store the new image file
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result); // Preview the uploaded image
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('adminEmail');
        navigate('/AdminLoginPage');
    };

    const handleUpdate = async () => {
        if (currentDocId) {
            try {
                const docRef = doc(db, "Users", "adminDev", "AdminDevUsers", currentDocId);
                // Update the profile information
                await updateDoc(docRef, {
                    name: developerName,
                    profileDescription: profileDescription
                });
                
                // Handle image upload if a new image was selected
                if (newProfileImage) {
                    const storageRef = ref(storage, `developerProfiles/${newProfileImage.name}`);
                    await uploadBytes(storageRef, newProfileImage);
                    const downloadURL = await getDownloadURL(storageRef);
                    await updateDoc(docRef, { profileImage: downloadURL });
                }

                // Reset new image state after updating
                setNewProfileImage(null);
                setIsProfileModalOpen(false); // Close modal after updating
                setError(null);
            } catch (error) {
                setError("Failed to update profile information.");
            }
        }
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
            legend: { position: 'bottom' }
        },
        scales: {
            y: { beginAtZero: true }
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
                    <a href="#" className="menu-item" onClick={() => navigate('/DevelopersFacilityListPage')}>Facilities</a>
                    <a href="#" className="menu-item" onClick={() => navigate('/DevelopersApprovalPage')}>Approval</a>
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
            onClick={handleProfileImageClick}
            style={{ cursor: 'pointer' }}
            onError={() => setProfileImage('/path-to-default-profile.jpg')}
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

            {isProfileModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <img 
                                src={profileImage} 
                                alt="Profile" 
                                className="modal-profile-img"
                                onClick={() => document.getElementById('imageUpload').click()}
                            />
                            <input 
                                type="file" 
                                id="imageUpload" 
                                accept="image/*"
                                style={{ display: 'none' }} 
                                onChange={handleImageUpload}
                            />
                        </div>

                        <div className="modal-body">
                            <div className="modal-section">
                                <label>Developer Name</label>
                                <input 
                                    type="text" 
                                    value={developerName} 
                                    onChange={(e) => setDeveloperName(e.target.value)} 
                                />
                            </div>
                            <div className="modal-section">
                                <label>Email</label>
                                <input type="text" value={adminEmail} readOnly />
                            </div>
                            <div className="modal-section description">
                                <label>Profile Description</label>
                                <textarea 
                                    value={profileDescription} 
                                    onChange={(e) => setProfileDescription(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-update" onClick={handleUpdate}>UPDATE</button>
                            <button className="btn-cancel" onClick={() => setIsProfileModalOpen(false)}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DevelopersDashboardPage;
