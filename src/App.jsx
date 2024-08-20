import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './public/LandingPage.jsx';
import AdminLoginPage from './public/AdminLoginPage.jsx';

export default function App() {
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/AdminLoginPage" element={<AdminLoginPage />} />
      </Routes>
    </Router>
  );
}
