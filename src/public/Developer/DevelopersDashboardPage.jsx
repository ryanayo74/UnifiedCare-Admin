import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../../config/firebase';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Line } from 'react-chartjs-2';
import '../../css/DeveloperCss/DevelopersDashboardPage.css';

ChartJS.register(BarElement, CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip);


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
    const [parentData, setParentData] = useState(new Array(12).fill(0)); // Updated for 12 months
    const [therapistData, setTherapistData] = useState(new Array(12).fill(0)); // Updated for 12 months
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Add year state
    const [years, setYears] = useState([]);
    const [viewMode, setViewMode] = useState('userData'); // Default to 'userData'
    const [averageSessionData, setAverageSessionData] = useState(new Array(12).fill(0));



    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        if (email) {
            setAdminEmail(email);
            fetchDeveloperData(email);
        }
        fetchYears(); // Fetch the years when users were created
    }, []); // Refetch data when the year changes

    useEffect(() => {
        if (years.length > 0) {
            fetchUserData(selectedYear); // Fetch data for the selected year
        }
    }, [selectedYear, years]);

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

    const fetchYears = async () => {
        try {
            const therapistSnapshot = await getDocs(collection(db, "Users", "therapists", "newUserTherapist"));
            const parentSnapshot = await getDocs(collection(db, "Users", "parents", "newUserParent"));

            const yearSet = new Set();

            therapistSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.createdAt) {
                    const year = userData.createdAt.toDate().getFullYear();
                    yearSet.add(year);
                }
            });

            parentSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.createdAt) {
                    const year = userData.createdAt.toDate().getFullYear();
                    yearSet.add(year);
                }
            });

            const yearArray = Array.from(yearSet).sort((a, b) => a - b);
            setYears(yearArray);
            if (!yearArray.includes(selectedYear)) {
                setSelectedYear(yearArray[0]); // Set the default selected year to the earliest year if the current year is not in the list
            }
        } catch (error) {
            console.error("Error fetching years:", error);
            setError("Failed to fetch years.");
        }
    };

    const fetchUserData = async (year) => {
        try {
            const therapistSnapshot = await getDocs(collection(db, "Users", "therapists", "newUserTherapist"));
            const parentSnapshot = await getDocs(collection(db, "Users", "parents", "newUserParent"));

            const therapistCount = therapistSnapshot.size;
            const parentCount = parentSnapshot.size;

            // Fetch average session durations (replace with your actual logic)
            const sessionSnapshot = await getDocs(collection(db, "Sessions"));
            const sessionDataByMonth = new Array(12).fill(0);
            const sessionCountByMonth = new Array(12).fill(0);

            setTherapistUsers(therapistCount);
            setParentUsers(parentCount);
            setTotalUsers(therapistCount + parentCount);

            const parentCountByMonth = new Array(12).fill(0);
            parentSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.createdAt) {
                    const userDate = userData.createdAt.toDate();
                    if (userDate.getFullYear() === year) {
                        const month = userDate.getMonth();
                        parentCountByMonth[month]++;
                    }
                } else {
                    console.warn("Parent Document missing 'createdAt':", doc.id);
                }
            });

            const therapistCountByMonth = new Array(12).fill(0);
            therapistSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.createdAt) {
                    const userDate = userData.createdAt.toDate();
                    if (userDate.getFullYear() === year) {
                        const month = userDate.getMonth();
                        therapistCountByMonth[month]++;
                    }
                } else {
                    console.warn("Therapist Document missing 'createdAt':", doc.id);
                }
            });

            sessionSnapshot.forEach(doc => {
                const sessionData = doc.data();
                if (sessionData.sessionDuration && sessionData.createdAt) {
                    const sessionDate = sessionData.createdAt.toDate();
                    if (sessionDate.getFullYear() === year) {
                        const month = sessionDate.getMonth();
                        sessionDataByMonth[month] += sessionData.sessionDuration; // Assuming sessionDuration is in seconds
                        sessionCountByMonth[month]++;
                    }
                }
            });

            const avgSessionDurationByMonth = sessionDataByMonth.map((totalDuration, index) =>
            sessionCountByMonth[index] > 0 ? totalDuration / sessionCountByMonth[index] : 0
            );

            setParentData(parentCountByMonth);
            setTherapistData(therapistCountByMonth);
            setAverageSessionData(avgSessionDurationByMonth);
        } catch (error) {
            console.error("Error fetching user data:", error);
            setError("Failed to fetch user data.");
        }
    };

    const handleYearChange = (event) => {
        setSelectedYear(Number(event.target.value));
    };

    // Bar chart data and options
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Parents',
                data: parentData,
                backgroundColor: 'blue'
            },
            {
                label: 'Therapist',
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

        // Define data and options for the line chart
    const avgSessionData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Avg Session Duration (Users)',
                data: averageSessionData,
                backgroundColor: 'rgba(75,192,192,0.4)',
                borderColor: 'rgba(75,192,192,1)',
                fill: false,
            }
        ]
    };

    const avgSessionOptions = {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    {viewMode === 'avgSession' ? (
        <div className="chart-container">
            <Line data={avgSessionData} options={avgSessionOptions} />
        </div>
    ) : (
        // Existing Bar chart
        <div className="chart-container">
            <Bar data={data} options={options} />
        </div>
    )}

        // Toggle between userData and avgSession
    const handleModeChange = (event) => {
            setViewMode(event.target.value);
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('adminEmail');
        navigate('/AdminLoginPage');
    };

    return (
        <div className="dev-dashboard-container">
            <aside className="sidebar">
                <div className="logo-container">
                    <img src="https://i.ytimg.com/vi/CYcrmsdZuyw/sddefault.jpg" alt="UnifiedCare Logo" className="logo" />
                </div>
                <nav className="menu">
                    <a href="#" className="menu-item" onClick={() => navigate('/DevelopersDashboardPage')}>Dashboard</a>
                    <a href="#" className="menu-item" onClick={() => navigate('/DevelopersFacilityListPage')}>Facilities</a>
                    <a href="#" className="menu-item" onClick={() => navigate('/DevelopersApprovalPage')}>Approval</a>
                    <a href="#" className="menu-item" onClick={() => navigate('/DevelopersAnnouncementPage')}>Announcements</a> 
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
                <div className="year-selector">
                    <label htmlFor="year">Select Year:</label>
                    <select id="year" value={selectedYear} onChange={handleYearChange}>
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {/* Conditionally render either Bar or Line chart based on viewMode */}
                {viewMode === 'avgSession' ? (
                    <div className="chart-container">
                        <Line data={avgSessionData} options={avgSessionOptions} />
                    </div>
                ) : (
                    <div className="chart-container">
                        <Bar data={data} options={options} />
                    </div>
                )}

                <div className="user-stats">
                    <p>Total users: <span>{totalUsers}</span></p>
                    <p>Therapist users: <span>{therapistUsers}</span></p>
                    <p>Parent users: <span>{parentUsers}</span></p>
                    <p>Average Session Duration: <span>3m 12s</span></p>
                    <button onClick={() => setViewMode('avgSession')} className="avg-session-btn">Avg Session</button>
                    <button onClick={() => setViewMode('userData')} className="user-data-btn">User Data</button>
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
