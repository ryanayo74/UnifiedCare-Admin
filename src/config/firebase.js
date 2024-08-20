// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
    apiKey: "AIzaSyBbsZzTHdgNDGhKpM-UtFDTOWQhJV5Gavk",
    authDomain: "unifiedcare-2ffb0.firebaseapp.com",
    projectId: "unifiedcare-2ffb0",
    storageBucket: "unifiedcare-2ffb0.appspot.com",
    messagingSenderId: "100154524275",
    appId: "1:100154524275:web:4720698c8c496f8588e006",
    measurementId: "G-71MEFNSV2P"
  };


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

