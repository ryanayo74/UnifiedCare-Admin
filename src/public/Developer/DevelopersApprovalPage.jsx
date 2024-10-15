import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, runTransaction } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../../config/firebase';
import { auth } from '../../config/firebase';
import loginImage from '../../assets/unifiedcarelogo.png';
import Swal from 'sweetalert2';
import '../../css/DeveloperCss/DevelopersApprovalPage.css';
import { createUserWithEmailAndPassword,sendEmailVerification } from 'firebase/auth';

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

            // Show SweetAlert after successful update
            Swal.fire({
                title: 'Profile Updated',
                text: 'Your profile information have been successfully updated.',
                icon: 'success',
                confirmButtonText: 'OK'
            });

        } catch (error) {
            setError("Failed to update profile information.");

            // Show error SweetAlert if updating fails
            Swal.fire({
                title: 'Update Failed',
                text: 'An error occurred while updating your profile. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
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

  const handleSaveNewFacility = async () => {
    if (!newFacilityName || !newFacilityEmail || !newFacilityPhone) {
      // Show an error message if any required field is missing
      Swal.fire({
        title: 'Error!',
        text: 'Please fill in all fields.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }
  
    try {
      // Create a reference to the pending collection with a unique ID
      const facilityRef = doc(db, "Users", "facility", "pending", newFacilityName.replace(/\s+/g, '_')); // Replace spaces in the name
  
      // Save the facility details in the 'pending' collection
      await setDoc(facilityRef, {
        name: newFacilityName,
        email: newFacilityEmail,
        phoneNumber: newFacilityPhone,
        status: 'pending' // Optional: to track status
      });
  
      // Success message after saving the facility
      Swal.fire({
        title: 'Success!',
        text: 'Facility added successfully.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
  
      // Reset the input fields after saving
      setNewFacilityName('');
      setNewFacilityEmail('');
      setNewFacilityPhone('');
  
      // Close the modal after saving
      closeAddModal();
    } catch (error) {
      console.error("Error adding facility:", error);
  
      // Show error message if something goes wrong
      Swal.fire({
        title: 'Error!',
        text: 'Failed to add the facility. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };  

  const handleApprove = async (facility) => {
    Swal.fire({
      title: 'Approve this facility?',
      text: `Are you sure you want to approve ${facility.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'No, cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const sanitizedFacilityName = facility.name.replace(/[^a-zA-Z0-9-_]/g, '');
  
          // Create a new user with email and password
          const { user } = await createUserWithEmailAndPassword(auth, facility.email, 'admin123');
  
          // Send verification email
          await sendEmailVerification(user);
  
          // Reference to the new facility in the userFacility collection
          const userFacilityRef = doc(db, "Users", "facility", "newUserFacility", sanitizedFacilityName);
  
          // Save facility details to Firestore
          await setDoc(userFacilityRef, {
            name: facility.name,
            email: facility.email,
            phoneNumber: facility.phoneNumber,
            password: 'admin123',
            emailVerified: false, // Initially set as false
          });
  
          // Add clinic_services to the facility
          const clinicServicesRef = collection(userFacilityRef, "clinic_services");
  
          // Retrieve and update the global clinic_id counter
          const globalCounterRef = doc(db, "counters", "clinicServiceCounter");
          let clinic_id = 1; // Default value

          await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(globalCounterRef);
            
            if (!counterDoc.exists()) {
              // If the document doesn't exist, create it with clinic_id starting at 1
              transaction.set(globalCounterRef, { lastClinicId: 1 });
              clinic_id = 1;
            } else {
              // Increment the lastClinicId and update the document
              const newClinicId = counterDoc.data().lastClinicId + 1;
              transaction.update(globalCounterRef, { lastClinicId: newClinicId });
              clinic_id = newClinicId;
            }
            
            // Add the new clinic service with the incremented clinic_id
            const newClinicDocRef = doc(clinicServicesRef);
            transaction.set(newClinicDocRef, {
              clinic_id: clinic_id.toString(), // Ensure clinic_id is a string
              description: "put your description here",
              name: facility.name
            });
          });
          
  
          // Remove the facility from the pending collection
          const pendingRef = doc(db, "Users", "facility", "pending", facility.id);
          await deleteDoc(pendingRef);
  
          // Update the pendingUsers state
          setPendingUsers(pendingUsers.filter(user => user.id !== facility.id));
  
          Swal.fire({
            title: 'Approved!',
            text: `${facility.name} has been approved. A verification email has been sent to ${facility.email}.`,
            icon: 'success',
          });
  
        } catch (error) {
          if (error.code === 'auth/email-already-in-use') {
            Swal.fire({
              title: 'Error!',
              text: 'The email is already in use. Please check the facility details and try again.',
              icon: 'error',
            });
          } else {
            Swal.fire({
              title: 'Error!',
              text: 'Failed to approve the facility. Please try again.',
              icon: 'error',
            });
          }
          console.error("Error approving facility:", error);
        }
      }
    });
  };
  
  
  

  const handleReject = async (facilityId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to reject this facility? This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'No, cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const docRef = doc(db, "Users", "facility", "pending", facilityId);
          await deleteDoc(docRef);
  
          setPendingUsers(pendingUsers.filter(user => user.id !== facilityId));
  
          Swal.fire({
            title: 'Rejected!',
            text: 'The facility has been rejected and deleted successfully.',
            icon: 'success',
          });
        } catch (error) {
          console.error("Error rejecting and deleting facility:", error);
          Swal.fire({
            title: 'Error!',
            text: 'Failed to reject and delete the facility. Please try again.',
            icon: 'error',
          });
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: 'Cancelled',
          text: 'Facility rejection has been cancelled.',
          icon: 'info',
        });
      }
    });
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
                <button className="btn-update" onClick={handleSaveNewFacility}>Add</button>
                <button className="btn-cancel" onClick={closeAddModal}>Cancel</button>
              </div>
            </div>
          </div>
        )} 
      </div>
    );
}

export default DevelopersApprovalPage;
