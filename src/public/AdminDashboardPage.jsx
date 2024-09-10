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

    const [showModal, setShowModal] = useState(false); // State for modal visibility

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

    // Show modal when the image is clicked
    const handleImageClick = () => {
        setShowModal(true); // Show the modal
    };

    // Close the modal
    const closeModal = () => {
        setShowModal(false); // Hide the modal
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
                        onClick={handleImageClick} // Show modal on image click
                        style={{ cursor: 'pointer' }} // Makes the image clickable
                    />
                    <h2>{facilityName}</h2>
                    <div>
                        <input type="file" onChange={handleImageUpload} />
                    </div>
                </div>

                <div className="year-selector">
                    <label htmlFor="year-select">Select Year:</label>
                    <select id="year-select" value={selectedYear} onChange={handleYearChange}>
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="user-statistics">
                    <Bar
                        data={{
                            labels: [
                                "January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"
                            ],
                            datasets: [
                                {
                                    label: "Parents",
                                    data: parentData,
                                    backgroundColor: "rgba(255, 99, 132, 0.5)",
                                },
                                {
                                    label: "Therapists",
                                    data: therapistData,
                                    backgroundColor: "rgba(53, 162, 235, 0.5)",
                                }
                            ]
                        }}
                    />
                </div>
            </main>

            {/* Modal for image preview */}
            {showModal && (
                <div className="modal" onClick={closeModal}>
                    <div className="modal-content">
                        <span className="close-button" onClick={closeModal}>&times;</span>
                        <img src={facilityImage} alt="Facility" className="modal-img" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboardPage;
