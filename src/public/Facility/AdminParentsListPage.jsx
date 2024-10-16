import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, setDoc, deleteDoc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../../config/firebase';
import loginImage from '../../assets/unifiedcarelogo.png';
import Swal from 'sweetalert2';
import '../../css/AdminParentsListPage.css';

export function AdminParentsListPage() {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState('');
  const [facilityName, setFacilityName] = useState('Facility');
  const [facilityImage, setFacilityImage] = useState('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png'); // Default image
  const [facilityAddress, setFacilityAddress] = useState('123 Facility St.');
  const [facilityDescription, setFacilityDescription] = useState(''); 
  const [error, setError] = useState(null);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [parents, setParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // For parent modal
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false); // For facility modal
  const [newParents, setNewParents] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    if (email) {
      setAdminEmail(email);
      fetchFacilityData(email);
    }
  }, []);
  
  useEffect(() => {
    if (currentDocId) {
      fetchParents(); // Fetch parents only after currentDocId is available
    }
  }, [currentDocId]);

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

  const fetchParents = async () => {
    try {
      const parentsSnapshot = await getDocs(collection(db, "Users", "facility", "userFacility", currentDocId, "userParent"));
      const fetchedParents = [];
      parentsSnapshot.forEach((doc) => {
        fetchedParents.push({ id: doc.id, ...doc.data() });
      });
      setParents(fetchedParents);
    } catch (error) {
      console.error("Error fetching parents data:", error);
      setError("Failed to fetch parents data.");
    }
  };

  const handleAddClick = () => {
    setNewParents({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      therapyType: '',
      specialNeeds: '',
      address: ''
    });
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewParents((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddParent = async () => {
    try {
      // Replace dots or other special characters in the email to form a valid document ID
      const docId = newParents.email.replace(/\./g, '_'); // Replace periods with underscores for Firestore compatibility
  
      const parentWithFullName = {
        ...newParents,
        fullName: `${newParents.firstName} ${newParents.lastName}`,
      };
  
      await setDoc(doc(db, "Users", "facility", "userFacility", currentDocId, "pendingParent", docId), parentWithFullName);
      
      fetchParents(); // Refresh parent list after adding
      closeAddModal();
  
      // Success SweetAlert
      Swal.fire({
        icon: 'success',
        title: 'Parent Added!',
        text: `${parentWithFullName.fullName} has been successfully added.`,
        confirmButtonText: 'Okay'
      });
    } catch (error) {
      console.error("Error adding parent:", error);
      
      // Error SweetAlert
      Swal.fire({
        icon: 'error',
        title: 'Add Failed',
        text: 'There was an error adding the parent. Please try again.',
        confirmButtonText: 'Try Again'
      });
    }
  };
  

  const handleDeleteParent = async (parentId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This action will permanently delete the parent.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Reference to the parents document in Firestore
          const parentDocRef = doc(db, "Users", "facility", "userFacility", currentDocId, "userParent", parentId);
  
          // Delete the parents document
          await deleteDoc(parentDocRef);
  
          // Update the parents state to remove the deleted parents
          setParents(parents.filter(parentId => parentId.id !== parentId));
  
          // Show success message
          Swal.fire('Deleted!', 'The parent has been deleted.', 'success');
          setIsModalOpen(false); // Close the modal after deletion
        } catch (error) {
          console.error("Error deleting parent:", error);
          Swal.fire('Error', 'Failed to delete the parent. Please try again.', 'error');
        }
      }
    });
  };

  const handleViewClick = (parent) => {
    setSelectedParent(parent); 
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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

        {/* Parents List */}
        <div className="header">
          <h2>Parents List</h2>
          <div className="actions">
          <button className="btn-add" onClick={handleAddClick}>ADD</button>
          </div>
        </div>
        <table className="therapist-table">
          <thead>
            <tr>
              <th>Parent Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Therapy Type</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {parents.map((parent, index) => (
            <tr key={index}>
            <td>{parent.firstName + ' ' + parent.lastName}</td> {/* Corrected line */}
            <td>{parent.email}</td>
            <td>{parent.phoneNumber}</td>
            <td>{parent.therapyType}</td>
            <td><button onClick={() => handleViewClick(parent)}>View</button></td>
            </tr>
            ))}
          </tbody>
      </table>
      </main>

      {isModalOpen && selectedParent && (
  <div className="modal">
    <div className="modal-content parent-modal">
      <button className="modal-close" onClick={closeModal}>X</button>
      
      <div className="modal-header">
        <img
          src={selectedParent.imageUrl}
          alt="Parent Avatar"
          className="parent-img"
        />
      </div>

      <div className="modal-body">
        <div className="modal-info-group">
          <label>Parent Name</label>
          <p>{selectedParent.firstName} {selectedParent.lastName}</p>
        </div>
        
        <div className="modal-info-group">
          <label>Email</label>
          <p>{selectedParent.email}</p>
        </div>
        
        <div className="modal-info-group">
          <label>Phone Number</label>
          <p>{selectedParent.phoneNumber}</p>
        </div>

        <div className="modal-info-group">
          <label>Therapy Type</label>
          <p>{selectedParent.therapyType}</p>
        </div>

        <div className="modal-info-group">
          <label>Address</label>
          <p>{selectedParent.address}</p>
        </div>

        <div className="modal-info-group">
          <label>Special Needs</label>
          <p>{selectedParent.specialNeeds || "N/A"}</p>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn-update">UPDATE</button>
        <button className="btn-delete" onClick={() => handleDeleteParent(selectedParent.id)}>DELETE</button>
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

           {/* Add Parent Modal */}
      {isAddModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <button className="modal-close" onClick={closeAddModal}>X</button>
            <div className="modal-header">
              <h3>Add New Parent</h3>
            </div>

            <div className="modal-body">
              <div className="modal-info-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  name="firstName" 
                  value={newParents.firstName} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="modal-info-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  name="lastName" 
                  value={newParents.lastName} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="modal-info-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={newParents.email} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="modal-info-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  name="phoneNumber" 
                  value={newParents.phoneNumber} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="modal-info-group">
                <label>Therapy Type</label>
                <input 
                  type="text" 
                  name="therapyType" 
                  value={newParents.therapyType} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="modal-info-group">
                <label>Special Needs</label>
                <input 
                  type="text" 
                  name="specialNeeds" 
                  value={newParents.specialNeeds} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="modal-info-group">
                <label>Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={newParents.address} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-add" onClick={handleAddParent}>ADD</button>
              <button className="btn-cancel" onClick={closeAddModal}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminParentsListPage;



{/* BACK UP FOR THE API USE
          <tbody>
            {parents.map((parent, index) => (
              <tr key={index}>
                <td>{parent.parentDetails.firstName} {parent.parentDetails.lastName}</td>
                <td>{parent.parentDetails?.email}</td>
                <td>{parent.parentDetails?.phone}</td>
                <td>{parent.childDetails?.therapyType}</td>
                <td><button onClick={() => handleViewClick(parent)}>View</button></td>
              </tr>
            ))}
          </tbody>
*/}