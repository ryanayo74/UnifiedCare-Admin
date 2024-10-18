import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, setDoc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../../config/firebase';
import loginImage from '../../assets/unifiedcarelogo.png';
import Swal from 'sweetalert2';
import '../../css/AdminFacilityAnnouncementPage.css'; // You can create this file for styling

function AnnouncementsPage() {
    const navigate = useNavigate();
    const [adminEmail, setAdminEmail] = useState('');
    const [facilityName, setFacilityName] = useState('Facility');
    const [facilityImage, setFacilityImage] = useState('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png');
    const [facilityAddress, setFacilityAddress] = useState('123 Facility St.');
    const [facilityDescription, setFacilityDescription] = useState(''); 
    const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [error, setError] = useState(null);
    const [currentDocId, setCurrentDocId] = useState(null);
    const [therapyService, setTherapyService] = useState(''); 
    const [message, setMessage] = useState('');
    const [recipient, setRecipient] = useState({
        all: false,
        therapist: false,
        parents: false,
    });

    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        if (email) {
          setAdminEmail(email);
          fetchFacilityData(email);
        }

      }, []);

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
                    setTherapyService(data.therapyService || ''); // Retrieve therapy service here
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
    
            // Update Firestore document for facility profile
            if (currentDocId) {
                const docRef = doc(db, "Users", "facility", "userFacility", currentDocId);
                await updateDoc(docRef, updatedData);
    
                // Updating the 'clinic_services' collection with new name and description
                const clinicServicesRef = doc(db, "Users", "facility", "userFacility", currentDocId, "clinic_services", currentDocId); // Replace 'serviceDocId' with your document ID
                await setDoc(clinicServicesRef, {
                    name: facilityName,
                    description: facilityDescription
                }, { merge: true });  // Use merge to update fields without overwriting other data
    
                setFacilityImage(updatedData.image || facilityImage);  // If image updated, reflect it
                setError(null);
                setIsFacilityModalOpen(false);  // Close the modal
                setSelectedImageFile(null);  // Clear the selected file after update
    
                // Trigger SweetAlert success message
                Swal.fire({
                    icon: 'success',
                    title: 'Profile and Clinic Services Updated!',
                    text: 'Your facility and clinic services information have been successfully updated.',
                    confirmButtonText: 'Okay'
                });
            }
        } catch (error) {
            console.error("Error updating facility data:", error);
            setError("Failed to update the facility and clinic services information. Please try again.");
    
            // Trigger SweetAlert error message
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'There was an error updating your facility and clinic services information.',
                confirmButtonText: 'Try Again'
            });
        }
    };
    
    const handleFacilityImageClick = () => {
        setIsFacilityModalOpen(true);
    };

    const closeFacilityModal = () => {
        setIsFacilityModalOpen(false);
        setSelectedImageFile(null);  // Clear selected file if modal is closed
    };

    const handleRecipientChange = (event) => {
        const { name, checked } = event.target;
    
        if (name === 'all') {
            setRecipient({
                all: checked,
                therapist: checked,
                parents: checked,
            });
        } else {
            setRecipient({
                ...recipient,
                [name]: checked,
                all: recipient.therapist && recipient.parents && checked,  // Automatically check "All" if both others are selected manually
            });
        }
    };    

    const handleSend = () => {
        // Handle sending the announcement here
        console.log("Message:", message);
        console.log("Recipients:", recipient);
    };
    
      const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('adminEmail');
        navigate('/AdminLoginPage');
      };

    return (
        <div className="announcements-container">            
            <aside className="sidebar">
                <div className="logo-container">
                <img src={loginImage} alt="Logo" />
                <h2>UnifiedCare</h2>
                </div>
                <nav className="menu">
                    <a href="#" className="menu-item" onClick={() => navigate('/AdminDashboardPage')}>Dashboard</a>
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
            <div className="main-content">

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

                <div className="announcement-box">
                    <h2>Announcements</h2>
                    <textarea
                        className="message-input"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Message"
                    />
                   <div className="checkbox-group">
                    <label>
                        <input
                            type="checkbox"
                            name="all"
                            checked={recipient.all}
                            onChange={handleRecipientChange}
                        />
                        All
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            name="therapist"
                            checked={recipient.therapist}
                            onChange={handleRecipientChange}
                            disabled={recipient.all}  // Disable when "All" is selected
                        />
                        Therapist
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            name="parents"
                            checked={recipient.parents}
                            onChange={handleRecipientChange}
                            disabled={recipient.all}  // Disable when "All" is selected
                        />
                        Parents
                    </label>
                </div>

                    <button className="send-btn" onClick={handleSend}>Send</button>
                </div>
            </div>

            
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

                                <div className="modal-section">
                                <label>Therapy Services</label>  {/* New field for therapy services */}
                                <textarea
                                    value={therapyService}
                                    placeholder="Enter therapy services (optional)"
                                    onChange={(e) => setTherapyService(e.target.value)}  // Handle input change
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
export default AnnouncementsPage;
