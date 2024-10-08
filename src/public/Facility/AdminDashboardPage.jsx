import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../../config/firebase';
import { Bar } from 'react-chartjs-2';
import { Line } from 'react-chartjs-2';
import Swal from 'sweetalert2';
import loginImage from '../../assets/unifiedcarelogo.png';
import '../../css/AdminDashboardPage.css';

import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from 'chart.js';
ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip);

function AdminDashboardPage() {
    const navigate = useNavigate();
    const [adminEmail, setAdminEmail] = useState('');
    const [facilityName, setFacilityName] = useState('Facility');
    const [facilityImage, setFacilityImage] = useState('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png');
    const [error, setError] = useState(null);
    const [currentDocId, setCurrentDocId] = useState(null);
    const [facilityDescription, setFacilityDescription] = useState(''); 
    const [selectedImageFile, setSelectedImageFile] = useState(null);
  
    const [facilityAddress, setFacilityAddress] = useState('Set your facility address');
    const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);

    const [totalUsers, setTotalUsers] = useState(0);
    const [therapistUsers, setTherapistUsers] = useState(0);
    const [parentUsers, setParentUsers] = useState(0);
    const [parentData, setParentData] = useState(new Array(12).fill(0)); // Data for all 12 months
    const [therapistData, setTherapistData] = useState(new Array(12).fill(0)); // Data for all 12 months

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [years, setYears] = useState([]); // List of years for the dropdown

    const [viewMode, setViewMode] = useState('userData'); // Default to 'userData'
    const [averageSessionData, setAverageSessionData] = useState(new Array(12).fill(0));


    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        if (email) {
            setAdminEmail(email);
            fetchFacilityData(email);
        }
        fetchYears(); // Fetch the years when users were created
    }, []);
    

    useEffect(() => {
        if (years.length > 0) {
            fetchUserData(selectedYear); // Fetch data for the selected year
        }
    }, [selectedYear, years]);

    const fetchFacilityData = async (email) => {
        try {
            const querySnapshot = await getDocs(collection(db, "Users", "facility", "userFacility"));
            let found = false;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.email === email) {
                    setFacilityName(data.name || 'Sample Facility');
                    setFacilityImage(data.image || '/path-to-default-facility.jpg');
                    setFacilityDescription(data.description || 'Set your facility description');
                    setFacilityAddress(data.address || 'Set your facility address.');
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

    const handleUpdateClick = async () => {
        try {
            let updatedData = {
                name: facilityName,
                description: facilityDescription,
                address: facilityAddress,
            };

            if (selectedImageFile && currentDocId) {
                // Upload image to Firebase Storage
                const storageRef = ref(storage, `facilityImages/${selectedImageFile.name}`);
                await uploadBytes(storageRef, selectedImageFile);
                const downloadURL = await getDownloadURL(storageRef);
                updatedData.image = downloadURL;  // Add image URL to updated data
            }

            // Update Firestore document with new data (name, description, address, and image if available)
            if (currentDocId) {
                const docRef = doc(db, "Users", "facility", "userFacility", currentDocId);
                await updateDoc(docRef, updatedData);

                setFacilityImage(updatedData.image || facilityImage);  // If image updated, reflect it
                setError(null);
                setIsFacilityModalOpen(false);  // Close the modal
                setSelectedImageFile(null);  // Clear the selected file after update

                // Trigger SweetAlert success message
                Swal.fire({
                    icon: 'success',
                    title: 'Profile Updated!',
                    text: 'Your facility information has been successfully updated.',
                    confirmButtonText: 'Okay'
                });
            }
        } catch (error) {
            console.error("Error updating facility data:", error);
            setError("Failed to update the facility information. Please try again.");

            // Trigger SweetAlert error message
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'There was an error updating your facility information.',
                confirmButtonText: 'Try Again'
            });
        }
    };

        const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImageFile(file);  // Store the selected image file in state
            const imagePreviewURL = URL.createObjectURL(file);
            setFacilityImage(imagePreviewURL);  // Optionally, show a preview of the selected image
            setError(null);
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

    const handleFacilityImageClick = () => {
        setIsFacilityModalOpen(true);
    };

    const closeFacilityModal = () => {
        setIsFacilityModalOpen(false);
        setSelectedImageFile(null);  // Clear selected file if modal is closed
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
                <img src={loginImage} alt="Logo" />
                <h2>UnifiedCare</h2>
                </div>
                <nav className="menu">
                    <a href="#" className="menu-item">Dashboard</a>
                    <a href="#" className="menu-item" onClick={() => navigate('/TherapistListPage')}>Therapist</a>
                    <a href="#" className="menu-item" onClick={() => navigate('/AdminParentsListPage')}>Parents</a>
                    <a href="#" className="menu-item" onClick={() => navigate('/AdminFacilityAnnouncementPage')}>Announcements</a>
                    <a href="#" className="menu-item" onClick={() => navigate('/FacilityApprovalPage')}>Approval</a>
                    <a href="#" className="menu-item" onClick={() => navigate('/FacilityMessagePage')}>Messages</a>
                </nav>
                <div className="logout">
                    <a href="#" onClick={handleLogout}>Logout</a>
                </div>
            </aside>
            <main className="main-content">
                <div className="facility-info" onClick={handleFacilityImageClick} style={{ cursor: 'pointer' }}>
                    <img
                        src={facilityImage}
                        alt="Facility"
                        className="facility-img"
                        onError={() => setFacilityImage('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png')}
                    />
                    <span>{facilityName}</span>
                    {error && <p className="error">{error}</p>}
                </div>

                <section className="dashboard"> 
                     <h2 className='userText'>Users</h2>
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
                    <button onClick={() => setViewMode('userData')} className="user-data-btn">User Data</button>    
                    <button onClick={() => setViewMode('avgSession')} className="avg-session-btn">Avg Session</button>
                </div>
            </section>
            </main>

            {/* Modal for facility image and details */}
                {isFacilityModalOpen && (
                    <div className="modal">
                        <div className="modal-content">
                            <div className="modal-header">
                                <img
                                    src={facilityImage}
                                    alt="Facility"
                                    className="modal-facility-img"
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
                                    <label>Facility Name</label>
                                    <input 
                                        type="text" 
                                        value={facilityName} 
                                        onChange={(e) => setFacilityName(e.target.value)}  // Allow editing of Facility Name
                                    />
                                </div>

                                <div className="modal-section description">
                                    <label>Facility Description</label>
                                    <textarea 
                                        value={facilityDescription} 
                                        onChange={(e) => setFacilityDescription(e.target.value)}  // Allow editing of Description
                                    />
                                </div>

                                <div className="modal-section">
                                    <label>Facility Address</label>
                                    <input 
                                        type="text" 
                                        value={facilityAddress} 
                                        onChange={(e) => setFacilityAddress(e.target.value)}  // Allow editing of Address
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn-update" onClick={handleUpdateClick}>UPDATE</button>
                                <button className="btn-cancel" onClick={closeFacilityModal}>CANCEL</button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}

export default AdminDashboardPage;