import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc,setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from '../../config/firebase'; // Group Firebase imports
import loginImage from '../../assets/unifiedcarelogo.png';
import Swal from 'sweetalert2';
import '../../css/DeveloperCss/DevelopersApprovalPage.css';

const FacilityApprovalPage = () => {
  const navigate = useNavigate();
  
  // State variables
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [error, setError] = useState(null);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facilityImage, setFacilityImage] = useState('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png');
  const [facilityAddress, setFacilityAddress] = useState('123 Facility St.');
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [facilityDescription, setFacilityDescription] = useState(''); 
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [facilityName, setFacilityName] = useState('');
  const [facilityMessage, setFacilityMessage] = useState('');
  const [facilityPhone, setFacilityPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [newTherapist, setNewTherapist] = useState({});

  // Fetch data on component mount
  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    if (email) {
      setAdminEmail(email);
      fetchFacilityData(email);
    }
    fetchPendingUsers();
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
        setError("No document found with this email.");
      }
    } catch (error) {
      setError("Failed to fetch facility data.");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImageFile(file);
      const imagePreviewURL = URL.createObjectURL(file);
      setFacilityImage(imagePreviewURL);
      setError(null);
    }
  };

  const closeAddModal = () => setIsAddModalOpen(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTherapist((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateClick = async () => {
    try {
      let updatedData = { name: facilityName, description: facilityDescription, address: facilityAddress };
      if (selectedImageFile && currentDocId) {
        const storageRef = ref(storage, `facilityImages/${selectedImageFile.name}`);
        await uploadBytes(storageRef, selectedImageFile);
        const downloadURL = await getDownloadURL(storageRef);
        updatedData.image = downloadURL;
      }
      if (currentDocId) {
        const docRef = doc(db, "Users", "facility", "userFacility", currentDocId);
        await updateDoc(docRef, updatedData);
        setFacilityImage(updatedData.image || facilityImage);
        setError(null);
        setIsFacilityModalOpen(false);
        setSelectedImageFile(null);
        Swal.fire({
          icon: 'success',
          title: 'Profile Updated!',
          text: 'Your facility information has been successfully updated.',
          confirmButtonText: 'Okay'
        });
      }
    } catch (error) {
      setError("Failed to update the facility information.");
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'There was an error updating your facility information.',
        confirmButtonText: 'Try Again'
      });
    }
  };

  const handleFacilityImageClick = () => setIsFacilityModalOpen(true);

  const closeFacilityModal = () => {
    setIsFacilityModalOpen(false);
    setSelectedImageFile(null);
  };

  const handleViewDetails = (facility) => {
    setSelectedFacility(facility);
    setFacilityName(facility.name || '');
    setFacilityMessage(facility.message || '');
    setFacilityPhone(facility.phoneNumber || '');
    setIsModalOpen(true);
  };

  
  const handleApprove = async (facility) => {
    Swal.fire({
      title: 'Approve this therapist?',
      text: `Are you sure you want to approve ${facility.firstName} ${facility.lastName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'No, cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const docId = facility.id; // Facility ID to save to newUserTherapist
  
          // Create a therapist object with the facility data
          const therapistData = {
            firstName: facility.firstName,
            lastName: facility.lastName,
            email: facility.email,
            phoneNumber: facility.phoneNumber,
            therapyType: facility.therapyType,
            specialization: facility.specialization,
            address: facility.address,
          };
  
          // Save the approved therapist data to the "Users/Therapist/newUserTherapist" collection
          await setDoc(doc(db, "Users", "therapists", "newUserTherapist", docId), therapistData);
  
          // After saving to newUserTherapist, delete the user from the pending list
          const pendingDocRef = doc(db, "Users", "facility", "userFacility", facility.facilityId, "pending", facility.id);
          await deleteDoc(pendingDocRef);
  
          // Remove the facility from the pendingUsers state
          setPendingUsers(pendingUsers.filter(user => user.id !== facility.id));
  
          Swal.fire({
            title: 'Approved!',
            text: `${facility.firstName} ${facility.lastName} has been approved.`,
            icon: 'success',
          });
        } catch (error) {
          Swal.fire({
            title: 'Error!',
            text: 'Failed to approve the facility. Please try again.',
            icon: 'error',
          });
          console.error("Error approving facility:", error);
        }
      }
    });
  };
  

  const fetchPendingUsers = async () => {
    try {
      const facilitySnapshot = await getDocs(collection(db, "Users", "facility", "userFacility"));
      
      const pendingUsersPromises = facilitySnapshot.docs.map(async (facilityDoc) => {
        const pendingUsersCollection = collection(db, "Users", "facility", "userFacility", facilityDoc.id, "pending");
        const pendingUsersSnapshot = await getDocs(pendingUsersCollection);
        
        return pendingUsersSnapshot.docs.map(doc => ({
          id: doc.id,
          facilityId: facilityDoc.id,
          ...doc.data(),
        }));
      });
  
      const pendingUsersArray = await Promise.all(pendingUsersPromises);
      const pendingUsers = pendingUsersArray.flat(); // Flatten the array of arrays
  
      setPendingUsers(pendingUsers);
    } catch (error) {
      setError("Failed to fetch pending users.");
    }
  };


  const handleReject = async (facility) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This action will reject and delete the therapist.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'No, keep it'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Use facility.id (the therapist's ID) instead of therapistId
          await deleteDoc(doc(db, "Users", "facility", "userFacility", facility.facilityId, "pending", facility.id));
          
          // Optionally: Remove the rejected therapist from the pendingUsers state
          setPendingUsers(pendingUsers.filter(user => user.id !== facility.id));
  
          Swal.fire({
            icon: 'success',
            title: 'Therapist Rejected',
            text: 'The therapist has been successfully rejected and removed.',
            confirmButtonText: 'Okay'
          });
        } catch (error) {
          Swal.fire({
            title: 'Error!',
            text: 'Failed to reject and delete the therapist. Please try again.',
            icon: 'error',
          });
          console.error(error);
        }
      } else {
        Swal.fire({
          title: 'Cancelled',
          text: 'The therapist was not rejected.',
          icon: 'info',
        });
      }
    });
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
          <a className="menu-item" onClick={() => navigate('/AdminDashboardPage')}>Dashboard</a>
          <a className="menu-item" onClick={() => navigate('/TherapistListPage')}>Therapist</a>
          <a className="menu-item" onClick={() => navigate('/AdminParentsListPage')}>Parents</a>
          <a className="menu-item" onClick={() => navigate('/AdminFacilityAnnouncementPage')}>Announcements</a>
          <a className="menu-item" onClick={() => navigate('/FacilityApprovalPage')}>Approval</a>
          <a className="menu-item" onClick={() => navigate('/FacilityMessagePage')}>Messages</a>
        </nav>
        <div className="logout">
          <a onClick={handleLogout}>Logout</a>
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
          <h2>Pending List</h2>
          {error && <p className="error">{error}</p>}
          <div className="actions">
          </div>
       </div>

       <table className="pending-list-table">
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
              {pendingUsers.map((user, index) => (
                <tr key={index}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.phoneNumber}</td>
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

          </div>
        </div>
      )}
    </div>
    );
}

export default FacilityApprovalPage;
