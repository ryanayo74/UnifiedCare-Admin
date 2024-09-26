import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, setDoc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../../config/firebase';
import loginImage from '../../assets/unifiedcarelogo.png';
import '../../css/DeveloperCss/DevelopersAnnouncementPage.css'; // You can create this file for styling

function DevelopersAnnouncementsPage() {
    const navigate = useNavigate();
    const [adminEmail, setAdminEmail] = useState('');
    const [developerName, setDeveloperName] = useState('Developer');
    const [profileDescription, setProfileDescription] = useState('Senior Developer at Company XYZ');
    const [profileImage, setProfileImage] = useState('/path-to-default-profile.jpg');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [newProfileImage, setNewProfileImage] = useState(null);

    const [error, setError] = useState(null);
    const [currentDocId, setCurrentDocId] = useState(null);
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
          fetchDeveloperData(email);
        }

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


    const handleRecipientChange = (event) => {
        setRecipient({
            ...recipient,
            [event.target.name]: event.target.checked
        });
    };

    const handleSend = () => {
        // Handle sending the announcement here
        console.log("Message:", message);
        console.log("Recipients:", recipient);
    };

    const handleFacilityImageClick = () => {
        setIsFacilityModalOpen(true); 
      };
    
      const closeFacilityModal = () => {
        setIsFacilityModalOpen(false);
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
                <a href="#" className="menu-item" onClick={() => navigate('/DevelopersDashboardPage')}>Dashboard</a>
                <a href="#" className="menu-item" onClick={() => navigate('/DevelopersFacilityListPage')}>Facilities</a>
                <a href="#" className="menu-item" onClick={() => navigate('/DevelopersApprovalPage')}>Approval</a>
                <a href="#" className="menu-item" onClick={() => navigate('/DevelopersAnnouncementPage')}>Announcements</a> 
                </nav>
                <div className="logout">
                    <a href="#" onClick={handleLogout}>Logout</a>
                </div>
            </aside>

            <div className="main-content">

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
                            />
                            Therapist
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                name="parents"
                                checked={recipient.parents}
                                onChange={handleRecipientChange}
                            />
                            Parents
                        </label>
                    </div>
                    <button className="send-btn" onClick={handleSend}>Send</button>
                </div>
            </div>

            
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

export default DevelopersAnnouncementsPage;
