import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../../config/firebase';
import loginImage from '../../assets/unifiedcarelogo.png';
import '../../css/DeveloperCss/DevelopersApprovalPage.css';

function DevelopersApprovalPage() {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState('');
  const [developerName, setDeveloperName] = useState('Developer');
  const [profileDescription, setProfileDescription] = useState('Senior Developer at Company XYZ');
  const [profileImage, setProfileImage] = useState('/path-to-default-profile.jpg');
  const [error, setError] = useState(null);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState(null); // For storing the new image file

  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facilityName, setFacilityName] = useState('');
  const [facilityMessage, setFacilityMessage] = useState('');
  const [facilityPhone, setFacilityPhone] = useState('');

    // New state for add button modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newFacilityName, setNewFacilityName] = useState('');
    const [newFacilityEmail, setNewFacilityEmail] = useState('');
    const [newFacilityPhone, setNewFacilityPhone] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('adminEmail');

    if (email) {
      setAdminEmail(email);
      fetchDeveloperData(email);
    }

    fetchPendingUsers();
  }, []);

  const fetchDeveloperData = async (email) => {
    try {
      const querySnapshot = await getDocs(collection(db, "Users", "adminDev", "AdminDevUsers"));
      let found = false;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email === email) {
          setDeveloperName(data.name || 'Sample Developer');
          setProfileImage(data.profileImage || '/path-to-default-profile.jpg');
          setProfileDescription(data.profileDescription || '');
          setCurrentDocId(doc.id);
          found = true;
        }
      });

      if (!found) {
        console.error("No document found with this email.");
        setError("No document found with this email.");
      }
    } catch (error) {
      console.error("Error fetching developer data:", error);
      setError("Failed to fetch developer data.");
    }
  };

  const handleProfileImageClick = () => {
    setIsProfileModalOpen(true);
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

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleAddFacility = () => {
    // Open the blank modal for adding a new facility
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    // Close the modal and reset inputs
    setIsAddModalOpen(false);
    setNewFacilityName('');
    setNewFacilityEmail('');
    setNewFacilityPhone('');
  };

  const handleSaveNewFacility = () => {
    // Logic to save new facility (You can implement the save functionality here)
    console.log("Saving new facility:", newFacilityName, newFacilityEmail, newFacilityPhone);

    // Close the modal after saving
    closeAddModal();
  };

  const handleApprove = async (facility) => {
    try {
      // Create a sanitized facility name to use as the document ID
      const sanitizedFacilityName = facility.name.replace(/[^a-zA-Z0-9-_]/g, '');
  
      // Reference to the new facility in the userFacility collection using the sanitized facility name
      const userFacilityRef = doc(db, "Users", "facility", "newUserFacility", sanitizedFacilityName);
      
      // Save facility details to the userFacility collection
      await setDoc(userFacilityRef, {
        name: facility.name,
        email: facility.email,
        phoneNumber: facility.phoneNumber,
        password: 'admin123'
      });
      
      // Remove the facility from the pending collection
      const pendingRef = doc(db, "Users", "facility", "pending", facility.id);
      await deleteDoc(pendingRef);
  
      // Update the state to remove the approved facility from the pendingUsers list
      setPendingUsers(pendingUsers.filter(user => user.id !== facility.id));
  
      alert("Facility approved and moved to userFacility successfully.");
    } catch (error) {
      console.error("Error approving facility:", error);
      alert("Failed to approve the facility.");
    }
  };
  


  const handleReject = async (facilityId) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this facility?");

    if (isConfirmed) {
      try {
        const docRef = doc(db, "Users", "facility", "pending", facilityId);
        await deleteDoc(docRef);

        setPendingUsers(pendingUsers.filter(user => user.id !== facilityId));
        alert("Facility rejected and deleted successfully.");
      } catch (error) {
        console.error("Error rejecting and deleting facility:", error);
        alert("Failed to reject and delete the facility.");
      }
    } else {
      alert("Deletion cancelled.");
    }
  };

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
  
    const handleViewDetails = (facility) => {
      setSelectedFacility(facility);
      setFacilityName(facility.name || '');
      setFacilityMessage(facility.message || '');
      setFacilityPhone(facility.phone || '');
      setIsModalOpen(true);
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
          <a href="#" className="menu-item" onClick={() => navigate('/DevelopersDashboardPage')}>Dashboard</a>
          <a href="#" className="menu-item" onClick={() => navigate('/DevelopersFacilityListPage')}>Facilities</a>
          <a href="#" className="menu-item" onClick={() => navigate('/DevelopersApprovalPage')}>Approval</a>
          <a href="#" className="menu-item" onClick={() => navigate('/DevelopersAnnouncementPage')}>Announcements</a> 
        </nav>
        <div className="logout">
          <a href="#" onClick={handleLogout}>Logout</a>
        </div>
      </aside>

      <main className="main-content">
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

        <div className="header">
          <h2>Pending List</h2>
          {error && <p className="error">{error}</p>}
          <div className="actions">
          <button className="btn-add" onClick={handleAddFacility}>ADD</button>
          </div>
       </div>

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
                  <td>{user.name}</td>
                  <td>{user.professionals}</td>
                  <td>{user.email}</td>
                  <td>
                    <button className="approve-btn" onClick={() => handleApprove(user)}>✅</button>
                    <button className="reject-btn" onClick={() => handleReject(user.id)}>❌</button>
                  </td>
                  <td>
                    <a href="#" className="view-link" onClick={() => handleViewDetails(user)}>View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </main>

        {/* Facility Details Modal */}
        {isModalOpen && selectedFacility && (
          <div className="modal">
          <div className="modal-content parent-modal">
            <button className="modal-close" onClick={closeModal}>X</button>
            <h2>Facility Details</h2>
            <div className="modal-header">
            <img
              src={selectedFacility.image}
              alt="Facility Image"
              className="parent-img"
            />
            </div>
            <div className="modal-body">
        <div className="modal-info-group">
          <label>Facility Name</label>
          <p>{facilityName}</p>
        </div>
        
        <div className="modal-info-group">     
          <label>Phone Number</label>
          <p>{selectedFacility.phoneNumber}</p>
        </div>

        <div className="modal-info-group">
          <label>Facility Message</label>
          <p>{facilityMessage}</p>
        </div>

        <div className="modal-info-group">
          <label>Address</label>
          <p>{selectedFacility.email}</p>
        </div>

        <div className="modal-info-group">
          <label>Facility Description</label>
          <p>{selectedFacility.description}</p>
        </div>
        </div>    
            </div>
          </div>
        )}

        {/* Developer Profile Modal */}
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


        {isAddModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <button className="modal-close" onClick={closeAddModal}>X</button>
              <h2>Add New Facility</h2>
              <div className="modal-body">
                <label>Facility Name</label>
                <input
                  type="text"
                  value={newFacilityName}
                  onChange={(e) => setNewFacilityName(e.target.value)}
                />

                <label>Facility Email</label>
                <input
                  type="text"
                  value={newFacilityEmail}
                  onChange={(e) => setNewFacilityEmail(e.target.value)}
                />

                <label>Facility Phone</label>
                <input
                  type="text"
                  value={newFacilityPhone}
                  onChange={(e) => setNewFacilityPhone(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button className="btn-save" onClick={handleSaveNewFacility}>Save</button>
                <button className="btn-cancel" onClick={closeAddModal}>Cancel</button>
              </div>
            </div>
          </div>
        )} 
      </div>
    );
}

export default DevelopersApprovalPage;
