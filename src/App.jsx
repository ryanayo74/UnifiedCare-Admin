import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Public Pages
import LandingPage from './public/LandingPage.jsx';
import AdminLoginPage from './public/AdminLoginPage.jsx';
import ContactUsPage from './public/ContactUsPage';
import ChangePasswordPage from './public/ChangePasswordPage';

// Admin Developers Pages
import DevelopersFacilityListPage from './public/DevelopersFacilityListPage.jsx';
import DevelopersDashboardPage from './public/DevelopersDashboardPage.jsx';
import DevelopersApprovalPage from './public/DevelopersApprovalPage.jsx';


// Admin Facility Pages

import AdminDashboardPage from './public/AdminDashboardPage.jsx';
import FacilityMessagePage from './public/FacilityMessagePage.jsx';
import TherapistListPage from './public/TherapistListPage.jsx';
import AdminParentsListPage from './public/AdminParentsListPage.jsx';

// Components
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/AdminLoginPage" element={<AdminLoginPage />} />
        <Route path="/ChangePasswordPage" element={<ChangePasswordPage />} />
        <Route path="/ContactUsPage" element={<ContactUsPage />} />
        
        {/* Protected Routes */}


        {/* Admin Dev Routes */}
        <Route 
          path="/DevelopersFacilityListPage" 
          element={
            <ProtectedRoute>
              <DevelopersFacilityListPage />
            </ProtectedRoute>
          } 
        />

         <Route 
          path="/DevelopersApprovalPage" 
          element={
            <ProtectedRoute>
              <DevelopersApprovalPage />
            </ProtectedRoute>
          } 
        />




        {/* Admin Facility Routes */}
        <Route 
          path="/FacilityMessagePage" 
          element={
            <ProtectedRoute>
              <FacilityMessagePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/AdminDashboardPage" 
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/DevelopersDashboardPage" 
          element={
            <ProtectedRoute>
              <DevelopersDashboardPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/TherapistListPage" 
          element={
            <ProtectedRoute>
              <TherapistListPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/AdminParentsListPage" 
          element={
            <ProtectedRoute>
              <AdminParentsListPage />
            </ProtectedRoute>
          } 
        />

      </Routes>
    </Router>
  );
}
