import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, storage } from '../../config/firebase';
import loginImage from '../../assets/unifiedcarelogo.png';
import Swal from 'sweetalert2';
import '../../css/AdminParentsListPage.css';

export default function DevelopersFacilityListPage() {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState('');
  const [developerName, setDeveloperName] = useState('Developer');
  const [profileImage, setProfileImage] = useState('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png');
  const [error, setError] = useState(null);

  const [currentDocId, setCurrentDocId] = useState(null);
  const [facility, setfacility] = useState([]);
  const [profileDescription, setProfileDescription] = useState('Senior Developer at Company XYZ');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState(null); 
  const [selectedFacility, setSelectedFacility] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For loading state
  const [successMessage, setSuccessMessage] = useState(''); // For success message


  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    if (email) {
      setAdminEmail(email);
      fetchDeveloperData(email);
    }
    fetchFacility();
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

  const fetchFacility = async () => {
    try {
      const facilitySnapshot = await getDocs(collection(db, "Users", "facility", "userFacility"));
      const fetchedFacility = [];
      facilitySnapshot.forEach((doc) => {
        fetchedFacility.push({ id: doc.id, ...doc.data() }); 
      });
      setfacility(fetchedFacility);
    } catch (error) {
      console.error("Error fetching facility data:", error);
      setError("Failed to fetch facility data.");
    }
  };

  const handleViewClick = (facility) => {
    setSelectedFacility(facility); // Set selected therapist data
    setIsModalOpen(true); // Open the modal
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleProfileImageClick = () => {
    setIsProfileModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result);
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

const handleDeleteClick = () => {
  closeModal(); // Close the facility details modal

  // Show confirmation dialog using SweetAlert
  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      handleDeleteFacility(); // Proceed with deletion if confirmed
    }
  });
};

const handleDeleteFacility = async () => {
  if (selectedFacility && selectedFacility.id && selectedFacility.email) {
    setIsLoading(true); // Show loading modal
    try {
      // Step 1: Delete facility document from Firestore
      const docRef = doc(db, "Users", "facility", "userFacility", selectedFacility.id);
      await deleteDoc(docRef);
      
      // Step 2: Call the Cloud Function to delete the user's Firebase Authentication account
      const functions = getFunctions();
      const deleteAuthUser = httpsCallable(functions, 'deleteFacilityAuthUser');
      await deleteAuthUser({ email: selectedFacility.email });

      // Refresh facility list after deletion
      fetchFacility();
      
      // Show success message using SweetAlert
      Swal.fire(
        'Deleted!',
        'Facility and associated authentication account deleted successfully!',
        'success'
      );
    } catch (error) {
      console.error("Error deleting facility:", error);
      setError("Failed to delete facility.");
      
      // Show error message using SweetAlert if deletion fails
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete facility or its authentication account.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false); // Hide loading modal
    }
  }
};

  
  const closeDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false); // Close the confirmation modal
  };


  const closeSuccessModal = () => {
    setSuccessMessage(''); // Reset success message
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('adminEmail');
    navigate('/AdminLoginPage');
  };

  return (
    <div className="therapist-list-container">
       <aside className="sidebar">
          <div className="logo-container">
          <  img src={loginImage} alt="Logo" />
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
          <h2>Facility List</h2>
       </div>
        
        <table className="therapist-table">
          <thead>
            <tr>
              <th>Facility Name</th>
              <th>Professionals</th>
              <th>Subscribers</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {facility.map((facility, index) => (
              <tr key={index}>
                <td>{facility.name}</td>
                <td>{facility.professionals}</td>
                <td>{facility.subscribers}</td>
                <td>{facility.status}</td> {/* Assuming there is a 'status' field */}
                <td><button onClick={() => handleViewClick(facility)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

  {/* Therapist Details Modal */}
  {isModalOpen && selectedFacility && (
  <div className="modal">
    <div className="modal-content parent-modal">
      <button className="modal-close" onClick={closeModal}>X</button>
      
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
          <p>{selectedFacility.name}</p>
        </div>
        
        <div className="modal-info-group">
          <label>Email</label>
          <p>{selectedFacility.email}</p>
        </div>
        
        <div className="modal-info-group">
          <label>Phone Number</label>
          <p>{selectedFacility.phoneNumber}</p>
        </div>

        <div className="modal-info-group">
          <label>Address</label>
          <p>{selectedFacility.address}</p>
        </div>

        <div className="modal-info-group">
          <label>Facility Description</label>
          <p>{selectedFacility.description}</p>
        </div>

      </div>
    
    <div className="modal-footer">
    <button className="btn-delete" onClick={handleDeleteClick}>DELETE</button>
    </div>

    </div>
  </div>
)}

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


      {isDeleteConfirmOpen && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h3>Are you sure you want to delete this facility?</h3>
            <div className="modal-footer">
              <button className="btn-yes" onClick={handleDeleteFacility}>Yes</button>
              <button className="btn-no" onClick={closeDeleteConfirm}>No</button>
            </div>
          </div>
        </div>
      )}

              {/* Loading Modal */}
      {isLoading && (
        <div className="modal">
          <div className="modal-content">
            <h3>Loading...</h3>
            <p>Please wait while we delete the facility.</p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successMessage && (
        <div className="modal">
          <div className="modal-content">
            <h3>{successMessage}</h3>
            <button onClick={closeSuccessModal} className="btn-update">Close</button>
          </div>
        </div>
      )}

    </div>
  );
}
