import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../../config/firebase';
import '../../css/AdminParentsListPage.css';

export default function DevelopersFacilityListPage() {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState('');
  const [developerName, setDeveloperName] = useState('Developer');
  const [profileImage, setProfileImage] = useState('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png');
  const [error, setError] = useState(null);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [parents, setParents] = useState([]);
  const [profileDescription, setProfileDescription] = useState('Senior Developer at Company XYZ');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState(null); 

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
      const parentsSnapshot = await getDocs(collection(db, "Users", "facility", "userFacility"));
      const fetchedParents = parentsSnapshot.docs.map(doc => doc.data());
      setParents(fetchedParents);
    } catch (error) {
      console.error("Error fetching parents data:", error);
      setError("Failed to fetch parents data.");
    }
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
        await updateDoc(docRef, {
          name: developerName,
          profileDescription: profileDescription
        });

        if (newProfileImage) {
          const storageRef = ref(storage, `developerProfiles/${newProfileImage.name}`);
          await uploadBytes(storageRef, newProfileImage);
          const downloadURL = await getDownloadURL(storageRef);
          await updateDoc(docRef, { profileImage: downloadURL });
        }

        setNewProfileImage(null);
        setIsProfileModalOpen(false);
        setError(null);
      } catch (error) {
        setError("Failed to update profile information.");
      }
    }
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
          <a href="#" className="menu-item" onClick={() => navigate('/DevelopersDashboardPage')}>Dashboard</a>
          <a href="#" className="menu-item" onClick={() => navigate('/DevelopersFacilityListPage')}>Facilities</a>
          <a href="#" className="menu-item" onClick={() => navigate('/DevelopersApprovalPage')}>Approval</a>
          <a href="#" className="menu-item">Announcements</a>                
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
          <div className="actions">
            <button className="btn-edit">EDIT</button>
          </div>
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
            {parents.map((parent, index) => (
              <tr key={index}>
                <td>{parent.name}</td>
                <td>{parent.professionals}</td>
                <td>{parent.subscribers}</td>
                <td>{parent.status}</td> {/* Assuming there is a 'status' field */}
                <td><a href={`/therapist/${index}`}>View</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

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
    </div>
  );
}
