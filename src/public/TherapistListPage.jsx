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
  const [error, setError] = useState(null);
  const [currentDocId, setCurrentDocId] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    if (email) {
      setAdminEmail(email);
      fetchFacilityData(email);
    }
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

  const therapists = [
    { name: 'Sample1', username: 'Therapist1', email: 'email@1', qualification: 'OT1' },
    { name: 'Sample2', username: 'Therapist2', email: 'email@2', qualification: 'OT2' },
    { name: 'Sample3', username: 'Therapist3', email: 'email@3', qualification: 'OT3' },
    { name: 'Sample4', username: 'Therapist4', email: 'email@4', qualification: 'OT4' },
    { name: 'Sample5', username: 'Therapist5', email: 'email@5', qualification: 'OT5' }
  ];

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
          <a href="#" className="menu-item">Therapist</a>
          <a href="#" className="menu-item">Parents</a>
          <a href="#" className="menu-item">Announcements</a>
          <a href="#" className="menu-item">Approval</a>
          <a href="#" className="menu-item" onClick={() => navigate('/FacilityMessagePage')}>Messages</a>
        </nav>
        <div className="logout">
          <a href="#" onClick={handleLogout}>Logout</a>
        </div>
      </aside>
      <main className="main-content">
        <div className="facility-info">
          <img
            src={facilityImage}
            alt="Facility"
            className="facility-img"
            onClick={() => document.getElementById('imageUpload').click()}
            style={{ cursor: 'pointer' }}
            onError={() => setFacilityImage('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png')}
          />
          <input
            type="file"
            id="imageUpload"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
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
              <th>UserName</th>
              <th>Email</th>
              <th>Qualification</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {therapists.map((therapist, index) => (
              <tr key={index}>
                <td>{therapist.name}</td>
                <td>{therapist.username}</td>
                <td>{therapist.email}</td>
                <td>{therapist.qualification}</td>
                <td><a href={`/therapist/${index}`}>View</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
