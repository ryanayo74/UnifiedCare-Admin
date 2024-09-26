import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"; // Import Firebase Firestore with deleteDoc
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import Firebase Storage
import { db, storage } from '../../config/firebase'; // Firebase config import
import '../../css/DeveloperCss/DevelopersApprovalPage.css';

function FacilityApprovalPage() {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]); // State to hold pending users
  const [error, setError] = useState(null);
  const [profileImage, setProfileImage] = useState('/path-to-default-profile.jpg');
  const [developerName, setDeveloperName] = useState('Developer');
  const [currentDocId, setCurrentDocId] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null); // State to hold the selected facility for modal
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [facilityImage, setFacilityImage] = useState('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png');
  const [facilityAddress, setFacilityAddress] = useState('123 Facility St.');
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);

  const [facilityName, setFacilityName] = useState('');
  const [facilityMessage, setFacilityMessage] = useState('');
  const [facilityPhone, setFacilityPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Fetch pending users from Firebase Firestore
  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    if (email) {
      setAdminEmail(email);
      fetchFacilityData(email);
    }

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

  // Handle view details and set facility information
  const handleViewDetails = (facility) => {
    setSelectedFacility(facility); // Set the selected facility
    setFacilityName(facility.name || ''); // Set facility name in state
    setFacilityMessage(facility.message || ''); // Set facility message in state
    setFacilityPhone(facility.phoneNumber || ''); // Set facility phone number in state
    setIsModalOpen(true); // Open the modal
  };

  const closeModal = () => {
    setIsModalOpen(false); // Close the modal
  };

  // Save updated facility information back to Firebase
  const handleSaveChanges = async () => {
    if (selectedFacility && selectedFacility.id) {
      const docRef = doc(db, "Users", "facility", "pending", selectedFacility.id);
      try {
        await updateDoc(docRef, {
          name: facilityName,
          message: facilityMessage,
          phoneNumber: facilityPhone,
        });
        setIsModalOpen(false); // Close the modal after saving
        alert("Facility information updated successfully!");
      } catch (error) {
        console.error("Error updating facility information:", error);
        alert("Failed to update facility information.");
      }
    }
  };

 // Handle facility rejection and deletion with confirmation
const handleReject = async (facilityId) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this facility?");
    
    if (isConfirmed) {
      try {
        // Delete the facility document from Firebase
        const docRef = doc(db, "Users", "facility", "pending", facilityId);
        await deleteDoc(docRef);
        
        // Update the UI to remove the rejected facility
        setPendingUsers(pendingUsers.filter(user => user.id !== facilityId));
        alert("Facility rejected and deleted successfully.");
      } catch (error) {
        console.error("Error rejecting and deleting facility:", error);
        alert("Failed to reject and delete the facility.");
      }
    } else {
      // User cancelled the deletion
      alert("Deletion cancelled.");
    }
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
    <div className="dashboard-container">
            <aside className="sidebar">
                <div className="logo-container">
                    <img src="https://i.ytimg.com/vi/CYcrmsdZuyw/sddefault.jpg" alt="UnifiedCare Logo" className="logo" />
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

        <div className="content">
          <h1 className="title">Pending List</h1>
          {error && <p className="error">{error}</p>}
          <table className="pending-list-table">
            <thead>
              <tr>
                <th>Facility Name</th>
                <th>Professionals</th>
                <th>Email</th>
                <th>Actions</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user, index) => (
                <tr key={index}>
                  <td>{user.name}</td> {/* Replace with appropriate field from Firebase */}
                  <td>{user.professionals}</td> {/* Replace with appropriate field */}
                  <td>{user.email}</td> {/* Replace with appropriate field */}
                  <td>
                    <button className="approve-btn">✅</button>
                    <button className="reject-btn" onClick={() => handleReject(user.id)}>❌</button>
                  </td>
                  <td>
                    <a href="#" className="view-link" onClick={() => handleViewDetails(user)}>View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isModalOpen && selectedFacility && (
          <div className="modal">
            <div className="modal-content">
              <button className="close-modal-btn" onClick={closeModal}>X</button>
              <h2>Edit Facility Details</h2>
              <div>
                <label>Facility Name:</label>
                <input
                  type="text"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                />
              </div>
              <div>
                <label>Facility Message:</label>
                <textarea
                  value={facilityMessage}
                  onChange={(e) => setFacilityMessage(e.target.value)}
                />
              </div>
              <div>
                <label>Facility Phone Number:</label>
                <input
                  type="text"
                  value={facilityPhone}
                  onChange={(e) => setFacilityPhone(e.target.value)}
                />
              </div>
              <button className="save-btn" onClick={handleSaveChanges}>Save Changes</button>
            </div>
          </div>
        )}
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
                <input type="text" value={facilityName} readOnly />
              </div>

              <div className="modal-section description">
                <label>Facility Description</label>
                <textarea readOnly>
                  We are the best clinic
                </textarea>
              </div>

              <div className="modal-section">
                <label>Facility Address</label>
                <input type="text" value={facilityAddress} readOnly />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-update">UPDATE</button>
              <button className="btn-cancel" onClick={closeFacilityModal}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}

export default FacilityApprovalPage;
