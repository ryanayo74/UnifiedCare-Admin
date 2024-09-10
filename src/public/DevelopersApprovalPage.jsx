import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"; // Import Firebase Firestore with deleteDoc
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import Firebase Storage
import { db, storage } from '../config/firebase'; // Firebase config import
import '../css/DevelopersApprovalPage.css'; // Import your CSS file

function DevelopersApprovalPage() {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]); // State to hold pending users
  const [error, setError] = useState(null);
  const [profileImage, setProfileImage] = useState('/path-to-default-profile.jpg');
  const [developerName, setDeveloperName] = useState('Developer');
  const [currentDocId, setCurrentDocId] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null); // State to hold the selected facility for modal
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [facilityName, setFacilityName] = useState('');
  const [facilityMessage, setFacilityMessage] = useState('');
  const [facilityPhone, setFacilityPhone] = useState('');

  // Fetch pending users from Firebase Firestore
  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Users", "facility", "pending"));
        const fetchedUsers = [];
        querySnapshot.forEach((doc) => {
          fetchedUsers.push({ id: doc.id, ...doc.data() });
        });
        setPendingUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching pending users:", error);
        setError("Failed to fetch pending users.");
      }
    };

    fetchPendingUsers(); // Call the fetch function when the component mounts
    fetchDeveloperData();
  }, []);

  // Fetch developer data for profile image and name
  const fetchDeveloperData = async () => {
    const email = localStorage.getItem('adminEmail');
    if (email) {
      try {
        const querySnapshot = await getDocs(collection(db, "Users", "adminDev", "AdminDevUsers"));
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.email === email) {
            setDeveloperName(data.name || 'Sample Developer');
            setProfileImage(data.profileImage || '/path-to-default-profile.jpg');
            setCurrentDocId(doc.id);
          }
        });
      } catch (error) {
        console.error("Error fetching developer data:", error);
        setError("Failed to fetch developer data.");
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file && currentDocId) {
      const storageRef = ref(storage, `developerProfiles/${file.name}`);
      try {
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const docRef = doc(db, "Users", "adminDev", "AdminDevUsers", currentDocId);
        await updateDoc(docRef, { profileImage: downloadURL });

        setProfileImage(downloadURL);
        setError(null);
      } catch (error) {
        console.error("Error uploading image:", error);
        setError("Failed to upload the image. Please try again.");
      }
    } else {
      setError("No valid document ID found.");
    }
  };

  // Handle view details and set facility information
  const handleViewDetails = (facility) => {
    setSelectedFacility(facility); // Set the selected facility
    setFacilityName(facility.name || ''); // Set facility name in state
    setFacilityMessage(facility.message || ''); // Set facility message in state
    setFacilityPhone(facility.phone || ''); // Set facility phone number in state
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
          phone: facilityPhone,
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
          <a href="#" className="menu-item" onClick={() => navigate('/DevelopersDashboardPage')}>Dashboard</a>
          <a href="#" className="menu-item" onClick={() => navigate('/DevelopersFacilityListPage')}>Facilities</a>
          <a href="#" className="menu-item">Approval</a>
          <a href="#" className="menu-item">Announcements</a>
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
            onClick={() => document.getElementById('imageUpload').click()}
            style={{ cursor: 'pointer' }}
            onError={() => setProfileImage('/path-to-default-profile.jpg')}
          />
          <input
            type="file"
            id="imageUpload"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
          <span>{developerName}</span>
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
    </div>
  );
}

export default DevelopersApprovalPage;
