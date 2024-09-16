import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../config/firebase';
import '../css/TherapistListPage.css';

export default function TherapistListPage() {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState('');
  const [facilityName, setFacilityName] = useState('Facility');
  const [facilityImage, setFacilityImage] = useState('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png'); // Default image
  const [facilityAddress, setFacilityAddress] = useState('123 Facility St.');
  const [error, setError] = useState(null);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null); // To hold the selected therapist data
  const [isModalOpen, setIsModalOpen] = useState(false); // For parent modal
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false); // For facility modal

  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    if (email) {
      setAdminEmail(email);
      fetchFacilityData(email);
    }

    fetchTherapists(); // Fetch therapists when component mounts
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

  const fetchTherapists = async () => {
    try {
      const therapistSnapshot = await getDocs(collection(db, "Users", "therapists", "newUserTherapist"));
      const fetchedTherapists = [];
      therapistSnapshot.forEach((doc) => {
        fetchedTherapists.push({ id: doc.id, ...doc.data() }); 
      });
      setTherapists(fetchedTherapists);
    } catch (error) {
      console.error("Error fetching therapist data:", error);
      setError("Failed to fetch therapist data.");
    }
  };

  const handleViewClick = (therapist) => {
    setSelectedTherapist(therapist); // Set selected therapist data
    setIsModalOpen(true); // Open the modal
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
          <img src="https://i.ytimg.com/vi/CYcrmsdZuyw/sddefault.jpg" alt="UnifiedCare Logo" className="logo" />
        </div>
        <nav className="menu">
          <a href="#" className="menu-item" onClick={() => navigate('/AdminDashboardPage')}>Dashboard</a>
          <a href="#" className="menu-item" onClick={() => navigate('/TherapistListPage')}>Therapist</a>
          <a href="#" className="menu-item" onClick={() => navigate('/AdminParentsListPage')}>Parents</a>
          <a href="#" className="menu-item">Announcements</a>
          <a href="#" className="menu-item">Approval</a>
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
            <button className="btn-add">ADD</button>
            <button className="btn-edit">EDIT</button>
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
        <button className="btn-delete">DELETE</button>
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

  