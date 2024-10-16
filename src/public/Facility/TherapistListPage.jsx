import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, setDoc, deleteDoc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../../config/firebase';
import loginImage from '../../assets/unifiedcarelogo.png';
import Swal from 'sweetalert2';
import '../../css/TherapistListPage.css';

export default function TherapistListPage() {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState('');
  const [facilityName, setFacilityName] = useState('Facility');
  const [facilityImage, setFacilityImage] = useState('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png'); // Default image
  const [facilityAddress, setFacilityAddress] = useState('123 Facility St.');
  const [error, setError] = useState(null);
  const [facilityDescription, setFacilityDescription] = useState(''); 
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null); // To hold the selected therapist data
  const [isModalOpen, setIsModalOpen] = useState(false); // For parent modal
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false); // For facility modal
  const [newTherapist, setNewTherapist] = useState({}); // To hold new therapist data
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // For add therapist modal


  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    if (email) {
      setAdminEmail(email);
      fetchFacilityData(email);
    }
  }, []);
  
  useEffect(() => {
    if (currentDocId) {
      fetchTherapists(); // Fetch therapists only after currentDocId is available
    }
  }, [currentDocId]);

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
        Swal.fire({
          icon: 'error',
          title: 'No Facility Found',
          text: 'No facility data found for this email.',
          confirmButtonText: 'Try Again'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Fetch Error',
        text: 'There was an error fetching facility data. Please try again.',
        confirmButtonText: 'Retry'
      });
      console.error("Error fetching facility data:", error);
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
  const handleViewClick = (therapist) => {
    setSelectedTherapist(therapist); // Set selected therapist data
    setIsModalOpen(true); // Open the modal
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };


  const fetchTherapists = async () => {
    if (!currentDocId) return;
    try {
      const therapistSnapshot = await getDocs(collection(db, "Users", "facility", "userFacility", currentDocId, "userTherapist"));
      const fetchedTherapists = [];
      therapistSnapshot.forEach((doc) => {
        fetchedTherapists.push({ id: doc.id, ...doc.data() });
      });
      setTherapists(fetchedTherapists);
    } catch (error) {
      console.error("Error fetching therapist data:", error);
      Swal.fire('Error', 'Failed to fetch therapist data.', 'error');
    }
  };

  const handleAddClick = () => {
    setNewTherapist({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      therapyType: '',
      specialization: '',
      address: ''
    });
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTherapist((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTherapist = async () => {
    try {
      const docId = `${newTherapist.firstName}_${newTherapist.lastName}`;
      const therapistWithFullName = {
        ...newTherapist,
        fullName: `${newTherapist.firstName} ${newTherapist.lastName}`,
      };
  
      await setDoc(doc(db, "Users", "facility", "userFacility", currentDocId, "pendingTherapist", docId), therapistWithFullName);
      
      fetchTherapists(); // Refresh therapist list after adding
      closeAddModal();
  
      // Success SweetAlert
      Swal.fire({
        icon: 'success',
        title: 'Therapist Added!',
        text: `${therapistWithFullName.fullName} has been successfully added.`,
        confirmButtonText: 'Okay'
      });
    } catch (error) {
      console.error("Error adding therapist:", error);
      
      // Error SweetAlert
      Swal.fire({
        icon: 'error',
        title: 'Add Failed',
        text: 'There was an error adding the therapist. Please try again.',
        confirmButtonText: 'Try Again'
      });
    }
  };
  

  const handleDeleteTherapist = async (therapistId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This action will permanently delete the therapist.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Reference to the specific therapist document in Firestore
          const therapistDocRef = doc(db, "Users", "facility", "userFacility", currentDocId, "userTherapist", therapistId);
          
          // Delete the therapist document
          await deleteDoc(therapistDocRef);
  
          // Update the therapists state to remove the deleted therapist
          setTherapists(therapists.filter(therapist => therapist.id !== therapistId));
  
          // Show success message
          Swal.fire('Deleted!', 'The therapist has been deleted.', 'success');
          setIsModalOpen(false); // Close the modal after deletion
        } catch (error) {
          console.error("Error deleting therapist:", error);
          Swal.fire('Error', 'Failed to delete the therapist. Please try again.', 'error');
        }
      }
    });
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
    <div className="therapist-list-container">
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

        <div className="header">
          <h2>Therapist List</h2>
          <div className="actions">
          <button className="btn-add" onClick={handleAddClick}>ADD</button>
          </div>
        </div>
        
        <table className="therapist-table">
          <thead>
            <tr>
              <th>Therapist Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Qualification</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
          {therapists.map((therapist, index) => (
            <tr key={index}>
              <td>{therapist.firstName + ' ' + therapist.lastName}</td> {/* Corrected line */}
              <td>{therapist.email}</td>
              <td>{therapist.phoneNumber}</td>
              <td>{therapist.therapyType}</td>
              <td><button onClick={() => handleViewClick(therapist)}>View</button></td>
            </tr>
          ))}
        </tbody>
        </table>
      </main>

      {/* Therapist Details Modal */}
  {isModalOpen && selectedTherapist && (
  <div className="modal">
    <div className="modal-content parent-modal">
      <button className="modal-close" onClick={closeModal}>X</button>
      
      <div className="modal-header">
        <img
          src={selectedTherapist.imageUrl}
          alt="Parent Avatar"
          className="parent-img"
        />
      </div>

      <div className="modal-body">
        <div className="modal-info-group">
          <label>Therapist Name</label>
          <p>{selectedTherapist.firstName} {selectedTherapist.lastName}</p>
        </div>
        
        <div className="modal-info-group">
          <label>Email</label>
          <p>{selectedTherapist.email}</p>
        </div>
        
        <div className="modal-info-group">
          <label>Phone Number</label>
          <p>{selectedTherapist.phoneNumber}</p>
        </div>

        <div className="modal-info-group">
          <label>Therapy Type</label>
          <p>{selectedTherapist.therapyType}</p>
        </div>

        <div className="modal-info-group">
          <label>Address</label>
          <p>{selectedTherapist.address}</p>
        </div>

        <div className="modal-info-group">
          <label>Specialization</label>
          <p>{selectedTherapist.specialization || "N/A"}</p>
        </div>
      </div>
            <div className="modal-footer">
        <button className="btn-update">UPDATE</button>
        <button className="btn-delete" onClick={() => handleDeleteTherapist(selectedTherapist.id)}>DELETE</button>
      </div>
    </div>
  </div>
)}

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


      {/* Add Therapist Modal */}
      {isAddModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <button className="modal-close" onClick={closeAddModal}>X</button>
            <div className="modal-header">
              <h3>Add New Therapist</h3>
            </div>

            <div className="modal-body">
              <div className="modal-info-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  name="firstName" 
                  value={newTherapist.firstName} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="modal-info-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  name="lastName" 
                  value={newTherapist.lastName} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="modal-info-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={newTherapist.email} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="modal-info-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  name="phoneNumber" 
                  value={newTherapist.phoneNumber} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="modal-info-group">
                <label>Therapy Type</label>
                <input 
                  type="text" 
                  name="therapyType" 
                  value={newTherapist.therapyType} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="modal-info-group">
                <label>Specialization</label>
                <input 
                  type="text" 
                  name="specialization" 
                  value={newTherapist.specialization} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="modal-info-group">
                <label>Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={newTherapist.address} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-add" onClick={handleAddTherapist}>ADD THERAPIST</button>
              <button className="btn-cancel" onClick={closeAddModal}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
  