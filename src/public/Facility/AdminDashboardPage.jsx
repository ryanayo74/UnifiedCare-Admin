import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, setDoc, getDoc, arrayUnion, getFirestore } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getStorage, uploadBytesResumable } from "firebase/storage";
import { db, storage } from '../../config/firebase';
import { Bar } from 'react-chartjs-2';
import { Line } from 'react-chartjs-2';
import LeafletMap from '../LeafletMap';
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
    const [therapyService, setTherapyService] = useState('');
    const [totalUsers, setTotalUsers] = useState(0);
    const [therapistUsers, setTherapistUsers] = useState(0);
    const [parentUsers, setParentUsers] = useState(0);
    const [parentData, setParentData] = useState([]);
    const [therapistData, setTherapistData] = useState([]);
    const [averageSessionData, setAverageSessionData] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [years, setYears] = useState([]);
    const [viewMode, setViewMode] = useState('userData');
    const [additionalImages, setAdditionalImages] = useState(Array(5).fill(null));
    const [uploadedImages, setUploadedImages] = useState([]);
    const [modalPage, setModalPage] = useState(1);  // Page navigation in the modal
    const [showMap, setShowMap] = useState(false);
    const [suggestions, setSuggestions] = useState([]); 
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [scheduleAvailability, setScheduleAvailability] = useState([]);
    const storage = getStorage();
    const [imagesToRemove, setImagesToRemove] = useState([]);
    const [availabilitySchedule, setAvailabilitySchedule] = useState({
        Monday: { start: '', end: '' },
        Tuesday: { start: '', end: '' },
        Wednesday: { start: '', end: '' },
        Thursday: { start: '', end: '' },
        Friday: { start: '', end: '' },
    });

    
    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        const storedDocId = localStorage.getItem('currentDocId');
        if (email && storedDocId) {
            setAdminEmail(email);
            setCurrentDocId(storedDocId);  // Use stored doc ID if available
            fetchFacilityData(email).then(() => {
                fetchYears();  // Fetch years after facility data is loaded
            });
        } else if (email) {
            setAdminEmail(email);
            fetchFacilityData(email).then(() => {
                fetchYears();  // Fetch years after facility data is loaded
            });
        }
    }, []);

    useEffect(() => {
        const fetchExistingImages = async () => {
            const currentDocId = localStorage.getItem('currentDocId');
            if (currentDocId) {
                try {
                    const facilityDocRef = doc(db, "Users", "facility", "userFacility", currentDocId);
                    const facilityDoc = await getDoc(facilityDocRef);
                    if (facilityDoc.exists()) {
                        const data = facilityDoc.data();
                        const existingImages = data.uploadedImages || [];
                        const additionalImages = data.additionalImages || [];
                        setUploadedImages([...existingImages, ...additionalImages]);
                    }
                } catch (error) {
                    console.error("Error fetching existing images:", error);
                }
            }
        };

        fetchExistingImages();
    }, []);
    
    useEffect(() => {
        if (years.length > 0) {
            fetchUserData(selectedYear); // Fetch data for the selected year
        }
    }, [selectedYear, years]);
    
    useEffect(() => {
        if (currentDocId) {
            fetchYears();  // Fetch the years when users were created
        }
    }, [currentDocId]);

