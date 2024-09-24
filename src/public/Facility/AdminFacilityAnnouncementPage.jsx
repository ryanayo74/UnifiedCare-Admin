import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, setDoc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../../config/firebase';
import '../../css/AdminFacilityAnnouncementPage.css'; // You can create this file for styling

function AnnouncementsPage() {
    const navigate = useNavigate();
    const [adminEmail, setAdminEmail] = useState('');
    const [facilityName, setFacilityName] = useState('Facility');
    const [facilityImage, setFacilityImage] = useState('https://d1nhio0ox7pgb.cloudfront.net/_img/v_collection_png/512x512/shadow/user_add.png');
    const [facilityAddress, setFacilityAddress] = useState('123 Facility St.');
    const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
    const [error, setError] = useState(null);
    const [currentDocId, setCurrentDocId] = useState(null);
    const [message, setMessage] = useState('');
    const [recipient, setRecipient] = useState({
        all: false,
        therapist: false,
        parents: false,
    });

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

    const handleRecipientChange = (event) => {
        setRecipient({
            ...recipient,
            [event.target.name]: event.target.checked
        });
    };

    const handleSend = () => {
        // Handle sending the announcement here
        console.log("Message:", message);
        console.log("Recipients:", recipient);
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
        <div className="announcements-container">            
            <aside className="sidebar">
                <div className="logo-container">
                    <img src="https://i.ytimg.com/vi/CYcrmsdZuyw/sddefault.jpg" alt="UnifiedCare Logo" className="logo" />
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

            <div className="main-content">

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

                <div className="announcement-box">
                    <h2>Announcements</h2>
                    <textarea
                        className="message-input"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Message"
                    />
                    <div className="checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                name="all"
                                checked={recipient.all}
                                onChange={handleRecipientChange}
                            />
                            All
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                name="therapist"
                                checked={recipient.therapist}
                                onChange={handleRecipientChange}
                            />
                            Therapist
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                name="parents"
                                checked={recipient.parents}
                                onChange={handleRecipientChange}
                            />
                            Parents
                        </label>
                    </div>
                    <button className="send-btn" onClick={handleSend}>Send</button>
                </div>
            </div>

            
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

export default AnnouncementsPage;
