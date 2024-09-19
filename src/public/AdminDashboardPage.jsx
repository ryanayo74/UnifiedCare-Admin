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
    const [facilityImage, setFacilityImage] = useState('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png');
    const [error, setError] = useState(null);
    const [currentDocId, setCurrentDocId] = useState(null);
    const [facilityDescription, setFacilityDescription] = useState('We are the best clinic');  // New state for description
    const [selectedImageFile, setSelectedImageFile] = useState(null);
  
    const [facilityAddress, setFacilityAddress] = useState('123 Facility St.');
    const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);

    const [totalUsers, setTotalUsers] = useState(0);
    const [therapistUsers, setTherapistUsers] = useState(0);
    const [parentUsers, setParentUsers] = useState(0);
    const [parentData, setParentData] = useState(new Array(12).fill(0)); // Data for all 12 months
    const [therapistData, setTherapistData] = useState(new Array(12).fill(0)); // Data for all 12 months

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [years, setYears] = useState([]); // List of years for the dropdown


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

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImageFile(file);  // Store the selected image file in state
            const imagePreviewURL = URL.createObjectURL(file);
            setFacilityImage(imagePreviewURL);  // Optionally, show a preview of the selected image
            setError(null);
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
            }
        } catch (error) {
            console.error("Error updating facility data:", error);
            setError("Failed to update the facility information. Please try again.");
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
                    setFacilityAddress(data.address || '123 Facility St.');
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

    const fetchUserData = async (year) => {
        try {
            const therapistSnapshot = await getDocs(collection(db, "Users", "therapists", "newUserTherapist"));
            const parentSnapshot = await getDocs(collection(db, "Users", "parents", "newUserParent"));

            const therapistCount = therapistSnapshot.size;
            const parentCount = parentSnapshot.size;

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

            setParentData(parentCountByMonth);
            setTherapistData(therapistCountByMonth);
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
                    <img src="https://i.ytimg.com/vi/CYcrmsdZuyw/sddefault.jpg" alt="UnifiedCare Logo" className="logo" />
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
                    <div className="year-selector">
                        <label htmlFor="year">Select Year:</label>
                        <select id="year" value={selectedYear} onChange={handleYearChange}>
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
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