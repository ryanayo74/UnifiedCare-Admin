import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import LandingPage from './public/LandingPage.jsx';
import AdminLoginPage from './public/AdminLoginPage.jsx';
import ContactUsPage from './public/ContactUsPage';
import ChangePasswordPage from './public/ChangePasswordPage';

import DevelopersDashboardPage from './public/DevelopersDashboardPage.jsx';

import AdminDashboardPage from './public/AdminDashboardPage.jsx';
import FacilityMessagePage from './public/FacilityMessagePage.jsx';

import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/AdminLoginPage" element={<AdminLoginPage />} />
        <Route path="/ChangePasswordPage" element={<ChangePasswordPage />} />
        <Route path="/ContactUsPage" element={<ContactUsPage />} />
        
        
        {/* Protecting FacilityMessagePage */}
        <Route 
          path="/FacilityMessagePage" 
          element={
            <ProtectedRoute>
              <FacilityMessagePage />
            </ProtectedRoute>
          } 
        />

        {/* Protecting AdminDashboardPage */}
        <Route 
          path="/AdminDashboardPage" 
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />

         {/* Protecting DevelopersDashboardPage */}
         <Route 
          path="/DevelopersDashboardPage" 
          element={
            <ProtectedRoute>
              <DevelopersDashboardPage />
            </ProtectedRoute>
          } 
        />
        
      </Routes>
    </Router>
  );
}