// Handle input change to fetch address suggestions
const handleInputChange = (e) => {
    const query = e.target.value;
    setFacilityAddress(query);
  
    if (query.length > 2) { // Start fetching suggestions when the input has more than 2 characters
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}+Cebu+City`)
        .then(response => response.json())
        .then(data => {
          setSuggestions(data);
        })
        .catch(err => console.error('Error fetching address suggestions:', err));
    } else {
      setSuggestions([]); // Clear suggestions if the input is too short
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
                    setFacilityDescription(data.description || 'Set your facility description');
                    setFacilityAddress(data.address || 'Set your facility address.');
                    setTherapyService(data.therapyService || 'Enter therapy services');
                    setCurrentDocId(doc.id);
                    localStorage.setItem('currentDocId', doc.id);  // Store the doc ID in localStorage
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

    

    const handleMoreImagesUpload = (event) => {
        const files = Array.from(event.target.files);
        const filePreviews = files.map(file => URL.createObjectURL(file));
    
        // Add new files and their previews to the existing ones
        setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
        setUploadedImages((prevImages) => [...prevImages, ...filePreviews]);
    };

    
    
    // Handle updating facility data, images, and clinic services
    const handleUpdateClick = async () => {
        try {
            let updatedData = {
                name: facilityName,
                description: facilityDescription,
                address: facilityAddress,
                therapyService: therapyService,
            };
    
            if (selectedImageFile && currentDocId) {
                const storageRef = ref(storage, `facilityImages/${selectedImageFile.name}`);
                await uploadBytes(storageRef, selectedImageFile);
                const downloadURL = await getDownloadURL(storageRef);
                updatedData.image = downloadURL;
            }
    
            const additionalImageURLs = await Promise.all(
                selectedFiles.map(async (file) => {
                    const storageRef = ref(storage, `facilityImages/${file.name}`);
                    await uploadBytes(storageRef, file);
                    return await getDownloadURL(storageRef);
                })
            );
    
            updatedData.additionalImages = arrayUnion(...additionalImageURLs); // Use arrayUnion to merge arrays
    
            if (currentDocId) {
                const docRef = doc(db, "Users", "facility", "userFacility", currentDocId);
                await updateDoc(docRef, updatedData);
    
                const clinicServicesRef = doc(db, "Users", "facility", "userFacility", currentDocId, "clinic_services", currentDocId);
                await setDoc(clinicServicesRef, {
                    name: facilityName,
                    description: facilityDescription,
                    department: therapyService,
                }, { merge: true });
    
                await postClinicServiceToAPI({
                    clinic_id: currentDocId,
                    name: facilityName,
                    description: facilityDescription,
                    department: therapyService,
                });
    
                setFacilityImage(updatedData.image || facilityImage);
                setAdditionalImages(Array(5).fill(null));
                setError(null);
                setIsFacilityModalOpen(false);
                setSelectedImageFile(null);
                setSelectedFiles([]);
                setUploadedImages([...uploadedImages, ...additionalImageURLs]); // Update state with new URLs
    
                Swal.fire({
                    icon: 'success',
                    title: 'Profile Updated!',
                    text: 'Your facility and services information have been updated.',
                    confirmButtonText: 'Okay',
                });
            }
        } catch (error) {
            console.error("Error updating facility data:", error);
            setError("Failed to update the facility. Please try again.");
    
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'There was an error updating the facility information.',
                confirmButtonText: 'Try Again',
            });
        }
    };

    const handleRemoveImage = (index) => {
        // Toggle the image's removal state
        if (imagesToRemove.includes(index)) {
            setImagesToRemove(imagesToRemove.filter(i => i !== index));
        } else {
            setImagesToRemove([...imagesToRemove, index]);
        }
    };

    const updateFirestoreImages = async (newImages) => {
        if (currentDocId) {
            try {
                const docRef = doc(db, "Users", "facility", "userFacility", currentDocId);
                await updateDoc(docRef, {
                    additionalImages: newImages
                });
                console.log("Firestore updated successfully");
            } catch (error) {
                console.error("Error updating Firestore:", error);
                setError("Failed to update the image list in Firestore.");
            }
        }
    };

    const handleSaveAvailability = async () => {
        try {
            const currentDocId = 'yourCurrentDocId'; // Replace with your logic to get the current document ID
            const docRef = doc(db, "Users", "facility", "userFacility", currentDocId, "scheduleAvailability", currentDocId);
            await setDoc(docRef, {
                availabilitySchedule: scheduleAvailability,
            }, { merge: true });

            Swal.fire({
                icon: 'success',
                title: 'Availability Saved!',
                text: 'Your schedule availability has been updated.',
                confirmButtonText: 'Okay',
            });

            setIsFacilityModalOpen(false);
            setModalPage(1);
        } catch (error) {
            console.error("Error saving availability:", error);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: 'There was an error saving your availability. Please try again.',
                confirmButtonText: 'Try Again',
            });
        }
    };


    const closeFacilityModal = () => {
        setIsFacilityModalOpen(false);
        setModalPage(1);  
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImageFile(file);
            const imagePreviewURL = URL.createObjectURL(file);
            setFacilityImage(imagePreviewURL);  
            setError(null);
        }
    };

    const handleFacilityImageClick = () => {
        setIsFacilityModalOpen(true);
    };

    const handleSuggestionClick = (suggestion) => {
        setFacilityAddress(suggestion.display_name);
        setShowMap(false); // Close map after selection
        setSuggestions([]); // Clear suggestions
      };

    const renderModalContent = () => (
        <div className="modal-body">
          {/* Facility Name */}
          <div className="modal-section">
            <label>Facility Name</label>
            <input
              type="text"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
            />
          </div>
      
          {/* Facility Description */}
          <div className="modal-section description">
            <label>Facility Description</label>
            <textarea
              value={facilityDescription}
              onChange={(e) => setFacilityDescription(e.target.value)}
            />
          </div>
      
          {/* Facility Address with Search and LeafletMap */}
          <div>
            <div className="modal-section">
              <label>Facility Address</label>
              <input
                type="text"
                value={facilityAddress}
                placeholder="Search or click on map to select"
                onClick={() => setShowMap(true)}
                onChange={handleInputChange} // Enable typing and fetching suggestions
              />
            </div>
      
            {/* Address Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="suggestion-item"
                  >
                    {suggestion.display_name}
                  </li>
                ))}
              </ul>
            )}
      
            {/* Show the Map for Address Selection */}
            {showMap && (
              <LeafletMap onSelectAddress={(address) => {
                setFacilityAddress(address);
                setShowMap(false); // Close map after selection
              }} />
            )}
          </div>
      
          {/* Therapy Services */}
          <div className="modal-section">
            <label>Therapy Services</label>
            <textarea
              value={therapyService}
              onChange={(e) => setTherapyService(e.target.value)}
            />
          </div>
        </div>
      );

      const renderScheduleAvailability = () => (
        <div className="modal-body">
            <h2>Schedule Availability</h2>
            <div className="availability-form">
                {Object.keys(scheduleAvailability).map((day) => (
                    <div key={day} className="availability-day">
                        <label>
                            <input
                                type="checkbox"
                                checked={scheduleAvailability[day].start !== ''} // Check if the day is selected
                                onChange={(e) => {
                                    const selected = e.target.checked;
                                    setScheduleAvailability(prev => ({
                                        ...prev,
                                        [day]: selected ? { ...prev[day], start: prev[day].start || '', end: prev[day].end || '' } : { start: '', end: '' },
                                    }));
                                }}
                            />
                            {day}
                        </label>
                        {scheduleAvailability[day].start && (
                            <div className="time-inputs">
                                <input
                                    type="time"
                                    value={scheduleAvailability[day].start}
                                    onChange={(e) => setScheduleAvailability(prev => ({
                                        ...prev,
                                        [day]: { ...prev[day], start: e.target.value },
                                    }))}
                                />
                                <span>to</span>
                                <input
                                    type="time"
                                    value={scheduleAvailability[day].end}
                                    onChange={(e) => setScheduleAvailability(prev => ({
                                        ...prev,
                                        [day]: { ...prev[day], end: e.target.value },
                                    }))}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

      const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('adminEmail');
        navigate('/AdminLoginPage');
    };

    const postClinicServiceToAPI = async (serviceData) => {
        try {
            // Step 1: Get the document reference for the clinic service
            const clinicServiceDocRef = doc(db, "Users", "facility", "userFacility", currentDocId, "clinic_services", currentDocId); 
            const clinicServiceDoc = await getDoc(clinicServiceDocRef);
    
            if (clinicServiceDoc.exists()) {
                const clinic_id = clinicServiceDoc.data().clinic_id;  // Retrieve the clinic_id from the document
                
                // Step 2: Proceed with the API call using the fetched clinic_id
                const response = await fetch(`/api/clinic_services/${clinic_id}`, {
                    method: 'POST',  // Use 'PUT' if updating an existing service
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        clinic_id: clinic_id,
                        name: serviceData.name,
                        description: serviceData.description,
                        department: serviceData.department
                    }),
                });
    
                if (response.ok) {
                    console.log('Service updated successfully');                  
                } else {
                    console.error('Failed to update service:', response.statusText);
                    alert('Failed to update service: ' + response.statusText);
                }
            } else {
                console.error('No such document exists!');
                alert('No clinic service found.');
            }
        } catch (error) {
            console.error('Error fetching clinic_id or updating clinic service:', error);
            alert('Error: ' + error.message);
        }
    };

    const fetchYears = async () => {
        if (!currentDocId) {
            return;
        }
    
        try {
            const therapistSnapshot = await getDocs(collection(db, "Users", "facility", "userFacility", currentDocId, "userTherapist"));
            const parentSnapshot = await getDocs(collection(db, "Users", "facility", "userFacility", currentDocId, "userParent"));
    
            const yearSet = new Set();
    
            // Handle therapist documents
            therapistSnapshot.forEach(doc => {
                const userData = doc.data();
                
                if (userData.createdAt) {
                    // Check if createdAt is a Firestore Timestamp
                    if (userData.createdAt.toDate) {
                        const year = userData.createdAt.toDate().getFullYear();
                        yearSet.add(year);
                    }
                    // Check if createdAt is a JavaScript Date object
                    else if (userData.createdAt instanceof Date) {
                        const year = userData.createdAt.getFullYear();
                        yearSet.add(year);
                    }
                    // Check if createdAt is a string and try to parse it as a Date
                    else if (typeof userData.createdAt === 'string') {
                        const date = new Date(userData.createdAt);
                        if (!isNaN(date.getTime())) {
                            const year = date.getFullYear();
                            yearSet.add(year);
                        } else {
                            console.warn(`Invalid date string for document ${doc.id}: ${userData.createdAt}`);
                        }
                    } else {
                        console.warn(`Unsupported createdAt format for document ${doc.id}:`, userData.createdAt);
                    }
                }
            });
    
            // Handle parent documents
            parentSnapshot.forEach(doc => {
                const userData = doc.data();
                
                if (userData.createdAt) {
                    if (userData.createdAt.toDate) {
                        const year = userData.createdAt.toDate().getFullYear();
                        yearSet.add(year);
                    } else if (userData.createdAt instanceof Date) {
                        const year = userData.createdAt.getFullYear();
                        yearSet.add(year);
                    } else if (typeof userData.createdAt === 'string') {
                        const date = new Date(userData.createdAt);
                        if (!isNaN(date.getTime())) {
                            const year = date.getFullYear();
                            yearSet.add(year);
                        } else {
                            console.warn(`Invalid date string for document ${doc.id}: ${userData.createdAt}`);
                        }
                    } else {
                        console.warn(`Unsupported createdAt format for document ${doc.id}:`, userData.createdAt);
                    }
                }
            });
    
            const yearArray = Array.from(yearSet).sort((a, b) => a - b);
            setYears(yearArray);
            if (!yearArray.includes(selectedYear)) {
                setSelectedYear(yearArray[0]);
            }
        } catch (error) {
            console.error("Error fetching years:", error);
            setError("Failed to fetch years.");
        }
    };

    const fetchUserData = async (year) => {
        if (!year) {
            console.error("Year is not defined.");
            setError("Year is not defined.");
            return;
        }
    
        try {
            const therapistSnapshot = await getDocs(collection(db, "Users", "facility", "userFacility", currentDocId, "userTherapist"));
            const parentSnapshot = await getDocs(collection(db, "Users", "facility", "userFacility", currentDocId, "userParent"));
    
            const therapistCount = therapistSnapshot.size;
            const parentCount = parentSnapshot.size;
    
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
                    const createdAtDate = userData.createdAt.toDate();
                    if (createdAtDate.getFullYear() === year) {
                        const month = createdAtDate.getMonth();
                        parentCountByMonth[month]++;
                    }
                } else {
                    console.warn(`Parent document ${doc.id} is missing 'createdAt'.`);
                }
            });
    
            const therapistCountByMonth = new Array(12).fill(0);
            therapistSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.createdAt) {
                    const createdAtDate = userData.createdAt.toDate();
                    if (createdAtDate.getFullYear() === year) {
                        const month = createdAtDate.getMonth();
                        therapistCountByMonth[month]++;
                    }
                } else {
                    console.warn(`Therapist document ${doc.id} is missing 'createdAt'.`);
                }
            });
    
            sessionSnapshot.forEach(doc => {
                const sessionData = doc.data();
                if (sessionData.sessionDuration && sessionData.createdAt) {
                    const sessionDate = sessionData.createdAt.toDate();
                    if (sessionDate.getFullYear() === year) {
                        const month = sessionDate.getMonth();
                        sessionDataByMonth[month] += sessionData.sessionDuration;
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
        const selectedYear = Number(event.target.value);
        setSelectedYear(selectedYear);
        fetchUserData(selectedYear); // Call fetchUserData with the updated year
    };
    
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

{/* Facility Modal */}
{isFacilityModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <img
                                src={facilityImage}
                                alt="Facility"
                                className="modal-facility-img"
                                onClick={() => document.getElementById('profileImageUpload').click()}
                            />
                            <input
                                type="file"
                                id="profileImageUpload"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleImageUpload}
                            />
                        </div>

                        <div className="page-navigation">
                            <button
                                className="page-btn"
                                onClick={() => setModalPage((prev) => prev - 1)}
                                disabled={modalPage === 1}
                            >
                                &lt;
                            </button>
                            <span>{`Page ${modalPage} of 3`}</span>
                            <button
                                className="page-btn"
                                onClick={() => setModalPage((prev) => prev + 1)}
                                disabled={modalPage === 3}
                            >
                                &gt;
                            </button>
                        </div>

                        {/* Conditional Rendering for Modal Pages */}
                        {modalPage === 1 ? (
                            renderModalContent()
                        ) : modalPage === 2 ? (
                            <div className="modal-body">
                                <div className="image-upload-section">
                                    <div className="upload-more-images">
                                        <input
                                            type="file"
                                            id="moreImageUpload"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            multiple
                                            onChange={handleMoreImagesUpload}
                                        />
                                        <button
                                            className="upload-more-btn"
                                            onClick={() => document.getElementById('moreImageUpload').click()}
                                        >
                                            Upload More Images
                                        </button>
                                    </div>

                                    <div className="uploaded-images-preview">
                                        {uploadedImages.map((image, index) => (
                                            image && (
                                                <div key={index} className="uploaded-image-wrapper">
                                                    <img
                                                        src={image}
                                                        alt={`Uploaded Image ${index + 1}`}
                                                        className="uploaded-image-preview"
                                                    />
                                                    <button 
                                                        className="remove-image-btn" 
                                                        onClick={() => handleRemoveImage(index)}
                                                    >
                                                        X
                                                    </button>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            renderScheduleAvailability() // Render the third modal for schedule availability
                        )}

                        <div className="modal-footer">
                            <button className="btn-update" onClick={modalPage === 3 ? handleSaveAvailability : handleUpdateClick}>
                                {modalPage === 3 ? 'UPDATE' : 'UPDATE'}
                            </button>
                            <button className="btn-cancel" onClick={() => setIsFacilityModalOpen(false)}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboardPage;