import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, setDoc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../../config/firebase';
import loginImage from '../../assets/unifiedcarelogo.png';
import Swal from 'sweetalert2';
import '../../css/FacilityMessagePage.css';

const currentUserId = "currentLoggedInUserId";

function FacilityMessagePage() {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState('');
  const [facilityName, setFacilityName] = useState('Facility');
  const [facilityImage, setFacilityImage] = useState('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png');
  const [facilityAddress, setFacilityAddress] = useState('123 Facility St.');
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [facilityDescription, setFacilityDescription] = useState(''); 
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [error, setError] = useState(null);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data: ', error);
        setLoading(false);
      }
    };

    const email = localStorage.getItem('adminEmail');
    if (email) {
      setAdminEmail(email);
      fetchFacilityData(email);
    }

    fetchUsers();
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

const handleFacilityImageClick = () => {
    setIsFacilityModalOpen(true);
};

const closeFacilityModal = () => {
    setIsFacilityModalOpen(false);
    setSelectedImageFile(null);  // Clear selected file if modal is closed
};

  const handleUserClick = (userId) => {
    navigate(`/messages/${userId}?currentUserId=${currentUserId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('adminEmail');
    navigate('/AdminLoginPage');
  };

  return (
    <div className="facility-message-page">
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
      <main className="main-content">

      <header className="main-header">
      <h2>Messages</h2>
          <div className="search-container">
            <input type="text" placeholder="Search here..." />
          </div>
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
        </header>

        <div className="message-list">
          {loading ? (
            <p>Loading messages...</p>
          ) : (
            users.map(user => (
              <div key={user.id} className="message-item" onClick={() => handleUserClick(user.id)}>
                <img src={user.profilePicture || 'https://via.placeholder.com/50'} alt={user.name} />
                <div className="message-info">
                  <h3>{user.name}</h3>
                  <p>{user.lastMessage || "No message"}</p>
                </div>
              </div>
            ))
          )}
        </div>
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
export default FacilityMessagePage;
