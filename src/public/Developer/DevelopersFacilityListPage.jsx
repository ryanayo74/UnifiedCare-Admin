import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../../config/firebase';
import '../../css/AdminParentsListPage.css';

export default function AdminParentsListPage() {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState('');
  const [developerName, setDeveloperName] = useState('Developer');
  const [profileImage, setProfileImage] = useState('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png');
  const [error, setError] = useState(null);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [parents, setParents] = useState([]);


  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    if (email) {
      setAdminEmail(email);
      fetchDevelopersData(email);
    }

    fetchParents();
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
        setProfileImage(downloadURL);
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

  const fetchDevelopersData = async (email) => {
    try {
        const querySnapshot = await getDocs(collection(db, "Users", "adminDev", "AdminDevUsers"));

        let found = false;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.email === email) {
                setDeveloperName(data.name || 'Sample Developer');
                setProfileImage(data.profileImage || '/path-to-default-profile.jpg');
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

  const fetchParents = async () => {
    try {
      const parentsSnapshot = await getDocs(collection(db, "Users", "facility", "userFacility"));
      const fetchedParents = [];
      parentsSnapshot.forEach((doc) => {
        fetchedParents.push(doc.data());
      });
      setParents(fetchedParents);
    } catch (error) {
      console.error("Error fetching parents data:", error);
      setError("Failed to fetch parents data.");
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
            alt="Facility"
            className="facility-img"
            onClick={() => document.getElementById('imageUpload').click()}
            style={{ cursor: 'pointer' }}
            onError={() => setprofileImage('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png')}
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
             <td>{parent.name}</td> {/* Corrected line */}
             <td>{parent.professionals}</td>
             <td>{parent.subscribers}</td>
             <td>{parent.subscribers}</td>
             <td><a href={`/therapist/${index}`}>View</a></td>
           </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
