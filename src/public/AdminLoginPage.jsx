import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from "firebase/firestore"; 
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'; // Firebase Auth sign-in and email verification
import { db, auth } from '../config/firebase'; // Firebase Auth and Firestore config
import '../css/AdminLoginPage.css';
import logo from '../assets/loginLogo.png';
import loginImage from '../assets/LoginBackgroundImage.png';
import { ClipLoader } from 'react-spinners';  // Import the spinner

function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // State to handle loading screen
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [verificationSent, setVerificationSent] = useState(false); // Track if verification email was sent
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Start loading spinner
    let userAuthenticated = false; // Track if any user has been authenticated

    try {
      // Step 1: Try signing in with Firebase Auth
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Step 2: Check if the user's email is verified
        if (!user.emailVerified) {
          setLoading(false);
          setError('Please verify your email first.');
          if (!verificationSent) {
            // Send verification email
            await sendEmailVerification(user);
            setVerificationSent(true);
          }
          return;
        }

        const facilityQuery = query(collection(db, "Users", "facility", "userFacility"), where("email", "==", email));
        const facilitySnapshot = await getDocs(facilityQuery);

        facilitySnapshot.forEach((doc) => {
          const facilityData = doc.data();
          if (facilityData.email === email) {
            userAuthenticated = true;
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('adminEmail', email);
            localStorage.setItem('userType', 'AdminFacility');
            setTimeout(() => {
              setLoading(false);
              navigate('/AdminDashboardPage');
            }, 3000);
          }
        });


        if (!userAuthenticated) {
          const newUserQuery = query(collection(db, "Users", "facility", "newUserFacility"), where("email", "==", email));
          const newUserSnapshot = await getDocs(newUserQuery);

          newUserSnapshot.forEach((doc) => {
            const newUserFacilityData = doc.data();
            if (newUserFacilityData.email === email) {
              userAuthenticated = true;
              localStorage.setItem('isAuthenticated', 'true');
              localStorage.setItem('adminEmail', email);
              localStorage.setItem('userType', 'NewUserFacility');
              setTimeout(() => {
                setLoading(false);
                navigate('/ChangePasswordPage');
              }, 3000);
            }
          });
        }
      } catch (authError) {
        setError('Incorrect email or password.');
      }

      // Step 4: Check if user belongs to "adminDevUsers"
      if (!userAuthenticated) {
        const adminDevQuery = query(collection(db, "Users", "adminDev", "AdminDevUsers"), where("email", "==", email));
        const adminDevSnapshot = await getDocs(adminDevQuery);

        adminDevSnapshot.forEach((doc) => {
          const adminDevData = doc.data();
          if (adminDevData.password === password) {
            userAuthenticated = true;
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('adminEmail', email);
            localStorage.setItem('userType', 'AdminDev');
            setTimeout(() => {
              setLoading(false);
              navigate('/DevelopersDashboardPage');
            }, 3000);
          }
        });
      }

      // Step 5: If no user is authenticated, display error message
      if (!userAuthenticated) {
        setError('Incorrect email or password.');
        setLoading(false); // Stop loading spinner if login fails
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError('Failed to log in. Please check your email and password.');
      setLoading(false); // Stop loading spinner on error
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      {loading ? (
        <div className="loading-screen">
          <ClipLoader color={"#123abc"} loading={loading} size={50} /> {/* React Spinner */}
          <p>Loading, please wait...</p> {/* Loading message */}
        </div>
      ) : (
        <>
          <div className="login-form">
            <div className="logo">
              <img src={logo} alt="Logo" />
            </div>
            <h2>Welcome admin!</h2>
            <p>Please enter your details</p>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
              <div className="input-container">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="input-container">
                <label htmlFor="password">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="password-eye" onClick={togglePasswordVisibility}>
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>
              <div className="remember-forgot">
                <label>
                  <input type="checkbox" /> Remember Me
                </label>
                <a href="#" onClick={() => navigate('/ForgotPasswordPage')}>Forgot Password?</a>
              </div>
              <button type="submit" className="login-button">Log In</button>
            </form>
          </div>
          <div className="login-image">
            <img src={loginImage} alt="Login Background" />
          </div>
        </>
      )}
    </div>
  );
}

export default AdminLoginPage;
